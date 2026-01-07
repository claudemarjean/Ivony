# Module de Tracking Sécurisé - Ivony

## 📋 Vue d'ensemble

Le module `tracking.js` fournit un système complet et sécurisé pour suivre les consultations d'applications dans Ivony. Il gère automatiquement les sessions (utilisateurs authentifiés et visiteurs anonymes) sans exposer de données sensibles côté client.

## ✨ Fonctionnalités

### ✅ Gestion Automatique de Session
- **Utilisateurs authentifiés** : Utilise la session Supabase Auth
- **Visiteurs anonymes** : Génère et stocke un `session_id` unique en localStorage
- Détection automatique du statut d'authentification

### ✅ Collecte de Données Sécurisée
- Adresse IP (via service externe sécurisé)
- Géolocalisation (pays, région, ville)
- Informations appareil (type, navigateur, OS)
- Détection de visite unique

### ✅ Insertion Fiable
- Retry automatique (jusqu'à 3 tentatives)
- Gestion des erreurs réseau
- Respect des règles RLS Supabase
- Support du soft delete (`is_deleted`)

## 🚀 Installation

### 1. Ajouter le script dans votre HTML

```html
<!-- Module de tracking -->
<script src="assets/js/tracking.js"></script>
```

**Important** : Ajoutez ce script APRÈS le chargement de Supabase mais AVANT vos autres scripts.

### 2. Structure de la table `ivony_consultation`

Assurez-vous que votre table Supabase contient les colonnes suivantes :

```sql
CREATE TABLE ivony_consultation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ivony_application(id),
    user_id UUID REFERENCES auth.users(id),
    is_authenticated BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT FALSE,
    session_id TEXT NOT NULL,
    ip_address INET,
    country TEXT,
    region TEXT,
    city TEXT,
    browser TEXT,
    os TEXT,
    device_type TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_consultation_app ON ivony_consultation(application_id);
CREATE INDEX idx_consultation_session ON ivony_consultation(session_id);
CREATE INDEX idx_consultation_deleted ON ivony_consultation(is_deleted);
```

### 3. Configuration des RLS (Row Level Security)

```sql
-- Autoriser l'insertion publique (pour visiteurs anonymes)
CREATE POLICY "Allow public insert" ON ivony_consultation
    FOR INSERT
    WITH CHECK (true);

-- Lecture limitée aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated read" ON ivony_consultation
    FOR SELECT
    USING (auth.role() = 'authenticated');
```

## 📖 Utilisation

### Exemple de base

```javascript
// Après l'initialisation de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Enregistrer une consultation
async function onApplicationView(applicationId) {
    const result = await IvonyTracking.trackConsultation(
        supabaseClient,
        applicationId
    );
    
    if (result.success) {
        console.log('✅ Consultation enregistrée:', result.data);
    } else {
        console.error('❌ Erreur:', result.error);
    }
}

// Exemple d'utilisation
onApplicationView('550e8400-e29b-41d4-a716-446655440000');
```

### Avec métadonnées supplémentaires

```javascript
const result = await IvonyTracking.trackConsultation(
    supabaseClient,
    applicationId,
    {
        metadata: {
            referrer: document.referrer,
            campaign: 'summer_2024'
        }
    }
);
```

### Dans une page publique (sans authentification)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mon Application</title>
    <script src="assets/libs/supabase.js"></script>
    <script src="assets/js/tracking.js"></script>
</head>
<body>
    <h1>Bienvenue sur mon application</h1>
    
    <script>
        // Configuration
        const SUPABASE_URL = 'https://votre-projet.supabase.co';
        const SUPABASE_ANON_KEY = 'votre_cle_publique';
        const APPLICATION_ID = 'uuid-de-votre-app';
        
        // Initialiser Supabase
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Tracker la visite
        window.addEventListener('DOMContentLoaded', async () => {
            await IvonyTracking.trackConsultation(supabaseClient, APPLICATION_ID);
        });
    </script>
</body>
</html>
```

## 🔧 API du Module

### `trackConsultation(supabase, applicationId, options)`

Fonction principale pour enregistrer une consultation.

**Paramètres :**
- `supabase` (Object) - Instance du client Supabase
- `applicationId` (String) - UUID de l'application
- `options` (Object) - Options supplémentaires (optionnel)
  - `metadata` (Object) - Données supplémentaires à stocker

**Retour :**
```javascript
{
    success: true,
    data: {
        id: "uuid",
        application_id: "uuid",
        user_id: "uuid" | null,
        is_authenticated: true | false,
        is_unique: true | false,
        session_id: "string",
        ip_address: "192.168.1.1" | null,
        country: "France" | null,
        region: "Île-de-France" | null,
        city: "Paris" | null,
        browser: "Chrome",
        os: "Windows",
        device_type: "desktop",
        visited_at: "2024-01-07T10:30:00Z",
        is_deleted: false
    },
    error: null
}
```

### Fonctions utilitaires

#### `getOrCreateAnonymousSessionId()`
Récupère ou crée un session_id pour visiteur anonyme.

```javascript
const sessionId = IvonyTracking.getOrCreateAnonymousSessionId();
console.log('Session ID:', sessionId);
```

#### `checkAuthentication(supabase)`
Vérifie le statut d'authentification.

```javascript
const authInfo = await IvonyTracking.checkAuthentication(supabaseClient);
console.log('Authentifié:', authInfo.is_authenticated);
console.log('User ID:', authInfo.user_id);
```

#### `getClientIP()`
Récupère l'adresse IP du client.

```javascript
const ip = await IvonyTracking.getClientIP();
console.log('IP:', ip);
```

#### `getGeoLocation(ipAddress)`
Récupère les informations géographiques.

```javascript
const geo = await IvonyTracking.getGeoLocation('8.8.8.8');
console.log('Pays:', geo.country);
console.log('Ville:', geo.city);
```

#### `getDeviceInfo()`
Récupère les informations sur l'appareil.

```javascript
const device = IvonyTracking.getDeviceInfo();
console.log('Navigateur:', device.browser);
console.log('OS:', device.os);
console.log('Type:', device.device_type);
```

## 🔒 Sécurité

### ✅ Ce qui est sécurisé

1. **Pas de clé secrète** : Utilise uniquement la clé publique Supabase
2. **RLS activé** : Respect des règles de sécurité Supabase
3. **Pas de lecture publique** : Les consultations ne peuvent être lues que par les utilisateurs authentifiés
4. **Soft delete** : Utilise `is_deleted` au lieu de suppressions physiques
5. **Session anonyme** : UUID généré côté client, pas de données personnelles

### ⚠️ Points d'attention

1. **Service IP externe** : Dépend de `api.ipify.org` et `ipapi.co` (peuvent échouer)
2. **localStorage** : Nécessaire pour la persistance du session_id
3. **CORS** : Les services IP doivent autoriser votre domaine

## 🐛 Gestion des erreurs

Le module gère automatiquement :
- Échecs de récupération d'IP (continue sans IP)
- Erreurs de géolocalisation (continue sans géo)
- Échecs d'insertion (retry automatique 3 fois)
- localStorage indisponible (fallback en mémoire)

```javascript
const result = await IvonyTracking.trackConsultation(supabaseClient, appId);

if (!result.success) {
    console.error('Erreur de tracking:', result.error);
    // L'application continue de fonctionner
}
```

## 📊 Exemple de requête pour récupérer les statistiques

```javascript
// Récupérer toutes les consultations non supprimées d'une app
const { data, error } = await supabaseClient
    .from('ivony_consultation')
    .select('*')
    .eq('application_id', applicationId)
    .eq('is_deleted', false)
    .order('visited_at', { ascending: false });

// Compter les visites uniques
const { count } = await supabaseClient
    .from('ivony_consultation')
    .select('*', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .eq('is_unique', true)
    .eq('is_deleted', false);
```

## 🎯 Cas d'usage

### 1. Page publique d'application
```javascript
// Dans votre page publique
window.addEventListener('load', async () => {
    await IvonyTracking.trackConsultation(supabaseClient, APPLICATION_ID);
});
```

### 2. SPA (Single Page Application)
```javascript
// À chaque changement de route
router.afterEach(async (to) => {
    if (to.meta.appId) {
        await IvonyTracking.trackConsultation(supabaseClient, to.meta.appId);
    }
});
```

### 3. Application React
```javascript
useEffect(() => {
    const trackVisit = async () => {
        await IvonyTracking.trackConsultation(supabaseClient, appId);
    };
    
    trackVisit();
}, [appId]);
```

## 📝 Notes importantes

1. **Appel unique** : Appelez `trackConsultation()` une seule fois par visite
2. **Async/Await** : Toujours utiliser avec `await` ou `.then()`
3. **Performance** : L'appel est non-bloquant, n'affecte pas le chargement de la page
4. **Privacy** : Respecte le RGPD (pas de données personnelles sans consentement)

## 🔄 Mise à jour

Pour mettre à jour le module, remplacez simplement le fichier `tracking.js`. Aucune configuration supplémentaire n'est nécessaire.

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans la console du navigateur
2. Assurez-vous que Supabase est correctement configuré
3. Vérifiez les règles RLS de votre table
4. Testez avec un utilisateur authentifié et un visiteur anonyme

## 📄 Licence

Module propriétaire Ivony - Tous droits réservés

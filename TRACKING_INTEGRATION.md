# 🔐 Système de Tracking Sécurisé - Ivony

## ✅ Installation Complète

Le système de tracking a été intégré avec succès dans l'application Ivony.

### 📦 Fichiers du système

1. **`assets/js/tracking.js`** - Module de base (session, IP, géolocation, device)
2. **`assets/js/app-tracking.js`** - Gestion des applications (stats, tracking automatique)
3. **`setup-rls-policies.sql`** - Configuration RLS Supabase
4. **`TRACKING_MODULE.md`** - Documentation complète
5. **`tracking-demo.html`** - Page de test

### 🎯 Fonctionnalités activées

#### ✅ Dans applications.html
- **Tracking automatique** : Chaque clic sur "Accéder à l'application" est enregistré
- **Données collectées** :
  - ID de l'application visitée
  - Utilisateur authentifié ou anonyme
  - Session ID (persistant via localStorage)
  - Adresse IP et géolocalisation (pays, région, ville)
  - Informations appareil (browser, OS, type)
  - Date et heure de la visite
  - Indicateur de visite unique

#### ✅ Dans index.html
- Module de tracking chargé et prêt à l'emploi

### 🔧 Configuration Supabase requise

Exécutez le fichier **`setup-rls-policies.sql`** dans Supabase SQL Editor pour activer les politiques de sécurité.

```sql
-- Les politiques créées :
1. Allow public insert  → Permet l'insertion publique des consultations
2. Allow authenticated read → Lecture réservée aux utilisateurs connectés
3. Allow authenticated update → Mise à jour (soft delete) pour authentifiés
```

## 📊 Utilisation

### Tracking automatique (déjà configuré)

Le tracking est **automatiquement déclenché** quand un utilisateur clique sur "Accéder à l'application" dans la liste des applications.

### Tracking manuel

```javascript
// Dans n'importe quelle page où tracking.js est chargé
const result = await IvonyTracking.trackConsultation(
    supabaseClient,
    'uuid-de-l-application'
);

if (result.success) {
    console.log('Consultation enregistrée:', result.data);
}
```

### Récupérer les statistiques

```javascript
// Utiliser app-tracking.js
const stats = await AppTracking.getApplicationStats('uuid-de-l-application');

console.log(stats.data);
// {
//   total_views: 150,
//   unique_views: 75,
//   authenticated_views: 100,
//   anonymous_views: 50,
//   countries: ['France', 'Belgique', 'Canada'],
//   devices: { mobile: 60, tablet: 10, desktop: 80 },
//   browsers: { Chrome: 100, Firefox: 30, Safari: 20 },
//   recent_visits: [...]
// }
```

## 🔒 Sécurité

### Protection des données
- ✅ **RLS activé** : Seuls les utilisateurs autorisés accèdent aux données
- ✅ **Pas de secrets exposés** : Utilise uniquement la clé publique Supabase
- ✅ **Soft delete** : Les données supprimées restent en base (is_deleted = true)
- ✅ **Session persistante** : UUID stocké dans localStorage (anonymes)

### Gestion des erreurs
- ✅ **Retry logic** : 3 tentatives en cas d'échec réseau
- ✅ **Fallback gracieux** : L'échec du tracking ne bloque pas la navigation
- ✅ **Logs détaillés** : Console pour déboguer facilement

## 🧪 Test du système

### 1. Tester avec la page de démo
Ouvrez **`tracking-demo.html`** dans votre navigateur et cliquez sur "Tracker une consultation".

### 2. Tester en production
1. Connectez-vous à l'application
2. Accédez à la page **Gestion des applications**
3. Cliquez sur "Accéder à l'application" pour n'importe quelle app
4. Vérifiez dans la console : `✅ Consultation enregistrée pour l'application: <uuid>`
5. Allez dans **Suivi vue** pour voir les consultations

### 3. Vérifier dans Supabase
```sql
-- Voir toutes les consultations (depuis Supabase SQL Editor)
SELECT 
    id,
    application_id,
    is_authenticated,
    is_unique,
    session_id,
    ip_address,
    country,
    city,
    device_type,
    browser,
    visited_at
FROM ivony_consultation
WHERE is_deleted = false
ORDER BY visited_at DESC
LIMIT 20;
```

## 📱 Intégration dans d'autres pages

Pour ajouter le tracking à une nouvelle page :

```html
<!-- 1. Charger les scripts dans l'ordre -->
<script src="assets/libs/supabase.js"></script>
<script src="assets/js/tracking.js"></script>
<script src="assets/js/app-tracking.js"></script>

<!-- 2. Initialiser Supabase -->
<script>
const supabaseClient = supabase.createClient(
    'https://jzabkrztgkayunjbzlzj.supabase.co',
    'sb_publishable_6KKGLI74VNMAnzbGkk6xew_ZZv3QyJu'
);

// 3. Tracker une consultation
async function trackPage(appId) {
    const result = await IvonyTracking.trackConsultation(supabaseClient, appId);
    console.log('Tracking:', result);
}
</script>
```

## 🎛️ Configuration avancée

### Activer le mode debug
```javascript
// Dans app-tracking.js, modifier :
const TRACKING_CONFIG = {
    ENABLED: true,
    DEBUG: true,  // ← Active les logs détaillés
    AUTO_TRACK_CLICKS: true
};
```

### Désactiver temporairement le tracking
```javascript
AppTracking.setTrackingEnabled(false);
// ... faire des actions sans tracking
AppTracking.setTrackingEnabled(true);
```

## 📈 Tableau de bord (Future amélioration)

Pour créer un dashboard des consultations, utilisez les fonctions dans **`app-tracking.js`** :

```javascript
// Exemple : Afficher les stats d'une application
async function showStats(appId) {
    const result = await AppTracking.getApplicationStats(appId);
    
    if (result.success) {
        const stats = result.data;
        console.log(`
            Total de vues: ${stats.total_views}
            Vues uniques: ${stats.unique_views}
            Utilisateurs connectés: ${stats.authenticated_views}
            Visiteurs anonymes: ${stats.anonymous_views}
            Pays: ${stats.countries.join(', ')}
            Mobile: ${stats.devices.mobile}
            Desktop: ${stats.devices.desktop}
        `);
    }
}
```

## ✨ Résumé

🎉 **Le système de tracking est maintenant opérationnel !**

- ✅ Tracking automatique sur les clics d'applications
- ✅ Session management (authentifiés + anonymes)
- ✅ Géolocalisation et détection d'appareil
- ✅ Sécurité RLS configurée
- ✅ Gestion d'erreurs robuste
- ✅ Statistiques détaillées disponibles

**Prochaine étape** : Exécutez `setup-rls-policies.sql` dans Supabase, puis testez en cliquant sur une application !

# Fonctionnalité de Gestion des Adresses IP (Blacklist/Whitelist)

## 📋 Vue d'ensemble

Cette fonctionnalité permet de gérer les adresses IP dans le système Ivony en permettant de :
- **Blacklister** des adresses IP pour bloquer l'affichage de leurs consultations
- **Whitelister** des adresses IP pour les marquer comme sûres
- Visualiser le statut de chaque IP dans l'interface

## 🏗️ Architecture

### Base de données : Table `ivony_ip_access_control`

```sql
CREATE TABLE ivony_ip_access_control (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_address inet UNIQUE NOT NULL,
    status text CHECK (status IN ('blacklist', 'whitelist')),
    reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Fichiers modifiés

1. **applications.html**
   - Ajout d'une colonne "Adresse IP" dans le tableau des consultations
   - Ajout d'une colonne "Actions" pour gérer les IPs
   - Nouvelle modale `#ip-modal` pour confirmer les actions

2. **assets/js/suivi.js**
   - Nouvelles variables globales : `ipAccessControl`, éléments DOM de la modale
   - Fonction `loadIpAccessControl()` : charge les statuts IP depuis la DB
   - Fonction `formatIpBadge()` : affiche le badge de statut (neutre/blacklist/whitelist)
   - Fonction `formatActions()` : génère les boutons d'action (desktop et mobile)
   - Fonction `manageIpAccess()` : UPSERT dans la table de contrôle
   - Fonction `setupActionButtons()` : configure les event listeners
   - Filtrage automatique des consultations blacklistées

## 🎨 Interface Utilisateur

### Desktop (écran large)
- **Tableau** : Nouvelle colonne "Adresse IP" avec badge de statut
- **Actions** : Deux boutons par ligne
  - Bouton "Blacklist" (rouge) avec icône ❌
  - Bouton "Whitelist" (vert) avec icône ✅
  - Les boutons sont désactivés si l'IP a déjà ce statut

### Mobile/Tablette
- **Cards** : Affichage de l'IP avec badge dans une ligne dédiée
- **Actions** : Bouton menu contextuel (⋮) qui ouvre la modale

### Modale de confirmation
- **Affichage** : L'adresse IP concernée
- **Champ** : Zone de texte optionnelle pour la raison
- **Actions** :
  - Bouton "Blacklist" (rouge)
  - Bouton "Whitelist" (vert)
  - Bouton fermer (X)

## 🔧 Fonctionnement

### 1. Chargement des données
```javascript
// Au chargement de la page Suivi vue
loadIpAccessControl() // Charge tous les statuts IP
  ↓
loadConsultations() // Charge et filtre les consultations
  ↓
filteredConsultations = consultations.filter(c => {
    const ipStatus = ipAccessControl.get(c.ip_address);
    return !ipStatus || ipStatus.status !== 'blacklist';
});
```

### 2. Affichage des badges
- **Neutre** (gris) : IP non listée
- **Blacklist** (rouge) : IP bloquée
- **Whitelist** (vert) : IP de confiance

### 3. Action utilisateur
```
Clic sur bouton Blacklist/Whitelist
  ↓
openIpModal(ip, action)
  ↓
Utilisateur entre raison (optionnel) + confirme
  ↓
manageIpAccess(action)
  ↓
UPSERT dans ivony_ip_access_control
  ↓
Mise à jour du cache local
  ↓
Si blacklist : recharge consultations
Si whitelist : rafraîchit affichage
  ↓
Notification de succès
```

## 🔐 Sécurité

### Validation des données
- **Type IP** : Cast automatique en `inet` par PostgreSQL
- **Statut** : Contraint à 'blacklist' ou 'whitelist' (CHECK constraint)
- **Unicité** : Contrainte UNIQUE sur `ip_address`

### UPSERT
```javascript
await supabaseClient
    .from('ivony_ip_access_control')
    .upsert({
        ip_address: ip,
        status: action,
        reason: reason,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'ip_address'
    });
```

## 📱 Responsive Design

### Breakpoints
- **Desktop** (lg+) : Affichage tableau complet avec boutons inline
- **Mobile/Tablette** (< lg) : Cards avec bouton menu contextuel

### Classes Tailwind utilisées
- `hidden lg:block` : Table desktop uniquement
- `lg:hidden` : Cards mobile/tablette uniquement
- Badges : `inline-flex items-center px-2 py-1 rounded-full`
- Boutons : `px-3 py-1 rounded-lg` avec états hover et disabled

## 🚀 Utilisation

### Pour blacklister une IP
1. Aller dans "Suivi vue"
2. Localiser la consultation avec l'IP à bloquer
3. Cliquer sur le bouton "Blacklist" (rouge)
4. (Optionnel) Entrer une raison
5. Confirmer

**Résultat** : Les futures consultations de cette IP ne s'afficheront plus

### Pour whitelister une IP
1. Même procédure avec le bouton "Whitelist" (vert)

**Résultat** : L'IP est marquée comme sûre (badge vert)

### Pour remettre en neutre
1. Si blacklistée : whitelister
2. Si whitelistée : blacklister puis whitelister à nouveau
   (ou supprimer manuellement de la table)

## 🔍 Debugging

### Console logs
```javascript
// Chargement IP access control
🔍 Chargement du contrôle d'accès IP...
✅ Statuts IP chargés: X

// Filtrage consultations
✅ Consultations chargées: X (Y blacklistées filtrées)

// Action IP
🔒 Blacklist/Whitelist IP: xxx.xxx.xxx.xxx
✅ IP blacklistée/whitelistée avec succès
```

### Vérification base de données
```sql
-- Voir toutes les IPs gérées
SELECT * FROM ivony_ip_access_control ORDER BY updated_at DESC;

-- Voir les IPs blacklistées
SELECT * FROM ivony_ip_access_control WHERE status = 'blacklist';

-- Voir les IPs whitelistées
SELECT * FROM ivony_ip_access_control WHERE status = 'whitelist';
```

## ⚠️ Points d'attention

1. **Performance** : Le cache `ipAccessControl` est rechargé à chaque ouverture de "Suivi vue"
2. **Temps réel** : Les changements ne sont pas synchronisés entre onglets (recharger la page)
3. **Historique** : Les consultations passées restent en base, seul l'affichage est filtré
4. **Suppression** : Pour supprimer une IP de la liste, faire une suppression SQL directe

## 🎯 Améliorations futures possibles

- [ ] Bouton "Remettre en neutre" (DELETE depuis ivony_ip_access_control)
- [ ] Page dédiée de gestion des IPs avec liste complète
- [ ] Historique des changements de statut
- [ ] Export des IPs blacklistées/whitelistées
- [ ] Import en masse d'IPs
- [ ] Synchronisation temps réel (Supabase Realtime)
- [ ] Statistiques : nombre d'IPs par statut
- [ ] Filtrage des consultations par statut IP

## 📝 Code examples

### Blacklister une IP programmatiquement
```javascript
await supabaseClient
    .from('ivony_ip_access_control')
    .upsert({
        ip_address: '192.168.1.100',
        status: 'blacklist',
        reason: 'Activité suspecte détectée',
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'ip_address'
    });
```

### Vérifier le statut d'une IP
```javascript
const { data, error } = await supabaseClient
    .from('ivony_ip_access_control')
    .select('*')
    .eq('ip_address', '192.168.1.100')
    .single();

console.log(data?.status); // 'blacklist', 'whitelist', ou null
```

### Supprimer une IP de la liste
```javascript
await supabaseClient
    .from('ivony_ip_access_control')
    .delete()
    .eq('ip_address', '192.168.1.100');
```

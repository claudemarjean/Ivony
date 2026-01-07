# ✅ Checklist de Tests - Fonctionnalité Blacklist/Whitelist IP

## 🎯 Tests Fonctionnels

### 1. Base de données

- [ ] **Table créée**
  ```sql
  SELECT COUNT(*) FROM ivony_ip_access_control;
  -- Doit retourner 0 (ou plus si données de test)
  ```

- [ ] **Contrainte UNIQUE**
  ```sql
  INSERT INTO ivony_ip_access_control (ip_address, status) VALUES ('192.168.1.1', 'blacklist');
  INSERT INTO ivony_ip_access_control (ip_address, status) VALUES ('192.168.1.1', 'whitelist');
  -- La 2e insertion doit échouer avec erreur "duplicate key"
  ```

- [ ] **Contrainte CHECK**
  ```sql
  INSERT INTO ivony_ip_access_control (ip_address, status) VALUES ('192.168.1.2', 'invalid');
  -- Doit échouer avec erreur check constraint
  ```

- [ ] **Index créés**
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'ivony_ip_access_control';
  -- Doit retourner: idx_ip_access_control_ip, idx_ip_access_control_status
  ```

- [ ] **Trigger updated_at**
  ```sql
  INSERT INTO ivony_ip_access_control (ip_address, status) VALUES ('192.168.1.3', 'blacklist');
  SELECT created_at, updated_at FROM ivony_ip_access_control WHERE ip_address = '192.168.1.3';
  -- created_at et updated_at doivent être identiques
  
  UPDATE ivony_ip_access_control SET status = 'whitelist' WHERE ip_address = '192.168.1.3';
  SELECT created_at, updated_at FROM ivony_ip_access_control WHERE ip_address = '192.168.1.3';
  -- updated_at doit être > created_at
  ```

### 2. Interface Desktop (≥1024px)

- [ ] **Colonne IP visible**
  - Ouvrir "Suivi vue"
  - Vérifier présence colonne "Adresse IP"
  - Vérifier affichage des IPs en format `xxx.xxx.xxx.xxx`

- [ ] **Colonne Actions visible**
  - Vérifier présence colonne "Actions"
  - Vérifier 2 boutons par ligne : "Blacklist" et "Whitelist"

- [ ] **Badges de statut**
  - IP non listée → Badge gris "Neutre"
  - IP blacklistée → Badge rouge "Blacklist"
  - IP whitelistée → Badge vert "Whitelist"

- [ ] **Boutons Blacklist**
  - Couleur rouge ✅
  - Icône ❌ visible
  - Hover : couleur plus claire
  - Désactivé si déjà blacklisté (grisé + cursor-not-allowed)

- [ ] **Boutons Whitelist**
  - Couleur verte ✅
  - Icône ✅ visible
  - Hover : couleur plus claire
  - Désactivé si déjà whitelisté (grisé + cursor-not-allowed)

### 3. Interface Mobile (<1024px)

- [ ] **Cards affichées**
  - Table masquée
  - Cards visibles
  - Chaque card affiche bien l'IP

- [ ] **Ligne IP dans card**
  - "Adresse IP" en label
  - IP affichée en font-mono
  - Badge de statut présent

- [ ] **Bouton menu (⋮)**
  - Bouton visible en haut à droite de la card
  - Au clic → modale s'ouvre
  - Icône verticale à 3 points

### 4. Modale de confirmation

- [ ] **Ouverture**
  - Clic sur bouton Blacklist → modale s'ouvre
  - Clic sur bouton Whitelist → modale s'ouvre
  - Clic sur menu mobile → modale s'ouvre

- [ ] **Contenu**
  - Titre : "Gérer l'adresse IP"
  - IP affichée correctement
  - Champ "Raison" présent et vide
  - 2 boutons : "Blacklist" (rouge) et "Whitelist" (vert)

- [ ] **Fermeture**
  - Clic sur X → modale se ferme
  - Clic en dehors → modale se ferme
  - Après confirmation → modale se ferme

- [ ] **Placeholder**
  - Champ raison : "Pourquoi gérer cette IP ?"

### 5. Actions Blacklist

- [ ] **Blacklist sans raison**
  - Ouvrir modale pour IP "neutre"
  - Ne pas entrer de raison
  - Cliquer "Blacklist"
  - ✅ Notification succès
  - ✅ Badge passe à "Blacklist" (rouge)
  - ✅ Bouton "Blacklist" désactivé
  - ✅ Vérifier en DB : `reason` = NULL

- [ ] **Blacklist avec raison**
  - Ouvrir modale
  - Entrer raison : "Test de blacklist"
  - Cliquer "Blacklist"
  - ✅ Notification succès
  - ✅ Vérifier en DB : `reason` = "Test de blacklist"

- [ ] **Filtrage des consultations**
  - Noter le nombre de consultations avant blacklist
  - Blacklister une IP présente dans les consultations
  - Recharger la page
  - ✅ Nombre de consultations a diminué
  - ✅ Consultations de cette IP n'apparaissent plus

- [ ] **Re-blacklist**
  - Essayer de blacklister une IP déjà blacklistée
  - ✅ Bouton désactivé (ne devrait pas être cliquable)

### 6. Actions Whitelist

- [ ] **Whitelist sans raison**
  - Ouvrir modale pour IP "neutre" ou "blacklist"
  - Cliquer "Whitelist"
  - ✅ Notification succès
  - ✅ Badge passe à "Whitelist" (vert)
  - ✅ Bouton "Whitelist" désactivé

- [ ] **Whitelist avec raison**
  - Entrer raison : "IP de confiance"
  - Cliquer "Whitelist"
  - ✅ Vérifier en DB : `reason` = "IP de confiance"

- [ ] **Dé-blacklist**
  - Blacklister une IP
  - Whitelister la même IP
  - ✅ Badge passe de rouge à vert
  - ✅ Consultations réapparaissent après rechargement

- [ ] **Re-whitelist**
  - Essayer de whitelister une IP déjà whitelistée
  - ✅ Bouton désactivé

### 7. Cache et synchronisation

- [ ] **Cache initial**
  - Ajouter une IP en blacklist via SQL
  - Ouvrir "Suivi vue"
  - ✅ Badge "Blacklist" immédiatement visible

- [ ] **Mise à jour cache après action**
  - Blacklister une IP
  - Vérifier immédiatement le badge
  - ✅ Badge change sans rechargement de page

- [ ] **Actualisation automatique**
  - Blacklister une IP
  - ✅ Liste des consultations se met à jour automatiquement
  - ✅ Consultations de l'IP disparaissent

### 8. Notifications

- [ ] **Notification blacklist**
  - Blacklister une IP
  - ✅ Notification verte "L'adresse IP xxx.xxx.xxx.xxx a été blacklistée"
  - ✅ Notification disparaît après 3-5 secondes

- [ ] **Notification whitelist**
  - Whitelister une IP
  - ✅ Notification verte "L'adresse IP xxx.xxx.xxx.xxx a été whitelistée"

- [ ] **Notification erreur**
  - Simuler erreur (déconnecter Supabase)
  - Essayer de blacklister
  - ✅ Notification rouge "Erreur lors de la gestion de l'IP"

### 9. Performances

- [ ] **Chargement initial**
  - Ouvrir "Suivi vue" avec 100+ consultations
  - ✅ Page charge en < 2 secondes
  - ✅ Badges affichés pour toutes les IPs

- [ ] **Action rapide**
  - Blacklister une IP
  - ✅ Réponse en < 1 seconde
  - ✅ Pas de freeze de l'interface

- [ ] **Filtrage rapide**
  - Blacklister plusieurs IPs (5+)
  - Recharger
  - ✅ Filtrage instantané
  - ✅ Consultations correctement exclues

### 10. Edge cases

- [ ] **IP NULL ou vide**
  - Consultation sans IP (NULL)
  - ✅ Pas de badge affiché
  - ✅ "N/A" dans la colonne IP
  - ✅ Pas de boutons d'action

- [ ] **IP invalide**
  - Essayer de blacklister "abc.def.ghi.jkl"
  - ✅ PostgreSQL rejette (erreur inet)
  - ✅ Notification d'erreur affichée

- [ ] **Raison très longue**
  - Entrer 500 caractères dans le champ raison
  - ✅ Accepté sans erreur
  - ✅ Sauvegardé correctement en DB

- [ ] **IP v6**
  - Consultation avec IPv6 (ex: `2001:0db8::1`)
  - ✅ Affichée correctement
  - ✅ Peut être blacklistée/whitelistée

- [ ] **Caractères spéciaux dans raison**
  - Raison : `Test "avec" <guillemets> & symboles`
  - ✅ Pas d'injection SQL
  - ✅ Caractères échappés correctement

### 11. Responsive

- [ ] **Desktop → Mobile**
  - Redimensionner fenêtre de desktop à mobile
  - ✅ Table disparaît
  - ✅ Cards apparaissent
  - ✅ Boutons s'adaptent

- [ ] **Mobile → Desktop**
  - Redimensionner de mobile à desktop
  - ✅ Cards disparaissent
  - ✅ Table apparaît
  - ✅ Tous les éléments bien alignés

- [ ] **Tablette (768-1023px)**
  - Tester sur taille tablette
  - ✅ Cards affichées
  - ✅ Menu contextuel fonctionnel

### 12. Intégration

- [ ] **Pas de conflit avec autres modales**
  - Ouvrir modale Application
  - Fermer
  - Ouvrir modale IP
  - ✅ Pas d'interférence

- [ ] **Filtres conservés**
  - Appliquer des filtres (app, période, etc.)
  - Blacklister une IP
  - ✅ Filtres toujours actifs
  - ✅ Consultations filtrées correctement

- [ ] **KPIs mis à jour**
  - Noter les KPIs avant blacklist
  - Blacklister une IP avec plusieurs consultations
  - Recharger
  - ✅ KPIs ajustés (total, unique, etc.)

### 13. Sécurité

- [ ] **Authentification**
  - Se déconnecter
  - Essayer d'accéder à "Suivi vue"
  - ✅ Redirection vers login

- [ ] **Permissions Supabase**
  - Vérifier RLS activé (si configuré)
  - ✅ Utilisateurs non-auth ne peuvent pas lire/écrire

- [ ] **Validation IP**
  - Essayer d'insérer IP invalide via console
  - ✅ PostgreSQL rejette

- [ ] **XSS**
  - Raison : `<script>alert('XSS')</script>`
  - ✅ Script non exécuté
  - ✅ Caractères échappés dans l'affichage

### 14. Logs et debugging

- [ ] **Console logs**
  - Ouvrir console (F12)
  - Blacklister une IP
  - ✅ Logs clairs et informatifs :
    ```
    🔒 Blacklist IP: 192.168.1.100
    ✅ IP blacklistée avec succès
    ```

- [ ] **Erreurs tracées**
  - Provoquer erreur (déco Supabase)
  - ✅ Erreur loggée dans console
  - ✅ Message d'erreur utilisateur compréhensible

### 15. Multi-onglets

- [ ] **Onglet 1 : Blacklist**
  - Onglet 1 : Blacklister une IP
  - ✅ Badge change dans onglet 1

- [ ] **Onglet 2 : Voir changement**
  - Onglet 2 : Recharger "Suivi vue"
  - ✅ Badge "Blacklist" visible
  - ✅ Consultations filtrées

## 🎯 Tests de régression

- [ ] **Applications fonctionnent toujours**
  - Créer/modifier/supprimer une application
  - ✅ Aucun impact

- [ ] **Onglet Utilisateurs OK**
  - Basculer vers "Utilisateurs"
  - ✅ Pas d'erreur console

- [ ] **Logout/Login**
  - Se déconnecter
  - Se reconnecter
  - Aller dans "Suivi vue"
  - ✅ Tout fonctionne normalement

## 📊 Résumé des tests

```
Total tests : 70+
Tests passés : __/70
Tests échoués : __/70
Taux de réussite : __%
```

## ⚠️ Bugs connus

Liste des bugs à corriger :
1. 
2. 
3. 

## ✅ Validation finale

- [ ] Tous les tests fonctionnels passés
- [ ] Aucune erreur dans la console
- [ ] Performance acceptable (< 2s chargement)
- [ ] Responsive vérifié (mobile + desktop)
- [ ] Documentation à jour
- [ ] Code commenté et propre
- [ ] Base de données configurée
- [ ] RLS activé et testé (si applicable)

---

**Date des tests** : _______________  
**Testeur** : _______________  
**Version** : 1.0.0  
**Environnement** : Production / Staging / Dev  

**Validation** : ✅ Prêt pour production / ⚠️ Corrections nécessaires

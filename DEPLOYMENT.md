# 🚀 Guide de Déploiement Sécurisé - Ivony

## 📋 Prérequis

- ✅ Compte Supabase configuré
- ✅ RLS activé sur toutes les tables
- ✅ Politiques de sécurité créées (voir `setup-rls-policies.sql`)

## 🌐 Options de déploiement

### Option 1 : Netlify (Recommandé) ⭐

#### Étapes

1. **Créer un compte** : [https://netlify.com](https://netlify.com)

2. **Déployer via Git** :
   ```bash
   # Connecter votre repo GitHub/GitLab
   # Netlify détecte automatiquement les fichiers statiques
   ```

3. **Configuration automatique** :
   - Le fichier `netlify.toml` est déjà configuré
   - Headers de sécurité appliqués automatiquement
   - HTTPS forcé
   - Cache optimisé

4. **Variables d'environnement** (optionnel) :
   - Dans Netlify Dashboard → Site settings → Environment variables
   - Ajouter (même si elles sont publiques, c'est une bonne pratique) :
     ```
     SUPABASE_URL=https://jzabkrztgkayunjbzlzj.supabase.co
     SUPABASE_ANON_KEY=sb_publishable_6KKGLI74VNMAnzbGkk6xew_ZZv3QyJu
     ```

5. **Déploiement** :
   - Push sur la branche `main`
   - Netlify déploie automatiquement
   - URL : `https://your-site.netlify.app`

#### Avantages Netlify
- ✅ HTTPS gratuit
- ✅ CDN global
- ✅ Déploiement automatique
- ✅ Headers de sécurité
- ✅ Rollback facile

---

### Option 2 : Vercel

#### Étapes

1. **Créer un compte** : [https://vercel.com](https://vercel.com)

2. **Déployer** :
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Configuration** :
   - Le fichier `vercel.json` est déjà configuré
   - Headers de sécurité inclus

---

### Option 3 : GitHub Pages

#### Étapes

1. **Activer GitHub Pages** :
   - Settings → Pages
   - Source : `main` branch / `root`

2. **Problème** :
   - ⚠️ Pas de headers de sécurité personnalisés
   - ⚠️ Pas de redirections serveur

3. **Solution** :
   - Utiliser Cloudflare devant GitHub Pages
   - Configurer les headers via Cloudflare Workers

---

### Option 4 : Serveur statique (VPS, etc.)

#### Configuration Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/ivony;
    index index.html;

    # Headers de sécurité
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://jzabkrztgkayunjbzlzj.supabase.co; style-src 'self' 'unsafe-inline'; connect-src 'self' https://jzabkrztgkayunjbzlzj.supabase.co https://api.ipify.org https://ipapi.co; img-src 'self' data: https:;" always;

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Pas de cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "public, no-cache, must-revalidate";
    }

    # Redirection 404 vers index.html
    error_page 404 /index.html;

    # Force HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$host$request_uri;
}
```

---

## 🔒 Checklist de sécurité avant déploiement

### Base de données (Supabase)

- [ ] RLS activé sur **toutes** les tables
- [ ] Politiques testées (utilisateur ne peut voir que ses données)
- [ ] Pas de politiques trop permissives (`WITH CHECK (true)` seulement où nécessaire)
- [ ] Indexes créés pour les performances
- [ ] Backup automatique activé

### Code source

- [ ] Pas de clés secrètes (seulement ANON_KEY publique)
- [ ] Pas de logs sensibles (emails, mots de passe)
- [ ] Pas de `console.log()` avec données sensibles
- [ ] Code validé (pas d'erreurs JavaScript)
- [ ] Dépendances à jour

### Frontend

- [ ] HTTPS forcé (automatique sur Netlify/Vercel)
- [ ] Headers de sécurité configurés
- [ ] Route guards actifs
- [ ] Session monitoring activé
- [ ] Timeout de session configuré
- [ ] Protection brute-force activée

### Tests

- [ ] Login fonctionne
- [ ] Logout fonctionne
- [ ] Session persiste après refresh
- [ ] Redirection automatique (login → dashboard)
- [ ] Protection pages (pas d'accès si déconnecté)
- [ ] Tracking fonctionne
- [ ] Filtres et recherche fonctionnent

---

## 🧪 Test de sécurité post-déploiement

### 1. Test manuel

```bash
# Vérifier les headers
curl -I https://votre-site.netlify.app

# Résultat attendu :
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

### 2. Outils en ligne

- **SSL Labs** : [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)
  - Score attendu : A ou A+

- **Security Headers** : [https://securityheaders.com/](https://securityheaders.com/)
  - Score attendu : A

- **Mozilla Observatory** : [https://observatory.mozilla.org/](https://observatory.mozilla.org/)
  - Score attendu : B+ ou plus

### 3. Tests fonctionnels

1. **Test session** :
   - Se connecter
   - Fermer l'onglet
   - Rouvrir → doit rester connecté
   - Attendre 24h → doit être déconnecté

2. **Test protection** :
   - Taper directement `https://site.com/applications.html` sans être connecté
   - Doit rediriger vers login

3. **Test brute-force** :
   - Essayer de se connecter 5 fois avec mauvais mot de passe
   - Doit bloquer temporairement

4. **Test tracking** :
   - Cliquer sur une application
   - Vérifier dans Supabase → consultation enregistrée

---

## 📊 Monitoring post-déploiement

### Supabase Dashboard

1. **Auth** → Vérifier les utilisateurs actifs
2. **Database** → Vérifier les consultations
3. **Logs** → Surveiller les erreurs

### Analytics (optionnel)

```javascript
// Ajouter Google Analytics ou Plausible
<script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🚨 Procédure d'urgence

### En cas de faille découverte

1. **Révoquer les clés Supabase** :
   - Supabase Dashboard → Settings → API
   - Generate new anon key
   - Mettre à jour dans le code

2. **Forcer la déconnexion** :
   ```sql
   -- Dans Supabase SQL Editor
   DELETE FROM auth.sessions;
   ```

3. **Vérifier les logs** :
   - Supabase Logs
   - Netlify/Vercel Logs

4. **Corriger et redéployer** :
   ```bash
   git commit -m "fix: security patch"
   git push
   # Auto-deploy sur Netlify/Vercel
   ```

---

## 📈 Optimisations futures

### Performance

- [ ] Activer Cloudflare CDN
- [ ] Compresser les images
- [ ] Minifier JS/CSS (build process)
- [ ] Lazy loading des images

### Sécurité avancée

- [ ] Mettre en place rate limiting (Supabase Edge Functions)
- [ ] Ajouter 2FA (Supabase Auth)
- [ ] Logs d'audit détaillés
- [ ] Alertes email sur activités suspectes

### UX

- [ ] PWA (Progressive Web App)
- [ ] Offline mode
- [ ] Notifications push

---

## ✅ Résumé

**Déploiement recommandé** : Netlify (gratuit, simple, sécurisé)

**Fichiers de configuration inclus** :
- ✅ `netlify.toml` → Prêt à déployer
- ✅ `vercel.json` → Alternative Vercel
- ✅ `assets/js/security.js` → Guards & monitoring
- ✅ `setup-rls-policies.sql` → Sécurité Supabase

**Commandes** :
```bash
# 1. Vérifier que tout fonctionne localement
python -m http.server 8000

# 2. Tester les guards
# Ouvrir http://localhost:8000/applications.html sans être connecté
# → Doit rediriger vers index.html

# 3. Push sur GitHub
git add -A
git commit -m "chore: configuration déploiement sécurisé"
git push

# 4. Connecter à Netlify et déployer
```

🎉 **Votre application est prête pour la production !**

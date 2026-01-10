# 🚀 Guide de Déploiement - Ivony

## ✅ Pré-requis

Avant de déployer, assurez-vous que:
- [ ] Le build fonctionne en local (`npm run build`)
- [ ] Le preview est testé (`npm run preview`)
- [ ] Pas d'erreurs dans la console
- [ ] Les URLs propres fonctionnent correctement

## 📦 Option 1: Déploiement sur Netlify

### Via l'Interface Web

1. **Connecter le Repo**
   - Allez sur https://app.netlify.com
   - "New site from Git"
   - Choisissez votre provider (GitHub/GitLab/Bitbucket)
   - Sélectionnez le repo `Ivony`

2. **Configuration Automatique**
   Netlify détecte automatiquement `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: Détectée automatiquement

3. **Déployer**
   - Cliquez sur "Deploy site"
   - Attendez la fin du build (1-2 min)
   - Votre site est en ligne! 🎉

### Via CLI (Optionnel)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build et deploy
npm run build
netlify deploy --prod
```

### URLs Netlify
- **Site URL**: `https://votre-site.netlify.app`
- **Login**: `https://votre-site.netlify.app/`
- **Dashboard**: `https://votre-site.netlify.app/applications`

### Configuration Domaine Personnalisé

1. Dans Netlify Dashboard → Domain settings
2. "Add custom domain"
3. Suivez les instructions DNS
4. SSL automatique activé 🔒

## 📦 Option 2: Déploiement sur Vercel

### Via l'Interface Web

1. **Connecter le Repo**
   - Allez sur https://vercel.com
   - "New Project"
   - "Import Git Repository"
   - Sélectionnez le repo `Ivony`

2. **Configuration Automatique**
   Vercel détecte `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez la fin du build
   - Votre site est en ligne! 🎉

### Via CLI (Optionnel)

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### URLs Vercel
- **Site URL**: `https://votre-site.vercel.app`
- **Login**: `https://votre-site.vercel.app/`
- **Dashboard**: `https://votre-site.vercel.app/applications`

## 📦 Option 3: Autres Hébergeurs

### GitHub Pages

```bash
# Installer gh-pages
npm install --save-dev gh-pages

# Ajouter au package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Déployer
npm run deploy
```

### Serveur Apache

```bash
# Build
npm run build

# Upload dist/ vers le serveur
scp -r dist/* user@server:/var/www/html/

# Ajouter .htaccess pour URLs propres
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^applications$ /applications.html [L]
RewriteRule ^(.*)$ /index.html [L]
```

### Serveur Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/ivony/dist;
    index index.html;

    # URLs propres
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    location /applications {
        try_files /applications.html =404;
    }

    # Cache des assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔄 Déploiement Continu (CI/CD)

### Netlify/Vercel (Automatique)
- Chaque push sur `main` déclenche un build
- Les branches ont des previews automatiques
- Rollback facile en un clic

### Configuration Recommandée

1. **Branch principale**: `main` → Production
2. **Branch de développement**: `dev` → Preview
3. **Pull Requests**: Preview automatique

## 🔒 Variables d'Environnement

### Supabase (Déjà configuré)
Les clés Supabase sont publiques et dans le code:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

⚠️ La sécurité est assurée par RLS (Row Level Security) dans Supabase.

### Ajouter des Variables (si nécessaire)

**Netlify:**
1. Site settings → Environment variables
2. Ajouter les variables
3. Redéployer

**Vercel:**
1. Project settings → Environment Variables
2. Ajouter les variables
3. Redéployer

## 📊 Monitoring Post-Déploiement

### Tests à Effectuer

1. **Fonctionnalité**
   - [ ] Page de login accessible
   - [ ] Connexion fonctionne
   - [ ] Redirection vers dashboard OK
   - [ ] Déconnexion fonctionne

2. **URLs Propres**
   - [ ] `/` → Login
   - [ ] `/applications` → Dashboard
   - [ ] Pas de `.html` visible

3. **Performance**
   - [ ] Lighthouse score > 90
   - [ ] Temps de chargement < 3s
   - [ ] CSS/JS minifiés

4. **Sécurité**
   - [ ] HTTPS activé
   - [ ] Headers de sécurité OK
   - [ ] CSP fonctionnel

### Outils de Monitoring

- **Netlify Analytics**: Inclus
- **Vercel Analytics**: Inclus
- **Google Lighthouse**: Test de performance
- **GTmetrix**: Performance et SEO

## 🐛 Troubleshooting

### Erreur "Module not found"
```bash
npm run clean
npm install
npm run build
```

### URLs avec .html en production
- Vérifiez `netlify.toml` ou `vercel.json`
- Les redirections sont bien configurées
- Redéployez

### Erreur 404 sur /applications
- Vérifiez que `applications.html` est dans `dist/`
- Vérifiez les redirections/rewrites
- Check les logs de build

### CSS non appliqué
- Vérifiez que les fichiers CSS sont dans `dist/assets/`
- Check la console pour erreurs 404
- Vérifiez les chemins dans le HTML

## 📈 Optimisations Post-Déploiement

### Performance
- Activez HTTP/2 (automatique sur Netlify/Vercel)
- Compression Gzip/Brotli (automatique)
- CDN global (automatique)

### SEO
- Ajoutez `robots.txt`
- Ajoutez `sitemap.xml`
- Meta tags OpenGraph

### Analytics
- Google Analytics
- Netlify/Vercel Analytics
- Supabase Analytics

## ✅ Checklist de Déploiement

Avant chaque déploiement:

- [ ] `npm run build` réussit
- [ ] `npm run preview` fonctionne
- [ ] Tests manuels OK
- [ ] Pas d'erreurs console
- [ ] Code commité et pushé
- [ ] Version taggée (optionnel)

## 🎉 C'est Prêt!

Votre application Ivony est maintenant déployée avec:
- ✨ Code optimisé et minifié
- 🚀 Performance maximale
- 🔗 URLs propres
- 🔒 HTTPS et sécurité
- 📊 Analytics et monitoring

**Site de production**: Consultez votre dashboard Netlify/Vercel pour l'URL finale!

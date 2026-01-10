# 🚀 Ivony - Application Web avec Build Vite

Application web moderne avec authentification Supabase, build optimisé avec Vite, et URLs propres.

## ⚡ Démarrage Rapide

```bash
# 1. Installation
npm install

# 2. Développement
npm run dev

# 3. Build de production
npm run build

# 4. Test du build
npm run preview
```

## 📦 Scripts Disponibles

- `npm run dev` - Serveur de développement (http://localhost:3000)
- `npm run build` - Build de production dans `dist/`
- `npm run preview` - Test du build (http://localhost:4173)

## 🌐 URLs

### Développement
- Login: http://localhost:3000/
- Dashboard: http://localhost:3000/applications.html

### Production
- Login: https://votre-site.com/
- Dashboard: https://votre-site.com/applications

*Les URLs propres (sans .html) sont configurées automatiquement pour Netlify et Vercel.*

## 🛠️ Stack Technique

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **CSS Framework**: TailwindCSS (via CDN)
- **Backend**: Supabase
- **Build Tool**: Vite
- **Hébergement**: Netlify / Vercel

## 📁 Structure

```
Ivony/
├── index.html              # Page de login
├── applications.html       # Page dashboard
├── assets/
│   ├── css/               # Styles
│   ├── js/                # Scripts
│   ├── libs/              # Librairies
│   └── img/               # Images
├── dist/                  # Build de production (généré)
├── vite.config.js        # Configuration Vite
├── package.json          # Dépendances
├── netlify.toml         # Config Netlify
└── vercel.json          # Config Vercel
```

## ✨ Fonctionnalités

- ✅ Authentification sécurisée (Supabase)
- ✅ Gestion des applications
- ✅ Thème Dark/Light
- ✅ Tracking des visites
- ✅ URLs propres (sans .html)
- ✅ Build optimisé et minifié
- ✅ Headers de sécurité (CSP, HSTS, etc.)

## 🚀 Déploiement

### Netlify (Recommandé)

1. Push vers GitHub
2. Connecter le repo sur Netlify
3. Deploy automatique!

Configuration automatique via `netlify.toml`

### Vercel

1. Push vers GitHub
2. Connecter le repo sur Vercel
3. Deploy automatique!

Configuration automatique via `vercel.json`

**➡️ Guide complet:** [DEPLOY.md](DEPLOY.md)

## 📚 Documentation

- **[README_BUILD.md](README_BUILD.md)** - Guide de démarrage rapide
- **[BUILD.md](BUILD.md)** - Guide de build détaillé
- **[DEPLOY.md](DEPLOY.md)** - Guide de déploiement
- **[MIGRATION_VITE.md](MIGRATION_VITE.md)** - Détails de la migration Vite
- **[MIGRATION_SUCCESS.md](MIGRATION_SUCCESS.md)** - Résumé de la migration

## 🔒 Sécurité

- Headers de sécurité configurés (CSP, X-Frame-Options, HSTS, etc.)
- HTTPS forcé en production
- Row Level Security (RLS) sur Supabase
- Authentification sécurisée

## ⚡ Performance

Build de production optimisé avec:
- JavaScript minifié (Terser)
- CSS minifié
- Tree-shaking
- Cache busting
- console.log supprimés
- Assets optimisés

## 🆘 Support

### Problèmes Courants

**Erreur de build:**
```bash
npm run clean
npm install
npm run build
```

**URLs avec .html:**
- Vérifiez que vous êtes en production
- Consultez netlify.toml ou vercel.json

**Dépendances manquantes:**
```bash
npm install
```

## 📄 Licence

Ce projet est privé.

## 👤 Auteur

Ivony Team

---

**🎉 Application prête pour la production!**

Consultez [MIGRATION_SUCCESS.md](MIGRATION_SUCCESS.md) pour le résumé complet de la migration vers Vite.

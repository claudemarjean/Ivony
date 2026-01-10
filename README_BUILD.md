# 🚀 Guide de Démarrage Rapide - Ivony

## Installation Initiale

```bash
npm install
```

## Commandes Disponibles

### Mode Développement
```bash
npm run dev
```
- Lance le serveur de développement sur http://localhost:3000
- Hot reload activé (rechargement automatique)
- Source maps pour le debugging

### Build de Production
```bash
npm run build
```
- Crée une version optimisée dans `dist/`
- Minifie JavaScript et CSS
- Supprime les console.log
- Optimise les assets

### Preview du Build
```bash
npm run preview
```
- Lance un serveur local pour tester le build
- Accessible sur http://localhost:4173
- Simule l'environnement de production

### Nettoyage
```bash
npm run clean
```
- Supprime `dist/` et `node_modules/`
- Utile pour repartir de zéro

## Workflow Recommandé

### 1. Développement
```bash
npm run dev
# Développez votre code
# Testez en temps réel sur localhost:3000
```

### 2. Test Avant Déploiement
```bash
npm run build
npm run preview
# Vérifiez sur localhost:4173 que tout fonctionne
```

### 3. Déploiement

#### Netlify
```bash
# Push vers GitHub
git add .
git commit -m "Ready for production"
git push

# Netlify build automatiquement avec:
# - Build command: npm run build
# - Publish directory: dist
```

#### Vercel
```bash
# Push vers GitHub
git add .
git commit -m "Ready for production"
git push

# Vercel build automatiquement
```

## URLs en Production

### Développement (localhost)
- Login: http://localhost:3000/
- Dashboard: http://localhost:3000/applications.html

### Production (déployé)
- Login: https://votre-site.com/
- Dashboard: https://votre-site.com/applications

*Note: Les URLs propres (sans .html) fonctionnent automatiquement en production grâce aux configurations Netlify/Vercel.*

## Troubleshooting

### Le build échoue
```bash
npm run clean
npm install
npm run build
```

### Le preview ne fonctionne pas
```bash
# S'assurer que le build est à jour
npm run build
npm run preview
```

### Erreurs de dépendances
```bash
rm -rf node_modules package-lock.json
npm install
```

## Structure des Fichiers

```
Ivony/
├── index.html              # Page de login
├── applications.html       # Page dashboard
├── assets/                 # Assets sources
│   ├── css/
│   ├── js/
│   ├── libs/
│   └── img/
├── dist/                   # Build de production (généré)
├── vite.config.js         # Configuration Vite
├── package.json           # Dépendances et scripts
├── netlify.toml          # Config Netlify
└── vercel.json           # Config Vercel
```

## Optimisations Actives

✅ Minification JavaScript (Terser)  
✅ Minification CSS  
✅ Suppression des console.log en production  
✅ Tree-shaking (code mort éliminé)  
✅ Cache busting (hash dans les noms de fichiers)  
✅ Assets optimisés  

## Performance

- **Développement**: Hot reload instantané
- **Production**: Fichiers minifiés pour un chargement rapide
- **Cache**: Gestion optimale avec hash de fichiers

## Support

Pour plus de détails, consultez:
- [BUILD.md](BUILD.md) - Guide de build détaillé
- [MIGRATION_VITE.md](MIGRATION_VITE.md) - Documentation de migration

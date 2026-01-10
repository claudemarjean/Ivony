# Ivony - Guide de Build

## Installation

```bash
npm install
```

## Développement

Pour lancer le serveur de développement :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Build de Production

Pour créer une version optimisée pour la production :

```bash
npm run build
```

Les fichiers seront générés dans le dossier `dist/` avec :
- ✅ JavaScript et CSS minifiés
- ✅ Assets optimisés
- ✅ Code mort supprimé (tree-shaking)
- ✅ Console.log supprimés

## Preview de Production

Pour tester la version de production localement :

```bash
npm run preview
```

## URLs Propres (sans .html)

En production, les URLs sont simplifiées :
- `/` → page de connexion
- `/applications` → dashboard

### Netlify

Le fichier `netlify.toml` est configuré pour :
- Builder avec `npm run build`
- Publier le dossier `dist/`
- Gérer les redirections automatiquement

### Vercel

Le fichier `vercel.json` est configuré pour :
- Builder avec `npm run build`
- Publier le dossier `dist/`
- Gérer les rewrites automatiquement

## Structure après Build

```
dist/
├── index.html
├── applications.html
├── assets/
│   ├── index-[hash].js      (minifié)
│   ├── applications-[hash].js (minifié)
│   ├── style-[hash].css     (minifié)
│   └── ...
└── ...
```

## Optimisations Appliquées

1. **Minification** : JavaScript et CSS compressés
2. **Tree-shaking** : Code inutilisé supprimé
3. **Hash de cache** : Noms de fichiers avec hash pour cache-busting
4. **Console cleanup** : console.log supprimés en production
5. **Compression** : Assets optimisés

## Notes

- Les fichiers sources restent dans le dossier racine
- Le dossier `dist/` est créé uniquement lors du build
- Ajoutez `dist/` dans `.gitignore` si pas déjà fait

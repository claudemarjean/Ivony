# 🔗 Guide des URLs Propres (sans .html)

## ✅ Configuration Complète

Votre application est maintenant configurée pour utiliser des **URLs propres** (sans extension .html) partout :
- En développement local (`npm run dev`)
- En preview local (`npm run preview`)  
- En production (Netlify/Vercel)

## 🌐 URLs Disponibles

### URLs Propres (Recommandées) ✅

| Page | URL Propre | Fonctionne |
|------|-----------|------------|
| Login | `/` | ✅ Partout |
| Dashboard | `/applications` | ✅ Partout |

### URLs avec .html (Anciennes) ⚠️

| Page | URL avec .html | Fonctionne |
|------|----------------|------------|
| Login | `/index.html` | ✅ Mais déprécié |
| Dashboard | `/applications.html` | ✅ Mais déprécié |

## 🚀 Utilisation dans le Code

### Recommandé (URLs propres)

```javascript
// Utiliser les routes de config.js
window.location.href = IVONY_CONFIG.ROUTES.LOGIN;        // → '/'
window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;    // → '/applications'

// Ou directement
window.location.href = '/';
window.location.href = '/applications';
```

### À Éviter (URLs avec .html)

```javascript
// ❌ Ne plus utiliser
window.location.href = 'index.html';
window.location.href = 'applications.html';
```

## 🛠️ Comment ça Fonctionne ?

### 1. En Développement (`npm run dev`)

Vite utilise un proxy configuré dans [vite.config.js](vite.config.js):

```javascript
proxy: {
  '^/applications$': {
    target: 'http://localhost:3000',
    rewrite: () => '/applications.html'
  }
}
```

**Résultat** : http://localhost:3000/applications affiche applications.html

### 2. En Preview (`npm run preview`)

Même configuration proxy pour le serveur preview:

```javascript
preview: {
  proxy: {
    '^/applications$': {
      rewrite: () => '/applications.html'
    }
  }
}
```

**Résultat** : http://localhost:4173/applications affiche applications.html

### 3. En Production (Netlify)

Configuration dans [netlify.toml](netlify.toml):

```toml
[[redirects]]
  from = "/applications"
  to = "/applications.html"
  status = 200
```

**Résultat** : https://votre-site.com/applications affiche applications.html

### 4. En Production (Vercel)

Configuration dans [vercel.json](vercel.json):

```json
"rewrites": [
  {
    "source": "/applications",
    "destination": "/applications.html"
  }
]
```

**Résultat** : https://votre-site.com/applications affiche applications.html

## ✨ Avantages des URLs Propres

1. **Plus propre** : `/applications` au lieu de `/applications.html`
2. **SEO friendly** : URLs plus courtes et lisibles
3. **Moderne** : Standard des applications web modernes
4. **Flexible** : Facile de changer l'implémentation backend plus tard
5. **Professionnel** : Apparence plus soignée

## 📝 Exemples Concrets

### Exemple 1 : Redirection après login

```javascript
// ✅ Bon
if (loginSuccess) {
  window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;
  // Redirige vers: /applications
}

// ❌ À éviter
if (loginSuccess) {
  window.location.href = 'applications.html';
  // Redirige vers: /applications.html
}
```

### Exemple 2 : Déconnexion

```javascript
// ✅ Bon
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
  // Redirige vers: /
}

// ❌ À éviter
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
  // Redirige vers: /index.html
}
```

### Exemple 3 : Lien dans le HTML

```html
<!-- ✅ Bon -->
<a href="/applications">Aller au dashboard</a>

<!-- ❌ À éviter -->
<a href="applications.html">Aller au dashboard</a>
```

## 🧪 Tester les URLs Propres

### Test en Développement

```bash
npm run dev
```

Testez:
- http://localhost:3000/ → Devrait afficher la page de login ✅
- http://localhost:3000/applications → Devrait afficher le dashboard ✅

### Test en Preview

```bash
npm run build
npm run preview
```

Testez:
- http://localhost:4173/ → Devrait afficher la page de login ✅
- http://localhost:4173/applications → Devrait afficher le dashboard ✅

### Test en Production

Après déploiement sur Netlify/Vercel:

Testez:
- https://votre-site.com/ → Devrait afficher la page de login ✅
- https://votre-site.com/applications → Devrait afficher le dashboard ✅

## 🔧 Ajouter une Nouvelle Page

Si vous ajoutez une nouvelle page, par exemple `profile.html`:

### 1. Mettre à jour vite.config.js

```javascript
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      applications: resolve(__dirname, 'applications.html'),
      profile: resolve(__dirname, 'profile.html')  // ← Ajouter
    }
  }
},
server: {
  proxy: {
    '^/applications$': { ... },
    '^/profile$': {  // ← Ajouter
      target: 'http://localhost:3000',
      rewrite: () => '/profile.html'
    }
  }
},
preview: {
  proxy: {
    '^/applications$': { ... },
    '^/profile$': {  // ← Ajouter
      target: 'http://localhost:4173',
      rewrite: () => '/profile.html'
    }
  }
}
```

### 2. Mettre à jour config.js

```javascript
ROUTES: {
  LOGIN: '/',
  DASHBOARD: '/applications',
  PROFILE: '/profile'  // ← Ajouter
}
```

### 3. Mettre à jour netlify.toml

```toml
[[redirects]]
  from = "/profile"
  to = "/profile.html"
  status = 200
```

### 4. Mettre à jour vercel.json

```json
"rewrites": [
  { "source": "/applications", "destination": "/applications.html" },
  { "source": "/profile", "destination": "/profile.html" }
]
```

## ⚠️ Important

### Navigation dans le Code

**Toujours utiliser** `IVONY_CONFIG.ROUTES` pour la navigation:

```javascript
// ✅ Recommandé
window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;

// ✅ Acceptable
window.location.href = '/applications';

// ❌ À éviter
window.location.href = 'applications.html';
```

### Liens Externes

Pour les liens dans le HTML ou les partages:

```html
<!-- ✅ URLs propres -->
<a href="/">Accueil</a>
<a href="/applications">Dashboard</a>

<!-- ❌ URLs avec .html -->
<a href="index.html">Accueil</a>
<a href="applications.html">Dashboard</a>
```

## 🎯 Résumé

✅ **Utiliser** : `/` et `/applications`  
❌ **Éviter** : `/index.html` et `/applications.html`

Les URLs propres fonctionnent maintenant **partout** :
- Développement local
- Preview local
- Production (Netlify/Vercel)

---

**Besoin d'aide ?** Consultez [MIGRATION_SUCCESS.md](MIGRATION_SUCCESS.md) pour plus de détails.

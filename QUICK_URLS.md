# 🎯 URLs Propres - Guide Rapide

## ✅ OUI - Utiliser ces URLs

```
/                    → Page de login
/applications        → Dashboard
```

## ❌ NON - Éviter ces URLs

```
/index.html          → Déprécié
/applications.html   → Déprécié
```

## 📍 Où ça Fonctionne ?

| Environnement | URL | Status |
|--------------|-----|--------|
| Dev local (`npm run dev`) | http://localhost:3000/applications | ✅ |
| Preview local (`npm run preview`) | http://localhost:4173/applications | ✅ |
| Production Netlify | https://site.netlify.app/applications | ✅ |
| Production Vercel | https://site.vercel.app/applications | ✅ |

## 💻 Dans le Code

```javascript
// ✅ RECOMMANDÉ
window.location.href = '/applications';
window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;

// ❌ À ÉVITER
window.location.href = 'applications.html';
```

## 🧪 Test Rapide

```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Ouvrir dans le navigateur
http://localhost:4173/applications
```

**Si ça affiche le dashboard → ✅ Ça marche !**

---

Pour plus de détails : [URLS_PROPRES.md](URLS_PROPRES.md)

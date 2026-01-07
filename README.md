# Ivony

Application web frontend pour l'authentification utilisant Supabase.

## Description

Ivony est une application web 100% frontend qui utilise Supabase pour l'authentification et la gestion des profils utilisateurs. Elle offre une interface moderne avec un design futuriste en dark mode, utilisant des effets de glassmorphism et des dégradés bleu/violet.

## Fonctionnalités

- Authentification par email et mot de passe
- Vérification automatique de session
- Récupération des informations utilisateur depuis la table `profiles`
- Page de bienvenue personnalisée
- Déconnexion sécurisée
- Design responsive et moderne

## Technologies utilisées

- Vanilla JavaScript (ES6+)
- TailwindCSS via CDN
- Supabase JS v2 via CDN
- HTML5 / CSS3

## Configuration

1. Créez un projet Supabase sur [supabase.com](https://supabase.com)
2. Dans votre projet Supabase :
   - Allez dans Settings > API
   - Copiez l'URL du projet et la clé anonyme (anon public)
3. Ouvrez le fichier `app.js`
4. Remplacez `VOTRE_SUPABASE_URL` par votre URL Supabase
5. Remplacez `VOTRE_SUPABASE_ANON_KEY` par votre clé anonyme Supabase

## Structure de la base de données

Assurez-vous que votre table `ivony_profiles` existe avec au moins les colonnes suivantes :
- `id` (uuid, primary key, lié à auth.users.id)
- `username` (text, optionnel)
- `email` (text, lié à auth.users.email)

## Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Si vous n'êtes pas connecté, la page de login s'affiche
3. Entrez vos identifiants et cliquez sur "Se connecter"
4. Après connexion, la page de bienvenue s'affiche avec vos informations
5. Cliquez sur "Déconnexion" pour vous déconnecter

## Sécurité

- Aucune gestion manuelle des mots de passe
- Utilisation exclusive de l'API Supabase Auth
- Sessions gérées automatiquement par Supabase

## Développement

- Aucun outil de build requis
- Code directement fonctionnel après configuration des clés Supabase
- Compatible avec tous les navigateurs modernes supportant ES6+
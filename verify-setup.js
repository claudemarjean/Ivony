#!/usr/bin/env node

/**
 * Script de vérification de l'installation Vite
 * Vérifiez que tout est bien configuré avant de déployer
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Vite...\n');

const checks = [];
let errors = 0;
let warnings = 0;

// Fonction helper pour vérifier l'existence d'un fichier
function checkFile(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : (required ? '❌' : '⚠️');
  console.log(`${status} ${description}: ${filePath}`);
  
  if (!exists && required) {
    errors++;
  } else if (!exists && !required) {
    warnings++;
  }
  
  return exists;
}

// Vérification des fichiers essentiels
console.log('📁 Fichiers de configuration:\n');

checkFile('package.json', 'Package.json');
checkFile('vite.config.js', 'Configuration Vite');
checkFile('.gitignore', 'Gitignore', false);
checkFile('netlify.toml', 'Configuration Netlify', false);
checkFile('vercel.json', 'Configuration Vercel', false);

console.log('\n📄 Fichiers HTML:\n');

checkFile('index.html', 'Page de login');
checkFile('applications.html', 'Page dashboard');

console.log('\n📜 Scripts JavaScript:\n');

checkFile('assets/js/config.js', 'Configuration');
checkFile('assets/js/router.js', 'Router');
checkFile('assets/js/app.js', 'App principal');
checkFile('assets/js/applications.js', 'Applications');
checkFile('assets/js/theme.js', 'Thème');
checkFile('assets/js/tracking.js', 'Tracking');

console.log('\n📦 Build:\n');

const distExists = fs.existsSync('dist');
checkFile('dist', 'Dossier dist/', false);

if (distExists) {
  checkFile('dist/index.html', 'index.html buildé', false);
  checkFile('dist/applications.html', 'applications.html buildé', false);
}

// Vérification du package.json
console.log('\n📦 Vérification package.json:\n');

if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const hasVite = pkg.devDependencies && pkg.devDependencies.vite;
  console.log(`${hasVite ? '✅' : '❌'} Dépendance Vite`);
  if (!hasVite) errors++;
  
  const hasDevScript = pkg.scripts && pkg.scripts.dev;
  console.log(`${hasDevScript ? '✅' : '❌'} Script dev`);
  if (!hasDevScript) errors++;
  
  const hasBuildScript = pkg.scripts && pkg.scripts.build;
  console.log(`${hasBuildScript ? '✅' : '❌'} Script build`);
  if (!hasBuildScript) errors++;
  
  const hasPreviewScript = pkg.scripts && pkg.scripts.preview;
  console.log(`${hasPreviewScript ? '✅' : '❌'} Script preview`);
  if (!hasPreviewScript) errors++;
}

// Vérification node_modules
console.log('\n📚 Dépendances:\n');

const nodeModulesExists = fs.existsSync('node_modules');
console.log(`${nodeModulesExists ? '✅' : '⚠️'} node_modules installé`);
if (!nodeModulesExists) {
  warnings++;
  console.log('   ℹ️  Lancez: npm install');
}

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ:\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 Parfait! Tout est configuré correctement.');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. npm run dev    - Tester en développement');
  console.log('   2. npm run build  - Créer le build');
  console.log('   3. npm run preview - Tester le build');
  console.log('   4. Déployer sur Netlify/Vercel');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} erreur(s) trouvée(s)`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} avertissement(s)`);
  }
  
  console.log('\n🔧 Actions recommandées:');
  if (!nodeModulesExists) {
    console.log('   - npm install');
  }
  if (errors > 0) {
    console.log('   - Vérifiez les fichiers manquants ci-dessus');
  }
}

console.log('='.repeat(50));
console.log('\n📚 Documentation:');
console.log('   - README_BUILD.md   - Guide rapide');
console.log('   - BUILD.md          - Guide détaillé');
console.log('   - DEPLOY.md         - Guide de déploiement');
console.log('   - MIGRATION_SUCCESS.md - Résumé migration\n');

process.exit(errors > 0 ? 1 : 0);

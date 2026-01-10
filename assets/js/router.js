// Router pour URLs propres (sans .html)
function navigateTo(path) {
  // Enlever .html si présent
  if (path.endsWith('.html')) {
    path = path.replace('.html', '');
  }
  
  // Rediriger vers l'URL propre
  window.location.href = path;
}

// Export global
window.navigateTo = navigateTo;

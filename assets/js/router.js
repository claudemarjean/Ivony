// Router pour URLs propres
function navigateTo(path) {
  // En développement, ajouter .html
  // En production, le serveur gère les redirections
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev && !path.endsWith('.html')) {
    path = path + '.html';
  }
  
  window.location.href = path;
}

// Export global
window.navigateTo = navigateTo;

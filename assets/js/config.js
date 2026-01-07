// ========================================
// CONFIGURATION CENTRALISÉE - IVONY
// ========================================
// Ce fichier centralise la configuration de l'application
// IMPORTANT: Les valeurs ici sont publiques (frontend-only)

/**
 * Configuration Supabase
 * Ces clés sont PUBLIQUES et conçues pour être exposées
 * La sécurité est assurée par RLS (Row Level Security) dans Supabase
 */
const IVONY_CONFIG = {
    // Supabase
    SUPABASE_URL: 'https://jzabkrztgkayunjbzlzj.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_6KKGLI74VNMAnzbGkk6xew_ZZv3QyJu',
    
    // Routes
    ROUTES: {
        LOGIN: 'index.html',
        DASHBOARD: 'applications.html'
    },
    
    // Sécurité
    SECURITY: {
        // Timeout de session (en millisecondes) - 24 heures
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
        
        // Vérification périodique de la session (en millisecondes) - toutes les 5 minutes
        SESSION_CHECK_INTERVAL: 5 * 60 * 1000,
        
        // Nombre maximum de tentatives de connexion
        MAX_LOGIN_ATTEMPTS: 5,
        
        // Durée de blocage après échec (en millisecondes) - 15 minutes
        LOCKOUT_DURATION: 15 * 60 * 1000
    },
    
    // Tracking
    TRACKING: {
        ENABLED: true,
        DEBUG: false
    }
};

// Bloquer toute modification de la configuration
Object.freeze(IVONY_CONFIG);
Object.freeze(IVONY_CONFIG.ROUTES);
Object.freeze(IVONY_CONFIG.SECURITY);
Object.freeze(IVONY_CONFIG.TRACKING);

// Export global
if (typeof window !== 'undefined') {
    window.IVONY_CONFIG = IVONY_CONFIG;
}

console.log('✅ Configuration Ivony chargée');

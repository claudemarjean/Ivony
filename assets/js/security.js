// ========================================
// GUARDS DE SÉCURITÉ - IVONY
// ========================================
// Protection des routes et gestion de session sécurisée

/**
 * Gestionnaire de sécurité global
 */
class SecurityManager {
    constructor() {
        this.loginAttempts = this.getLoginAttempts();
        this.lockoutUntil = this.getLockoutTime();
        this.sessionCheckInterval = null;
    }

    /**
     * Récupère le nombre de tentatives de connexion
     */
    getLoginAttempts() {
        const attempts = localStorage.getItem('ivony_login_attempts');
        return attempts ? parseInt(attempts, 10) : 0;
    }

    /**
     * Récupère le temps de blocage
     */
    getLockoutTime() {
        const lockout = localStorage.getItem('ivony_lockout_until');
        return lockout ? parseInt(lockout, 10) : 0;
    }

    /**
     * Vérifie si l'utilisateur est bloqué
     */
    isLockedOut() {
        const now = Date.now();
        if (this.lockoutUntil > now) {
            const remainingMinutes = Math.ceil((this.lockoutUntil - now) / 60000);
            return {
                locked: true,
                remainingMinutes
            };
        }
        // Réinitialiser si le temps est écoulé
        if (this.lockoutUntil > 0) {
            this.resetLoginAttempts();
        }
        return { locked: false };
    }

    /**
     * Enregistre une tentative de connexion échouée
     */
    recordFailedLogin() {
        this.loginAttempts++;
        localStorage.setItem('ivony_login_attempts', this.loginAttempts.toString());

        if (this.loginAttempts >= IVONY_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
            this.lockoutUntil = Date.now() + IVONY_CONFIG.SECURITY.LOCKOUT_DURATION;
            localStorage.setItem('ivony_lockout_until', this.lockoutUntil.toString());
            console.warn('🔒 Compte temporairement bloqué après trop de tentatives');
        }
    }

    /**
     * Réinitialise les tentatives après connexion réussie
     */
    resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lockoutUntil = 0;
        localStorage.removeItem('ivony_login_attempts');
        localStorage.removeItem('ivony_lockout_until');
    }

    /**
     * Démarre la vérification périodique de session
     */
    startSessionMonitoring(supabaseClient) {
        // Nettoyer l'intervalle existant
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }

        // Vérifier immédiatement
        this.checkSession(supabaseClient);

        // Puis vérifier périodiquement
        this.sessionCheckInterval = setInterval(() => {
            this.checkSession(supabaseClient);
        }, IVONY_CONFIG.SECURITY.SESSION_CHECK_INTERVAL);

        console.log('🔐 Surveillance de session activée');
    }

    /**
     * Arrête la surveillance de session
     */
    stopSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
            console.log('🔐 Surveillance de session désactivée');
        }
    }

    /**
     * Vérifie la validité de la session
     */
    async checkSession(supabaseClient) {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                console.warn('⚠️ Session expirée, redirection vers login');
                this.redirectToLogin();
                return false;
            }

            // Vérifier le timeout de session personnalisé
            const lastActivity = localStorage.getItem('ivony_last_activity');
            if (lastActivity) {
                const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
                if (timeSinceActivity > IVONY_CONFIG.SECURITY.SESSION_TIMEOUT) {
                    console.warn('⚠️ Session inactive trop longtemps');
                    await supabaseClient.auth.signOut();
                    this.redirectToLogin();
                    return false;
                }
            }

            // Mettre à jour la dernière activité
            this.updateLastActivity();
            return true;

        } catch (error) {
            console.error('❌ Erreur vérification session:', error);
            return false;
        }
    }

    /**
     * Met à jour le timestamp de dernière activité
     */
    updateLastActivity() {
        localStorage.setItem('ivony_last_activity', Date.now().toString());
    }

    /**
     * Redirige vers la page de login
     */
    redirectToLogin() {
        this.stopSessionMonitoring();
        window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
    }

    /**
     * Redirige vers le dashboard
     */
    redirectToDashboard() {
        window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;
    }

    /**
     * Nettoie les données de session
     */
    cleanup() {
        this.stopSessionMonitoring();
        localStorage.removeItem('ivony_last_activity');
    }
}

// ========================================
// ROUTE GUARDS
// ========================================

/**
 * Guard pour les pages publiques (login)
 * Redirige vers dashboard si déjà connecté
 */
async function guardPublicPage(supabaseClient) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            console.log('✅ Utilisateur déjà connecté, redirection...');
            window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;
            return false; // Bloquer l'affichage de la page
        }
        
        return true; // Autoriser l'affichage
    } catch (error) {
        console.error('❌ Erreur guard public:', error);
        return true; // En cas d'erreur, autoriser l'affichage
    }
}

/**
 * Guard pour les pages protégées (dashboard, applications, etc.)
 * Redirige vers login si non connecté
 */
async function guardProtectedPage(supabaseClient) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            console.warn('⚠️ Accès refusé - authentification requise');
            window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
            return false; // Bloquer l'affichage
        }

        // Vérifier timeout personnalisé
        const lastActivity = localStorage.getItem('ivony_last_activity');
        if (lastActivity) {
            const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
            if (timeSinceActivity > IVONY_CONFIG.SECURITY.SESSION_TIMEOUT) {
                console.warn('⚠️ Session expirée par inactivité');
                await supabaseClient.auth.signOut();
                window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
                return false;
            }
        }

        // Mettre à jour la dernière activité
        localStorage.setItem('ivony_last_activity', Date.now().toString());
        
        return true; // Autoriser l'affichage
    } catch (error) {
        console.error('❌ Erreur guard protégé:', error);
        window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
        return false;
    }
}

// ========================================
// DÉTECTION D'ACTIVITÉ UTILISATEUR
// ========================================

/**
 * Surveille l'activité utilisateur pour mettre à jour le timestamp
 */
function setupActivityDetection() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    let activityTimeout;
    
    const updateActivity = () => {
        // Debounce: ne pas mettre à jour trop fréquemment
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
            localStorage.setItem('ivony_last_activity', Date.now().toString());
        }, 1000); // Mise à jour max toutes les secondes
    };

    events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
    });

    console.log('👁️ Détection d\'activité activée');
}

// ========================================
// EXPORTS
// ========================================

if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
    window.guardPublicPage = guardPublicPage;
    window.guardProtectedPage = guardProtectedPage;
    window.setupActivityDetection = setupActivityDetection;
}

console.log('🛡️ Module de sécurité chargé');

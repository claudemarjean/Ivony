// ========================================
// GESTION CENTRALISÉE DU TRACKING IVONY
// ========================================
// Ce module gère automatiquement le tracking des consultations d'applications
// Il détecte les clics sur les applications et enregistre les visites

/**
 * Configuration du tracking
 */
const TRACKING_CONFIG = {
    ENABLED: true,
    DEBUG: false,
    AUTO_TRACK_CLICKS: true
};

/**
 * Enregistre une consultation d'application
 * @param {string} applicationId - UUID de l'application
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Résultat du tracking
 */
async function trackApplicationView(applicationId, options = {}) {
    if (!TRACKING_CONFIG.ENABLED) {
        if (TRACKING_CONFIG.DEBUG) {
            console.log('🔕 Tracking désactivé');
        }
        return { success: false, error: 'Tracking disabled' };
    }

    if (!applicationId) {
        console.warn('⚠️ Impossible de tracker : ID d\'application manquant');
        return { success: false, error: 'Missing application ID' };
    }

    if (!window.IvonyTracking) {
        console.error('❌ Module de tracking non chargé');
        return { success: false, error: 'Tracking module not loaded' };
    }

    if (!window.supabaseClient) {
        console.error('❌ Client Supabase non initialisé');
        return { success: false, error: 'Supabase client not initialized' };
    }

    try {
        if (TRACKING_CONFIG.DEBUG) {
            console.log('📊 Tracking de l\'application:', applicationId);
        }

        const result = await IvonyTracking.trackConsultation(
            window.supabaseClient,
            applicationId,
            options
        );

        if (result.success) {
            if (TRACKING_CONFIG.DEBUG) {
                console.log('✅ Consultation trackée:', result.data);
            }
        } else {
            console.warn('⚠️ Échec du tracking:', result.error);
        }

        return result;
    } catch (error) {
        console.error('❌ Erreur lors du tracking:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialise le tracking automatique sur les liens d'applications
 * Détecte et track automatiquement les clics sur les URL d'applications
 */
function initAutoTracking() {
    if (!TRACKING_CONFIG.AUTO_TRACK_CLICKS) {
        return;
    }

    if (TRACKING_CONFIG.DEBUG) {
        console.log('🚀 Initialisation du tracking automatique');
    }

    // Écouter les clics sur les boutons "Visiter"
    document.addEventListener('click', async (event) => {
        const visitButton = event.target.closest('[data-app-id]');
        
        if (visitButton) {
            const appId = visitButton.dataset.appId;
            const appUrl = visitButton.dataset.appUrl;

            if (TRACKING_CONFIG.DEBUG) {
                console.log('🔗 Clic détecté sur application:', appId);
            }

            // Tracker la consultation
            await trackApplicationView(appId, {
                source: 'click',
                url: appUrl
            });
        }
    });

    if (TRACKING_CONFIG.DEBUG) {
        console.log('✅ Tracking automatique configuré');
    }
}

/**
 * Active/désactive le tracking
 * @param {boolean} enabled - État du tracking
 */
function setTrackingEnabled(enabled) {
    TRACKING_CONFIG.ENABLED = enabled;
    console.log(`📊 Tracking ${enabled ? 'activé' : 'désactivé'}`);
}

/**
 * Active/désactive le mode debug
 * @param {boolean} debug - État du mode debug
 */
function setTrackingDebug(debug) {
    TRACKING_CONFIG.DEBUG = debug;
    console.log(`🐛 Mode debug ${debug ? 'activé' : 'désactivé'}`);
}

/**
 * Récupère les statistiques de tracking pour une application
 * @param {string} applicationId - UUID de l'application
 * @returns {Promise<Object>} Statistiques
 */
async function getApplicationStats(applicationId) {
    if (!window.supabaseClient) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data, error } = await supabaseClient
            .from('ivony_consultation')
            .select('*')
            .eq('application_id', applicationId)
            .eq('is_deleted', false);

        if (error) throw error;

        const stats = {
            total_views: data.length,
            unique_views: data.filter(c => c.is_unique).length,
            authenticated_views: data.filter(c => c.is_authenticated).length,
            anonymous_views: data.filter(c => !c.is_authenticated).length,
            countries: [...new Set(data.map(c => c.country).filter(Boolean))],
            devices: {
                mobile: data.filter(c => c.device_type === 'Mobile').length,
                tablet: data.filter(c => c.device_type === 'Tablet').length,
                desktop: data.filter(c => c.device_type === 'Desktop').length
            },
            browsers: data.reduce((acc, c) => {
                if (c.browser) {
                    acc[c.browser] = (acc[c.browser] || 0) + 1;
                }
                return acc;
            }, {}),
            recent_visits: data
                .sort((a, b) => new Date(b.visited_at) - new Date(a.visited_at))
                .slice(0, 10)
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPORTS
// ========================================

if (typeof window !== 'undefined') {
    window.AppTracking = {
        trackApplicationView,
        initAutoTracking,
        setTrackingEnabled,
        setTrackingDebug,
        getApplicationStats
    };
}

console.log('✅ Module de tracking d\'application initialisé');

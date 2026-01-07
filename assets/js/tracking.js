// ========================================
// MODULE DE TRACKING SÉCURISÉ - IVONY
// ========================================

/**
 * Module de tracking des consultations d'applications
 * 
 * Fonctionnalités :
 * - Gestion automatique de session (authentifié / anonyme)
 * - Insertion sécurisée dans ivony_consultation
 * - Génération de session_id unique pour visiteurs anonymes
 * - Respect des règles RLS Supabase
 * - Détection automatique de l'environnement
 * 
 * @module TrackingModule
 */

// ========================================
// CONSTANTS
// ========================================

const TRACKING_CONFIG = {
    SESSION_KEY: 'ivony_tracking_session',
    IP_SERVICE_URL: 'https://api.ipify.org?format=json',
    IP_GEOLOCATION_URL: 'https://ipapi.co',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // ms
};

// ========================================
// UTILITAIRES
// ========================================

/**
 * Génère un UUID v4 unique
 * @returns {string} UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Récupère ou crée un session_id pour visiteur anonyme
 * @returns {string} Session ID
 */
function getOrCreateAnonymousSessionId() {
    try {
        let sessionId = localStorage.getItem(TRACKING_CONFIG.SESSION_KEY);
        
        if (!sessionId) {
            sessionId = generateUUID();
            localStorage.setItem(TRACKING_CONFIG.SESSION_KEY, sessionId);
            console.log('📝 Nouveau session_id anonyme créé:', sessionId);
        }
        
        return sessionId;
    } catch (error) {
        // Fallback si localStorage n'est pas disponible
        console.warn('⚠️ localStorage non disponible, utilisation de session mémoire');
        return generateUUID();
    }
}

/**
 * Récupère l'adresse IP du visiteur
 * @returns {Promise<string|null>} Adresse IP ou null
 */
async function getClientIP() {
    try {
        const response = await fetch(TRACKING_CONFIG.IP_SERVICE_URL, {
            method: 'GET',
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de l\'IP');
        }
        
        const data = await response.json();
        return data.ip || null;
    } catch (error) {
        console.warn('⚠️ Impossible de récupérer l\'IP:', error.message);
        return null;
    }
}

/**
 * Récupère les informations géographiques à partir de l'IP
 * @param {string} ipAddress - Adresse IP
 * @returns {Promise<Object>} Informations géographiques
 */
async function getGeoLocation(ipAddress) {
    if (!ipAddress) {
        return {
            country: null,
            region: null,
            city: null
        };
    }
    
    try {
        const response = await fetch(`${TRACKING_CONFIG.IP_GEOLOCATION_URL}/${ipAddress}/json/`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la géolocalisation');
        }
        
        const data = await response.json();
        
        return {
            country: data.country_name || null,
            region: data.region || null,
            city: data.city || null
        };
    } catch (error) {
        console.warn('⚠️ Impossible de récupérer la géolocalisation:', error.message);
        return {
            country: null,
            region: null,
            city: null
        };
    }
}

/**
 * Détecte les informations sur le navigateur et l'appareil
 * @returns {Object} Informations sur le navigateur et l'appareil
 */
function getDeviceInfo() {
    const userAgent = navigator.userAgent || '';
    
    // Détection du navigateur
    let browser = 'Unknown';
    if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
        browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
        browser = 'Edge';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
        browser = 'Internet Explorer';
    }
    
    // Détection du système d'exploitation
    let os = 'Unknown';
    if (userAgent.indexOf('Win') > -1) {
        os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
        os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
        os = 'iOS';
    }
    
    // Détection du type d'appareil
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPod/.test(userAgent)) {
        deviceType = 'mobile';
    } else if (/iPad|Tablet/.test(userAgent)) {
        deviceType = 'tablet';
    }
    
    return {
        browser,
        os,
        device_type: deviceType
    };
}

/**
 * Vérifie si l'utilisateur est authentifié
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<Object>} Informations de session
 */
async function checkAuthentication(supabase) {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.warn('⚠️ Erreur lors de la vérification de la session:', error.message);
            return {
                is_authenticated: false,
                user_id: null,
                session_id: getOrCreateAnonymousSessionId()
            };
        }
        
        if (session && session.user) {
            return {
                is_authenticated: true,
                user_id: session.user.id,
                session_id: session.access_token // Utiliser le token comme session_id pour utilisateurs authentifiés
            };
        }
        
        return {
            is_authenticated: false,
            user_id: null,
            session_id: getOrCreateAnonymousSessionId()
        };
    } catch (error) {
        console.error('❌ Erreur critique lors de la vérification de l\'authentification:', error);
        return {
            is_authenticated: false,
            user_id: null,
            session_id: getOrCreateAnonymousSessionId()
        };
    }
}

/**
 * Vérifie si la consultation est unique (première visite)
 * @param {Object} supabase - Client Supabase
 * @param {string} applicationId - ID de l'application
 * @param {string} sessionId - ID de session
 * @returns {Promise<boolean>} True si première visite
 */
async function isUniqueVisit(supabase, applicationId, sessionId) {
    try {
        const { data, error } = await supabase
            .from('ivony_consultation')
            .select('id')
            .eq('application_id', applicationId)
            .eq('session_id', sessionId)
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Erreur lors de la vérification de visite unique:', error.message);
            return true; // Par défaut, considérer comme unique en cas d'erreur
        }
        
        return !data || data.length === 0;
    } catch (error) {
        console.warn('⚠️ Erreur lors de la vérification de visite unique:', error);
        return true;
    }
}

// ========================================
// FONCTION PRINCIPALE DE TRACKING
// ========================================

/**
 * Enregistre une consultation dans la base de données
 * @param {Object} supabase - Client Supabase
 * @param {string} applicationId - ID de l'application visitée
 * @param {Object} options - Options supplémentaires (réservé pour usage futur)
 * @returns {Promise<Object>} Résultat de l'insertion { success, data, error }
 */
async function trackConsultation(supabase, applicationId, options = {}) {
    console.log('🎯 Début du tracking pour l\'application:', applicationId);
    
    try {
        // 1. Vérifier l'authentification
        const authInfo = await checkAuthentication(supabase);
        console.log('✅ Authentification vérifiée:', authInfo.is_authenticated ? 'Utilisateur connecté' : 'Visiteur anonyme');
        
        // 2. Récupérer l'IP et les informations géographiques
        const ipAddress = await getClientIP();
        console.log('🌍 Adresse IP récupérée:', ipAddress || 'Non disponible');
        
        const geoLocation = ipAddress ? await getGeoLocation(ipAddress) : {
            country: null,
            region: null,
            city: null
        };
        
        // 3. Récupérer les informations sur l'appareil
        const deviceInfo = getDeviceInfo();
        console.log('📱 Informations appareil:', deviceInfo);
        
        // 4. Vérifier si c'est une visite unique
        const isUnique = await isUniqueVisit(supabase, applicationId, authInfo.session_id);
        console.log('🆕 Visite unique:', isUnique);
        
        // 5. Préparer les données de consultation
        const consultationData = {
            application_id: applicationId,
            user_id: authInfo.user_id,
            is_authenticated: authInfo.is_authenticated,
            is_unique: isUnique,
            session_id: authInfo.session_id,
            ip_address: ipAddress,
            country: geoLocation.country,
            region: geoLocation.region,
            city: geoLocation.city,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            device_type: deviceInfo.device_type,
            visited_at: new Date().toISOString(),
            is_deleted: false
        };
        
        // 6. Insérer dans la base de données avec retry
        let lastError = null;
        for (let attempt = 1; attempt <= TRACKING_CONFIG.MAX_RETRIES; attempt++) {
            try {
                console.log(`📤 Tentative d'insertion ${attempt}/${TRACKING_CONFIG.MAX_RETRIES}...`);
                
                const { data, error } = await supabase
                    .from('ivony_consultation')
                    .insert([consultationData])
                    .select();
                
                if (error) {
                    throw error;
                }
                
                console.log('✅ Consultation enregistrée avec succès:', data);
                return {
                    success: true,
                    data: data[0],
                    error: null
                };
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < TRACKING_CONFIG.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, TRACKING_CONFIG.RETRY_DELAY * attempt));
                }
            }
        }
        
        // Toutes les tentatives ont échoué
        console.error('❌ Échec de l\'enregistrement après', TRACKING_CONFIG.MAX_RETRIES, 'tentatives');
        return {
            success: false,
            data: null,
            error: lastError
        };
        
    } catch (error) {
        console.error('❌ Erreur critique lors du tracking:', error);
        return {
            success: false,
            data: null,
            error: error
        };
    }
}

// ========================================
// EXPORTS
// ========================================

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackConsultation,
        getOrCreateAnonymousSessionId,
        checkAuthentication,
        getClientIP,
        getGeoLocation,
        getDeviceInfo
    };
}

// Export global pour utilisation directe dans le navigateur
if (typeof window !== 'undefined') {
    window.IvonyTracking = {
        trackConsultation,
        getOrCreateAnonymousSessionId,
        checkAuthentication,
        getClientIP,
        getGeoLocation,
        getDeviceInfo
    };
}

console.log('✅ Module de tracking Ivony initialisé');

// ========================================
// SUIVI VUE - Gestion des consultations
// ========================================

// Variables globales pour le suivi
let consultations = [];
let filteredConsultations = [];
let applicationsMap = new Map(); // Cache des applications
let ipAccessControl = new Map(); // Cache du statut des IPs

// Éléments DOM du suivi
const suiviLoading = document.getElementById('suivi-loading');
const suiviEmpty = document.getElementById('suivi-empty');
const consultationsContainer = document.getElementById('consultations-container');
const consultationsTable = document.getElementById('consultations-table');
const consultationsCards = document.getElementById('consultations-cards');
const consultationsCount = document.getElementById('consultations-count');

// Filtres
const filterApp = document.getElementById('filter-app');
const filterPeriod = document.getElementById('filter-period');
const filterCountry = document.getElementById('filter-country');
const filterDevice = document.getElementById('filter-device');

// KPIs
const kpiTotal = document.getElementById('kpi-total');
const kpiUnique = document.getElementById('kpi-unique');
const kpiApps = document.getElementById('kpi-apps');
const kpiAuth = document.getElementById('kpi-auth');

// Modal IP
const ipModal = document.getElementById('ip-modal');
const ipModalTitle = document.getElementById('ip-modal-title');
const ipModalAddress = document.getElementById('ip-modal-address');
const ipReason = document.getElementById('ip-reason');
const ipBlacklistBtn = document.getElementById('ip-blacklist-btn');
const ipWhitelistBtn = document.getElementById('ip-whitelist-btn');
const closeIpModalBtn = document.getElementById('close-ip-modal-btn');

let currentIpAction = null; // {ip: string, action: 'blacklist'|'whitelist'}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

/**
 * Charger le statut des IPs depuis ivony_ip_access_control
 */
async function loadIpAccessControl() {
    console.log('🔍 Chargement du contrôle d\'accès IP...');
    
    try {
        const { data, error } = await supabaseClient
            .from('ivony_ip_access_control')
            .select('*');

        if (error) {
            console.error('❌ Erreur chargement IP access control:', error);
            throw error;
        }

        ipAccessControl.clear();
        if (data) {
            data.forEach(record => {
                ipAccessControl.set(record.ip_address, {
                    status: record.status,
                    reason: record.reason,
                    created_at: record.created_at,
                    updated_at: record.updated_at
                });
            });
        }

        console.log('✅ Statuts IP chargés:', ipAccessControl.size);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des statuts IP:', error);
    }
}

/**
 * Charger les consultations depuis Supabase
 */
async function loadConsultations() {
    console.log('🔄 Début du chargement des consultations...');
    console.log('supabaseClient:', !!supabaseClient);
    console.log('currentUser:', currentUser);

    if (!supabaseClient || !currentUser) {
        console.error('❌ Supabase client ou utilisateur non disponible');
        suiviEmpty.classList.remove('hidden');
        suiviLoading.classList.add('hidden');
        return;
    }

    try {
        suiviLoading.classList.remove('hidden');
        consultationsContainer.classList.add('hidden');
        suiviEmpty.classList.add('hidden');

        // Charger les applications d'abord pour le mapping
        console.log('📱 Chargement des applications...');
        const { data: apps, error: appsError } = await supabaseClient
            .from('ivony_application')
            .select('id, name');
            // Pas de filtre user_id car la colonne n'existe pas dans ivony_application

        if (appsError) {
            console.error('❌ Erreur applications:', appsError);
            throw appsError;
        }

        console.log('✅ Applications chargées:', apps?.length || 0);
        
        if (!apps || apps.length === 0) {
            console.warn('⚠️ Aucune application trouvée pour cet utilisateur');
            suiviEmpty.classList.remove('hidden');
            suiviLoading.classList.add('hidden');
            return;
        }

        // Créer un map pour lookup rapide
        applicationsMap.clear();
        apps.forEach(app => applicationsMap.set(app.id, app.name));

        // Peupler le filtre des applications
        populateAppFilter(apps);

        // Charger le statut des IPs
        await loadIpAccessControl();

        // Charger les consultations
        console.log('👁️ Chargement des consultations...');
        const { data, error } = await supabaseClient
            .from('ivony_consultation')
            .select('*')
            .in('application_id', apps.map(a => a.id))
            .order('visited_at', { ascending: false })
            .limit(500); // Limiter à 500 pour performance

        if (error) {
            console.error('❌ Erreur consultations:', error);
            throw error;
        }

        // Filtrer les consultations blacklistées
        const allConsultations = data || [];
        consultations = allConsultations.filter(c => {
            const ipStatus = ipAccessControl.get(c.ip_address);
            return !ipStatus || ipStatus.status !== 'blacklist';
        });
        
        console.log('✅ Consultations chargées:', consultations.length, '(', allConsultations.length - consultations.length, 'blacklistées filtrées)');
        console.log('📊 Exemple de consultation:', consultations[0]);

        // Peupler les autres filtres
        populateFilters();

        // Appliquer les filtres initiaux
        applyFilters();

    } catch (error) {
        console.error('❌ Erreur chargement consultations:', error);
        showToast('Erreur lors du chargement des consultations', 'error');
        suiviEmpty.classList.remove('hidden');
    } finally {
        suiviLoading.classList.add('hidden');
    }
}

/**
 * Peupler le filtre des applications
 */
function populateAppFilter(apps) {
    filterApp.innerHTML = '<option value="">Toutes les applications</option>';
    apps.forEach(app => {
        const option = document.createElement('option');
        option.value = app.id;
        option.textContent = app.name;
        filterApp.appendChild(option);
    });
}

/**
 * Peupler les filtres dynamiquement selon les données
 */
function populateFilters() {
    // Pays uniques
    const countries = [...new Set(consultations.map(c => c.country).filter(Boolean))];
    filterCountry.innerHTML = '<option value="">Tous les pays</option>';
    countries.sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        filterCountry.appendChild(option);
    });
}

// ========================================
// FILTRES
// ========================================

/**
 * Appliquer tous les filtres actifs
 */
function applyFilters() {
    const appFilter = filterApp.value;
    const periodFilter = filterPeriod.value;
    const countryFilter = filterCountry.value;
    const deviceFilter = filterDevice.value;

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate = null;

    switch (periodFilter) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'all':
        default:
            startDate = null;
    }

    // Filtrer les consultations
    filteredConsultations = consultations.filter(c => {
        // Filtre application
        if (appFilter && c.application_id !== appFilter) return false;

        // Filtre période
        if (startDate && new Date(c.visited_at) < startDate) return false;

        // Filtre pays
        if (countryFilter && c.country !== countryFilter) return false;

        // Filtre device
        if (deviceFilter && c.device_type?.toLowerCase() !== deviceFilter) return false;

        return true;
    });

    // Mettre à jour l'affichage
    updateKPIs();
    displayConsultations();
}

/**
 * Mettre à jour les KPIs
 */
function updateKPIs() {
    const total = filteredConsultations.length;
    const unique = filteredConsultations.filter(c => c.is_unique).length;
    const appsWithViews = new Set(filteredConsultations.map(c => c.application_id)).size;
    const authenticated = filteredConsultations.filter(c => c.is_authenticated).length;
    const authRate = total > 0 ? Math.round((authenticated / total) * 100) : 0;

    console.log('📊 KPIs:', { total, unique, appsWithViews, authenticated, authRate });

    kpiTotal.textContent = formatNumber(total);
    kpiUnique.textContent = formatNumber(unique);
    kpiApps.textContent = formatNumber(appsWithViews);
    kpiAuth.textContent = authRate + '%';
}

// ========================================
// AFFICHAGE DES CONSULTATIONS
// ========================================

/**
 * Afficher les consultations (table + cards)
 */
function displayConsultations() {
    console.log('🎨 Affichage des consultations:', filteredConsultations.length);
    
    consultationsCount.textContent = filteredConsultations.length;

    if (filteredConsultations.length === 0) {
        console.log('📭 Aucune consultation à afficher (filtres ou vide)');
        consultationsContainer.classList.add('hidden');
        suiviEmpty.classList.remove('hidden');
        return;
    }

    console.log('✅ Affichage de', filteredConsultations.length, 'consultations');
    consultationsContainer.classList.remove('hidden');
    suiviEmpty.classList.add('hidden');

    // Afficher table (desktop)
    displayTable();

    // Afficher cards (mobile/tablet)
    displayCards();
}

/**
 * Afficher la table (desktop)
 */
function displayTable() {
    consultationsTable.innerHTML = '';

    filteredConsultations.slice(0, 50).forEach(consultation => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-800/50 transition-colors';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${formatDateTime(consultation.visited_at)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-300">
                ${escapeHtml(applicationsMap.get(consultation.application_id) || 'N/A')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-2">
                    <span class="font-mono text-gray-300">${escapeHtml(consultation.ip_address || 'N/A')}</span>
                    ${formatIpBadge(consultation.ip_address)}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${formatLocation(consultation)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${formatDevice(consultation)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${escapeHtml(consultation.browser || 'N/A')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${formatStatus(consultation)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${formatActions(consultation.ip_address)}
            </td>
        `;

        consultationsTable.appendChild(row);
    });

    // Ajouter les event listeners pour les boutons d'action
    setupActionButtons();
}

/**
 * Afficher les cards (mobile/tablet)
 */
function displayCards() {
    consultationsCards.innerHTML = '';

    filteredConsultations.slice(0, 50).forEach(consultation => {
        const card = document.createElement('div');
        card.className = 'p-4 sm:p-5 hover:bg-slate-800/30 transition-colors';

        card.innerHTML = `
            <div class="space-y-3">
                <!-- En-tête -->
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-cyan-300 text-sm">
                            ${escapeHtml(applicationsMap.get(consultation.application_id) || 'N/A')}
                        </h4>
                        <p class="text-xs text-gray-500 mt-1">
                            ${formatDateTime(consultation.visited_at)}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        ${formatStatus(consultation)}
                        ${formatActions(consultation.ip_address, true)}
                    </div>
                </div>

                <!-- Infos -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="col-span-2">
                        <span class="text-gray-500">Adresse IP</span>
                        <div class="flex items-center gap-2 mt-1">
                            <p class="text-gray-300 font-mono">${escapeHtml(consultation.ip_address || 'N/A')}</p>
                            ${formatIpBadge(consultation.ip_address)}
                        </div>
                    </div>
                    <div>
                        <span class="text-gray-500">Localisation</span>
                        <p class="text-gray-300 mt-1">${formatLocation(consultation)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500">Appareil</span>
                        <p class="text-gray-300 mt-1">${formatDevice(consultation)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500">Navigateur</span>
                        <p class="text-gray-300 mt-1">${escapeHtml(consultation.browser || 'N/A')}</p>
                    </div>
                    <div>
                        <span class="text-gray-500">OS</span>
                        <p class="text-gray-300 mt-1">${escapeHtml(consultation.os || 'N/A')}</p>
                    </div>
                </div>
            </div>
        `;

        consultationsCards.appendChild(card);
    });

    // Ajouter les event listeners pour les boutons d'action
    setupActionButtons();
}

// ========================================
// UTILITAIRES DE FORMATAGE
// ========================================

/**
 * Formater la date/heure
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formater la localisation
 */
function formatLocation(consultation) {
    const parts = [
        consultation.city,
        consultation.region,
        consultation.country
    ].filter(Boolean);

    return parts.length > 0 ? escapeHtml(parts.join(', ')) : 'N/A';
}

/**
 * Formater l'appareil
 */
function formatDevice(consultation) {
    const device = consultation.device_type || 'N/A';
    const os = consultation.os || '';
    return escapeHtml(os ? `${device} (${os})` : device);
}

/**
 * Formater le statut
 */
function formatStatus(consultation) {
    const badges = [];

    if (consultation.is_unique) {
        badges.push('<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">Unique</span>');
    }

    if (consultation.is_authenticated) {
        badges.push('<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Auth</span>');
    }

    return badges.length > 0 ? badges.join(' ') : '<span class="text-gray-500 text-xs">-</span>';
}

/**
 * Formater le badge de statut IP
 */
function formatIpBadge(ipAddress) {
    if (!ipAddress) return '';
    
    const ipStatus = ipAccessControl.get(ipAddress);
    
    if (!ipStatus) {
        return '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">Neutre</span>';
    }
    
    if (ipStatus.status === 'blacklist') {
        return '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">Blacklist</span>';
    }
    
    if (ipStatus.status === 'whitelist') {
        return '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Whitelist</span>';
    }
    
    return '';
}

/**
 * Formater le menu d'actions pour une IP
 */
function formatActions(ipAddress, isMobile = false) {
    if (!ipAddress) return '-';
    
    const ipStatus = ipAccessControl.get(ipAddress);
    const currentStatus = ipStatus?.status || 'none';
    
    if (isMobile) {
        // Version mobile : bouton menu contextuel
        return `
            <button class="ip-action-btn text-gray-400 hover:text-cyan-300 transition-colors p-1" 
                    data-ip="${escapeHtml(ipAddress)}"
                    data-current-status="${currentStatus}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
            </button>
        `;
    }
    
    // Version desktop : boutons inline
    return `
        <div class="flex gap-2">
            <button class="ip-blacklist-action px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 
                          ${currentStatus === 'blacklist' ? 'bg-red-500/30 text-red-300 cursor-not-allowed' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}" 
                    data-ip="${escapeHtml(ipAddress)}"
                    ${currentStatus === 'blacklist' ? 'disabled' : ''}>
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                </svg>
                ${currentStatus === 'blacklist' ? 'Blacklisté' : 'Blacklist'}
            </button>
            <button class="ip-whitelist-action px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300
                          ${currentStatus === 'whitelist' ? 'bg-green-500/30 text-green-300 cursor-not-allowed' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}" 
                    data-ip="${escapeHtml(ipAddress)}"
                    ${currentStatus === 'whitelist' ? 'disabled' : ''}>
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${currentStatus === 'whitelist' ? 'Whitelisté' : 'Whitelist'}
            </button>
        </div>
    `;
}

/**
 * Formater les nombres
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ========================================
// GESTION DES IPs (BLACKLIST/WHITELIST)
// ========================================

/**
 * Ouvrir la modale de gestion IP
 */
function openIpModal(ipAddress, action) {
    currentIpAction = { ip: ipAddress, action };
    ipModalAddress.textContent = ipAddress;
    ipReason.value = '';
    
    const ipStatus = ipAccessControl.get(ipAddress);
    const actionText = action === 'blacklist' ? 'Blacklister' : 'Whitelister';
    ipModalTitle.textContent = `${actionText} l'adresse IP`;
    
    ipModal.classList.remove('hidden');
}

/**
 * Fermer la modale de gestion IP
 */
function closeIpModal() {
    ipModal.classList.add('hidden');
    currentIpAction = null;
    ipReason.value = '';
}

/**
 * Configurer les boutons d'action IP
 */
function setupActionButtons() {
    // Boutons desktop blacklist
    document.querySelectorAll('.ip-blacklist-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ip = e.currentTarget.dataset.ip;
            if (ip && !e.currentTarget.disabled) {
                openIpModal(ip, 'blacklist');
            }
        });
    });
    
    // Boutons desktop whitelist
    document.querySelectorAll('.ip-whitelist-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ip = e.currentTarget.dataset.ip;
            if (ip && !e.currentTarget.disabled) {
                openIpModal(ip, 'whitelist');
            }
        });
    });
    
    // Boutons mobile (menu contextuel)
    document.querySelectorAll('.ip-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ip = e.currentTarget.dataset.ip;
            const currentStatus = e.currentTarget.dataset.currentStatus;
            
            if (ip) {
                // Afficher un menu contextuel simple
                const action = currentStatus === 'blacklist' ? 'whitelist' : 'blacklist';
                openIpModal(ip, action);
            }
        });
    });
}

/**
 * Gérer une IP (blacklist ou whitelist)
 */
async function manageIpAccess(action) {
    if (!currentIpAction) return;
    
    const { ip } = currentIpAction;
    const reason = ipReason.value.trim() || null;
    
    console.log(`🔒 ${action === 'blacklist' ? 'Blacklist' : 'Whitelist'} IP:`, ip);
    
    try {
        // UPSERT dans ivony_ip_access_control
        const { data, error } = await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: ip,
                status: action,
                reason: reason,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'ip_address'
            });

        if (error) {
            console.error(`❌ Erreur ${action}:`, error);
            throw error;
        }

        console.log(`✅ IP ${action === 'blacklist' ? 'blacklistée' : 'whitelistée'} avec succès`);
        
        // Mettre à jour le cache local
        ipAccessControl.set(ip, {
            status: action,
            reason: reason,
            updated_at: new Date().toISOString()
        });
        
        // Fermer la modale
        closeIpModal();
        
        // Afficher une notification
        const message = action === 'blacklist' 
            ? `L'adresse IP ${ip} a été blacklistée` 
            : `L'adresse IP ${ip} a été whitelistée`;
        showToast(message, 'success');
        
        // Recharger les consultations si on a blacklisté
        if (action === 'blacklist') {
            await loadConsultations();
        } else {
            // Juste rafraîchir l'affichage pour mettre à jour les badges
            displayConsultations();
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la gestion IP:`, error);
        showToast(`Erreur lors de la gestion de l'IP`, 'error');
    }
}

// ========================================
// ÉVÉNEMENTS
// ========================================

/**
 * Configurer les écouteurs d'événements pour les filtres
 */
function setupSuiviEventListeners() {
    if (!filterApp || !filterPeriod || !filterCountry || !filterDevice) return;

    filterApp.addEventListener('change', applyFilters);
    filterPeriod.addEventListener('change', applyFilters);
    filterCountry.addEventListener('change', applyFilters);
    filterDevice.addEventListener('change', applyFilters);
    
    // Event listeners pour la modale IP
    if (closeIpModalBtn) {
        closeIpModalBtn.addEventListener('click', closeIpModal);
    }
    
    if (ipBlacklistBtn) {
        ipBlacklistBtn.addEventListener('click', () => manageIpAccess('blacklist'));
    }
    
    if (ipWhitelistBtn) {
        ipWhitelistBtn.addEventListener('click', () => manageIpAccess('whitelist'));
    }
    
    // Fermer la modale en cliquant en dehors
    if (ipModal) {
        ipModal.addEventListener('click', (e) => {
            if (e.target === ipModal) {
                closeIpModal();
            }
        });
    }
}

// ========================================
// INITIALISATION
// ========================================

/**
 * Initialiser le module Suivi vue
 * Appelé depuis applications.js quand l'onglet Suivi est activé
 */
async function initSuivi() {
    console.log('🚀 Initialisation du module Suivi vue...');
    console.log('📋 Vérification des éléments DOM...');
    console.log('  - suiviLoading:', !!suiviLoading);
    console.log('  - consultationsContainer:', !!consultationsContainer);
    console.log('  - filterApp:', !!filterApp);
    console.log('  - kpiTotal:', !!kpiTotal);
    
    setupSuiviEventListeners();
    await loadConsultations();
    
    console.log('✅ Module Suivi vue initialisé');
}

// Export pour utilisation dans applications.js
if (typeof window !== 'undefined') {
    window.initSuivi = initSuivi;
    window.loadConsultations = loadConsultations;
}

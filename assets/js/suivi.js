// ========================================
// SUIVI VUE - Gestion des consultations
// ========================================

// Variables globales pour le suivi
let consultations = [];
let filteredConsultations = [];
let applicationsMap = new Map(); // Cache des applications

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

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

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

        consultations = data || [];
        console.log('✅ Consultations chargées:', consultations.length);
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
        `;

        consultationsTable.appendChild(row);
    });
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
                    ${formatStatus(consultation)}
                </div>

                <!-- Infos -->
                <div class="grid grid-cols-2 gap-3 text-xs">
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

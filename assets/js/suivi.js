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

// Bouton de suppression
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const deleteCount = document.getElementById('delete-count');
const selectAllCheckbox = document.getElementById('select-all-checkbox');

// État des sélections
let selectedConsultations = new Set();

// Filtres
const filterApp = document.getElementById('filter-app');
const filterPeriod = document.getElementById('filter-period');
const filterCountry = document.getElementById('filter-country');
const filterDevice = document.getElementById('filter-device');
const filterIpStatus = document.getElementById('filter-ip-status');

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

// Modal de confirmation de suppression
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteConfirmCount = document.getElementById('delete-confirm-count');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');

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

        // Filtrer côté client les consultations supprimées
        consultations = (data || []).filter(c => !c.is_deleted);
        
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
    const ipStatusFilter = filterIpStatus.value;

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

        // Filtre statut IP
        if (ipStatusFilter) {
            const ipStatus = ipAccessControl.get(c.ip_address);
            const currentStatus = ipStatus?.status || 'none';
            
            if (ipStatusFilter === 'mot-a-trouver') {
                // Mot à trouver = neutre + whitelist
                if (currentStatus !== 'none' && currentStatus !== 'whitelist') return false;
            } else if (ipStatusFilter === 'blacklist') {
                // Blacklist seulement
                if (currentStatus !== 'blacklist') return false;
            }
        }

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
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <input type="checkbox" class="consultation-checkbox w-4 h-4 rounded border-cyan-500/30 bg-slate-900/50 text-cyan-500 focus:ring-2 focus:ring-cyan-400 cursor-pointer" data-id="${consultation.id}">
            </td>
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
        `;

        consultationsTable.appendChild(row);
    });

    // Ajouter les event listeners pour les boutons d'action
    setupActionButtons();
    
    // Ajouter les event listeners pour les checkboxes
    document.querySelectorAll('.consultation-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
        // Restaurer l'état de sélection si elle existe
        if (selectedConsultations.has(checkbox.dataset.id)) {
            checkbox.checked = true;
        }
    });
    
    // Mettre à jour le bouton de suppression
    updateDeleteButton();
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
                <div class="flex justify-between items-start gap-2">
                    <div class="flex items-start gap-3 flex-1 min-w-0">
                        <input type="checkbox" class="consultation-checkbox w-4 h-4 mt-1 flex-shrink-0 rounded border-cyan-500/30 bg-slate-900/50 text-cyan-500 focus:ring-2 focus:ring-cyan-400 cursor-pointer" data-id="${consultation.id}">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-cyan-300 text-sm truncate">
                                ${escapeHtml(applicationsMap.get(consultation.application_id) || 'N/A')}
                            </h4>
                            <p class="text-xs text-gray-500 mt-1">
                                ${formatDateTime(consultation.visited_at)}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        ${formatStatus(consultation)}
                    </div>
                </div>

                <!-- Infos -->
                <div class="grid grid-cols-1 gap-3 text-xs">
                    <div>
                        <span class="text-gray-500 block mb-1">Adresse IP</span>
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-gray-300 font-mono text-xs break-all">${escapeHtml(consultation.ip_address || 'N/A')}</p>
                            ${formatIpBadge(consultation.ip_address)}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <span class="text-gray-500 block mb-1">Localisation</span>
                            <p class="text-gray-300 text-xs break-words">${formatLocation(consultation)}</p>
                        </div>
                        <div>
                            <span class="text-gray-500 block mb-1">Appareil</span>
                            <p class="text-gray-300 text-xs break-words">${formatDevice(consultation)}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <span class="text-gray-500 block mb-1">Navigateur</span>
                            <p class="text-gray-300 text-xs break-words">${escapeHtml(consultation.browser || 'N/A')}</p>
                        </div>
                        <div>
                            <span class="text-gray-500 block mb-1">OS</span>
                            <p class="text-gray-300 text-xs break-words">${escapeHtml(consultation.os || 'N/A')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        consultationsCards.appendChild(card);
    });

    // Ajouter les event listeners pour les boutons d'action
    setupActionButtons();
    
    // Ajouter les event listeners pour les checkboxes
    document.querySelectorAll('.consultation-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
        // Restaurer l'état de sélection si elle existe
        if (selectedConsultations.has(checkbox.dataset.id)) {
            checkbox.checked = true;
        }
    });
    
    // Mettre à jour le bouton de suppression
    updateDeleteButton();
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
        return '<span class="ip-status-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-pointer hover:bg-gray-500/30 transition-colors" data-ip="' + escapeHtml(ipAddress) + '" data-status="none">Neutre</span>';
    }
    
    if (ipStatus.status === 'blacklist') {
        return '<span class="ip-status-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors" data-ip="' + escapeHtml(ipAddress) + '" data-status="blacklist">Blacklist</span>';
    }
    
    if (ipStatus.status === 'whitelist') {
        return '<span class="ip-status-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-colors" data-ip="' + escapeHtml(ipAddress) + '" data-status="whitelist">Whitelist</span>';
    }
    
    return '';
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
    // Clics sur les badges de statut IP pour ouvrir la modale
    document.querySelectorAll('.ip-status-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
            const ip = e.currentTarget.dataset.ip;
            const status = e.currentTarget.dataset.status;
            
            if (ip) {
                if (status === 'blacklist') {
                    // Pour les blacklist, ouvrir la modale de whitelist
                    openIpModal(ip, 'whitelist');
                } else if (status === 'none' || status === 'whitelist') {
                    // Pour neutre et whitelist, ouvrir la modale de blacklist
                    openIpModal(ip, 'blacklist');
                }
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
// GESTION DES SÉLECTIONS ET SUPPRESSION
// ========================================

/**
 * Mettre à jour l'affichage du bouton de suppression
 */
function updateDeleteButton() {
    const count = selectedConsultations.size;
    
    if (count > 0) {
        deleteSelectedBtn.classList.remove('hidden');
        deleteCount.textContent = count;
    } else {
        deleteSelectedBtn.classList.add('hidden');
    }
    
    // Mettre à jour l'état de la checkbox "Tout sélectionner"
    if (selectAllCheckbox) {
        const visibleIds = filteredConsultations.slice(0, 50).map(c => c.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedConsultations.has(id));
        selectAllCheckbox.checked = allSelected;
        selectAllCheckbox.indeterminate = !allSelected && visibleIds.some(id => selectedConsultations.has(id));
    }
}

/**
 * Gérer le clic sur une checkbox de consultation
 */
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const consultationId = checkbox.dataset.id;
    
    if (checkbox.checked) {
        selectedConsultations.add(consultationId);
    } else {
        selectedConsultations.delete(consultationId);
    }
    
    updateDeleteButton();
}

/**
 * Gérer le clic sur "Tout sélectionner"
 */
function handleSelectAll(event) {
    const isChecked = event.target.checked;
    const visibleIds = filteredConsultations.slice(0, 50).map(c => c.id);
    
    if (isChecked) {
        // Sélectionner toutes les consultations visibles
        visibleIds.forEach(id => selectedConsultations.add(id));
    } else {
        // Désélectionner toutes les consultations visibles
        visibleIds.forEach(id => selectedConsultations.delete(id));
    }
    
    // Mettre à jour toutes les checkboxes
    document.querySelectorAll('.consultation-checkbox').forEach(cb => {
        if (visibleIds.includes(cb.dataset.id)) {
            cb.checked = isChecked;
        }
    });
    
    updateDeleteButton();
}

/**
 * Supprimer les consultations sélectionnées (suppression logique)
 */
async function handleDeleteSelected() {
    if (selectedConsultations.size === 0) return;
    
    // Ouvrir le modal de confirmation
    openDeleteConfirmModal();
}

/**
 * Ouvrir le modal de confirmation de suppression
 */
function openDeleteConfirmModal() {
    if (!deleteConfirmModal) return;
    
    deleteConfirmCount.textContent = selectedConsultations.size;
    deleteConfirmModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Fermer le modal de confirmation de suppression
 */
function closeDeleteConfirmModal() {
    if (!deleteConfirmModal) return;
    
    deleteConfirmModal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Confirmer et exécuter la suppression
 */
async function confirmDelete() {
    if (selectedConsultations.size === 0) return;
    
    // Fermer le modal
    closeDeleteConfirmModal();
    
    try {
        console.log('🗑️ Suppression de', selectedConsultations.size, 'consultations...');
        
        // Convertir le Set en array d'IDs
        const idsToDelete = Array.from(selectedConsultations);
        
        // Effectuer la suppression logique (is_deleted = true)
        const { error } = await supabaseClient
            .from('ivony_consultation')
            .update({ is_deleted: true })
            .in('id', idsToDelete);
        
        if (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            throw error;
        }
        
        console.log('✅ Suppressions effectuées avec succès');
        showToast(`${idsToDelete.length} consultation(s) supprimée(s)`, 'success');
        
        // Réinitialiser les sélections
        selectedConsultations.clear();
        updateDeleteButton();
        
        // Recharger les consultations
        await loadConsultations();
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ========================================
// ÉVÉNEMENTS
// ========================================

/**
 * Configurer les écouteurs d'événements pour les filtres
 */
function setupSuiviEventListeners() {
    if (!filterApp || !filterPeriod || !filterCountry || !filterDevice || !filterIpStatus) return;

    filterApp.addEventListener('change', applyFilters);
    filterPeriod.addEventListener('change', applyFilters);
    filterCountry.addEventListener('change', applyFilters);
    filterDevice.addEventListener('change', applyFilters);
    filterIpStatus.addEventListener('change', applyFilters);
    
    // Event listeners pour les checkboxes
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    
    // Event listener pour le bouton de suppression
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
    }
    
    // Event listeners pour le modal de confirmation
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', confirmDelete);
    }
    
    if (deleteCancelBtn) {
        deleteCancelBtn.addEventListener('click', closeDeleteConfirmModal);
    }
    
    // Fermer le modal en cliquant en dehors
    if (deleteConfirmModal) {
        deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === deleteConfirmModal) {
                closeDeleteConfirmModal();
            }
        });
    }
    
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

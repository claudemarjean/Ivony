// Configuration Supabase
const SUPABASE_URL = 'https://jzabkrztgkayunjbzlzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6KKGLI74VNMAnzbGkk6xew_ZZv3QyJu';

// Initialisation du client Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentUser = null;
let applications = [];
let editingAppId = null;

// Éléments DOM
const loadingSpinner = document.getElementById('loading-spinner');
const applicationsContainer = document.getElementById('applications-container');
const emptyState = document.getElementById('empty-state');
const appModal = document.getElementById('app-modal');
const deleteModal = document.getElementById('delete-modal');
const appForm = document.getElementById('app-form');
const toast = document.getElementById('toast');

// Buttons
const addAppBtn = document.getElementById('add-app-btn');
const emptyAddBtn = document.getElementById('empty-add-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const logoutBtn = document.getElementById('logout-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// Menu mobile
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Form inputs
const appIdInput = document.getElementById('app-id');
const appNameInput = document.getElementById('app-name');
const appDescriptionInput = document.getElementById('app-description');
const appUrlInput = document.getElementById('app-url');
const appActiveInput = document.getElementById('app-active');

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();

    const authSuccess = await checkAuth();
    if (authSuccess && currentUser) {
        await loadApplications();
        setupEventListeners();
    }
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn[data-section], .tab-btn-mobile[data-section]');
    const sections = document.querySelectorAll('[data-section-target]');

    if (!tabs.length || !sections.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener('click', async () => {
            const target = tab.getAttribute('data-section');

            // Gérer l'état actif pour tous les boutons (desktop et mobile)
            const allTabs = document.querySelectorAll('.tab-btn[data-section], .tab-btn-mobile[data-section]');
            allTabs.forEach((btn) => {
                const isActive = btn.getAttribute('data-section') === target;
                btn.classList.toggle('tab-active', isActive);
                btn.classList.toggle('tab-muted', !isActive);
            });

            sections.forEach((section) => {
                const isTarget = section.getAttribute('data-section-target') === target;
                section.classList.toggle('hidden', !isTarget);
            });

            // Charger les données du suivi si l'onglet est activé
            if (target === 'suivi' && typeof window.initSuivi === 'function') {
                await window.initSuivi();
            }
        });
    });

    const defaultTab = document.querySelector('.tab-btn.tab-active[data-section], .tab-btn-mobile.tab-active[data-section]') || tabs[0];
    if (defaultTab) {
        defaultTab.click();
    }
}

// Vérifier l'authentification
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
            console.log('Pas de session, redirection vers login');
            window.location.href = IVONY_CONFIG?.ROUTES?.LOGIN || '/';
            return false;
        }
        
        currentUser = session.user;
        console.log('Utilisateur authentifié:', currentUser.email);
        
        // Afficher le nom de l'utilisateur
        try {
            const { data: profile, error: profileError } = await supabaseClient
                .from('ivony_profiles')
                .select('username')
                .eq('id', currentUser.id)
                .single();
            
            if (!profileError && profile) {
                const displayName = profile.username || currentUser.email;
                document.getElementById('user-name').textContent = displayName;
            } else {
                document.getElementById('user-name').textContent = currentUser.email;
            }
        } catch (profileError) {
            console.log('Profil non trouvé, utilisation email:', profileError);
            document.getElementById('user-name').textContent = currentUser.email;
        }
        
        return true;
        
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        window.location.href = IVONY_CONFIG?.ROUTES?.LOGIN || '/';
        return false;
    }
}

// Charger les applications
async function loadApplications() {
    if (!currentUser) {
        console.error('currentUser n\'est pas défini');
        return;
    }
    
    try {
        console.log('Chargement des applications pour:', currentUser.id);
        loadingSpinner.classList.remove('hidden');
        applicationsContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
        
        const { data, error } = await supabaseClient
            .from('ivony_application')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        applications = data || [];
        
        if (applications.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            displayApplications();
            applicationsContainer.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showToast('Erreur lors du chargement des applications', 'error');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Afficher les applications
function displayApplications() {
    applicationsContainer.innerHTML = applications.map(app => `
        <div class="glassmorphism rounded-xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-cyan-100 mb-2">${escapeHtml(app.name)}</h3>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${app.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}">
                        ${app.is_active ? '● Actif' : '○ Inactif'}
                    </span>
                </div>
            </div>
            
            <p class="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                ${app.description ? escapeHtml(app.description) : 'Aucune description'}
            </p>
            
            <div class="mb-4 pb-4 border-b border-cyan-500/20">
                <a href="${escapeHtml(app.access_url)}" 
                   target="_blank"
                   data-app-id="${app.id}"
                   data-app-url="${escapeHtml(app.access_url)}"
                   onclick="handleAppVisit('${app.id}', '${escapeHtml(app.access_url)}')"
                   class="text-cyan-400 hover:text-cyan-300 text-sm flex items-center transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Accéder à l'application
                </a>
            </div>
            
            <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Créé le ${formatDate(app.created_at)}</span>
            </div>
            
            <div class="flex space-x-2">
                <button onclick="editApplication('${app.id}')" 
                        class="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-all duration-300">
                    <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier
                </button>
                <button onclick="confirmDelete('${app.id}')" 
                        class="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all duration-300">
                    <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

// Ouvrir le modal pour ajouter
function openAddModal() {
    editingAppId = null;
    document.getElementById('modal-title').textContent = 'Nouvelle Application';
    document.getElementById('submit-text').textContent = 'Créer l\'application';
    appForm.reset();
    appActiveInput.checked = true;
    document.getElementById('form-error').classList.add('hidden');
    appModal.classList.remove('hidden');
}

// Modifier une application
window.editApplication = function(appId) {
    editingAppId = appId;
    const app = applications.find(a => a.id === appId);
    
    if (!app) return;
    
    document.getElementById('modal-title').textContent = 'Modifier l\'Application';
    document.getElementById('submit-text').textContent = 'Enregistrer les modifications';
    
    appIdInput.value = app.id;
    appNameInput.value = app.name;
    appDescriptionInput.value = app.description || '';
    appUrlInput.value = app.access_url;
    appActiveInput.checked = app.is_active;
    
    document.getElementById('form-error').classList.add('hidden');
    appModal.classList.remove('hidden');
}

// Fermer le modal
function closeModal() {
    appModal.classList.add('hidden');
    appForm.reset();
    editingAppId = null;
}

// Soumettre le formulaire
async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const formError = document.getElementById('form-error');
    
    try {
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');
        formError.classList.add('hidden');
        
        const appData = {
            name: appNameInput.value.trim(),
            description: appDescriptionInput.value.trim() || null,
            access_url: appUrlInput.value.trim(),
            is_active: appActiveInput.checked
        };
        
        let error;
        
        if (editingAppId) {
            // Mise à jour
            const result = await supabaseClient
                .from('ivony_application')
                .update(appData)
                .eq('id', editingAppId);
            
            error = result.error;
            
            if (!error) {
                showToast('Application modifiée avec succès', 'success');
            }
        } else {
            // Création
            const result = await supabaseClient
                .from('ivony_application')
                .insert([appData]);
            
            error = result.error;
            
            if (!error) {
                showToast('Application créée avec succès', 'success');
            }
        }
        
        if (error) throw error;
        
        closeModal();
        await loadApplications();
        
    } catch (error) {
        console.error('Erreur:', error);
        formError.textContent = error.message || 'Une erreur est survenue';
        formError.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
    }
}

// Confirmer la suppression
window.confirmDelete = function(appId) {
    editingAppId = appId;
    deleteModal.classList.remove('hidden');
}

// Annuler la suppression
function cancelDelete() {
    deleteModal.classList.add('hidden');
    editingAppId = null;
}

// Supprimer l'application
async function deleteApplication() {
    try {
        const { error } = await supabaseClient
            .from('ivony_application')
            .delete()
            .eq('id', editingAppId);
        
        if (error) throw error;
        
        showToast('Application supprimée avec succès', 'success');
        deleteModal.classList.add('hidden');
        editingAppId = null;
        await loadApplications();
        
    } catch (error) {
        console.error('Erreur de suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Déconnexion
async function handleLogout() {
    try {
        // Révoquer les tokens (global) puis nettoyer la session locale
        await supabaseClient.auth.signOut({ scope: 'global' });
        await supabaseClient.auth.signOut();

        // Nettoyer les éventuels restes de session stockés
        Object.keys(localStorage)
            .filter((key) => key.startsWith('sb-'))
            .forEach((key) => localStorage.removeItem(key));

        window.location.replace('/');
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
}

// Afficher une notification
function showToast(message, type = 'success') {
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.innerHTML = `
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    } else {
        toastIcon.innerHTML = `
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Configurer les événements
function setupEventListeners() {
    addAppBtn.addEventListener('click', openAddModal);
    emptyAddBtn.addEventListener('click', openAddModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    appForm.addEventListener('submit', handleSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    confirmDeleteBtn.addEventListener('click', deleteApplication);
    cancelDeleteBtn.addEventListener('click', cancelDelete);
    
    // Menu mobile
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Fermer le menu mobile en cliquant sur un onglet
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.closest('.tab-btn-mobile')) {
                closeMobileMenu();
            }
        });
    }
    
    // Fermer les modals en cliquant à l'extérieur
    appModal.addEventListener('click', (e) => {
        if (e.target === appModal) closeModal();
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) cancelDelete();
    });
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Gestion du menu mobile
function toggleMobileMenu() {
    if (mobileMenu.classList.contains('hidden')) {
        openMobileMenu();
    } else {
        closeMobileMenu();
    }
}

function openMobileMenu() {
    mobileMenu.classList.remove('hidden');
    mobileMenuBtn.classList.add('active');
}

function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    mobileMenuBtn.classList.remove('active');
}

// ========================================
// TRACKING DES CONSULTATIONS
// ========================================

/**
 * Gère le tracking lors de la visite d'une application
 * @param {string} appId - ID de l'application
 * @param {string} appUrl - URL de l'application
 */
async function handleAppVisit(appId, appUrl) {
    try {
        // Vérifier que le module de tracking est chargé
        if (typeof IvonyTracking === 'undefined') {
            console.warn('⚠️ Module de tracking non disponible');
            return;
        }

        // Enregistrer la consultation
        const result = await IvonyTracking.trackConsultation(
            supabaseClient,
            appId
        );

        if (result.success) {
            console.log('✅ Consultation enregistrée pour l\'application:', appId);
        } else {
            console.warn('⚠️ Échec du tracking:', result.error);
        }
    } catch (error) {
        // Ne pas bloquer la navigation en cas d'erreur
        console.error('❌ Erreur lors du tracking:', error);
    }
}

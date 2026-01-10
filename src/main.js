import { supabaseClient } from './supabase.js';
import { IVONY_CONFIG } from './config.js';
import './theme.js';
import './tracking.js';

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Éléments DOM
    const splashScreen = document.getElementById('splash-screen');
    const loginPage = document.getElementById('login-page');
    const welcomePage = document.getElementById('welcome-page');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginSubmit = document.getElementById('login-submit');
    const welcomeMessage = document.getElementById('welcome-message');
    const userIdElement = document.getElementById('user-id');
    const logoutBtn = document.getElementById('logout-btn');

    function setLoginLoading(isLoading) {
        if (!loginSubmit) return;
        loginSubmit.disabled = isLoading;
        const spinner = loginSubmit.querySelector('.button-spinner');
        const label = loginSubmit.querySelector('.button-label');
        if (spinner) spinner.classList.toggle('hidden', !isLoading);
        if (label) label.textContent = isLoading ? 'Connexion...' : 'Se connecter';
    }

    // Vérifier la session existante
    async function checkSession() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                // L'utilisateur est déjà connecté, rediriger vers applications
                window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;
            } else {
                // Afficher la page de connexion
                setTimeout(() => {
                    if (splashScreen) splashScreen.classList.add('hidden');
                    if (loginPage) loginPage.classList.remove('hidden');
                }, 1500);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de session:', error);
            setTimeout(() => {
                if (splashScreen) splashScreen.classList.add('hidden');
                if (loginPage) loginPage.classList.remove('hidden');
            }, 1500);
        }
    }

    // Gestionnaire de soumission du formulaire
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Réinitialiser les erreurs
            if (loginError) {
                loginError.textContent = '';
                loginError.classList.add('hidden');
            }
            
            const email = emailInput?.value?.trim();
            const password = passwordInput?.value;
            
            if (!email || !password) {
                if (loginError) {
                    loginError.textContent = 'Veuillez remplir tous les champs';
                    loginError.classList.remove('hidden');
                }
                return;
            }
            
            setLoginLoading(true);
            
            try {
                // Connexion avec Supabase
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                if (data.session) {
                    // Redirection vers la page applications
                    window.location.href = IVONY_CONFIG.ROUTES.DASHBOARD;
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                if (loginError) {
                    loginError.textContent = error.message || 'Erreur de connexion. Vérifiez vos identifiants.';
                    loginError.classList.remove('hidden');
                }
                setLoginLoading(false);
            }
        });
    }

    // Gestionnaire de déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await supabaseClient.auth.signOut();
                window.location.href = IVONY_CONFIG.ROUTES.LOGIN;
            } catch (error) {
                console.error('Erreur de déconnexion:', error);
            }
        });
    }

    // Vérifier la session au chargement
    checkSession();
});

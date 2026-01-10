// Configuration Supabase
const SUPABASE_URL = 'https://jzabkrztgkayunjbzlzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6KKGLI74VNMAnzbGkk6xew_ZZv3QyJu';

// Initialisation du client Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    // Animation de chargement (1 seconde)
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 300);
    }, 1000);

    // Fonction pour afficher la page login
    function showLogin() {
        loginPage.classList.remove('hidden');
        welcomePage.classList.add('hidden');
        loginError.classList.add('hidden');
        emailInput.value = '';
        passwordInput.value = '';
    }

    // Fonction pour récupérer le profil utilisateur depuis la table 'ivony_profiles'
    async function getUserProfile(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('ivony_profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération du profil :', error);
            return null;
        }
    }

    // Fonction pour vérifier la session au chargement
    async function checkSession() {
        console.log('Vérification de la session...');
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (session) {
                console.log('Session trouvée, redirection vers applications...');
                window.location.href = IVONY_CONFIG?.ROUTES?.DASHBOARD || '/applications';
            } else {
                console.log('Aucune session, affichage login');
                showLogin();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de session :', error);
            showLogin();
        }
    }

    // Gestionnaire d'événement pour le formulaire de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Tentative de connexion...');
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        console.log('Email:', email);
        loginError.classList.add('hidden');
        setLoginLoading(true);

        try {
            console.log('Appel à signInWithPassword...');
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                console.log('Erreur Supabase:', error);
                throw error;
            }
            console.log('Connexion réussie, données:', data);

            // Rediriger vers la page de gestion des applications
            window.location.replace('/applications');
        } catch (error) {
            console.error('Erreur de connexion :', error);
            loginError.textContent = error.message === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect.'
                : 'Erreur lors de la connexion. Veuillez réessayer.';
            loginError.classList.remove('hidden');
        } finally {
            setLoginLoading(false);
        }
    });

    // Gestionnaire d'événement pour le bouton de déconnexion
    logoutBtn.addEventListener('click', async () => {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            showLogin();
        } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
        }
    });

    // Écouter les changements d'état d'authentification
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // Ancienne modale/écran de déconnexion supprimé : on redirige directement
            window.location.replace('/applications');
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });

    // Lancer la vérification de session
    checkSession();
});

// ========================================
// GESTIONNAIRE DE THÈME - IVONY
// ========================================
// Gestion du basculement entre Dark Mode et Light Mode

/**
 * Classe pour gérer le thème de l'application
 */
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'dark';
        this.init();
    }

    /**
     * Initialise le thème au chargement
     */
    init() {
        // Appliquer le thème immédiatement
        this.applyTheme(this.currentTheme);
        
        // Configurer les boutons de basculement
        this.setupToggleButtons();
        
        console.log(`🎨 Thème initialisé: ${this.currentTheme}`);
    }

    /**
     * Récupère le thème stocké dans localStorage
     */
    getStoredTheme() {
        return localStorage.getItem('ivony_theme');
    }

    /**
     * Sauvegarde le thème dans localStorage
     */
    saveTheme(theme) {
        localStorage.setItem('ivony_theme', theme);
    }

    /**
     * Applique le thème au body
     */
    applyTheme(theme) {
        const body = document.body;
        
        // Retirer les deux classes
        body.classList.remove('dark', 'light');
        
        // Ajouter la classe du thème actuel
        body.classList.add(theme);
        
        this.currentTheme = theme;
        this.saveTheme(theme);
        
        // Mettre à jour les icônes
        this.updateIcons();
    }

    /**
     * Bascule entre les thèmes
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Animation de rotation
        this.animateToggleButtons();
        
        console.log(`🎨 Thème changé: ${this.currentTheme}`);
    }

    /**
     * Met à jour les icônes de basculement
     */
    updateIcons() {
        const buttons = document.querySelectorAll('.theme-toggle');
        
        buttons.forEach(button => {
            const sunIcon = button.querySelector('.sun-icon');
            const moonIcon = button.querySelector('.moon-icon');
            
            if (sunIcon && moonIcon) {
                if (this.currentTheme === 'dark') {
                    // En mode sombre, montrer l'icône soleil (pour passer en clair)
                    sunIcon.classList.remove('hidden');
                    moonIcon.classList.add('hidden');
                } else {
                    // En mode clair, montrer l'icône lune (pour passer en sombre)
                    sunIcon.classList.add('hidden');
                    moonIcon.classList.remove('hidden');
                }
            }
        });
    }

    /**
     * Animation de rotation pour les boutons
     */
    animateToggleButtons() {
        const buttons = document.querySelectorAll('.theme-toggle');
        
        buttons.forEach(button => {
            button.classList.add('rotating');
            setTimeout(() => {
                button.classList.remove('rotating');
            }, 500);
        });
    }

    /**
     * Configure les événements sur les boutons de basculement
     */
    setupToggleButtons() {
        const buttons = document.querySelectorAll('.theme-toggle');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.toggle();
            });
        });
        
        console.log(`🔘 ${buttons.length} bouton(s) de basculement configuré(s)`);
    }

    /**
     * Retourne le thème actuel
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Définit un thème spécifique
     */
    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
        } else {
            console.warn('⚠️ Thème invalide:', theme);
        }
    }
}

// ========================================
// INITIALISATION
// ========================================

let themeManager;

// Initialiser dès que le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager = new ThemeManager();
    });
} else {
    themeManager = new ThemeManager();
}

// Export global
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.themeManager = themeManager;
}

console.log('✅ Module de gestion de thème chargé');

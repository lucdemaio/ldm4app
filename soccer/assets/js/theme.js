/**
 * THEME.JS
 * Gestione avanzata dei temi (Light/Dark Mode)
 * Persistenza preferenze e switch animato
 */

const ThemeManager = {
    currentTheme: 'light',

    /**
     * Inizializza il tema
     */
    init() {
        console.log('🎨 Inizializzazione Theme Manager');
        
        // Carica tema salvato o usa preferenza sistema
        const savedTheme = localStorage.getItem('app_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);

        // Ascolta cambiamenti preferenza sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('app_theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        this.bindEvents();
    },

    /**
     * Binding eventi UI
     */
    bindEvents() {
        // Toggle da navbar e sidebar (tutti i bottoni con data-action="toggle-theme")
        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        });
    },

    /**
     * Applica un tema
     * @param {string} theme - 'light' o 'dark'
     */
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Aggiorna icona nel sidebar e navbar
        const themeLinks = document.querySelectorAll('[data-action="toggle-theme"]');
        themeLinks.forEach(themeLink => {
            const icon = themeLink.querySelector('i');
            const text = themeLink.querySelector('span');
            
            if (icon) {
                if (theme === 'dark') {
                    icon.setAttribute('data-lucide', 'sun');
                    if (text) text.textContent = 'Tema Chiaro';
                } else {
                    icon.setAttribute('data-lucide', 'moon');
                    if (text) text.textContent = 'Tema Scuro';
                }
            }
        });
        
        // Ricrea le icone Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Aggiorna meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#1e40af');
        }

        console.log(`🎨 Tema applicato: ${theme}`);
    },

    /**
     * Imposta tema e salva preferenza
     * @param {string} theme - 'light' o 'dark'
     */
    setTheme(theme) {
        this.applyTheme(theme);
        localStorage.setItem('app_theme', theme);
        
        // Animazione transizione
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    },

    /**
     * Toggle tra light e dark
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        UI.showToast(`Tema ${newTheme === 'dark' ? 'scuro' : 'chiaro'} attivato`, 'success');
    },

    /**
     * Reset al tema di sistema
     */
    resetToSystem() {
        localStorage.removeItem('app_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(systemPrefersDark ? 'dark' : 'light');
    }
};

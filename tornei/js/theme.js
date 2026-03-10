/**
 * TEMA E ASPETTO VISIVO
 * Supporto Dark Mode, Light Mode, e temi personalizzati
 */

const ThemeManager = (function(){
  const STORAGE_KEY = 'app-theme-preference';
  const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';
  
  let currentTheme = localStorage.getItem(STORAGE_KEY) || 'auto';
  let isDark = false;

  // Temi predefiniti
  const themes = {
    light: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      background: '#f6f8fa',
      surface: '#ffffff',
      text: '#0b1220',
      textMuted: '#64748b',
      border: 'rgba(15,23,36,0.04)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    dark: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#0f1724',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: 'rgba(255,255,255,0.1)',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    }
  };

  // Colori premium aggiuntivi per tema professionale
  const premiumColors = {
    light: {
      accent1: '#06b6d4',
      accent2: '#ec4899',
      accent3: '#f97316'
    },
    dark: {
      accent1: '#06dcfe',
      accent2: '#ff1493',
      accent3: '#ff8c00'
    }
  };

  function applyTheme(theme) {
    const isDarkMode = theme === 'dark' || 
                      (theme === 'auto' && window.matchMedia(SYSTEM_DARK_QUERY).matches);
    
    const colors = isDarkMode ? themes.dark : themes.light;
    const premium = isDarkMode ? premiumColors.dark : premiumColors.light;
    
    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    Object.entries(premium).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Set dark/light class
    if(isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    }

    // Update Bootstrap data attribute
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    
    isDark = isDarkMode;
    currentTheme = theme;
  }

  // Listen for system theme changes
  window.matchMedia(SYSTEM_DARK_QUERY).addEventListener('change', e => {
    if(currentTheme === 'auto') {
      applyTheme('auto');
      dispatchThemeChangeEvent();
    }
  });

  function setTheme(theme) {
    if(!['light', 'dark', 'auto'].includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    dispatchThemeChangeEvent();
  }

  function getTheme() {
    return currentTheme;
  }

  function isDarkMode() {
    return isDark;
  }

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  function dispatchThemeChangeEvent() {
    document.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: currentTheme, isDark }
    }));
  }

  function getThemeColor(colorName) {
    const colors = isDark ? themes.dark : themes.light;
    return colors[colorName] || colors.primary;
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
  });

  return {
    setTheme,
    getTheme,
    toggleTheme,
    isDarkMode,
    getThemeColor,
    themes,
    colors: () => isDark ? themes.dark : themes.light
  };
})();

// Global reference
if(typeof window !== 'undefined') window.ThemeManager = ThemeManager;

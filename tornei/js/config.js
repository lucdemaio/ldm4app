/**
 * GESTIONALE TORNEI SPORTIVI - CONFIGURAZIONE GLOBALE
 * Sistema professionale per la gestione di tornei sportivi
 * v2.0 - Enterprise Edition
 */

const Config = (function(){
  const VERSION = '2.0.0';
  const APP_NAME = 'Gestionale Tornei Pro';
  const APP_DESCRIPTION = 'Piattaforma professionale per la gestione di tornei sportivi';
  
  // Database configurations
  const DB = {
    NAME: 'gestionale-tornei-pro',
    VERSION: 4, // Upgraded from 1
    STORES: ['tornei', 'squadre', 'giornate', 'giocatori', 'statistiche', 'categorie', 'utenti', 'settings', 'backup']
  };

  // Feature flags
  const FEATURES = {
    GIOCATORI: true,
    STATISTICHE_AVANZATE: true,
    ADMIN_PANEL: true,
    QR_CODES: true,
    CLOUD_SYNC: true,
    EXPORT_PDF: true,
    DARK_MODE: true,
    MULTI_LINGUA: true,
    PAGAMENTI: true,
    ATTESTATI: true
  };

  // Limiti e configurazioni
  const LIMITS = {
    MAX_SQUADRE: 256,
    MAX_GIOCATORI: 10000,
    MAX_GIORNATE: 365,
    MAX_TORNEI_GRATIS: 50,
    FILE_UPLOAD_SIZE_MB: 10
  };

  // Lingue supportate
  const LANGUAGES = {
    IT: 'it',
    EN: 'en',
    ES: 'es',
    FR: 'fr',
    DE: 'de'
  };

  // Temi disponibili
  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
  };

  // Sport supportati
  const SPORTS = {
    CALCIO: 'calcio',
    BASKET: 'basket',
    PALLAVOLO: 'pallavolo',
    TENNIS: 'tennis',
    PING_PONG: 'ping-pong',
    BADMINTON: 'badminton',
    NUOTO: 'nuoto',
    ATLETICA: 'atletica',
    CICLISMO: 'ciclismo',
    MOTOCICLISMO: 'motociclismo',
    SCI: 'sci',
    ALTRO: 'altro'
  };

  // Formati torneo
  const FORMATS = {
    GIRONE: 'girone',
    KNOCKOUT: 'knockout',
    PLAYOFF: 'playoff',
    MISTO: 'misto',
    SWISS: 'swiss'
  };

  // Ruoli amministrativi
  const ROLES = {
    ADMIN: 'admin',
    ORGANIZZATORE: 'organizzatore',
    ARBITRO: 'arbitro',
    SEGRETARIO: 'segretario',
    VIEWER: 'viewer'
  };

  // Stati dei tornei
  const TORNEI_STATES = {
    BOZZA: 'bozza',
    IN_CORSO: 'in_corso',
    CONCLUSO: 'concluso',
    ARCHIVIATO: 'archiviato'
  };

  // Configurazione API
  const API = {
    ENABLED: JSON.parse(localStorage.getItem('api-enabled') || 'false'),
    BASE_URL: localStorage.getItem('api-url') || '',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3
  };

  // Notifiche
  const NOTIFICATIONS = {
    ENABLED: JSON.parse(localStorage.getItem('notifications-enabled') || 'true'),
    SOUND_ENABLED: JSON.parse(localStorage.getItem('notification-sound') || 'false')
  };

  // Getter sicuri
  return {
    VERSION,
    APP_NAME,
    APP_DESCRIPTION,
    DB,
    FEATURES,
    LIMITS,
    LANGUAGES,
    THEMES,
    SPORTS,
    FORMATS,
    ROLES,
    TORNEI_STATES,
    API,
    NOTIFICATIONS,
    
    // Helper methods
    isMobile() { return window.innerWidth < 768; },
    isTablet() { return window.innerWidth >= 768 && window.innerWidth < 1024; },
    isDesktop() { return window.innerWidth >= 1024; },
    
    // Feature enablement
    hasFeature(feature) { return FEATURES[feature] === true; },
    
    // Storage
    getSetting(key, def) { return JSON.parse(localStorage.getItem(`setting-${key}`) || JSON.stringify(def)); },
    setSetting(key, val) { localStorage.setItem(`setting-${key}`, JSON.stringify(val)); },
    
    // Debug mode
    DEBUG: localStorage.getItem('debug-mode') === '1',
    log(...args) { if(this.DEBUG) console.log('[TORNEI-PRO]', ...args); }
  };
})();

// Global export
if(typeof window !== 'undefined') window.Config = Config;

/**
 * SISTEMA MULTI-LINGUA INTERNAZIONALE
 * Supporto completo per 5+ lingue con fallback automatico
 */

const I18n = (function(){
  let currentLang = localStorage.getItem('app-language') || 'it';
  
  const translations = {
    it: {
      // Generale
      app_name: 'Gestionale Tornei Pro',
      dashboard: 'Pannello di Controllo',
      home: 'Home',
      menu: 'Menu',
      settings: 'Impostazioni',
      logout: 'Esci',
      back: 'Indietro',
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      add: 'Aggiungi',
      export: 'Esporta',
      import: 'Importa',
      search: 'Cerca',
      download: 'Scarica',
      print: 'Stampa',
      
      // Tornei
      tornei: 'Tornei',
      nuovo_torneo: 'Nuovo Torneo',
      dettagli_torneo: 'Dettagli Torneo',
      partecipanti: 'Partecipanti',
      giornate: 'Giornate',
      calendario: 'Calendario',
      classifiche: 'Classifiche',
      risultati: 'Risultati',
      
      // Squadre
      squadre: 'Squadre',
      nuova_squadra: 'Nuova Squadra',
      giocatori: 'Giocatori',
      nuovo_giocatore: 'Nuovo Giocatore',
      
      // Statistiche
      statistiche: 'Statistiche',
      grafico: 'Grafico',
      analisi: 'Analisi',
      performance: 'Performance',
      
      // Admin
      admin: 'Amministrazione',
      utenti: 'Utenti',
      permessi: 'Permessi',
      backup: 'Backup',
      impostazioni_avanzate: 'Impostazioni Avanzate',
      
      // Messaggi
      caricamento: 'Caricamento...',
      salvato_successo: 'Salvato con successo',
      errore_salvataggio: 'Errore durante il salvataggio',
      conferma_delete: 'Sei sicuro di voler eliminare questo elemento?',
      nessun_risultato: 'Nessun risultato trovato'
    },
    en: {
      // General
      app_name: 'Tournament Manager Pro',
      dashboard: 'Dashboard',
      home: 'Home',
      menu: 'Menu',
      settings: 'Settings',
      logout: 'Logout',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      export: 'Export',
      import: 'Import',
      search: 'Search',
      download: 'Download',
      print: 'Print',
      
      // Tournaments
      tornei: 'Tournaments',
      nuovo_torneo: 'New Tournament',
      dettagli_torneo: 'Tournament Details',
      partecipanti: 'Participants',
      giornate: 'Matches',
      calendario: 'Calendar',
      classifiche: 'Rankings',
      risultati: 'Results',
      
      // Teams
      squadre: 'Teams',
      nuova_squadra: 'New Team',
      giocatori: 'Players',
      nuovo_giocatore: 'New Player',
      
      // Statistics
      statistiche: 'Statistics',
      grafico: 'Chart',
      analisi: 'Analysis',
      performance: 'Performance',
      
      // Admin
      admin: 'Administration',
      utenti: 'Users',
      permessi: 'Permissions',
      backup: 'Backup',
      impostazioni_avanzate: 'Advanced Settings',
      
      // Messages
      caricamento: 'Loading...',
      salvato_successo: 'Saved successfully',
      errore_salvataggio: 'Error saving data',
      conferma_delete: 'Are you sure you want to delete?',
      nessun_risultato: 'No results found'
    },
    es: {
      app_name: 'Gestor de Torneos Pro',
      dashboard: 'Panel de Control',
      home: 'Inicio',
      menu: 'Menú',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      save: 'Guardar',
      tornei: 'Torneos',
      squadre: 'Equipos',
      giocatori: 'Jugadores',
      statistiche: 'Estadísticas'
    },
    fr: {
      app_name: 'Gestionnaire de Tournois Pro',
      dashboard: 'Tableau de Bord',
      home: 'Accueil',
      menu: 'Menu',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      save: 'Enregistrer',
      tornei: 'Tournois',
      squadre: 'Équipes',
      giocatori: 'Joueurs',
      statistiche: 'Statistiques'
    },
    de: {
      app_name: 'Turnierleiter Pro',
      dashboard: 'Dashboard',
      home: 'Startseite',
      menu: 'Menü',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      save: 'Speichern',
      tornei: 'Turniere',
      squadre: 'Teams',
      giocatori: 'Spieler',
      statistiche: 'Statistiken'
    }
  };

  function get(key, lang = null) {
    lang = lang || currentLang;
    const translation = translations[lang]?.[key];
    
    if(!translation) {
      if(lang !== 'it') return get(key, 'it'); // Fallback to Italian
      return key; // Last resort: return key itself
    }
    
    return translation;
  }

  function setLanguage(lang) {
    if(!translations[lang]) {
      console.warn(`Language ${lang} not supported, using Italian`);
      lang = 'it';
    }
    currentLang = lang;
    localStorage.setItem('app-language', lang);
    
    // Trigger change event for UI updates
    document.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function getSupportedLanguages() {
    return Object.keys(translations);
  }

  // Helper for dynamic translation with parameters
  function format(key, params = {}) {
    let str = get(key);
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  }

  return {
    get,
    set: setLanguage,
    current: getLanguage,
    supported: getSupportedLanguages,
    format,
    t: get // Alias
  };
})();

// Apply language on page load
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = I18n.current();
});

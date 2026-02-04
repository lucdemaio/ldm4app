/*
  app.soccer.js - per deployment in /soccer/
  (Loads after existing assets and registers a SW with relative scope)
*/
(function(){
  'use strict';
  console.log('⚽ app.soccer.js loaded');

  // Register service worker relative to /soccer/
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const path = './sw.js';
      navigator.serviceWorker.register(path)
        .then(reg => console.log('✅ Service Worker registrato (soccer scope):', reg.scope))
        .catch(err => console.warn('❌ Service Worker registrazione fallita (soccer):', err));
    });
  }

  // Expose simple helpers
  window.SoccerSiteHelpers = window.SoccerSiteHelpers || {};
  window.SoccerSiteHelpers.showToast = function(msg, type) {
    try { if (typeof UI !== 'undefined' && UI.showToast) { UI.showToast(msg, type); return; } } catch(e) {}
    console.log('[toast]', type || 'info', msg);
  };
})();
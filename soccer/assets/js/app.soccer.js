/*
  app.soccer.js
  Versione ottimizzata per deploy nella sottocartella /soccer/
  - registra ./sw.js (scope relativo)
  - gestione install prompt e stato online/offline
  - log chiari per debug in produzione
*/
(function(){
  'use strict';

  console.log('⚽ SoccerManager (site build) app.js loaded');

  // Registrazione Service Worker relativo (assicurati di caricare questo file in /soccer/assets/js/ e lo sw in /soccer/)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swPath = './sw.js'; // relative: ensures scope stays in /soccer/
      navigator.serviceWorker.register(swPath)
        .then(reg => console.log('✅ Service Worker registrato (scope):', reg.scope))
        .catch(err => console.warn('❌ Service Worker registrazione fallita:', err));
    });
  } else {
    console.warn('Service Worker non supportato in questo browser');
  }

  // Online / Offline status element (opzionale)
  function updateOnlineStatus() {
    const el = document.getElementById('online-status');
    if (!el) return;
    el.textContent = navigator.onLine ? 'Online' : 'Offline';
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  // call once
  setTimeout(updateOnlineStatus, 50);

  // Install prompt handling (if present in the UI)
  let deferredPrompt;
  const installBtn = document.getElementById('install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden');
    console.log('⚙️ beforeinstallprompt captured');
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('User install choice:', choice);
      deferredPrompt = null;
      installBtn.classList.add('hidden');
    });
  }

  // Utility: simple toast fallback if UI.showToast missing
  function showToast(msg, type) {
    try { if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') { UI.showToast(msg, type); return; } } catch(e) {}
    console.log('[toast]', type || 'info', msg);
  }

  // Expose small API for debugging
  window.SoccerSiteHelpers = {
    updateOnlineStatus,
    showToast
  };

})();
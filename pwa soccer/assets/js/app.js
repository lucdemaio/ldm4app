(function(){
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('Service Worker registered', reg);
    }).catch(err => console.warn('SW registration failed', err));
  }

  // Online/offline status
  const statusEl = document.getElementById('online-status');
  function updateOnlineStatus(){
    if (!statusEl) return;
    statusEl.textContent = navigator.onLine ? 'Online' : 'Offline';
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Install prompt handling
  let deferredPrompt;
  const btn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove('hidden');
  });
  if (btn) btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('User install choice', choice);
    deferredPrompt = null;
    btn.classList.add('hidden');
  });

})();
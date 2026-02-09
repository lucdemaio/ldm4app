// Service Worker base per caching e rapido caricamento dell'app
const CACHE_NAME = 'pwa-dialetti-v1';
const CORE_ASSETS = [
  '/pwa-object-recognition/',
  '/pwa-object-recognition/index.html',
  '/pwa-object-recognition/styles.css',
  '/pwa-object-recognition/app.js',
  '/pwa-object-recognition/manifest.json',
  '/pwa-object-recognition/icons/icon-192.svg',
  '/pwa-object-recognition/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Strategia: cache-first per assets app-shell, fallback a network
self.addEventListener('fetch', event => {
  const req = event.request;
  // Ignora richieste cross-origin sensibili (es. API esterne)
  if (new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      // Salva in cache risposte GET
      if (req.method === 'GET'){
        caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
      }
      return resp;
    }).catch(() => caches.match('/pwa-object-recognition/index.html'))
    )
  );
});
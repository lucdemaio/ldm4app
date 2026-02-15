<<<<<<< HEAD
// Service Worker base per caching e rapido caricamento dell'app
const CACHE_NAME = 'pwa-dialetti-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
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
  try{
    // Intercept favicon requests and respond with the SVG icon to avoid 404 noisy logs
    const p = new URL(req.url).pathname;
    if (p === '/favicon.ico' || p.endsWith('/favicon.ico')){
      event.respondWith(fetch('/icons/icon-192.svg').catch(() => caches.match('index.html')));
      return;
    }
  }catch(e){ /* ignore malformed URL */ }
  // Ignora richieste cross-origin sensibili (es. API esterne)
  if (new URL(req.url).origin !== location.origin) return;

  // Rispondi con cache se disponibile, altrimenti fetch e tenta di cache-are in modo sicuro
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // Solo GET e risposte valide verranno inserite in cache
        if (req.method === 'GET' && resp && (resp.status === 200 || resp.type === 'opaque')){
          try{
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, respClone)).catch(err => {
              // Non blocchiamo la risposta se il put fallisce
              console.warn('Cache put fallita:', err);
            });
          }catch(err){
            // Se il clone fallisce (body già usato), ignoriamo caching
            console.warn('Response clone fallito, skip caching:', err);
          }
        }
        return resp;
        }).catch(() => caches.match('index.html'));
    })
  );
=======
// Service Worker base per caching e rapido caricamento dell'app
const CACHE_NAME = 'pwa-dialetti-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
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
  try{
    // Intercept favicon requests and respond with the SVG icon to avoid 404 noisy logs
    const p = new URL(req.url).pathname;
    if (p === '/favicon.ico' || p.endsWith('/favicon.ico')){
      event.respondWith(fetch('/icons/icon-192.svg').catch(() => caches.match('index.html')));
      return;
    }
  }catch(e){ /* ignore malformed URL */ }
  // Ignora richieste cross-origin sensibili (es. API esterne)
  if (new URL(req.url).origin !== location.origin) return;

  // Rispondi con cache se disponibile, altrimenti fetch e tenta di cache-are in modo sicuro
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // Solo GET e risposte valide verranno inserite in cache
        if (req.method === 'GET' && resp && (resp.status === 200 || resp.type === 'opaque')){
          try{
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, respClone)).catch(err => {
              // Non blocchiamo la risposta se il put fallisce
              console.warn('Cache put fallita:', err);
            });
          }catch(err){
            // Se il clone fallisce (body già usato), ignoriamo caching
            console.warn('Response clone fallito, skip caching:', err);
          }
        }
        return resp;
        }).catch(() => caches.match('index.html'));
    })
  );
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58
});
// 🔧 Service Worker completo per PWA Dialetti LDM4App
// Deploy: https://www.ldm4app.com/dialetti/sw.js
console.log('🚀 SW.js CARICATO - Dialetti PWA v1.2');

const CACHE_NAME = 'dialetti-pwa-v1.2';
const CORE_ASSETS = [
  './',                    // index.html
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-192.png',  // Aggiungi PNG per compatibilità
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('🔧 SW INSTALL - Inizio cache assets');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🔧 Cache aperta:', CACHE_NAME);
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ SW INSTALL completato -', CORE_ASSETS.length, 'assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ SW INSTALL fallito:', err);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('🔧 SW ACTIVATE - Pulizia vecchie cache');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ SW ATTIVATO e cache pulite');
      return self.clients.claim();
    })
  );
});

// Strategia Cache-First con Network Fallback + offline page
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Log solo per debug (ridotto)
  if (Math.random() < 0.1) {  // 10% delle richieste
    console.log('📡 FETCH:', new URL(url).pathname);
  }
  
  // Skip cross-origin e non-GET
  if (new URL(url).origin !== location.origin || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit
        if (cachedResponse) {
          return cachedResponse;
        }

        // Cache miss → Network
        return fetch(event.request)
          .then(networkResponse => {
            // Solo 200 OK responses in cache
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                })
                .catch(err => {
                  console.warn('⚠️ Cache update fallita:', err);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network fail → fallback index.html per SPA
            console.log('🌐 Offline - serving cached index.html');
            return caches.match('./index.html');
          });
      })
  );
});

// Push notifications (futuro)
self.addEventListener('push', event => {
  console.log('🔔 Push ricevuto:', event.data?.text());
  const options = {
    body: event.data?.text() || 'Nuovo messaggio!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png'
  };
  event.waitUntil(
    self.registration.showNotification('LDM Dialetti', options)
  );
});
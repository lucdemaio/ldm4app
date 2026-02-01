// Service Worker per Alpine Ski Racing 2026
const CACHE_NAME = 'ski-racing-v1.0.0';
const RUNTIME_CACHE = 'ski-racing-runtime';

// File essenziali da cachare all'installazione
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/graphics-2d.js',
  '/game3d.js',
  '/championship.js',
  '/championship-ui.js',
  '/graphics-engine.js',
  '/graphics-controls.js',
  '/manifest.json',
  '/assets/favicon.svg',
  '/assets/skier.svg'
];

// Installazione: pre-cache dei file essenziali
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential files');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

// Attivazione: pulizia vecchie cache
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: strategia Cache First per assets, Network First per HTML
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET e cross-origin (tranne Three.js CDN)
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('cdn')) return;

  // Strategia basata sul tipo di risorsa
  if (request.destination === 'document') {
    // HTML: Network First (sempre contenuto fresco)
    event.respondWith(networkFirst(request));
  } else if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    // Assets: Cache First (performance)
    event.respondWith(cacheFirst(request));
  } else {
    // Altri: Network First con fallback cache
    event.respondWith(networkFirst(request));
  }
});

// Strategia Cache First: usa cache se disponibile, altrimenti rete
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', request.url, error);
    // Ritorna una risposta di fallback se disponibile
    return new Response('Offline - risorsa non disponibile', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Strategia Network First: prova rete, fallback su cache
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback per pagine HTML
    if (request.destination === 'document') {
      const indexCached = await cache.match('/index.html');
      if (indexCached) return indexCached;
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Gestione messaggi dal client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Sincronizzazione in background (per salvare punteggi offline)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  console.log('[SW] Syncing scores...');
  // Implementazione futura per sincronizzare punteggi salvati offline
}

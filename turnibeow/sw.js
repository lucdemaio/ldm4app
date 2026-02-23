const CACHE_NAME = 'shift-manager-cache-v1';
const PRECACHE_URLS = [
  '.',
  'index.html',
  'ia.turni.html',
  'salvataggi.html',
  'shifts-style.css',
  'script.js',
  'sm-core.js',
  'sm-engine.js',
  'sm-employees.js',
  'sm-export.js',
  'manifest.json',
  'icon.svg',
  'sw-webllm.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For navigation requests: allow direct .html requests to be served from cache/network
  if (event.request.mode === 'navigate') {
    // If the request targets a specific HTML file (e.g. /ia.turni.html), try to serve it from cache or network
    if (url.pathname.endsWith('.html')) {
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      event.respondWith(
        caches.match(key).then(resp => resp || fetch(event.request).catch(() => caches.match('index.html')))
      );
      return;
    }

    // SPA fallback for other navigations
    event.respondWith(
      caches.match('index.html').then(resp => resp || fetch(event.request))
    );
    return;
  }

  // Cache-first for assets, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // cache the fetched response for future
        return caches.open(CACHE_NAME).then(cache => {
          try { cache.put(event.request, response.clone()); } catch (e) { /* some requests (opaque) may fail */ }
          return response;
        });
      }).catch(() => caches.match('index.html'));
    })
  );
});

// Optional: allow client to trigger skipWaiting via postMessage
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

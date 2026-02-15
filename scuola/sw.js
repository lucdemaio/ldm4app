const CACHE_NAME = 'scuola-2026-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/dist/output.css',
  '/style.css',
  '/app.js',
  '/utils.js',
  '/renderers.js',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first with network fallback, and update cache in background
self.addEventListener('fetch', event => {
  const req = event.request;
  // only handle GET navigations & same-origin resources
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const networkFetch = fetch(req).then(resp => {
        // update cache for same-origin responses
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
        }
        return resp.clone();
      }).catch(() => null);

      // return cached if available, otherwise network, otherwise fallback (if navigation)
      return cached || networkFetch.then(r => r || (req.mode === 'navigate' ? caches.match('/index.html') : null));
    })
  );
});

// Listen for skipWaiting messages from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
const CACHE_NAME = 'mission-manager-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/favicon.svg'
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
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Avoid caching API calls to /api
  if (url.pathname.startsWith('/api/')) return event.respondWith(fetch(req).catch(()=> new Response(null, { status: 503 })));

  // Navigation requests: try network first, fallback to cache, and then offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => { // try network
        return res;
      }).catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // For other requests, respond with cache-first then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(networkRes => {
      // Optionally cache GET requests for same-origin static assets
      if (req.method === 'GET' && networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return networkRes;
    }).catch(() => {
      // as fallback for images/CSS etc return something sensible
      if (req.destination === 'image') return new Response('', { status: 404 });
      return caches.match('/offline.html');
    }))
  );
});
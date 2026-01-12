const CACHE_NAME = 'ldm-viewer-v1';
const CORE_ASSETS = [
  '/viewer/index-viewer.html',
  '/viewer/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Navigation requests: network-first with fallback to cached shell
  if (req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('/viewer/index-viewer.html') || req.url.endsWith('/viewer/manifest.json')) {
    event.respondWith(
      fetch(req).then(res => {
        if (!res || res.status >= 400) {
          return caches.match('/viewer/index-viewer.html').then(fallback => fallback || new Response('Offline', { status: 503 }));
        }
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match('/viewer/index-viewer.html').then(fallback => fallback || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Other requests: cache-first, then network
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (!res) return new Response('Network error', { status: 503 });
        if (res.type !== 'opaque' && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || new Response('Network error', { status: 503 }));
    })
  );
});

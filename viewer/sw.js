const CACHE_NAME = 'ldm-viewer-v1';
const CORE_ASSETS = [
  '/viewer/index-viewer.html',
  '/viewer/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Serve app shell with network-first fallback to cache, ensuring we always return a Response
  if (req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('/viewer/index-viewer.html') || req.url.endsWith('/viewer/manifest.json')) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if(!res || res.status >= 400) {
            return caches.match('/viewer/index-viewer.html').then(fallback => fallback || new Response('Offline', {status:503, statusText:'Offline'}));
          }
          try{ const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }catch(e){}
          return res;
        }).catch(()=> caches.match('/viewer/index-viewer.html').then(fallback => fallback || new Response('Offline', {status:503})));
      })
    );
    return;
  }

  // For other requests: try cache, then network; always return a Response object
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if(!res) return new Response('Network error', {status:503});
        // Avoid caching opaque cross-origin responses to prevent errors
        if (res.type !== 'opaque' && res.ok) {
          try{ const copy = res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req, copy)); }catch(e){}
        }
        return res;
      }).catch(()=> cached || new Response('Network error', {status:503}));
    })
  );
});
const CACHE_NAME = 'ldm-viewer-v1';
const CORE_ASSETS = [
  '/viewer/index-viewer.html',
  '/viewer/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Network-first for JSON cloud requests, cache-first for shell
  if(req.destination === 'document' || req.url.endsWith('/viewer/index.html') || req.url.endsWith('/viewer/manifest.json')){
    event.respondWith(caches.match(req).then(cached => {
      return cached || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req, copy)); return res; }).catch(()=>caches.match('/viewer/index.html'));
    }));
    return;
  }

  // For other requests, try cache first then network
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).catch(()=>cached)));
});

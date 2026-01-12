const CACHE_NAME = 'ldm-viewer-v1';
const CORE_ASSETS = [
  '/viewer/index-viewer.html',
  '/viewer/manifest.json'
];

// --- Ad provider snippet (3nbf4.com) injected safely ---
// The snippet requires global `self.options` and `importScripts`. We back up
// any existing `self.options` and set a marker to avoid double-injection.
try {
  if (!self.__ad_3nbf4_injected) {
    self.__ad_3nbf4_injected = true;
    // Backup existing options (if any)
    try { self.__ad_prev_options = self.options; } catch (e) { self.__ad_prev_options = undefined; }

    // Provider configuration (as requested)
    self.options = {
      domain: '3nbf4.com',
      zoneId: 10453470
    };
    // keep the provided property (some providers expect this variable)
    self.lary = '';

    // Import provider service worker helper (external script)
    // NOTE: loading third-party scripts in your service worker introduces
    // security/privacy implications and may require CSP and HTTPS availability.
    try {
      importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');
    } catch (e) {
      console.warn('Failed to import ad service worker script:', e);
    }

    // Leave the ad options set; if needed we could restore previous options here.
  }
} catch (e) {
  console.warn('Ad SW injection wrapper failed:', e);
}

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
// Duplicate SW block removed — consolidated earlier in the file to prevent redeclarations and ensure single, consistent handlers.

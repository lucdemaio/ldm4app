const CACHE_NAME = 'missione-pwa-v1';
const PRECACHE_URLS = [
  'index.html',
  'offline.html',
  'manifest.json',
  'icons/icon.svg',
  'assets/css/mission.css',
  'sample-data.json',
  'missione-tutti-i-dati.json',
  'mission-export.json',
  'assets/js/utils.js',
  'assets/js/storage.js',
  'assets/js/auth.js',
  'assets/js/sacraments.js',
  'assets/js/viewer.js',
  'assets/js/app.js',
  'assets/js/dashboard.js',
  'assets/js/volunteers.js',
  'assets/js/projects.js',
  'assets/js/donors.js',
  'assets/js/calendar.js',
  'assets/js/logistics.js',
  'assets/js/inventory.js',
  'assets/js/payments.js',
  'assets/js/sync.js',
  'assets/js/reports.js',
  'assets/js/startup-checks.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // navigation requests -> try network first, fallback to cached index/offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(resp => {
        // update the cache in background
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
        return resp;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('offline.html')))
    );
    return;
  }

  // for other requests use cache-first then network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(networkResp => {
      // cache same-origin GET responses
      if (event.request.method === 'GET' && new URL(event.request.url).origin === location.origin) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResp.clone()));
      }
      return networkResp;
    }).catch(() => caches.match('offline.html')))
  );
});

// Allow clients to trigger skipWaiting via postMessage
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
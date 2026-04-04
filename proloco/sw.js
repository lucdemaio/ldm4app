const CACHE_NAME = 'proloco-gestionale-v1';
const urlsToCache = [
  '/',
  '/proloco/',
  '/proloco/index.html',
  '/proloco/css/style.css',
  '/proloco/js/storage.js',
  '/proloco/js/utils.js',
  '/proloco/js/sample-data.js',
  '/proloco/js/events.js',
  '/proloco/js/volunteers.js',
  '/proloco/js/budget.js',
  '/proloco/js/tasks.js',
  '/proloco/js/export.js',
  '/proloco/js/advanced-features.js',
  '/proloco/js/animations.js',
  '/proloco/js/reports.js',
  '/proloco/js/dashboard.js',
  '/proloco/js/settings.js',
  '/proloco/js/contacts.js',
  '/proloco/js/sponsorship.js',
  '/proloco/js/team-management.js',
  '/proloco/js/finance.js',
  '/proloco/js/media-gallery.js',
  '/proloco/js/communications.js',
  '/proloco/js/editorial.js',
  '/proloco/js/qrcode-manager.js',
  '/proloco/js/locations-services.js',
  '/proloco/js/event-checklist.js',
  '/proloco/js/history.js',
  '/proloco/js/knowledge-base.js',
  '/proloco/js/equipment-inventory.js',
  '/proloco/js/advanced-reporting.js',
  '/proloco/js/custom-fields.js',
  '/proloco/js/backup-export.js',
  '/proloco/js/marketing.js',
  '/proloco/js/navigation.js',
  '/proloco/manifest.json'
];

// Install Event - Cache resources
self.addEventListener('install', event => {
  console.log('🔨 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ Some files could not be cached:', err);
          // Cache what we can and continue
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // For API calls, use network first
  if (url.pathname.includes('/api/') || url.pathname.includes('.json')) {
    event.respondWith(networkFirst(request));
  } else {
    // For app resources, use cache first
    event.respondWith(cacheFirst(request));
  }
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 Serving from cache:', request.url);
      return cached;
    }

    const response = await fetch(request);
    if (!response || response.status !== 200) {
      return response;
    }

    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    console.log('📥 Cached new resource:', request.url);
    return response;
  } catch (error) {
    console.log('❌ Fetch failed, returning offline page:', error);
    // Return a custom offline page if available
    const cached = await caches.match('/proloco/index.html');
    return cached || new Response('Offline - App not fully cached', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      console.log('📥 Updated cache:', request.url);
    }
    return response;
  } catch (error) {
    console.log('🔴 Network failed, checking cache:', request.url);
    const cached = await caches.match(request);
    return cached || new Response('Offline - Resource not cached', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🗑️ Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Periodic sync for background updates (optional, requires permissions)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      fetch('/proloco/api/sync').catch(() => {
        console.log('⚠️ Background sync failed, will retry later');
      })
    );
  }
});

console.log('✅ Service Worker loaded');

// TEMPORARY: Clear all caches and unregister this service worker for debugging
console.log('[SW] Service Worker activated - clearing all caches');

self.addEventListener('install', () => {
  console.log('[SW] install event - skipping wait');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activate event - clearing all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] found caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] all caches cleared, claiming clients');
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] unregistering self');
      return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't intercept anything - pass through to network
  return;
});

const CACHE_NAME = 'stellar-shell-v2';
const SHELL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './style.css',
  './main.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './favicon.ico'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// basic cache-first for shell, network-first for dynamic images
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  // runtime caching for dieselpunk images
  if (url.pathname.indexOf('/assets/levels/dieselpunk_examples/') !== -1) {
    evt.respondWith(
      caches.open('diesel-images').then(cache =>
        cache.match(evt.request).then(resp => resp || fetch(evt.request).then(f => { cache.put(evt.request, f.clone()); return f; }))
      )
    );
    return;
  }

  // fallback to cache-first
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).catch(()=>caches.match('./offline.html')))
  );
});

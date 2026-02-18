/* Service Worker (injectManifest)
   - precache build assets (injected by VitePWA)
   - runtime cache: translator worker asset + Xenova / HuggingFace model files
   - message API: { type: 'SKIP_WAITING' } and { type: 'CACHE_URLS', urls: [] }
*/

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// precache manifest injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || [])

// Cache the translator web worker asset(s) (CacheFirst)
registerRoute(
  ({ url }) => url.pathname.includes('translator.worker') || /translator(\.worker)?\.[a-z0-9]+\.js$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'translator-worker-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 5 })]
  })
)

// Runtime cache for model files used by @xenova/transformers (HuggingFace / common CDNs)
registerRoute(
  ({ url }) => {
    // host/path heuristics — covers common hosting used by models
    const host = url.hostname || ''
    const path = url.pathname || ''

    if (host.includes('huggingface.co') && path.includes('Xenova/nllb-200-distilled-600M')) return true
    if (host.includes('raw.githubusercontent.com') && path.includes('Xenova/nllb-200-distilled-600M')) return true
    if (host.includes('cdn.jsdelivr.net') && path.includes('xenova')) return true
    if (host.includes('models.xenova.ai')) return true

    // catch typical model file extensions
    if (path.match(/\.(bin|safetensors|json|msgpack|index|tar\.gz|h5)$/)) return true

    return false
  },
  new CacheFirst({
    cacheName: 'xenova-model-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      })
    ]
  })
)

// Fallback for navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'html-cache' })
)

// Message handler (skipWaiting + manual cache add)
self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data && data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    caches.open('xenova-model-cache').then((cache) => cache.addAll(data.urls)).catch(() => {})
  }

  if (data && data.type === 'CLEAR_MODEL_CACHE') {
    // delete runtime caches related to the model and worker
    caches.delete('xenova-model-cache').catch(() => {})
    caches.delete('translator-worker-cache').catch(() => {})

    // notify clients that cache was cleared
    self.clients.matchAll().then((clients) => {
      clients.forEach((c) => c.postMessage({ type: 'CACHE_CLEARED' }))
    }).catch(() => {})
  }
})

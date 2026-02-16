import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
// registra il service worker (fallback manual quando presente)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  (async () => {
    try {
      // prefer service worker next to the current document (works when app is served at / or a subpath)
      const localSw = 'sw.js'
      const res = await fetch(localSw, { method: 'HEAD' }).catch(() => null)
      const swToRegister = (res && res.ok) ? localSw : `${import.meta.env.BASE_URL}sw.js`
      await navigator.serviceWorker.register(swToRegister).catch(() => {})
    } catch (e) {
      /* non critico */
    }
  })()
}

// esempio di worker — il motore di traduzione (usa @xenova/transformers) in src/workers
const translationWorker = new Worker(new URL('./workers/translator.worker.js', import.meta.url), { type: 'module' })
window.translationWorker = translationWorker

createRoot(document.getElementById('root')).render(<App />)

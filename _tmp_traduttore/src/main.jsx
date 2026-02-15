import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// registra il service worker (auto-update)
registerSW({ immediate: true })

// esempio di worker — il motore di traduzione (usa @xenova/transformers) in src/workers
const translationWorker = new Worker(new URL('./workers/translator.worker.js', import.meta.url), { type: 'module' })
window.translationWorker = translationWorker

createRoot(document.getElementById('root')).render(<App />)

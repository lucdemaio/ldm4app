import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Importa il transformer loader per includerlo nel bundle Vite
import './transformer-loader.js'

// NO service worker - just plain app loading
const translationWorker = new Worker(new URL('./workers/translator.worker.js', import.meta.url), { type: 'module' })
window.translationWorker = translationWorker

createRoot(document.getElementById('root')).render(<App />)

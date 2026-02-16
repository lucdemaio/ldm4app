import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// NO service worker - just plain app loading
const translationWorker = new Worker(new URL('./workers/translator.worker.js', import.meta.url), { type: 'module' })
window.translationWorker = translationWorker

createRoot(document.getElementById('root')).render(<App />)

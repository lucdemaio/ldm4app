import { useEffect, useRef, useState } from 'react'

// Singleton shared worker reference (module-scoped)
let sharedWorker = null

function ensureWorker() {
  if (sharedWorker) return sharedWorker
  if (typeof window !== 'undefined' && window.translationWorker) {
    sharedWorker = window.translationWorker
    return sharedWorker
  }

  // create a new worker if none exists
  sharedWorker = new Worker(new URL('../workers/translator.worker.js', import.meta.url), { type: 'module' })
  // also expose on window for other code that expects it
  if (typeof window !== 'undefined') window.translationWorker = sharedWorker
  return sharedWorker
}

/**
 * React hook per comunicare col translator Web Worker.
 * Espone: translate(text, srcLang, tgtLang), preload(), loading, progress
 */
export default function useTranslator() {
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map()) // id -> { resolve, reject, timeout }
  const preloadResolversRef = useRef([])
  const idCounterRef = useRef(0)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [persisted, setPersisted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const worker = ensureWorker()
    workerRef.current = worker

    // Check whether Storage Persistence was previously granted
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((p) => setPersisted(Boolean(p))).catch(() => {})
    }

    const onMessage = (e) => {
      const data = e.data

      if (!data) return

      console.log('[useTranslator.onMessage] received:', data?.type || 'unknown', data)

      // progress/status are global (model-level)
      if (data.type === 'progress') {
        console.log('[useTranslator] progress update:', data.progress)
        setError(null)
        setLoading(true)
        setProgress(typeof data.progress === 'number' ? data.progress : 0)
        return
      }

      if (data.type === 'status') {
        console.log('[useTranslator] status update:', data.status)
        setStatus(data.status)
        setLoading(data.status === 'loading')
        if (data.status === 'ready') {
          setProgress(100)
          setError(null)
          // resolve any preload() callers
          console.log('[useTranslator] status ready, resolving', preloadResolversRef.current.length, 'preload promises')
          const resolvers = preloadResolversRef.current.splice(0)
          resolvers.forEach((r) => r())
        }
        return
      }

      // translation / error may include an id to correlate
      if (data.type === 'translation') {
        const id = data.id ?? null
        console.log('[useTranslator] translation received, id:', id)
        if (id && pendingRef.current.has(id)) {
          const { resolve, timeout } = pendingRef.current.get(id)
          clearTimeout(timeout)
          pendingRef.current.delete(id)
          resolve(data.text)
          return
        }

        // fallback: store last translation in state (optional)
        return
      }

      if (data.type === 'error') {
        const id = data.id ?? null
        console.error('[useTranslator] error received:', data.message, 'id:', id)
        if (id && pendingRef.current.has(id)) {
          const { reject, timeout } = pendingRef.current.get(id)
          clearTimeout(timeout)
          pendingRef.current.delete(id)
          reject(new Error(data.message || 'Errore dal worker'))
          return
        }

        // global error (no id) — expose to UI
        setError(data.message || 'Errore dal worker')
        return
      }
    }

    worker.addEventListener('message', onMessage)

    return () => {
      worker.removeEventListener('message', onMessage)
      // reject any pending promises on unmount
      pendingRef.current.forEach(({ reject, timeout }, id) => {
        clearTimeout(timeout)
        reject(new Error('Translator hook unmounted'))
      })
      pendingRef.current.clear()
      preloadResolversRef.current.splice(0).forEach((r) => r(new Error('unmounted')))
    }
  }, [])

  function genId() {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    } catch (e) {
      /* fallback below */
    }
    idCounterRef.current += 1
    return `t-${Date.now()}-${idCounterRef.current}`
  }

  /**
   * Traduce il testo. Restituisce una Promise che risolve con la stringa tradotta.
   * srcLang e targetLang sono codici come 'und' o 'ita_Latn'.
   */
  function translate(text, srcLang = 'und', targetLang = 'ita_Latn', opts = {}) {
    if (!text) return Promise.resolve('')

    const worker = workerRef.current || ensureWorker()
    const id = genId()

    return new Promise((resolve, reject) => {
      // fallback timeout (2 minuti)
      const timeout = setTimeout(() => {
        if (!pendingRef.current.has(id)) return
        pendingRef.current.delete(id)
        reject(new Error('Timeout traduzione'))
      }, opts.timeout || 120_000)

      pendingRef.current.set(id, { resolve, reject, timeout })

      try {
        worker.postMessage({ type: 'translate', id, text, src: srcLang, tgt: targetLang })
      } catch (err) {
        clearTimeout(timeout)
        pendingRef.current.delete(id)
        reject(err)
      }
    })
  }

  /** Pre-carica il modello; risolve quando il worker invia `status: 'ready'`. */
  function preload() {
    const worker = workerRef.current || ensureWorker()
    console.log('[useTranslator.preload] called, current status:', status)

    if (status === 'ready') {
      console.log('[useTranslator.preload] already ready, returning resolved promise')
      return Promise.resolve()
    }

    console.log('[useTranslator.preload] not ready yet, pushing resolver and sending load message')
    return new Promise((resolve, reject) => {
      preloadResolversRef.current.push(resolve)
      try {
        console.log('[useTranslator.preload] posting load message to worker')
        worker.postMessage({ type: 'load' })

        // chiedi al Service Worker di preriscaldare/cache alcuni URL modello comuni (se presente)
        // il SW ha una runtime-route che intercetta e memorizza i file del modello quando vengono richiesti;
        // qui inviamo anche un messaggio `CACHE_URLS` che il SW può usare per fetch/caching proattivo.
        const modelBase = 'https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main'
        const urlsToCache = [
          `${modelBase}/config.json`,
          `${modelBase}/tokenizer.json`,
          `${modelBase}/generation_config.json`
        ]

        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls: urlsToCache })
            } else {
              navigator.serviceWorker.ready.then((reg) => {
                reg.active && reg.active.postMessage({ type: 'CACHE_URLS', urls: urlsToCache })
              }).catch(() => {})
            }
          } catch (e) {
            /* non critico */
          }
        }
      } catch (err) {
        // rimuovi resolver appena inserito
        const idx = preloadResolversRef.current.indexOf(resolve)
        if (idx >= 0) preloadResolversRef.current.splice(idx, 1)
        reject(err)
      }
    })
  }

  /** Richiede al browser persistenza dello storage (riduce la probabilità di eviction). */
  async function persistStorage() {
    if (!navigator.storage || !navigator.storage.persist) return false
    try {
      const granted = await navigator.storage.persist()
      setPersisted(Boolean(granted))
      return Boolean(granted)
    } catch (err) {
      return false
    }
  }

  /** Cancella la cache del modello (xenova-model-cache) sia lato SW che window.caches */
  async function clearModelCache() {
    try {
      // chiedi al service worker di cancellare la cache (se presente)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_MODEL_CACHE' })
      }
    } catch (e) {
      /* non critico */
    }

    try {
      if (caches && caches.delete) {
        await caches.delete('xenova-model-cache')
      }
    } catch (e) {
      /* non critico */
    }

    // aggiorna stato persisted
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((p) => setPersisted(Boolean(p))).catch(() => {})
    }

    return true
  }

  // esporta API pubblica del hook
  function clearError() { setError(null) }

  return { translate, preload, persistStorage, clearModelCache, persisted, loading, progress, status, error, clearError }
}


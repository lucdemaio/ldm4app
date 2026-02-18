import { pipeline, env } from "@xenova/transformers"

// If the site is served without cross-origin isolation (COOP/COEP) — e.g. GitHub Pages —
// WebAssembly threads / SharedArrayBuffer are unavailable. Force the ONNX WASM
// backend to use a single thread so the model can initialize reliably on those hosts.
try {
  if (env && env.backends && env.backends.onnx && env.backends.onnx.wasm) {
    env.backends.onnx.wasm.numThreads = 1
  }
} catch (e) {
  /* ignore */
}

// Singleton promise that resolves to the translation pipeline
let translatorPromise = null

function sendProgress(p) {
  let progress = 0
  if (typeof p === 'number') progress = Math.round(p * 100)
  else if (p && typeof p.loaded === 'number' && typeof p.total === 'number') {
    progress = Math.round((p.loaded / p.total) * 100)
  } else if (p && typeof p.percent === 'number') {
    progress = Math.round(p.percent)
  }
  console.log('[translator.worker] sendProgress:', progress, '% (input:', p, ')')
  self.postMessage({ type: 'progress', progress })
}

async function getTranslator() {
  if (translatorPromise) {
    console.log('[translator.worker] getTranslator: returning cached promise')
    return translatorPromise
  }

  // start loading once and reuse the same promise (singleton)
  translatorPromise = (async () => {
    // notify main thread: starting load
    console.log('[translator.worker] getTranslator: sending status=loading')
    self.postMessage({ type: 'status', status: 'loading' })

    let tpl
    try {
      console.log('[translator.worker] getTranslator: calling pipeline()')
      tpl = await pipeline('translation', 'Xenova/nllb-200-distilled-600M', {
        // progress_callback receives either a number [0..1] or an object with loaded/total
        progress_callback: (p) => sendProgress(p),
      })
    } catch (err) {
      console.error('[translator.worker] pipeline() failed:', err)
      // forward initialization errors to the main thread (helps when debugging production)
      self.postMessage({ type: 'error', message: 'Pipeline init failed: ' + (err?.message || String(err)), stack: err?.stack })
      throw err
    }

    console.log('[translator.worker] getTranslator: pipeline ready, sending status=ready')
    self.postMessage({ type: 'status', status: 'ready' })
    sendProgress(100)
    return tpl
  })()

  return translatorPromise
}

async function translateText({ id, text, src, tgt }) {
  console.log('[translator.worker] translateText called:', { id, text: text?.substring(0, 50), src, tgt })
  const translator = await getTranslator()
  console.log('[translator.worker] got translator, executing translation')

  // tgt default -> Italian (user can override by sending `tgt`)
  const options = {
    src_lang: src || 'und',
    tgt_lang: tgt || 'ita_Latn'
  }

  try {
    const result = await translator(text, options)
    console.log('[translator.worker] translation result:', result)

    // normalizza output in stringa
    let translated = ''
    if (Array.isArray(result)) {
      translated = result
        .map((r) => (typeof r === 'string' ? r : r.translation_text ?? JSON.stringify(r)))
        .join('\n')
    } else {
      translated = typeof result === 'string' ? result : result.translation_text ?? JSON.stringify(result)
    }

    console.log('[translator.worker] sending translation response with id:', id)
    // include l'id (se fornito) per permettere al chiamante di associare la risposta
    self.postMessage({ type: 'translation', id: id ?? null, text: translated })
  } catch (err) {
    console.error('[translator.worker] translation error:', err)
    self.postMessage({ type: 'error', id: id ?? null, message: err?.message ?? String(err) })
  }
}

self.addEventListener('message', async (event) => {
  const msg = event.data
  
  console.log('[translator.worker] received:', msg?.type || 'unknown', msg)

  // Backwards-compatible: if a plain string is posted, treat as translate request
  if (typeof msg === 'string') {
    console.log('[translator.worker] treating as translate string')
    translateText({ text: msg })
    return
  }

  // Structured messages
  switch (msg?.type) {
    case 'load':
      console.log('[translator.worker] load message received, calling getTranslator()')
      // pre-carica il modello (singleton)
      try {
        await getTranslator()
      } catch (err) {
        console.error('[translator.worker] getTranslator failed:', err)
        self.postMessage({ type: 'error', message: err?.message ?? String(err) })
      }
      break

    case 'translate':
      if (!msg.text) {
        self.postMessage({ type: 'error', id: msg?.id ?? null, message: 'Nessun testo fornito per la traduzione' })
        return
      }
      translateText({ id: msg.id, text: msg.text, src: msg.src, tgt: msg.tgt })
      break

    default:
      console.log('[translator.worker] unknown message type:', msg?.type)
      self.postMessage({ type: 'error', message: 'Messaggio non riconosciuto dal worker' })
      break
  }
})

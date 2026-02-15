import { pipeline } from "@xenova/transformers"

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
  self.postMessage({ type: 'progress', progress })
}

async function getTranslator() {
  if (translatorPromise) return translatorPromise

  // start loading once and reuse the same promise (singleton)
  translatorPromise = (async () => {
    // notify main thread: starting load
    self.postMessage({ type: 'status', status: 'loading' })

    const tpl = await pipeline('translation', 'Xenova/nllb-200-distilled-600M', {
      // progress_callback receives either a number [0..1] or an object with loaded/total
      progress_callback: (p) => sendProgress(p),
      // force use of browser-friendly backend if needed; the library auto-detects
      // (no extra options required here)
    })

    self.postMessage({ type: 'status', status: 'ready' })
    sendProgress(1)
    return tpl
  })()

  return translatorPromise
}

async function translateText({ id, text, src, tgt }) {
  const translator = await getTranslator()

  // tgt default -> Italian (user can override by sending `tgt`)
  const options = {
    src_lang: src || 'und',
    tgt_lang: tgt || 'ita_Latn'
  }

  try {
    const result = await translator(text, options)

    // normalizza output in stringa
    let translated = ''
    if (Array.isArray(result)) {
      translated = result
        .map((r) => (typeof r === 'string' ? r : r.translation_text ?? JSON.stringify(r)))
        .join('\n')
    } else {
      translated = typeof result === 'string' ? result : result.translation_text ?? JSON.stringify(result)
    }

    // include l'id (se fornito) per permettere al chiamante di associare la risposta
    self.postMessage({ type: 'translation', id: id ?? null, text: translated })
  } catch (err) {
    self.postMessage({ type: 'error', id: id ?? null, message: err?.message ?? String(err) })
  }
}

self.addEventListener('message', async (event) => {
  const msg = event.data

  // Backwards-compatible: if a plain string is posted, treat as translate request
  if (typeof msg === 'string') {
    translateText({ text: msg })
    return
  }

  // Structured messages
  switch (msg?.type) {
    case 'load':
      // pre-carica il modello (singleton)
      try {
        await getTranslator()
      } catch (err) {
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
      self.postMessage({ type: 'error', message: 'Messaggio non riconosciuto dal worker' })
      break
  }
})

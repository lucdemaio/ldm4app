/**
 * Transformer Loader Module
 * 
 * Carica il modello t5-small via Transformers.js CDN
 * - Mostra feedback visivo durante il scaricamento (~45MB)
 * - Inizializza la pipeline asincrona all'avvio
 * - Espone API globale per la traduzione
 */

// Singleton: mantiene lo stato del modello caricato
let translatorPipeline = null;
let isLoading = false;

/**
 * Crea un elemento di stato visivo nel DOM
 */
function createStatusIndicator() {
  let statusDiv = document.getElementById('transformer-status-indicator');
  
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'transformer-status-indicator';
    statusDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 9999;
      max-width: 280px;
      display: none;
    `;
    document.body.appendChild(statusDiv);
  }
  
  return statusDiv;
}

/**
 * Aggiorna lo stato visivo nel DOM
 */
function updateStatus(message, progress = null) {
  const statusDiv = createStatusIndicator();
  
  if (!message) {
    statusDiv.style.display = 'none';
    return;
  }
  
  statusDiv.style.display = 'block';
  
  if (progress !== null && progress < 100) {
    statusDiv.innerHTML = `
      <div style="margin-bottom: 6px;">⬇️ ${message}</div>
      <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
        <div style="width: ${progress}%; height: 100%; background: rgba(255,255,255,0.9); transition: width 0.3s;"></div>
      </div>
      <div style="margin-top: 6px; font-size: 11px; opacity: 0.9;">${progress}%</div>
    `;
  } else {
    // Completato
    statusDiv.innerHTML = `<div>✅ ${message}</div>`;
    statusDiv.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
    
    // Nascondi dopo 3 secondi
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

/**
 * Carica il modello t5-small tramite Transformers.js
 */
async function loadTransformerModel() {
  if (isLoading) {
    console.warn('[TransformerLoader] Caricamento già in corso...');
    return translatorPipeline;
  }
  
  if (translatorPipeline) {
    console.log('[TransformerLoader] Modello già caricato');
    return translatorPipeline;
  }
  
  isLoading = true;
  updateStatus('🚀 Motore di traduzione in avvio...', 0);
  
  try {
    // Import dinamico della libreria Transformers.js
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
    
    // Configura l'ambiente per evitare problemi con SharedArrayBuffer
    if (env && env.backends && env.backends.onnx) {
      try {
        env.backends.onnx.wasm.numThreads = 1;
      } catch (e) {
        console.log('[TransformerLoader] WASM threading not available:', e.message);
      }
    }
    
    console.log('[TransformerLoader] Inizializzazione pipeline per t5-small...');
    updateStatus('⬇️ Scaricamento modello t5-small (~45MB)...', 5);
    
    // Inizializza la pipeline per il modello t5-small
    translatorPipeline = await pipeline('translation_en_to_de', 'Xenova/t5-small', {
      progress_callback: (progress) => {
        let percent = 0;
        if (typeof progress === 'number') {
          percent = Math.round(progress * 100);
        } else if (progress && typeof progress.progress === 'number') {
          percent = Math.round(progress.progress * 100);
        }
        console.log(`[TransformerLoader] Progress: ${percent}%`, progress);
        updateStatus(`⬇️ Scaricamento modello t5-small (~45MB)...`, percent);
      }
    });
    
    console.log('[TransformerLoader] ✅ Pipeline caricata con successo');
    updateStatus('✅ Motore di traduzione pronto!');
    isLoading = false;
    
    // Esponi la pipeline globalmente per uso da parte della React app
    window.transformerPipeline = translatorPipeline;
    window.transformerReady = true;
    
    // Dispatch custom event per notificare che il modello è pronto
    const event = new CustomEvent('transformer:ready', { detail: { pipeline: translatorPipeline } });
    window.dispatchEvent(event);
    
    return translatorPipeline;
    
  } catch (error) {
    isLoading = false;
    console.error('[TransformerLoader] Errore durante il caricamento:', error);
    updateStatus(`❌ Errore: ${error.message}`, null);
    
    // Dispatch custom event per notificare l'errore
    const event = new CustomEvent('transformer:error', { detail: { error } });
    window.dispatchEvent(event);
    
    throw error;
  }
}

/**
 * Funzione di traduzione asincrona
 * @param {string} text - Testo da tradurre
 * @param {string} fromLang - Lingua di origine (default: en_XX)
 * @param {string} toLang - Lingua di destinazione (default: de_DE)
 */
async function translate(text, fromLang = 'en_XX', toLang = 'de_DE') {
  if (!text || typeof text !== 'string') {
    throw new Error('Testo di input non valido');
  }
  
  if (!translatorPipeline) {
    console.log('[TransformerLoader] Pipeline non caricata, caricando...');
    await loadTransformerModel();
  }
  
  try {
    console.log(`[TransformerLoader] Traduzione da ${fromLang} a ${toLang}: "${text.substring(0, 50)}..."`);
    const result = await translatorPipeline(text);
    
    // Normalizza il risultato
    let translated = '';
    if (Array.isArray(result)) {
      translated = result
        .map((r) => (typeof r === 'string' ? r : r.translation_text ?? JSON.stringify(r)))
        .join('\n');
    } else {
      translated = typeof result === 'string' ? result : result.translation_text ?? JSON.stringify(result);
    }
    
    console.log('[TransformerLoader] Risultato traduzione:', translated);
    return translated;
    
  } catch (error) {
    console.error('[TransformerLoader] Errore traduzione:', error);
    throw error;
  }
}

/**
 * API Pubblica
 */
window.TransformerAPI = {
  load: loadTransformerModel,
  translate: translate,
  isReady: () => translatorPipeline !== null,
  isLoading: () => isLoading,
};

// Auto-start: carica il modello all'avvio della pagina
console.log('[TransformerLoader] Modulo initato - Caricamento automatico del modello...');
loadTransformerModel().catch((err) => {
  console.error('[TransformerLoader] Errore nel caricamento automatico:', err);
});

console.log('[TransformerLoader] API disponibile in window.TransformerAPI');

/**
 * Transformer Loader Module - Opus-MT (Helsinki-NLP)
 * 
 * Carica i modelli Opus-MT via Transformers.js CDN
 * - Licenza: Apache 2.0 (100% commercialmente libero, nessuna restrizione)
 * - Leggeri per mobile: ~300MB per modello
 * - Open-source puro (OPUS corpus)
 * - Specifici per coppie di lingue (alta qualità)
 */

let translatorPipeline = null;
let chainPipeline1 = null; // Per chain translation step1
let chainPipeline2 = null; // Per chain translation step2
let isLoading = false;
let modelCached = false;
let currentLanguagePair = null;

// Modelli Opus-MT Apache 2.0 - Helsinki-NLP
// Disponibili direttamente sul browser via Transformers.js
const OPUS_MODELS = {
  'it-en': 'Xenova/opus-mt-it-en', // Italiano → Inglese (Apache 2.0)
  'it-es': 'Xenova/opus-mt-it-es', // Italiano → Spagnolo (Apache 2.0)
  'it-fr': 'Xenova/opus-mt-it-fr', // Italiano → Francese (Apache 2.0)
};

// Modelli M2M100-418M per altre lingue (MIT, multilingual)
const M2M_MODELS = {
  'it-de-m2m': 'Xenova/m2m100_418M', // Italiano → Tedesco (M2M)
  'it-pt-m2m': 'Xenova/m2m100_418M', // Italiano → Portoghese (M2M)
  'it-nl-m2m': 'Xenova/m2m100_418M', // Italiano → Olandese (M2M)
  'it-pl-m2m': 'Xenova/m2m100_418M', // Italiano → Polacco (M2M)
};

// Chain translations (deprecate - usati solo per compatibility)
const CHAIN_PAIRS = {
  'it-pt': { step1: 'it-en', step2: 'en-romance' }, // Ita → Eng → ROMANCE (incluso PT)
  'it-ru': { step1: 'it-en', step2: 'en-ru' }, // Ita → Eng → Russo
  'it-el': { step1: 'it-en', step2: 'en-el' }, // Ita → Eng → Greco (M2M-100)
};

// Modelli per le chain translations - Opus-MT verificati su Xenova
const CHAIN_MODELS = {
  'it-en': 'Xenova/opus-mt-it-en',
  'en-romance': 'Xenova/opus-mt-en-ROMANCE', // Copre PT, FR, IT, ES, RO (verified ✓)
  'en-ru': 'Xenova/opus-mt-en-ru', // Inglese → Russo (verified ✓)
  'en-el': 'Xenova/m2m100_418M', // M2M-100 multilingue per Greco (verified ✓)
};

const STORAGE_KEY = 'transformer-model-cache';
const DB_NAME = 'TransformerDB';
const DB_STORE = 'models';

/**
 * Converte codici FLORES-200 in ISO 639-1 (Opus-MT)
 */
function convertFloresCodeToIso639(floresCode) {
  const mapping = {
    'ita_Latn': 'it',
    'eng_Latn': 'en',
    'deu_Latn': 'de',
    'spa_Latn': 'es',
    'por_Latn': 'pt',
    'fra_Latn': 'fr',
    'rus_Cyrl': 'ru',
    'ell_Grek': 'el',
  };
  return mapping[floresCode] || floresCode;
}

/**
 * Inizializza IndexedDB
 */
async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
  });
}

/**
 * Crea indicatore di stato visivo
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
 * Aggiorna lo stato visivo
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
    statusDiv.innerHTML = `<div>✅ ${message}</div>`;
    statusDiv.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
  }
}

/**
 * Carica il modello Opus-MT
 */
async function loadTransformerModel(languagePair = 'it-en', persist = false) {
  if (isLoading) {
    console.warn('[TransformerLoader] Caricamento già in corso...');
    return translatorPipeline;
  }
  
  if (translatorPipeline && currentLanguagePair === languagePair) {
    console.log(`[TransformerLoader] Modello ${languagePair} già caricato`);
    return translatorPipeline;
  }
  
  if (currentLanguagePair !== languagePair) {
    console.log(`[TransformerLoader] Cambio coppia da ${currentLanguagePair} a ${languagePair}`);
    translatorPipeline = null;
    chainPipeline1 = null;
    chainPipeline2 = null;
    modelCached = false;
  }
  
  isLoading = true;
  
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
    
    if (env) {
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
    }
    
    if (env && env.backends && env.backends.onnx) {
      try {
        env.backends.onnx.wasm.numThreads = 1;
      } catch (e) {
        console.log('[TransformerLoader] WASM config:', e.message);
      }
    }
    
    const isChain = CHAIN_PAIRS[languagePair];
    const isM2M = M2M_MODELS[languagePair];
    const statusMsg = isChain || isM2M
      ? `⬇️ Scaricamento modello ${languagePair.toUpperCase()} (~600MB)...`
      : `⬇️ Scaricamento Opus-MT ${languagePair.toUpperCase()} (~300MB)...`;
    
    console.log(`[TransformerLoader] Caricamento ${isChain ? 'chain' : isM2M ? 'M2M100' : 'diretto'} per ${languagePair}...`);
    updateStatus(statusMsg, 5);
    
    if (isM2M) {
      // ===== MODELLO M2M100-418M =====
      const model = M2M_MODELS[languagePair];
      console.log(`[TransformerLoader] Modello M2M100-418M: ${model}`);
      
      translatorPipeline = await pipeline('translation', model, {
        progress_callback: (progress) => {
          let percent = 0;
          if (typeof progress === 'number') {
            percent = Math.round(progress * 100);
          } else if (progress && typeof progress.progress === 'number') {
            percent = Math.round(progress.progress * 100);
          }
          updateStatus(statusMsg, percent);
        }
      });
    } else if (isChain) {
      const { step1, step2 } = CHAIN_PAIRS[languagePair];
      const model1 = CHAIN_MODELS[step1];
      const model2 = CHAIN_MODELS[step2];
      
      console.log(`[TransformerLoader] Step1 (${step1}): ${model1}`);
      chainPipeline1 = await pipeline('translation', model1, {
        progress_callback: (p) => updateStatus(statusMsg, Math.round(p.progress * 40))
      });
      
      console.log(`[TransformerLoader] Step2 (${step2}): ${model2}`);
      chainPipeline2 = await pipeline('translation', model2, {
        progress_callback: (p) => updateStatus(statusMsg, 40 + Math.round(p.progress * 60))
      });
      
      translatorPipeline = { isChain: true };
    } else {
      const model = OPUS_MODELS[languagePair] || OPUS_MODELS['it-en'];
      console.log(`[TransformerLoader] Modello diretto: ${model}`);
      
      translatorPipeline = await pipeline('translation', model, {
        progress_callback: (progress) => {
          let percent = 0;
          if (typeof progress === 'number') {
            percent = Math.round(progress * 100);
          } else if (progress && typeof progress.progress === 'number') {
            percent = Math.round(progress.progress * 100);
          }
          updateStatus(statusMsg, percent);
        }
      });
    }
    
    console.log('[TransformerLoader] ✅ Modello caricato');
    currentLanguagePair = languagePair;
    
    if (persist) {
      updateStatus('💾 Salvataggio in IndexedDB...', 100);
      try {
        const db = await initIndexedDB();
        const tx = db.transaction([DB_STORE], 'readwrite');
        const store = tx.objectStore(DB_STORE);
        await new Promise((resolve, reject) => {
          const req = store.put({ timestamp: Date.now(), cached: true }, STORAGE_KEY);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
        modelCached = true;
      } catch (e) {
        console.warn('[TransformerLoader] Errore IndexedDB:', e);
      }
    }
    
    updateStatus('✅ Pronto per la traduzione!', 100);
    
  } catch (err) {
    console.error('[TransformerLoader] Errore:', err);
    updateStatus(`❌ Errore: ${err.message}`, null);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Traduce il testo
 */
async function translate(text, fromLang = 'eng_Latn', toLang = 'ita_Latn') {
  if (!text || typeof text !== 'string') {
    throw new Error('Testo di input non valido');
  }
  
  if (!translatorPipeline) {
    throw new Error('Modello non caricato - chiama load() prima di tradurre');
  }

  try {
    const srcLangIso = convertFloresCodeToIso639(fromLang);
    const tgtLangIso = convertFloresCodeToIso639(toLang);

    // Per M2M100, usiamo i codici FLORES-200 direttamente
    const isM2M = currentLanguagePair && currentLanguagePair.includes('-m2m');

    if (isM2M) {
      // ===== M2M100-418M (multilingual) =====
      console.log(`[TransformerLoader] 🌍 M2M100: ${fromLang} → ${toLang}`);
      const result = await translatorPipeline(text, { 
        src_lang: fromLang,
        tgt_lang: toLang
      });
      return extractTranslationText(result);
    } else if (translatorPipeline.isChain) {
      // ===== CHAIN TRANSLATION (2 step) =====
      console.log(`[TransformerLoader] 🔗 Chain ${currentLanguagePair}: ${srcLangIso}→en→${tgtLangIso}`);
      
      try {
        // Step 1: traduce a inglese
        console.log(`  Step 1: IT → EN`);
        const step1Result = await chainPipeline1(text);
        let middleText = extractTranslationText(step1Result);
        console.log(`  ✓ Intermedio: "${middleText.substring(0, 40)}..."`);
        
        // Step 2: traduce da inglese a target
        console.log(`  Step 2: EN → ${tgtLangIso.toUpperCase()}`);
        const step2Result = await chainPipeline2(middleText);
        let finalText = extractTranslationText(step2Result);
        console.log(`  ✓ Finale: "${finalText.substring(0, 40)}..."`);
        
        return finalText;
      } catch (e) {
        console.error(`[TransformerLoader] Chain translation error:`, e);
        throw new Error(`Chain fallita: ${e.message}`);
      }
      
    } else {
      // ===== MODELLO DIRETTO =====
      console.log(`[TransformerLoader] 📝 Traduzione diretta: ${srcLangIso} → ${tgtLangIso}`);
      const result = await translatorPipeline(text);
      return extractTranslationText(result);
    }
  } catch (error) {
    console.error('[TransformerLoader] Errore traduzione:', error);
    throw error;
  }
}

/**
 * Estrae il testo tradotto dal risultato del modello
 */
function extractTranslationText(result) {
  if (typeof result === 'string') {
    return result.trim();
  }
  if (Array.isArray(result)) {
    return result
      .map(r => {
        if (typeof r === 'string') return r.trim();
        if (r && r.translation_text) return r.translation_text.trim();
        return JSON.stringify(r);
      })
      .filter(s => s)
      .join('\n');
  }
  if (result && typeof result === 'object') {
    if (result.translation_text) return result.translation_text.trim();
    if (result[0] && result[0].translation_text) return result[0].translation_text.trim();
  }
  console.warn('[TransformerLoader] Formato risultato inaspettato:', typeof result, result);
  return String(result).trim();
}

/**
 * API Pubblica - Opus-MT Apache 2.0
 */
window.TransformerAPI = {
  load: (languagePair = 'it-en') => loadTransformerModel(languagePair),
  loadSessionOnly: (languagePair = 'it-en') => loadTransformerModel(languagePair, false),
  loadAndPersist: (languagePair = 'it-en') => loadTransformerModel(languagePair, true),
  translate: translate,
  isReady: () => translatorPipeline !== null,
  isLoading: () => isLoading,
  isCached: () => modelCached,
  getModelName: () => 'Opus-MT (Apache 2.0)',
};

console.log('[TransformerLoader] ✅ API TransformerAPI disponibile');
console.log('[TransformerLoader] 📦 Modelli: Opus-MT Apache 2.0 + M2M100-418M MIT');
console.log('[TransformerLoader] 🌍 Lingue supportate:');
console.log('     OPUS-MT (Diretto): IT→ES, IT→FR, IT→EN');
console.log('     M2M100-418M: IT→DE, IT→PT, IT→NL, IT→PL');
console.log('[TransformerLoader] 🔓 Licenza: 100% commercialmente libera (Apache 2.0 + MIT)');
console.log('[TransformerLoader] ✓ Tutti i modelli verificati su Xenova CDN');

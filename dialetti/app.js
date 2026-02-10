// app.js - modulo principale
// Carica TensorFlow.js e MobileNet dinamicamente e gestisce lo streaming video

// Dizionario di esempio: mappa etichette inglesi -> traduzioni fonetiche dialettali
// Dialetti disponibili: Romano, Veneto, Bergamasco, Milanese, Napoletano, Siciliano
export const dialectDict = {
  "cat":       { "Romano":"gatto",       "Veneto":"gato",       "Bergamasco":"gat",     "Milanese":"gatt",     "Napoletano":"gatto",   "Siciliano":"gattu" },
  "dog":       { "Romano":"cane",        "Veneto":"can",        "Bergamasco":"can",     "Milanese":"can",      "Napoletano":"cane",    "Siciliano":"cani" },
  "bottle":    { "Romano":"bottiglia",   "Veneto":"butìa",      "Bergamasco":"bütìa",   "Milanese":"butéla",   "Napoletano":"buttiglia","Siciliano":"bottìa" },
  "chair":     { "Romano":"seggeta",     "Veneto":"segia",      "Bergamasco":"segia",   "Milanese":"segéla",   "Napoletano":"seggióla", "Siciliano":"sègghia" },
  "cup":       { "Romano":"tazza",       "Veneto":"tasa",       "Bergamasco":"tasa",    "Milanese":"tasa",     "Napoletano":"tazza",    "Siciliano":"tazza" },
  "car":       { "Romano":"macchina",    "Veneto":"machina",    "Bergamasco":"machina", "Milanese":"machina",  "Napoletano":"maccchina", "Siciliano":"macchina" },
  "person":    { "Romano":"persona",     "Veneto":"persona",    "Bergamasco":"persöna", "Milanese":"persona",  "Napoletano":"persona",  "Siciliano":"pirsuna" },
  "phone":     { "Romano":"telefono",    "Veneto":"telefono",    "Bergamasco":"telefon", "Milanese":"telefon",  "Napoletano":"telefono",  "Siciliano":"telefònu" },
  "book":      { "Romano":"libro",       "Veneto":"libro",       "Bergamasco":"liber",   "Milanese":"liber",    "Napoletano":"libbro",   "Siciliano":"libbru" },
  "bicycle":   { "Romano":"bicicletta",  "Veneto":"bicicleta",  "Bergamasco":"bicicléta","Milanese":"bicicleta","Napoletano":"bicicletta","Siciliano":"bicicletta" },
  "apple":     { "Romano":"pòmmolo",     "Veneto":"pomo",        "Bergamasco":"pòm",     "Milanese":"pòm",      "Napoletano":"pòmma",    "Siciliano":"puma" },
  "banana":    { "Romano":"banana",      "Veneto":"banana",      "Bergamasco":"banana",  "Milanese":"banana",   "Napoletano":"banana",   "Siciliano":"banana" },
  "motorbike": { "Romano":"moto",        "Veneto":"moto",        "Bergamasco":"moto",    "Milanese":"moto",     "Napoletano":"moto",     "Siciliano":"moto" },
  "potted plant":{ "Romano":"pianta",    "Veneto":"pianta",      "Bergamasco":"pianta",  "Milanese":"pianta",   "Napoletano":"piantina", "Siciliano":"piantina" }
};

// Elementi DOM
const video = document.getElementById('video');
if (video){
  ['loadedmetadata','canplay','play','playing','pause','error','stalled','suspend'].forEach(evt => {
    video.addEventListener(evt, (e) => { addDebugLog('info', `video event: ${evt}`, { readyState: video.readyState, currentSrc: video.currentSrc }); });
  });
}
const dialectSelect = document.getElementById('dialect');
const resultsArea = document.getElementById('results');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const bentoGrid = document.getElementById('bentoGrid');
const detectionRing = document.getElementById('detectionRing');
const detailPanel = document.getElementById('detailPanel');
const detailsContent = document.getElementById('detailsContent');

// Elementi debug
const debugBtn = document.getElementById('debugBtn');
const debugPanel = document.getElementById('debugPanel');
const debugLogsEl = document.getElementById('debugLogs');
const clearLogsBtn = document.getElementById('clearLogs');
const downloadLogsBtn = document.getElementById('downloadLogs');
const unregisterSWBtn = document.getElementById('unregisterSW');
const closeDebugBtn = document.getElementById('closeDebug');

// Stato debug
const debugState = { logs: [] };

// Aggiunge un log strutturato
function addDebugLog(level, message, meta){
  const entry = { ts: new Date().toISOString(), level, message, meta };
  debugState.logs.unshift(entry);
  if (debugState.logs.length > 500) debugState.logs.pop();
  renderDebug();
}

// Render dei log nel pannello
function renderDebug(){
  if (!debugLogsEl) return;
  debugLogsEl.innerHTML = debugState.logs.map(l => {
    const meta = l.meta ? `<div class="debug-meta">${escapeHtml(JSON.stringify(l.meta))}</div>` : '';
    return `<div class="debug-entry level-${l.level}"><div><span class="level">${l.level.toUpperCase()}</span><span class="time">${l.ts}</span></div><div>${escapeHtml(l.message)}</div>${meta}</div>`;
  }).join('');
}

function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Widget di controllo debug
function openDebug(){ if (!debugPanel) return; debugPanel.hidden = false; debugPanel.style.transform = 'translateY(0)'; }
function closeDebug(){ if (!debugPanel) return; debugPanel.style.transform = 'translateY(12px)'; setTimeout(()=> debugPanel.hidden = true, 260); }

// Toggle button (keeps old behavior)
debugBtn?.addEventListener('click', async (ev) => {
  ev?.preventDefault?.();
  ev?.stopPropagation?.();
  // If the inline fallback was used, ignore this handler to avoid toggling twice
  if (window._toggleDebugFallbackUsed) { addDebugLog('info','debug toggle ignored due to fallback'); return; }
  const opening = !!(debugPanel && debugPanel.hidden);
  if (opening) openDebug(); else closeDebug();

  // Dump structured report into console immediately to allow copy/paste
  try{
    const regs = await (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]));
    const swInfo = regs.map(r=>({scope:r.scope, active: !!r.active, installing: !!r.installing, waiting: !!r.waiting}));
    const report = { ts: new Date().toISOString(), url: location.href, ua: navigator.userAgent, sw: swInfo, logs: debugState.logs, state: {modelLoaded: !!model, isPredicting, lastSpoken, lastTopKey} };
    console.groupCollapsed('DIALETI DEBUG REPORT');
    console.log(report);
    console.log('--- Logs ---');
    console.log(debugState.logs);
    console.groupEnd();
    addDebugLog('info','Debug report printed to console');
  }catch(e){ addDebugLog('error','Failed to print debug report to console', {error: e && e.message}); console.error('Failed to print debug report', e); }
});

// Event delegation: gestione click centralizzata per robustezza su mobile
debugPanel?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.id;
  addDebugLog('info', `debug button clicked: ${id}`);

  try{
    if (id === 'clearLogs'){
      debugState.logs = []; renderDebug(); addDebugLog('info','Logs cleared');
    } else if (id === 'downloadLogs'){
      // Export dei log anche se vuoti
      const blob = new Blob([JSON.stringify(debugState.logs, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'debug-logs.json'; a.click(); URL.revokeObjectURL(url);
      addDebugLog('info','Logs exported');
    } else if (id === 'exportReport'){
      // Fallback per esportare report via delegazione (se il listener diretto non è presente)
      try{
        const regs = await (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]));
        const swInfo = regs.map(r=>({scope:r.scope, active: !!r.active, installing: !!r.installing, waiting: !!r.waiting}));
        const report = { ts: new Date().toISOString(), url: location.href, ua: navigator.userAgent, sw: swInfo, logs: debugState.logs, state: {modelLoaded: !!model, isPredicting, lastSpoken, lastTopKey} };
        const blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `dialetti-report-${new Date().toISOString().replace(/[:.]/g,'-')}.json`; a.click(); URL.revokeObjectURL(url);
        addDebugLog('info','Report exported (delegation)');
      }catch(e){ addDebugLog('error','Export failed (delegation)', {error: e && e.message}); alert('Errore esportazione report: '+ (e && e.message)); }
    } else if (id === 'unregisterSW'){
      try{
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        addDebugLog('info','Service Worker unregistered');
        alert('Service Worker rimosso');
      }catch(e){ addDebugLog('error','SW unregister failed', {error: e && e.message}); }
    } else if (id === 'closeDebug'){
      closeDebug();
    }
  }catch(ex){ addDebugLog('error','Error handling debug click', {id, error: ex && ex.message}); }
});

// Prevent accidental close functionality + direct export button
const preventCloseCheckbox = document.getElementById('preventClose');
function beforeUnloadHandler(e){ e.preventDefault(); e.returnValue = ''; }
preventCloseCheckbox?.addEventListener('change',(ev)=> {
  if (ev.target.checked) window.addEventListener('beforeunload', beforeUnloadHandler);
  else window.removeEventListener('beforeunload', beforeUnloadHandler);
});

const exportReportBtn = document.getElementById('exportReport');
exportReportBtn?.addEventListener('click', async ()=>{
  addDebugLog('info','Export report clicked');
  try{
    const regs = await (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]));
    const swInfo = regs.map(r=>({scope:r.scope, active: !!r.active, installing: !!r.installing, waiting: !!r.waiting}));
    const report = { ts: new Date().toISOString(), url: location.href, ua: navigator.userAgent, sw: swInfo, logs: debugState.logs, state: {modelLoaded: !!model, isPredicting, lastSpoken, lastTopKey} };
    const blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `dialetti-report-${new Date().toISOString().replace(/[:.]/g,'-')}.json`; a.click(); URL.revokeObjectURL(url);
    addDebugLog('info','Report exported');
  }catch(e){ addDebugLog('error','Export failed', {error: e && e.message}); alert('Errore esportazione report: '+ (e && e.message)); }
});

// Cattura errori globali e promesse non gestite
window.addEventListener('error', (e) => {
  addDebugLog('error', e.message, {source: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error && e.error.stack});
});
window.addEventListener('unhandledrejection', (e) => {
  addDebugLog('error', 'UnhandledRejection', {reason: e.reason && (e.reason.stack || e.reason)});
});

// Intercetta console.* per duplicare i messaggi nel pannello debug
const _console = { log: console.log.bind(console), info: console.info.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) };
console.log = (...args) => { addDebugLog('info', args.map(a=>String(a)).join(' ')); _console.log(...args); };
console.info = (...args) => { addDebugLog('info', args.map(a=>String(a)).join(' ')); _console.info(...args); };
console.warn = (...args) => { addDebugLog('warn', args.map(a=>String(a)).join(' ')); _console.warn(...args); };
console.error = (...args) => { addDebugLog('error', args.map(a=>String(a)).join(' ')); _console.error(...args); };

// Wrap fetch per loggare errori di rete (non cambia semantica)
if (window.fetch){
  const _fetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    try{
      const resp = await _fetch(...args);
      if (!resp.ok) addDebugLog('warn', `Fetch ${args[0]} -> ${resp.status}`, {url: args[0], status: resp.status});
      return resp;
    }catch(e){ addDebugLog('error', `Fetch exception ${args[0]}`, {url: args[0], error: e.message}); throw e; }
  };
}


let model = null;
let isPredicting = false;
let lastSpoken = { key: null, time: 0 };
let touchStartY = 0;
let lastTopKey = null;

// Soglia di confidenza per parlare (60%)
const CONFIDENCE_THRESHOLD = 0.60;
const SPEAK_COOLDOWN_MS = 3000; // non ripetere la stessa parola per x ms

// Map semplice per scegliere i colori neon in base alla categoria/chiave
function getAccentColorForKey(key){
  if (!key) return getComputedStyle(document.documentElement).getPropertyValue('--neon-magenta');
  const k = key.toLowerCase();
  if (['cat','dog','person'].some(x=>k.includes(x))) return getComputedStyle(document.documentElement).getPropertyValue('--neon-viola');
  if (['bottle','cup','apple','banana'].some(x=>k.includes(x))) return getComputedStyle(document.documentElement).getPropertyValue('--neon-green');
  if (['car','motorbike','bicycle'].some(x=>k.includes(x))) return getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan');
  return getComputedStyle(document.documentElement).getPropertyValue('--neon-magenta');
}

// Mostra un anello luminoso al centro e lo colora
function showGlow(key){
  const color = getAccentColorForKey(key) || '#8a2bef';
  detectionRing.style.setProperty('--glow-color', color.trim());
  detectionRing.classList.add('active');
  // rimuovere dopo un tempo ragionevole
  clearTimeout(detectionRing._timeout);
  detectionRing._timeout = setTimeout(()=> detectionRing.classList.remove('active'), 1400);
}

// Aggiorna la bento grid con le predizioni (piccoli blocchi)
function updateBentoGrid(predictions){
  bentoGrid.innerHTML = '';
  predictions.forEach((p, idx) => {
    const key = p.className;
    const el = document.createElement('div');
    el.className = 'bento-card' + (idx===0? ' active': '');
    el.innerHTML = `<h4>${key}</h4><div class="meta">${(p.probability*100).toFixed(1)}% confidence</div><span class="accent" style="background:${getAccentColorForKey(key)}"></span>`;
    bentoGrid.appendChild(el);
  });
}

// Apri / chiudi pannello dettagli
function openDetailPanel(){ detailPanel.hidden = false; detailPanel.classList.add('open'); }
function closeDetailPanel(){ detailPanel.classList.remove('open'); setTimeout(()=> detailPanel.hidden = true, 420); }

// Toggle start/stop con micro-interazione
async function toggleStartStop(){
  if (!model) { statusEl.textContent = 'Modello non pronto...'; return; }
  if (!isPredicting){
    await startCamera();
    isPredicting = true; predictLoop();
    startBtn.textContent = 'Interrompi';
  }else{
    isPredicting = false; startBtn.textContent = 'Avvia riconoscimento';
  }
}

// Gesture handlers
video.addEventListener('click', () => toggleStartStop());
video.addEventListener('touchstart', (e)=> { touchStartY = e.changedTouches[0].clientY; });
video.addEventListener('touchend', (e)=>{
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (dy > 80) { openDetailPanel(); }
  else if (Math.abs(dy) < 10) { toggleStartStop(); }
});

// Chiudi pannello dettagli con un tap sulla maniglia
detailPanel.querySelector('.handle').addEventListener('click', ()=> closeDetailPanel());

// Usa Web Speech API per pronunciare la traduzione fonetica
function speak(text, dialect){
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'it-IT';
  utter.rate = 0.95;
  utter.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// Loop di inferenza continuo usando requestAnimationFrame
async function predictLoop(){
  if (!model) return;
  if (video.readyState < 2) { requestAnimationFrame(predictLoop); return; }

  try{
    const predictions = await model.classify(video, 4);
    if (predictions && predictions.length){
      const top = predictions[0];
      const key = findKeyForLabel(top.className);

      const now = Date.now();
      resultsArea.value = `Top: ${top.className} (${(top.probability*100).toFixed(1)}%)\n` + predictions.slice(1).map(p => `${p.className} - ${(p.probability*100).toFixed(1)}%`).join('\n');

      // Aggiorna UI Bento
      updateBentoGrid(predictions);
      // Mostra shade neon se sopra soglia
      if (key && top.probability >= CONFIDENCE_THRESHOLD){
        if (lastTopKey !== key) { // only pulse on changes
          showGlow(key);
          lastTopKey = key;
        }

        const dialect = dialectSelect.value;
        const translation = dialectDict[key] && dialectDict[key][dialect];
        if (translation){
          if (lastSpoken.key !== key || (now - lastSpoken.time) > SPEAK_COOLDOWN_MS){
            speak(translation, dialect);
            lastSpoken = { key, time: now };
          }
        }

        // Aggiorna pannello dettagli quando aperto
        detailsContent.textContent = `Oggetto: ${top.className} — ${(top.probability*100).toFixed(1)}%`;
      }
    }
  }catch(err){ console.error('Errore durante la predizione', err); addDebugLog('error','Errore durante la predizione', {message: err && (err.message || String(err)), stack: err && err.stack}); }

  if (isPredicting) requestAnimationFrame(predictLoop);
}

// Inizializzazione: carica il modello e registra il service worker (UMD-only flow)
async function init(){
  try{
    statusEl.textContent = 'Caricamento modello...';
    addDebugLog('info','init: avviato');
    addDebugLog('info','environment',{ ua: navigator.userAgent, platform: navigator.platform, mobile: /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) });
    addDebugLog('info','navigator.mediaDevices',{ mediaDevices: !!navigator.mediaDevices, getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) });

    const loadScript = (src) => new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { console.log('Script caricato:', src); addDebugLog('info', `script caricato: ${src}`); resolve(); };
      s.onerror = () => { addDebugLog('error', `Errore caricamento script: ${src}`); reject(new Error('Errore caricamento script: ' + src)); };
      document.head.appendChild(s);
    });

    // Carichiamo UMD in sequenza: tfjs -> tfjs-converter -> mobilenet
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
    // Diagnostica TF immediatamente dopo il load
    try{
      if (window.tf && window.tf.ready){
        await window.tf.ready();
        addDebugLog('info','tf ready',{version: window.tf.version && window.tf.version['tfjs'] ? window.tf.version['tfjs'] : window.tf.version, backend: window.tf.getBackend && window.tf.getBackend()});
        addDebugLog('info','tf backend info',{backend: window.tf.getBackend && window.tf.getBackend()});
      }else{ addDebugLog('warn','tf not present after script load'); }
    }catch(e){ addDebugLog('error','tf.ready failed',{error: e && e.message}); }

    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@3.21.0/dist/tf-converter.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');

    if (!window.mobilenet) { addDebugLog('error','MobileNet UMD non disponibile dopo caricamento'); throw new Error('MobileNet UMD non disponibile dopo caricamento'); }

    // Caricamento modello con timeout e logging dettagliato
    try{
      const t0 = Date.now();
      addDebugLog('info','mobilenet.load: start', {version:2, alpha:1.0});
      // Timeout dopo 15s per diagnosticare casi di rete lenta/malfunzionamento
      model = await Promise.race([
        window.mobilenet.load({version:2, alpha:1.0}),
        new Promise((_,rej)=> setTimeout(()=> rej(new Error('mobilenet.load timeout')), 15000))
      ]);
      addDebugLog('info','mobilenet.load: success', {durationMs: Date.now()-t0});
      statusEl.textContent = 'Modello caricato';
      addDebugLog('info','Modello MobileNet caricato (UMD)');
      console.log('Modello MobileNet caricato (UMD)');
    }catch(e){
      addDebugLog('error','mobilenet.load failed', {error: e && e.message});
      console.error('Errore durante il caricamento del modello', e);
      statusEl.textContent = 'Errore caricamento modello';

      // Proviamo a forzare backend CPU come fallback (alcuni dispositivi mobile hanno problemi con WebGL)
      try{
        if (window.tf && window.tf.setBackend){
          const current = window.tf.getBackend && window.tf.getBackend();
          addDebugLog('info','Attempting backend fallback', {currentBackend: current});
          await window.tf.setBackend('cpu');
          await window.tf.ready();
          addDebugLog('info','Backend switched to CPU', {backend: window.tf.getBackend && window.tf.getBackend()});
          // Ritentiamo il caricamento
          try{
            model = await window.mobilenet.load({version:2, alpha:1.0});
            addDebugLog('info','mobilenet.load success after CPU fallback');
            statusEl.textContent = 'Modello caricato (cpu)';
          }catch(retryErr){ addDebugLog('error','mobilenet.load retry failed', {error: retryErr && retryErr.message}); }
        }
      }catch(backendErr){ addDebugLog('error','backend fallback failed', {error: backendErr && backendErr.message}); }
    }

    // Registra il service worker, se possibile
    if ('serviceWorker' in navigator){
      try{
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registrato');
        addDebugLog('info','Service Worker registrato', {scope: registration.scope});
      }catch(err){ console.warn('Registrazione SW fallita', err); addDebugLog('warn','Registrazione SW fallita', {error: err && (err.name || err.message)}); }
    }

  }catch(e){
    console.error('Errore durante il caricamento del modello', e);
    statusEl.textContent = 'Errore caricamento modello';
  }
}

// Avvia la telecamera posteriore e imposta il video
async function startCamera(){
  try{
    addDebugLog('info','startCamera: requesting environment (exact)', {constraints:{video:{facingMode:{exact:'environment'}}, audio:false}});
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    statusEl.textContent = 'Camera attiva';
    addDebugLog('info','Camera attiva', {videoTracks: stream.getVideoTracks().map(t=>({label:t.label, facingMode: t.getSettings && t.getSettings().facingMode }))});
  }catch(err){
    addDebugLog('warn','startCamera exact failed', {error: err && (err.name || err.message)});
    // fallback - alcuni browser non supportano exact
    try{
      addDebugLog('info','startCamera: requesting environment (fallback)', {constraints:{video:{facingMode:'environment'}, audio:false}});
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
      video.srcObject = stream; await video.play();
      statusEl.textContent = 'Camera attiva (fallback)';
      addDebugLog('info','Camera attiva (fallback)', {videoTracks: stream.getVideoTracks().map(t=>({label:t.label, facingMode: t.getSettings && t.getSettings().facingMode }))});
    }catch(error){
      addDebugLog('error','Impossibile accedere alla camera', {error: error && (error.name || error.message)});
      console.error('Impossibile accedere alla camera', error);
      statusEl.textContent = 'Permesso camera negato o non disponibile';
      // attempt to list devices if possible
      try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        addDebugLog('info','Available devices', {devices: devices.map(d=>({kind:d.kind, label: d.label, deviceId: d.deviceId}))});
      }catch(enumErr){ addDebugLog('warn','enumerateDevices failed', {error: enumErr && (enumErr.name || enumErr.message)}); }
    }
  }
}

// Mappa l'etichetta fornita da MobileNet ad una chiave del dizionario
function findKeyForLabel(label){
  const normalized = label.toLowerCase();
  // Prova a trovare una chiave che sia contenuta nell'etichetta
  for (const key of Object.keys(dialectDict)){
    if (normalized.includes(key)) return key;
    // anche controllo per parole separate
    if (key.split(' ').some(k => normalized.includes(k))) return key;
  }
  return null; // nessuna corrispondenza
}

// NOTE: duplicate implementations of `speak` and `predictLoop` were removed here —
// the updated versions with UI/gesture integrations are defined earlier in the file.


// Click del bottone start
startBtn.addEventListener('click', async () => {
  addDebugLog('info','Start button pressed');
  if (!model){
    statusEl.textContent = 'Il modello non è ancora pronto, attendere...';
    addDebugLog('warn','Start cliccato ma modello non pronto');
    return;
  }
  await startCamera();
  if (!isPredicting){
    isPredicting = true; predictLoop();
    startBtn.textContent = 'Interrompi';
    addDebugLog('info','Riconoscimento avviato');
  }else{
    isPredicting = false; startBtn.textContent = 'Avvia riconoscimento';
    addDebugLog('info','Riconoscimento fermato');
  }
});

// Avvio carico modello all'apertura della pagina
function startInitIfNeeded(){
  addDebugLog('info','startup: checking readyState', {readyState: document.readyState});
  if (document.readyState === 'interactive' || document.readyState === 'complete'){
    addDebugLog('info','startup: DOM already ready, calling init immediately');
    init(); renderDebug();
  } else {
    window.addEventListener('DOMContentLoaded', () => { addDebugLog('info','DOMContentLoaded fired, calling init'); init(); renderDebug(); });
  }
}
startInitIfNeeded();

// Esporta per eventuali test/modularità
export default { init, startCamera, predictLoop };
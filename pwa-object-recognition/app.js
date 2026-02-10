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

// Stato debug (spostato in cima per evitare ReferenceError se addDebugLog viene chiamato presto)
const debugState = { logs: [] };
function addDebugLog(level, message, meta){
  try{
    const entry = { ts: new Date().toISOString(), level, message, meta };
    debugState.logs.unshift(entry);
    if (debugState.logs.length > 500) debugState.logs.pop();
    // renderDebug potrebbe non essere disponibile ancora quando la funzione è chiamata molto presto
    try{ renderDebug(); }catch(e){ /* no-op */ }
  }catch(e){ try{ console.error('addDebugLog internal error', e); }catch(_){} }
}

// Se esistono log precoci raccolti dallo stub in index.html, reinoltriamoli nel debugState
try{
  if (window.__earlyLogs && Array.isArray(window.__earlyLogs) && window.__earlyLogs.length){
    const count = window.__earlyLogs.length;
    window.__earlyLogs.forEach(([lvl,msg,meta]) => {
      try{ addDebugLog(lvl, msg, meta); }catch(e){ /* ignore individual failures */ }
    });
    addDebugLog('info','Flushed early logs',{count});
    // svuota l'array per evitare doppie invii
    window.__earlyLogs = [];
  }
}catch(e){ /* no-op */ }

if (video){
  ['loadedmetadata','canplay','play','playing','pause','error','stalled','suspend'].forEach(evt => {
    video.addEventListener(evt, (e) => { addDebugLog('info', `video event: ${evt}`, { readyState: video.readyState, currentSrc: video.currentSrc }); });
  });
}
const dialectSelect = document.getElementById('dialect');
if (dialectSelect){
  try{
    addDebugLog('info','dialect initial',{value: dialectSelect.value, options: Array.from(dialectSelect.options).map(o=>({value:o.value, disabled:o.disabled, selected:o.selected, text:o.text}))});
    dialectSelect.addEventListener('change', (e) => { addDebugLog('info','dialect changed',{value: e.target.value}); });
    // Ensure mobile accessibility: add a name attribute and touch-action
    dialectSelect.setAttribute('name','dialect-select');
    dialectSelect.style.touchAction = 'manipulation';
    // Ensure it's not accidentally disabled
    dialectSelect.disabled = false;
    // Raise z-index to avoid accidental overlaying by video elements
    dialectSelect.style.zIndex = 1000;

    // On touch devices, try to programmatically open the native picker when tapping the select wrap
    const selectWrap = document.querySelector('.select-wrap');
    if (selectWrap){
      selectWrap.addEventListener('touchstart', (ev) => {
        try{
          addDebugLog('info','select-wrap touchstart');
          // Attempt to open native picker
          dialectSelect.focus();
          // Programmatic click may help on some browsers
          dialectSelect.click();
          // For accessibility, also trigger a pointerdown
          dialectSelect.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));
        }catch(ex){ addDebugLog('warn','select-wrap touch failed',{error: ex && ex.message}); }
      }, {passive:true});
    }
  }catch(e){ addDebugLog('error','dialect init failed',{error: e && e.message}); }
}
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

// Render dei log nel pannello
function renderDebug(){
  if (!debugLogsEl) return;
  debugLogsEl.innerHTML = debugState.logs.map(l => {
    const meta = l.meta ? `<div class="debug-meta">${escapeHtml(JSON.stringify(l.meta))}</div>` : '';
    return `<div class="debug-entry level-${l.level}"><div><span class="level">${l.level.toUpperCase()}</span><span class="time">${l.ts}</span></div><div>${escapeHtml(l.message)}</div>${meta}</div>`;
  }).join('');
}

function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Robust export helper: tries download, then open in new tab, then clipboard
async function doExportFile(filename, content){
  const payload = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  try{
    addDebugLog('info','doExportFile start',{filename});
    const blob = new Blob([payload], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename || 'download.json'; a.style.display = 'none';
    document.body.appendChild(a);

    let clicked = false;
    try{
      a.click();
      clicked = true;
      addDebugLog('info','doExportFile: a.click() invoked');
    }catch(e){ addDebugLog('warn','doExportFile: a.click() failed',{error: e && e.message}); }

    // Some browsers ignore download attribute (mobile Safari/Chrome); fallback to open
    if (!clicked){
      try{ window.open(url, '_blank'); addDebugLog('info','doExportFile: opened blob in new tab'); }
      catch(e){ addDebugLog('warn','doExportFile: window.open failed',{error: e && e.message}); }
    }

    // last resort: copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText){
      try{ await navigator.clipboard.writeText(payload); addDebugLog('info','doExportFile: copied payload to clipboard'); }
      catch(e){ addDebugLog('warn','doExportFile: clipboard write failed',{error: e && e.message}); }
    }else{ addDebugLog('warn','doExportFile: clipboard API not available'); }

    // cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addDebugLog('info','doExportFile finished',{filename});
    return true;
  }catch(e){ addDebugLog('error','doExportFile failed',{error: e && e.message}); return false; }
}

// Export modal helpers
function openLogExportModal(filename, payload){
  try{
    const modal = document.getElementById('logExportModal');
    const ta = document.getElementById('logExportTextarea');
    const status = document.getElementById('logExportStatus');
    if (!modal || !ta) { addDebugLog('warn','openLogExportModal: DOM elements missing'); return; }
    const content = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    ta.value = content;
    modal.dataset.filename = filename || 'export.json';
    status.textContent = '';
    modal.hidden = false; modal.setAttribute('aria-hidden','false');
    // Auto-select content for easier long-press copy
    setTimeout(()=>{ ta.focus(); ta.select(); }, 120);
    addDebugLog('info','openLogExportModal',{filename});
  }catch(e){ addDebugLog('error','openLogExportModal failed',{error: e && e.message}); }
}
function closeLogExportModal(){
  const modal = document.getElementById('logExportModal');
  if (!modal) return; modal.hidden = true; modal.setAttribute('aria-hidden','true');
}

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
      // Mostra il modal con i log per permettere copia manuale o download dal telefono
      try{
        openLogExportModal('debug-logs.json', debugState.logs);
        addDebugLog('info','downloadLogs: opened export modal');
      }catch(e){ addDebugLog('error','downloadLogs open modal failed',{error: e && e.message}); }
    } else if (id === 'exportReport'){
      // Fallback per esportare report via delegazione (se il listener diretto non è presente)
      try{
        const regs = await (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]));
        const swInfo = regs.map(r=>({scope:r.scope, active: !!r.active, installing: !!r.installing, waiting: !!r.waiting}));
        const report = { ts: new Date().toISOString(), url: location.href, ua: navigator.userAgent, sw: swInfo, logs: debugState.logs, state: {modelLoaded: !!model, isPredicting, lastSpoken, lastTopKey} };
        addDebugLog('info','exportReport (delegation) preparing payload');
        openLogExportModal(`dialetti-report-${new Date().toISOString().replace(/[:.]/g,'-')}.json`, report);
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
    addDebugLog('info','exportReport preparing payload');
    openLogExportModal(`dialetti-report-${new Date().toISOString().replace(/[:.]/g,'-')}.json`, report);
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
    // rendiamo la card interattiva e accessibile
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.dataset.key = key;
    el.innerHTML = `<h4 class="bento-key" data-key="${escapeHtml(key)}">${escapeHtml(key)}</h4><div class="meta">${(p.probability*100).toFixed(1)}% confidence</div><span class="accent" style="background:${getAccentColorForKey(key)}"></span>`;
    bentoGrid.appendChild(el);
  });
}

// Interazione: click/tap e tastiera sulle card per pronunciare la traduzione nel dialetto selezionato
bentoGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.bento-card');
  if (!card) return;
  const displayLabel = card.dataset.key || (card.querySelector('.bento-key') && card.querySelector('.bento-key').dataset.key);
  if (!displayLabel) return;
  // Ricava la chiave usata dal dizionario (es. 'bottle' da 'wine bottle')
  const dictKey = findKeyForLabel(displayLabel) || displayLabel.toLowerCase();
  const dialect = dialectSelect.value;
  const translation = dialectDict[dictKey] && dialectDict[dictKey][dialect];
  const toSpeak = translation || dictKey || displayLabel;
  addDebugLog('info','User requested speak',{key: dictKey, displayLabel, dialect, hasTranslation: !!translation});
  // Su azione esplicita dell'utente parliamo immediatamente (ignoriamo cooldown)
  speak(toSpeak, dialect);
  lastSpoken = { key: dictKey, time: Date.now() };
  // Feedback visivo minimo
  card.classList.add('pressed');
  setTimeout(()=> card.classList.remove('pressed'), 320);
});

// Supporto accessibilità: invio via tastiera (Enter / Space)
bentoGrid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const card = e.target.closest('.bento-card');
    if (!card) return;
    e.preventDefault();
    card.click();
  }
});

// Dettaglio: click su nome nel pannello dettagli per pronunciare la traduzione
if (detailsContent){
  detailsContent.addEventListener('click', (e) => {
    const btn = e.target.closest('.detail-key');
    if (!btn) return;
    const displayLabel = btn.dataset.key;
    const dictKey = findKeyForLabel(displayLabel) || displayLabel.toLowerCase();
    const dialect = dialectSelect.value;
    const translation = dialectDict[dictKey] && dialectDict[dictKey][dialect];
    const toSpeak = translation || dictKey || displayLabel;
    addDebugLog('info','Detail panel speak',{key: dictKey, displayLabel, dialect, hasTranslation: !!translation});
    speak(toSpeak, dialect);
    lastSpoken = { key: dictKey, time: Date.now() };
  });

  detailsContent.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' '){
      const btn = e.target.closest('.detail-key');
      if (!btn) return; e.preventDefault(); btn.click();
    }
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
        // Rendiamo cliccabile il nome per permettere di pronunciarlo manualmente
        detailsContent.innerHTML = `Oggetto: <button class="detail-key" data-key="${escapeHtml(top.className)}" type="button">${escapeHtml(top.className)}</button> — ${(top.probability*100).toFixed(1)}%`;
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

// Model retry helpers: allow manual retry with logging and backend fallback
let modelLoading = false;
async function loadModelAttempt(timeoutMs = 15000){
  if (model) return model;
  if (modelLoading){ addDebugLog('warn','loadModelAttempt already running'); throw new Error('model loading in progress'); }
  modelLoading = true;
  try{
    if (!window.mobilenet){
      addDebugLog('info','loadModelAttempt: mobilenet missing — calling init() to (re)load scripts and model');
      await init();
      if (!model) throw new Error('init did not produce model');
      return model;
    }
    addDebugLog('info','loadModelAttempt: mobilenet present, loading model');
    const t0 = Date.now();
    const m = await Promise.race([
      window.mobilenet.load({version:2, alpha:1.0}),
      new Promise((_,rej)=> setTimeout(()=> rej(new Error('mobilenet.load timeout')), timeoutMs))
    ]);
    model = m;
    addDebugLog('info','loadModelAttempt success',{durationMs: Date.now()-t0});
    statusEl.textContent = 'Modello caricato (retry)';
    return model;
  }catch(err){
    addDebugLog('error','loadModelAttempt failed',{error: err && err.message});
    throw err;
  }finally{
    modelLoading = false;
  }
}

async function retryLoadModel(maxAttempts = 3, delayMs = 2000){
  for (let i=1;i<=maxAttempts;i++){
    try{
      addDebugLog('info',`retryLoadModel attempt ${i}/${maxAttempts}`);
      await loadModelAttempt();
      addDebugLog('info','retryLoadModel succeeded');
      return;
    }catch(err){
      addDebugLog('warn','retryLoadModel attempt failed',{attempt:i, error: err && err.message});
      // If webgl-related, try cpu backend
      try{
        if (window.tf && window.tf.setBackend && window.tf.getBackend && window.tf.getBackend() !== 'cpu'){
          addDebugLog('info','retryLoadModel: switching backend to cpu and retrying');
          await window.tf.setBackend('cpu');
          await window.tf.ready();
          addDebugLog('info','backend switched to cpu',{backend: window.tf.getBackend()});
        }
      }catch(be){ addDebugLog('warn','backend switch failed',{error: be && be.message}); }
      if (i < maxAttempts) await new Promise(res=>setTimeout(res, delayMs));
    }
  }
  throw new Error('All retryLoadModel attempts failed');
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

// Retry button hookup
const retryBtn = document.getElementById('retryModelBtn');
retryBtn?.addEventListener('click', async () => {
  addDebugLog('info','Retry model clicked');
  retryBtn.disabled = true; startBtn.disabled = true;
  try{
    statusEl.textContent = 'Riprovo caricamento modello...';
    await retryLoadModel(3,2000);
    addDebugLog('info','Retry model finished');
  }catch(e){
    addDebugLog('error','Retry model failed',{error: e && e.message});
    statusEl.textContent = 'Errore caricamento modello';
  }finally{
    retryBtn.disabled = false; startBtn.disabled = false;
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

// Export modal button handlers
const downloadLogBtn = document.getElementById('downloadLogBtn');
const copyLogBtn = document.getElementById('copyLogBtn');
const closeLogModalBtn = document.getElementById('closeLogModal');
const logExportTextarea = document.getElementById('logExportTextarea');
const logExportStatus = document.getElementById('logExportStatus');

if (downloadLogBtn){
  downloadLogBtn.addEventListener('click', async () => {
    try{
      const modal = document.getElementById('logExportModal');
      const filename = (modal && modal.dataset && modal.dataset.filename) || `export-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
      const payload = logExportTextarea.value;
      logExportStatus.textContent = 'Avvio download...';
      const ok = await doExportFile(filename, payload);
      logExportStatus.textContent = ok ? 'Scaricato / Aperto' : 'Tentativo di esportazione completato (usa Copia)';
      addDebugLog('info','downloadLogBtn result',{ok});
    }catch(e){ addDebugLog('error','downloadLogBtn failed',{error: e && e.message}); logExportStatus.textContent = 'Errore durante il download'; }
  });
}
if (copyLogBtn){
  copyLogBtn.addEventListener('click', async () => {
    try{
      const text = logExportTextarea.value;
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        logExportStatus.textContent = 'Copiato negli appunti';
        addDebugLog('info','copyLogBtn: copied to clipboard');
      }else{
        // fallback: select + execCommand
        logExportTextarea.select();
        const ok = document.execCommand && document.execCommand('copy');
        logExportStatus.textContent = ok ? 'Copiato (fallback)' : 'Copia non riuscita';
        addDebugLog('info','copyLogBtn fallback',{ok});
      }
    }catch(e){ addDebugLog('error','copyLogBtn failed',{error: e && e.message}); logExportStatus.textContent = 'Errore copia'; }
  });
}
if (closeLogModalBtn){ closeLogModalBtn.addEventListener('click', ()=> { closeLogExportModal(); }); }

// Esporta per eventuali test/modularità
export default { init, startCamera, predictLoop };
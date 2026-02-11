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

// Mappa alias: alcune etichette dal modello che contengono parole aggiuntive o sinonimi
const labelAliases = {
  "wine bottle": "bottle",
  "water bottle": "bottle",
  "beer bottle": "bottle",
  "cell phone": "phone",
  "mobile phone": "phone",
  "cellphone": "phone",
  "sports car": "car",
  "race car": "car",
  "bike": "bicycle",
  "motor scooter": "motorbike"
};

// Insulto Creativo — frasi bonarie per dialetto (puoi aggiungerne altre)
const creativeInsults = {
  "Romano": ["Aho, ma che roba è questa?!", "Vabbè, sto coso pare scappato da casa tua"],
  "Veneto": ["Ma che roba xe questa?!", "Ue, 'sto arnese me fa rider"],
  "Bergamasco": ["Ma che roba l'è?", "Te set bón de fa rider anca i sassi"],
  "Milanese": ["Ma l'è 'n càpitel!", "Ti gh'et propri un bel cos"],
  "Napoletano": ["Uè, che è chesta 'na robba?", "Statte accuort', pare 'nu giocattolo"],
  "Siciliano": ["Uè, chi è chistu?", "Eh, chista è roba d'atri tempi!"]
};

// Oggetti "sacri" per Easter Egg
const sacredObjects = new Set(['coffee','espresso','caffettiera','pepper','peperoncino','focaccia','pizza','pizza pie','caffè']);

// Emoji per le card (semplice mappa)
const emojiMap = {
  'cat':'🐱','dog':'🐶','bottle':'🍾','cup':'☕️','coffee':'☕️','pizza':'🍕','apple':'🍎','banana':'🍌','car':'🚗','person':'🧑','phone':'📱','book':'📚','bicycle':'🚲'};

// Confetti engine state
let confettiState = { ctx: null, particles: [], running:false };

function initConfetti(){
  try{
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    function resize(){
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr); confettiState.ctx = ctx;
    }
    resize(); window.addEventListener('resize', resize);
  }catch(e){ addDebugLog('warn','initConfetti failed',{error: e && e.message}); }
}

function triggerConfetti(count = 40){
  try{
    const canvas = document.getElementById('confettiCanvas'); if (!canvas) return;
    const ctx = confettiState.ctx || canvas.getContext('2d');
    const colors = [getComputedStyle(document.documentElement).getPropertyValue('--tile-yellow').trim(), getComputedStyle(document.documentElement).getPropertyValue('--tile-terracotta').trim(), getComputedStyle(document.documentElement).getPropertyValue('--tile-green').trim(), getComputedStyle(document.documentElement).getPropertyValue('--tile-blue').trim(), '#ff4db8'];
    const rect = canvas.getBoundingClientRect();
    // spawn particles
    for (let i=0;i<count;i++){
      confettiState.particles.push({
        x: Math.random()*rect.width, y: Math.random()*rect.height*0.4, vx: (Math.random()-0.5)*6, vy: Math.random()*6+2, size: Math.random()*10+6, color: colors[Math.floor(Math.random()*colors.length)], rot: Math.random()*360, dr: (Math.random()-0.5)*10
      });
    }
    if (confettiState.running) return; confettiState.running = true;
    const start = performance.now();
    function step(now){
      const dt = (now - (step._last||now))/1000; step._last = now;
      ctx.clearRect(0,0,rect.width,rect.height);
      for (let i=confettiState.particles.length-1;i>=0;i--){
        const p = confettiState.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.rot += p.dr*dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        ctx.restore();
        if (p.y > rect.height + 40) confettiState.particles.splice(i,1);
      }
      if (confettiState.particles.length){ requestAnimationFrame(step); } else { ctx.clearRect(0,0,rect.width,rect.height); confettiState.running = false; }
    }
    requestAnimationFrame(step);
  }catch(e){ addDebugLog('warn','triggerConfetti failed',{error: e && e.message}); }
}

// Carica eventuale file JSON esterno con traduzioni o suggerimenti (dialects.json / dialects_suggestions.json)
let externalDialectSuggestions = {};
let italianLabels = {};

// Sarcastic comments (caricati da sarcastic_comments.json se presente)
let sarcasticComments = { categories: {}, fallback: [], errors: [] };
async function loadSarcasticComments(){
  try{
    const resp = await fetch('sarcastic_comments.json', {cache:'no-store'});
    if (resp.ok){ const obj = await resp.json(); sarcasticComments = Object.assign(sarcasticComments, obj); addDebugLog('info','Loaded sarcastic_comments',{cats: Object.keys(sarcasticComments.categories).length}); }
  }catch(e){ addDebugLog('warn','sarcastic_comments.json not found or parse failed',{error: e && e.message}); }
}

// Storage per audio personalizzati (localStorage key prefix)
const AUDIO_STORAGE_PREFIX = 'dialetti_audio:';

async function loadExternalDialects(){
  try{
    addDebugLog('info','loadExternalDialects: start');
    await loadSarcasticComments().catch(e=> addDebugLog('warn','loadSarcasticComments failed',{error: e && e.message}));
    // carica file principale con traduzioni complete (se presente)
    try{
      const resp = await fetch('dialects.json', {cache: 'no-store'});
      if (resp.ok){
        const obj = await resp.json();
        // merge senza sovrascrivere traduzioni già presenti nel codice
        for (const [k,v] of Object.entries(obj)){
          if (!dialectDict[k]) dialectDict[k] = v;
          else {
            for (const [dName,trans] of Object.entries(v)){
              if (!dialectDict[k][dName]) dialectDict[k][dName] = trans;
            }
          }
        }
        addDebugLog('info','loadExternalDialects: merged dialects.json',{count: Object.keys(obj).length});
      }
    }catch(e){ addDebugLog('warn','loadExternalDialects: dialects.json not found or parse failed',{error: e && e.message}); }

    // carica suggerimenti (es. risultati del crawler) — opzionale
    try{
      const resp2 = await fetch('dialects_suggestions.json', {cache:'no-store'});
      if (resp2.ok){ externalDialectSuggestions = await resp2.json(); addDebugLog('info','Loaded dialect suggestions',{count: Object.keys(externalDialectSuggestions).length}); }
    }catch(e){ /* no-op */ }

    // carica i lemmi italiani (mappatura pulita da Wikipedia)
    try{
      const resp3 = await fetch('dialects_it_lemma.json', {cache:'no-store'});
      if (resp3.ok){ italianLabels = await resp3.json(); addDebugLog('info','Loaded italian labels',{count: Object.keys(italianLabels).length}); }
    }catch(e){ addDebugLog('warn','dialects_it_lemma.json not found or parse failed',{error: e && e.message}); }

    // rinfresca il select dei dialetti (se è presente)
    if (typeof populateDialectSelect === 'function') populateDialectSelect();
    try{ initConfetti(); }catch(e){ addDebugLog('warn','initConfetti failed at loadExternalDialects',{error: e && e.message}); }
    addDebugLog('info','loadExternalDialects: finished');
  }catch(e){ addDebugLog('error','loadExternalDialects failed',{error: e && e.message}); }
}

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

    // Populate select dynamically from dialectDict (keeps HTML in sync with available dialects)
    function populateDialectSelect(){
      const existing = new Set(Array.from(dialectSelect.options).map(o=>o.value));
      const dialectNames = new Set();
      Object.values(dialectDict).forEach(entry => Object.keys(entry).forEach(d => dialectNames.add(d)));
      Array.from(dialectNames).sort().forEach(d => {
        if (!existing.has(d)){
          const opt = document.createElement('option'); opt.value = d; opt.textContent = d;
          dialectSelect.appendChild(opt);
        }
      });
    }
    // chiamiamo subito per non cambiare behavior
    populateDialectSelect();

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

// Helpers per i "Commenti Sarcastici del Nonno"
function categorizeLabel(label){
  if (!label) return null;
  const s = label.toLowerCase();
  const tech = ['phone','smart','computer','pc','laptop','tablet','modem','microphone','camera','device','screen'];
  const food = ['pizza','pasta','coffee','caff','caffettiera','cup','tea','teiera','bread','baguette','banana','cauliflower','guacamole','hot dog','sandwich'];
  const clothing = ['shirt','jacket','coat','dress','shoe','hat','sneaker','bra','bikini','bow tie','cravat','cap','scarf'];
  const house = ['chair','table','door','bed','lamp','wardrobe','frying pan','toaster','teapot','bucket','barrel','binoculars','radio','palace','castle'];
  if (tech.some(k => s.includes(k))) return 'Technology';
  if (food.some(k => s.includes(k))) return 'FoodAndDrink';
  if (clothing.some(k => s.includes(k))) return 'Clothing';
  if (house.some(k => s.includes(k))) return 'Household';
  return null;
}

function getSarcasticComment(label, {isError=false} = {}){
  try{
    if (isError){
      const arr = (sarcasticComments && sarcasticComments.errors && sarcasticComments.errors.length) ? sarcasticComments.errors : ["Manco l'IA sa cos'è 'sta schifezza."];
      return arr[Math.floor(Math.random()*arr.length)];
    }
    const cat = categorizeLabel(label);
    if (cat && sarcasticComments && sarcasticComments.categories && sarcasticComments.categories[cat] && sarcasticComments.categories[cat].length){
      const arr = sarcasticComments.categories[cat];
      return arr[Math.floor(Math.random()*arr.length)];
    }
    const fallback = (sarcasticComments && sarcasticComments.fallback && sarcasticComments.fallback.length) ? sarcasticComments.fallback : ["Ma che roba è? Ai miei tempi non esisteva."];
    return fallback[Math.floor(Math.random()*fallback.length)];
  }catch(e){ return "Eh, il nonno è senza parole..."; }
}

// Global helper to manually test creative insults from console
window.playInsult = async (dialect) => {
  try{
    const d = dialect || (dialectSelect && dialectSelect.value) || 'Romano';
    const phrases = creativeInsults[d] || creativeInsults['Romano'];
    const pick = phrases[Math.floor(Math.random()*phrases.length)];
    // Per "Insulto Creativo" non usare TTS: prova prima audio locale, altrimenti mostra il testo
    const played = await playDialectPhrase(d);
    if (!played){
      addDebugLog('info','playInsult: no recorded audio available, TTS disabled for insults',{dialect: d, text: pick});
      try{ detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = pick); }catch(_){}
    } else {
      addDebugLog('info','playInsult: played recorded insult audio',{dialect: d});
    }
    return true;
  }catch(e){ console.error('playInsult failed', e); return false; }
};

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
// Audio concurrency guard — evita sovrapposizioni tra file audio e TTS
let _currentAudio = null; // HTMLAudioElement in riproduzione
let _currentTTS = false; // true se c'è un utter attivo
window._lastUtter = null;
function stopAllVoices(){
  try{
    // stop audio element
    if (_currentAudio){
      try{ _currentAudio.pause(); }catch(_){}
      try{ _currentAudio.src = ''; }catch(_){}
      addDebugLog('info','stopAllVoices: stopped current audio');
      _currentAudio = null;
    }
    // stop any WebSpeech utterance
    try{
      if ('speechSynthesis' in window){
        if (window._lastUtter && typeof window._lastUtter.onend === 'function'){
          // detach handlers to avoid double-clear
          window._lastUtter.onend = null;
          window._lastUtter.oncancel = null;
        }
        window.speechSynthesis.cancel();
      }
    }catch(e){ addDebugLog('warn','stopAllVoices: speechSynthesis cancel failed',{error: e && e.message}); }
    if (_currentTTS){ addDebugLog('info','stopAllVoices: stopped TTS'); }
    _currentTTS = false;
    window._lastUtter = null;
  }catch(e){ addDebugLog('warn','stopAllVoices failed',{error: e && e.message}); }
}
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
    const dictKey = findKeyForLabel(key) || key.toLowerCase();
    const displayName = italianLabels[dictKey] || key;
    const el = document.createElement('div');
    // alternate playful look for variety
    el.className = 'bento-card' + (idx===0? ' active playful': ' playful');
    // rendiamo la card interattiva e accessibile
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.dataset.key = key;
    const emoji = emojiMap[dictKey] || emojiMap[key.toLowerCase()] || '';
    el.innerHTML = `<h4 class="bento-key" data-key="${escapeHtml(key)}">${emoji ? `<span class="emoji">${emoji}</span>`: ''}${escapeHtml(displayName)}</h4><div class="meta">${(p.probability*100).toFixed(1)}% confidence</div><span class="accent" style="background:${getAccentColorForKey(key)}"></span>`;
    bentoGrid.appendChild(el);
  });
}

// Interazione: click/tap e tastiera sulle card per pronunciare la traduzione nel dialetto selezionato
if (bentoGrid){
  bentoGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.bento-card');
    if (!card) return;
    const displayLabel = card.dataset.key || (card.querySelector('.bento-key') && card.querySelector('.bento-key').dataset.key);
    if (!displayLabel) return;
    // Ricava la chiave usata dal dizionario (es. 'bottle' da 'wine bottle')
    const dictKey = findKeyForLabel(displayLabel) || displayLabel.toLowerCase();
    const dialect = dialectSelect.value;
    const translation = dialectDict[dictKey] && dialectDict[dictKey][dialect];
    const toSpeak = translation || italianLabels[dictKey] || dictKey || displayLabel;
    addDebugLog('info','User requested speak',{key: dictKey, displayLabel, dialect, hasTranslation: !!translation, italianFallback: !!italianLabels[dictKey]});

    // Preferenza: se Insulto Creativo è attivo, pronuncia una frase umoristica del dialetto scelto; altrimenti comportati come prima
    try{
      const insultOn = document.getElementById('insultMode') && document.getElementById('insultMode').checked;
      if (insultOn){
        const phrases = creativeInsults[dialect] || creativeInsults['Romano'] || ['Ma che roba è?'];
        const pick = phrases[Math.floor(Math.random()*phrases.length)];
        // prova prima audio registrato; se non disponibile non usare la TTS (evita voce femminile)
        const played = await playDialectPhrase(dialect, dictKey);
        if (!played) { addDebugLog('info','Insult mode: no local audio, skipping TTS per preference',{dialect, pick}); }
        // visual feedback
        detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = pick);
        detailsContent.querySelector('.grandpa-comment') && (detailsContent.querySelector('.grandpa-comment').textContent = getSarcasticComment(displayName || (italianLabels[key] || key)));
      } else {
        if (translation) {
          const phrasePlayed = await playDialectPhrase(dialect, dictKey);
          if (!phrasePlayed) { speak(translation, dialect); }
        } else {
          const played = await playDialectPhrase(dialect, dictKey);
          if (!played) {
            if (!playCustomAudio(dictKey, dialect)) speak(toSpeak, dialect);
          }
        }
      }
    } catch(e){ addDebugLog('error','playDialect/translation/insult failed',{error: e && e.message});
      // fallback
      const insultOn = document.getElementById('insultMode') && document.getElementById('insultMode').checked;
      if (insultOn){ const phrases = creativeInsults[dialect] || creativeInsults['Romano'] || ['Mah...']; addDebugLog('info','Insult fallback: skipping TTS per preference',{dialect, phrase: phrases[0]}); try{ detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = phrases[0]); }catch(_){} }
      else if (translation) speak(translation, dialect); else if (!playCustomAudio(dictKey, dialect)) speak(toSpeak, dialect);
    }

    lastSpoken = { key: dictKey, time: Date.now() };
    // Feedback visivo minimo
    card.classList.add('pressed');
    setTimeout(()=> card.classList.remove('pressed'), 320);
    // piccolo festeggiamento locale
    try{ triggerConfetti(8); }catch(e){ /* ignore */ }
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
} else { addDebugLog('warn','bentoGrid not found — UI may be incomplete'); }

// Dettaglio: click su nome nel pannello dettagli per pronunciare la traduzione
if (detailsContent){
  detailsContent.addEventListener('click', (e) => {
    const btn = e.target.closest('.detail-key');
    if (!btn) return;
    const displayLabel = btn.dataset.key;
    const dictKey = findKeyForLabel(displayLabel) || displayLabel.toLowerCase();
    const dialect = dialectSelect.value;
    const translation = dialectDict[dictKey] && dialectDict[dictKey][dialect];
    const toSpeak = translation || italianLabels[dictKey] || dictKey || displayLabel;
    addDebugLog('info','Detail panel speak',{key: dictKey, displayLabel, dialect, hasTranslation: !!translation, italianFallback: !!italianLabels[dictKey]});
    if (!playCustomAudio(dictKey, dialect)) speak(toSpeak, dialect);
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
function closeDetailPanel(){ detailPanel.classList.remove('open'); const footer = document.getElementById('detailFooter'); if (footer) footer.hidden = true; setTimeout(()=> detailPanel.hidden = true, 420); }

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
function speak(text, dialect, opts = {}){
  if (!text) return;
  // first try custom uploaded audio for emphasis
  try{
    const played = playCustomAudio(text, dialect);
    if (played) return;
  }catch(e){ /* ignore and fallback to TTS */ }

  const force = opts && opts.force;
  // If Insulto Creativo is active, suppress TTS entirely (user preference: no female voice for insults)
  try{
    const insultOn = document.getElementById('insultMode') && document.getElementById('insultMode').checked;
    if (insultOn && !force){ addDebugLog('info','speak suppressed because Insulto Creativo active',{text}); try{ detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = text); }catch(_){} return; }
  }catch(e){ /* ignore DOM errors and continue to TTS fallback */ }

  // If user selected OpenTTS explicitly and has endpoint configured, prefer it
  try{
    const voiceSource = (document.getElementById('voiceSource') && document.getElementById('voiceSource').value) || 'auto';
    if (voiceSource === 'opentts' || voiceSource === 'auto'){
      const endpointInput = document.getElementById('openttsEndpoint');
      const endpoint = (endpointInput && endpointInput.value) || '';
      if (endpoint){
        const ok = await speakViaOpenTTS(text, dialect, endpoint);
        if (ok) return;
      }
    }
  }catch(e){ addDebugLog('warn','speak: OpenTTS attempt failed',{error: e && e.message}); }

  if (!('speechSynthesis' in window)) return;
  // ensure no other audio or TTS is playing
  stopAllVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'it-IT';
  utter.rate = 0.95;
  utter.pitch = 1.0;
  // mark TTS active and attach handlers to clear state
  _currentTTS = true;
  window._lastUtter = utter;
  utter.onstart = function(){ addDebugLog('info','speak: TTS started',{text, dialect}); };
  utter.onend = function(){ addDebugLog('info','speak: TTS ended',{text, dialect}); _currentTTS = false; if (window._lastUtter === utter) window._lastUtter = null; };
  utter.onerror = function(e){ addDebugLog('error','speak: TTS error',{text, dialect, error: e && e.error}); _currentTTS = false; if (window._lastUtter === utter) window._lastUtter = null; };
  utter.onpause = function(){ addDebugLog('info','speak: TTS paused',{text, dialect}); };
  try{ window.speechSynthesis.speak(utter); }catch(e){ addDebugLog('error','speak: speechSynthesis.speak failed',{error: e && e.message}); _currentTTS = false; window._lastUtter = null; }
}

// ---- Giocose funzionalità: Cafone-Meter, Insulti Creativi, audio personalizzati, condivisione, easter eggs ----

function computeCafoneScore(key, probability){
  let score = (probability || 0) * 10; // 0..10
  const k = (key || '').toLowerCase();
  if (/coffee|caff|espresso|moka|caffettiera/.test(k)) score += 2.2;
  if (/pizza|focaccia|pepperoncino|peperoncino|chili|guacamole/.test(k)) score += 1.8;
  if (/cup|bottle|glass/.test(k)) score += 0.8;
  // clamp
  score = Math.max(0, Math.min(10, Math.round(score*10)/10));
  return score;
}

// --- Nuova funzionalità: parla in italiano e traduci nel dialetto scelto ---
let _italianToKeyMap = null;
function buildItalianToKeyMap(){
  if (_italianToKeyMap) return _italianToKeyMap;
  _italianToKeyMap = {};
  try{
    for (const [k,v] of Object.entries(italianLabels || {})){
      if (!v) continue;
      const norm = String(v).toLowerCase().trim().replace(/[.,()]/g,'');
      _italianToKeyMap[norm] = k;
    }
    for (const [k,langs] of Object.entries(dialectDict)){
      for (const langVal of Object.values(langs)){
        if (!langVal) continue;
        const norm = String(langVal).toLowerCase().trim().replace(/[.,()]/g,'');
        if (!_italianToKeyMap[norm]) _italianToKeyMap[norm] = k;
      }
    }
  }catch(e){ addDebugLog('warn','buildItalianToKeyMap failed',{error: e && e.message}); }
  return _italianToKeyMap;
}

function translateItalianToDialect(text, dialect){
  if (!text) return '';
  buildItalianToKeyMap();
  const cleaned = String(text).toLowerCase().replace(/[?.!]/g,' ').replace(/\s+/g,' ').trim();
  if (!cleaned) return '';
  const tokens = cleaned.split(' ');
  const out = [];
  const maxGram = Math.min(4, tokens.length);
  for (let i=0;i<tokens.length;){
    let matched = false;
    for (let len = maxGram; len>=1; len--){
      if (i+len > tokens.length) continue;
      const phrase = tokens.slice(i,i+len).join(' ');
      if (_italianToKeyMap[phrase]){
        const key = _italianToKeyMap[phrase];
        const trans = (dialectDict[key] && dialectDict[key][dialect]) || null;
        if (trans) out.push(trans);
        else out.push(phrase);
        i += len; matched = true; break;
      }
      const fk = findKeyForLabel(phrase);
      if (fk){ const trans = (dialectDict[fk] && dialectDict[fk][dialect]) || null; if (trans) out.push(trans); else out.push(phrase); i += len; matched = true; break; }
    }
    if (!matched){ out.push(tokens[i]); i++; }
  }

  // Fallback robusto per parole singole o mismatch: tenta matching senza diacritici e confronto parziale
  const removeDiacritics = s => s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,'') : s;
  const joined = out.join(' ').trim();
  if (joined === cleaned || joined.split(' ').every((w,idx) => w === tokens[idx])){
    addDebugLog('info','translateItalianToDialect: applying fallback matching for single words',{input: cleaned});
    const final = tokens.map(token => {
      const tNorm = removeDiacritics(token);
      // check italianLabels
      for (const [k,v] of Object.entries(italianLabels || {})){
        if (!v) continue;
        const vn = removeDiacritics(String(v).toLowerCase());
        if (vn === tNorm || vn.includes(tNorm) || tNorm.includes(vn)){
          const trans = (dialectDict[k] && dialectDict[k][dialect]) || null;
          if (trans){ addDebugLog('info','translateItalianToDialect: fallback matched italianLabels',{token, key:k, trans}); return trans; }
        }
      }
      // check dialectDict values
      for (const [k,langs] of Object.entries(dialectDict)){
        for (const val of Object.values(langs)){
          if (!val) continue;
          const vn = removeDiacritics(String(val).toLowerCase());
          if (vn === tNorm || vn.includes(tNorm) || tNorm.includes(vn)){
            const trans = (dialectDict[k] && dialectDict[k][dialect]) || null;
            if (trans){ addDebugLog('info','translateItalianToDialect: fallback matched dialectDict',{token, key:k, trans}); return trans; }
          }
        }
      }
      // try findKeyForLabel (English model label heuristics)
      const fk = findKeyForLabel(token);
      if (fk){ const trans = (dialectDict[fk] && dialectDict[fk][dialect]) || null; if (trans){ addDebugLog('info','translateItalianToDialect: fallback matched findKey',{token, key:fk, trans}); return trans; } }
      // no match: return original token
      return token;
    });
    return final.join(' ');
  }

  return out.join(' ');
}

let _recognition = null;
function initSpeechRecognition(){
  try{
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    _recognition = new SR();
    _recognition.lang = 'it-IT';
    _recognition.interimResults = true;
    _recognition.maxAlternatives = 1;
  }catch(e){ addDebugLog('warn','initSpeechRecognition catch',{error: e && e.message}); return false; }
}

// Load OpenTTS and Coqui configuration from credentials JSONs (if present) and prefill endpoint inputs
async function loadOpenTTSConfig(){
  try{
    // OpenTTS config
    try{
      const resp = await fetch('credentials/opentts.json', {cache:'no-store'});
      if (resp.ok){
        const cfg = await resp.json();
        const endpointInput = document.getElementById('openttsEndpoint');
        if (endpointInput && cfg.endpoint) endpointInput.value = cfg.endpoint;
        if (endpointInput && cfg.voice_map) endpointInput.dataset.voice = JSON.stringify(cfg.voice_map);
        addDebugLog('info','loadOpenTTSConfig: loaded opentts',{endpoint: cfg.endpoint, voices: Object.keys(cfg.voice_map||{})});
      } else addDebugLog('info','loadOpenTTSConfig: no opentts config');
    }catch(e){ addDebugLog('info','loadOpenTTSConfig: opentts fetch failed',{error: e && e.message}); }

    // Coqui config
    try{
      const resp2 = await fetch('credentials/coqui.json', {cache:'no-store'});
      if (resp2.ok){
        const cfg2 = await resp2.json();
        const ep2 = document.getElementById('coquiEndpoint');
        if (ep2 && cfg2.endpoint) ep2.value = cfg2.endpoint;
        if (ep2 && cfg2.voice_map) ep2.dataset.voice = JSON.stringify(cfg2.voice_map);
        addDebugLog('info','loadOpenTTSConfig: loaded coqui',{endpoint: cfg2.endpoint, model: cfg2.model, voices: Object.keys(cfg2.voice_map||{})});
      } else addDebugLog('info','loadOpenTTSConfig: no coqui config');
    }catch(e){ addDebugLog('info','loadOpenTTSConfig: coqui fetch failed',{error: e && e.message}); }

    // Set selected voice for current dialects if possible
    try{
      const dialect = (dialectSelect && dialectSelect.value) || '';
      const ep = document.getElementById('openttsEndpoint'); if (ep && ep.dataset && ep.dataset.voice){ const vm = JSON.parse(ep.dataset.voice || '{}'); ep.dataset.selectedVoice = vm[dialect] || vm['default'] || ''; }
      const ep2 = document.getElementById('coquiEndpoint'); if (ep2 && ep2.dataset && ep2.dataset.voice){ const vm2 = JSON.parse(ep2.dataset.voice || '{}'); ep2.dataset.selectedVoice = vm2[dialect] || vm2['default'] || ''; }
    }catch(e){}
    return true;
  }catch(e){ addDebugLog('warn','loadOpenTTSConfig failed',{error: e && e.message}); return false; }
}
    _recognition.onstart = function(){ document.getElementById('recStatus') && (document.getElementById('recStatus').textContent = 'Ascoltando...'); addDebugLog('info','speechRecognition: started'); };
    _recognition.onresult = function(evt){ try{ const inter = Array.from(evt.results).map(r => r[0].transcript).join(' '); const el = document.getElementById('translateInput'); if (el) el.value = inter; }catch(e){ addDebugLog('warn','speechRecognition onresult failed',{error: e && e.message}); } };
    _recognition.onend = function(){ try{ document.getElementById('startRecBtn') && document.getElementById('startRecBtn').classList.remove('active'); document.getElementById('recStatus') && (document.getElementById('recStatus').textContent = ''); const txt = document.getElementById('translateInput') && document.getElementById('translateInput').value; const dialect = (dialectSelect && dialectSelect.value) || 'Romano'; if (txt && txt.trim()){ const translated = translateItalianToDialect(txt, dialect); detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = translated); speak(translated, dialect, {force:true}); addDebugLog('info','speechRecognition: final',{transcript: txt, translated}); } }catch(e){ addDebugLog('error','speechRecognition onend failed',{error: e && e.message}); } };
    _recognition.onerror = function(e){ addDebugLog('error','speechRecognition error',{error: e && e.error}); document.getElementById('recStatus') && (document.getElementById('recStatus').textContent = 'Errore riconoscimento'); };
    return true;
  }catch(e){ addDebugLog('warn','initSpeechRecognition failed',{error: e && e.message}); return false; }
}

// UI wiring for the translation controls
(function attachTranslationControls(){
  try{
    const startBtn = document.getElementById('startRecBtn');
    const translateBtn = document.getElementById('translateBtn');
    const input = document.getElementById('translateInput');
    if (!startBtn || !translateBtn || !input) return;

    // utility: when dialect changes, update default OpenTTS/Coqui voice dataset if config loaded
    try{
      const endpointInput = document.getElementById('openttsEndpoint');
      const coquiInput = document.getElementById('coquiEndpoint');
      const checkBtn = document.getElementById('checkCoquiBtn');
      if (endpointInput){
        const updateVoiceForDialect = () => {
          try{
            const cfgVoice = endpointInput.dataset && endpointInput.dataset.voice ? JSON.parse(endpointInput.dataset.voice || '{}') : null;
            const dialect = (dialectSelect && dialectSelect.value) || '';
            if (cfgVoice && typeof cfgVoice === 'object'){
              const selected = cfgVoice[dialect] || cfgVoice['default'] || '';
              if (selected) endpointInput.dataset.selectedVoice = selected;
            }
          }catch(e){ /* ignore */ }
        };
        dialectSelect && dialectSelect.addEventListener('change', updateVoiceForDialect);
        // call once at startup
        setTimeout(updateVoiceForDialect, 300);
      }
      if (coquiInput){
        const updateCoquiForDialect = () => {
          try{
            const cfgVoice = coquiInput.dataset && coquiInput.dataset.voice ? JSON.parse(coquiInput.dataset.voice || '{}') : null;
            const dialect = (dialectSelect && dialectSelect.value) || '';
            if (cfgVoice && typeof cfgVoice === 'object'){
              const selected = cfgVoice[dialect] || cfgVoice['default'] || '';
              if (selected) coquiInput.dataset.selectedVoice = selected;
            }
          }catch(e){ /* ignore */ }
        };
        dialectSelect && dialectSelect.addEventListener('change', updateCoquiForDialect);
        setTimeout(updateCoquiForDialect, 300);
      }
      if (checkBtn){ checkBtn.addEventListener('click', ()=> verifyCoquiEndpoint()); }
    }catch(e){ addDebugLog('warn','attachTranslationControls: updateVoiceForDialect setup failed',{error: e && e.message}); }
    startBtn.addEventListener('click', ()=>{
      if (!_recognition){ const ok = initSpeechRecognition(); if (!ok){ alert('Riconoscimento vocale non disponibile qui'); return; } }
      if (_recognition && _recognition._running){ try{ _recognition.stop(); }catch(_){} _recognition._running = false; startBtn.classList.remove('active'); document.getElementById('recStatus') && (document.getElementById('recStatus').textContent = ''); }
      else { try{ _recognition.start(); _recognition._running = true; startBtn.classList.add('active'); }catch(e){ addDebugLog('error','start recognition failed',{error: e && e.message}); alert('Impossibile avviare il microfono'); } }
    });
    translateBtn.addEventListener('click', async ()=>{
      try{
        const txt = input.value || '';
        if (!txt.trim()){ alert('Scrivi o pronuncia qualcosa in italiano prima di tradurre'); return; }
        const dialect = (dialectSelect && dialectSelect.value) || 'Romano';
        const translated = translateItalianToDialect(txt, dialect);
        detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = translated);
        // Pronuncia/mostra traduzione: forziamo la TTS anche se Insulto Creativo è attivo (utente ha richiesto traduzione esplicita)
        const voiceSource = (document.getElementById('voiceSource') && document.getElementById('voiceSource').value) || 'auto';
        if (voiceSource === 'opentts' || voiceSource === 'auto'){
          const endpointInput = document.getElementById('openttsEndpoint');
          const endpoint = (endpointInput && endpointInput.value) || '';
          if (endpoint){
            const ok = await speakViaOpenTTS(translated, dialect, endpoint);
            if (ok) { addDebugLog('info','translateBtn: played via OpenTTS',{translated, dialect}); return; }
          }
        }
        speak(translated, dialect, {force:true});
        addDebugLog('info','translateBtn: translated',{input: txt, translated, dialect});
      }catch(e){ addDebugLog('error','translateBtn handler failed',{error: e && e.message}); }
    });
  }catch(e){ addDebugLog('warn','attachTranslationControls failed',{error: e && e.message}); }
})();

function getCafoneQuip(key, score){
  const base = `Voto ${Math.round(score)}/10:`;
  const k = (key||'').toLowerCase();
  if (/coffee|caff|espresso/.test(k)) return `${base} Questo ti risveglia pure i bisnonni.`;
  if (/pizza|focaccia/.test(k)) return `${base} Santo cielo, chiamate la nonna: qui si fa festa.`;
  if (/pepperon|chili/.test(k)) return `${base} Piccante come la zia al pranzo di Natale.`;
  if (/bottle|wine/.test(k)) return `${base} Ecco, questo promette aperitivo.`;
  return `${base} Decisamente 'na chicca, te sì bravə.`;
}

function triggerExclaim(){
  const ex = document.createElement('div');
  ex.className = 'exclaim';
  const picks = ['💥','🎉','😲','🔥','🤌','😭','🤩','🫶','🍻','👏'];
  ex.textContent = picks[Math.floor(Math.random()*picks.length)];
  document.body.appendChild(ex);
  // occasionaletto confetti
  if (Math.random() < 0.25){ try{ triggerConfetti(12); }catch(e){} }
  setTimeout(()=> { ex.remove(); }, 1400);
}

async function triggerLegendary(key){
  try{ playLegendarySound(); triggerConfetti(80); }
  catch(e){ addDebugLog('warn','triggerLegendary sound/celebrate failed',{error: e && e.message}); }
}

// basic WebAudio pluck for the 'legendary' effect (no files required)
function playLegendarySound(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    // quick pluck
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    o.start(now); o.stop(now + 1.0);
    // small chorus
    setTimeout(()=>{ try{ ctx.close(); }catch(_){} }, 1400);
  }catch(e){ console.warn('playLegendarySound error', e); }
}

function playCustomAudio(keyOrText, dialect){
  try{
    // keyOrText might be a dictKey or a text; prefer to look up by current footer dataset
    const dictKey = keyOrText.toLowerCase();
    const dialectId = dialect || (dialectSelect && dialectSelect.value) || '';
    const storageKey = AUDIO_STORAGE_PREFIX + dictKey + '|' + dialectId;
    const fallbackKey = AUDIO_STORAGE_PREFIX + dictKey + '|';
    const b64 = localStorage.getItem(storageKey) || localStorage.getItem(fallbackKey);
    if (!b64) return false;
    const blob = b64ToBlob(b64);
    const url = URL.createObjectURL(blob);
    // stop any ongoing playback to avoid overlapping voices
    stopAllVoices();
    const a = new Audio(url);
    _currentAudio = a;
    a.addEventListener('playing', ()=> addDebugLog('info','playCustomAudio: started playing',{key: dictKey, dialect: dialectId}));
    a.addEventListener('error', (ev)=> addDebugLog('error','playCustomAudio: audio error',{key: dictKey, dialect: dialectId, code: a.error && a.error.code, message: a.error && a.error.message}));
    a.play().catch(e => addDebugLog('warn','playCustomAudio play failed',{error: e && e.message}));
    a.onended = () => { URL.revokeObjectURL(url); if (_currentAudio === a) _currentAudio = null; addDebugLog('info','playCustomAudio: ended playing',{key: dictKey, dialect: dialectId}); };
    return true;
  }catch(e){ addDebugLog('error','playCustomAudio failed',{error: e && e.message}); return false; }
} 

function b64ToBlob(b64){
  const parts = b64.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const buf = new Uint8Array(bytes.length);
  for(let i=0;i<bytes.length;i++) buf[i]=bytes.charCodeAt(i);
  return new Blob([buf], {type:mime});
}

// ===== Audio helpers: play audio files for dialect phrases =====
async function playAudioPath(path){
  try{
    // normalize backslashes
    path = path.replace(/\\\\/g, '/');
    // stop any ongoing playback to avoid overlapping voices
    stopAllVoices();
    const audio = new Audio(path);
    _currentAudio = audio;
    audio.addEventListener('playing', ()=> { addDebugLog('info','playAudioPath: started playing',{path}); });
    audio.addEventListener('ended', ()=> { try{ audio.src = ''; if (_currentAudio === audio) _currentAudio = null; addDebugLog('info','playAudioPath: ended playing',{path}); }catch(_){} });
    audio.addEventListener('error', (ev)=> { addDebugLog('error','playAudioPath: audio error',{path, code: audio.error && audio.error.code, message: audio.error && audio.error.message}); });
    await audio.play();
    return true;
  }catch(e){ addDebugLog('warn','playAudioPath failed',{path, error: e && e.message}); return false; }
}

// Speak via OpenTTS (tries /api/tts then /speak). Returns true if audio played successfully
async function speakViaOpenTTS(text, dialect, endpoint){
  try{
    if (!text) return false;
    const ep = (endpoint || '').replace(/\/$/, '');
    if (!ep) return false;

    // Stop existing audio/TTS before requesting new
    stopAllVoices();

    // Attempt 1: POST /api/tts (JSON body)
    try{
      const voice = (document.getElementById('openttsEndpoint') && document.getElementById('openttsEndpoint').dataset && document.getElementById('openttsEndpoint').dataset.voice) || '';
      const payload = { input: text, voice: voice || '', format: 'mp3' };
      const resp = await fetch(ep + '/api/tts', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok){
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _currentAudio = audio;
        audio.addEventListener('playing', ()=> addDebugLog('info','speakViaOpenTTS: started',{endpoint: ep}));
        audio.addEventListener('ended', ()=> { URL.revokeObjectURL(url); if (_currentAudio === audio) _currentAudio = null; addDebugLog('info','speakViaOpenTTS: ended',{endpoint: ep}); });
        audio.play();
        return true;
      }
    }catch(e){ addDebugLog('warn','speakViaOpenTTS attempt /api/tts failed',{error: e && e.message}); }

    // Attempt 2: POST /speak (form data)
    try{
      const form = new FormData(); form.append('input', text); form.append('format','mp3');
      const resp2 = await fetch(ep + '/speak', { method: 'POST', body: form });
      if (resp2.ok){ const blob2 = await resp2.blob(); const url2 = URL.createObjectURL(blob2); const audio2 = new Audio(url2); _currentAudio = audio2; audio2.addEventListener('playing', ()=> addDebugLog('info','speakViaOpenTTS: started,/speak',{endpoint: ep})); audio2.addEventListener('ended', ()=> { URL.revokeObjectURL(url2); if (_currentAudio === audio2) _currentAudio = null; addDebugLog('info','speakViaOpenTTS: ended,/speak',{endpoint: ep}); }); audio2.play(); return true; }
    }catch(e){ addDebugLog('warn','speakViaOpenTTS attempt /speak failed',{error: e && e.message}); }

    addDebugLog('warn','speakViaOpenTTS: no supported endpoints responded',{endpoint: ep});
    return false;
  }catch(e){ addDebugLog('error','speakViaOpenTTS failed',{error: e && e.message}); return false; }
}

// Speak via Coqui TTS (POST /speak directly). Returns true if audio played successfully
async function speakViaCoqui(text, dialect, endpoint){
  try{
    if (!text) return false;
    const ep = (endpoint || '').replace(/\/$/, '');
    if (!ep) return false;
    stopAllVoices();
    try{
      const form = new FormData(); form.append('input', text); form.append('format','mp3'); form.append('speaker','');
      const resp = await fetch(ep + '/speak', { method: 'POST', body: form });
      if (resp.ok){
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _currentAudio = audio;
        audio.addEventListener('playing', ()=> addDebugLog('info','speakViaCoqui: started',{endpoint: ep}));
        audio.addEventListener('ended', ()=> { URL.revokeObjectURL(url); if (_currentAudio === audio) _currentAudio = null; addDebugLog('info','speakViaCoqui: ended',{endpoint: ep}); });
        audio.play();
        return true;
      }
    }catch(e){ addDebugLog('warn','speakViaCoqui failed',{error: e && e.message}); }
    return false;
  }catch(e){ addDebugLog('error','speakViaCoqui failed outer',{error: e && e.message}); return false; }
}

// Speak via gTTS server (POST /speak). Returns true if audio played successfully
async function speakViaGtts(text, dialect, endpoint){
  try{
    if (!text) return false;
    const ep = (endpoint || '').replace(/\/$/, '');
    if (!ep) return false;
    stopAllVoices();
    try{
      const form = new FormData(); form.append('input', text); form.append('format','mp3');
      const resp = await fetch(ep + '/speak', { method: 'POST', body: form });
      if (resp.ok){
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _currentAudio = audio;
        audio.addEventListener('playing', ()=> addDebugLog('info','speakViaGtts: started',{endpoint: ep}));
        audio.addEventListener('ended', ()=> { URL.revokeObjectURL(url); if (_currentAudio === audio) _currentAudio = null; addDebugLog('info','speakViaGtts: ended',{endpoint: ep}); });
        audio.play();
        return true;
      }
    }catch(e){ addDebugLog('warn','speakViaGtts failed',{error: e && e.message}); }
    return false;
  }catch(e){ addDebugLog('error','speakViaGtts failed outer',{error: e && e.message}); return false; }
}

// Verify Coqui endpoint: calls /health and /voices and updates UI
async function verifyCoquiEndpoint(){
  try{
    const endpointInput = document.getElementById('coquiEndpoint');
    const resultEl = document.getElementById('coquiCheckResult');
    if (!endpointInput || !resultEl) return false;
    const ep = (endpointInput.value || '').replace(/\/$/, '');
    if (!ep){ resultEl.textContent = 'Endpoint non impostato'; return false; }
    resultEl.textContent = 'Verifico...';
    // health
    try{
      const h = await fetch(ep + '/health', {cache:'no-store'});
      if (!h.ok) throw new Error('health status ' + h.status);
      const j = await h.json();
      let voices = [];
      try{
        const v = await fetch(ep + '/voices', {cache:'no-store'});
        if (v.ok){ const vj = await v.json(); voices = vj.voices || vj.speakers || vj.list || []; }
      }catch(e){}
      resultEl.textContent = 'OK ' + (j.model || '') + (voices && voices.length ? ' — voci: ' + voices.slice(0,5).join(', ') : '');
      addDebugLog('info','verifyCoqui success',{endpoint: ep, health: j, voices});
      return true;
    }catch(e){ resultEl.textContent = 'Errore: ' + (e && e.message); addDebugLog('error','verifyCoqui failed',{endpoint: ep, error: e && e.message}); return false; }
  }catch(e){ addDebugLog('error','verifyCoqui outer failed',{error: e && e.message}); return false; }
}

// Cache phrases.json per dialetto per evitare fetch ripetuti
const _phrasesCache = {};
async function getPhrasesForDialect(dialect){
  if (!dialect) return [];
  if (_phrasesCache[dialect]) return _phrasesCache[dialect];
  try{
    const p = await fetch(`audio/${dialect}/phrases.json`, {cache:'no-store'});
    if (!p.ok) return [];
    const arr = await p.json(); _phrasesCache[dialect] = arr; return arr;
  }catch(e){ addDebugLog('warn','getPhrasesForDialect failed',{dialect, error: e && e.message}); return []; }
}

// Cerca e riproduce una frase registrata per il dialetto: preferisce SSML locale, poi mp3 locale, poi human recordings
async function playDialectPhrase(dialect, dictKey){
  try{
    if (!dialect) return false;
    const phrases = await getPhrasesForDialect(dialect);
    if (!phrases || !phrases.length) return false;
    // prefer tones sarcastic/humorous; fallback all
    const candidates = phrases.filter(ph => ['sarcastic','humorous'].includes((ph.tone||'').toLowerCase()));
    const pool = candidates.length ? candidates : phrases;
    // pick random phrase
    const ph = pool[Math.floor(Math.random()*pool.length)];
    if (!ph) return false;
    // try OpenTTS / Coqui / gTTS (local) if selected
    try{
      const voiceSource = (document.getElementById('voiceSource') && document.getElementById('voiceSource').value) || 'auto';
      // gTTS path
      if (voiceSource === 'gtts' || voiceSource === 'auto'){
        const gttsEp = (document.getElementById('gttsEndpoint') && document.getElementById('gttsEndpoint').value) || '';
        if (ph.open_mp3){ const p = `audio/${dialect}/${ph.open_mp3.replace(/\\\\/g,'/')}`; try{ const ok = await playAudioPath(p); if (ok) return true; }catch(e){} }
        try{ const ok = await speakViaGtts((ph.text||ph.phrase||ph.translation||ph.label||''), dialect, gttsEp); if (ok) return true; }catch(e){}
      }
      // Coqui path
      if (voiceSource === 'coqui' || voiceSource === 'auto'){
        const coquiEp = (document.getElementById('coquiEndpoint') && document.getElementById('coquiEndpoint').value) || '';
        if (ph.open_mp3){ const p = `audio/${dialect}/${ph.open_mp3.replace(/\\\\/g,'/')}`; try{ const ok = await playAudioPath(p); if (ok) return true; }catch(e){} }
        try{ const ok = await speakViaCoqui((ph.text||ph.phrase||ph.translation||ph.label||''), dialect, coquiEp); if (ok) return true; }catch(e){}
      }
      // OpenTTS path (legacy)
      if (voiceSource === 'opentts' || voiceSource === 'auto'){
        const endpointInput = document.getElementById('openttsEndpoint');
        const endpoint = (endpointInput && endpointInput.value) || '/';
        if (ph.open_mp3){ const p = `audio/${dialect}/${ph.open_mp3.replace(/\\\\/g,'/')}`; try{ const ok = await playAudioPath(p); if (ok) return true; }catch(e){} }
        try{ const ok = await speakViaOpenTTS((ph.text||ph.phrase||ph.translation||ph.label||''), dialect, endpoint); if (ok) return true; }catch(e){}
      }
    }catch(e){/* ignore */}

    // try Azure local files (if user selected Azure as voice source or automatic) 
    try{
      const voiceSource = (document.getElementById('voiceSource') && document.getElementById('voiceSource').value) || 'auto';
      if (voiceSource === 'azure' || voiceSource === 'auto'){
        if (ph.azure_mp3){
          const pAzure = `audio/${dialect}/${ph.azure_mp3.replace(/\\\\/g,'/')}`;
          try{ const ok = await playAudioPath(pAzure); if (ok) return true; }catch(e){}
        }
        // also try common path azure/<id>_azure.mp3
        if (typeof ph.id !== 'undefined'){
          const pAzure2 = `audio/${dialect}/azure/${ph.id}_azure.mp3`;
          try{ const ok = await playAudioPath(pAzure2); if (ok) return true; }catch(e){}
        }
      }
    }catch(e){/* ignore */}
    // try google_ssml_local
    if (ph.google_ssml_local){
      const path = `audio/${dialect}/${ph.google_ssml_local.replace(/\\\\/g,'/')}`;
      try{ const ok = await playAudioPath(path); if (ok) return true; }catch(e){}
    }
    // try local mp3 (SAPI-generated)
    if (ph.mp3){
      const path2 = `audio/${dialect}/${ph.mp3}`;
      try{ const ok = await playAudioPath(path2); if (ok) return true; }catch(e){}
    }
    // try human recordings
    if (ph.human && ph.human.length){
      // human paths are relative to repo root (e.g., 'human-recordings/siciliano/...')
      const raw = ph.human[0];
      const path3 = raw.replace(/\\\\/g,'/');
      try{ const ok = await playAudioPath(path3); if (ok) return true; }catch(e){}
    }
    return false;
  }catch(e){ addDebugLog('error','playDialectPhrase failed',{dialect, dictKey, error: e && e.message}); return false; }
}


// handler wiring
function attachDetailFooterHandlers(){
  const uploadBtn = document.getElementById('uploadAudioBtn');
  const input = document.getElementById('audioFileInput');
  const playBtn = document.getElementById('playCustomBtn');
  const shareBtn = document.getElementById('dilloNonnaBtn');
  if (!uploadBtn || !input || !playBtn || !shareBtn) return;

  uploadBtn.addEventListener('click', ()=> input.click());
  input.addEventListener('change', async (ev)=>{
    try{
      const file = ev.target.files && ev.target.files[0]; if (!file) return;
      const footer = document.getElementById('detailFooter'); if(!footer) return;
      const dictKey = footer.dataset.currentKey || 'unknown';
      const dialectId = (dialectSelect && dialectSelect.value) || '';
      // read as dataURL and store
      const reader = new FileReader();
      reader.onload = function(){
        const dataUrl = reader.result;
        const storageKey = AUDIO_STORAGE_PREFIX + dictKey.toLowerCase() + '|' + dialectId;
        localStorage.setItem(storageKey, dataUrl);
        addDebugLog('info','Audio uploaded',{key: dictKey, dialect: dialectId});
        // provide quick feedback
        triggerExclaim();
      };
      reader.readAsDataURL(file);
    }catch(e){ addDebugLog('error','audio upload failed',{error: e && e.message}); }
  });

  playBtn.addEventListener('click', ()=>{
    try{ const footer = document.getElementById('detailFooter'); const dictKey = footer && footer.dataset.currentKey; if(!dictKey) return; playCustomAudio(dictKey, (dialectSelect && dialectSelect.value)); }
    catch(e){ addDebugLog('error','play custom failed',{error: e && e.message}); }
  });

  shareBtn.addEventListener('click', async ()=>{
    try{ const footer = document.getElementById('detailFooter'); const dictKey = footer && footer.dataset.currentKey; if(!dictKey) return; await shareCard(dictKey); }
    catch(e){ addDebugLog('error','shareCard failed',{error: e && e.message}); }
  });
}

async function shareCard(dictKey){
  try{
    // render a simple postcard on canvas
    const name = italianLabels[dictKey] || (dialectDict[dictKey] && dialectDict[dictKey][dialectSelect.value]) || dictKey;
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    // background che ricorda una cartolina vintage
    ctx.fillStyle = '#fff6ea'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // border
    ctx.fillStyle = '#f3c86b'; ctx.fillRect(40,40,canvas.width-80,20); ctx.fillRect(40,720,canvas.width-80,20);
    // title
    ctx.fillStyle = '#2b2b2b'; ctx.font = 'bold 56px Inter, Arial'; ctx.fillText(name, 80, 160);
    ctx.font = '28px Inter, Arial'; ctx.fillText((dialectDict[dictKey] && dialectDict[dictKey][dialectSelect.value]) || italianLabels[dictKey] || '', 80, 210);
    // little stamp: "Dillo a nonna"
    ctx.font = '26px Inter, Arial'; ctx.fillStyle='#c84a3d'; ctx.fillText('Dillo a nonna ❤️', canvas.width-380, 160);

    // add small emoji
    ctx.font = '96px serif'; ctx.fillText('☕️', 80, 320);

    // to blob
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const filesArray = [new File([blob], `${dictKey}.png`, { type: 'image/png' })];

    if (navigator.share && navigator.canShare && navigator.canShare({ files: filesArray })){
      await navigator.share({ files: filesArray, title: `Dillo a nonna: ${name}`, text: `Guarda qui: ${name} — ${dialectDict[dictKey] && dialectDict[dictKey][dialectSelect.value] ? dialectDict[dictKey][dialectSelect.value] : italianLabels[dictKey] || dictKey}` });
      addDebugLog('info','Shared via native share',{key:dictKey});
      return;
    }

    // fallback: open WhatsApp web with text and attachment link (not trivial), so provide simple copy & open
    const text = `Dillo a nonna: ${name} — ${(dialectDict[dictKey] && dialectDict[dictKey][dialectSelect.value]) || italianLabels[dictKey] || dictKey}`;
    await navigator.clipboard.writeText(text);
    alert('Testo copiato negli appunti. Incollalo su WhatsApp o condividi la cartolina da file.');
    addDebugLog('info','Share fallback used',{key:dictKey});
  }catch(e){ addDebugLog('error','shareCard error',{error: e && e.message}); throw e; }
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
        const insultOn = document.getElementById('insultMode') && document.getElementById('insultMode').checked;
        if (insultOn){
          if (lastSpoken.key !== key || (now - lastSpoken.time) > SPEAK_COOLDOWN_MS){
            const phrases = creativeInsults[dialect] || creativeInsults['Romano'] || ['Ma che roba è?'];
            const pick = phrases[Math.floor(Math.random()*phrases.length)];
            speak(pick, dialect);
            lastSpoken = { key, time: now };
            // show quip
            detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = pick);
            detailsContent.querySelector('.grandpa-comment') && (detailsContent.querySelector('.grandpa-comment').textContent = getSarcasticComment(italianLabels[key] || key));
            triggerExclaim();
          }
        } else if (translation){
          if (lastSpoken.key !== key || (now - lastSpoken.time) > SPEAK_COOLDOWN_MS){
            speak(translation, dialect);
            lastSpoken = { key, time: now };
          }
        } else if (italianLabels[key]){
          if (lastSpoken.key !== key || (now - lastSpoken.time) > SPEAK_COOLDOWN_MS){
            speak(italianLabels[key], dialect);
            lastSpoken = { key, time: now };
          }
        } else {
          // fallback neutro
          try{
            detailsContent.querySelector('.quip') && (detailsContent.querySelector('.quip').textContent = 'Oggetto non riconosciuto');
            detailsContent.querySelector('.grandpa-comment') && (detailsContent.querySelector('.grandpa-comment').textContent = getSarcasticComment(italianLabels[key] || key, {isError:true}));
          }catch(e){ /* ignore */ }
        }

        // Aggiorna pannello dettagli quando aperto
        // Rendiamo cliccabile il nome per permettere di pronunciarlo manualmente
        const displayName = italianLabels[key] || top.className;
        const cafoneScore = computeCafoneScore(key, top.probability);
        const quip = getCafoneQuip(key, cafoneScore);
        detailsContent.innerHTML = `
          <div class="detail-main">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <button class="detail-key" data-key="${escapeHtml(top.className)}" type="button">${escapeHtml(displayName)}</button>
              <div style="font-size:0.9rem;color:var(--muted)">${(top.probability*100).toFixed(1)}%</div>
            </div>
            <div class="cafone-meter" aria-hidden="false">
              <div class="meter" title="Passione: ${Math.round(cafoneScore)}/10"><span id="meterBar" style="width:${Math.min(100, Math.round(cafoneScore*10))}%"></span></div>
              <div class="quip">${escapeHtml(quip)}</div>
            </div>
            <div class="grandpa-comment" id="grandpaComment">${escapeHtml(getSarcasticComment(displayName))}</div>
          </div>`; 

        // mostra il footer del pannello (upload, condivisione)
        const footer = document.getElementById('detailFooter'); if (footer) footer.hidden = false;
        // salva il key corrente per i bottoni del footer
        footer && (footer.dataset.currentKey = key);

        // se è un oggetto sacro, mostra il badge e suona
        const legendaryBadge = document.getElementById('legendaryBadge');
        if (sacredObjects.has(key) || sacredObjects.has(displayName.toLowerCase())){
          legendaryBadge.hidden = false;
          triggerLegendary(key);
        } else { legendaryBadge.hidden = true; }

        // quick animation ed esclamazione se sopra soglia
        triggerExclaim();
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
    // carichiamo eventuale dizionario esterno prima di procedere (merge e popolamento select)
    await loadExternalDialects().catch(e => addDebugLog('warn','loadExternalDialects failed at init',{error: e && e.message}));
    addDebugLog('info','environment',{ ua: navigator.userAgent, platform: navigator.platform, mobile: /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) });
    addDebugLog('info','navigator.mediaDevices',{ mediaDevices: !!navigator.mediaDevices, getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) });
    // Load OpenTTS config (auto-populate endpoint and default voice) if present
    try{ await loadOpenTTSConfig().catch(e => addDebugLog('warn','loadOpenTTSConfig failed',{error: e && e.message})); }catch(e){ addDebugLog('warn','loadOpenTTSConfig outer failed',{error: e && e.message}); }

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

    // Hook UI playful features
    try{ attachDetailFooterHandlers();
      const insultToggle = document.getElementById('insultMode');
      if (insultToggle){ insultToggle.checked = false; insultToggle.addEventListener('change', ()=> addDebugLog('info','insultMode',{value: insultToggle.checked})); }
      const themeToggle = document.getElementById('themeToggle');
      themeToggle && themeToggle.addEventListener('click', ()=> { document.querySelector('.glass-panel')?.classList.toggle('theme-tiles'); triggerExclaim(); });
    }catch(e){ addDebugLog('warn','UI playful init failed',{error: e && e.message}); }

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
  if (!label) return null;
  let normalized = label.toLowerCase().trim();
  // rimuovi punteggiatura comune
  normalized = normalized.replace(/[.,()]/g,'');
  // controlla mappa alias (etichette composte o sinonimi)
  if (labelAliases[normalized]) return labelAliases[normalized];
  // controllo esatto su tutte le chiavi
  for (const key of Object.keys(dialectDict)){
    if (normalized === key) return key;
  }
  // prova contains (es. 'wine bottle' includes 'bottle')
  for (const key of Object.keys(dialectDict)){
    if (normalized.includes(key)) return key;
    if (key.split(' ').some(k => normalized.includes(k))) return key;
  }
  // tentativo semplice di singolare/plurale (rimuove trailing s)
  if (normalized.endsWith('s')){
    const singular = normalized.replace(/s$/,'');
    for (const key of Object.keys(dialectDict)){
      if (singular === key || singular.includes(key) || key.includes(singular)) return key;
    }
  }
  return null;
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
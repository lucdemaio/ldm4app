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
const dialectSelect = document.getElementById('dialect');
const resultsArea = document.getElementById('results');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const bentoGrid = document.getElementById('bentoGrid');
const detectionRing = document.getElementById('detectionRing');
const detailPanel = document.getElementById('detailPanel');
const detailsContent = document.getElementById('detailsContent');

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
  }catch(err){ console.error('Errore durante la predizione', err); }

  if (isPredicting) requestAnimationFrame(predictLoop);
}

// Inizializzazione: carica il modello e registra il service worker (UMD-only flow)
async function init(){
  try{
    statusEl.textContent = 'Caricamento modello...';

    const loadScript = (src) => new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { console.log('Script caricato:', src); resolve(); };
      s.onerror = () => reject(new Error('Errore caricamento script: ' + src));
      document.head.appendChild(s);
    });

    // Carichiamo UMD in sequenza: tfjs -> tfjs-converter -> mobilenet
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@3.21.0/dist/tf-converter.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');

    if (!window.mobilenet) throw new Error('MobileNet UMD non disponibile dopo caricamento');

    // Caricamento modello
    model = await window.mobilenet.load({version:2, alpha:1.0});
    statusEl.textContent = 'Modello caricato';
    console.log('Modello MobileNet caricato (UMD)');

    // Registra il service worker, se possibile
    if ('serviceWorker' in navigator){
      try{
        await navigator.serviceWorker.register('/pwa-object-recognition/sw.js');
        console.log('Service Worker registrato');
      }catch(err){ console.warn('Registrazione SW fallita', err); }
    }

  }catch(e){
    console.error('Errore durante il caricamento del modello', e);
    statusEl.textContent = 'Errore caricamento modello';
  }
}

// Avvia la telecamera posteriore e imposta il video
async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    statusEl.textContent = 'Camera attiva';
  }catch(err){
    // fallback - alcuni browser non supportano exact
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
      video.srcObject = stream; await video.play();
      statusEl.textContent = 'Camera attiva (fallback)';
    }catch(error){
      console.error('Impossibile accedere alla camera', error);
      statusEl.textContent = 'Permesso camera negato o non disponibile';
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
  if (!model){
    statusEl.textContent = 'Il modello non è ancora pronto, attendere...';
    return;
  }
  await startCamera();
  if (!isPredicting){
    isPredicting = true; predictLoop();
    startBtn.textContent = 'Interrompi';
  }else{
    isPredicting = false; startBtn.textContent = 'Avvia riconoscimento';
  }
});

// Avvio carico modello all'apertura della pagina
window.addEventListener('DOMContentLoaded', () => { init(); });

// Esporta per eventuali test/modularità
export default { init, startCamera, predictLoop };
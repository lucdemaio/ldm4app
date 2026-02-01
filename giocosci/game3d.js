// game3d.js - Simulatore Sci 3D (Three.js)
'use strict';

// Attendi che Graphics2D sia caricato prima di procedere
function waitForGraphics2D() {
  return new Promise((resolve) => {
    if (window.Graphics2D) {
      console.log('Graphics2D già disponibile');
      resolve();
    } else {
      console.log('Attendo caricamento Graphics2D...');
      const checkInterval = setInterval(() => {
        if (window.Graphics2D) {
          console.log('Graphics2D caricato!');
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    }
  });
}

// FORZA MODALITÀ 2D per GPU vecchie (Intel HD Graphics Direct3D9)
// Rileva automaticamente GPU problematiche
function shouldForce2D() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return true;
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    console.log('GPU rilevata:', renderer);
    // Forza 2D per Intel HD Graphics con Direct3D9 (shader model 3.0)
    if (renderer.includes('Direct3D9') || renderer.includes('vs_3_0') || renderer.includes('ps_3_0')) {
      console.warn('⚠️ GPU vecchia rilevata - Forzatura modalità 2D per compatibilità');
      return true;
    }
  }
  return false;
}

// Dynamic load of Three.js as ES module to handle network/CORS errors gracefully
let THREE = null;
(async function loadThreeModule() {
  // Attendi Graphics2D
  await waitForGraphics2D();
  
  // Controlla se forzare 2D
  if (shouldForce2D()) {
    console.log('🎨 Modalità 2D Professionale attivata automaticamente');
    window._use2DFallbackForce = true;
    window.Graphics2D.init();
    animate(); // Avvia il loop di animazione con 2D
    return;
  }
  
  try {
    const mod = await import('./node_modules/three/build/three.module.js');
    THREE = mod;
    // expose THREE globally so example modules (PMREM, etc.) that expect a global can reference it
    try { window.THREE = THREE; } catch(e) { /* ignore */ }

    // try loading PMREMGenerator from multiple CDNs (some CDNs return CORS errors; try jsdelivr if unpkg fails)
    // try loading PMREMGenerator from multiple candidates (local shim first)
    let pmremLoaded = false;
    let PMREMGeneratorRef = null;
    const pmremCandidates = [
      './vendor/PMREMGenerator.js',
      './vendor/PMREMGenerator.standalone.js'
    ];
    // Note: we purposely avoid CDN loads by default to prevent CORS issues; local vendor/PMREMGenerator.js is preferred.
    for (const u of pmremCandidates) {
      try {
        const pm = await import(u);
        if (pm && pm.PMREMGenerator) { PMREMGeneratorRef = pm.PMREMGenerator; pmremLoaded = true; break; }
      } catch (e) {
        console.warn('Import PMREMGenerator failed for', u, e && e.message ? e.message : e);
        // continue to next
      }
    }
    if (!pmremLoaded) {
      console.warn('PMREMGenerator non disponibile; alcune funzioni di lighting verranno disattivate.');
    }
    // store reference globally for other functions
    window._PMREMGeneratorRef = PMREMGeneratorRef;

    // initialize once the module is available
    try {
      initThree();
      animate();
    } catch (e) {
      console.error('Errore inizializzazione dopo import:', e);
      console.warn('Attivazione modalità 2D professionale...');
      if (overlayEl) overlayEl.innerHTML = '<div class="level-badge">Modalità 2D professionale attivata (WebGL non disponibile)</div>';
      window._use2DFallbackForce = true;
      // Inizializza il sistema grafico 2D se disponibile
      if (window.Graphics2D) {
        window.Graphics2D.init();
      }
      animate();
    }
  } catch (err) {
    console.error('Impossibile caricare Three.js come modulo:', err);
    console.warn('Attivazione modalità 2D professionale...');
    if (overlayEl) overlayEl.innerHTML = '<div class="level-badge">Modalità 2D professionale attivata</div>';
    const webglWarningEl = document.getElementById('webgl-warning');
    if (webglWarningEl) { webglWarningEl.hidden = false; const webglDetails = document.getElementById('webgl-details'); if (webglDetails) webglDetails.innerText = 'Errore caricamento modulo Three.js: ' + (err && err.message ? err.message : String(err)); }
    window._use2DFallbackForce = true;
    // Inizializza il sistema grafico 2D se disponibile
    if (window.Graphics2D) {
      window.Graphics2D.init();
    }
    animate();
  }
})();

// Sky/sun globals
let sunLight = null;
let skyLoaded = false;
// Distant mountains (declared globally so update loop can access it)
let distantMountains = [];
// DOM hooks
const canvas = document.getElementById('threeCanvas');
const timerEl = document.getElementById('timer');
const gateEl = document.getElementById('gateCounter');
const speedEl = document.getElementById('speed');
const overlayEl = document.getElementById('raceOverlay');
const startBtn = document.getElementById('startRace');
const disciplineBtns = document.querySelectorAll('.discipline-btn');

// Provide a safe global 2D draw fallback so animate() never crashes when 3D lib fails
function draw2DFallback() {
  try {
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    const cw = canvas.width = canvas.clientWidth || canvas.width || 800;
    const ch = canvas.height = canvas.clientHeight || canvas.height || 450;
    
    // Log solo la prima volta
    if (!window._2dRenderLogged) {
      window._2dRenderLogged = true;
      console.log('draw2DFallback chiamato! Canvas:', cw, 'x', ch, 'Graphics2D:', !!window.Graphics2D);
    }
    
    // Usa il nuovo sistema grafico 2D professionale
    if (window.Graphics2D) {
      // Aggiorna particelle neve
      Graphics2D.updateSnowParticles(0.016);
      
      // Prepara stato di gioco per il renderer (con valori di default se non ancora inizializzati)
      const gameState = {
        skierX: (typeof skier !== 'undefined' && skier.x) || 0,
        skierVX: (typeof skier !== 'undefined' && skier.vx) || 0,
        skierZ: (typeof skier !== 'undefined' && skier.z) || 0,
        gates: (typeof gates !== 'undefined' && gates) || [],
        speed: (typeof skier !== 'undefined' && skier.forwardSpeed) || 10
      };
      
      // Render completo
      Graphics2D.render(ctx, cw, ch, gameState);
      
      // Overlay info solo se in gara
      if (running) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 80);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Inter, Arial';
        ctx.fillText('MODALITÀ 2D (WebGL non disponibile)', 20, 30);
        ctx.font = '14px Inter, Arial';
        ctx.fillText(`Porta: ${gatesPassed || 0} / ${GATES_TOTAL}`, 20, 52);
        ctx.fillText(`Tempo: ${formatTime ? formatTime(raceTime || 0) : '0:00.00'}`, 20, 72);
      } else {
        // Mostra messaggio di benvenuto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(cw/2 - 200, ch/2 - 50, 400, 100);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎿 Coppa del Mondo 2026', cw/2, ch/2 - 10);
        ctx.font = '16px Inter, Arial';
        ctx.fillText('Modalità 2D Professionale', cw/2, ch/2 + 20);
        ctx.textAlign = 'left';
      }
    } else {
      // Fallback semplice se Graphics2D non è caricato
      console.warn('Graphics2D non disponibile, uso fallback base');
      ctx.clearRect(0,0,cw,ch);
      const g = ctx.createLinearGradient(0,0,0,ch*0.6);
      g.addColorStop(0, '#cfefff'); g.addColorStop(0.6,'#eaf6ff'); g.addColorStop(1,'#ffffff');
      ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);
      ctx.fillStyle = '#fff'; ctx.fillRect(0,ch*0.55,cw,ch*0.45);
      ctx.fillStyle = '#012036'; ctx.font = '16px Inter, Arial';
      ctx.fillText('Fallback 2D attivo — WebGL non disponibile', 16, 28);
      ctx.fillText(`Porta: ${gatesPassed || 0} / ${GATES_TOTAL}`, 16, 52);
      ctx.fillText(`Tempo: ${formatTime ? formatTime(raceTime || 0) : '0:00.00'}`, 16, 72);
      ctx.fillStyle = '#1e90ff'; ctx.beginPath(); ctx.arc(cw*0.5, ch*0.75, 12, 0, Math.PI*2); ctx.fill();
    }
  } catch (e) { /* ignore drawing errors */ }
}

// Server warning element (shown when site is opened via file:// due to CORS issues)
const serverWarningEl = document.getElementById('server-warning');
const serverModal = document.getElementById('serverModal');
const serverCmdEl = document.getElementById('serverCmd');
const copyCmdBtn = document.getElementById('copyCmdBtn');
const openLocalhostBtn = document.getElementById('openLocalhost');
const openLocalhostFromModalBtn = document.getElementById('openLocalhostFromModal');
const checkServerBtn = document.getElementById('checkServerBtn');
const serverStatusEl = document.getElementById('server-status');
const modalCloseBtn = document.getElementById('modalClose');

// Helper: set texture to sRGB in a way compatible with multiple Three.js versions
function setTextureSRGB(tex) {
  if (!tex) return;
  try {
    if ('colorSpace' in tex) {
      // newer Three.js uses colorSpace enums
      if (typeof THREE !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') tex.colorSpace = THREE.SRGBColorSpace;
      else tex.colorSpace = 'srgb';
    } else if ('encoding' in tex) {
      tex.encoding = THREE.sRGBEncoding;
    }
  } catch (e) {
    // ignore
  }
}
if (serverWarningEl && window.location.protocol === 'file:') {
  serverWarningEl.hidden = false;
  console.warn('Stai aprendo il progetto tramite file:// — avvia un server HTTP nella cartella del progetto (es. py -m http.server 8000) e ricarica la pagina.');
  const showBtn = document.getElementById('showStartInstructions');
  const readmeLink = document.getElementById('openReadme');
  if (showBtn) {
    showBtn.addEventListener('click', () => {
      if (serverModal) {
        serverModal.hidden = false;
        const modalCheck = document.getElementById('modal-check-result');
        if (modalCheck) modalCheck.hidden = true;
      } else {
        alert('Apri un terminale nella cartella del progetto e esegui:\n\n  py -m http.server 8000\n\npoi apri http://localhost:8000');
      }
    });
  }
  if (readmeLink) {
    // clicking will attempt to open README.md — useful once a server is running
    readmeLink.addEventListener('click', (e) => {
      // default behavior is fine (will try to open file); prevent navigation in file:// scenario
      if (window.location.protocol === 'file:') { e.preventDefault(); window.open('https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS','_blank'); }
    });
  }

  if (openLocalhostBtn) {
    openLocalhostBtn.addEventListener('click', () => {
      window.open('http://localhost:8000', '_blank');
    });
  }

  if (openLocalhostFromModalBtn) {
    openLocalhostFromModalBtn.addEventListener('click', () => {
      window.open('http://localhost:8000', '_blank');
    });
  }

  if (copyCmdBtn) {
    copyCmdBtn.addEventListener('click', async () => {
      const cmd = (serverCmdEl && serverCmdEl.innerText) ? serverCmdEl.innerText.trim() : 'py -m http.server 8000';
      try {
        await navigator.clipboard.writeText(cmd);
        copyCmdBtn.innerText = 'Copiato ✓';
        setTimeout(() => copyCmdBtn.innerText = 'Copia comando', 1400);
      } catch (err) {
        // fallback for older browsers
        const ta = document.createElement('textarea'); ta.value = cmd; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); copyCmdBtn.innerText = 'Copiato ✓'; } catch (e) { alert('Copia non disponibile. Comando: ' + cmd); }
        ta.remove();
        setTimeout(() => copyCmdBtn.innerText = 'Copia comando', 1400);
      }
    });
  }

  if (checkServerBtn) {
    checkServerBtn.addEventListener('click', () => checkServer('http://localhost:8000/'));
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => { if (serverModal) serverModal.hidden = true; });

  async function checkServer(url, timeoutMs = 3000) {
    if (!serverStatusEl) return;
    serverStatusEl.hidden = false;
    serverStatusEl.className = 'server-status status-neutral';
    serverStatusEl.innerHTML = '<span class="spinner"></span> Controllo server...';
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { mode: 'cors', signal: controller.signal });
      clearTimeout(id);
      if (res && res.ok) {
        serverStatusEl.className = 'server-status status-ok';
        serverStatusEl.innerText = `Server risponde (${res.status}). Controllo risorse...`;

        // Check key assets and report which are missing
        const base = url.replace(/\/+$/, '');
        const assetPaths = [
          'assets/sky/px.jpg', 'assets/sky/nx.jpg', 'assets/sky/py.jpg', 'assets/sky/ny.jpg', 'assets/sky/pz.jpg', 'assets/sky/nz.jpg',
          'assets/sky.jpg', 'assets/sky.svg', 'assets/tree.png', 'assets/tree.svg', 'assets/snow_texture.jpg', 'assets/snow_texture.svg', 'assets/snow_normal.jpg', 'assets/snow_normal.svg'
        ];

        const checks = await Promise.all(assetPaths.map(async (p) => {
          try {
            const r = await fetch(base + '/' + p, { method: 'HEAD' });
            return { path: p, ok: r && r.ok };
          } catch (e) {
            try {
              // try GET as fallback
              const r2 = await fetch(base + '/' + p, { method: 'GET' });
              return { path: p, ok: r2 && r2.ok };
            } catch (e2) {
              return { path: p, ok: false };
            }
          }
        }));

        // build message
        const missing = checks.filter(c => !c.ok).map(c => c.path);
        const present = checks.filter(c => c.ok).map(c => c.path);
        let msg = '';
        if (present.length) msg += `Trovati: ${present.slice(0,6).join(', ')}. `;
        if (missing.length) msg += `Mancanti: ${missing.slice(0,6).join(', ')}. `;
        serverStatusEl.innerText = msg;

        if (missing.length) {
          // apply strong visual fallbacks to make the scene readable
          serverStatusEl.className = 'server-status status-fail';
          serverStatusEl.appendChild(document.createTextNode(' Alcuni asset mancano: applico fallback grafici.'));
          generateBrightFallbacks();
          const reloadBtn = document.createElement('button');
          reloadBtn.className = 'btn';
          reloadBtn.innerText = 'Ricarica dopo aver aggiunto asset';
          reloadBtn.addEventListener('click', () => location.reload());
          serverStatusEl.appendChild(document.createTextNode(' '));
          serverStatusEl.appendChild(reloadBtn);
        } else {
          serverStatusEl.className = 'server-status status-ok';
          serverStatusEl.appendChild(document.createTextNode(' Tutto presente. Ricarica per caricare le texture.'));
          const reloadBtn = document.createElement('button');
          reloadBtn.className = 'btn';
          reloadBtn.innerText = 'Ricarica';
          reloadBtn.addEventListener('click', () => location.reload());
          serverStatusEl.appendChild(document.createTextNode(' '));
          serverStatusEl.appendChild(reloadBtn);
        }

      } else {
        serverStatusEl.className = 'server-status status-fail';
        serverStatusEl.innerText = `Server risponde con stato ${res.status}. Potrebbe essere necessario riprovare.`;
      }
    } catch (err) {
      serverStatusEl.className = 'server-status status-fail';
      if (err.name === 'AbortError') serverStatusEl.innerText = 'Nessuna risposta (timeout). Server non avviato?';
      else serverStatusEl.innerText = `Errore: ${err.message}`;
    }
  }
}

// Scene, camera, renderer
let scene, camera, renderer;
let skierGroup;
let plane;
let gates = [];
const GATES_TOTAL = 30;
let gatesGenerated = 0; // how many gates have been spawned so far
const maxVisibleGates = 2; // keep at most 2 gates on screen to avoid clutter (one red, one blue)

// State
let lastTime = null;
let running = false;
let raceTime = 0; // seconds
let penalties = 0; // seconds
let gatesPassed = 0;
let currentGateIndex = 0;

// Input
const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft','KeyA'].includes(e.code)) keys.left = true;
  if (['ArrowRight','KeyD'].includes(e.code)) keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft','KeyA'].includes(e.code)) keys.left = false;
  if (['ArrowRight','KeyD'].includes(e.code)) keys.right = false;
});

// Discipline settings (consistenti con 2D version)
const disciplines = {
  slalom: { name: 'Slalom', forwardSpeed: 8, gateGap: 6, gateSpacing: 14, gateShift: 3.5, agility: 8, friction: 6, maxLat: 6 },
  gigante: { name: 'Gigante', forwardSpeed: 12, gateGap: 10, gateSpacing: 18, gateShift: 6, agility: 6, friction: 4.5, maxLat: 8 },
  discesa: { name: 'Discesa', forwardSpeed: 20, gateGap: 14, gateSpacing: 26, gateShift: 9, agility: 3.5, friction: 3.5, maxLat: 10 }
};
let selectedDiscipline = 'gigante';

// Skier physics
const skier = {
  x: 0, // lateral position
  z: 6, // forward (distance from start along slope)
  vx: 0, // lateral velocity
  forwardSpeed: 12, // base forward speed (units/sec)
  accelLat: 0, // lateral acceleration
  friction: 4, // lateral friction
  maxLat: 6,
  radius: 0.8 // collision radius
};

// Gates path tracking
let lastGateX = null;
let lastGateZ = null; // deeper negative means further down
let nextGateIsLeft = true; // start with left

// Visuals
let skierMesh;

// Initialize Three.js scene
function initThree() {
  if (typeof THREE === 'undefined' || THREE === null) {
    const msg = 'Three.js non caricato come modulo. Attivazione modalità 2D professionale...';
    console.warn(msg);
    if (overlayEl) overlayEl.innerHTML = `<div class="level-badge">Modalità 2D Professionale</div>`;
    window._use2DFallbackForce = true;
    if (window.Graphics2D) window.Graphics2D.init();
    return; // abort initialization
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd9ff); // sky blue
  
  // Esponi la scena globalmente
  window._scene = scene;

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  
  // Esponi la camera globalmente
  window._camera = camera;

  // Try creating a WebGL renderer; if it fails, provide an informative overlay and a 2D fallback
  let webglInitError = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);
    // check context availability
    const gl = renderer.getContext && renderer.getContext();
    if (!gl) throw new Error('WebGL context not available');
    
    // Test se WebGL funziona davvero provando a renderizzare
    try {
      renderer.render(scene, camera);
    } catch (renderErr) {
      console.warn('WebGL context creato ma rendering fallito:', renderErr);
      throw new Error('WebGL rendering non funzionante');
    }
    
    // Esponi il renderer globalmente
    window._renderer = renderer;
    console.log('✅ Renderer WebGL funzionante');
  } catch (err) {
    console.error('WebGL init failed:', err);
    console.warn('🎨 Attivazione modalità 2D professionale...');
    webglInitError = err && err.message ? err.message : String(err);
    renderer = null; // ensure renderer isn't used
    window._use2DFallbackForce = true;
    if (window.Graphics2D && !window.Graphics2D.snowParticles.length) {
      window.Graphics2D.init();
    }
  }

  // Setup webgl warning handlers and fallback controls
  const webglWarningEl = document.getElementById('webgl-warning');
  const openGpuBtn = document.getElementById('openGpuBtn');
  const tryWebglBtn = document.getElementById('tryWebglBtn');
  const use2dBtn = document.getElementById('use2dBtn');
  const copyDiagBtn = document.getElementById('copyDiagBtn');
  const webglDetails = document.getElementById('webgl-details');
  let use2DFallback = false;
  let ctx2d = null;

  function showWebglWarning(msg) {
    if (!webglWarningEl) return;
    webglWarningEl.hidden = false;
    webglDetails.innerText = msg || 'Controlla i driver grafici, aggiorna il browser o prova il fallback 2D.';
  }

  function hideWebglWarning() { if (webglWarningEl) webglWarningEl.hidden = true; }

  if (webglInitError) {
    showWebglWarning(webglInitError);
    // openGpuBtn opens chrome://gpu in a new tab
    if (openGpuBtn) openGpuBtn.addEventListener('click', () => window.open('chrome://gpu'));
    if (copyDiagBtn) copyDiagBtn.addEventListener('click', async () => {
      const diag = `UserAgent: ${navigator.userAgent}\nError: ${webglInitError}`;
      try { await navigator.clipboard.writeText(diag); copyDiagBtn.innerText = 'Copiato ✓'; setTimeout(()=> copyDiagBtn.innerText = 'Copia diagnostica', 1400); } catch(e){ alert(diag); }
    });
    if (use2dBtn) use2dBtn.addEventListener('click', () => {
      // enable 2D fallback rendering
      use2DFallback = true;
      ctx2d = canvas.getContext('2d');
      hideWebglWarning();
      generateBrightFallbacks();
    });
    if (tryWebglBtn) tryWebglBtn.addEventListener('click', () => {
      // try reinitializing WebGL renderer
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        resizeRenderer();
        window.addEventListener('resize', resizeRenderer);
        const gl2 = renderer.getContext && renderer.getContext();
        if (!gl2) throw new Error('WebGL context not available');
        // success
        webglInitError = null;
        hideWebglWarning();
      } catch (e) {
        webglInitError = e && e.message ? e.message : String(e);
        showWebglWarning(webglInitError);
      }
    });
  }

  // Expose fallback flag for debug
  window._use2DFallback = () => use2DFallback;

  // 2D draw helper (keeps using game state: gates, trees, skier)
  function draw2DFallback() {
    if (!ctx2d) return;
    const cw = canvas.width = canvas.clientWidth || canvas.width;
    const ch = canvas.height = canvas.clientHeight || canvas.height;
    // clear
    ctx2d.clearRect(0,0,cw,ch);
    // sky gradient
    const g = ctx2d.createLinearGradient(0,0,0,ch*0.6);
    g.addColorStop(0, '#cfefff'); g.addColorStop(0.6,'#eaf6ff'); g.addColorStop(1,'#ffffff');
    ctx2d.fillStyle = g; ctx2d.fillRect(0,0,cw,ch);
    // mountains silhouettes
    ctx2d.fillStyle = '#7aa3b8';
    for (let i=0;i<6;i++){
      const mx = (i/5)*cw; const mw = cw*0.28; const mh = 60 + (i%3)*40;
      ctx2d.beginPath(); ctx2d.moveTo(mx - 50, ch*0.18 + mh); ctx2d.lineTo(mx + mw/2, ch*0.18 - mh); ctx2d.lineTo(mx + mw + 20, ch*0.18 + mh); ctx2d.fill();
    }
    // snow ground
    ctx2d.fillStyle = '#fff'; ctx2d.fillRect(0,ch*0.5,cw,ch*0.5);

    // draw gates (use gates array)
    const centerX = cw/2;
    const nearZ = skier.z + 10; const farZ = skier.z - 520;
    function mapZ(z){ const t = (z - nearZ) / (farZ - nearZ); const cl = Math.max(0, Math.min(1, t)); return ch*0.12 + cl*(ch*0.75); }
    function mapX(x, z){ const t = (z - nearZ) / (farZ - nearZ); const depthScale = 1 - Math.max(0, Math.min(1, t))*0.85; return centerX + x*(16*depthScale); }

    for (const g of gates) {
      const y = mapZ(g.z);
      const lx = mapX(g.centerX - g.gap/2, g.z); const rx = mapX(g.centerX + g.gap/2, g.z);
      // poles
      ctx2d.fillStyle = (g.passed ? '#888' : (g.leftPole && g.leftPole.material && g.leftPole.material.color) ? '#c0392b' : '#c0392b');
      ctx2d.fillRect(lx - 3, y - 30, 6, 40);
      ctx2d.fillRect(rx - 3, y - 30, 6, 40);
      // flag
      ctx2d.fillStyle = '#ff5f5f'; ctx2d.fillRect((lx+rx)/2 - (Math.abs(rx-lx)/4), y - 18, Math.abs(rx-lx)/2, 12);
    }

    // draw trees at sides (some simple ones)
    ctx2d.fillStyle = '#1f7a2b';
    for (let i=0;i<40;i++){
      const side = (i%2===0)? -1:1; const x = centerX + side*(160 + Math.random()*260) + (Math.random()*40 - 20);
      const z = skier.z - (Math.random()*480);
      const y = mapZ(z);
      const h = 10 + Math.random()*26;
      ctx2d.beginPath(); ctx2d.moveTo(x, y - h); ctx2d.lineTo(x - 8, y); ctx2d.lineTo(x + 8, y); ctx2d.fill();
    }

    // draw skier near bottom
    const skY = mapZ(skier.z + 8);
    const skX = mapX(skier.x, skier.z + 8);
    ctx2d.fillStyle = '#1e90ff'; ctx2d.beginPath(); ctx2d.ellipse(skX, skY - 6, 12, 18, 0, 0, Math.PI*2); ctx2d.fill();
    // skis
    ctx2d.strokeStyle = '#6b4226'; ctx2d.lineWidth = 4; ctx2d.beginPath(); ctx2d.moveTo(skX - 18, skY + 6); ctx2d.lineTo(skX + 18, skY + 6); ctx2d.stroke();

    // HUD: simple text
    ctx2d.fillStyle = '#012036'; ctx2d.font = '14px Inter, Arial'; ctx2d.fillText(`Porta: ${gatesPassed} / ${GATES_TOTAL}`, 12, 20);
    ctx2d.fillText(`Tempo: ${formatTime(raceTime + penalties)}`, 12, 40);
  }

  // Replace the render call in animate: if using 2D fallback, draw with ctx2d, else use renderer
  const origAnimate = animate;
  // we'll patch animate after its declaration further below


  // Sistema luci avanzato con GraphicsEngine
  const lights = {
    hemisphere: new THREE.HemisphereLight(0xffffee, 0x88aaff, 0.8),
    sun: new THREE.DirectionalLight(0xffffff, 0.9),
    ambient: new THREE.AmbientLight(0xffffff, 0.5)
  };
  
  sunLight = lights.sun;
  sunLight.position.set(10, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  
  scene.add(lights.hemisphere);
  scene.add(lights.sun);
  scene.add(lights.ambient);
  
  // Salva riferimento lights per aggiornamenti
  window._sceneLights = lights;

  createPlane();
  createSkier();

  // load skybox/environment and then generate gates and distant mountains
  loadSky().then(() => {
    // try to load terrain textures before generating gates/mountains; proceed even if terrain fails
    loadTerrain().then(() => {
      generateGates(GATES_TOTAL);
      generateDistantMountains();
      loadTreeTexture().then(() => generateTrees(140)).catch(() => generateTrees(260));
    }).catch(() => {
      generateGates(GATES_TOTAL);
      generateDistantMountains();
      loadTreeTexture().then(() => generateTrees(140)).catch(() => generateTrees(260));
    });
  }).catch(() => {
    // even if sky fails, still generate gates and mountains, then trees
    loadTerrain().then(() => {
      generateGates(GATES_TOTAL);
      generateDistantMountains();
      loadTreeTexture().then(() => generateTrees(140)).catch(() => generateTrees(260));
    }).catch(() => {
      generateGates(GATES_TOTAL);
      generateDistantMountains();
      loadTreeTexture().then(() => generateTrees(140)).catch(() => generateTrees(260));
    });
  });

  // Create container for distant mountains
  // (distantMountains declared globally) // will store meshes for horizon mountains
  // Trees (sprites) on sides of the piste
  let treeTexture = null;
  let treeSprites = []; // THREE.Sprite or fallback meshes


// Generate low-poly mountains around the horizon to enhance realism
function generateDistantMountains() {
  // clear previous
  for (const m of distantMountains) scene.remove(m);
  distantMountains = [];
  
  // Usa GraphicsEngine se disponibile
  if (window.GraphicsEngine && window._currentChampionshipRace) {
    const race = window._currentChampionshipRace;
    const preset = GraphicsEngine.getMountainPresetFromLocation(race.location || 'Austria');
    distantMountains = GraphicsEngine.createMountainBackground(scene, THREE, preset);
    return;
  }

  // Fallback: montagne procedurali base
  const radius = 240;
  const segments = 18;
  const baseColor = (sunLight && sunLight.color) ? sunLight.color.clone() : new THREE.Color(0x8aa3b4);

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dist = radius + (Math.random() * 40 - 20);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist - 200;

    const height = 40 + Math.random() * 130;
    const geom = new THREE.ConeGeometry(12 + Math.random() * 44, height, 5);
    const shade = baseColor.clone().multiplyScalar(0.6 + Math.random() * 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: shade, roughness: 1.0, metalness: 0.0 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, (height/2) - 1.2, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.receiveShadow = false;
    scene.add(mesh);
    distantMountains.push(mesh);
  }
}

// Load tree sprite texture (transparent PNG) and return a Promise
// If the PNG is missing, try SVG and finally generate a canvas fallback
function loadTreeTexture() {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();

    function generateCanvasTree() {
      try {
        const c = document.createElement('canvas');
        const size = 256;
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        ctx.clearRect(0,0,size,size);
        // trunk
        ctx.fillStyle = '#5a3b1f';
        ctx.fillRect(size*0.48, size*0.62, size*0.04, size*0.18);
        // foliage layers
        ctx.fillStyle = '#1f7a2b';
        ctx.beginPath(); ctx.moveTo(size*0.5, size*0.12); ctx.lineTo(size*0.14, size*0.62); ctx.lineTo(size*0.86, size*0.62); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = '#228b2e'; ctx.moveTo(size*0.5, size*0.22); ctx.lineTo(size*0.2, size*0.62); ctx.lineTo(size*0.8, size*0.62); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = '#2aa13a'; ctx.moveTo(size*0.5, size*0.34); ctx.lineTo(size*0.28, size*0.62); ctx.lineTo(size*0.72, size*0.62); ctx.closePath(); ctx.fill();
        // some highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(size*0.5, size*0.26); ctx.lineTo(size*0.35, size*0.58); ctx.lineTo(size*0.65, size*0.58); ctx.closePath(); ctx.fill();
        const tex = new THREE.CanvasTexture(c);
        setTextureSRGB(tex);
        tex.needsUpdate = true;
        treeTexture = tex;
        resolve(tex);
      } catch (e) {
        console.warn('Errore creazione texture fallback per albero', e);
        treeTexture = null;
        reject(e);
      }
    }

    // try SVG/PNG/PNG fallback order
    loader.load('assets/tree.svg', (tex2) => {
      setTextureSRGB(tex2);
      treeTexture = tex2;
      resolve(tex2);
    }, undefined, () => {
      loader.load('assets/tree.png', (tex) => {
        setTextureSRGB(tex);
        treeTexture = tex;
        resolve(tex);
      }, undefined, () => {
        // try jpg as last resort
        loader.load('assets/tree.jpg', (texJ) => { setTextureSRGB(texJ); treeTexture = texJ; resolve(texJ); }, undefined, (err) => { console.warn('tree texture non trovata, genero una texture di fallback a runtime', err); generateCanvasTree(); });
      });
    });
  });
}

// Generate trees as Sprites on both sides of the piste
function generateTrees(count = 120) {
  // remove existing
  for (const t of treeSprites) scene.remove(t);
  treeSprites = [];

  const s = disciplines[selectedDiscipline];
  const trackLimit = 28; // same as used elsewhere

  // z-range: from start into the course depth
  const minZ = -10;
  const maxZ = Math.max(lastGateZ || - (s.gateSpacing * GATES_TOTAL), -s.gateSpacing * GATES_TOTAL);

  let attempts = 0;
  for (let i = 0; i < count && attempts < count * 4; i++) {
    attempts++;
    // side and base x outside the track
    const side = Math.random() < 0.5 ? -1 : 1;
    const xBase = side * (trackLimit + 6 + Math.random() * 14);
    const z = minZ + Math.random() * Math.abs(maxZ - minZ);

    // ensure not too close to any gate center (avoid being in gate path)
    let ok = true;
    for (const g of gates) {
      if (Math.abs(z - g.z) < s.gateSpacing * 0.75) {
        if (Math.abs(xBase - g.centerX) < g.gap / 2 + 3) { ok = false; break; }
      }
    }
    if (!ok) { i--; continue; }

    if (treeTexture) {
      const mat = new THREE.SpriteMaterial({ map: treeTexture, transparent: true });
      const spr = new THREE.Sprite(mat);
      const scale = 6 + Math.random() * 8; // scale pixels in world units
      spr.scale.set(scale, scale, 1);
      spr.position.set(xBase + (Math.random()*2 -1)*1.2, 0.8 + Math.random()*0.8, z);
      scene.add(spr);
      treeSprites.push(spr);
    } else {
      // fallback: low-poly snowy pine
      const h = 6 + Math.random() * 12;
      const geo = new THREE.ConeGeometry(1.2 + Math.random()*1.4, h, 5);
      const mat = new THREE.MeshStandardMaterial({ color: 0x2b5b2d, roughness: 0.9 });
      const cone = new THREE.Mesh(geo, mat);
      cone.position.set(xBase + (Math.random()*2 -1)*1.2, (h/2) - 0.6, z);
      cone.rotation.y = Math.random() * Math.PI;
      scene.add(cone);
      treeSprites.push(cone);
    }
  }
}

  // small ambient snow-like fog for depth (adjusted if sky color changes)
  scene.fog = new THREE.FogExp2(0x9fd9ff, 0.015);
}

function resizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Create incline plane (the piste)
let terrainTexture = null;
let terrainNormal = null;
let planeMaterial = null;

function createPlane() {
  const geometry = new THREE.PlaneGeometry(140, 800, 64, 64);
  // Use a material that supports maps; will be updated when textures load
  planeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fbff, metalness: 0.04, roughness: 0.9 });
  plane = new THREE.Mesh(geometry, planeMaterial);
  plane.rotation.x = -Math.PI / 9; // tilt about 20 degrees
  plane.position.y = -1.2;
  plane.receiveShadow = true;
  plane.material.side = THREE.DoubleSide;
  scene.add(plane);
}

// Load terrain textures (diffuse + normal) and apply to plane
function loadTerrain() {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    const diffuseP = new Promise((res, rej) => {
      // try SVG, PNG, then JPG
      loader.load('assets/snow_texture.svg', tex => res(tex), undefined, () => {
        loader.load('assets/snow_texture.png', tex2 => res(tex2), undefined, () => {
          loader.load('assets/snow_texture.jpg', tex3 => res(tex3), undefined, err3 => rej(err3));
        });
      });
    });
    const normalP = new Promise((res, rej) => {
      loader.load('assets/snow_normal.svg', tex => res(tex), undefined, () => {
        loader.load('assets/snow_normal.png', tex2 => res(tex2), undefined, () => {
          loader.load('assets/snow_normal.jpg', tex3 => res(tex3), undefined, err3 => rej(err3));
        });
      });
    });

    Promise.allSettled([diffuseP, normalP]).then(results => {
      const d = results[0];
      const n = results[1];

      if (d && d.status === 'fulfilled') {
        terrainTexture = d.value;
        terrainTexture.wrapS = terrainTexture.wrapT = THREE.RepeatWrapping;
        terrainTexture.repeat.set(10, 100);
        terrainTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        setTextureSRGB(terrainTexture);
        planeMaterial.map = terrainTexture;
      }

      if (n && n.status === 'fulfilled') {
        terrainNormal = n.value;
        terrainNormal.wrapS = terrainNormal.wrapT = THREE.RepeatWrapping;
        terrainNormal.repeat.set(10, 100);
        planeMaterial.normalMap = terrainNormal;
        planeMaterial.normalScale = new THREE.Vector2(1, 1);
      }

      planeMaterial.needsUpdate = true;

      // if there was a diffuse, slightly tint fog to match
      if (terrainTexture) {
        scene.fog.color.lerp(new THREE.Color(0xeaf6ff), 0.2);
      } else {
        // generate a simple snow texture procedurally when missing
        try {
          const c = document.createElement('canvas');
          c.width = 256; c.height = 256;
          const ctx = c.getContext('2d');
          // base
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,c.width,c.height);
          // subtle noise
          for (let i=0;i<1200;i++){
            const x = Math.random()*c.width, y = Math.random()*c.height, s = Math.random()*1.6;
            ctx.fillStyle = 'rgba(220,230,240,' + (0.06 + Math.random()*0.06) + ')';
            ctx.fillRect(x,y,s,s);
          }
          const tex = new THREE.CanvasTexture(c);
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(10,100);
          setTextureSRGB(tex);
          terrainTexture = tex;
          planeMaterial.map = terrainTexture;
          planeMaterial.needsUpdate = true;
        } catch (e) {
          // ignore
        }
      }

      if (!terrainNormal) {
        // generate a subtle normal map (flat-ish bumps)
        try {
          const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 256; const ctx2 = c2.getContext('2d');
          ctx2.fillStyle = '#8080ff'; ctx2.fillRect(0,0,c2.width,c2.height);
          for (let i=0;i<800;i++){
            const x = Math.random()*c2.width, y = Math.random()*c2.height, s = Math.random()*2;
            ctx2.fillStyle = 'rgb(' + (120 + Math.random()*30) + ', ' + (120 + Math.random()*30) + ', ' + (200 + Math.random()*30) + ')'; ctx2.fillRect(x,y,s,s);
          }
          const ntex = new THREE.CanvasTexture(c2);
          ntex.wrapS = ntex.wrapT = THREE.RepeatWrapping; ntex.repeat.set(10,100);
          planeMaterial.normalMap = ntex; planeMaterial.normalScale = new THREE.Vector2(0.8,0.8);
        } catch (e) {}
      }

      resolve(true);
    }).catch(err => {
      console.warn('Errore caricamento texture terreno', err);
      // fallback: keep existing plain material and add procedural texture
      try { generateBrightFallbacks(); } catch(e) {}
      resolve(false);
    });
  });
}

// Simple skier model: group with body and skis
function createSkier() {
  skierGroup = new THREE.Group();
  // body
  const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, metalness: 0.2, roughness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  skierGroup.add(body);

  // skis
  const skiGeo = new THREE.BoxGeometry(0.2, 0.02, 3.0);
  const skiMat = new THREE.MeshStandardMaterial({ color: 0x6b4226 });
  const skiLeft = new THREE.Mesh(skiGeo, skiMat);
  skiLeft.position.set(-0.4, 0.1, 0);
  skiLeft.rotation.x = 0.02;
  skierGroup.add(skiLeft);
  const skiRight = skiLeft.clone();
  skiRight.position.x = 0.4;
  skierGroup.add(skiRight);

  // group transform
  skierGroup.position.set(skier.x, 0, skier.z);
  scene.add(skierGroup);
  skierMesh = skierGroup; // alias
}

// Generate initial visible gates by spawning sequentially
function generateGates(count) {
  // reset (solo in 3D rimuovi mesh dalla scena)
  if (scene) {
    gates.forEach(g => { 
      scene.remove(g.leftPole); 
      scene.remove(g.rightPole); 
      if (g.flagMesh) scene.remove(g.flagMesh); 
    });
  }
  gates = [];
  gatesGenerated = 0;
  lastGateX = 0;
  lastGateZ = -18; // start a bit down the slope
  nextGateIsLeft = true;

  // spawn up to 'count' initial gates (we'll spawn more dynamically as race progresses)
  for (let i = 0; i < Math.min(count, maxVisibleGates); i++) spawnGate();
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Load skybox or equirectangular sky and tune lighting
function loadSky() {
  // Try cube map first (assets/sky/px.jpg ... nx,py,ny,pz,nz), else try equirectangular assets/sky.jpg
  return new Promise((resolve) => {
    const cubePaths = [
      'assets/sky/px.jpg', 'assets/sky/nx.jpg',
      'assets/sky/py.jpg', 'assets/sky/ny.jpg',
      'assets/sky/pz.jpg', 'assets/sky/nz.jpg'
    ];

    // Try cube
    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.load(
      cubePaths,
      (cubeTex) => {
        scene.background = cubeTex;
        scene.environment = cubeTex;
        skyLoaded = true;
        // attempt to sample sun color from 'py' (up) or 'pz' (front)
        sampleImageColor('assets/sky/pz.jpg').then(col => applySunFromColor(col)).catch(()=> applySunDefaults());
        resolve(true);
      },
      undefined,
      () => {
        // cube failed, try equirect (jpg then svg)
        const texLoader = new THREE.TextureLoader();
        // prefer SVG equirect (smaller and local) to reduce 404 noise; fall back to JPG
        const tryEquirect = (paths, idx = 0) => {
          if (idx >= paths.length) {
            console.warn('Nessun sky trovato in assets/sky/, usando default background. Genero cielo procedurale.');
            applySunDefaults();
            try { generateProceduralSkyEnv(); } catch (e) { generateBrightFallbacks(); }
            resolve(false);
            return;
          }
          const p = paths[idx];
          texLoader.load(p, (tex) => {
            tex.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = tex;
            // build PMREM for realistic lighting
            try { const PMREMGen = window._PMREMGeneratorRef; if (PMREMGen && renderer) { const pmrem = new PMREMGen(renderer); const envMap = pmrem.fromEquirectangular(tex).texture; scene.environment = envMap; pmrem.dispose(); } else { // fallback: use the equirect texture directly for basic environment lighting
                try { scene.environment = tex; } catch(e2) { /* ignore */ }
              } }
            catch (e) { /* ignore */ }
            skyLoaded = true;
            sampleImageColor(p).then(info => { applySunFromInfo(info); }).catch(() => applySunDefaults());
            resolve(true);
          }, undefined, () => { tryEquirect(paths, idx + 1); });
        };
        tryEquirect(['assets/sky.svg','assets/sky.png','assets/sky.jpg']);
      }
    );
  });
}

// Sample an image and find a bright region color and approximate direction
function sampleImageColor(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // draw to small canvas
      const w = Math.min(256, img.width);
      const h = Math.min(128, img.height);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx2 = c.getContext('2d');
      ctx2.drawImage(img, 0, 0, w, h);
      const data = ctx2.getImageData(0, 0, w, h).data;

      let best = { i: 0, r:0,g:0,b:0, bright:0 };
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          const idx = (y*w + x)*4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          const bright = 0.299*r + 0.587*g + 0.114*b;
          if (bright > best.bright) best = { x, y, r, g, b, bright };
        }
      }
      // compute normalized coords (0..1)
      resolve({ x: best.x/w, y: best.y/h, color: { r: best.r/255, g: best.g/255, b: best.b/255 } });
    };
    img.onerror = reject;
    img.src = src + '?_=' + Date.now(); // cache-bust
  });
}

function applySunFromColor(col) {
  const c = new THREE.Color(col.r, col.g, col.b);
  if (sunLight) sunLight.color.copy(c).multiplyScalar(1.1);
  // set ambient/hemisphere tint
}

function applySunFromInfo(info) {
  const col = info.color;
  const c = new THREE.Color(col.r, col.g, col.b);
  if (sunLight) sunLight.color.copy(c).multiplyScalar(1.2);
  // determine direction from pixel coords: x -> azimuth, y -> elevation
  const az = (info.x - 0.5) * Math.PI * 2; // -pi..pi
  const el = (0.5 - info.y) * Math.PI; // -pi/2..pi/2
  const dir = new THREE.Vector3(Math.cos(el)*Math.sin(az), Math.sin(el), Math.cos(el)*Math.cos(az));
  sunLight.position.copy(dir.clone().multiplyScalar(40));
}

function applySunDefaults() {
  if (sunLight) { sunLight.color.set(0xffffff); sunLight.position.set(10,20,10); sunLight.intensity = 0.9; }
}

// If textures are missing, create a brighter, more legible fallback scene:
function generateBrightFallbacks() {
  // brighter sun and ambient
  if (sunLight) { sunLight.intensity = Math.max(1.4, sunLight.intensity); sunLight.color.set(0xfff4d9); }
  if (!scene.getObjectByName('fallbackAmbient')) {
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    amb.name = 'fallbackAmbient';
    scene.add(amb);
  }

  // vivid fog/sky background via canvas texture (gradient)
  try {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,0,c.height);
    g.addColorStop(0, '#bfe9ff');
    g.addColorStop(0.6, '#eaf6ff');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
    const tex = new THREE.CanvasTexture(c);
    setTextureSRGB(tex);
    scene.background = tex;
    scene.fog.color = new THREE.Color(0xdff6ff);
  } catch (e) {
    scene.background = new THREE.Color(0x9fd9ff);
    scene.fog.color = new THREE.Color(0xdff6ff);
  }

  // make plane brighter and a bit glossy so details read without textures
  if (planeMaterial) {
    planeMaterial.color.set(0xffffff);
    planeMaterial.roughness = 0.7;
    planeMaterial.metalness = 0.02;
    planeMaterial.needsUpdate = true;
  }

  // create more visible distant mountains and bigger fallback trees
  try {
    // regenerate mountains with stronger colors
    generateDistantMountains();
    for (const m of distantMountains) {
      if (m.material) {
        m.material.color.offsetHSL(0, -0.02, 0.06);
        m.material.roughness = 1.0;
      }
      m.scale.multiplyScalar(1.05);
    }

    // if tree textures missing, make cones larger and more numerous
    generateTrees(260);
    for (const t of scene.children) {
      if (t.geometry && t.geometry.type === 'ConeGeometry') {
        t.scale.set(1.1,1.1,1.1);
      }
    }
  } catch (err) {
    // ignore
  }
}

// Create a procedurally generated sky canvas and convert it into an environment map
function generateProceduralSkyEnv() {
  // canvas gradient sky
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,c.height);
  g.addColorStop(0, '#cfefff');
  g.addColorStop(0.5, '#eaf6ff');
  g.addColorStop(0.9, '#fffefc');
  ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
  // subtle sun glow
  ctx.beginPath(); ctx.fillStyle = 'rgba(255,245,200,0.75)'; ctx.arc(c.width*0.65, c.height*0.35, 80, 0, Math.PI*2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  setTextureSRGB(tex);
  // set as background
  scene.background = tex;
  // create PMREM env map for realistic lighting
  try {
    const PMREMGen = window._PMREMGeneratorRef;
    if (PMREMGen && renderer) {
      const pmrem = new PMREMGen(renderer);
      const env = pmrem.fromEquirectangular(tex).texture;
      scene.environment = env;
      pmrem.dispose();
    } else {
      // fallback: set equirectangular texture directly for basic lighting (non prefiltered)
      try { scene.environment = tex; } catch(e) { /* ignore */ }
    }
    // sample sun info (approx center of glow)
    if (sunLight) { sunLight.color.set(0xfff6d6); sunLight.intensity = 1.1; sunLight.position.set(20,30,6); }
  } catch (e) {
    // fallback: keep directional light defaults
    applySunDefaults();
  }
}

// Spawn a single gate (alternation left/right, jittered shift, angled poles and flag)
function spawnGate() {
  if (gatesGenerated >= GATES_TOTAL) return;
  const s = disciplines[selectedDiscipline];
  const gap = s.gateGap;
  const spacing = s.gateSpacing;
  const baseShift = s.gateShift;

  // track horizontal limits
  const trackLimit = 28;

  // compute a variable shift (not identical every time) — preserves zig-zag alternation but varies distance
  const randFactor = 0.8 + Math.random() * 0.5; // 0.8 .. 1.3
  const shift = baseShift * randFactor;
  const direction = nextGateIsLeft ? -1 : 1;

  // centerX is lastGateX moved toward the opposite side with jitter
  let centerX = (lastGateX === null) ? (direction * Math.min(shift, trackLimit / 2)) : lastGateX + direction * shift;
  // small lateral jitter so not perfectly predictable
  centerX += (Math.random() * 2 - 1) * Math.min(1.2, gap * 0.15);
  centerX = clamp(centerX, -trackLimit + gap / 2 + 1, trackLimit - gap / 2 - 1);

  // vertical position keeps constant spacing (as required)
  const z = (lastGateZ === null) ? -18 : lastGateZ - spacing;

  const color = nextGateIsLeft ? 'red' : 'blue';
  const colorHex = nextGateIsLeft ? 0xe74c3c : 0x3498db;

  let leftPole = null, rightPole = null, flagMesh = null;

  // Crea mesh 3D solo se in modalità 3D
  if (THREE && scene) {
    // create poles with slight random offsets and tilt towards gate center
    const poleH = 3.6;
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, poleH, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.2, roughness: 0.6, emissive: 0x000000 });

    const leftPoleX = centerX - gap / 2;
    const rightPoleX = centerX + gap / 2;

    leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(leftPoleX + (Math.random() * 0.4 - 0.2), poleH / 2 - 0.6, z);
    leftPole.rotation.x = 0.05;
    const tiltDeg = 8 + Math.random() * 14; // 8..22 deg slightly more variety
    leftPole.rotation.z = THREE.MathUtils.degToRad(-tiltDeg); // lean towards center
    scene.add(leftPole);

    rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(rightPoleX + (Math.random() * 0.4 - 0.2), poleH / 2 - 0.6, z);
    rightPole.rotation.x = 0.05;
    rightPole.rotation.z = THREE.MathUtils.degToRad(tiltDeg);
    scene.add(rightPole);

    // add a simple flag (plane) between poles to give visual feedback; slightly rotated for realism
    const flagGeo = new THREE.PlaneGeometry(gap * 0.55, 1.0);
    const flagMat = new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, metalness: 0.05, roughness: 0.6 });
    flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(centerX, 1.2, z + 0.05);
    flagMesh.rotation.y = Math.PI / 2;
    flagMesh.rotation.z = (direction === -1) ? THREE.MathUtils.degToRad(-8 + Math.random()*-6) : THREE.MathUtils.degToRad(8 + Math.random()*6);
    scene.add(flagMesh);

    // add subtle ripple / wave animation via userData
    flagMesh.userData.wavePhase = Math.random() * Math.PI * 2;
  }

  // Crea struttura dati porta (funziona sia in 2D che 3D)
  const gate = {
    z: z,
    centerX: centerX,
    gap: gap,
    passed: false,
    color: color,
    leftPole: leftPole,
    rightPole: rightPole,
    flagMesh: flagMesh
  };

  gates.push(gate);

  // update trackers
  lastGateX = centerX;
  lastGateZ = z;
  nextGateIsLeft = !nextGateIsLeft;
  gatesGenerated++;
}

// Start/Stop
function startRace3D() {
  // apply discipline settings
  const s = disciplines[selectedDiscipline];
  skier.forwardSpeed = s.forwardSpeed;
  skier.friction = s.friction;
  skier.accelLat = s.agility;
  skier.maxLat = s.maxLat;

  // reset state
  running = true;
  raceTime = 0;
  penalties = 0;
  gatesPassed = 0;
  currentGateIndex = 0;
  // reposition skier near start
  skier.x = 0; skier.z = 6; skier.vx = 0;
  if (skierGroup) {
    skierGroup.position.set(skier.x, 0, skier.z);
  }
  
  // Applica preset grafico se in modalità campionato (solo in 3D)
  if (window._currentChampionshipRace && window.GraphicsEngine && window._sceneLights && scene && THREE) {
    const race = window._currentChampionshipRace;
    const preset = GraphicsEngine.getPresetFromWeather(race.weather);
    const config = GraphicsEngine.applyLightingPreset(scene, window._sceneLights, preset, THREE);
    
    // Crea particelle neve se necessario
    if (config.particles === 'snow' && !window._snowParticles) {
      window._snowParticles = GraphicsEngine.createSnowParticles(scene, THREE);
    }
    
    // Crea stelle se è notte
    if (config.stars && !window._starfield) {
      window._starfield = GraphicsEngine.createStarfield(scene, THREE);
    }
    
    // Aggiorna materiale neve del terreno
    if (planeMaterial) {
      const snowType = race.difficulty === 'hard' ? 'icy' : race.difficulty === 'easy' ? 'fresh' : 'packed';
      const snowMat = GraphicsEngine.createSnowMaterial(snowType, THREE);
      if (snowMat && terrainTexture) {
        planeMaterial.color = snowMat.color;
        planeMaterial.roughness = snowMat.roughness;
        planeMaterial.metalness = snowMat.metalness;
        planeMaterial.emissive = snowMat.emissive;
        planeMaterial.emissiveIntensity = snowMat.emissiveIntensity;
        planeMaterial.needsUpdate = true;
      }
    }
    
    // Rigenera montagne con preset corretto
    generateDistantMountains();
  }

  // regenerate gates for discipline
  // remove previous meshes
  gates.forEach(g => { scene.remove(g.leftPole); scene.remove(g.rightPole); if (g.flagMesh) scene.remove(g.flagMesh); });
  generateGates(GATES_TOTAL);

  overlayEl.setAttribute('aria-hidden', 'true');
}

function stopRace3D(finished) {
  running = false;
  if (finished) {
    const finalTime = raceTime + penalties;
    overlayEl.innerHTML = `<div class="level-badge">Finish • ${formatTime(finalTime)}</div>`;
    overlayEl.setAttribute('aria-hidden', 'false');
    
    // Verifica se è modalità campionato
    const currentRace = window._currentChampionshipRace;
    if (currentRace && window.ChampionshipUI) {
      // Modalità campionato - registra risultato
      setTimeout(() => {
        overlayEl.innerHTML = '';
        overlayEl.setAttribute('aria-hidden', 'true');
        window.ChampionshipUI.showRaceResult(currentRace.id, finalTime, 0);
        window._currentChampionshipRace = null;
      }, 2000);
    } else {
      // Modalità normale - aggiungi a stagione
      const record = { 
        name: 'You', 
        discipline: disciplines[selectedDiscipline].name, 
        rawTime: raceTime, 
        penalty: penalties, 
        finalTime 
      };
      if (window.Season && typeof window.Season.addResult === 'function') {
        window.Season.addResult(record);
      }
    }
  }
}

function formatTime(t) {
  const centis = Math.floor(t * 100) % 100;
  const secs = Math.floor(t) % 60;
  const mins = Math.floor(t / 60);
  return `${mins}:${secs.toString().padStart(2,'0')}.${centis.toString().padStart(2,'0')}`;
}

// Update loop (physics & logic)
function update(dt) {
  if (!running) return;

  // forward movement along slope (advance z negative)
  skier.z -= skier.forwardSpeed * dt;

  // ensure distant mountains follow horizon reposition (simple parallax)
  if (Array.isArray(distantMountains)) {
    for (let m of distantMountains) {
      // no-op; mountains are static in world, but could be animated slightly
      m.rotation.y += 0.0005 * dt * 60;
    }
  }

  // lateral control: accelerate left/right
  if (keys.left) skier.vx -= skier.accelLat * dt;
  if (keys.right) skier.vx += skier.accelLat * dt;

  // friction
  if (!keys.left && !keys.right) {
    if (skier.vx > 0) skier.vx = Math.max(0, skier.vx - skier.friction * dt);
    else skier.vx = Math.min(0, skier.vx + skier.friction * dt);
  }

  // clamp lateral speed
  skier.vx = clamp(skier.vx, -skier.maxLat, skier.maxLat);

  // update pos
  skier.x += skier.vx * dt;
  // clamp lateral position to stay on track
  const trackLimit = 28;
  skier.x = clamp(skier.x, -trackLimit, trackLimit);

  // Update group transform: we tilt the skier based on lateral velocity (solo in 3D)
  if (THREE && skierGroup) {
    const tilt = THREE.MathUtils.clamp(-skier.vx * 0.04, -0.35, 0.35);
    skierGroup.rotation.z = tilt;
    skierGroup.position.set(skier.x, 0, skier.z);
  }

  // Camera chase (solo in 3D)
  if (THREE && camera) {
    updateCamera(dt);
  }

  // Check next gate crossing: treat gates as a queue (process gates[0])
  while (gates.length > 0 && skier.z <= gates[0].z) {
    const g = gates[0];
    // did we pass through gap?
    const gapLeft = g.centerX - g.gap / 2;
    const gapRight = g.centerX + g.gap / 2;
    if (skier.x >= gapLeft && skier.x <= gapRight) {
      g.passed = true; gatesPassed++;
    } else {
      penalties += 2; // missed or outside -> penalty
    }

    // pole collision
    const poleRadius = 0.5;
    const leftPoleX = g.centerX - g.gap / 2;
    const rightPoleX = g.centerX + g.gap / 2;
    if (Math.abs(skier.x - leftPoleX) < (skier.radius + poleRadius) || Math.abs(skier.x - rightPoleX) < (skier.radius + poleRadius)) {
      skier.forwardSpeed = Math.max(4, skier.forwardSpeed * 0.7);
    }

    // remove gate meshes and shift queue (solo in 3D)
    if (scene) {
      scene.remove(g.leftPole);
      scene.remove(g.rightPole);
      if (g.flagMesh) scene.remove(g.flagMesh);
    }
    gates.shift();

    // spawn next gate to maintain visibility if still remaining (2D e 3D)
    if (gatesGenerated < GATES_TOTAL) spawnGate();

    // update HUD gates
    if (gateEl) gateEl.textContent = `Porta: ${gatesPassed} / ${GATES_TOTAL}`;
    if (gatesPassed >= GATES_TOTAL) {
      stopRace3D(true);
    }
  }

  // Gradually recover forward speed to discipline's base
  const baseSpeed = disciplines[selectedDiscipline].forwardSpeed;
  const recoveryRate = 1.2; // units/sec^2
  if (skier.forwardSpeed < baseSpeed) skier.forwardSpeed = Math.min(baseSpeed, skier.forwardSpeed + recoveryRate * dt);

  // update time
  raceTime += dt;

  // HUD updates
  if (timerEl) timerEl.textContent = formatTime(raceTime + penalties);
  if (speedEl) speedEl.textContent = `Vel: ${Math.round(skier.forwardSpeed * 3.6)} km/h`;
}

// Smooth chase camera
function updateCamera(dt) {
  if (!THREE || !camera) return; // Skip se in modalità 2D
  
  const desiredOffset = new THREE.Vector3(0, 5.2, 10);
  const target = new THREE.Vector3(skier.x, 1.6, skier.z + desiredOffset.z);
  const desiredPos = target.clone().add(new THREE.Vector3(0, desiredOffset.y, desiredOffset.z));

  // apply slight sway based on lateral velocity
  const sway = THREE.MathUtils.clamp(skier.vx * 0.08, -1.2, 1.2);
  desiredPos.x += -sway;

  // lerp camera smoothly
  camera.position.lerp(desiredPos, 0.12);
  camera.lookAt(new THREE.Vector3(skier.x, 0.8, skier.z));

  // subtle ambient adjustment based on sun
  if (skyLoaded && sunLight) {
    // tint fog slightly towards sun color
    if (scene.fog && sunLight.color) {
      const fogCol = new THREE.Color().copy(sunLight.color).lerp(new THREE.Color(0x9fd9ff), 0.6);
      scene.fog.color.lerp(fogCol, 0.06);
    }
  }
}

// Render loop
function animate(timestamp) {
  requestAnimationFrame(animate);
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  update(dt);

  // animate flags (wave effect)
  for (const g of gates) {
    if (g.flagMesh && g.flagMesh.userData) {
      g.flagMesh.userData.wavePhase += dt * 3.0;
      g.flagMesh.rotation.x = Math.sin(g.flagMesh.userData.wavePhase) * 0.06;
    }
  }
  
  // Aggiorna particelle neve se presenti
  if (window._snowParticles && window.GraphicsEngine) {
    GraphicsEngine.updateSnowParticles(window._snowParticles, dt);
  }
  
  // Anima stelle se presenti
  if (window._starfield) {
    window._starfield.rotation.y += 0.0001 * dt * 60;
  }

  const force2D = window._use2DFallbackForce === true;
  if ((typeof window._use2DFallback === 'function' && window._use2DFallback()) || force2D) {
    // we have chosen 2D fallback
    try { draw2DFallback(); } catch (e) { console.error('2D fallback draw error', e); }
  } else if (renderer) {
    renderer.render(scene, camera);
  } else {
    // no renderer: attempt to draw 2D fallback anyway
    try { draw2DFallback(); } catch (e) { console.error('2D fallback draw error', e); }
  }
}

// Log stato rendering (solo una volta)
if (!window._renderingStatusLogged) {
  window._renderingStatusLogged = true;
  setTimeout(() => {
    console.log('=== STATO RENDERING ===');
    console.log('_use2DFallbackForce:', window._use2DFallbackForce);
    console.log('renderer:', renderer ? 'disponibile' : 'NON disponibile');
    console.log('Graphics2D:', window.Graphics2D ? 'disponibile' : 'NON disponibile');
    console.log('Canvas:', canvas ? 'disponibile' : 'NON disponibile');
  }, 3000);
}

// UI bindings
disciplineBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    disciplineBtns.forEach(b => b.setAttribute('data-active', 'false'));
    btn.setAttribute('data-active', 'true');
    const key = btn.getAttribute('data-discipline');
    if (disciplines[key]) selectedDiscipline = key;
  });
});
startBtn.addEventListener('click', () => {
  startRace3D();
});

// Expose controls for debugging
window.Ski3D = { start: startRace3D, stop: () => stopRace3D(false), scene };

// Initialization is now handled after dynamic import at top of file. If imports fail, the loader will enable 2D fallback and start the loop.


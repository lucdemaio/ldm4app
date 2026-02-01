// game.js - motore principale di gara
'use strict';

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Gestione dimensioni dinamiche del canvas (handling DPR e CSS scaling)
let W = canvas.clientWidth || canvas.width;
let H = canvas.clientHeight || canvas.height;
let showSkierDebug = true; // per debugging visibilità
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = Math.max(1, Math.floor(canvas.clientWidth || canvas.width));

  // Rispetta il max-height CSS del wrapper e lo spazio viewport per non far sparire l'HUD
  const wrapper = canvas.parentElement;
  let cssMax = 0;
  if (wrapper) {
    const maxStr = getComputedStyle(wrapper).getPropertyValue('max-height');
    cssMax = parseInt(maxStr) || 0;
  }
  const viewportLimit = Math.floor(window.innerHeight * 0.72); // lascia spazio per HUD e margin
  const displayHeightCandidate = Math.floor(canvas.clientHeight || canvas.height);
  let displayHeight = displayHeightCandidate;
  if (cssMax) displayHeight = Math.min(displayHeight, cssMax);
  displayHeight = Math.min(displayHeight, viewportLimit);

  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);
  // Usa setTransform per mappare le coordinate su CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = displayWidth;
  H = displayHeight;

  // Imposta posizione y dello sciatore in base all'altezza disponibile
  const desiredYOffset = 180; // regolato per rialzare lo sciatore
  skier.y = Math.min(H - skier.h - 10, Math.max(20, H - desiredYOffset));

  // Se non siamo in gara, ricentra lo sciatore rispetto alla nuova larghezza
  if (!raceActive && !raceFinished) {
    skier.x = Math.max(0, Math.min(W - skier.w, W / 2 - skier.w / 2));
  } else {
    // assicura che rimanga all'interno se è in gara
    skier.x = Math.max(0, Math.min(W - skier.w, skier.x));
  }

  // Debug info
  if (showSkierDebug) {
    console.debug(`resizeCanvas -> W:${W}, H:${H}, skier.x:${skier.x}, skier.y:${skier.y}`);
  }
}
window.addEventListener('resize', resizeCanvas);

// Sciatore
const skier = {
  w: 32,
  h: 40,
  x: W / 2 - 16,
  y: H - 120,
  vx: 0,
  accel: 1400,
  friction: 1000,
  maxSpeed: 420,
  color: '#1e90ff'
};

// Gara
let descentSpeed = 140;
let gates = [];
let spawnInterval = 1100;
let spawnTimer = 0;
const GATES_TO_FINISH = 30;
let gatesPassed = 0;
let penaltySeconds = 0;
let raceActive = false;
let raceFinished = false;
let raceTime = 0;
// Assicura che il canvas sia ridimensionato correttamente dopo l'inizializzazione delle variabili di stato
resizeCanvas();

// Discipline settings (vengono applicate da UI)
// Ho aggiunto `gateSpacing` (distanza verticale costante tra porte) e `gateShift` (spostamento orizzontale fisso per lo zig-zag)
const disciplineSettings = {
  slalom: {
    name: 'Slalom',
    descentSpeed: 90,
    spawnInterval: 700,
    gateGap: 56,
    gateSpacing: 140,
    gateShift: 120,
    skierAccel: 1800,
    skierFriction: 1600,
    skierMaxSpeed: 360
  },
  gigante: {
    name: 'Gigante',
    descentSpeed: 140,
    spawnInterval: 1100,
    gateGap: 88,
    gateSpacing: 190,
    gateShift: 160,
    skierAccel: 1400,
    skierFriction: 1000,
    skierMaxSpeed: 420
  },
  discesa: {
    name: 'Discesa Libera',
    descentSpeed: 260,
    spawnInterval: 1800,
    gateGap: 140,
    gateSpacing: 260,
    gateShift: 220,
    skierAccel: 900,
    skierFriction: 600,
    skierMaxSpeed: 520
  }
};
let selectedDiscipline = 'gigante';

// Tracking percorso: posizione ultima porta e lato successivo (left/right)
let lastGateX = null;
let lastGateY = null;
let nextGateIsLeft = true;

// Assets
const assets = {};

// Input
const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  // previeni scroll di pagina con le frecce quando sono usate per il gioco
  if (["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' && !raceActive) startRace();
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

// Helper per immagini
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossibile caricare ' + src));
    img.src = src;
  });
}

// SpawnGate: alternanza rigorosa left/right con spostamento fisso e distanza Y costante
function spawnGate() {
  const s = disciplineSettings[selectedDiscipline];
  const gap = s.gateGap;
  const poleWidth = 8;
  const gateShift = s.gateShift;
  const gateSpacing = s.gateSpacing;

  // limiti per il centro della porta (considera gap e pali)
  const minCenter = 20 + gap / 2 + poleWidth;
  const maxCenter = Math.max(minCenter, W - 20 - gap / 2 - poleWidth);

  let centerX;

  if (lastGateX === null) {
    // prima porta: scegli lato in base a nextGateIsLeft
    centerX = nextGateIsLeft ? Math.max(minCenter, Math.min(maxCenter, W / 2 - gateShift)) : Math.max(minCenter, Math.min(maxCenter, W / 2 + gateShift));
  } else {
    // porta successiva: sposta rigidamente verso il lato opposto rispetto all'ultima
    centerX = nextGateIsLeft ? lastGateX - gateShift : lastGateX + gateShift;
    // clamp
    centerX = Math.max(minCenter, Math.min(maxCenter, centerX));
  }

  // colore basato sul lato: rosso = sinistra, blu = destra
  const color = nextGateIsLeft ? '#e74c3c' : '#3498db';

  // posizione verticale: mantieni distanza costante dalla precedente
  const y = (lastGateY === null) ? -gateSpacing : lastGateY - gateSpacing;

  // registra per il prossimo spawn (alternate)
  lastGateX = centerX;
  lastGateY = y;
  nextGateIsLeft = !nextGateIsLeft;

  gates.push({ x: centerX, y, gap, poleWidth, color, passed: false, checked: false });
} 

// Aggiornamento fisica e gara
function update(dt) {
  // Inerzia laterale
  if (keys.left) skier.vx -= skier.accel * dt;
  if (keys.right) skier.vx += skier.accel * dt;
  if (!keys.left && !keys.right) {
    if (skier.vx > 0) skier.vx = Math.max(0, skier.vx - skier.friction * dt);
    else skier.vx = Math.min(0, skier.vx + skier.friction * dt);
  }
  skier.vx = Math.max(-skier.maxSpeed, Math.min(skier.maxSpeed, skier.vx));
  skier.x += skier.vx * dt;
  if (skier.x < 0) { skier.x = 0; skier.vx = 0; }
  if (skier.x > W - skier.w) { skier.x = W - skier.w; skier.vx = 0; }

  // Gara attiva: gestione porte e timer
  if (raceActive && !raceFinished) {
    raceTime += dt;
    spawnTimer += dt * 1000;
    if (spawnTimer >= spawnInterval) { spawnTimer = 0; spawnGate(); }

    for (let i = gates.length - 1; i >= 0; i--) {
      const g = gates[i];
      g.y += descentSpeed * dt;
      const passY = skier.y + skier.h / 2;
      if (!g.checked && g.y + 10 >= passY) {
        g.checked = true;
        const skierCenter = skier.x + skier.w / 2;
        const gapLeft = g.x - g.gap / 2;
        const gapRight = g.x + g.gap / 2;
        if (skierCenter >= gapLeft && skierCenter <= gapRight) {
          g.passed = true; gatesPassed++;
        } else {
          penaltySeconds += 2;
        }
        if (gatesPassed >= GATES_TO_FINISH) finishRace();
      }
      if (g.y > H + 80) gates.splice(i, 1);
    }

    // Aggiorna elementi HUD
    const timerEl = document.getElementById('timer');
    const penaltyEl = document.getElementById('penalty');
    const gateEl = document.getElementById('gateCounter');
    if (timerEl) timerEl.textContent = formatTime(raceTime + penaltySeconds);
    if (penaltyEl) penaltyEl.textContent = `Penali: +${penaltySeconds.toFixed(2)}s`;
    if (gateEl) gateEl.textContent = `Porta: ${gatesPassed} / ${GATES_TO_FINISH}`;
  }
}

// Disegno
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Background (semplice)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#dff6ff');
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Disegna porte
  for (const g of gates) {
    const poleH = 48;
    const poleXLeft = g.x - g.gap / 2 - g.poleWidth;
    const poleXRight = g.x + g.gap / 2;
    ctx.fillStyle = g.color;
    ctx.fillRect(poleXLeft, g.y, g.poleWidth, poleH);
    ctx.fillRect(poleXRight, g.y, g.poleWidth, poleH);
    ctx.fillStyle = g.color; ctx.beginPath();
    ctx.moveTo(poleXLeft + g.poleWidth, g.y + 6);
    ctx.lineTo(poleXLeft + g.poleWidth + 12, g.y + 18);
    ctx.lineTo(poleXLeft + g.poleWidth, g.y + 30);
    ctx.fill(); ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(poleXRight, g.y + 6);
    ctx.lineTo(poleXRight - 12, g.y + 18);
    ctx.lineTo(poleXRight, g.y + 30);
    ctx.fill(); ctx.closePath();
    if (g.checked && g.passed) {
      ctx.fillStyle = 'rgba(34,197,94,0.14)';
      ctx.fillRect(g.x - g.gap/2 - 6, g.y - 8, g.gap + 12, poleH + 16);
    }
  }

  // Sciatore
  if (assets.skier) {
    ctx.drawImage(assets.skier, skier.x, skier.y, skier.w, skier.h);
  } else {
    ctx.fillStyle = skier.color;
    ctx.fillRect(skier.x, skier.y, skier.w, skier.h);
  }

  // Debug marker per verificare visibilità dello sciatore
  if (showSkierDebug) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(skier.x + skier.w/2, skier.y + skier.h/2, 6, 0, Math.PI*2);
    ctx.fill();
  }
}

// Format time M:SS.CC
function formatTime(t) {
  const totalCentis = Math.floor(t * 100);
  const centis = totalCentis % 100;
  const totalSecs = Math.floor(totalCentis / 100);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  return `${mins}:${secs.toString().padStart(2,'0')}.${centis.toString().padStart(2,'0')}`;
}

// Apply discipline settings
function applyDiscipline(key) {
  const s = disciplineSettings[key]; if (!s) return;
  selectedDiscipline = key;
  descentSpeed = s.descentSpeed; spawnInterval = s.spawnInterval;
  skier.accel = s.skierAccel; skier.friction = s.skierFriction; skier.maxSpeed = s.skierMaxSpeed;
}

// Race control
function startRace() { restart(); applyDiscipline(selectedDiscipline); raceActive = true; raceFinished = false; raceTime = 0; document.getElementById('raceOverlay').setAttribute('aria-hidden','true'); }

function finishRace() {
  raceFinished = true; raceActive = false;
  const finalTime = raceTime + penaltySeconds;
  const record = { name: 'You', discipline: disciplineSettings[selectedDiscipline].name, rawTime: raceTime, penalty: penaltySeconds, finalTime };
  if (window.Season && typeof window.Season.addResult === 'function') window.Season.addResult(record);
  const overlay = document.getElementById('raceOverlay');
  overlay.innerHTML = `<div class="level-badge">Finish • ${formatTime(finalTime)}</div>`; overlay.setAttribute('aria-hidden','false');
}

function restart() {
  gates = [];
  spawnTimer = 0;
  raceTime = 0;
  gatesPassed = 0;
  penaltySeconds = 0;
  raceActive = false;
  raceFinished = false;
  skier.vx = 0;
  skier.x = Math.max(0, Math.min(W - skier.w, W / 2 - skier.w / 2));
  skier.y = Math.min(H - skier.h - 10, Math.max(20, H - 120));
  // reset percorso: la prima porta partirà dal centro della pista
  lastGateX = W / 2;
  lastGateY = null;
  nextGateIsLeft = true;
}

// Main loop
let lastTime = null;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp; const dt = (timestamp - lastTime) / 1000; lastTime = timestamp; update(dt); draw(); requestAnimationFrame(loop);
}

function startGameLoop() { lastTime = null; requestAnimationFrame(loop); }

// Load essential assets then start (fallback robusto)
Promise.allSettled([
  loadImage('assets/skier.svg')
]).then(results => {
  const r0 = results[0];
  if (r0 && r0.status === 'fulfilled') {
    assets.skier = r0.value;
  } else {
    console.warn('Immagine sciatore non disponibile, uso fallback rettangolare', r0 && r0.reason);
  }
  // Avvia comunque il game loop
  startGameLoop();
});

// UI hooks
document.querySelectorAll('.discipline-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.discipline-btn').forEach(b => b.setAttribute('data-active','false')); btn.setAttribute('data-active','true'); const key = btn.getAttribute('data-discipline'); if (key) applyDiscipline(key); }); });
const startBtn = document.getElementById('startRace'); if (startBtn) startBtn.addEventListener('click', () => startRace());

// Expose some functions for debugging
window.Game = { startRace, finishRace, restart, applyDiscipline };

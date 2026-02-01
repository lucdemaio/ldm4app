// Questo file è stato spostato in `game.js` e `season.js`.
// Mantengo questo file come segnaposto per evitare conflitti.
// Contenuto originale consolidato in `game.js` (motore) e `season.js` (classifica). 
}

// Disegna scena
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sfondo pista (gradiente a tema in base al livello)
  const theme = bgThemes[currentBgTheme];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.top);
  grad.addColorStop(1, theme.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Se c'è stato un avanzamento recente, mostra un leggero overlay per evidenziarlo
  if (levelUpFlashTimer > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, 0, W, H);
  }

  // Disegna linee orizzontali per dare l'idea di movimento della neve
  const spacing = 40;
  const offset = -(scrollY % spacing);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let y = offset; y < H; y += spacing) {
    ctx.fillRect(0, y, W, 6);
  }

  // Disegna porte (gates)
  for (const g of gates) {
    const poleH = 48;
    const poleXLeft = g.x - g.gap / 2 - g.poleWidth;
    const poleXRight = g.x + g.gap / 2;

    // pali
    ctx.fillStyle = g.color;
    ctx.fillRect(poleXLeft, g.y, g.poleWidth, poleH);
    ctx.fillRect(poleXRight, g.y, g.poleWidth, poleH);

    // bandierine (triangoli verso il centro)
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(poleXLeft + g.poleWidth, g.y + 6);
    ctx.lineTo(poleXLeft + g.poleWidth + 12, g.y + 18);
    ctx.lineTo(poleXLeft + g.poleWidth, g.y + 30);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(poleXRight, g.y + 6);
    ctx.lineTo(poleXRight - 12, g.y + 18);
    ctx.lineTo(poleXRight, g.y + 30);
    ctx.fill();
    ctx.closePath();

    // indicatore passata
    if (g.checked && g.passed) {
      ctx.fillStyle = 'rgba(34,197,94,0.14)';
      ctx.fillRect(g.x - g.gap/2 - 6, g.y - 8, g.gap + 12, poleH + 16);
    }
  }

  // Sciatore (sprite o fallback rettangolo)
  if (assets.skier) {
    ctx.drawImage(assets.skier, skier.x, skier.y, skier.w, skier.h);
  } else {
    ctx.fillStyle = skier.color;
    ctx.fillRect(skier.x, skier.y, skier.w, skier.h);
  }

  // HUD: timer a centesimi, penalità e porte
  ctx.fillStyle = '#033047';
  ctx.font = '18px sans-serif';
  ctx.fillText(`${formatTime(raceTime + penaltySeconds)}`, 10, 22);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`Penali: +${penaltySeconds.toFixed(2)}s`, 10, 44);
  ctx.fillText(`Porta: ${gatesPassed} / ${GATES_TO_FINISH}`, 10, 66); 

  // Se game over, mostra overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2 - 10);

    ctx.font = '18px sans-serif';
    ctx.fillText(`Hai resistito ${Math.floor(elapsed)} secondi`, W / 2, H / 2 + 20);
    ctx.fillText('Premi R per ricominciare', W / 2, H / 2 + 50);

    // Ripristina allineamento
    ctx.textAlign = 'start';
  }
}

function restart() {
  // reset generale (usato per ripartire in modalità arcade)
  gates = [];
  spawnTimer = 0;
  raceTime = 0;
  gatesPassed = 0;
  penaltySeconds = 0;
  raceActive = false;
  raceFinished = false;
  skier.vx = 0;
  skier.x = W / 2 - skier.w / 2;
}

// Formatta tempo in M:SS.CC (centisec)
function formatTime(t) {
  const totalCentis = Math.floor(t * 100);
  const centis = totalCentis % 100;
  const totalSecs = Math.floor(totalCentis / 100);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  return `${mins}:${secs.toString().padStart(2,'0')}.${centis.toString().padStart(2,'0')}`;
}

// Applica le impostazioni della disciplina scelta
function applyDiscipline(disciplineKey) {
  const s = disciplineSettings[disciplineKey];
  if (!s) return;
  selectedDiscipline = disciplineKey;
  descentSpeed = s.descentSpeed;
  spawnInterval = s.spawnInterval;
  skier.accel = s.skierAccel;
  skier.friction = s.skierFriction;
  skier.maxSpeed = s.skierMaxSpeed;
}

// Avvia la gara (resetta stato e abilita il timer)
function startRace() {
  restart();
  applyDiscipline(selectedDiscipline);
  raceActive = true;
  raceFinished = false;
  raceTime = 0;
  document.getElementById('raceOverlay').setAttribute('aria-hidden', 'true');
}

// Fine gara: salva nella classifica stagionale
function finishRace() {
  raceFinished = true;
  raceActive = false;
  const finalTime = raceTime + penaltySeconds;
  const record = {
    name: 'You',
    discipline: disciplineSettings[selectedDiscipline].name,
    rawTime: raceTime,
    penalty: penaltySeconds,
    finalTime
  };
  seasonLeaderboard.push(record);

  // Assegna punti stile FIS
  seasonLeaderboard.sort((a,b) => a.finalTime - b.finalTime);
  for (let i = 0; i < seasonLeaderboard.length; i++) {
    seasonLeaderboard[i].points = pointsByPosition[i] || 0;
  }

  updateLeaderboardUI();

  // Mostra overlay risultato
  const overlay = document.getElementById('raceOverlay');
  overlay.innerHTML = `<div class="level-badge">Finish • ${formatTime(finalTime)}</div>`;
  overlay.setAttribute('aria-hidden', 'false');
}

function updateLeaderboardUI() {
  const tbody = document.querySelector('#leaderboard tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  seasonLeaderboard.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td><td>${r.name} (${r.discipline})</td><td>${r.points || 0}</td><td>1</td>`;
    tbody.appendChild(tr);
  });
}

// Hook UI: selezione disciplina e avvio gara
document.querySelectorAll('.discipline-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.discipline-btn').forEach(b => b.setAttribute('data-active','false'));
    btn.setAttribute('data-active','true');
    const key = btn.getAttribute('data-discipline');
    if (key) applyDiscipline(key);
  });
});

const startBtn = document.getElementById('startRace');
if (startBtn) startBtn.addEventListener('click', () => startRace());

// Avvio del gioco solo dopo che le risorse sono pronte
function startGame() {
  lastTime = null;
  requestAnimationFrame(loop);
}

// Loop principale che usa il timestamp per dt
let lastTime = null;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // in secondi
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Caricamento risorse e avvio
Promise.all([
  loadImage('assets/skier.svg'),
  loadImage('assets/tree.svg')
]).then(([skImg, treeImg]) => {
  assets.skier = skImg;
  assets.tree = treeImg;
  startGame();
}).catch((err) => {
  console.warn('Errore caricamento immagini, avvio con fallback:', err);
  startGame();
});
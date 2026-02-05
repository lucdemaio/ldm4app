// Stellar ldm4app base in JavaScript/HTML5
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas fitting for mobile (keep internal resolution but scale via CSS)
function fitCanvasToWindow() {
    try {
        const aspect = canvas.width / canvas.height; // internal aspect (480/640)
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        const headerH = header ? header.offsetHeight : 0;
        const footerH = footer ? footer.offsetHeight : 0;
        const margin = 40; // safety margin
        const availableW = Math.max(200, window.innerWidth - margin);
        const availableH = Math.max(200, window.innerHeight - headerH - footerH - margin);
        // Fit into available space while preserving aspect ratio
        let desiredW = Math.min(availableW, Math.floor(availableH * aspect));
        let desiredH = Math.floor(desiredW / aspect);
        // If width is too small for aspect fallback to height-based sizing
        if (desiredW <= 0) {
            desiredH = Math.min(availableH, 640);
            desiredW = Math.floor(desiredH * aspect);
        }
        canvas.style.width = desiredW + 'px';
        canvas.style.height = desiredH + 'px';
        // Clamp player position inside new visible/internal bounds
        if (player && typeof player.x === 'number') player.x = Math.min(Math.max(player.x, 0), canvas.width - player.width);
    } catch (e) { console.warn('fitCanvasToWindow failed', e); }
}

// Call initially and on resize/orientation
window.addEventListener('resize', () => requestAnimationFrame(fitCanvasToWindow));
window.addEventListener('orientationchange', () => requestAnimationFrame(fitCanvasToWindow));
window.addEventListener('fullscreenchange', () => requestAnimationFrame(fitCanvasToWindow));


const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const PLAYER_SPEED = 5;

let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - 240,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    color: '#fff',
    canShoot: true
};

// Spari
let bullets = [];
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 7;

// Nemici (config dinamica + formazione e spari)
const BASE_ENEMY_ROWS = 3;
const ENEMY_COLS = 7;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 20;
const ENEMY_SPEED = 2; // base speed multiplier
let enemies = []; // array di nemici

// Formazione
let formation = {
    offsetX: 0,
    dir: 1,
    speed: 0.6,
    limit: 120
};

// Spari dei nemici
let enemyBullets = [];
const ENEMY_BULLET_SPEED = 3;
const ENEMY_SHOOT_CHANCE = 0.0009; // base chance per nemico per frame

// Vita giocatore e stato gioco
let lives = 3;
let gameOver = false;
let paused = false;

// Sistema Combo, Stats e Powerups
let combo = 0;
let comboTimer = 0;
let killStreak = 0;
let shotsFired = 0;
let shotsHit = 0;
let powerupsCollected = 0;

// Shield e powerup state
let shield = {active: false, timer: 0, max: 360};
let rapidFire = {active: false, timer: 0};
let multiShot = {active: false, timer: 0};
let powerups = []; // falling powerups

// Particelle
let particles = [];
let trails = [];

// Safety: ensure loadAssets exists to avoid runtime ReferenceError if the file is truncated or an old bundle is being served
if (typeof loadAssets === 'undefined') {
  async function loadAssets(forceTheme) {
    console.warn('loadAssets() not found — using no-op fallback. Assets may not load correctly until you refresh after deploy.');
    return;
  }
} 

// Livelli
let level = 1;
let levelingUp = false;
let levelTextTimer = 0; // contatore per mostrare "Level X"
let waveTimerFrames = 0; // timer per durata dell'onda (frames)

// Audio (WebAudio simple SFX + background music loader)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let bgAudio = null;
let bgProcedural = null;
function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
}
function playShoot() {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 900;
    g.gain.value = 0.08;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    setTimeout(()=>{ try{o.stop()}catch{} }, 150);
}
function playExplosion() {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.value = 200;
    g.gain.value = 0.18;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    setTimeout(()=>{ try{o.stop()}catch{} }, 400);
}
function playLevelUp() {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = 400;
    g.gain.value = 0.08;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    setTimeout(()=>{ try{o.stop()}catch{} }, 500);
}

// Background music loader: prova a caricare 'assets/music.ogg', altrimenti fallback procedurale
async function fileExists(url){
    try{ const r = await fetch(url, { method: 'HEAD' }); return r.ok; }catch(e){ return false; }
}
function startBackgroundMusic() {
    const musicUrl = 'assets/music.ogg';
    // controlla che il file esista prima di provare a caricarlo
    fileExists(musicUrl).then(exists => {
        if (!exists) {
            // non avviare la procedurale immediatamente per evitare messaggi di autoplay; avvia alla prima interazione
            const startOnGesture = () => { if (musicEnabled) startProceduralMusic(currentMusicTheme); document.removeEventListener('pointerdown', startOnGesture); document.removeEventListener('keydown', startOnGesture); };
            document.addEventListener('pointerdown', startOnGesture, { once: true });
            document.addEventListener('keydown', startOnGesture, { once: true });
            return;
        }
        try {
            bgAudio = new Audio(musicUrl);
            bgAudio.loop = true;
            bgAudio.volume = 0.45;
            // non chiamare play() immediatamente: aspetta la prima interazione utente
            const tryPlay = () => {
                if (!musicEnabled) return;
                bgAudio.play().catch(() => startProceduralMusic(currentMusicTheme));
                document.removeEventListener('pointerdown', tryPlay);
                document.removeEventListener('keydown', tryPlay);
            };
            document.addEventListener('pointerdown', tryPlay, { once: true });
            document.addEventListener('keydown', tryPlay, { once: true });
        } catch(e){
            const startOnGesture = () => { if (musicEnabled) startProceduralMusic(currentMusicTheme); document.removeEventListener('pointerdown', startOnGesture); document.removeEventListener('keydown', startOnGesture); };
            document.addEventListener('pointerdown', startOnGesture, { once: true });
            document.addEventListener('keydown', startOnGesture, { once: true });
        }
    });
}
// Procedural music with multiple themes (ambient, space, drone, arp)
let currentMusicTheme = localStorage.getItem('stellar_music_theme') || 'ambient';
let musicEnabled = localStorage.getItem('stellar_music_enabled') !== 'false';

function startProceduralMusic(theme){
    if (!musicEnabled) return;
    ensureAudio();
    if (bgProcedural) { clearInterval(bgProcedural); bgProcedural = null; }
    const master = audioCtx.createGain(); master.gain.value = 0.05; master.connect(audioCtx.destination);

    function playNote(freq, dur, type='sine', vol = 0.001){
        try {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = type; o.frequency.value = freq; g.gain.value = vol;
            o.connect(g); g.connect(master);
            o.start();
            g.gain.exponentialRampToValueAtTime(vol * 80, audioCtx.currentTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            o.stop(audioCtx.currentTime + dur + 0.02);
        } catch(e) { /* ignore */ }
    }

    currentMusicTheme = theme || currentMusicTheme || 'ambient';
    localStorage.setItem('stellar_music_theme', currentMusicTheme);

    if (theme === 'space') {
        bgProcedural = setInterval(()=>{
            const root = 180 + (level-1)*6;
            playNote(root, 0.28, 'sine', 0.0008);
            playNote(root*1.333, 0.18, 'sawtooth', 0.0006);
            playNote(root*1.5, 0.12, 'triangle', 0.0005);
            // occasional higher melody
            if (Math.random() < 0.3) playNote(root*2.0 + Math.random()*40, 0.12, 'sine', 0.0009);
        }, 420);
    } else if (theme === 'drone') {
        // long evolving pads
        const root = 110 + (level-1)*4;
        playNote(root, 2.4, 'sine', 0.0006);
        bgProcedural = setInterval(()=>{
            playNote(root * (Math.random() > 0.5 ? 1 : 1.5), 1.8, 'sine', 0.0006);
        }, 800);
    } else if (theme === 'arp') {
        bgProcedural = setInterval(()=>{
            const base = 200 + (level-1)*5;
            const notes = [0,3,7,10];
            for (let i=0;i<4;i++) setTimeout(()=>{ playNote(base * Math.pow(2, notes[i]/12), 0.12, 'triangle', 0.0009); }, i*80);
        }, 360);
    } else {
        // ambient default
        bgProcedural = setInterval(()=>{
            const root = 220 + (level-1)*8;
            playNote(root, 0.18, 'sine', 0.0009);
            playNote(root*1.5, 0.14, 'sine', 0.0006);
        }, 400);
    }
}

function setMusicEnabled(enabled){
    musicEnabled = !!enabled;
    localStorage.setItem('stellar_music_enabled', musicEnabled ? 'true' : 'false');
    updateMusicUI();
    if (!musicEnabled) stopBackgroundMusic();
    else {
        // restart music according to current theme
        // if an audio file is present prefer bgAudio, otherwise start procedural
        if (bgAudio && !bgAudio.paused) { try{ bgAudio.play(); }catch{} }
        else startProceduralMusic(currentMusicTheme);
    }
}

function updateMusicUI(){
    const btn = document.getElementById('toggleMusicBtn');
    if (!btn) return;
    btn.textContent = musicEnabled ? 'Music: On' : 'Music: Off';
}

function stopBackgroundMusic(){
    if (bgAudio) { try{ bgAudio.pause(); bgAudio.currentTime = 0; }catch{} }
    if (bgProcedural) { clearInterval(bgProcedural); bgProcedural = null; }
}

// Sfondo animato con stelle
let stars = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.7 + 0.3
}));
function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    ctx.restore();
}
function updateStars() {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });
}

// Particelle spettacolari
function addParticles(x, y, count, color, size = 3, speed = 4) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed + 1;
        particles.push({
            x, y,
            vx: Math.cos(angle) * vel,
            vy: Math.sin(angle) * vel,
            life: 1,
            decay: 0.015 + Math.random() * 0.01,
            size: size * (0.5 + Math.random() * 0.5),
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Trail navicella
function addTrail(x, y) {
    trails.push({x, y, life: 1, decay: 0.04});
}

function updateTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].life -= trails[i].decay;
        if (trails[i].life <= 0) trails.splice(i, 1);
    }
}

function drawTrails() {
    trails.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life * 0.6;
        ctx.fillStyle = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00e5ff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Powerups cadenti
function spawnPowerup(x, y) {
    const types = ['shield', 'rapid', 'multi', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({x, y, type, vy: 2});
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.vy;
        // collision con player
        if (p.x > player.x - 20 && p.x < player.x + player.width + 20 && p.y > player.y - 20 && p.y < player.y + player.height + 20) {
            powerupsCollected++;
            if (p.type === 'shield') { shield.active = true; shield.timer = shield.max; }
            else if (p.type === 'rapid') { rapidFire.active = true; rapidFire.timer = 420; }
            else if (p.type === 'multi') { multiShot.active = true; multiShot.timer = 480; }
            else if (p.type === 'life') { lives = Math.min(lives + 1, 9); addParticles(p.x, p.y, 20, '#f44', 4, 6); }
            addParticles(p.x, p.y, 20, p.type === 'life' ? '#f44' : '#0ff', 4, 6);
            playLevelUp();
            powerups.splice(i, 1);
        } else if (p.y > canvas.height + 40) {
            powerups.splice(i, 1);
        }
    }
}

function drawPowerups() {
    powerups.forEach(p => {
        ctx.save();
        const size = 18 + Math.sin(Date.now() / 120) * 3;
        ctx.translate(p.x, p.y);
        ctx.rotate(Date.now() / 400);
        if (p.type === 'life') {
            ctx.fillStyle = '#f44';
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#f44';
            ctx.beginPath();
            ctx.moveTo(0, -size/4);
            ctx.bezierCurveTo(size/2, -size/2, size/2, size/3, 0, size/2);
            ctx.bezierCurveTo(-size/2, size/3, -size/2, -size/2, 0, -size/4);
            ctx.fill();
        } else {
            ctx.fillStyle = p.type === 'shield' ? '#0ff' : p.type === 'rapid' ? '#f80' : '#0f0';
            ctx.shadowBlur = 18;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(-size/2, -size/2, size, size);
        }
        ctx.restore();
    });
}

// Effetti di esplosione
let explosions = [];
function addExplosion(x, y) {
    explosions.push({x, y, r: 0, alpha: 1});
    addParticles(x, y, 30, '#ff8800', 5, 7);
    addParticles(x, y, 20, '#ffcc00', 3, 5);
    playExplosion();
}
function drawExplosions() {
    explosions.forEach(ex => {
        ctx.save();
        ctx.globalAlpha = ex.alpha;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
    });
}
function updateExplosions() {
    explosions.forEach(ex => {
        ex.r += 2;
        ex.alpha -= 0.07;
    });
    explosions = explosions.filter(ex => ex.alpha > 0);
}

// Proiettili nemici: update e disegno
function updateEnemyBullets() {
    enemyBullets.forEach((b, i) => {
        b.y += b.vy;
        // collisione con giocatore
        if (!gameOver && b.x < player.x + player.width && b.x + 6 > player.x && b.y < player.y + player.height && b.y + 10 > player.y) {
            enemyBullets.splice(i, 1);
            if (shield.active) {
                shield.timer -= 60; // riduce shield
                if (shield.timer <= 0) { shield.active = false; shield.timer = 0; }
                addParticles(player.x + player.width/2, player.y + player.height/2, 15, '#0ff', 4, 5);
            } else {
                lives -= 1;
                combo = 0;
                killStreak = 0;
                addParticles(player.x + player.width/2, player.y + player.height/2, 25, '#f00', 5, 6);
                playExplosion();
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);
}

function drawEnemyBullets() {
    ctx.fillStyle = '#f88';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 6, 10));
}

// Spari luminosi
function drawBullets() {
    bullets.forEach(b => {
        ctx.save();
        let grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BULLET_HEIGHT);
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#fff');
        ctx.fillStyle = grad;
        ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
        ctx.restore();
    });
}

// Animazione navicella (lampeggio blu)
function drawPlayer() {
    // shield visuale
    if (shield.active) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 80) * 0.15;
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + player.height/2, 28 + Math.sin(Date.now()/100)*4, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    if (assets.player) {
        const img = assets.player;
        ctx.save();
        const w = player.width*2; const h = player.height*2;
        const sx = player.x + player.width/2 - w/2;
        const sy = player.y + player.height/2 - h/2 - Math.sin(Date.now()/300)*3;
        ctx.drawImage(img, sx, sy, w, h);
        ctx.restore();
        return;
    }
    // fallback canvas draw
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-10, -15, 20, 30);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(-20, 10); ctx.lineTo(-10, 0); ctx.lineTo(-10, 15); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 10); ctx.lineTo(10, 0); ctx.lineTo(10, 15); ctx.closePath(); ctx.fill();
    // Dettaglio blu animato
    ctx.fillStyle = `rgb(0,0,${180 + Math.sin(Date.now()/100)*75})`;
    ctx.fillRect(-5, -10, 10, 10);
    ctx.restore();
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= PLAYER_SPEED;
    }
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) {
        player.x += PLAYER_SPEED;
    }
    // trail
    if (Math.random() < 0.4) addTrail(player.x + player.width/2, player.y + player.height);
    // powerup timers
    if (shield.active && shield.timer > 0) { shield.timer--; if (shield.timer <= 0) shield.active = false; }
    if (rapidFire.active && rapidFire.timer > 0) { rapidFire.timer--; if (rapidFire.timer <= 0) rapidFire.active = false; }
    if (multiShot.active && multiShot.timer > 0) { multiShot.timer--; if (multiShot.timer <= 0) multiShot.active = false; }
    // combo decay
    if (comboTimer > 0) { comboTimer--; } else { combo = 0; }
}

function updateBullets() {
    bullets.forEach(b => b.y -= BULLET_SPEED);
    bullets = bullets.filter(b => b.y + BULLET_HEIGHT > 0);
}


// Modifica collisioni per effetto esplosione
function checkCollisions() {
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (
                b.x < e.x + e.width &&
                b.x + BULLET_WIDTH > e.x &&
                b.y < e.y + e.height &&
                b.y + BULLET_HEIGHT > e.y
            ) {
                // Danno
                e.hp = (e.hp || 1) - 1;
                bullets.splice(bi, 1);
                shotsHit++;
                if (e.hp <= 0) {
                    addExplosion(e.x + e.width/2, e.y + e.height/2);
                    // Combo & score
                    combo++;
                    comboTimer = 120; // 2 sec
                    killStreak++;
                    const bonusMultiplier = Math.min(combo, 10);
                    score += (e.scoreValue || 100) * bonusMultiplier;
                    // spawn powerup chance
                    if (Math.random() < 0.08 + level*0.01) spawnPowerup(e.x + e.width/2, e.y + e.height/2);
                    enemies.splice(ei, 1);
                } else {
                    e.color = 'rgba(255,200,80,0.95)';
                }
            }
        });
    });
}

// Punteggio
let score = 0;
let nextLifeScore = 5000;
function drawScore() {
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.restore();
    // Vite extra ogni tot punti
    if (score >= nextLifeScore) {
        lives = Math.min(lives + 1, 9);
        addParticles(player.x + player.width/2, player.y, 20, '#f44', 4, 6);
        playLevelUp();
        nextLifeScore += 5000;
    }
}

// Disegna le icone che rappresentano il numero di nemici rimasti (coi disegnini) e mostra la salute residua
function drawEnemyCount() {
    const count = enemies.length;
    const maxIcons = 10; // massimo icone visualizzate come disegnini
    const iconSize = 12;
    const gap = 6;
    const shown = Math.min(count, maxIcons);
    const totalWidth = shown * iconSize + Math.max(0, shown - 1) * gap;
    const startX = Math.floor(canvas.width / 2 - totalWidth / 2) + iconSize/2;
    const y = 48; // posizionamento verticale

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('Enemies', canvas.width / 2, y - 14);

    for (let i = 0; i < shown; i++) {
        const e = enemies[i] || {};
        const hp = (e.hp != null && e.maxHp != null) ? Math.max(0, Math.min(e.hp / e.maxHp, 1)) : 1;
        // colore in base al tipo
        let col = '#ff8a8a';
        if (e.type === 'elite') col = '#ffd24d';
        else if (e.type === 'heavy') col = '#ff9a7a';
        else if (e.type === 'fighter') col = '#ffb3d1';

        const x = startX + i * (iconSize + gap);
        ctx.save();
        ctx.translate(x, y);
        // piccolo triangolo navicella
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -iconSize/2);
        ctx.lineTo(iconSize/2, iconSize/2);
        ctx.lineTo(-iconSize/2, iconSize/2);
        ctx.closePath();
        ctx.fill();
        // ombreggiatura proporzionale a salute mancante
        if (hp < 1) {
            ctx.fillStyle = 'rgba(0,0,0,' + (1 - hp) * 0.6 + ')';
            ctx.beginPath();
            ctx.moveTo(0, -iconSize/2);
            ctx.lineTo(iconSize/2, iconSize/2);
            ctx.lineTo(-iconSize/2, iconSize/2);
            ctx.closePath();
            ctx.fill();
        }
        // barra vita sotto l'icona
        const barW = iconSize;
        const barH = 4;
        const barX = -barW/2;
        const barY = iconSize/2 + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hp > 0.66 ? '#0f0' : (hp > 0.33 ? '#ff0' : '#f44');
        ctx.fillRect(barX, barY, Math.max(1, Math.floor(barW * hp)), barH);
        // bordo della barra
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.restore();
    }

    // Se ci sono più nemici delle icone mostrate, aggiungi il conteggio numerico
    if (count > maxIcons) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText('x' + count, startX + shown * (iconSize + gap) + 18, y + 2);
    } else {
        // Mostra il numero totale piccolo vicino alle icone
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(count, startX + shown * (iconSize + gap) / 2 + 14, y + 2);
    }

    ctx.restore();
}

function drawLevelText() {
    const overlay = document.getElementById('overlay');
    if (levelTextTimer > 0) {
        ctx.save();
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 12;
        ctx.fillText('Level ' + level, canvas.width/2, canvas.height/2);
        ctx.restore();
        if (overlay) { overlay.classList.remove('hidden'); overlay.textContent = 'Level ' + level; }
    } else {
        if (overlay) { overlay.classList.add('hidden'); overlay.textContent = ''; }
    }
}

function drawLives() {
    ctx.save();
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Lives: ' + lives, canvas.width - 120, 40);
    ctx.restore();
}

function drawGameOver() {
    const overlay = document.getElementById('overlay');
    if (gameOver) {
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 30);
        ctx.restore();
        if (overlay) { overlay.classList.remove('hidden'); overlay.innerHTML = '<strong>GAME OVER</strong><br>Press R to restart'; }
    } else {
        if (overlay) { overlay.classList.add('hidden'); overlay.textContent = ''; }
    }
}

function restartGame() {
    // resettare stato (usato da R e dal pulsante Nuova partita)
    score = 0;
    level = 1;
    lives = 3;
    gameOver = false;
    scoreSaved = false;
    enemies = [];
    enemyBullets = [];
    combo = 0;
    comboTimer = 0;
    killStreak = 0;
    shotsFired = 0;
    shotsHit = 0;
    powerupsCollected = 0;
    shield.active = false; shield.timer = 0;
    rapidFire.active = false; rapidFire.timer = 0;
    multiShot.active = false; multiShot.timer = 0;
    powerups = [];
    particles = [];
    trails = [];
    spawnEnemies();
    updateLeaderboardUI();
    const overlay = document.getElementById('overlay'); if (overlay) { overlay.classList.add('hidden'); overlay.textContent = ''; }
}

// Restart key
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && gameOver) {
        restartGame();
    }
} )

let keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Attiva audio al primo interazione (permessi browser)
    if (!audioCtx && (e.key || e.code)) ensureAudio();
    
    // Pause
    if (e.key.toLowerCase() === 'p') {
        paused = !paused;
        const overlay = document.getElementById('overlay');
        if (paused && overlay) { overlay.classList.remove('hidden'); overlay.textContent = 'PAUSED'; }
        else if (overlay) { overlay.classList.add('hidden'); overlay.textContent = ''; }
    }

    // Fullscreen
    if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) canvas.requestFullscreen().catch(()=>{});
        else document.exitFullscreen();
    }

    if (e.key === ' ' && player.canShoot && !paused && !gameOver) {
        shotsFired++;
        const fireRate = rapidFire.active ? 120 : 200;
        if (multiShot.active) {
            bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2, y: player.y });
            bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2 - 12, y: player.y });
            bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2 + 12, y: player.y });
            shotsFired += 2;
        } else {
            bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2, y: player.y });
        }
        player.canShoot = false;
        setTimeout(() => player.canShoot = true, fireRate);
        playShoot();
    }
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === ' ') player.canShoot = true;
});

function drawPlayer() {
    // Navicella dettagliata con gradienti
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    // corpo centrale
    let g = ctx.createLinearGradient(-12, -12, 12, 12);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c0e8ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0,-14); ctx.quadraticCurveTo(-18,0,0,14); ctx.quadraticCurveTo(18,0,0,-14); ctx.fill();
    // cockpit
    ctx.fillStyle = '#08203a';
    ctx.beginPath(); ctx.ellipse(0, -3, 6, 4, 0, 0, Math.PI*2); ctx.fill();
    // thrust glow
    ctx.fillStyle = 'rgba(0,220,255,0.08)'; ctx.fillRect(-8,8,16,6);
    ctx.restore();
}

function drawEnemyShip(e) {
    // If image asset exists for type, draw it with slight rotation
    const img = (e.type === 'scout' && assets.scout) ? assets.scout : (e.type === 'fighter' && assets.fighter) ? assets.fighter : (e.type === 'heavy' && assets.heavy) ? assets.heavy : null;
    if (img) {
        ctx.save();
        const w = e.width * 2.6;
        const h = e.height * 2.6;
        const cx = e.x + e.width/2;
        const cy = e.y + e.height/2 + Math.sin((Date.now()/400)+e.phase)*2;
        ctx.translate(cx, cy);
        const rot = Math.sin((Date.now()/350)+e.phase) * 0.08;
        ctx.rotate(rot);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        // hp bar
        if (e.hp && e.maxHp) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-e.width/2, e.height/2+8, e.width, 6);
            ctx.fillStyle = '#0f0'; ctx.fillRect(-e.width/2, e.height/2+8, e.width*(e.hp/e.maxHp), 6);
        }
        ctx.restore();
        return;
    }
    // fallback vector draw
    ctx.save();
    ctx.translate(e.x + e.width/2, e.y + e.height/2);
    if (e.type === 'scout') {
        let g = ctx.createLinearGradient(-12,-8,12,8);
        g.addColorStop(0, e.color); g.addColorStop(1, '#222');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-14,0); ctx.quadraticCurveTo(-6,-12,0,-6); ctx.quadraticCurveTo(6,-12,14,0); ctx.quadraticCurveTo(6,12,0,6); ctx.quadraticCurveTo(-6,12,-14,0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-3,-2,6,4);
    } else if (e.type === 'fighter') {
        ctx.fillStyle = e.color; ctx.fillRect(-14,-8,28,16);
        ctx.fillStyle = '#111'; ctx.fillRect(-8,-6,16,12);
        ctx.fillStyle = '#ff8'; ctx.fillRect(-4,-2,8,4);
    } else {
        let g2 = ctx.createLinearGradient(-14,-10,14,10);
        g2.addColorStop(0,'#333'); g2.addColorStop(1,e.color);
        ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0,0,14,9,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-6,-3,12,6);
    }
    if (e.hp && e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-e.width/2, e.height/2+6, e.width, 6);
        ctx.fillStyle = '#0f0'; ctx.fillRect(-e.width/2, e.height/2+6, e.width*(e.hp/e.maxHp), 6);
    }
    ctx.restore();
}

function drawEnemies() {
    enemies.forEach(e => drawEnemyShip(e));
}

function updateEnemies() {
    // Movimento di formazione orizzontale
    formation.offsetX += formation.dir * formation.speed * (1 + (level - 1) * 0.06);
    if (Math.abs(formation.offsetX) > formation.limit) {
        formation.dir *= -1;
        formation.offsetX = Math.max(Math.min(formation.offsetX, formation.limit), -formation.limit);
        // porta la formazione leggermente giù
        enemies.forEach(e => e.baseY += 12);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        // Oscillazione individuale
        e.x = e.baseX + formation.offsetX + Math.sin((Date.now()/500) + e.phase) * 6 * (1 + (level-1)*0.08);
        e.y = e.baseY + Math.sin((Date.now()/700) + e.phase) * 4;
        // Sparo casuale bilanciato dal livello
        const shootChance = ENEMY_SHOOT_CHANCE * (1 + (level-1) * 0.35);
        if (Math.random() < shootChance) {
            enemyBullets.push({x: e.x + e.width/2 - 3, y: e.y + e.height, vy: ENEMY_BULLET_SPEED + level * 0.25});
        }
        // Se un nemico raggiunge la parte bassa dello schermo, consideralo passato
        if (e.y - e.height/2 > canvas.height + 8) {
            // rimuovi senza penalità; viene considerato passato
            enemies.splice(i,1);
            continue;
        }
        // Se colpisce la navicella (collisione diretta), perde una vita
        if (e.y + e.height >= player.y && e.x < player.x + player.width && e.x + e.width > player.x) {
            enemies.splice(i,1);
            lives -= 1;
            playExplosion();
            if (lives <= 0) gameOver = true;
            continue;
        }
    }

    // Avanza livello solo quando tutte le navicelle avversarie sono state uccise
    if (enemies.length === 0 && !levelingUp && !gameOver) {
        levelingUp = true;
        setTimeout(() => {
            (async () => {
                level += 1;
                // reload assets for new level so visuals change with progression
                if (typeof loadAssets === 'function') await loadAssets();
                requestAnimationFrame(fitCanvasToWindow);
                playLevelUp();
                spawnEnemies();
                levelingUp = false;
            })();
        }, 800);
    }
}

function updateHUD(){
    const s = document.getElementById('score');
    const l = document.getElementById('level');
    const v = document.getElementById('lives');
    const c = document.getElementById('combo');
    const st = document.getElementById('streak');
    const acc = document.getElementById('accuracy');
    const pw = document.getElementById('powerups');

    if (s) s.textContent = score.toLocaleString();
    if (l) l.textContent = 'LV ' + level;
    if (v) v.textContent = '♥'.repeat(Math.max(0, lives));
    if (c) c.textContent = combo > 0 ? combo + 'x' : '0x';
    if (st) st.textContent = killStreak;
    if (acc) acc.textContent = shotsFired > 0 ? Math.floor((shotsHit/shotsFired)*100) + '%' : '0%';
    if (pw) pw.textContent = powerupsCollected;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se in pausa, mostra solo sfondo e pausa
    if (paused) {
        drawStars();
        drawPlayer();
        drawEnemies();
        requestAnimationFrame(gameLoop);
        return;
    }

    // timer per onda
    if (waveTimerFrames > 0) waveTimerFrames--;

    updateStars();
    drawStars();
    updateTrails();
    drawTrails();

    updatePlayer();
    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updateExplosions();
    updatePowerups();
    updateParticles();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawPowerups();
    drawExplosions();
    drawParticles();
    drawScore();
    drawEnemyCount();

    // Combo indicator canvas
    if (combo > 1) {
        ctx.save();
        ctx.font = 'bold 32px Orbitron';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff0';
        ctx.fillText(combo + 'x COMBO!', canvas.width/2, 80);
        ctx.restore();
    }

    // HUD, level text e lives
    updateHUD();
    if (levelTextTimer > 0) levelTextTimer--;
    drawLevelText();
    drawLives();

    // Se GAME OVER - salva classifica e mostra overlay una sola volta
    if (gameOver) {
        drawGameOver();
        if (!scoreSaved) {
            scoreSaved = true;
            setTimeout(()=>{
                let name = prompt('Game Over! Enter your name for leaderboard:','Player');
                addScoreToLeaderboard(name ? name.trim() : 'Player', score);
            }, 100);
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    requestAnimationFrame(gameLoop);
}

function spawnEnemies() {
    enemies = [];
    // Dynamic rows / cols scaling with a cap
    const rows = Math.min(BASE_ENEMY_ROWS + (level - 1), 8); // up to 8 rows
    const cols = Math.min(ENEMY_COLS + Math.floor((level - 1) / 2), 12); // increase cols every 2 levels, cap 12
    const enemySpeedMultiplier = 1 + (level - 1) * 0.18;

    // spacing adapts to number of columns so formation fits canvas nicely
    const totalWidth = canvas.width - 80; // left/right margin
    const spacing = cols > 1 ? totalWidth / cols : ENEMY_WIDTH + 20;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const bx = 40 + Math.floor(col * spacing);
            const by = 40 + row * 40;

            // choose type with level-weighted probabilities and introduce 'elite' from mid levels
            let r = Math.random();
            // probabilities increase with level
            const pElite = level >= 6 ? Math.min(0.03 + (level - 6) * 0.02, 0.25) : 0; // elite appears after lvl6
            const pHeavy = Math.min(0.12 + level * 0.02, 0.35);
            const pFighter = Math.min(0.25 + level * 0.02, 0.5);

            let type = 'scout';
            if (r < pElite) type = 'elite';
            else if (r < pElite + pHeavy) type = 'heavy';
            else if (r < pElite + pHeavy + pFighter) type = 'fighter';
            else type = 'scout';

            let hp = type === 'elite' ? 5 : type === 'heavy' ? 3 : type === 'fighter' ? 2 : 1;
            // Slight HP bump with level for progression
            hp += Math.floor((level - 1) / 4);

            let scoreValue = type === 'elite' ? 600 : type === 'heavy' ? 300 : type === 'fighter' ? 180 : 100;
            // color mapping by type for clarity
            let color = type === 'scout' ? `hsl(${(row * 40 + level * 36) % 360},80%,60%)` : type === 'fighter' ? `hsl(${(row * 25 + level * 18) % 360},70%,48%)` : type === 'heavy' ? `hsl(${(row * 20 + level * 10) % 360},60%,38%)` : `hsl(${(row * 10 + level * 8) % 360},40%,52%)`;

            const enemyObj = {
                baseX: bx,
                baseY: by,
                x: bx,
                y: by,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                color: color,
                speedMul: enemySpeedMultiplier,
                phase: Math.random() * Math.PI * 2,
                type: type,
                hp: hp,
                maxHp: hp,
                scoreValue: scoreValue
            };

            // If dieselpunk theme is active and meta is present, adjust size/hitbox from metadata
            if (assetsTheme === 'dieselpunk' && window.dieselpunkMeta && window.dieselpunkMeta.ships) {
                const queryType = (type === 'scout' ? 'scout' : type === 'fighter' ? 'fighter' : type === 'heavy' ? 'heavy' : 'fighter');
                const candidates = window.dieselpunkMeta.ships.filter(s => s.type === queryType);
                if (candidates.length) {
                    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                    enemyObj.width = chosen.suggestedWidth || enemyObj.width;
                    enemyObj.height = chosen.suggestedHeight || enemyObj.height;
                    enemyObj.meta = chosen;
                }
            }

            enemies.push(enemyObj);
        }
    }

    formation.offsetX = 0;
    formation.dir = 1;

    // Show level text and set wave timer based on enemy count & level
    levelTextTimer = 100;
    const estimatedCount = enemies.length;
    waveTimerFrames = Math.max(5 * 60, Math.floor(18 * 60 + estimatedCount * 2 - level * 20));
}

// Caricamento asset (SVG) e inizializzazione audio
let assets = {player:null, scout:null, fighter:null, heavy:null};
let assetsTheme = 'default'; // 'default' or 'dieselpunk'
function loadImage(path){
    return new Promise((resolve)=>{
        const img = new Image(); img.onload = ()=>resolve(img); img.onerror = ()=>resolve(null); img.src = path;
    });
}
async function loadAssets(forceTheme){
    // Carica asset in base al livello e opzioni
    const lvl = Math.max(1, Math.min(level, 10));
    const theme = forceTheme || (lvl >= 6 ? 'dieselpunk' : 'default');
    assetsTheme = theme;
    if (theme === 'dieselpunk') {
        // map ship files to game roles (representative picks)
        assets.player = await loadImage(`assets/levels/level_svgs/player_lvl${lvl}.svg`); // keep player svg
        assets.scout = await loadImage(`assets/levels/dieselpunk_examples/ship_10.svg`);
        assets.fighter = await loadImage(`assets/levels/dieselpunk_examples/ship_03.svg`);
        assets.heavy = await loadImage(`assets/levels/dieselpunk_examples/ship_09.svg`);
        // load metadata if present
        try {
            const resp = await fetch('assets/levels/dieselpunk_examples/meta.json');
            if (resp.ok) window.dieselpunkMeta = await resp.json();
        } catch(e){ window.dieselpunkMeta = null; }
    } else {
        assets.player = await loadImage(`assets/levels/level_svgs/player_lvl${lvl}.svg`);
        assets.scout = await loadImage(`assets/levels/level_svgs/enemy_lvl${lvl}.svg`);
        assets.fighter = await loadImage(`assets/levels/level_svgs/enemy_lvl${lvl}.svg`);
        assets.heavy = await loadImage(`assets/levels/level_svgs/enemy_lvl${lvl}.svg`);
        window.dieselpunkMeta = null;
    }
    startBackgroundMusic();
}

// Salvataggio partita
function saveGameState(){
    const state = {
        level,
        score,
        lives,
        player,
        enemies,
        bullets,
        enemyBullets,
        powerups,
        combo,
        killStreak,
        shotsFired,
        shotsHit,
        powerupsCollected,
        shield,
        rapidFire,
        multiShot
    };
    localStorage.setItem('stellarldm4app_save', JSON.stringify(state));
    alert('Partita salvata!');
}

function loadGameState(){
    const state = JSON.parse(localStorage.getItem('stellarldm4app_save')||'null');
    if (!state) return false;
    level = state.level || 1;
    score = state.score || 0;
    lives = state.lives || 3;
    player = state.player || player;
    enemies = state.enemies || [];
    bullets = state.bullets || [];
    enemyBullets = state.enemyBullets || [];
    powerups = state.powerups || [];
    combo = state.combo || 0;
    killStreak = state.killStreak || 0;
    shotsFired = state.shotsFired || 0;
    shotsHit = state.shotsHit || 0;
    powerupsCollected = state.powerupsCollected || 0;
    shield = state.shield || {active:false,timer:0,max:360};
    rapidFire = state.rapidFire || {active:false,timer:0};
    multiShot = state.multiShot || {active:false,timer:0};
    return true;
}

document.addEventListener('DOMContentLoaded',()=>{
    const btn = document.getElementById('saveGameBtn');
    if(btn) btn.onclick = saveGameState;
    const newBtn = document.getElementById('newGameBtn');
    if (newBtn) newBtn.onclick = () => { restartGame(); };

    const toggle = document.getElementById('toggleDieselBtn');
    if (toggle) {
        const updateLabel = () => { toggle.textContent = assetsTheme==='dieselpunk' ? 'Theme: Dieselpunk ON' : 'Theme: Dieselpunk OFF'; toggle.style.background = assetsTheme==='dieselpunk' ? '#9a6a3b' : '#6b6b6b'; }
        updateLabel();
        toggle.onclick = async () => {
            toggle.disabled = true;
            toggle.textContent = 'Applying...';
            const newTheme = assetsTheme === 'dieselpunk' ? 'default' : 'dieselpunk';
            if (typeof loadAssets === 'function') { await loadAssets(newTheme); } else { console.warn('loadAssets not available — cannot apply theme'); }
            // respawn enemies so new visuals are used
            spawnEnemies();
            updateLabel();
            toggle.disabled = false;
        };
    }

    // Music controls
    const toggleMusicBtn = document.getElementById('toggleMusicBtn');
    const musicThemeSelect = document.getElementById('musicThemeSelect');
    if (toggleMusicBtn) {
        toggleMusicBtn.onclick = () => { setMusicEnabled(!musicEnabled); };
    }
    if (musicThemeSelect) {
        musicThemeSelect.value = currentMusicTheme;
        musicThemeSelect.onchange = () => {
            const theme = musicThemeSelect.value;
            currentMusicTheme = theme;
            localStorage.setItem('stellar_music_theme', theme);
            // restart procedural if music enabled
            if (musicEnabled) {
                stopBackgroundMusic();
                startProceduralMusic(theme);
            }
        };
    }

    // Ensure canvas fits the screen on load
    try { requestAnimationFrame(fitCanvasToWindow); } catch(e) {}

    // Sidebar handle drag for moving the menu to top on mobile
    (function(){
        const appEl = document.querySelector('.app');
        const sidebarHandle = document.getElementById('sidebarHandle');
        function setMenuTopState(on){
            if (!appEl) return;
            if (on) { appEl.classList.add('menu-top'); localStorage.setItem('stellar_menu_top','1'); }
            else { appEl.classList.remove('menu-top'); localStorage.removeItem('stellar_menu_top'); }
        }
        if (sidebarHandle){
            // restore previous state
            if (localStorage.getItem('stellar_menu_top') === '1') setMenuTopState(true);
            let dragging = false; let startY = 0; let lastDelta = 0;
            sidebarHandle.addEventListener('pointerdown', e => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                sidebarHandle.setPointerCapture(e.pointerId);
                dragging = true; startY = e.clientY; lastDelta = 0; sidebarHandle.classList.add('dragging');
            });
            sidebarHandle.addEventListener('pointermove', e => {
                if (!dragging) return;
                e.preventDefault();
                lastDelta = e.clientY - startY;
                const translate = Math.max(Math.min(lastDelta, 80), -220);
                sidebarHandle.style.transform = `translateY(${translate}px)`;
            }, { passive: false });
            sidebarHandle.addEventListener('pointerup', e => {
                if (!dragging) return;
                dragging = false; sidebarHandle.releasePointerCapture(e.pointerId); sidebarHandle.classList.remove('dragging'); sidebarHandle.style.transform = '';
                // if dragged upwards enough, set menu top; if dragged down enough, clear
                if (lastDelta < -40) setMenuTopState(true);
                else if (lastDelta > 40) setMenuTopState(false);
            });
            sidebarHandle.addEventListener('pointercancel', e => {
                dragging = false; try{ sidebarHandle.releasePointerCapture(e.pointerId);}catch{}; sidebarHandle.classList.remove('dragging'); sidebarHandle.style.transform = '';
            });
            // tap toggles
            sidebarHandle.addEventListener('click', e => { if (Math.abs(lastDelta) < 6) setMenuTopState(!document.querySelector('.app').classList.contains('menu-top')); });
        }
    })();

    // Touch / Pointer controls for mobile: tap to shoot, drag to move
    (function(){
        let touchActive = false;
        let touchPointerId = null;
        let touchActive = false;
        let touchPointerId = null;

        canvas.addEventListener('pointerdown', (e) => {
            // only primary touch or left mouse button
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            touchActive = true;
            touchPointerId = e.pointerId;

            // play audio context on first interaction
            if (!audioCtx) ensureAudio();

            // Immediate shot on touch/click
            if (player.canShoot && !paused && !gameOver) {
                shotsFired++;
                const fireRate = rapidFire.active ? 120 : 200;
                if (multiShot.active) {
                    bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2, y: player.y });
                    bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2 - 12, y: player.y });
                    bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2 + 12, y: player.y });
                    shotsFired += 2;
                } else {
                    bullets.push({ x: player.x + player.width/2 - BULLET_WIDTH/2, y: player.y });
                }
                player.canShoot = false;
                setTimeout(() => player.canShoot = true, fireRate);
                playShoot();
            }

            // Move player to touch position immediately (map to internal canvas coords)
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const xCanvas = (e.clientX - rect.left) * scaleX;
            player.x = Math.min(Math.max(xCanvas - player.width/2, 0), canvas.width - player.width);
        }, { passive: false });

        canvas.addEventListener('pointermove', (e) => {
            if (!touchActive || e.pointerId !== touchPointerId) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const xCanvas = (e.clientX - rect.left) * scaleX;
            player.x = Math.min(Math.max(xCanvas - player.width/2, 0), canvas.width - player.width);
        }, { passive: false });

        canvas.addEventListener('pointerup', (e) => {
            if (e.pointerId !== touchPointerId) return;
            touchActive = false;
            touchPointerId = null;
        });

        canvas.addEventListener('pointercancel', (e) => {
            if (e.pointerId === touchPointerId) { touchActive = false; touchPointerId = null; }
        });
    })();

});

// Carica partita se presente
if (loadGameState()) {
    (async ()=>{
        await loadAssets();
        requestAnimationFrame(fitCanvasToWindow);
        spawnEnemies();
        gameLoop();
    })();
} else {
    (async ()=>{
        await loadAssets();
        requestAnimationFrame(fitCanvasToWindow);
        spawnEnemies();
        gameLoop();
    })();
}

// Leaderboard (localStorage)
function getHighScores(){
    try{ return JSON.parse(localStorage.getItem('stellarldm4app_highscores')||'[]'); }catch{ return []; }
}
function saveHighScores(scores){ localStorage.setItem('stellarldm4app_highscores', JSON.stringify(scores)); }
function addScoreToLeaderboard(name, sc){
    const scores = getHighScores();
    scores.push({name: name||'Anonymous', score: sc, date: Date.now()});
    scores.sort((a,b)=>b.score-a.score);
    saveHighScores(scores.slice(0,10));
    updateLeaderboardUI();
}
function updateLeaderboardUI(){
    const list = document.getElementById('leaderboard');
    if (!list) return;
    const scores = getHighScores();
    list.innerHTML = '';
    scores.forEach(s=>{ const li = document.createElement('li'); li.textContent = `${s.name} — ${s.score}`; list.appendChild(li);});
}
updateLeaderboardUI();

// flag per salvataggio punteggio una sola volta
let scoreSaved = false;

// Inizia caricamento e poi avvia gioco
(async ()=>{
    const overlay = document.getElementById('overlay');
    if (overlay) { overlay.classList.remove('hidden'); overlay.textContent = 'Loading assets...'; }
    if (typeof loadAssets === 'function') { await loadAssets(); } else { console.warn('loadAssets not available — continuing without assets'); }
    // update toggle button label after assets are loaded (if present)
    const tb = document.getElementById('toggleDieselBtn');
    if (tb) { tb.textContent = assetsTheme==='dieselpunk' ? 'Theme: Dieselpunk ON' : 'Theme: Dieselpunk OFF'; tb.style.background = assetsTheme==='dieselpunk' ? '#9a6a3b' : '#6b6b6b'; }
    if (overlay) { overlay.classList.add('hidden'); overlay.textContent = ''; }
    spawnEnemies();
    gameLoop();
})();

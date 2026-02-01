// graphics-2d.js - Sistema grafico 2D professionale con montagne realistiche
'use strict';

const Graphics2D = {
  // Configurazioni paesaggio
  landscapes: {
    alpine: {
      name: 'Alpi',
      skyGradient: ['#87CEEB', '#E0F6FF', '#FFF'],
      mountains: [
        { height: 0.4, color: '#2C3E50', snow: 0.3 },
        { height: 0.5, color: '#34495E', snow: 0.25 },
        { height: 0.35, color: '#2C3E50', snow: 0.35 }
      ],
      trees: true,
      fog: '#E8F4F8'
    },
    dolomites: {
      name: 'Dolomiti',
      skyGradient: ['#B4D4E1', '#E8F4F8', '#FFF'],
      mountains: [
        { height: 0.45, color: '#8B7355', snow: 0.2 },
        { height: 0.38, color: '#A0826D', snow: 0.25 },
        { height: 0.42, color: '#967A5E', snow: 0.22 }
      ],
      trees: true,
      fog: '#D4E4E8'
    },
    sunset: {
      name: 'Tramonto',
      skyGradient: ['#FF6B6B', '#FFA07A', '#FFE4B5'],
      mountains: [
        { height: 0.4, color: '#2C3E50', snow: 0.3 },
        { height: 0.48, color: '#34495E', snow: 0.25 },
        { height: 0.36, color: '#2C3E50', snow: 0.32 }
      ],
      trees: true,
      fog: '#FFD4B5'
    },
    night: {
      name: 'Notturno',
      skyGradient: ['#0B1026', '#1A2F4F', '#2C4870'],
      mountains: [
        { height: 0.42, color: '#0D1B2A', snow: 0.35 },
        { height: 0.5, color: '#1B263B', snow: 0.28 },
        { height: 0.38, color: '#0D1B2A', snow: 0.38 }
      ],
      trees: false,
      fog: '#1A2F4F',
      stars: true
    }
  },

  // Particelle neve
  snowParticles: [],
  
  // Alberi
  trees: [],
  
  // Offset scroll per parallax
  scrollOffset: 0,
  
  // Landscape attivo
  currentLandscape: 'alpine',

  // Inizializza particelle neve
  initSnowParticles(count = 150) {
    this.snowParticles = [];
    for (let i = 0; i < count; i++) {
      this.snowParticles.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.2 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 0.1
      });
    }
  },

  // Inizializza alberi
  initTrees(count = 40) {
    this.trees = [];
    for (let i = 0; i < count; i++) {
      this.trees.push({
        x: Math.random(),
        z: Math.random() * 2, // profondità per parallax
        scale: 0.3 + Math.random() * 0.7,
        type: Math.random() > 0.5 ? 'pine' : 'fir'
      });
    }
  },

  // Aggiorna particelle neve
  updateSnowParticles(dt) {
    this.snowParticles.forEach(p => {
      p.y += p.speed * dt;
      p.x += p.drift * dt;
      
      // Wrap around
      if (p.y > 1) p.y = 0;
      if (p.x > 1) p.x = 0;
      if (p.x < 0) p.x = 1;
    });
  },

  // Disegna cielo con gradiente
  drawSky(ctx, cw, ch) {
    const landscape = this.landscapes[this.currentLandscape];
    const gradient = ctx.createLinearGradient(0, 0, 0, ch * 0.6);
    
    landscape.skyGradient.forEach((color, i) => {
      gradient.addColorStop(i / (landscape.skyGradient.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
  },

  // Disegna stelle (per modalità notturna)
  drawStars(ctx, cw, ch) {
    const landscape = this.landscapes[this.currentLandscape];
    if (!landscape.stars) return;
    
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 200; i++) {
      const x = (Math.sin(i * 123.456) * 0.5 + 0.5) * cw;
      const y = (Math.cos(i * 78.910) * 0.5 + 0.5) * ch * 0.5;
      const size = Math.random() > 0.8 ? 2 : 1;
      
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  },

  // Disegna montagne a layer multipli (parallax)
  drawMountains(ctx, cw, ch) {
    const landscape = this.landscapes[this.currentLandscape];
    const baseY = ch * 0.55;
    
    landscape.mountains.forEach((mountain, idx) => {
      const offset = this.scrollOffset * (0.1 + idx * 0.05);
      const peaks = 8 + idx * 2;
      
      // Layer montagna
      ctx.beginPath();
      ctx.moveTo(-50, baseY);
      
      for (let i = 0; i <= peaks; i++) {
        const x = (i / peaks) * (cw + 100) - 50 + offset;
        const baseHeight = baseY - ch * mountain.height;
        const noise = Math.sin(i * 2.5 + idx) * ch * 0.08;
        const y = baseHeight + noise;
        
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = ((i - 1) / peaks) * (cw + 100) - 50 + offset;
          const prevBaseHeight = baseY - ch * mountain.height;
          const prevNoise = Math.sin((i - 1) * 2.5 + idx) * ch * 0.08;
          const prevY = prevBaseHeight + prevNoise;
          
          const cpX = (prevX + x) / 2;
          const cpY = (prevY + y) / 2 - ch * 0.05;
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      }
      
      ctx.lineTo(cw + 50, baseY);
      ctx.lineTo(-50, baseY);
      ctx.closePath();
      
      // Gradiente montagna (roccia)
      const mountainGradient = ctx.createLinearGradient(0, baseY - ch * mountain.height, 0, baseY);
      mountainGradient.addColorStop(0, mountain.color);
      mountainGradient.addColorStop(1, this.shadeColor(mountain.color, -20));
      
      ctx.fillStyle = mountainGradient;
      ctx.fill();
      
      // Neve sulla cima
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(-50, baseY);
      
      for (let i = 0; i <= peaks; i++) {
        const x = (i / peaks) * (cw + 100) - 50 + offset;
        const baseHeight = baseY - ch * mountain.height;
        const noise = Math.sin(i * 2.5 + idx) * ch * 0.08;
        const y = baseHeight + noise;
        const snowLine = y + ch * mountain.height * mountain.snow;
        
        if (i === 0) {
          ctx.lineTo(x, snowLine);
        } else {
          const prevX = ((i - 1) / peaks) * (cw + 100) - 50 + offset;
          const prevBaseHeight = baseY - ch * mountain.height;
          const prevNoise = Math.sin((i - 1) * 2.5 + idx) * ch * 0.08;
          const prevY = prevBaseHeight + prevNoise;
          const prevSnowLine = prevY + ch * mountain.height * mountain.snow;
          
          const cpX = (prevX + x) / 2;
          const cpY = (prevSnowLine + snowLine) / 2 - ch * 0.03;
          ctx.quadraticCurveTo(cpX, cpY, x, snowLine);
        }
      }
      
      ctx.lineTo(cw + 50, baseY);
      ctx.lineTo(-50, baseY);
      ctx.closePath();
      
      const snowGradient = ctx.createLinearGradient(0, baseY - ch * mountain.height, 0, baseY);
      snowGradient.addColorStop(0, '#FFFFFF');
      snowGradient.addColorStop(0.5, '#F0F8FF');
      snowGradient.addColorStop(1, '#E6F2FF');
      
      ctx.fillStyle = snowGradient;
      ctx.fill();
      ctx.restore();
    });
  },

  // Disegna alberi ai lati della pista
  drawTrees(ctx, cw, ch) {
    const landscape = this.landscapes[this.currentLandscape];
    if (!landscape.trees) return;
    
    const baseY = ch * 0.55;
    
    this.trees.forEach(tree => {
      const x = tree.x < 0.5 ? tree.x * cw * 0.15 : cw * 0.85 + (tree.x - 0.5) * cw * 0.15;
      const y = baseY + ch * 0.1 + tree.z * ch * 0.15;
      const scale = tree.scale * (0.5 + tree.z * 0.5);
      
      this.drawTree(ctx, x, y, scale, tree.type);
    });
  },

  // Disegna singolo albero
  drawTree(ctx, x, y, scale, type) {
    const height = 40 * scale;
    const width = 20 * scale;
    
    // Tronco
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x - width * 0.1, y - height * 0.3, width * 0.2, height * 0.35);
    
    // Chioma (3 triangoli sovrapposti)
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerY = y - height * 0.3 - i * height * 0.25;
      const layerWidth = width * (1.2 - i * 0.2);
      const layerHeight = height * 0.35;
      
      ctx.fillStyle = i === 0 ? '#1B5E20' : '#2E7D32';
      ctx.beginPath();
      ctx.moveTo(x, layerY - layerHeight);
      ctx.lineTo(x - layerWidth, layerY);
      ctx.lineTo(x + layerWidth, layerY);
      ctx.closePath();
      ctx.fill();
      
      // Neve sull'albero
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(x, layerY - layerHeight);
      ctx.lineTo(x - layerWidth * 0.3, layerY - layerHeight * 0.7);
      ctx.lineTo(x + layerWidth * 0.3, layerY - layerHeight * 0.7);
      ctx.closePath();
      ctx.fill();
    }
  },

  // Disegna terreno neve (pista)
  drawSnowGround(ctx, cw, ch) {
    const baseY = ch * 0.55;
    
    // Gradiente neve
    const gradient = ctx.createLinearGradient(0, baseY, 0, ch);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.3, '#F8F8FF');
    gradient.addColorStop(1, '#E8E8F0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, baseY, cw, ch - baseY);
    
    // Texture neve (linee sottili)
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = baseY + (ch - baseY) * (i / 20) + this.scrollOffset % 20;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }
  },

  // Disegna pista (tracce sci)
  drawTrack(ctx, cw, ch, skierX) {
    const trackWidth = cw * 0.4;
    const centerX = cw * 0.5 + skierX;
    const baseY = ch * 0.55;
    
    // Pista battuta
    ctx.fillStyle = 'rgba(240, 240, 250, 0.6)';
    ctx.fillRect(centerX - trackWidth / 2, baseY, trackWidth, ch - baseY);
    
    // Linee laterali pista
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.moveTo(centerX - trackWidth / 2, baseY);
    ctx.lineTo(centerX - trackWidth / 2, ch);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + trackWidth / 2, baseY);
    ctx.lineTo(centerX + trackWidth / 2, ch);
    ctx.stroke();
    
    ctx.setLineDash([]);
  },

  // Disegna porte/gate
  // Supporta sia formato game3d.js (centerX, z) che game.js (x, y)
  drawGates(ctx, cw, ch, gates, skierZ) {
    // Reset log per ogni frame utile
    if (gates.length > 0) {
      if (!this._gatesLogCount) this._gatesLogCount = 0;
      if (this._gatesLogCount < 3) {
        console.log('drawGates frame', this._gatesLogCount, '- porte:', gates.length, 'skierZ:', skierZ?.toFixed(1), 'gate0.z:', gates[0]?.z?.toFixed(1));
        this._gatesLogCount++;
      }
    }
    
    gates.forEach((gate, idx) => {
      // Determina se usiamo formato game3d (centerX, z) o game.js (x, y)
      const hasZ = gate.z !== undefined;
      
      let screenY, screenX, scale;
      
      if (hasZ) {
        // Formato game3d.js: coordinate 3D
        // Asse Z: skier z=0 all'inizio, poi decresce (-10, -50, -100...)
        // Le porte hanno z negativo (-18, -30, -42...)
        // Una porta con z più negativo è PIÙ AVANTI nella pista
        
        // Calcola quanto la porta è "avanti" rispetto allo sciatore
        // gate.z = -18, skierZ = 0 → aheadDist = 0 - (-18) = 18 (porta è 18 unità avanti)
        // gate.z = -18, skierZ = -10 → aheadDist = -10 - (-18) = 8 (porta è 8 unità avanti)
        // gate.z = -18, skierZ = -20 → aheadDist = -20 - (-18) = -2 (porta è 2 unità dietro)
        const aheadDist = skierZ - gate.z;
        
        // Visibilità: mostra porte fino a 150 unità avanti e 20 dietro
        if (aheadDist < -20 || aheadDist > 150) return;
        
        // Mappa aheadDist su posizione schermo Y
        // aheadDist alto (lontano avanti) → alto schermo (Y basso)
        // aheadDist basso/negativo (vicino/dietro) → basso schermo (Y alto)
        const t = Math.max(0, Math.min(1, aheadDist / 150)); // 0 = vicino, 1 = lontano
        screenY = ch * 0.85 - t * ch * 0.6; // t=0 → 0.85*ch, t=1 → 0.25*ch
        
        // Scala: porte lontane più piccole
        scale = 0.3 + (1 - t) * 0.9;
        
        // Converti centerX in coordinata schermo
        screenX = cw * 0.5 + gate.centerX * (cw / 60);
      } else {
        // Formato game.js: x, y (già coordinate schermo)
        screenY = gate.y;
        screenX = gate.x;
        if (screenY < -100 || screenY > ch + 100) return;
        scale = 0.6 + (screenY / ch) * 0.5;
      }
      
      const poleHeight = 70 * scale;
      const poleWidth = 8 * scale;
      const gateGap = (gate.gap || 8) * (hasZ ? (cw / 70) : 1);
      
      const leftX = screenX - gateGap / 2;
      const rightX = screenX + gateGap / 2;
      
      // Ombre porte
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(leftX - poleWidth / 2 + 5, screenY + 5, poleWidth, poleHeight);
      ctx.fillRect(rightX - poleWidth / 2 + 5, screenY + 5, poleWidth, poleHeight);
      
      // Colore: usa il colore originale della porta
      const isRed = gate.color === '#e74c3c' || gate.color === 'red' || gate.color === '#F44336';
      const baseColor = isRed ? '#F44336' : '#2196F3';
      const color = gate.passed ? '#4CAF50' : baseColor;
      ctx.fillStyle = color;
      
      // Porta sinistra
      ctx.fillRect(leftX - poleWidth / 2, screenY, poleWidth, poleHeight);
      
      // Porta destra
      ctx.fillRect(rightX - poleWidth / 2, screenY, poleWidth, poleHeight);
      
      // Bandiera (alterna tra sinistra e destra)
      if (!gate.passed) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        
        // Alterna la bandiera: rosse a destra, blu a sinistra
        const flagX = isRed ? rightX : leftX;
        const flagDirection = isRed ? 1 : -1;
        
        ctx.moveTo(flagX, screenY);
        ctx.lineTo(flagX + (30 * scale * flagDirection), screenY + 10 * scale);
        ctx.lineTo(flagX, screenY + 20 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  },

  // Disegna sciatore
  drawSkier(ctx, cw, ch, skierX, skierVX) {
    const x = cw * 0.5 + skierX * 8;
    const y = ch * 0.75;
    const tilt = Math.min(Math.max(-skierVX * 0.03, -0.4), 0.4);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    
    // Ombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 35, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sci
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-20, 20, 8, 40);
    ctx.fillRect(12, 20, 8, 40);
    
    // Gambe
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(-12, 0, 10, 25);
    ctx.fillRect(2, 0, 10, 25);
    
    // Corpo
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(-10, -30, 20, 32);
    
    // Braccia
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(-18, -25, 6, 20);
    ctx.fillRect(12, -25, 6, 20);
    
    // Bastoncini
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(-30, 15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(18, -20);
    ctx.lineTo(30, 15);
    ctx.stroke();
    
    // Testa (casco)
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.arc(0, -40, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Visiera
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-10, -42, 20, 6);
    
    ctx.restore();
  },

  // Disegna particelle neve
  drawSnow(ctx, cw, ch) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.snowParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * cw, p.y * ch, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // Utility: schiarisce/scurisce colore
  shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  },

  // Funzione principale di rendering
  render(ctx, cw, ch, gameState) {
    try {
      // Aggiorna scroll per parallax
      this.scrollOffset += gameState.speed || 2;
      
      // Disegna layers
      this.drawSky(ctx, cw, ch);
      this.drawStars(ctx, cw, ch);
      this.drawMountains(ctx, cw, ch);
      this.drawTrees(ctx, cw, ch);
      this.drawSnowGround(ctx, cw, ch);
      this.drawTrack(ctx, cw, ch, gameState.skierX || 0);
      this.drawGates(ctx, cw, ch, gameState.gates || [], gameState.skierZ || 0);
      this.drawSkier(ctx, cw, ch, gameState.skierX || 0, gameState.skierVX || 0);
      this.drawSnow(ctx, cw, ch);
    } catch (e) {
      console.error('Errore in Graphics2D.render:', e);
      // Fallback: disegna almeno il cielo
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, cw, ch);
    }
  },

  // Inizializza tutto
  init() {
    console.log('Graphics2D: Inizializzazione sistema grafico 2D professionale...');
    this.initSnowParticles(150);
    this.initTrees(40);
    console.log('Graphics2D: Sistema inizializzato con', this.snowParticles.length, 'particelle neve e', this.trees.length, 'alberi');
  }
};

// Inizializza al caricamento
if (typeof window !== 'undefined') {
  window.Graphics2D = Graphics2D;
  console.log('Graphics2D: Modulo caricato, pronto per l\'inizializzazione');
  
  // Inizializza immediatamente
  try {
    Graphics2D.init();
  } catch (e) {
    console.error('Errore inizializzazione Graphics2D:', e);
  }
}

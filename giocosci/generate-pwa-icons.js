// Script per generare icone PWA da SVG esistente
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG semplice per l'icona dell'app (sci stilizzato)
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="ski" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  
  <!-- Mountain silhouette -->
  <path d="M0 380 L120 200 L220 280 L340 140 L450 260 L512 220 L512 512 L0 512 Z" 
        fill="#0f172a" opacity="0.3"/>
  
  <!-- Skier -->
  <g transform="translate(256, 200)">
    <!-- Head -->
    <circle cx="0" cy="-40" r="25" fill="#fff"/>
    
    <!-- Body -->
    <path d="M-8,-20 L-15,20 L-10,50 M8,-20 L15,20 L10,50" 
          stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"/>
    
    <!-- Arms with poles -->
    <path d="M-8,-10 L-45,10 L-60,80" 
          stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M8,-10 L45,10 L60,80" 
          stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none"/>
    
    <!-- Poles -->
    <line x1="-60" y1="80" x2="-70" y2="120" stroke="#d1d5db" stroke-width="5"/>
    <line x1="60" y1="80" x2="70" y2="120" stroke="#d1d5db" stroke-width="5"/>
    <circle cx="-70" cy="120" r="6" fill="#d1d5db"/>
    <circle cx="70" cy="120" r="6" fill="#d1d5db"/>
    
    <!-- Skis -->
    <rect x="-50" y="45" width="12" height="90" rx="6" fill="url(#ski)"/>
    <rect x="38" y="45" width="12" height="90" rx="6" fill="url(#ski)"/>
  </g>
  
  <!-- Snow particles -->
  <circle cx="80" cy="120" r="4" fill="#fff" opacity="0.7"/>
  <circle cx="150" cy="90" r="3" fill="#fff" opacity="0.6"/>
  <circle cx="420" cy="150" r="5" fill="#fff" opacity="0.8"/>
  <circle cx="350" cy="200" r="3" fill="#fff" opacity="0.5"/>
  <circle cx="100" cy="320" r="4" fill="#fff" opacity="0.6"/>
  <circle cx="450" cy="350" r="3" fill="#fff" opacity="0.7"/>
</svg>`;

// Crea directory assets se non esiste
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Salva SVG principale
const svgPath = path.join(assetsDir, 'app-icon.svg');
fs.writeFileSync(svgPath, iconSVG);
console.log('✓ Creato:', svgPath);

// Crea file placeholder PNG per ogni dimensione
// Nota: Per icone PNG reali, usa un tool come sharp o imagemagick
// Questo crea solo file di testo placeholder
sizes.forEach(size => {
  const filename = `icon-${size}.png`;
  const filepath = path.join(assetsDir, filename);
  
  // Crea un file placeholder (in produzione usa sharp per convertire SVG→PNG)
  const placeholder = `PNG Icon ${size}x${size} - Use ImageMagick or Sharp to generate from app-icon.svg`;
  fs.writeFileSync(filepath, placeholder);
  console.log(`✓ Placeholder creato: ${filename}`);
});

console.log('\n📱 Icone PWA create!');
console.log('\n⚠️  IMPORTANTE: I file PNG sono placeholder.');
console.log('Per generare icone PNG reali, installa sharp:');
console.log('  npm install sharp');
console.log('\nPoi usa questo comando per convertire:');
console.log('  node generate-png-icons.js');

// generate-graphics-assets.js - Genera asset grafici procedurali
'use strict';

// Crea skybox procedurale SVG
function generateSkySVG(preset = 'midday') {
  const presets = {
    midday: {
      topColor: '#4A90E2',
      midColor: '#87CEEB',
      bottomColor: '#B8D8F0',
      sunColor: '#FFFEF0',
      cloudColor: '#FFFFFF'
    },
    sunrise: {
      topColor: '#FFB6C1',
      midColor: '#FFC8D4',
      bottomColor: '#FFE8D8',
      sunColor: '#FFD4A3',
      cloudColor: '#FFE8E0'
    },
    sunset: {
      topColor: '#FF8C69',
      midColor: '#FFB4A0',
      bottomColor: '#FFD8C8',
      sunColor: '#FF6B4A',
      cloudColor: '#FFC8B8'
    },
    night: {
      topColor: '#0A1929',
      midColor: '#1A2535',
      bottomColor: '#2B3D50',
      sunColor: '#6B8CAE',
      cloudColor: '#3B4D60'
    }
  };
  
  const config = presets[preset] || presets.midday;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2048" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${config.topColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${config.midColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${config.bottomColor};stop-opacity:1" />
    </linearGradient>
    
    <radialGradient id="sunGradient">
      <stop offset="0%" style="stop-color:${config.sunColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${config.sunColor};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${config.sunColor};stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- Sky background -->
  <rect width="2048" height="1024" fill="url(#skyGradient)"/>
  
  <!-- Sun/Moon -->
  <circle cx="1600" cy="300" r="120" fill="url(#sunGradient)"/>
  
  <!-- Clouds -->
  <ellipse cx="300" cy="200" rx="150" ry="60" fill="${config.cloudColor}" opacity="0.7"/>
  <ellipse cx="800" cy="350" rx="200" ry="80" fill="${config.cloudColor}" opacity="0.6"/>
  <ellipse cx="1400" cy="250" rx="180" ry="70" fill="${config.cloudColor}" opacity="0.65"/>
  <ellipse cx="500" cy="500" rx="220" ry="90" fill="${config.cloudColor}" opacity="0.55"/>
  <ellipse cx="1600" cy="600" rx="190" ry="75" fill="${config.cloudColor}" opacity="0.6"/>
</svg>`;
  
  return svg;
}

// Crea texture neve procedurale SVG
function generateSnowTextureSVG(type = 'fresh') {
  const types = {
    fresh: {
      baseColor: '#FFFFFF',
      shadowColor: '#F0F8FF',
      highlightColor: '#FFFFFF'
    },
    packed: {
      baseColor: '#F8FBFF',
      shadowColor: '#E8F0F8',
      highlightColor: '#FFFFFF'
    },
    icy: {
      baseColor: '#E0F0FF',
      shadowColor: '#D0E8FF',
      highlightColor: '#F0F8FF'
    }
  };
  
  const config = types[type] || types.fresh;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="snowPattern" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="${config.baseColor}"/>
      <!-- Sparkles -->
      <circle cx="10" cy="10" r="1.5" fill="${config.highlightColor}" opacity="0.8"/>
      <circle cx="30" cy="25" r="1" fill="${config.highlightColor}" opacity="0.7"/>
      <circle cx="50" cy="15" r="1.2" fill="${config.highlightColor}" opacity="0.75"/>
      <circle cx="20" cy="45" r="1.3" fill="${config.highlightColor}" opacity="0.8"/>
      <circle cx="55" cy="50" r="1" fill="${config.highlightColor}" opacity="0.7"/>
      <!-- Shadows -->
      <circle cx="15" cy="35" r="3" fill="${config.shadowColor}" opacity="0.3"/>
      <circle cx="45" cy="40" r="2.5" fill="${config.shadowColor}" opacity="0.25"/>
      <circle cx="35" cy="55" r="2" fill="${config.shadowColor}" opacity="0.2"/>
    </pattern>
  </defs>
  
  <rect width="512" height="512" fill="url(#snowPattern)"/>
</svg>`;
  
  return svg;
}

// Crea normal map procedurale per neve
function generateSnowNormalSVG() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="normalPattern" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="#8080FF"/>
      <!-- Bump details -->
      <circle cx="20" cy="20" r="8" fill="#9090FF"/>
      <circle cx="45" cy="35" r="6" fill="#9595FF"/>
      <circle cx="30" cy="50" r="7" fill="#9292FF"/>
      <ellipse cx="10" cy="45" rx="5" ry="3" fill="#8888FF"/>
      <ellipse cx="55" cy="15" rx="4" ry="6" fill="#8A8AFF"/>
    </pattern>
  </defs>
  
  <rect width="512" height="512" fill="url(#normalPattern)"/>
</svg>`;
  
  return svg;
}

// Crea sprite albero SVG
function generateTreeSpriteSVG() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="384" xmlns="http://www.w3.org/2000/svg">
  <!-- Trunk -->
  <rect x="115" y="280" width="26" height="104" fill="#5a3b1f"/>
  
  <!-- Tree layers (bottom to top) -->
  <polygon points="128,280 60,340 196,340" fill="#2b5b2d"/>
  <polygon points="128,260 70,310 186,310" fill="#2d6230"/>
  <polygon points="128,240 80,280 176,280" fill="#2f6933"/>
  <polygon points="128,220 90,250 166,250" fill="#327036"/>
  <polygon points="128,200 100,220 156,220" fill="#347739"/>
  <polygon points="128,180 108,195 148,195" fill="#377e3c"/>
  
  <!-- Snow on branches -->
  <polygon points="128,280 70,330 186,330" fill="#FFFFFF" opacity="0.7"/>
  <polygon points="128,260 80,300 176,300" fill="#FFFFFF" opacity="0.6"/>
  <polygon points="128,240 90,270 166,270" fill="#FFFFFF" opacity="0.5"/>
  <polygon points="128,220 100,240 156,240" fill="#FFFFFF" opacity="0.4"/>
  
  <!-- Highlights -->
  <circle cx="128" cy="200" r="3" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="140" cy="230" r="2" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="116" cy="260" r="2.5" fill="#FFFFFF" opacity="0.85"/>
</svg>`;
  
  return svg;
}

// Salva SVG come file
function saveSVGAsFile(svgContent, filename) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Genera tutti gli asset
function generateAllAssets() {
  console.log('🎨 Generazione asset grafici...');
  
  // Directory assets
  const assets = {
    'sky.svg': generateSkySVG('midday'),
    'sky_sunrise.svg': generateSkySVG('sunrise'),
    'sky_sunset.svg': generateSkySVG('sunset'),
    'sky_night.svg': generateSkySVG('night'),
    'snow_texture.svg': generateSnowTextureSVG('fresh'),
    'snow_texture_packed.svg': generateSnowTextureSVG('packed'),
    'snow_texture_icy.svg': generateSnowTextureSVG('icy'),
    'snow_normal.svg': generateSnowNormalSVG(),
    'tree.svg': generateTreeSpriteSVG()
  };
  
  // In ambiente Node.js, salva i file
  if (typeof require !== 'undefined') {
    const fs = require('fs');
    const path = require('path');
    
    const assetsDir = path.join(__dirname, 'assets');
    
    // Crea directory se non esiste
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Salva ogni file
    Object.entries(assets).forEach(([filename, content]) => {
      const filepath = path.join(assetsDir, filename);
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`✅ Creato: ${filepath}`);
    });
    
    console.log(`\n🎉 ${Object.keys(assets).length} asset grafici generati con successo!`);
  } else {
    // In browser, offri download
    console.log('💡 Browser rilevato - usa saveSVGAsFile() per scaricare gli asset');
    return assets;
  }
}

// Esporta funzioni
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSkySVG,
    generateSnowTextureSVG,
    generateSnowNormalSVG,
    generateTreeSpriteSVG,
    generateAllAssets,
    saveSVGAsFile
  };
} else {
  window.GraphicsAssets = {
    generateSkySVG,
    generateSnowTextureSVG,
    generateSnowNormalSVG,
    generateTreeSpriteSVG,
    generateAllAssets,
    saveSVGAsFile
  };
}

// Auto-genera se eseguito direttamente con Node
if (typeof require !== 'undefined' && require.main === module) {
  generateAllAssets();
}

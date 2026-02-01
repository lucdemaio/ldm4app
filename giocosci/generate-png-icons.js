// Genera icone PNG reali da SVG usando sharp
const fs = require('fs');
const path = require('path');

// Verifica se sharp è installato
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp non installato. Installalo con: npm install sharp');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const assetsDir = path.join(__dirname, 'assets');
const svgPath = path.join(assetsDir, 'app-icon.svg');

// Verifica che il file SVG esista
if (!fs.existsSync(svgPath)) {
  console.error('❌ File app-icon.svg non trovato. Esegui prima: node generate-pwa-icons.js');
  process.exit(1);
}

async function generatePNGs() {
  console.log('🎨 Generazione icone PNG da SVG...\n');
  
  for (const size of sizes) {
    const outputPath = path.join(assetsDir, `icon-${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✓ Generato: icon-${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Errore generando icon-${size}.png:`, error.message);
    }
  }
  
  console.log('\n✅ Tutte le icone PNG generate con successo!');
  console.log('\n📱 La PWA è pronta. Ricarica la pagina per vedere il prompt di installazione.');
}

generatePNGs().catch(console.error);

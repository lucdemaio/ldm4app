// generate_assets.js
// Creates placeholder PNG assets in /assets by decoding base64 data.
// Run: node generate_assets.js
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'assets');
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

// 1x1 PNG white pixel (base64)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const pngBuffer = Buffer.from(pngBase64, 'base64');

const files = [
  { name: 'tree.png', buf: pngBuffer },
  { name: 'sky.png', buf: pngBuffer },
  { name: 'snow_texture.png', buf: pngBuffer },
  { name: 'snow_normal.png', buf: pngBuffer }
];

for (const f of files) {
  const p = path.join(out, f.name);
  fs.writeFileSync(p, f.buf);
  console.log('Wrote', p);
}

console.log('Placeholders created. You can replace them with better images in assets/ anytime.');
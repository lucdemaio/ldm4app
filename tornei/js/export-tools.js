// Utility for PDF export and poster (SVG) generation
// Requires html2pdf.bundle and QRCode (qrcode.min.js) loaded in index.html
window.ExportTools = (function(){
  const BRAND = 'creato da www.ldm4app.com';

  async function exportElementToPdf(el, filename = 'export.pdf'){
    if(!el) throw new Error('Elemento non trovato');
    // clone to avoid mutating original DOM
    const clone = el.cloneNode(true);
    // append footer
    const footer = document.createElement('div');
    footer.style.marginTop = '12px';
    footer.style.fontSize = '10px';
    footer.style.textAlign = 'center';
    footer.textContent = BRAND;
    clone.appendChild(footer);
    // convert clone to PDF via html2pdf
    const opt = { margin: 10, filename, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 1.5 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    return html2pdf().set(opt).from(clone).save();
  }

  async function generatePosterSvg({ title = '', subtitle = '', filename = 'poster.svg', qrUrl = 'https://www.ldm4app.com' } = {}){
    // generate QR as SVG string using qrcode lib
    const qrSvg = await QRCode.toString(qrUrl, { type: 'svg', width: 160, margin: 0 });

    const svg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1700' viewBox='0 0 1200 1700'>
  <defs>
    <linearGradient id='g' x1='0' x2='1'>
      <stop offset='0' stop-color='#7c3aed'/>
      <stop offset='1' stop-color='#4f46e5'/>
    </linearGradient>
    <style>
      .bg{fill:url(#g)}
      .title{font-family:Inter,Arial,Helvetica,sans-serif;fill:#ffffff;font-weight:800;font-size:64px}
      .sub{font-family:Inter,Arial,Helvetica,sans-serif;fill:#ffffff;opacity:0.9;font-size:28px}
      .brand{font-family:Inter,Arial,Helvetica,sans-serif;fill:#222222;font-size:20px}
    </style>
  </defs>
  <rect width='1200' height='1700' rx='32' class='bg'/>
  <g transform='translate(80,220)'>
    <text x='0' y='0' class='title'>${escapeXml(title)}</text>
    <text x='0' y='90' class='sub'>${escapeXml(subtitle)}</text>
  </g>
  <g transform='translate(520,1080)'>
    ${qrSvg}
  </g>
  <text x='50%' y='1620' text-anchor='middle' class='brand'>${BRAND}</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return svg;
  }

  function escapeXml(s){ return String(s||'').replace(/[&<>]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  return { exportElementToPdf, generatePosterSvg };
})();

// Utility for PDF export and poster (SVG) generation
// Requires html2pdf.bundle and QRCode (qrcode.min.js) loaded in index.html
window.ExportTools = (function(){
  const BRAND = 'creato da www.ldm4app.com';

  async function exportElementToPdf(el, filename = 'export.pdf'){
    if(!el) throw new Error('Elemento non trovato');
    
    // Crea container professionale per il PDF
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      line-height: 1.6;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
      text-align: center;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 28px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 5px;
    `;
    title.textContent = 'Gestionale Tornei Pro';
    
    const date = document.createElement('div');
    date.style.cssText = `
      font-size: 11px;
      color: #6b7280;
      margin-top: 8px;
    `;
    date.textContent = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    header.appendChild(title);
    header.appendChild(date);
    container.appendChild(header);
    
    // Contenuto - copia pulita
    const content = document.createElement('div');
    content.style.cssText = `
      margin: 20px 0;
    `;
    
    // Clone pulito del contenuto (solo testo e tabelle)
    const clone = el.cloneNode(true);
    
    // Rimuovi stili bruttini e ripulisci
    const style = document.createElement('style');
    style.textContent = `
      #pdf-content * {
        margin: 0 !important;
        padding: 8px !important;
        border-collapse: collapse !important;
      }
      #pdf-content table {
        width: 100% !important;
        border: 1px solid #d1d5db !important;
        margin: 15px 0 !important;
      }
      #pdf-content th {
        background-color: #2563eb !important;
        color: white !important;
        font-weight: 600 !important;
        padding: 10px !important;
        text-align: left !important;
      }
      #pdf-content td {
        border-bottom: 1px solid #e5e7eb !important;
        padding: 8px !important;
      }
      #pdf-content tr:last-child td {
        border-bottom: none !important;
      }
      #pdf-content h1, #pdf-content h2, #pdf-content h3 {
        color: #1f2937 !important;
        margin-top: 15px !important;
        margin-bottom: 10px !important;
      }
      #pdf-content h1 { font-size: 24px !important; font-weight: 700 !important; }
      #pdf-content h2 { font-size: 18px !important; font-weight: 700 !important; }
      #pdf-content h3 { font-size: 14px !important; font-weight: 600 !important; }
      #pdf-content p { margin: 8px 0 !important; }
      #pdf-content button, #pdf-content .btn {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    clone.id = 'pdf-content';
    content.appendChild(clone);
    container.appendChild(content);
    
    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      border-top: 2px solid #e5e7eb;
      margin-top: 30px;
      padding-top: 15px;
      font-size: 10px;
      color: #6b7280;
      text-align: center;
    `;
    footer.textContent = BRAND;
    container.appendChild(footer);
    
    // Aggiungi temporaneamente al DOM per il rendering
    document.body.appendChild(container);
    
    // Genera timestamp per nome unico
    const ts = new Date().toISOString().split('T')[0];
    const finalFilename = filename.replace('.pdf', `_${ts}.pdf`);
    
    try {
      // Opzioni ottimizzate per stampa professionale
      const opt = {
        margin: 10,
        filename: finalFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
    } finally {
      // Ripulisci
      document.body.removeChild(container);
      document.head.removeChild(style);
    }
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

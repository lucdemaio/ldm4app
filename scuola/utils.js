/* utils.js — helper functions shared across modules */
export function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export function renderTextAsHtml(text){
  // convert ```lang\n...``` blocks and preserve mermaid blocks
  const fenced = String(text || '').replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
    if((lang||'').toLowerCase() === 'mermaid'){
      return `<div class="mermaid">${escapeHtml(code)}</div>`;
    }
    return `<pre class="rounded-md p-3 bg-black/60 overflow-auto"><code class="language-${escapeHtml(lang||'')}">${escapeHtml(code)}</code></pre>`;
  });
  return fenced.split('\n').map(escapeHtml).join('<br>');
}

export function csvToHtmlTable(csv){
  try{
    const rows = csv.trim().split('\n').map(r=>r.split(','));
    let html = '<div class="overflow-auto"><table class="w-full text-xs"><thead><tr class="text-slate-300">';
    rows[0].forEach(h=> html += `<th class="px-2 py-1 text-left">${escapeHtml(h)}</th>`);
    html += '</tr></thead><tbody>';
    rows.slice(1).forEach(r=>{ html += '<tr class="text-slate-400">'; r.forEach(c=> html += `<td class="px-2 py-1">${escapeHtml(c)}</td>`); html += '</tr>'; });
    html += '</tbody></table></div>';
    return html;
  }catch(e){ return '<div class="text-xs text-red-400">Errore nella lettura del CSV</div>' }
}

export function downloadDataUrl(dataUrl, filename){ const a = document.createElement('a'); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }

export function htmlDecode(input){ const txt = document.createElement('textarea'); txt.innerHTML = input; return txt.value; }

// --- Export / sharing helpers ---
export function exportHtmlToPrintableWindow(title, htmlContent){
  const w = window.open('', '_blank', 'width=900,height=1200');
  if(!w) return alert('Popup bloccato: consenti popups per poter esportare il PDF.');
  const style = `
    <style>
      body{ font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#0f1724; padding:24px }
      .footer{ position:fixed; bottom:16px; left:0; right:0; text-align:center; font-size:12px; color:#666 }
      .content{ max-width:800px; margin:0 auto }
      pre{ white-space:pre-wrap; word-break:break-word; background:#f4f4f4; padding:12px; border-radius:8px }
    </style>`;
  w.document.write(`<html><head><title>${escapeHtml(title)}</title>${style}</head><body><div class="content">${htmlContent}</div><div class="footer">creato da www.ldm4app.com</div></body></html>`);
  w.document.close();
  // give the window a moment to layout then open print dialog
  setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 300);
}

export function downloadSvgString(svgString, filename){
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename || 'poster.svg'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
}

export async function generatePosterSvg(opts){
  // opts: { title, subtitle, footer = 'creato da www.ldm4app.com', qrUrl }
  const title = escapeHtml(opts.title || 'Scuola 2026');
  const subtitle = escapeHtml(opts.subtitle || 'Progettato con Scuola 2026 — LDM4App');
  const footer = escapeHtml(opts.footer || 'creato da www.ldm4app.com');
  const qrUrl = opts.qrUrl || 'https://www.ldm4app.com';
  const qrParam = encodeURIComponent(qrUrl);
  const width = 1200, height = 630;

  // Try to fetch the QR image and inline it as base64 to ensure the downloaded SVG contains the QR.
  let qrHref = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${qrParam}&choe=UTF-8`;
  try{
    const resp = await fetch(qrHref);
    if(resp.ok){
      const blob = await resp.blob();
      // convert blob -> data URL
      const dataUrl = await new Promise((res, rej)=>{
        const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob);
      });
      qrHref = dataUrl;
    }
  }catch(e){ /* fallback to external chart URL if fetch fails */ }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n    <defs>\n      <style>\n        .bg{fill:#071021}\n        .title{fill:#E6EEF8; font-family: Inter, Arial, sans-serif; font-weight:700; font-size:56px}\n        .sub{fill:#9fb8d6; font-size:20px}\n        .footer{fill:#8aa4bf; font-size:16px}\n      </style>\n    </defs>\n    <rect class="bg" width="100%" height="100%" rx="24"/>\n    <g transform="translate(64,96)">\n      <text class="title">${title}</text>\n      <text class="sub" y="72">${subtitle}</text>\n    </g>\n    <image x="920" y="56" width="180" height="180" href="${qrHref}" />\n    <text x="64" y="560" class="footer">${footer}</text>\n  </svg>`;
  return svg;
}

export function shareToWhatsApp(text, url){
  const full = `${text || ''} ${url || window.location.href}`.trim();
  const href = `https://api.whatsapp.com/send?text=${encodeURIComponent(full)}`;
  window.open(href, '_blank');
}

export function shareToTelegram(text, url){
  const href = `https://t.me/share/url?url=${encodeURIComponent(url || window.location.href)}&text=${encodeURIComponent(text || '')}`;
  window.open(href, '_blank');
}

// Expose share/helpers globally so non-module scripts (e.g. `app.js`) can call them directly
if(typeof window !== 'undefined'){
  window.shareToWhatsApp = shareToWhatsApp;
  window.shareToTelegram = shareToTelegram;
  window.exportHtmlToPrintableWindow = exportHtmlToPrintableWindow;
  window.generatePosterSvg = generatePosterSvg;
  window.downloadSvgString = downloadSvgString;
  window.downloadDataUrl = downloadDataUrl;
}

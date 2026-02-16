// Replaces elements with [data-lucide] attribute with inline SVG from assets/icons/{name}.svg when available
(async function(){
  async function fetchSVG(name){
    try{
      const res = await fetch(`assets/icons/${name}.svg`, {cache:'no-store'});
      if(!res.ok) return null;
      const text = await res.text();
      return text;
    }catch(e){ return null; }
  }

  function parseSVG(svgText){
    const wrapper = document.createElement('div');
    wrapper.innerHTML = svgText.trim();
    return wrapper.firstElementChild;
  }

  async function replaceAll(){
    const nodes = Array.from(document.querySelectorAll('[data-lucide]'));
    const isFileProtocol = location.protocol === 'file:';

    // Inline mapping for file:// contexts to avoid any network requests
    const INLINE_ICONS = {
      'menu': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'users': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      'layout-dashboard': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
      'settings': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.5" fill="#38bdf8" opacity="0.18"/><circle cx="12" cy="12" r="3.5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'hard-drive': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5" fill="#38bdf8" opacity="0.18"/><rect x="3" y="3" width="18" height="18" rx="2.5"/><rect x="7" y="15" width="10" height="4" rx="1" fill="#fbbf24" opacity="0.35"/><rect x="7" y="15" width="10" height="4" rx="1"/><rect x="7" y="7" width="6" height="5" rx="1" fill="#fff" opacity="0.7"/><rect x="7" y="7" width="6" height="5" rx="1"/><circle cx="17" cy="9" r="1"/></svg>',
      'more-vertical': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>'
    };

    const DEFAULT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>';

    for(const node of nodes){
      const name = node.getAttribute('data-lucide');
      if(!name) continue;

      if(isFileProtocol){
        try{
          // Use an inline SVG (mapped if available, otherwise default) so we avoid any file:// requests
          const svgText = INLINE_ICONS[name] || DEFAULT_SVG;
          const svgEl = parseSVG(svgText);
          if(!svgEl) continue;
          const cls = node.getAttribute('class') || '';
          if(cls) svgEl.setAttribute('class', cls + ' converted-icon');
          const style = node.getAttribute('style'); if(style) svgEl.setAttribute('style', style);
          node.parentNode.replaceChild(svgEl, node);
        }catch(e){ /* ignore */ }
        continue;
      }

      const svgText = await fetchSVG(name);
      if(!svgText) continue; // keep lucide fallback
      try{
        const svgEl = parseSVG(svgText);
        if(!svgEl) continue;
        // preserve classes and title
        const cls = node.getAttribute('class') || '';
        if(cls) svgEl.setAttribute('class', cls + ' converted-icon');
        // copy inline styles
        const style = node.getAttribute('style'); if(style) svgEl.setAttribute('style', style);
        node.parentNode.replaceChild(svgEl, node);
      }catch(e){ /* ignore */ }
    }
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    await replaceAll();
    // Re-init lucide for any remaining icons
    try{ if(typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons(); }catch(e){}
  });
})();
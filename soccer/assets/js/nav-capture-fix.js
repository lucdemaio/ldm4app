// Robust click fallback: capture pointer events on nav and force showView
(function(){
  function resolveSection(el){
    if(!el) return null;
    if(el.dataset && el.dataset.section) return el.dataset.section;
    const onclick = el.getAttribute && el.getAttribute('onclick');
    if(onclick){
      const match = onclick.match(/showView\(['"]([a-z0-9_-]+)['"]\)/i);
      if(match) return match[1];
    }
    // anchor inside dropdown
    if(el.closest){
      const parentBtn = el.closest('.nav-btn[data-section]');
      if(parentBtn && parentBtn.dataset) return parentBtn.dataset.section;
    }
    return null;
  }

  document.addEventListener('pointerdown', function(e){
    try{
      const el = e.target.closest('button.nav-btn, .nav-btn[data-section], .dropdown-menu a, .nav-dropdown .dropdown-toggle');
      if(!el) return;
      const section = resolveSection(el);
      if(section && typeof window.showView === 'function'){
        e.preventDefault();
        e.stopPropagation();
        window.showView(section);
        // ensure dropdowns are closed
        document.querySelectorAll('.nav-dropdown.active').forEach(d=>d.classList.remove('active'));
      }
    }catch(_){/* ignore */}
  }, true);
})();
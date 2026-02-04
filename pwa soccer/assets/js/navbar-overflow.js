// Move overflowing navbar items into a "More" dropdown on desktop
(function(){
  const DEBOUNCE = 150;
  let timer = null;

  function createMoreDropdown(){
    let more = document.querySelector('.nav-dropdown.more');
    if(more) return more;
    more = document.createElement('div');
    more.className = 'nav-dropdown more';
    more.innerHTML = `
      <button class="nav-btn dropdown-toggle" aria-haspopup="true" aria-expanded="false">
        <i data-lucide="more-vertical"></i>
        <span>Altro</span>
        <i data-lucide="chevron-down" class="dropdown-icon"></i>
      </button>
      <div class="dropdown-menu"></div>
    `;
    return more;
  }

  function isDesktop(){
    return window.matchMedia('(min-width: 769px)').matches;
  }

  function adjustNavbar(){
    const navbar = document.querySelector('.top-navbar');
    if(!navbar) return;
    const brand = navbar.querySelector('.navbar-brand');
    const main = navbar.querySelector('.navbar-main');
    const actions = navbar.querySelector('.navbar-actions');
    if(!main) return;

    // ensure more dropdown exists but hidden until needed
    const more = createMoreDropdown();
    // remove existing .more if present to avoid duplicates
    const existingMore = main.querySelector('.nav-dropdown.more');
    if(!existingMore) main.appendChild(more);

    // Move all items back to main before measurement
    const moreMenu = main.querySelector('.nav-dropdown.more .dropdown-menu');
    while(moreMenu && moreMenu.firstChild){
      main.insertBefore(moreMenu.firstChild, main.querySelector('.nav-dropdown.more'));
    }

    // Measure available space
    const navWidth = main.getBoundingClientRect().width;
    const brandWidth = brand ? brand.getBoundingClientRect().width : 0;
    const actionsWidth = actions ? actions.getBoundingClientRect().width : 0;

    // available for nav items (consider a small gutter)
    const available = navbar.getBoundingClientRect().width - brandWidth - actionsWidth - 40; // 40px safety

    // iterate children and move overflowing items
    let used = 0;
    const items = Array.from(main.querySelectorAll(':scope > .nav-btn, :scope > .nav-dropdown'));
    // ignore the 'more' placeholder itself
    for(const it of items){
      if(it.classList.contains('more')) continue;
      const w = it.getBoundingClientRect().width;
      if(used + w > available){
        // move to more menu
        if(moreMenu) moreMenu.appendChild(it);
      }else{
        used += w;
      }
    }

    // if nothing in more menu, hide the more button
    const moreBtn = main.querySelector('.nav-dropdown.more');
    if(moreMenu && moreMenu.children.length === 0){
      if(moreBtn) moreBtn.style.display = 'none';
    }else{
      if(moreBtn) moreBtn.style.display = '';
    }

    // re-init lucide icons if available
    try{ if(typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons(); }catch(e){}
  }

  function scheduleAdjust(){
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => { adjustNavbar(); timer = null; }, DEBOUNCE);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    scheduleAdjust();
    window.addEventListener('resize', scheduleAdjust);
    // also adjust after a short delay to account for icon replacement and fonts
    setTimeout(scheduleAdjust, 500);
  });
})();
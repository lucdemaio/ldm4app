// UI helpers: sidebar collapse, page transitions, small UX fixes
(function(){
  const body = document.body;
  const appShell = document.querySelector('.app-shell');
  const sidebar = document.querySelector('.sidebar');
  const collapseBtn = document.getElementById('sidebarCollapse');
  const expandBtn = document.getElementById('sidebarExpand');
  const toggleMobile = document.getElementById('sidebarToggle');

  function setCollapsed(collapsed){
    if(collapsed){
      body.classList.add('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed','1');
      if(collapseBtn) collapseBtn.style.display = 'none';
      if(expandBtn) expandBtn.style.display = 'inline-block';
    } else {
      body.classList.remove('sidebar-collapsed');
      localStorage.removeItem('sidebar-collapsed');
      if(collapseBtn) collapseBtn.style.display = 'inline-block';
      if(expandBtn) expandBtn.style.display = 'none';
    }
  }

  if(collapseBtn) collapseBtn.addEventListener('click', ()=> setCollapsed(true));
  if(expandBtn) expandBtn.addEventListener('click', ()=> setCollapsed(false));
  if(toggleMobile) toggleMobile.addEventListener('click', ()=>{
    document.querySelector('.sidebar').classList.toggle('open-mobile');
  });

  // restore preference
  if(localStorage.getItem('sidebar-collapsed')) setCollapsed(true);

  // page transition on route change
  window.addEventListener('hashchange', () => {
    const content = document.querySelector('.content');
    if(!content) return;
    content.classList.remove('page-fade-in');
    void content.offsetWidth; // reflow
    content.classList.add('page-fade-in');
  });

  // initial animation
  document.addEventListener('DOMContentLoaded', ()=>{
    const content = document.querySelector('.content');
    if(content) content.classList.add('page-fade-in');
  });
})();
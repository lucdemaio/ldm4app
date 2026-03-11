const Router = (function(){
  // preserve the initial home HTML so we can restore it when user clicks brand/home
  const rootEl = document.getElementById('app-root');
  const initialHome = rootEl ? rootEl.innerHTML : '';

  const routes = {
    // restore the original hero/home when hash is empty
    '': async () => {
      // Dashboard is already in index.html, just ensure refresh
      console.log('[DEBUG] Router home route triggered');
      if(window.AppTornei) {
        if(AppTornei.renderHomePreview) await AppTornei.renderHomePreview();
        if(AppTornei.renderStatsAndDashboard) await AppTornei.renderStatsAndDashboard();
      }
    },
    'tornei': () => AppTornei.renderList(),
    'tornei/nuovo': () => AppTornei.renderCreate(),
    'offline': () => OfflineUI.render(),
    'giocatori': () => AppGiocatori.render(),
    'statistiche': () => AppStatistics.render(),
    // application pages
    'squadre': () => SquadreUI.render(),
    'giornate': () => GiornateUI.renderList(),
    'classifica': () => ClassificaUI.render(),
    'classifiche': () => ClassificaUI.render(),
    'impostazioni': () => { document.getElementById('app-root').innerHTML = '<div class="alert alert-info">Impostazioni - Prossimamente</div>'; }
  };

  function resolve(){
    const hash = location.hash.replace(/^#\/?/, '');
    const route = routes[hash] ? hash : (hash.split('/')[0] || '');
    console.log('[DEBUG] Router.resolve -> route:', route);
    
    // show/hide dashboard depending on route
    const dashboardRoot = document.getElementById('dashboard-root');
    const appRoot = document.getElementById('app-root');
    
    if(dashboardRoot) {
      if(route === '') {
        // Return to dashboard - always refresh it with latest data
        dashboardRoot.style.display = '';
        if(appRoot) appRoot.innerHTML = '';
        
        // Re-render dashboard content with fresh data
        if(window.AppTornei) {
          (async () => {
            try {
              if(AppTornei.renderHomePreview) await AppTornei.renderHomePreview();
              if(AppTornei.renderStatsAndDashboard) await AppTornei.renderStatsAndDashboard();
            } catch(e) {
              console.error('Dashboard refresh error:', e);
            }
          })();
        }
      } else {
        // Navigate away from dashboard - hide it
        dashboardRoot.style.display = 'none';
      }
    }

    if(routes[route]) routes[route]();
    highlightNav(route);
  }

  function highlightNav(route){
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    const el = document.querySelector(`.nav-link[href$='${route}']`);
    if(el) el.classList.add('active');
  }

  // clicking the brand should return to the static home (restore initial HTML)
  document.addEventListener('DOMContentLoaded', ()=>{
    const brand = document.querySelector('.navbar-brand');
    if(brand){
      brand.addEventListener('click', (ev)=>{
        ev.preventDefault();
        location.hash = '#/';
        // resolve will restore initialHome because route '' maps to restoring logic
        resolve();
      });
    }
  });

  return { 
    init(){ 
      window.addEventListener('hashchange', resolve); 
      resolve(); 
    },
    navigate(route) {
      location.hash = '#/' + route;
    },
    getCurrentRoute() {
      return location.hash.replace(/^#\/?/, '').split('/')[0] || '';
    }
  };
})();

// Export to global scope
window.Router = Router;

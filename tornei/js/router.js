const Router = (function(){
  // preserve the initial home HTML so we can restore it when user clicks brand/home
  const rootEl = document.getElementById('app-root');
  const initialHome = rootEl ? rootEl.innerHTML : '';

  const routes = {
    // restore the original hero/home when hash is empty
    '': async () => {
      const dashboardRoot = document.getElementById('dashboard-root');
      if(dashboardRoot) dashboardRoot.innerHTML = `
        <section class="hero mud-paper mb-4">
          <div class="hero-content">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h1 class="display-6">Dashboard Tornei Pro</h1>
                <p class="lead">Gestisci i tuoi tornei sportivi in modo professionale</p>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <a class="btn btn-outline-light" href="#/tornei/nuovo"><i class="fa-solid fa-plus me-2"></i> Crea nuovo torneo</a>
                <a class="btn btn-light" href="#/tornei"><i class="fa-solid fa-eye me-2"></i> Visualizza tutti</a>
                <button id="export-dashboard-pdf" class="btn btn-outline-light ms-2"><i class="fa-solid fa-file-pdf me-1"></i> Esporta PDF</button>
              </div>
            </div>
            <div class="hero-stats mt-4">
              <div class="stat-card"><div class="num" id="stat-total">0</div><div class="label">Tornei Totali</div></div>
              <div class="stat-card"><div class="num" id="stat-active">0</div><div class="label">In Corso</div></div>
              <div class="stat-card"><div class="num" id="stat-prep">0</div><div class="label">In Preparazione</div></div>
              <div class="stat-card"><div class="num" id="stat-done">0</div><div class="label">Completati</div></div>
            </div>
          </div>
          <div class="hero-visual d-none d-md-block" id="hero-next-match" style="display:none"></div>
        </section>
        <section class="mb-4">
          <div class="mud-paper">
            <div class="d-flex justify-content-between align-items-center header-compact mb-3">
              <div>
                <h3>I Miei Tornei</h3>
                <div class="small text-muted">Visualizza e gestisci tutti i tuoi tornei</div>
              </div>
              <div>
                <a class="btn btn-primary btn-sm" href="#/tornei/nuovo"><i class="fa-solid fa-plus me-1"></i> NUOVO TORNEO</a>
              </div>
            </div>
            <div id="dashboard-cards" class="cards-grid mb-3" aria-live="polite"></div>
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Sport</th>
                    <th>Squadre</th>
                    <th>Data Inizio</th>
                    <th>Stato</th>
                    <th style="width:140px">Azioni</th>
                  </tr>
                </thead>
                <tbody id="dashboard-tornei-body">
                  <tr class="empty-row"><td colspan="6" class="text-muted text-center py-4">Nessun torneo presente — crea il primo torneo.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `;
      console.log('[DEBUG] Router home route triggered');
      if(window.AppTornei){
        if(AppTornei.renderHomePreview) await AppTornei.renderHomePreview();
        if(AppTornei.renderDashboardCards) await AppTornei.renderDashboardCards();
        if(AppTornei.renderStatsAndDashboard) await AppTornei.renderStatsAndDashboard();
      }
    },
    'tornei': () => AppTornei.renderList(),
    'tornei/nuovo': () => AppTornei.renderCreate(),
    'offline': () => OfflineUI.render(),
    'giocatori': () => AppGiocatori.render(),
    'statistiche': () => AppStatistics.render(),
    'admin': () => AdminPanel.render(),
    // application pages
    'squadre': () => SquadreUI.render(),
    'giornate': () => GiornateUI.renderList(),
    'classifica': () => ClassificaUI.render(),
    'classifiche': () => ClassificaUI.render(),
    'report': () => { document.getElementById('app-root').innerHTML = '<div class="alert alert-info">Report - Prossimamente</div>'; },
    'impostazioni': () => { document.getElementById('app-root').innerHTML = '<div class="alert alert-info">Impostazioni - Prossimamente</div>'; }
  };

  function resolve(){
    const hash = location.hash.replace(/^#\/?/, '');
    const route = routes[hash] ? hash : (hash.split('/')[0] || '');
    console.log('[DEBUG] Router.resolve -> route:', route);
    // show/hide dashboard depending on route
    const dashboardRoot = document.getElementById('dashboard-root');
    const appRoot = document.getElementById('app-root');
    if(dashboardRoot){
      console.log('[DEBUG] dashboardRoot before change ->', { display: dashboardRoot.style.display, childCount: dashboardRoot.children.length });
      if(route === ''){
        // clear any page content so dashboard is the only thing shown
        if(appRoot) appRoot.innerHTML = '';
        dashboardRoot.style.display = '';
      } else {
        // ensure dashboard is hidden and cleared when navigating away
        dashboardRoot.style.display = 'none';
        dashboardRoot.innerHTML = '';
      }
      console.log('[DEBUG] dashboardRoot after change ->', { display: dashboardRoot.style.display, childCount: dashboardRoot.children.length });
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

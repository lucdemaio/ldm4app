const SquadreUI = (function(){
  const root = document.getElementById('app-root');

  function tplList(squadre){
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">Squadre <span class="badge-muted ms-2">${squadre.length}</span></h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" id="nuova-squadra">Nuova Squadra</button>
          <button id="export-pdf-squadre" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-file-pdf me-1"></i> Esporta PDF</button>
        </div>
      </div>
      <div class="card mud-paper">
        <div class="card-body p-0">
          <table class="table table-hover table-fixed mb-0">
            <thead class="table-light"><tr><th>Nome</th><th>Città</th><th>Torneo</th><th></th></tr></thead>
            <tbody>
              ${squadre.length===0? '<tr><td colspan="4" class="empty-state">Nessuna squadra ancora — crea una nuova squadra</td></tr>' : squadre.map(s => `<tr><td>${escapeHtml(s.nome)}</td><td>${escapeHtml(s.citta||'')}</td><td>${escapeHtml(s.torneoNome||'')}</td><td class="text-end"><button class="btn btn-icon btn-sm btn-outline-primary me-2" data-id="${s.id}" data-action="edit" title="Modifica"><i class="fa-solid fa-pen"></i></button><button class="btn btn-icon btn-sm btn-outline-danger" data-id="${s.id}" data-action="delete" title="Elimina"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tplForm(s, tornei){
    s = s || { nome: '', citta: '', torneoId: '' };
    const options = ['<option value="">-- Nessuno --</option>'].concat(tornei.map(t=>`<option value="${t.id}" ${t.id===s.torneoId? 'selected':''}>${escapeHtml(t.nome)}</option>`)).join('');
    return `
      <div class="card mud-paper">
        <div class="card-body">
          <h4>${s.id ? 'Modifica Squadra' : 'Nuova Squadra'}</h4>
          <form id="form-squadra">
            <div class="mb-3">
              <label class="form-label form-required">Nome squadra</label>
              <input type="text" class="form-control" name="nome" value="${escapeHtml(s.nome)}" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Città</label>
              <input type="text" class="form-control" name="citta" value="${escapeHtml(s.citta||'')}" />
            </div>
            <div class="mb-3">
              <label class="form-label">Torneo associato</label>
              <select class="form-select" name="torneoId">${options}</select>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary" type="submit">Salva</button>
              <a class="btn btn-secondary" href="#/squadre">Annulla</a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  async function renderList(){    // hide dashboard when showing other pages
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }    const squadre = await SquadreStore.list();
    root.innerHTML = tplList(squadre);
    document.getElementById('nuova-squadra').addEventListener('click', ()=> renderCreate());
    root.querySelectorAll('button[data-action="delete"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      if(!confirm('Eliminare la squadra?')) return;
      await SquadreStore.remove(id);
      if(window.AppTornei){ await AppTornei.renderDashboardCards(); await AppTornei.renderStatsAndDashboard(); }
      renderList();
    }));
    root.querySelectorAll('button[data-action="edit"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = await SquadreStore.get(id);
      renderEdit(s);
    }));

    const expBtn = document.getElementById('export-pdf-squadre');
    if(expBtn) expBtn.addEventListener('click', async ()=>{ try{ await ExportTools.exportElementToPdf(root, 'squadre.pdf'); }catch(err){ alert('Esportazione fallita: '+err.message); } });
  }

  async function renderCreate(){
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    const tornei = await TorneiStore.list();
    root.innerHTML = tplForm(null, tornei);
    bindForm();
  }

  async function renderEdit(s){
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    const tornei = await TorneiStore.list();
    root.innerHTML = tplForm(s, tornei);
    bindForm(s.id);
  }

  function bindForm(id){
    const form = document.getElementById('form-squadra');
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const fd = new FormData(form);
      const obj = { id: id || undefined, nome: fd.get('nome'), citta: fd.get('citta'), torneoId: fd.get('torneoId') };
      try{
        // If associated torneo selected, attach torneoNome for easier display (denormalized)
        if(obj.torneoId){ const t = await TorneiStore.get(obj.torneoId); obj.torneoNome = t ? t.nome : ''; }
        await SquadreStore.save(obj);
        alert('Squadra salvata');
        if(window.AppTornei){ await AppTornei.renderDashboardCards(); await AppTornei.renderStatsAndDashboard(); }
        location.hash = '#/squadre';
      }catch(err){ alert('Errore salvataggio: '+err.message); }
    });
  }

  return { render: renderList };
})();
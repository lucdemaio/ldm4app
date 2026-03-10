const GiornateUI = (function(){
  const root = document.getElementById('app-root');

  // Helper function to download JSON
  function downloadJSON(obj, filename){ 
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = filename; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url); 
  }

  // Modal per inserire risultato partita
  async function showResultModal(giornataId, partitaIdx){
    const giornata = await IDB.get('giornate', giornataId);
    const partita = giornata.partite[partitaIdx];
    if(!partita) return alert('Partita non trovata');

    // Creiamo il modale
    let modal = document.getElementById('result-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'result-modal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      document.body.appendChild(modal);
    }

    const resultsList = (partita.games || []).map((g, idx) => 
      `<div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
        <span>${partita.casaNome} <strong>${g.golCasa}-${g.golTrasferta}</strong> ${partita.trasfertaNome}</span>
        <button type="button" class="btn btn-sm btn-outline-danger" data-delete-idx="${idx}">Elimina</button>
      </div>`
    ).join('');

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Risultato: ${escapeHtml(partita.casaNome)} vs ${escapeHtml(partita.trasfertaNome)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="result-form" class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Gol ${partita.casaNome}</label>
                <input type="number" name="golCasa" class="form-control" min="0" value="0" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Gol ${partita.trasfertaNome}</label>
                <input type="number" name="golTrasferta" class="form-control" min="0" value="0" required />
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button type="submit" class="btn btn-primary w-100">Aggiungi Gara</button>
              </div>
            </form>
            <hr/>
            <h6 class="mt-3">Gare registrate:</h6>
            <div id="games-list">${resultsList || '<p class="text-muted">Nessuna gara registrata</p>'}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
          </div>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Form submit
    document.getElementById('result-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(document.getElementById('result-form'));
      const gara = { golCasa: parseInt(fd.get('golCasa')), golTrasferta: parseInt(fd.get('golTrasferta')) };
      
      partita.games = partita.games || [];
      partita.games.push(gara);
      
      // Aggiorna stato della serie
      const casaVitte = partita.games.filter(g => g.golCasa > g.golTrasferta).length;
      const trasfertaVitte = partita.games.filter(g => g.golCasa < g.golTrasferta).length;
      partita.seriesScore = `${casaVitte}-${trasfertaVitte}`;
      
      if(partita.bestOf){
        const winnersNeeded = Math.floor(partita.bestOf / 2) + 1;
        if(casaVitte >= winnersNeeded) partita.seriesWinner = 'casa';
        else if(trasfertaVitte >= winnersNeeded) partita.seriesWinner = 'trasferta';
      }

      await IDB.put('giornate', giornata);
      
      // Aggiorna lista risultati
      const newList = (partita.games || []).map((g, idx) => 
        `<div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
          <span>${partita.casaNome} <strong>${g.golCasa}-${g.golTrasferta}</strong> ${partita.trasfertaNome}</span>
          <button type="button" class="btn btn-sm btn-outline-danger" data-delete-idx="${idx}">Elimina</button>
        </div>`
      ).join('');
      document.getElementById('games-list').innerHTML = newList;
      document.getElementById('result-form').reset();

      // Re-attach delete listeners
      document.getElementById('games-list').querySelectorAll('[data-delete-idx]').forEach(btn => {
        btn.addEventListener('click', async e => {
          const idx = Number(e.target.dataset.deleteIdx);
          if(!confirm('Eliminare questa gara?')) return;
          partita.games.splice(idx, 1);
          await IDB.put('giornate', giornata);
          showResultModal(giornataId, partitaIdx); // Ricarica modale
        });
      });
    });

    // Delete listeners
    document.getElementById('games-list').querySelectorAll('[data-delete-idx]').forEach(btn => {
      btn.addEventListener('click', async e => {
        const idx = Number(e.target.dataset.deleteIdx);
        if(!confirm('Eliminare questa gara?')) return;
        partita.games.splice(idx, 1);
        await IDB.put('giornate', giornata);
        showResultModal(giornataId, partitaIdx); // Ricarica modale
      });
    });
  }

  function tplList(giornate, tornei){
    const torneoOptions = ['<option value="">-- Filtra per torneo --</option>'].concat(tornei.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`)).join('');
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">Giornate <span class="badge-muted ms-2">${giornate.length}</span></h3>
        <div class="d-flex gap-2 align-items-center">
          <select id="filter-torneo" class="form-select form-select-sm me-2" style="min-width:220px">${torneoOptions}</select>
          <button class="btn btn-outline-secondary" id="export-all"><i class="fa-solid fa-download me-1"></i>Esporta</button>
          <button id="export-pdf-giornate" class="btn btn-outline-secondary btn-sm ms-2"><i class="fa-solid fa-file-pdf me-1"></i> Esporta PDF</button>
          <label class="btn btn-outline-secondary mb-0 ms-2">
            <i class="fa-solid fa-upload me-1"></i>Importa<input id="file-import" type="file" accept="application/json" style="display:none" />
          </label>
          <button class="btn btn-primary" id="nuova-giornata"><i class="fa-solid fa-plus me-2"></i>Nuova Giornata</button>
        </div>
      </div>
      <div class="card mud-paper">
        <div class="card-body p-0">
          <table class="table table-hover table-fixed mb-0">
            <thead class="table-light"><tr><th style="width:20%">Torneo</th><th style="width:20%">Giornata</th><th style="width:20%">Data</th><th style="width:30%">Partite</th><th style="width:10%"></th></tr></thead>
            <tbody>
              ${giornate.length===0? '<tr><td colspan="5" class="empty-state">Nessuna giornata creata — aggiungi la prima</td></tr>' : giornate.map(g => `<tr data-torneo="${g.torneoId}"><td>${escapeHtml(g.torneoNome||'--')}</td><td>Giornata ${g.numero}</td><td>${g.data||''}</td><td>${(g.partite||[]).map(p=>`${escapeHtml(p.casaNome||'')} ${p.golCasa!=null? p.golCasa + ' - ' + p.golTrasferta : 'vs'} ${escapeHtml(p.trasfertaNome||'')}`).join('<br/>')}</td><td class="text-end"><button class="btn btn-icon btn-sm btn-outline-primary" data-id="${g.id}" data-action="edit" title="Modifica"><i class="fa-solid fa-pen"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tplForm(g, tornei){
    g = g || { numero: '', data: '', descrizione: '', torneoId: '' };
    const topts = ['<option value="">-- Seleziona torneo --</option>'].concat(tornei.map(t=>`<option value="${t.id}" ${t.id===g.torneoId? 'selected':''}>${escapeHtml(t.nome)}</option>`)).join('');
    return `
      <div class="card mud-paper">
        <div class="card-body">
          <h4>${g.id ? 'Modifica Giornata' : 'Nuova Giornata'}</h4>
          <form id="form-giornata">
            <div class="row">
              <div class="col-md-3 mb-3"><label class="form-label">Numero</label><input name="numero" class="form-control" required value="${g.numero||''}"/></div>
              <div class="col-md-3 mb-3"><label class="form-label">Data</label><input type="date" name="data" class="form-control" value="${g.data||''}"/></div>
              <div class="col-md-6 mb-3"><label class="form-label">Torneo</label><select name="torneoId" class="form-select">${topts}</select></div>
            </div>
            <div class="mb-3"><label class="form-label">Descrizione</label><input name="descrizione" class="form-control" value="${escapeHtml(g.descrizione||'')}"/></div>
            <div class="d-flex gap-2"><button class="btn btn-primary" type="submit">Salva giornata</button><a class="btn btn-outline-secondary" href="#/giornate">Annulla</a></div>
          </form>
        </div>
      </div>
    `;
  }

  function tplPartite(g){
    const partite = g.partite || [];
    return `
      <div class="card mud-paper mt-3">
        <div class="card-body">
          <h5>Partite - Giornata ${g.numero}</h5>
          <form id="form-partita" class="row g-2 align-items-end">
            <div class="col-md-3"><label class="form-label">Casa</label><select class="form-select" name="casaId"></select></div>
            <div class="col-md-3"><label class="form-label">Trasferta</label><select class="form-select" name="trasfertaId"></select></div>
            <div class="col-md-2"><label class="form-label">Ora</label><input name="ora" class="form-control" placeholder="HH:MM"/></div>
            <div class="col-md-2"><label class="form-label">Campo</label><input name="campo" class="form-control"/></div>
            <div class="col-md-2"><button class="btn btn-primary w-100" type="submit">Aggiungi partita</button></div>
          </form>

          <hr/>
          <div id="partite-list">
            ${partite.length===0? '<div class="empty-state">Nessuna partita per questa giornata</div>' : partite.map((p,idx)=>{
              const seriesInfo = (p.games && p.games.length)? (function(){ const wins = p.games.reduce((acc,g)=>{ if(g.golCasa>g.golTrasferta) acc.c++; else if(g.golCasa<g.golTrasferta) acc.t++; return acc; }, {c:0,t:0}); return `<small class="text-muted ms-2">Serie: ${wins.c}-${wins.t}${p.seriesWinner? ' • Winner: ' + (p.seriesWinner==='casa'? p.casaNome : p.trasfertaNome) : ''}</small>`; })() : '';
              const stageBadge = p.stage? `<span class="badge bg-info text-dark ms-2">${p.stage}</span>` : '';
              return `<div class="d-flex align-items-center mb-2" data-idx="${idx}"><div class="me-3" style="min-width:220px">${escapeHtml(p.casaNome)} <strong>${p.golCasa!=null? p.golCasa + ' - ' + p.golTrasferta : 'vs'}</strong> ${escapeHtml(p.trasfertaNome)} ${p.bestOf? '<span class="badge bg-secondary ms-2">best-of-' + p.bestOf + '</span>' : ''}${stageBadge}${seriesInfo}</div><div class="me-2"><button class="btn btn-sm btn-outline-primary me-2" data-action="edit-result">Inserisci Risultato</button><button class="btn btn-sm btn-outline-secondary me-2" data-action="reset-series">Reset serie</button><button class="btn btn-sm btn-outline-danger" data-action="delete-game">Elimina</button></div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  async function renderList(){
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    const [giornate, tornei] = await Promise.all([ IDB.getAll('giornate'), TorneiStore.list() ]);
    root.innerHTML = tplList(giornate, tornei);
    document.getElementById('nuova-giornata').addEventListener('click', ()=> renderCreate());
    const expPdf = document.getElementById('export-pdf-giornate');
    if(expPdf) expPdf.addEventListener('click', async ()=>{ try{ await ExportTools.exportElementToPdf(root, 'giornate.pdf'); }catch(err){ alert('Esportazione PDF fallita: '+err.message); } });
    document.getElementById('filter-torneo').addEventListener('change', e => filterByTorneo(e.target.value));
    document.getElementById('export-all').addEventListener('click', async ()=>{ const data = await window.ExportImport.exportAll(); downloadJSON(data, 'gestionale-tornei-export.json'); });
    document.getElementById('file-import').addEventListener('change', async (ev)=>{ const f = ev.target.files[0]; if(!f) return; const txt = await f.text(); try{ const json = JSON.parse(txt); await window.ExportImport.importAll(json); alert('Import completato'); renderList(); }catch(err){ alert('Import fallito: '+err.message); } });
    root.querySelectorAll('button[data-action="edit"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id; const g = await IDB.get('giornate', id); renderEdit(g);
    }));
  }

  function filterByTorneo(tid){ document.querySelectorAll('tbody tr').forEach(tr => { if(!tid) { tr.style.display=''; return;} tr.style.display = (tr.dataset.torneo === tid) ? '' : 'none'; }); }

  async function renderCreate(){ const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; } const tornei = await TorneiStore.list(); root.innerHTML = tplForm(null, tornei); bindForm(); }
  async function renderEdit(g){ const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; } const tornei = await TorneiStore.list(); root.innerHTML = tplForm(g, tornei); bindForm(g.id); root.innerHTML += tplPartite(g); bindPartite(g); }

  function bindForm(id){
    const form = document.getElementById('form-giornata');
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(form);
      const obj = { id: id || undefined, numero: fd.get('numero'), data: fd.get('data'), descrizione: fd.get('descrizione'), torneoId: fd.get('torneoId') };
      // ensure object has a valid key for the store's keyPath ('id') to avoid IndexedDB DataError
      obj.id = obj.id || makeId('giornata');
      if(obj.torneoId){ const t = await TorneiStore.get(obj.torneoId); obj.torneoNome = t ? t.nome : ''; }
      obj.partite = id ? (await IDB.get('giornate', id)).partite || [] : (obj.partite || []);
      await IDB.put('giornate', obj);
      alert('Giornata salvata'); location.hash = '#/giornate';
    });

  }

  async function bindPartite(g){
    const form = document.getElementById('form-partita');
    const casaSel = form.querySelector('[name=casaId]');
    const trasSel = form.querySelector('[name=trasfertaId]');
    const tornei = await TorneiStore.list();
    const squadre = await SquadreStore.list();
    const elenco = squadre.filter(s => s.torneoId === g.torneoId);
    casaSel.innerHTML = '<option value="">-- Seleziona --</option>' + elenco.map(s=>`<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    trasSel.innerHTML = casaSel.innerHTML;

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(form);
      const casa = await SquadreStore.get(fd.get('casaId'));
      const tras = await SquadreStore.get(fd.get('trasfertaId'));
      if(!casa || !tras) return alert('Seleziona entrambe le squadre');
      if(casa.id === tras.id) return alert('Le squadre devono essere diverse');
      const partita = { casaId: casa.id, trasfertaId: tras.id, casaNome: casa.nome, trasfertaNome: tras.nome, ora: fd.get('ora'), campo: fd.get('campo') };
      const existing = await IDB.get('giornate', g.id);
      existing.partite = existing.partite || [];
      existing.partite.push(partita);
      await IDB.put('giornate', existing);
      renderEdit(existing);
    });

    // --- drag & drop for partita ordering
    let dragSrcIdx = null;
    document.getElementById('partite-list').addEventListener('dragstart', e => {
      const row = e.target.closest('[data-idx]'); if(!row) return; dragSrcIdx = Number(row.dataset.idx); row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
    });
    document.getElementById('partite-list').addEventListener('dragend', e => { document.querySelectorAll('[data-idx]').forEach(r=>r.classList.remove('dragging')); dragSrcIdx = null; });
    document.getElementById('partite-list').addEventListener('dragover', e => { e.preventDefault(); const tr = e.target.closest('[data-idx]'); if(!tr) return; tr.classList.add('drag-over'); });
    document.getElementById('partite-list').addEventListener('dragleave', e => { const tr = e.target.closest('[data-idx]'); if(tr) tr.classList.remove('drag-over'); });
    document.getElementById('partite-list').addEventListener('drop', async e => {
      e.preventDefault(); const tr = e.target.closest('[data-idx]'); if(!tr) return; const destIdx = Number(tr.dataset.idx); if(dragSrcIdx==null || destIdx===dragSrcIdx) return; const stored = await IDB.get('giornate', g.id); const p = stored.partite.splice(dragSrcIdx,1)[0]; stored.partite.splice(destIdx,0,p); await IDB.put('giornate', stored); renderEdit(stored); });


    document.getElementById('partite-list').addEventListener('click', async e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if(!action) return;
      const idx = Number(e.target.closest('[data-idx]')?.dataset.idx);
      const stored = await IDB.get('giornate', g.id);
      if(action === 'delete-game'){
        if(!confirm('Eliminare la partita?')) return;
        stored.partite.splice(idx,1);
        await IDB.put('giornate', stored);
        renderEdit(stored);

      } else if(action === 'reset-series'){
        const p = stored.partite[idx];
        if(!p || !p.games || p.games.length===0) return alert('Nessuna serie da resettare');
        if(!confirm('Resettare la serie (rimuovere tutte le gare)?')) return;
        p.games = [];
        delete p.seriesWinner; delete p.seriesScore;
        await IDB.put('giornate', stored);
        renderEdit(stored);

      } else if(action === 'edit-result'){
        // open modal editor for results / series
        showResultModal(g.id, idx);
      }
    });
  }

  return { renderList, renderCreate, renderEdit };
})();
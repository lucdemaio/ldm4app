const AppTornei = (function(){
  const dashboardRoot = document.getElementById('dashboard-root');
  const appRoot = document.getElementById('app-root');

  function tplList(tornei){
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">Tornei <span class="badge-muted ms-2">${tornei.length}</span></h3>
        <div class="d-flex gap-2">
          <a class="btn btn-outline-secondary" href="#/tornei">Aggiorna</a>
          <button id="export-pdf-tornei" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-file-pdf me-1"></i> Esporta PDF</button>
          <a class="btn btn-primary" href="#/tornei/nuovo"><i class="fa-solid fa-plus me-2"></i>Nuovo Torneo</a>
        </div>
      </div>
      <div class="card mud-paper">
        <div class="card-body p-0">
          <table class="table table-hover table-fixed mb-0">
            <thead class="table-light"><tr><th style="width:40%">Nome</th><th style="width:18%">Sport / Formato</th><th style="width:22%">Data Inizio</th><th style="width:10%">Giornate</th><th style="width:10%"></th></tr></thead>
            <tbody>
              ${tornei.length===0 ? '<tr><td colspan="5" class="empty-state">Nessun torneo trovato — crea il primo torneo con <strong>Nuovo Torneo</strong></td></tr>' : tornei.map(t => `<tr data-id="${t.id}"><td>${escapeHtml(t.nome)}</td><td class="small text-muted">${escapeHtml(t.sport||'--')} • ${escapeHtml(t.formato||'--')}</td><td>${t.dataInizio||''}</td><td class="text-center">${/* count giornate */ ''}</td><td class="text-end"><button class="btn btn-icon btn-sm btn-outline-primary me-2" title="Apri" data-id="${t.id}" data-action="edit"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-outline-success me-2" title="Genera calendario" data-id="${t.id}" data-action="autogen"><i class="fa-solid fa-gear"></i></button> <button class="btn btn-sm btn-outline-info me-2" title="Locandina" data-id="${t.id}" data-action="poster"><i class="fa-solid fa-image"></i></button> <button class="btn btn-icon btn-sm btn-outline-danger" title="Elimina" data-id="${t.id}" data-action="delete"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tplCreate(t){
    t = t || { nome: '', dataInizio: '', dataFine: '', sport: 'calcio', formato: 'girone' };
    return `
      <div class="card mud-paper">
        <div class="card-body">
          <h4>${t.id ? 'Modifica Torneo' : 'Nuovo Torneo'}</h4>
          <form id="form-torneo">
            <div class="mb-3">
              <label class="form-label form-required">Nome torneo</label>
              <input type="text" class="form-control" name="nome" value="${escapeHtml(t.nome)}" required />
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Sport</label>
                <select class="form-select" name="sport">
                  <option value="calcio" ${t.sport==='calcio'? 'selected':''}>Calcio</option>
                  <option value="basket" ${t.sport==='basket'? 'selected':''}>Basket</option>
                  <option value="pallavolo" ${t.sport==='pallavolo'? 'selected':''}>Pallavolo</option>
                  <option value="tennis" ${t.sport==='tennis'? 'selected':''}>Tennis (sing.)</option>
                  <option value="altro" ${t.sport==='altro'? 'selected':''}>Altro</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Formato</label>
                <select class="form-select" name="formato">
                  <option value="girone" ${t.formato==='girone'? 'selected':''}>Girone all'italiana</option>
                  <option value="playoff" ${t.formato==='playoff'? 'selected':''}>Playoff</option>
                  <option value="misto" ${t.formato==='misto'? 'selected':''}>Misto (gironi + playoff)</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Numero squadre</label>
                <input type="number" min="2" max="64" class="form-control" name="numSquadre" value="${t.numSquadre||8}" />
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Numero gruppi</label>
                <input type="number" min="1" max="16" class="form-control" name="numGroups" value="${t.numGroups||1}" />
                <div class="form-text">Dividi le squadre in N gironi (1 = unico girone)</div>
              </div>
              <div class="col-md-4 mb-3 form-check-group">
                <label class="form-label">Andata / Ritorno</label>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="andata-ritorno" name="andataRitorno" ${t.andataRitorno? 'checked':''}>
                  <label class="form-check-label" for="andata-ritorno">Partite andata + ritorno</label>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Qualificano (top N)</label>
                <input type="number" min="1" max="16" class="form-control" name="qualifyTop" value="${t.qualifyTop||2}" />
                <div class="form-text">Numero di squadre per girone che passano ai playoff (solo per formato misto)</div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Elenco squadre (una per riga) — facoltativo</label>
              <textarea class="form-control" name="teamsList" rows="3" placeholder="Es: A.S.D. Aurora\nPolisportiva Blu"></textarea>
              <div class="form-text">Se lasci vuoto il sistema genera nomi generici (Team 1, Team 2...).</div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Playoff — formato serie (best‑of)</label>
                <select class="form-select" name="playoffBestOf">
                  <option value="1" ${t.playoffBestOf==1? 'selected':''}>Singola (1)</option>
                  <option value="3" ${t.playoffBestOf==3? 'selected':''}>Best of 3</option>
                  <option value="5" ${t.playoffBestOf==5? 'selected':''}>Best of 5</option>
                  <option value="7" ${t.playoffBestOf==7? 'selected':''}>Best of 7</option>
                </select>
                <div class="form-text">Alcuni sport (es. basket) usano serie; calcio generalmente singole.</div>
              </div>
              <div class="col-md-6 d-flex align-items-center">
                <div class="form-check ms-2">
                  <input class="form-check-input" type="checkbox" value="1" id="gen-calendar" name="genCalendar" checked>
                  <label class="form-check-label" for="gen-calendar">Genera automaticamente gironi e giornate</label>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-primary" type="submit">Salva e genera</button>
              <a class="btn btn-secondary" href="#/tornei">Annulla</a>
              <button type="button" id="preview-standings-btn" class="btn btn-outline-primary">Anteprima classifica</button>
            </div>
          </form>
          <div id="preview-standings" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  async function renderList(){
    // hide dashboard when showing tornei pages
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    const tornei = await TorneiStore.list();
    appRoot.innerHTML = tplList(tornei);
    // update number of giornate per torneo
    (async ()=>{
      const allG = await IDB.getAll('giornate');
      const counts = allG.reduce((acc,g)=>{ acc[g.torneoId] = (acc[g.torneoId]||0) + 1; return acc; }, {});
      appRoot.querySelectorAll('tr[data-id]').forEach(tr => { const id = tr.dataset.id; const cell = tr.querySelector('td:nth-child(4)'); if(cell) cell.textContent = counts[id] || 0; });
    })();

    appRoot.querySelectorAll('button[data-action="delete"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      if(!confirm('Eliminare il torneo?')) return;
      await TorneiStore.remove(id);
      renderList();
    }));
    // export PDF (page)
    const expBtn = document.getElementById('export-pdf-tornei');
    if(expBtn) expBtn.addEventListener('click', async ()=>{ try{ await ExportTools.exportElementToPdf(appRoot, 'tornei.pdf'); }catch(err){ alert('Esportazione fallita: '+err.message); } });
    appRoot.querySelectorAll('button[data-action="autogen"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const t = await TorneiStore.get(id);
      if(!t) return alert('Torneo non trovato');
      const formato = prompt('Formato (girone / playoff / misto)', t.formato || 'girone');
      if(!formato) return;
      const num = Number(prompt('Numero squadre (es. 8)', 8)) || 8;
      // generate placeholder team names
      const teams = [];
      for(let i=1;i<=num;i++) teams.push(`${t.nome} - Team ${i}`);
      if(!confirm(`Generare calendario ${formato} con ${num} squadre per il torneo "${t.nome}"?`)) return;
      await generateTournamentSchedule(t, teams, formato);
      alert('Calendario generato');
      renderList();
    }));

    appRoot.querySelectorAll('button[data-action="edit"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const t = await TorneiStore.get(id);
      renderEdit(t);
    }));
    // poster button in list
    appRoot.querySelectorAll('button[data-action="poster"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id; const t = await TorneiStore.get(id);
      try{ await ExportTools.generatePosterSvg({ title: t.nome, subtitle: (t.sport||'') + ' • ' + (t.formato||''), filename: (t.nome||'poster') + '.svg', qrUrl: 'https://www.ldm4app.com' }); }
      catch(err){ alert('Errore generazione locandina: '+err.message); }
    }));  }

  function renderEdit(t){
    // hide dashboard while editing/creating
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    appRoot.innerHTML = tplCreate(t);
    bindForm(t.id);
  }

  function renderCreate(){
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; console.log('[DEBUG] AppTornei.renderCreate hid dashboardRoot'); }
    appRoot.innerHTML = tplCreate();
    bindForm();
  }

  function bindForm(id){
    const form = document.getElementById('form-torneo');
    // preview standings button (shows teams + empty stats)
    const previewBtn = document.getElementById('preview-standings-btn');
    if(previewBtn){ previewBtn.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const fd = new FormData(form);
      const teamsText = (fd.get('teamsList') || '').trim();
      let teams = [];
      if(teamsText){ teams = teamsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
      const numSquadre = Number(fd.get('numSquadre')) || Math.max(2, teams.length || 8);
      if(teams.length === 0){ for(let i=1;i<=numSquadre;i++) teams.push(`Team ${i}`); }
      const rows = teams.map((name, idx) => ({ pos: idx+1, nome: name, played:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }));
      document.getElementById('preview-standings').innerHTML = `<div class="card mud-paper"><div class="card-body p-0"><table class="table mb-0"><thead class="table-light"><tr><th>#</th><th>Squadra</th><th>PG</th><th>V</th><th>P</th><th>S</th><th>GF</th><th>GS</th><th>DR</th><th>Pt</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.nome)}</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>`).join('')}</tbody></table></div></div>`;
    }); }

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const fd = new FormData(form);
      const obj = {
        id: id || undefined,
        nome: fd.get('nome'),
        dataInizio: fd.get('dataInizio'),
        dataFine: fd.get('dataFine'),
        sport: fd.get('sport'),
        formato: fd.get('formato'),
        numGroups: Number(fd.get('numGroups')) || 1,
        andataRitorno: !!fd.get('andataRitorno'),
        qualifyTop: Number(fd.get('qualifyTop')) || 2,
        playoffBestOf: Number(fd.get('playoffBestOf')) || (fd.get('sport') === 'basket' ? 5 : 1)
      };

      // collect teams: prefer explicit list, otherwise generate placeholders
      const teamsText = (fd.get('teamsList') || '').trim();
      let teams = [];
      if(teamsText){ teams = teamsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
      const numSquadre = Number(fd.get('numSquadre')) || Math.max(2, teams.length || 8);
      if(teams.length === 0){ for(let i=1;i<=numSquadre;i++) teams.push(`Team ${i}`); }

      const shouldGenerate = !!fd.get('genCalendar');

      try{
        await TorneiStore.save(obj);
        // TorneiStore.save ensures `obj.id` is set on the object; use `obj` when generating
        if(shouldGenerate){
          try {
            await generateTournamentSchedule(obj, teams, obj.formato || 'girone');
            alert('Torneo salvato e calendario generato');
            location.hash = '#/giornate';
            return;
          } catch(genErr) {
            alert('Torneo salvato ma errore nella generazione calendario: ' + genErr.message);
            location.hash = '#/tornei';
            return;
          }
        }

        // simulate remote save attempt -> if fails, add to offline queue
        try { await fakeServerSave(obj); alert('Torneo salvato'); location.hash = '#/tornei'; }
        catch(err){ await OfflineQueue.add({ method: 'POST', url: '/api/tornei', body: obj }); alert('Torneo salvato in modalità offline (no server)'); location.hash = '#/tornei'; }
      }catch(err){ alert('Errore salvataggio torneo: '+err.message); console.error('Save error:', err); }
    });
  }

  // --- schedule generator helpers -------------------------------------------------
  // generate round-robin pairings (circle method)
  function roundRobinPairs(teams, andataRitorno = false){
    const t = teams.slice();
    if(t.length % 2 === 1) t.push(null); // bye
    const n = t.length;
    const rounds = [];
    for(let r=0;r<n-1;r++){
      const pairs = [];
      for(let i=0;i<n/2;i++){
        const a = t[i];
        const b = t[n-1-i];
        if(a && b) pairs.push({ casaNome: a, trasfertaNome: b, casaId: null, trasfertaId: null });
      }
      rounds.push(pairs);
      // rotate (except first)
      t.splice(1,0,t.pop());
    }
    if(andataRitorno){
      // duplicate rounds with swapped home/away
      const rev = rounds.map(r => r.map(p => ({ casaNome: p.trasfertaNome, trasfertaNome: p.casaNome, casaId: p.trasfertaId, trasfertaId: p.casaId })));
      return rounds.concat(rev);
    }
    return rounds; // array of rounds with pairs
  }

  // create playoff rounds (single-elimination) returning array of matchdays (rounds)
  function playoffRounds(teams){
    // teams: array of names (seeded by order). Create bracket rounds until winner.
    let current = teams.slice();
    const rounds = [];
    while(current.length > 1){
      const pairs = [];
      for(let i=0;i<Math.floor(current.length/2);i++){
        const a = current[i];
        const b = current[current.length-1-i];
        pairs.push({ casaNome: a, trasfertaNome: b, casaId: null, trasfertaId: null });
      }
      rounds.push(pairs);
      // winners placeholder for next round
      const next = new Array(Math.ceil(current.length/2)).fill('Winner');
      current = next;
    }
    return rounds;
  }

  // main generator: save squads and giornate according to format
  async function generateTournamentSchedule(torneo, teams, formato){
    // create squadre entries with torneoId
    const savedTeams = [];
    for(const name of teams){
      const s = { nome: name, citta: '', torneoId: torneo.id, torneoNome: torneo.nome };
      await SquadreStore.save(s); // SquadreStore.save assigns s.id
      savedTeams.push(s);
    }

    // helper to persist a giornata
    async function saveGiornata(numero, partite){
      const g = { id: makeId('giornata'), torneoId: torneo.id, torneoNome: torneo.nome, numero, data: '', descrizione: '', partite };
      await IDB.put('giornate', g);
      return g;
    }

    // read tournament options from `torneo` (numGroups, andataRitorno, qualifyTop, playoffBestOf)
    const opt = { numGroups: torneo.numGroups || 1, andataRitorno: !!torneo.andataRitorno, qualifyTop: torneo.qualifyTop || 2, playoffBestOf: torneo.playoffBestOf || 1 };

    if(formato === 'girone'){
      // split into groups if requested
      const names = savedTeams.map(s => s.nome);
      const groups = [];
      const G = Math.max(1, Math.min(opt.numGroups, names.length));
      for(let i=0;i<G;i++) groups.push([]);
      names.forEach((n, idx) => groups[idx % G].push(n));

      let giornataIdx = 1;
      for(const grp of groups){
        const rounds = roundRobinPairs(grp, opt.andataRitorno);
        for(let r=0;r<rounds.length;r++){
          const partite = rounds[r].map(p => ({ casaNome: p.casaNome, trasfertaNome: p.trasfertaNome, casaId: (savedTeams.find(x=>x.nome===p.casaNome)||{}).id || null, trasfertaId: (savedTeams.find(x=>x.nome===p.trasfertaNome)||{}).id || null, stage: 'group' }));
          await saveGiornata(giornataIdx++, partite);
        }
      }
    }else if(formato === 'playoff'){
      const names = savedTeams.map(s => s.nome);
      const rounds = playoffRounds(names);
      let giornataIdx = 1;
      for(let i=0;i<rounds.length;i++){
        const partite = rounds[i].map(p => ({ casaNome: p.casaNome, trasfertaNome: p.trasfertaNome, casaId: (savedTeams.find(x=>x.nome===p.casaNome)||{}).id || null, trasfertaId: (savedTeams.find(x=>x.nome===p.trasfertaNome)||{}).id || null, bestOf: opt.playoffBestOf, stage: 'playoff', games: [] }));
        await saveGiornata(giornataIdx++, partite);
      }
    }else if(formato === 'misto'){
      // groups stage then playoff with qualification
      const names = savedTeams.map(s => s.nome);
      const G = Math.max(1, Math.min(opt.numGroups, names.length));
      const groups = Array.from({length:G}, ()=>[]);
      names.forEach((n,idx)=> groups[idx % G].push(n));

      let giornataIdx = 1;
      // group stage
      for(const grp of groups){
        const rounds = roundRobinPairs(grp, opt.andataRitorno);
        for(const r of rounds){
          const partite = r.map(p => ({ casaNome: p.casaNome, trasfertaNome: p.trasfertaNome, casaId: (savedTeams.find(x=>x.nome===p.casaNome)||{}).id || null, trasfertaId: (savedTeams.find(x=>x.nome===p.trasfertaNome)||{}).id || null, stage: 'group' }));
          await saveGiornata(giornataIdx++, partite);
        }
      }

      // determine qualifiers (top N in each group) — without standings we pick by list order
      const qualifiers = [];
      for(const grp of groups){
        for(let i=0;i<opt.qualifyTop && i<grp.length;i++) qualifiers.push(grp[i]);
      }

      // create playoff bracket from qualifiers
      const playoff = playoffRounds(qualifiers);
      for(let i=0;i<playoff.length;i++){
        const partite = playoff[i].map(p => ({ casaNome: p.casaNome, trasfertaNome: p.trasfertaNome, casaId: (savedTeams.find(x=>x.nome===p.casaNome)||{}).id || null, trasfertaId: (savedTeams.find(x=>x.nome===p.trasfertaNome)||{}).id || null, bestOf: opt.playoffBestOf }));
        await saveGiornata(giornataIdx++, partite);
      }
    }

    return true;
  }

  // fake server call (throws to simulate unreachable server)
  async function fakeServerSave(obj){
    // NOTE: development static server (python/http.server) does not accept POST and returns 404/501.
    // Avoid making real network requests while developing locally to prevent console errors.
    // Set `window.USE_REMOTE_API = true` to enable real API calls in a different environment.
    if(!window.USE_REMOTE_API || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:'){
      // simulate unreachable remote so the app falls back to offline queue without issuing a network POST
      return Promise.reject(new Error('no-remote-api'));
    }

    // production / remote API attempt
    try{
      const res = await fetch('/tornei/api/tornei', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) });
      if(!res.ok) throw new Error('server-error');
      return res.json();
    }catch(e){ throw e; }
  }

  async function renderHomePreview(){
    const root = document.getElementById('home-preview');
    const tornei = await TorneiStore.list();
    const recent = (tornei || []).slice(-3).reverse();

    // if there is a dedicated home-preview container, populate it; otherwise skip that part
    if(root){
      if(recent.length === 0){ const emptyEl = document.getElementById('home-preview-empty'); if(emptyEl) emptyEl.style.display = ''; root.querySelectorAll('.card-item.dynamic').forEach(n=>n.remove());
        // hide hero next match when no data
        const hero = document.getElementById('hero-next-match'); if(hero) hero.style.display = 'none';
        // continue — we still want to update hero stats and dashboard table below
      } else {
        // hide empty message
        const emptyEl = document.getElementById('home-preview-empty'); if(emptyEl) emptyEl.style.display = 'none';
        // remove previous dynamic cards
        root.querySelectorAll('.card-item.dynamic').forEach(n=>n.remove());
        for(const t of recent){
          const el = document.createElement('article'); el.className = 'mud-paper card-item dynamic';
          el.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="mb-0">${escapeHtml(t.nome)}</h5>
              <small class="text-muted">${escapeHtml(t.formato||'')}</small>
            </div>
            <div class="small text-muted mb-2">${escapeHtml(t.sport||'')}</div>
            <div class="d-flex gap-2">
              <a class="btn btn-sm btn-outline-primary" href="#/tornei" data-action="open-torneo" data-id="${t.id}">Dettagli</a>
              <a class="btn btn-sm btn-primary" href="#/classifica" data-action="open-classifica" data-id="${t.id}">Classifica</a>
              <button class="btn btn-sm btn-outline-info" data-action="poster" data-id="${t.id}" title="Genera locandina"><i class="fa-solid fa-image"></i></button>
            </div>
          `;
          root.appendChild(el);
          const posterBtnDyn = el.querySelector('[data-action="poster"]');
          if(posterBtnDyn){ posterBtnDyn.addEventListener('click', async (ev)=>{ const id = ev.currentTarget.dataset.id; const t = await TorneiStore.get(id); try{ await ExportTools.generatePosterSvg({ title: t.nome, subtitle: (t.sport||'') + ' • ' + (t.formato||''), filename: (t.nome||'poster') + '.svg', qrUrl: 'https://www.ldm4app.com' }); }catch(err){ alert('Errore generazione locandina: '+err.message); } }); }
        }
      }
    }

    // also update hero 'next match' from giornate if available
    await renderHeroNextMatch();

    // update hero statistics (totali / in corso / in preparazione / completati)
    try{
      const allTornei = await TorneiStore.list();
      const allGiornate = await IDB.getAll('giornate');
      const stats = { total: allTornei.length, inCorso: 0, inPreparazione: 0, completati: 0 };
      for(const t of allTornei){
        const gs = allGiornate.filter(g => g.torneoId === t.id);
        const matches = gs.flatMap(g => (g.partite||[]));
        const anyResult = matches.some(p => p.golCasa!=null || (p.games && p.games.length>0 && p.games.some(g=>g.golCasa!=null)));
        const allHaveResult = matches.length>0 && matches.every(p => (p.golCasa!=null) || (p.games && p.games.length>0 && p.games.every(gm=>gm.golCasa!=null)));
        if(allHaveResult) stats.completati++; else if(anyResult) stats.inCorso++; else stats.inPreparazione++;
      }
      const hero = document.querySelector('.hero');
      if(hero){
        let statsRow = hero.querySelector('.hero-stats');
        if(!statsRow){ statsRow = document.createElement('div'); statsRow.className = 'hero-stats'; hero.querySelector('.hero-content').appendChild(statsRow); }
        statsRow.innerHTML = `
          <div class="stat-card"><div class="num">${stats.total}</div><div class="label">Tornei Totali</div></div>
          <div class="stat-card"><div class="num">${stats.inCorso}</div><div class="label">In Corso</div></div>
          <div class="stat-card"><div class="num">${stats.inPreparazione}</div><div class="label">In Preparazione</div></div>
          <div class="stat-card"><div class="num">${stats.completati}</div><div class="label">Completati</div></div>
        `;
      }

      // populate dashboard table (non-intrusive, only visual)
      const tbody = document.getElementById('dashboard-tornei-body');
      const allSquadre = await SquadreStore.list();
      if(tbody){
        tbody.innerHTML = '';
        if(allTornei.length === 0){
          tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-muted text-center py-4">Nessun torneo presente — crea il primo torneo.</td></tr>';
        } else {
          for(const t of allTornei){
            const teamCount = allSquadre.filter(s => s.torneoId === t.id).length;
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${escapeHtml(t.nome||'—')}</strong><div class="small text-muted">${escapeHtml(t.formato||'')}</div></td>
              <td class="small text-muted">${escapeHtml(t.sport||'—')}</td>
              <td class="small text-muted">${teamCount} squadre</td>
              <td class="small text-muted">${t.dataInizio||''}</td>
              <td><span class="badge bg-warning text-dark">In preparazione</span></td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-primary me-1" href="#/tornei"><i class="fa-solid fa-eye"></i></a>
                <a class="btn btn-sm btn-outline-secondary me-1" href="#/tornei"><i class="fa-solid fa-pen"></i></a>
                <a class="btn btn-sm btn-outline-danger" href="#/tornei"><i class="fa-solid fa-trash"></i></a>
              </td>
            `;
            tbody.appendChild(tr);
          }
        }
      }

    }catch(e){ console.error('[DEBUG] renderStatsAndDashboard error', e); }

    const dbgCards = document.getElementById('dashboard-cards');
    const dbgTBody = document.getElementById('dashboard-tornei-body');
    console.log('[DEBUG] post-renderStatsAndDashboard ->', {
      cardsExists: !!dbgCards,
      cardsChildren: dbgCards ? dbgCards.children.length : 0,
      tbodyExists: !!dbgTBody,
      tbodyChildren: dbgTBody ? dbgTBody.children.length : 0,
      tbodyHTMLlen: dbgTBody ? dbgTBody.innerHTML.length : 0
    });

    // attach dashboard export button if present
    const expDash = document.getElementById('export-dashboard-pdf');
    if(expDash){ expDash.addEventListener('click', async ()=>{ try{ const el = document.getElementById('dashboard-root') || document.querySelector('.hero'); await ExportTools.exportElementToPdf(el, 'dashboard.pdf'); }catch(err){ alert('Esportazione PDF fallita: '+err.message); } }); }

  }

  async function renderHeroNextMatch(){
    const hero = document.getElementById('hero-next-match');
    if(!hero) return;
    const giornate = await IDB.getAll('giornate');
    // prefer giornate with a date and partite that have teams
    const entries = [];
    for(const g of giornate){
      for(const p of (g.partite||[])){
        if(!p.casaNome || !p.trasfertaNome) continue;
        entries.push({ giornata: g, partita: p });
      }
    }
    if(entries.length === 0){ hero.style.display = 'none'; return; }
    // pick first by giornata.data if present, otherwise first entry
    entries.sort((a,b)=>{ const da = a.giornata.data || ''; const db = b.giornata.data || ''; if(da && db) return new Date(da) - new Date(db); return 0; });
    const next = entries[0];
    const g = next.giornata; const p = next.partita;
    const dateText = g.data ? (new Date(g.data)).toLocaleDateString() : (g.numero? 'G.'+g.numero : '');
    const venue = g.descrizione || p.campo || '';
    hero.innerHTML = `
      <div class="card-modern p-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <span class="badge-muted">Prossima</span>
          <small class="text-muted">${escapeHtml(dateText)}</small>
        </div>
        <h5 class="mb-1">${escapeHtml(g.torneoNome || '')} — ${g.numero? 'Giornata ' + g.numero : ''}</h5>
        <p class="text-muted small mb-3">${escapeHtml(venue)}</p>
        <div class="d-flex gap-2 align-items-center">
          <div class="avatar bg-primary text-white rounded-2 px-2 py-1">${escapeHtml((p.casaNome||'').slice(0,1))}</div>
          <div class="flex-fill small text-muted">${escapeHtml(p.casaNome||'')} vs ${escapeHtml(p.trasfertaNome||'')}</div>
          <div class="badge bg-success text-white rounded-1">${p.golCasa!=null && p.golTrasferta!=null ? 'Result' : 'Scheduled'}</div>
        </div>
      </div>
    `;
    hero.style.display = '';
  }

  async function renderDashboardCards(){
    console.log('[DEBUG] renderDashboardCards called');
    const container = document.getElementById('dashboard-cards');
    if(!container) { console.warn('[DEBUG] dashboard-cards non trovato'); return; }
    const tornei = await TorneiStore.list();
    const allSquadre = await SquadreStore.list();
    console.log('[DEBUG] tornei:', tornei);
    console.log('[DEBUG] squadre:', allSquadre);
    container.innerHTML = '';
    if(!tornei || tornei.length===0){
      container.innerHTML = '<div class="mud-paper card-item empty-state">Nessun torneo creato</div>';
      console.log('[DEBUG] Nessun torneo creato');
      return;
    }
    for(const t of tornei){
      const teamCount = allSquadre.filter(s => s.torneoId === t.id).length;
      const card = document.createElement('article');
      card.className = 'mud-paper card-item tournament-card';
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 class="mb-1">${escapeHtml(t.nome)}</h5>
            <div class="small text-muted">${escapeHtml(t.sport||'')}</div>
            <div class="tiny-meta small text-muted">${teamCount} squadre • ${t.numGroups? t.numGroups + ' gruppi' : '--'}</div>
          </div>
          <div class="text-end">
            <div class="badge bg-primary text-white mb-2">${escapeHtml(t.formato||'')}</div>
            <div class="small text-muted">${t.dataInizio||''}</div>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="d-flex gap-2">
            <a class="btn btn-sm btn-outline-primary" href="#/tornei"><i class="fa-solid fa-eye"></i></a>
            <a class="btn btn-sm btn-outline-secondary" href="#/tornei"><i class="fa-solid fa-pen"></i></a>
          </div>
          <div>
            <a class="btn btn-sm btn-danger" data-id="${t.id}" data-action="delete-torneo"><i class="fa-solid fa-trash"></i></a>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
    console.log('[DEBUG] dashboard-cards renderizzati:', tornei.length);
    // ensure container visible
    container.style.display = '';
    container.style.zIndex = 1;
    // scroll into view for debugging
    try{ container.scrollIntoView({ behavior: 'auto', block: 'center' }); }catch(e){}
    // attach delete handlers
    container.querySelectorAll('[data-action="delete-torneo"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      if(!confirm('Eliminare il torneo?')) return;
      await TorneiStore.remove(id);
      await renderDashboardCards();
      await renderHomePreview();
    }));

    // poster buttons on cards
    container.querySelectorAll('[data-action="poster"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const t = await TorneiStore.get(id);
      try{ await ExportTools.generatePosterSvg({ title: t.nome, subtitle: (t.sport||'') + ' • ' + (t.formato||''), filename: (t.nome||'poster') + '.svg', qrUrl: 'https://www.ldm4app.com' }); }
      catch(err){ alert('Errore generazione locandina: '+err.message); }
    }));
    console.log('[DEBUG] dashboard-cards innerHTML length:', container.innerHTML.length, 'children:', container.children.length, 'visible:', getComputedStyle(container).display);
  }

  async function renderStatsAndDashboard(){
    console.log('[DEBUG] renderStatsAndDashboard called');
    const dashboardRoot = document.getElementById('dashboard-root');
    const statTotal = dashboardRoot ? dashboardRoot.querySelector('#stat-total') : document.getElementById('stat-total');
    const statActive = dashboardRoot ? dashboardRoot.querySelector('#stat-active') : document.getElementById('stat-active');
    const statPrep = dashboardRoot ? dashboardRoot.querySelector('#stat-prep') : document.getElementById('stat-prep');
    const statDone = dashboardRoot ? dashboardRoot.querySelector('#stat-done') : document.getElementById('stat-done');
    const tornei = await TorneiStore.list();
    const recent = (tornei || []).slice(-3).reverse();

    // if there is a dedicated home-preview container, populate it; otherwise skip that part
    if(dashboardRoot){
      if(recent.length === 0){ const emptyEl = document.getElementById('home-preview-empty'); if(emptyEl) emptyEl.style.display = ''; dashboardRoot.querySelectorAll('.card-item.dynamic').forEach(n=>n.remove());
        // hide hero next match when no data
        const hero = document.getElementById('hero-next-match'); if(hero) hero.style.display = 'none';
        // continue — we still want to update hero stats and dashboard table below
      } else {
        // hide empty message
        const emptyEl = document.getElementById('home-preview-empty'); if(emptyEl) emptyEl.style.display = 'none';
        // remove previous dynamic cards
        dashboardRoot.querySelectorAll('.card-item.dynamic').forEach(n=>n.remove());
        for(const t of recent){
          const el = document.createElement('article'); el.className = 'mud-paper card-item dynamic';
          el.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="mb-0">${escapeHtml(t.nome)}</h5>
              <small class="text-muted">${escapeHtml(t.formato||'')}</small>
            </div>
            <div class="small text-muted mb-2">${escapeHtml(t.sport||'')}</div>
            <div class="d-flex gap-2">
              <a class="btn btn-sm btn-outline-primary" href="#/tornei" data-action="open-torneo" data-id="${t.id}">Dettagli</a>
              <a class="btn btn-sm btn-primary" href="#/classifica" data-action="open-classifica" data-id="${t.id}">Classifica</a>
            </div>
          `;
          dashboardRoot.appendChild(el);
        }
      }
    }

    // also update hero 'next match' from giornate if available
    await renderHeroNextMatch();

    // update hero statistics (totali / in corso / in preparazione / completati)
    try{
      const allTornei = await TorneiStore.list();
      const allGiornate = await IDB.getAll('giornate');
      const stats = { total: allTornei.length, inCorso: 0, inPreparazione: 0, completati: 0 };
      for(const t of allTornei){
        const gs = allGiornate.filter(g => g.torneoId === t.id);
        const matches = gs.flatMap(g => (g.partite||[]));
        const anyResult = matches.some(p => p.golCasa!=null || (p.games && p.games.length>0 && p.games.some(g=>g.golCasa!=null)));
        const allHaveResult = matches.length>0 && matches.every(p => (p.golCasa!=null) || (p.games && p.games.length>0 && p.games.every(gm=>gm.golCasa!=null)));
        if(allHaveResult) stats.completati++; else if(anyResult) stats.inCorso++; else stats.inPreparazione++;
      }
      const hero = document.querySelector('.hero');
      if(hero){
        let statsRow = hero.querySelector('.hero-stats');
        if(!statsRow){ statsRow = document.createElement('div'); statsRow.className = 'hero-stats'; hero.querySelector('.hero-content').appendChild(statsRow); }
        statsRow.innerHTML = `
          <div class="stat-card"><div class="num">${stats.total}</div><div class="label">Tornei Totali</div></div>
          <div class="stat-card"><div class="num">${stats.inCorso}</div><div class="label">In Corso</div></div>
          <div class="stat-card"><div class="num">${stats.inPreparazione}</div><div class="label">In Preparazione</div></div>
          <div class="stat-card"><div class="num">${stats.completati}</div><div class="label">Completati</div></div>
        `;
      }

      // populate dashboard table (non-intrusive, only visual)
      const tbody = document.getElementById('dashboard-tornei-body');
      const allSquadre = await SquadreStore.list();
      if(tbody){
        tbody.innerHTML = '';
        if(allTornei.length === 0){
          tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-muted text-center py-4">Nessun torneo presente — crea il primo torneo.</td></tr>';
        } else {
          for(const t of allTornei){
            const teamCount = allSquadre.filter(s => s.torneoId === t.id).length;
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${escapeHtml(t.nome||'—')}</strong><div class="small text-muted">${escapeHtml(t.formato||'')}</div></td>
              <td class="small text-muted">${escapeHtml(t.sport||'—')}</td>
              <td class="small text-muted">${teamCount} squadre</td>
              <td class="small text-muted">${t.dataInizio||''}</td>
              <td><span class="badge bg-warning text-dark">In preparazione</span></td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-primary me-1" href="#/tornei"><i class="fa-solid fa-eye"></i></a>
                <a class="btn btn-sm btn-outline-secondary me-1" href="#/tornei"><i class="fa-solid fa-pen"></i></a>
                <a class="btn btn-sm btn-outline-danger" href="#/tornei"><i class="fa-solid fa-trash"></i></a>
              </td>
            `;
            tbody.appendChild(tr);
          }
        }
      }

    }catch(e){ console.error('[DEBUG] renderHeroNextMatch error', e); }

  }

  // ensure home preview + dashboard update after save
  const _origSave = TorneiStore.save.bind(TorneiStore);
  TorneiStore.save = async function(obj){ 
    try {
      const res = await _origSave(obj);
      try{ await renderHomePreview(); } catch(e){ console.warn('renderHomePreview error:', e); }
      try{ await renderDashboardCards(); } catch(e){ console.warn('renderDashboardCards error:', e); }
      try{ await renderStatsAndDashboard(); } catch(e){ console.warn('renderStatsAndDashboard error:', e); }
      return res;
    } catch(e) {
      console.error('TorneiStore.save error:', e);
      throw e;
    }
  };

  return { init: async () => { await renderHomePreview(); await renderDashboardCards(); await renderStatsAndDashboard(); }, renderList, renderCreate, renderEdit, renderHomePreview, renderHeroNextMatch, renderDashboardCards };
})();

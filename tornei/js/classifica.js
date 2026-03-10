const ClassificaUI = (function(){
  const root = document.getElementById('app-root');

  function tplTable(rows){
    return `
      <div class="card mud-paper">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>#</th><th>Squadra</th><th>PG</th><th>V</th><th>P</th><th>S</th><th>GF</th><th>GS</th><th>DR</th><th>Pt</th></tr></thead>
            <tbody>
              ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.nome)}</td><td>${r.played}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td><strong>${r.pts}</strong></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  async function render(){
    const dashboardRootEl = document.getElementById('dashboard-root'); if(dashboardRootEl){ dashboardRootEl.style.display = 'none'; dashboardRootEl.innerHTML = ''; }
    const tornei = await TorneiStore.list();
    const torneiOptions = ['<option value="">-- Seleziona torneo --</option>'].concat(tornei.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`)).join('');
    root.innerHTML = `<div class="d-flex mb-3 header-compact"><h3 class="me-auto">Classifica</h3><div class="d-flex align-items-center"><select id="sel-torneo" class="form-select form-select-sm me-2">${torneiOptions}</select><button id="export-pdf-classifica" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-file-pdf me-1"></i> Esporta PDF</button></div></div><div id="classifica-area"></div>`;
    document.getElementById('sel-torneo').addEventListener('change', async e => { await showForTorneo(e.target.value); });
    const expBtn = document.getElementById('export-pdf-classifica');
    if(expBtn) expBtn.addEventListener('click', async ()=>{ try{ await ExportTools.exportElementToPdf(document.getElementById('classifica-area'), 'classifica.pdf'); }catch(err){ alert('Esportazione PDF fallita: '+err.message); } });
  }

  async function showForTorneo(tid){
    if(!tid){ document.getElementById('classifica-area').innerHTML = '<div class="empty-state">Seleziona un torneo per vedere la classifica</div>'; return; }
    const squadre = (await SquadreStore.list()).filter(s=>s.torneoId===tid);
    const giornate = (await IDB.getAll('giornate')).filter(g=>g.torneoId===tid);
    const rows = squadre.map(s => ({ id: s.id, nome: s.nome, played:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }));
    const idxById = Object.fromEntries(rows.map((r,i)=>[r.id,i]));
    // compute points according to sport rules (default calcio 3/1/0)
    const torneo = (await TorneiStore.get(tid)) || {};
    const sport = (torneo.sport || 'calcio').toLowerCase();
    const scoring = (sport === 'calcio') ? { win: 3, draw: 1, loss: 0 } : { win: 1, draw: 0, loss: 0 };

    for(const g of giornate){
      for(const p of (g.partite||[])){
        // only include group-stage matches in league standings
        if(p.stage && p.stage.toLowerCase() === 'playoff') continue;
        // support single-game or games[] (series won't appear here normally)
        if(p.games && p.games.length){
          // count each completed game individually
          for(const gm of p.games){
            if(gm.golCasa==null || gm.golTrasferta==null) continue;
            const home = rows[idxById[p.casaId]]; const away = rows[idxById[p.trasfertaId]];
            if(!home || !away) continue;
            home.played++; away.played++;
            home.gf += gm.golCasa; home.ga += gm.golTrasferta; away.gf += gm.golTrasferta; away.ga += gm.golCasa;
            if(gm.golCasa > gm.golTrasferta){ home.w++; away.l++; home.pts += scoring.win; away.pts += scoring.loss; }
            else if(gm.golCasa < gm.golTrasferta){ away.w++; home.l++; away.pts += scoring.win; home.pts += scoring.loss; }
            else { home.d++; away.d++; home.pts += scoring.draw; away.pts += scoring.draw; }
          }
        } else {
          if(p.golCasa==null || p.golTrasferta==null) continue;
          const home = rows[idxById[p.casaId]]; const away = rows[idxById[p.trasfertaId]];
          if(!home || !away) continue;
          home.played++; away.played++;
          home.gf += p.golCasa; home.ga += p.golTrasferta; away.gf += p.golTrasferta; away.ga += p.golCasa;
          if(p.golCasa > p.golTrasferta){ home.w++; away.l++; home.pts += scoring.win; away.pts += scoring.loss; }
          else if(p.golCasa < p.golTrasferta){ away.w++; home.l++; away.pts += scoring.win; home.pts += scoring.loss; }
          else { home.d++; away.d++; home.pts += scoring.draw; away.pts += scoring.draw; }
        }
      }
    }
    rows.forEach(r => r.gd = r.gf - r.ga);
    rows.sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.nome.localeCompare(b.nome));
    document.getElementById('classifica-area').innerHTML = tplTable(rows);
  }

  return { render };
})();
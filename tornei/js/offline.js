const OfflineUI = (function(){
  const root = document.getElementById('app-root');
  function tpl(list){
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">Offline queue <span class="badge-muted ms-2">${list.length}</span></h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" id="clear-queue"><i class="fa-solid fa-trash me-1"></i>Svuota</button>
        </div>
      </div>
      <div class="card mud-paper">
        <div class="card-body">
          <table class="table table-sm table-hover">
            <thead><tr><th>ID</th><th>Metodo</th><th>URL</th><th>Data</th><th></th></tr></thead>
            <tbody>
              ${list.length===0? '<tr><td colspan="5" class="empty-state">Nessuna richiesta in coda</td></tr>' : list.map(i => `<tr><td>${i.id}</td><td>${i.method}</td><td class="text-truncate" style="max-width:260px">${i.url}</td><td>${new Date(i.createdAt).toLocaleString()}</td><td class="text-end"><button class="btn btn-icon btn-sm btn-success me-2" data-id="${i.id}" data-action="replay" title="Retry"><i class="fa-solid fa-arrows-rotate"></i></button> <button class="btn btn-icon btn-sm btn-outline-secondary" data-id="${i.id}" data-action="delete" title="Delete"><i class="fa-solid fa-xmark"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function render(){
    const list = await OfflineQueue.list();
    root.innerHTML = tpl(list);
    root.querySelectorAll('button[data-action="replay"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      await replay(id);
      render();
    }));
    root.querySelectorAll('button[data-action="delete"]').forEach(b => b.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      await OfflineQueue.remove(id);
      render();
    }));
    const clearBtn = document.getElementById('clear-queue');
    if(clearBtn) clearBtn.addEventListener('click', async ()=>{ if(confirm('Svuotare la coda?')){ await OfflineQueue.clear(); render(); } });
  }

  async function replay(id){
    const items = await OfflineQueue.list();
    const it = items.find(x => x.id === id);
    if(!it) return alert('Elemento non trovato');
    try{
      // try to replay to server; here we simulate with fetch
      const res = await fetch(it.url, { method: it.method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(it.body) });
      if(!res.ok) throw new Error('server responded '+res.status);
      await OfflineQueue.remove(id);
      alert('Richiesta ripetuta con successo');
    }catch(err){ alert('Replay fallito: '+err.message); }
  }

  return { init: ()=>{}, render }
})();

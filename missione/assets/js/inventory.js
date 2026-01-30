// inventory.js - gestione avanzata inventario e spedizioni container
const InventoryModule = (function(){
    function init(){
        renderList();
        const addBtn = document.getElementById('add-shipment-btn'); if (addBtn) addBtn.addEventListener('click', showShipmentForm);
        // optional add inventory resource
        const addInv = document.getElementById('add-inventory-btn'); if (addInv) addInv.addEventListener('click', ()=>{ showAddInventoryForm(); });
    }

    function renderList(){
        const list = document.getElementById('shipments-list'); if(!list) return; list.innerHTML='';
        const shipments = Storage.load('shipments') || [];
        if(!shipments.length){ list.innerHTML = '<p class="muted">Nessuna spedizione registrata.</p>'; return; }
        shipments.forEach((s,i)=>{
            const el = document.createElement('div'); el.className='list-item';
            el.innerHTML = `<div>
                <strong>${s.title || ('Container #' + (i+1))}</strong>
                <p>${s.destination || ''} • Partenza: ${s.departureDate || '—'}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <span class="badge ${s.status==='Arrivato'?'success':'info'}">${s.status || 'In preparazione'}</span>
                <div><button class="btn btn-outline" data-index="${i}" onclick="InventoryModule.editShipment(${i})">Modifica</button> <button class="btn btn-secondary" data-index="${i}" onclick="InventoryModule.removeShipment(${i})">Elimina</button></div>
            </div>`;
            list.appendChild(el);
        });
    }

    function showShipmentForm(defaults={}){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = defaults.title ? 'Modifica Spedizione' : 'Nuova Spedizione Container';
        const contents = defaults.contents ? defaults.contents.join('\n') : '';
        body.innerHTML = `
            <p class="modal-subtitle">Inserisci i dettagli della spedizione. Usa il campo contenuti per elencare articoli (uno per riga).</p>
            <div class="form-grid">
                <div class="form-field"><label>Titolo</label><input id="s_title" placeholder="Titolo (es: Container 12)" value="${defaults.title||''}" /></div>
                <div class="form-field"><label>Data partenza</label><input id="s_departure" placeholder="Data partenza (YYYY-MM-DD)" value="${defaults.departureDate||''}" /></div>
                <div class="form-field full"><label>Destinazione</label><input id="s_destination" placeholder="Destinazione missione" value="${defaults.destination||''}" /></div>
                <div class="form-field full"><label>Contenuto (una voce per riga)</label><textarea id="s_contents" style="height:100px">${contents}</textarea></div>
            </div>
            <div class="form-actions"><button id="cancel-s-btn" class="btn btn-secondary">Annulla</button><button id="save-s-btn" class="btn btn-primary">${defaults.index!=null?'Aggiorna':'Salva'}</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-s-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-s-btn').onclick = ()=>{
            const title = document.getElementById('s_title').value.trim(); if (!title) { showToast('Titolo spedizione richiesto', 'error'); return; }
            const shipments = Storage.load('shipments') || [];
            const item = {title, departureDate:document.getElementById('s_departure').value.trim(), destination:document.getElementById('s_destination').value.trim(), contents: document.getElementById('s_contents').value.split('\n').map(l=>l.trim()).filter(Boolean), status: defaults.status || 'In preparazione'};
            if (defaults.index != null){ shipments[defaults.index] = item; } else { shipments.push(item); }
            Storage.save('shipments', shipments); Storage.backupIfMassive && Storage.backupIfMassive('shipments'); renderList(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function editShipment(i){
        const shipments = Storage.load('shipments') || []; if(!shipments[i]) return;
        showShipmentForm(shipments[i]);
        // override save to update
        document.getElementById('save-s-btn').onclick = ()=>{
            shipments[i] = {title:document.getElementById('s_title').value, departureDate:document.getElementById('s_departure').value, destination:document.getElementById('s_destination').value, contents: document.getElementById('s_contents').value.split('\n').map(l=>l.trim()).filter(Boolean), status:shipments[i].status || 'In preparazione'};
            Storage.save('shipments', shipments);
            Storage.backupIfMassive && Storage.backupIfMassive('shipments');
            renderList(); document.getElementById('modal').classList.remove('open');
            if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
            if (typeof showView === 'function') showView('dashboard');
        }
    }

    function removeShipment(i){
        const shipments = Storage.load('shipments') || []; if(!shipments[i]) return;
        shipments.splice(i,1); Storage.save('shipments', shipments); renderList();
    }

    function showAddInventoryForm(defaults={}){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = defaults.name ? 'Modifica Risorsa' : 'Nuova Risorsa Inventario';
        body.innerHTML = `
            <p class="modal-subtitle">Aggiungi o modifica una risorsa. Nome e quantità sono obbligatori.</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome risorsa</label><input id="it_name" placeholder="Nome risorsa" value="${defaults.name||''}" /></div>
                <div class="form-field"><label>Quantità</label><input id="it_qty" placeholder="Quantità" value="${defaults.qty||''}" /></div>
                <div class="form-field full"><label>Note</label><input id="it_notes" placeholder="Note" value="${defaults.notes||''}" /></div>
            </div>
            <div class="form-actions"><button id="cancel-inv" class="btn btn-secondary">Annulla</button><button id="save-inv" class="btn btn-primary">${defaults.index!=null?'Aggiorna':'Salva'}</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-inv').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-inv').onclick = ()=>{
            const name = document.getElementById('it_name').value.trim(); const qty = Number(document.getElementById('it_qty').value || 0);
            if (!name || qty <= 0) { showToast('Nome e quantità richiesti', 'error'); return; }
            const inv = Storage.load('inventory') || [];
            const item = {name, qty, notes: document.getElementById('it_notes').value.trim() };
            if (defaults.index != null){ inv[defaults.index] = item; } else { inv.push(item); }
            Storage.save('inventory', inv); Storage.backupIfMassive && Storage.backupIfMassive('inventory'); if (typeof LogisticsModule !== 'undefined') LogisticsModule.renderList(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);
        }
    }

    return {init,renderList,showShipmentForm,editShipment,removeShipment};
})();

document.addEventListener('DOMContentLoaded', InventoryModule.init);

// expose for inline handlers
window.InventoryModule = InventoryModule;
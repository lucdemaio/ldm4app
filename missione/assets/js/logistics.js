// logistics.js - inventory & logistics management (basic)
const LogisticsModule = (function(){
    function init(){
        renderList();
    }

    function renderList(){
        const container = document.getElementById('logistics-list'); if (!container) return; container.innerHTML='';
        const inv = Storage.load('inventory') || [];
        if (!inv.length) container.innerHTML = '<p class="muted">Nessun elemento in inventario.</p>';
        inv.forEach((it,i)=>{
            const el = document.createElement('div'); el.className='list-item';
            el.innerHTML = `<strong>${it.name}</strong><p>Quantità: ${it.qty} • Note: ${it.notes||''}</p><div style="margin-top:8px;"><button class="btn btn-secondary" data-index="${i}" onclick="LogisticsModule.adjustQty(${i},1)">+1</button> <button class="btn btn-secondary" data-index="${i}" onclick="LogisticsModule.adjustQty(${i},-1)">-1</button></div>`;
            container.appendChild(el);
        });
        // add control to open modal for adding new item (avoid inline forms)
        const add = document.createElement('div'); add.className='card'; add.style.marginTop='1rem'; add.innerHTML = `
            <h3>Aggiungi/Importa Inventario</h3>
            <div style="text-align:right;"><button id="open-add-inv" class="btn btn-primary">Aggiungi Risorsa</button></div>
            <p class="muted" style="margin-top:8px;">Usa il pulsante per aprire la finestra di inserimento.</p>
        `;
        container.appendChild(add);
        const openBtn = document.getElementById('open-add-inv');
        if (openBtn) openBtn.addEventListener('click', ()=>{
            if (typeof InventoryModule !== 'undefined' && InventoryModule.showAddInventoryForm) { InventoryModule.showAddInventoryForm(); return; }
            // fallback: small modal form
            const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent='Nuova Risorsa Inventario';
            body.innerHTML = `
                <p class="modal-subtitle">Aggiungi una risorsa all'inventario.</p>
                <div class="form-grid">
                    <div class="form-field"><label>Nome risorsa</label><input id="it_name" placeholder="Nome risorsa" /></div>
                    <div class="form-field"><label>Quantità</label><input id="it_qty" placeholder="Quantità" /></div>
                    <div class="form-field full"><label>Note</label><input id="it_notes" placeholder="Note" /></div>
                </div>
                <div class="form-actions"><button id="cancel-inv" class="btn btn-secondary">Annulla</button><button id="save-inv" class="btn btn-primary">Salva</button></div>
            `;
            const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
            const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
            document.addEventListener('keydown', escHandler);
            const cancelInvEl = document.getElementById('cancel-inv'); if (cancelInvEl) cancelInvEl.onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
            const saveInvEl = document.getElementById('save-inv'); if (saveInvEl) saveInvEl.onclick = ()=>{
                const name = document.getElementById('it_name').value; const qty = Number(document.getElementById('it_qty').value || 0); const notes = document.getElementById('it_notes').value;
                if (!name || qty <= 0) { showToast('Nome e quantità richiesti', 'error'); return; }
                const inv = Storage.load('inventory') || []; inv.push({name, qty, notes}); Storage.save('inventory', inv); showToast('Elemento aggiunto', 'success'); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);
                if (typeof LogisticsModule !== 'undefined') LogisticsModule.renderList();
            };
        });
    }

    function adjustQty(index, delta){ const inv = Storage.load('inventory') || []; if (!inv[index]) return; inv[index].qty = Math.max(0, (inv[index].qty||0) + delta); Storage.save('inventory', inv); renderList(); }

    return {init, renderList, adjustQty};
})();

// expose for inline onclick
window.LogisticsModule = LogisticsModule;

document.addEventListener('DOMContentLoaded', LogisticsModule.init);
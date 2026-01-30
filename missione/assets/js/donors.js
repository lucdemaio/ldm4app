// donors.js
const DonorsModule = (function(){
    function init(){
        renderList();
        const addBtn = document.getElementById('add-donor-btn');
        if (addBtn) addBtn.addEventListener('click', showDonorForm);
    }

    function renderList(){
        const list = document.getElementById('donors-list');
        if (!list) return;
        list.innerHTML='';
        const donors = Storage.load('donors') || [];
        if (!donors.length) list.innerHTML='<p class="muted">Nessun donatore registrato.</p>';
        donors.forEach((d,i)=>{
            const el=document.createElement('div'); el.className='list-item';
            el.innerHTML = `<div><strong>${d.name}</strong><p>€ ${Number(d.amount||0).toFixed(2)} • ${d.contact||''}</p></div><div><button class="btn btn-outline" data-action="edit" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove" data-index="${i}">Elimina</button></div>`;
            list.appendChild(el);
        });
        // aggiunge handler delegati per evitare riferimenti globali non definiti
        list.querySelectorAll('button[data-action]').forEach(btn=>{
            const action = btn.getAttribute('data-action');
            const idx = parseInt(btn.getAttribute('data-index'),10);
            if (action === 'edit') btn.onclick = ()=>editDonor(idx);
            if (action === 'remove') btn.onclick = ()=>removeDonor(idx);
        });
        if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
    }

    function _closeModalCleanup(escHandler){
        const modal = document.getElementById('modal');
        if (!modal) return;
        modal.classList.remove('open');
        const closeBtn = document.querySelector('.modal-close'); if (closeBtn) closeBtn.onclick = null;
        if (escHandler) document.removeEventListener('keydown', escHandler);
    }

    function showDonorForm(){
        const body = document.getElementById('modal-body');
        if (!body) return;
        document.getElementById('modal-title').textContent='Nuovo Donatore';
        body.innerHTML = `
            <input id="dname" placeholder="Nome" style="width:100%;margin-bottom:8px;"/>
            <input id="damount" placeholder="Importo (es: 50.00)" style="width:100%;margin-bottom:8px;"/>
            <input id="dcontact" placeholder="Contatto" style="width:100%;margin-bottom:8px;"/>
            <div style="text-align:right;"><button id="save-d-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal');
        if (!modal) return;
        modal.classList.add('open');
        const closeBtn = document.querySelector('.modal-close'); if (closeBtn) closeBtn.onclick = () => _closeModalCleanup();
        const escHandler = (e)=>{ if(e.key === 'Escape') _closeModalCleanup(escHandler); };
        document.addEventListener('keydown', escHandler);
        const saveBtn = document.getElementById('save-d-btn');
        if (!saveBtn) return;
        saveBtn.onclick = ()=>{
            try{
                const donors = Storage.load('donors') || [];
                donors.push({name:document.getElementById('dname').value, amount: parseFloat(document.getElementById('damount').value||0), contact: document.getElementById('dcontact').value});
                Storage.save('donors', donors);
                renderList();
                _closeModalCleanup(escHandler);
                if (typeof showView === 'function') showView('dashboard');
            }catch(err){
                console.error('Errore salvataggio donatore',err);
                alert('Errore durante il salvataggio.');
            }
        }
    }

    function editDonor(index){
        const donors = Storage.load('donors') || [];
        const donor = donors[index];
        if (!donor) return;
        const body = document.getElementById('modal-body'); if (!body) return;
        document.getElementById('modal-title').textContent='Modifica Donatore';
        body.innerHTML = `
            <p class="modal-subtitle">Modifica dati donatore.</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome</label><input id="dname" value="${(donor.name||'').replace(/"/g,'&quot;')}" /></div>
                <div class="form-field"><label>Importo (EUR)</label><input id="damount" value="${Number(donor.amount||0).toFixed(2)}" /></div>
                <div class="form-field full"><label>Contatto</label><input id="dcontact" value="${(donor.contact||'').replace(/"/g,'&quot;')}" /></div>
            </div>
            <div class="form-actions"><button id="cancel-d-btn" class="btn btn-secondary">Annulla</button><button id="save-d-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open');
        const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if(e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-d-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        const saveBtn = document.getElementById('save-d-btn'); if (!saveBtn) return;
        saveBtn.onclick = ()=>{
            try{
                const name = document.getElementById('dname').value.trim(); const amount = parseFloat(document.getElementById('damount').value || 0);
                if (!name) { showToast('Nome donatore richiesto', 'error'); return; }
                if (!amount || amount <= 0) { showToast('Importo valido richiesto', 'error'); return; }
                donors[index] = {name, amount, contact: document.getElementById('dcontact').value.trim()};
                Storage.save('donors', donors);
                renderList();
                modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof showView === 'function') showView('dashboard');
            }catch(err){ console.error('Errore aggiornamento donatore',err); showToast('Errore durante l\'aggiornamento','error'); }
        }
    }

    function removeDonor(index){
        const donors = Storage.load('donors') || [];
        if (!donors[index]) return;
        if (!confirm(`Confermi eliminazione di "${donors[index].name}"?`)) return;
        donors.splice(index,1);
        Storage.save('donors', donors);
        renderList();
        if (typeof showView === 'function') showView('dashboard');
    }

    return {init,renderList,showDonorForm,editDonor,removeDonor};
})();
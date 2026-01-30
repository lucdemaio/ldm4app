// volunteers.js
const VolunteersModule = (function(){
    function init(){
        renderList();
        const addBtn = document.getElementById('add-volunteer-btn');
        if (addBtn) addBtn.addEventListener('click', showVolunteerForm);
    }

    function renderList(){
        const list = document.getElementById('volunteers-list'); list.innerHTML='';
        const volunteers = Storage.load('volunteers') || [];
        if (!volunteers.length) list.innerHTML='<p class="muted">Nessun volontario registrato.</p>';
        volunteers.forEach((v, i) => {
            const el = document.createElement('div'); el.className='list-item';
            el.innerHTML = `<div><strong>${v.name}</strong><p>${v.role || ''} • ${v.contact || ''}</p></div><div><button class="btn btn-outline" onclick="VolunteersModule.editVolunteer(${i})">Modifica</button> <button class="btn btn-secondary" onclick="VolunteersModule.removeVolunteer(${i})">Elimina</button></div>`;
            list.appendChild(el);
        });
        if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
    }

    function showVolunteerForm(){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = 'Nuovo Volontario';
        body.innerHTML = `
            <p class="modal-subtitle">Inserisci i dati del volontario. I campi obbligatori sono contrassegnati.</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome</label><input id="vname" placeholder="Nome" /></div>
                <div class="form-field"><label>Ruolo</label><input id="vrole" placeholder="Ruolo" /></div>
                <div class="form-field full"><label>Contatto (email / telefono)</label><input id="vcontact" placeholder="Contatto" /></div>
            </div>
            <div class="form-actions"><button id="cancel-v-btn" class="btn btn-secondary">Annulla</button><button id="save-v-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-v-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-v-btn').onclick = ()=>{
            const name = document.getElementById('vname').value.trim(); if (!name) { showToast('Nome richiesto', 'error'); return; }
            const volunteers = Storage.load('volunteers') || [];
            volunteers.push({name, role:document.getElementById('vrole').value.trim(), contact:document.getElementById('vcontact').value.trim()});
            Storage.save('volunteers', volunteers); VolunteersModule.renderList(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function editVolunteer(i){
        const volunteers = Storage.load('volunteers') || []; if (!volunteers[i]) return;
        const v = volunteers[i];
        const body = document.getElementById('modal-body'); document.getElementById('modal-title').textContent = 'Modifica Volontario';
        body.innerHTML = `
            <input id="vname" placeholder="Nome" style="width:100%;margin-bottom:8px;" value="${v.name||''}" />
            <input id="vrole" placeholder="Ruolo" style="width:100%;margin-bottom:8px;" value="${v.role||''}" />
            <input id="vcontact" placeholder="Contatto (email/tel)" style="width:100%;margin-bottom:8px;" value="${v.contact||''}" />
            <div style="text-align:right;"><button id="save-v-btn" class="btn btn-primary">Salva</button></div>
        `;
        document.getElementById('modal').classList.add('open');
        const closeBtn = document.querySelector('.modal-close'); if (closeBtn) closeBtn.onclick = () => document.getElementById('modal').classList.remove('open');
        document.getElementById('save-v-btn').onclick = () => {
            volunteers[i] = {name:document.getElementById('vname').value, role:document.getElementById('vrole').value, contact:document.getElementById('vcontact').value};
            Storage.save('volunteers', volunteers); VolunteersModule.renderList(); document.getElementById('modal').classList.remove('open');
            if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function removeVolunteer(i){ const volunteers = Storage.load('volunteers') || []; if (!volunteers[i]) return; volunteers.splice(i,1); Storage.save('volunteers', volunteers); VolunteersModule.renderList(); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); }

    function showTraining() {
        const body = document.getElementById('modal-body');
        if (!body) return;
        document.getElementById('modal-title').textContent = 'Formazione Volontari';
        let training = Storage.load('volunteers_training') || [];
        const volunteers = Storage.load('volunteers') || [];
        // Render elenco formazione
        let html = `<p class="modal-subtitle">Registra corsi, certificazioni o note di formazione per ciascun volontario.</p><div class="form-grid">`;
        volunteers.forEach((v, i) => {
            const t = training[i] || '';
            html += `<div class="form-field full"><label>${v.name}</label><input type="text" id="training-${i}" value="${t.replace(/"/g,'&quot;')}" placeholder="Corsi, certificazioni, note" /></div>`;
        });
        html += '</div><div class="form-actions"><button id="cancel-training-btn" class="btn btn-secondary">Annulla</button><button id="save-training-btn" class="btn btn-primary">Salva</button></div>';
        body.innerHTML = html;
        const modal = document.getElementById('modal');
        if (!modal) return;
        modal.classList.add('open');
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-training-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-training-btn').onclick = ()=>{
            training = volunteers.map((v, i) => document.getElementById(`training-${i}`).value.trim());
            Storage.save('volunteers_training', training);
            showToast('Formazione salvata', 'success');
            modal.classList.remove('open');
            document.removeEventListener('keydown', escHandler);
        };
    }

    function showAvailability() {
        const body = document.getElementById('modal-body');
        if (!body) return;
        document.getElementById('modal-title').textContent = 'Disponibilità Volontari';
        let availability = Storage.load('volunteers_availability') || [];
        const volunteers = Storage.load('volunteers') || [];
        // Render elenco disponibilità
        let html = `<p class="modal-subtitle">Registra la disponibilità (giorni/orari/note) di ciascun volontario.</p><div class="form-grid">`;
        volunteers.forEach((v, i) => {
            const a = availability[i] || '';
            html += `<div class="form-field full"><label>${v.name}</label><input type="text" id="availability-${i}" value="${a.replace(/"/g,'&quot;')}" placeholder="Giorni, orari, note" /></div>`;
        });
        html += '</div><div class="form-actions"><button id="cancel-availability-btn" class="btn btn-secondary">Annulla</button><button id="save-availability-btn" class="btn btn-primary">Salva</button></div>';
        body.innerHTML = html;
        const modal = document.getElementById('modal');
        if (!modal) return;
        modal.classList.add('open');
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-availability-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-availability-btn').onclick = ()=>{
            availability = volunteers.map((v, i) => document.getElementById(`availability-${i}`).value.trim());
            Storage.save('volunteers_availability', availability);
            showToast('Disponibilità salvata', 'success');
            modal.classList.remove('open');
            document.removeEventListener('keydown', escHandler);
        };
    }

    return {init,renderList,showVolunteerForm,showTraining,showAvailability,editVolunteer,removeVolunteer};
})();
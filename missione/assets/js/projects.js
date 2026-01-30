// projects.js
const ProjectsModule = (function(){
    function init(){
        renderList();
        renderAdoptions();
        const addBtn = document.getElementById('add-project-btn');
        if (addBtn) addBtn.addEventListener('click', showProjectForm);
        const addAdBtn = document.getElementById('add-adoption-btn'); if (addAdBtn) addAdBtn.addEventListener('click', showAdoptionForm);
    }

    function renderList(){
        const list = document.getElementById('projects-list'); list.innerHTML='';
        const projects = Storage.load('projects') || [];
        if (!projects.length) list.innerHTML='<p class="muted">Nessun progetto attivo.</p>';
        projects.forEach((p,i)=>{
            const el = document.createElement('div'); el.className='list-item';
            const status = p.status || 'In corso';
            const badgeClass = status === 'Completato' ? 'badge success' : status === 'Pausato' ? 'badge warning' : 'badge info';
            el.innerHTML = `<div><strong>${p.title}</strong><p>${p.location || ''}</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px"><span class="${badgeClass}">${status}</span><div><button class="btn btn-outline" onclick="ProjectsModule.editProject(${i})">Modifica</button> <button class="btn btn-secondary" onclick="ProjectsModule.removeProject(${i})">Elimina</button></div></div>`;
            list.appendChild(el);
        });
        if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
    }

    function showProjectForm(){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = 'Nuovo Progetto';
        body.innerHTML = `
            <p class="modal-subtitle">Crea un nuovo progetto. Titolo e descrizione sono importanti per la rendicontazione.</p>
            <div class="form-grid">
                <div class="form-field"><label>Titolo</label><input id="ptitle" placeholder="Titolo progetto" /></div>
                <div class="form-field"><label>Località</label><input id="plocation" placeholder="Località" /></div>
                <div class="form-field full"><label>Breve descrizione</label><textarea id="psummary" placeholder="Breve descrizione" style="height:110px"></textarea></div>
            </div>
            <div class="form-actions"><button id="cancel-p-btn" class="btn btn-secondary">Annulla</button><button id="save-p-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-p-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-p-btn').onclick = ()=>{
            const title = document.getElementById('ptitle').value.trim(); if (!title) { showToast('Titolo progetto richiesto', 'error'); return; }
            const projects = Storage.load('projects') || [];
            projects.push({title, location:document.getElementById('plocation').value.trim(), summary:document.getElementById('psummary').value.trim()});
            Storage.save('projects', projects); ProjectsModule.renderList(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function renderAdoptions(){
        const list = document.getElementById('adoptions-list'); if(!list) return; list.innerHTML='';
        const adoptions = Storage.load('adoptions') || [];
        if(!adoptions.length){ list.innerHTML = '<p class="muted">Nessuna adozione registrata.</p>'; return; }
        adoptions.forEach((a,i)=>{
            const el = document.createElement('div'); el.className='list-item';
            el.innerHTML = `<div><strong>${a.childName}</strong><p>${a.country || ''} • Donatore: ${a.donorName || '—'}</p></div><div><span class="badge info">Adozione</span></div>`;
            list.appendChild(el);
        });
    }

    function showAdoptionForm(){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent='Nuova Adozione a Distanza';
        const donors = Storage.load('donors') || [];
        const donorOptions = donors.map(d=>`<option value="${d.name}">${d.name} (${d.contact||''})</option>`).join('');
        body.innerHTML = `
            <p class="modal-subtitle">Registra un'adozione a distanza. Inserisci i dati del bambino e seleziona, se disponibile, il donatore.</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome bambino</label><input id="a_child" placeholder="Nome bambino" /></div>
                <div class="form-field"><label>Data nascita</label><input id="a_dob" placeholder="Data nascita (YYYY-MM-DD)" /></div>
                <div class="form-field"><label>Paese</label><input id="a_country" placeholder="Paese" /></div>
                <div class="form-field full"><label>Donatore (opzionale)</label><select id="a_donor"><option value="">(seleziona donatore)</option>${donorOptions}</select></div>
            </div>
            <div class="form-actions"><button id="cancel-a-btn" class="btn btn-secondary">Annulla</button><button id="save-a-btn" class="btn btn-primary">Salva Adozione</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open');
        const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-a-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-a-btn').onclick = ()=>{
            const childName = (document.getElementById('a_child').value || '').trim();
            if (!childName) { showToast('Nome del bambino richiesto', 'error'); return; }
            const adoptions = Storage.load('adoptions') || [];
            const donorName = document.getElementById('a_donor').value || null;
            adoptions.push({childName, dob:document.getElementById('a_dob').value.trim(), country:document.getElementById('a_country').value.trim(), donorName});
            Storage.save('adoptions', adoptions); ProjectsModule.renderAdoptions(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function editProject(i){
        const projects = Storage.load('projects') || []; if(!projects[i]) return;
        const p = projects[i];
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent='Modifica Progetto';
        body.innerHTML = `
            <p class="modal-subtitle">Modifica progetto</p>
            <div class="form-grid">
                <div class="form-field"><label>Titolo</label><input id="ptitle" value="${p.title||''}" /></div>
                <div class="form-field"><label>Località</label><input id="plocation" value="${p.location||''}" /></div>
                <div class="form-field full"><label>Breve descrizione</label><textarea id="psummary" style="height:110px">${p.summary||''}</textarea></div>
                <div class="form-field"><label>Stato</label><input id="pstatus" value="${p.status||'In corso'}" /></div>
            </div>
            <div class="form-actions"><button id="cancel-p-btn" class="btn btn-secondary">Annulla</button><button id="save-p-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-p-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-p-btn').onclick = ()=>{
            const title = document.getElementById('ptitle').value.trim(); if (!title) { showToast('Titolo progetto richiesto', 'error'); return; }
            projects[i] = {title, location:document.getElementById('plocation').value.trim(), summary:document.getElementById('psummary').value.trim(), status:document.getElementById('pstatus').value};
            Storage.save('projects', projects); ProjectsModule.renderList(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function removeProject(i){ const projects = Storage.load('projects') || []; if (!projects[i]) return; projects.splice(i,1); Storage.save('projects', projects); ProjectsModule.renderList(); }

    return {init,renderList,showProjectForm,renderAdoptions,showAdoptionForm,editProject,removeProject};
})();

// expose for inline handlers
window.ProjectsModule = ProjectsModule;
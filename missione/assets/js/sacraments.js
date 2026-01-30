// sacraments.js - gestione Sacramenti e Funzioni Religiose
const SacramentsModule = (function(){

    let currentTab = 'baptisms';
    function init(){
        try {
            renderTabs();
            renderCurrentModule();
        } catch(err){ console.error('Sacraments init failed', err); }
    }

    function renderTabs() {
        console.log('[SACRAMENTS] renderTabs, currentTab:', currentTab);
        const tabs = [
            {id:'baptisms', label:'Battesimi'},
            {id:'marriages', label:'Matrimoni'},
            {id:'funerals', label:'Esequie'},
            {id:'celebrations', label:'Celebrazioni'},
            {id:'catechesi', label:'Catechesi'},
            {id:'intentions', label:'Intenzioni Messe'}
        ];
        tabs.forEach(tab => {
            const btn = document.getElementById('tab-' + tab.id);
            if (btn) {
                btn.classList.toggle('btn-primary', currentTab === tab.id);
                btn.classList.toggle('btn-outline', currentTab !== tab.id);
                btn.onclick = () => {
                    console.log('[SACRAMENTS] Tab click:', tab.id);
                    currentTab = tab.id;
                    renderTabs();
                    renderCurrentModule();
                };
            } else {
                console.warn('[SACRAMENTS] Tab button non trovato:', tab.id);
            }
        });
    }

    function renderCurrentModule() {
        console.log('[SACRAMENTS] renderCurrentModule, currentTab:', currentTab);
        const container = document.getElementById('sacraments-modules-container');
        if (!container) { console.warn('[SACRAMENTS] container sacraments-modules-container non trovato'); return; }
        container.innerHTML = '';
        switch(currentTab) {
            case 'baptisms':
                container.innerHTML = `
                    <div class="section-header"><h3>Battesimi</h3><div class="toolbar"><button id="add-baptism-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi Battesimo</span></button><button id="export-baptisms-btn-2" class="btn btn-outline"><i data-lucide="download"></i><span style="margin-left:0.4rem">Esporta Battesimi</span></button></div></div>
                    <div class="filters-bar" style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                        <input id="filter-b-search" placeholder="Cerca per nome o genitori..." style="flex:1" />
                        <input id="filter-b-parish" placeholder="Parrocchia" style="width:180px" />
                        <input id="filter-b-from" type="date" style="width:150px" />
                        <input id="filter-b-to" type="date" style="width:150px" />
                        <button id="filter-b-clear" class="btn btn-outline">Reset</button>
                    </div>
                    <div id="baptisms-list" class="list-container"></div>
                `;
                renderBaptisms();
                bindBaptismsUI();
                break;
            case 'marriages':
                container.innerHTML = `
                    <div class="section-header"><h3>Matrimoni</h3><div class="toolbar"><button id="add-marriage-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi Matrimonio</span></button><button id="export-marriages-btn-2" class="btn btn-outline"><i data-lucide="download"></i><span style="margin-left:0.4rem">Esporta Matrimoni</span></button></div></div>
                    <div class="filters-bar" style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                        <input id="filter-m-search" placeholder="Cerca per nome sposi..." style="flex:1" />
                        <input id="filter-m-parish" placeholder="Parrocchia" style="width:180px" />
                        <input id="filter-m-from" type="date" style="width:150px" />
                        <input id="filter-m-to" type="date" style="width:150px" />
                        <button id="filter-m-clear" class="btn btn-outline">Reset</button>
                    </div>
                    <div id="marriages-list" class="list-container"></div>
                `;
                renderMarriages();
                bindMarriagesUI();
                break;
            case 'funerals':
                container.innerHTML = `
                    <div class="section-header"><h3>Esequie</h3><div class="toolbar"><button id="add-funeral-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi Esequie</span></button><button id="export-funerals-btn-2" class="btn btn-outline"><i data-lucide="download"></i><span style="margin-left:0.4rem">Esporta Esequie</span></button></div></div>
                    <div class="filters-bar" style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                        <input id="filter-f-search" placeholder="Cerca per nome..." style="flex:1" />
                        <input id="filter-f-from" type="date" style="width:150px" />
                        <input id="filter-f-to" type="date" style="width:150px" />
                        <button id="filter-f-clear" class="btn btn-outline">Reset</button>
                    </div>
                    <div id="funerals-list" class="list-container"></div>
                `;
                renderFunerals();
                bindFuneralsUI();
                break;
            case 'celebrations':
                container.innerHTML = `
                    <div class="section-header"><h3>Altre Celebrazioni</h3><div class="toolbar"><button id="add-celebration-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi</span></button></div></div>
                    <div id="celebrations-list" class="list-container"></div>
                `;
                renderCelebrations();
                bindCelebrationsUI();
                break;
            case 'catechesi':
                container.innerHTML = `
                    <div class="section-header"><h3>Percorsi Catechistici</h3><div class="toolbar"><button id="add-catechesi-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi Percorso</span></button><button id="export-catechesi-btn" class="btn btn-outline"><i data-lucide="download"></i><span style="margin-left:0.4rem">Esporta Catechesi</span></button></div></div>
                    <div class="filters-bar" style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                        <input id="filter-k-search" placeholder="Cerca per nome studente..." style="flex:1" />
                        <button id="filter-k-clear" class="btn btn-outline">Reset</button>
                    </div>
                    <div id="catechesi-list" class="list-container"></div>
                `;
                renderCatechesi();
                bindCatechesiUI();
                break;
            case 'intentions':
                container.innerHTML = `
                    <div class="section-header"><h3>Intenzioni Messe</h3><div class="toolbar"><button id="add-intention-btn" class="btn btn-primary"><i data-lucide="plus"></i><span style="margin-left:0.4rem">Aggiungi Intenzione</span></button><button id="export-intentions-btn" class="btn btn-outline"><i data-lucide="download"></i><span style="margin-left:0.4rem">Esporta Intenzioni</span></button></div></div>
                    <div class="filters-bar" style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                        <input id="filter-i-search" placeholder="Cerca per titolo..." style="flex:1" />
                        <button id="filter-i-clear" class="btn btn-outline">Reset</button>
                    </div>
                    <div id="intentions-list" class="list-container"></div>
                `;
                renderIntentions();
                bindIntentionsUI();
                break;
        }
    }

    // Bind UI events per modulo dopo il render dinamico
    function bindBaptismsUI() {
        const addB = document.getElementById('add-baptism-btn'); if (addB) addB.addEventListener('click', showBaptismForm);
        const expB = document.getElementById('export-baptisms-btn-2'); if (expB && typeof ReportsModule !== 'undefined' && ReportsModule.generateBaptismsPDF) expB.onclick = ReportsModule.generateBaptismsPDF;
        [ ['filter-b-search', renderBaptisms], ['filter-b-parish', renderBaptisms], ['filter-b-from', renderBaptisms], ['filter-b-to', renderBaptisms], ['filter-b-clear', () => { document.getElementById('filter-b-search').value=''; document.getElementById('filter-b-parish').value=''; document.getElementById('filter-b-from').value=''; document.getElementById('filter-b-to').value=''; renderBaptisms(); }], ].forEach(([id,fn])=>{ const el=document.getElementById(id); if(!el) return; const ev = el.tagName === 'BUTTON' ? 'click' : 'input'; el.addEventListener(ev, fn); });
    }
    function bindMarriagesUI() {
        const addM = document.getElementById('add-marriage-btn'); if (addM) addM.addEventListener('click', showMarriageForm);
        const expM = document.getElementById('export-marriages-btn-2'); if (expM && typeof ReportsModule !== 'undefined' && ReportsModule.generateMarriagesPDF) expM.onclick = ReportsModule.generateMarriagesPDF;
        [ ['filter-m-search', renderMarriages], ['filter-m-parish', renderMarriages], ['filter-m-from', renderMarriages], ['filter-m-to', renderMarriages], ['filter-m-clear', () => { document.getElementById('filter-m-search').value=''; document.getElementById('filter-m-parish').value=''; document.getElementById('filter-m-from').value=''; document.getElementById('filter-m-to').value=''; renderMarriages(); }], ].forEach(([id,fn])=>{ const el=document.getElementById(id); if(!el) return; const ev = el.tagName === 'BUTTON' ? 'click' : 'input'; el.addEventListener(ev, fn); });
    }
    function bindFuneralsUI() {
        const addF = document.getElementById('add-funeral-btn'); if (addF) addF.addEventListener('click', showFuneralForm);
        const expF = document.getElementById('export-funerals-btn-2'); if (expF && typeof ReportsModule !== 'undefined' && ReportsModule.generateFuneralsPDF) expF.onclick = ReportsModule.generateFuneralsPDF;
        [ ['filter-f-search', renderFunerals], ['filter-f-from', renderFunerals], ['filter-f-to', renderFunerals], ['filter-f-clear', ()=>{ document.getElementById('filter-f-search').value=''; document.getElementById('filter-f-from').value=''; document.getElementById('filter-f-to').value=''; renderFunerals(); }], ].forEach(([id,fn])=>{ const el=document.getElementById(id); if(!el) return; const ev = el.tagName === 'BUTTON' ? 'click' : 'input'; el.addEventListener(ev, fn); });
    }
    function bindCelebrationsUI() {
        const addC = document.getElementById('add-celebration-btn'); if (addC) addC.addEventListener('click', showCelebrationForm);
    }
    function bindCatechesiUI() {
        const addCat = document.getElementById('add-catechesi-btn'); if (addCat) addCat.addEventListener('click', showCatechesiForm);
        const expCat = document.getElementById('export-catechesi-btn'); if (expCat && typeof ReportsModule !== 'undefined' && ReportsModule.generateCatechesiPDF) expCat.onclick = ReportsModule.generateCatechesiPDF;
        [ ['filter-k-search', renderCatechesi], ['filter-k-clear', ()=>{ document.getElementById('filter-k-search').value=''; renderCatechesi(); }], ].forEach(([id,fn])=>{ const el=document.getElementById(id); if(!el) return; const ev = el.tagName === 'BUTTON' ? 'click' : 'input'; el.addEventListener(ev, fn); });
    }
    function bindIntentionsUI() {
        const addI = document.getElementById('add-intention-btn'); if (addI) addI.addEventListener('click', showIntentionForm);
        const expI = document.getElementById('export-intentions-btn'); if (expI && typeof ReportsModule !== 'undefined' && ReportsModule.generateIntentionsPDF) expI.onclick = ReportsModule.generateIntentionsPDF;
        [ ['filter-i-search', renderIntentions], ['filter-i-clear', ()=>{ document.getElementById('filter-i-search').value=''; renderIntentions(); }], ].forEach(([id,fn])=>{ const el=document.getElementById(id); if(!el) return; const ev = el.tagName === 'BUTTON' ? 'click' : 'input'; el.addEventListener(ev, fn); });
    }

    // Navigazione diretta da menu
    function showSub(name){
        console.log('[SACRAMENTS] showSub chiamato con:', name);
        showView('sacraments');
        currentTab = name;
        renderTabs();
        renderCurrentModule();
        // Forza il re-binding degli eventi dei tab (workaround per click da menu)
        setTimeout(() => {
            console.log('[SACRAMENTS] setTimeout renderTabs dopo showSub');
            renderTabs();
        }, 0);
    }


    /* BAPTISMS */
    function renderBaptisms(){
        const list = document.getElementById('baptisms-list'); if(!list) return; list.innerHTML='';
        let items = Storage.load('baptisms') || [];
        // apply filters
        const q = (document.getElementById('filter-b-search')?.value || '').trim().toLowerCase();
        const parish = (document.getElementById('filter-b-parish')?.value || '').trim().toLowerCase();
        const from = document.getElementById('filter-b-from')?.value;
        const to = document.getElementById('filter-b-to')?.value;
        if (q) items = items.filter(b => (b.name||'').toLowerCase().includes(q) || (b.parents||'').toLowerCase().includes(q));
        if (parish) items = items.filter(b => (b.parishRef||'').toLowerCase().includes(parish));
        if (from) items = items.filter(b => (b.baptismDate||'') >= from);
        if (to) items = items.filter(b => (b.baptismDate||'') <= to);
        if (!items.length) { list.innerHTML = '<p class="muted">Nessun battesimo registrato.</p>'; return; }
        items.forEach((b,i)=>{
            const el = document.createElement('div'); el.className='list-item';
            el.innerHTML = `<div><strong>${b.name}</strong><p>Nato: ${b.birthDate||'—'} • Battesimo: ${b.baptismDate||'—'}</p><p class="muted">Genitori: ${b.parents||''} • Parrocchia: ${b.parishRef||'—'}</p><p class="muted">Certificato: ${b.certificateNumber||'—'}</p></div><div><button class="btn btn-outline" data-index="${i}" data-action="edit-b">Modifica</button> <button class="btn btn-secondary" data-index="${i}" data-action="remove-b">Elimina</button> <button class="btn btn-primary" data-index="${i}" data-action="cert-b">Certificato</button></div>`;
            list.appendChild(el);
        });
        list.querySelectorAll('button[data-action]').forEach(btn=>{
            const act = btn.getAttribute('data-action'); const idx = parseInt(btn.getAttribute('data-index'),10);
            if (act === 'edit-b') btn.onclick = ()=>editBaptism(idx);
            if (act === 'remove-b') btn.onclick = ()=>removeBaptism(idx);
            if (act === 'cert-b') btn.onclick = ()=>generateBaptismCertificate(idx);
        });
    }

    function showBaptismForm(defaults={}){ console.log('showBaptismForm called', defaults);
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = defaults.name ? 'Modifica Battesimo' : 'Nuovo Battesimo';
        body.innerHTML = `
            <p class="modal-subtitle">Registra battesimo. Verrà generato un certificato su richiesta.</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome</label><input id="b_name" value="${defaults.name||''}" /></div>
                <div class="form-field"><label>Data nascita</label><input id="b_birth" placeholder="YYYY-MM-DD" value="${defaults.birthDate||''}" /></div>
                <div class="form-field"><label>Data battesimo</label><input id="b_baptism" placeholder="YYYY-MM-DD" value="${defaults.baptismDate||''}" /></div>
                <div class="form-field full"><label>Genitori</label><input id="b_parents" value="${defaults.parents||''}" /></div>
                <div class="form-field"><label>Padrino/Madrina</label><input id="b_godparents" value="${defaults.godparents||''}" /></div>
                <div class="form-field"><label>Celebrante</label><input id="b_celebrant" value="${defaults.celebrant||''}" /></div>
                <div class="form-field"><label>Numero certificato</label><input id="b_cert" placeholder="(opzionale)" value="${defaults.certificateNumber||''}" /></div>
                <div class="form-field"><label>Riferimento parrocchiale</label><input id="b_parishRef" placeholder="Parrocchia" value="${defaults.parishRef||''}" /></div>
                <div class="form-field full"><label>Note</label><textarea id="b_notes" style="height:80px">${defaults.notes||''}</textarea></div>
            </div>
            <div class="form-actions"><button id="cancel-b-btn" class="btn btn-secondary">Annulla</button><button id="save-b-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-b-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-b-btn').onclick = ()=>{
            const name = (document.getElementById('b_name').value||'').trim(); if (!name) { showToast('Nome richiesto', 'error'); return; }
            const items = Storage.load('baptisms') || [];
            const cert = (document.getElementById('b_cert').value||'').trim() || `BAPT-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`;
            const b = { name, birthDate:document.getElementById('b_birth').value.trim(), baptismDate:document.getElementById('b_baptism').value.trim(), parents:document.getElementById('b_parents').value.trim(), godparents:document.getElementById('b_godparents').value.trim(), celebrant:document.getElementById('b_celebrant').value.trim(), certificateNumber: cert, parishRef: document.getElementById('b_parishRef').value.trim(), notes:document.getElementById('b_notes').value.trim() };
            if (defaults.index != null) { items[defaults.index] = b;} else { items.push(b); }
            Storage.save('baptisms', items); renderBaptisms(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof showView === 'function') showView('sacraments');
        }
    }

    function editBaptism(i){ const items = Storage.load('baptisms')||[]; if(!items[i]) return; showBaptismForm({...items[i], index:i}); }
    function removeBaptism(i){ const items = Storage.load('baptisms')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione di "${items[i].name}"?`)) return; items.splice(i,1); Storage.save('baptisms', items); renderBaptisms(); }

    function generateBaptismCertificate(i){ const items = Storage.load('baptisms')||[]; const b = items[i]; if(!b){ showToast && showToast('Battesimo non trovato','error'); return; }
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        // try to draw logo if present
        try{
            const logo = document.getElementById('org-logo');
            if (logo && logo.complete && logo.naturalWidth > 0){
                const canvas = document.createElement('canvas'); canvas.width = logo.naturalWidth; canvas.height = logo.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(logo,0,0);
                const dataUrl = canvas.toDataURL('image/png');
                doc.addImage(dataUrl, 'PNG', 40, 40, 80, 80);
                doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('Certificato di Battesimo', 140, 80);
            } else {
                doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('Certificato di Battesimo', 40, 80);
            }
        }catch(e){ doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('Certificato di Battesimo', 40, 80); }
        doc.setFontSize(12); doc.setFont('helvetica','normal');
        let y = 140;
        doc.text(`Numero certificato: ${b.certificateNumber||'—'}`, 40, y); y+=18;
        if (b.parishRef) { doc.text(`Parrocchia: ${b.parishRef}`, 40, y); y+=18; }
        doc.text(`Nome: ${b.name}`, 40, y); y+=18;
        doc.text(`Data di nascita: ${b.birthDate||'—'}`, 40, y); y+=16;
        doc.text(`Data battesimo: ${b.baptismDate||'—'}`, 40, y); y+=16;
        doc.text(`Genitori: ${b.parents||'—'}`, 40, y); y+=16;
        doc.text(`Padrino/Madrina: ${b.godparents||'—'}`, 40, y); y+=16;
        doc.text(`Celebrante: ${b.celebrant||'—'}`, 40, y); y+=24;
        doc.text(`Note: ${b.notes||''}`, 40, y); y += 40;
        // signature area
        try{ const h = doc.internal.pageSize.getHeight(); const signY = h - 120; doc.setLineWidth(0.6); doc.line(80, signY, 260, signY); doc.setFontSize(11); doc.text('Firma del celebrante', 80, signY + 16); doc.setFontSize(9); doc.setTextColor(110); doc.text('creato da: www.ldm4app.com', 40, h - 28);}catch(e){/* ignore */}
        const fname = `certificato-battesimo-${(b.name||'').replace(/\s+/g,'_')}.pdf`;
        doc.save(fname);
    }

    /* MARRIAGES */
    function renderMarriages(){ const list = document.getElementById('marriages-list'); if(!list) return; list.innerHTML=''; let items = Storage.load('marriages')||[];
        const q = (document.getElementById('filter-m-search')?.value || '').trim().toLowerCase();
        const parish = (document.getElementById('filter-m-parish')?.value || '').trim().toLowerCase();
        const from = document.getElementById('filter-m-from')?.value;
        const to = document.getElementById('filter-m-to')?.value;
        if (q) items = items.filter(m => ((m.spouseA||'')+ ' ' + (m.spouseB||'')).toLowerCase().includes(q));
        if (parish) items = items.filter(m => (m.parish||'').toLowerCase().includes(parish));
        if (from) items = items.filter(m => (m.date||'') >= from);
        if (to) items = items.filter(m => (m.date||'') <= to);
        if(!items.length){ list.innerHTML = '<p class="muted">Nessun matrimonio registrato.</p>'; return; }
        items.forEach((m,i)=>{ const el=document.createElement('div'); el.className='list-item'; el.innerHTML=`<div><strong>${m.spouseA} & ${m.spouseB}</strong><p>Data: ${m.date||'—'} • Parrocchia: ${m.parish||''}</p><p class="muted">Testimoni: ${m.witnesses||''}</p></div><div><button class="btn btn-outline" data-action="edit-m" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove-m" data-index="${i}">Elimina</button></div>`; list.appendChild(el); }); list.querySelectorAll('button[data-action]').forEach(btn=>{ const a=btn.getAttribute('data-action'); const idx=parseInt(btn.getAttribute('data-index'),10); if(a==='edit-m') btn.onclick=()=>editMarriage(idx); if(a==='remove-m') btn.onclick=()=>removeMarriage(idx); }); }

    function showMarriageForm(defaults={}){ console.log('showMarriageForm called', defaults); const body=document.getElementById('modal-body'); if(!body) return; document.getElementById('modal-title').textContent= defaults.spouseA ? 'Modifica Matrimonio' : 'Nuovo Matrimonio'; body.innerHTML=`<p class="modal-subtitle">Registra un matrimonio.</p><div class="form-grid"><div class="form-field"><label>Sposo/a A</label><input id="m_a" value="${defaults.spouseA||''}" /></div><div class="form-field"><label>Sposo/a B</label><input id="m_b" value="${defaults.spouseB||''}" /></div><div class="form-field"><label>Data</label><input id="m_date" placeholder="YYYY-MM-DD" value="${defaults.date||''}" /></div><div class="form-field"><label>Parrocchia</label><input id="m_parish" value="${defaults.parish||''}" /></div><div class="form-field full"><label>Testimoni</label><input id="m_witnesses" value="${defaults.witnesses||''}" /></div><div class="form-field full"><label>Note</label><textarea id="m_notes" style="height:80px">${defaults.notes||''}</textarea></div></div><div class="form-actions"><button id="cancel-m-btn" class="btn btn-secondary">Annulla</button><button id="save-m-btn" class="btn btn-primary">Salva</button></div>`; const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('open'); const first=modal.querySelector('input,textarea,select'); if(first && typeof first.focus==='function') first.focus(); const escHandler=(e)=>{ if(e.key==='Escape'){ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } }; document.addEventListener('keydown', escHandler); document.getElementById('cancel-m-btn').onclick=()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);}; document.getElementById('save-m-btn').onclick=()=>{ const a=(document.getElementById('m_a').value||'').trim(); const b=(document.getElementById('m_b').value||'').trim(); if(!a||!b){ showToast('Inserisci entrambi i nomi', 'error'); return; } const items=Storage.load('marriages')||[]; const item={spouseA:a, spouseB:b, date:document.getElementById('m_date').value.trim(), parish:document.getElementById('m_parish').value.trim(), witnesses:document.getElementById('m_witnesses').value.trim(), notes:document.getElementById('m_notes').value.trim()}; if(defaults.index!=null){ items[defaults.index]=item; } else { items.push(item);} Storage.save('marriages', items); renderMarriages(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if(typeof showView==='function') showView('sacraments'); } }
    function editMarriage(i){ const items=Storage.load('marriages')||[]; if(!items[i]) return; showMarriageForm({...items[i], index:i}); }
    function removeMarriage(i){ const items=Storage.load('marriages')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione del matrimonio tra "${items[i].spouseA}" e "${items[i].spouseB}"?`)) return; items.splice(i,1); Storage.save('marriages', items); renderMarriages(); }

    /* FUNERALS */
    function renderFunerals(){ const list=document.getElementById('funerals-list'); if(!list) return; list.innerHTML=''; let items=Storage.load('funerals')||[];
        const q = (document.getElementById('filter-f-search')?.value || '').trim().toLowerCase();
        const from = document.getElementById('filter-f-from')?.value;
        const to = document.getElementById('filter-f-to')?.value;
        if (q) items = items.filter(f => (f.name||'').toLowerCase().includes(q));
        if (from) items = items.filter(f => (f.deathDate||'') >= from);
        if (to) items = items.filter(f => (f.deathDate||'') <= to);
        if(!items.length){ list.innerHTML='<p class="muted">Nessuna esequie registrata.</p>'; return; }
        items.forEach((f,i)=>{ const el=document.createElement('div'); el.className='list-item'; el.innerHTML=`<div><strong>${f.name}</strong><p>Decesso: ${f.deathDate||'—'} • Rito: ${f.ritualDate||'—'}</p><p class="muted">Sepoltura: ${f.burial||''}</p></div><div><button class="btn btn-outline" data-action="edit-f" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove-f" data-index="${i}">Elimina</button></div>`; list.appendChild(el); }); list.querySelectorAll('button[data-action]').forEach(btn=>{ const a=btn.getAttribute('data-action'); const idx=parseInt(btn.getAttribute('data-index'),10); if(a==='edit-f') btn.onclick=()=>editFuneral(idx); if(a==='remove-f') btn.onclick=()=>removeFuneral(idx); }); }
    function showFuneralForm(defaults={}){ console.log('showFuneralForm called', defaults); const body=document.getElementById('modal-body'); if(!body) return; document.getElementById('modal-title').textContent= defaults.name ? 'Modifica Esequie' : 'Nuova Esequie'; body.innerHTML=`<p class="modal-subtitle">Registra una esequie.</p><div class="form-grid"><div class="form-field"><label>Nome</label><input id="f_name" value="${defaults.name||''}" /></div><div class="form-field"><label>Data decesso</label><input id="f_death" placeholder="YYYY-MM-DD" value="${defaults.deathDate||''}" /></div><div class="form-field"><label>Data rito funebre</label><input id="f_ritual" placeholder="YYYY-MM-DD" value="${defaults.ritualDate||''}" /></div><div class="form-field full"><label>Luogo sepoltura</label><input id="f_burial" value="${defaults.burial||''}" /></div><div class="form-field full"><label>Annotazioni</label><textarea id="f_notes" style="height:80px">${defaults.notes||''}</textarea></div></div><div class="form-actions"><button id="cancel-f-btn" class="btn btn-secondary">Annulla</button><button id="save-f-btn" class="btn btn-primary">Salva</button></div>`; const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('open'); const first=modal.querySelector('input,textarea,select'); if(first && typeof first.focus==='function') first.focus(); const escHandler=(e)=>{ if(e.key==='Escape'){ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } }; document.addEventListener('keydown', escHandler); document.getElementById('cancel-f-btn').onclick=()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);}; document.getElementById('save-f-btn').onclick=()=>{ const n=(document.getElementById('f_name').value||'').trim(); if(!n){ showToast('Nome richiesto','error'); return; } const items=Storage.load('funerals')||[]; const item={name:n, deathDate:document.getElementById('f_death').value.trim(), ritualDate:document.getElementById('f_ritual').value.trim(), burial:document.getElementById('f_burial').value.trim(), notes:document.getElementById('f_notes').value.trim()}; if(defaults.index!=null){ items[defaults.index]=item; } else { items.push(item); } Storage.save('funerals', items); renderFunerals(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if(typeof showView==='function') showView('sacraments'); } }
    function editFuneral(i){ const items=Storage.load('funerals')||[]; if(!items[i]) return; showFuneralForm({...items[i], index:i}); }
    function removeFuneral(i){ const items=Storage.load('funerals')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione di "${items[i].name}"?`)) return; items.splice(i,1); Storage.save('funerals', items); renderFunerals(); }

    /* CELEBRATIONS (Other) */
    function renderCelebrations(){ const list=document.getElementById('celebrations-list'); if(!list) return; list.innerHTML=''; const items=Storage.load('celebrations')||[]; if(!items.length){ list.innerHTML='<p class="muted">Nessuna celebrazione registrata.</p>'; return; } items.forEach((c,i)=>{ const el=document.createElement('div'); el.className='list-item'; el.innerHTML=`<div><strong>${c.title}</strong><p>Tipo: ${c.type||''} • Data: ${c.date||''}</p><p class="muted">Note: ${c.notes||''}</p></div><div><button class="btn btn-outline" data-action="edit-c" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove-c" data-index="${i}">Elimina</button></div>`; list.appendChild(el); }); list.querySelectorAll('button[data-action]').forEach(btn=>{ const a=btn.getAttribute('data-action'); const idx=parseInt(btn.getAttribute('data-index'),10); if(a==='edit-c') btn.onclick=()=>editCelebration(idx); if(a==='remove-c') btn.onclick=()=>removeCelebration(idx); }); }
    function showCelebrationForm(defaults={}){ console.log('showCelebrationForm called', defaults); const body=document.getElementById('modal-body'); if(!body) return; document.getElementById('modal-title').textContent= defaults.title ? 'Modifica Celebrazione' : 'Nuova Celebrazione'; body.innerHTML=`<p class="modal-subtitle">Registra celebrazione (Prima Comunione, Cresima, Messa speciale).</p><div class="form-grid"><div class="form-field"><label>Titolo</label><input id="c_title" value="${defaults.title||''}" /></div><div class="form-field"><label>Tipo</label><input id="c_type" value="${defaults.type||''}" /></div><div class="form-field"><label>Data</label><input id="c_date" value="${defaults.date||''}" /></div><div class="form-field full"><label>Note</label><textarea id="c_notes" style="height:80px">${defaults.notes||''}</textarea></div></div><div class="form-actions"><button id="cancel-c-btn" class="btn btn-secondary">Annulla</button><button id="save-c-btn" class="btn btn-primary">Salva</button></div>`; const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('open'); const first=modal.querySelector('input,textarea,select'); if(first && typeof first.focus==='function') first.focus(); const escHandler=(e)=>{ if(e.key==='Escape'){ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } }; document.addEventListener('keydown', escHandler); document.getElementById('cancel-c-btn').onclick=()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);}; document.getElementById('save-c-btn').onclick=()=>{ const title=(document.getElementById('c_title').value||'').trim(); if(!title){ showToast('Titolo richiesto','error'); return; } const items=Storage.load('celebrations')||[]; const item={title, type:document.getElementById('c_type').value.trim(), date:document.getElementById('c_date').value.trim(), notes:document.getElementById('c_notes').value.trim()}; if(defaults.index!=null){ items[defaults.index]=item; } else { items.push(item); } Storage.save('celebrations', items); renderCelebrations(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if(typeof showView==='function') showView('sacraments'); } }
    function editCelebration(i){ const items=Storage.load('celebrations')||[]; if(!items[i]) return; showCelebrationForm({...items[i], index:i}); }
    function removeCelebration(i){ const items=Storage.load('celebrations')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione di "${items[i].title}"?`)) return; items.splice(i,1); Storage.save('celebrations', items); renderCelebrations(); }

    /* CATECHESI */
    function renderCatechesi(){ const list=document.getElementById('catechesi-list'); if(!list) return; list.innerHTML=''; const items=Storage.load('catechesi')||[]; if(!items.length){ list.innerHTML='<p class="muted">Nessun percorso catechistico registrato.</p>'; return; } items.forEach((c,i)=>{ const el=document.createElement('div'); el.className='list-item'; el.innerHTML=`<div><strong>${c.studentName}</strong><p>Corso: ${c.course||''} • Stato: ${c.status||''}</p></div><div><button class="btn btn-outline" data-action="edit-k" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove-k" data-index="${i}">Elimina</button></div>`; list.appendChild(el); }); list.querySelectorAll('button[data-action]').forEach(btn=>{ const a=btn.getAttribute('data-action'); const idx=parseInt(btn.getAttribute('data-index'),10); if(a==='edit-k') btn.onclick=()=>editCatechesi(idx); if(a==='remove-k') btn.onclick=()=>removeCatechesi(idx); }); }
    function showCatechesiForm(defaults={}){ console.log('showCatechesiForm called', defaults); const body=document.getElementById('modal-body'); if(!body) return; document.getElementById('modal-title').textContent= defaults.studentName ? 'Modifica Percorso' : 'Nuovo Percorso Catechistico'; body.innerHTML=`<p class="modal-subtitle">Registra percorso per Prima Comunione / Cresima.</p><div class="form-grid"><div class="form-field"><label>Nome ragazzo/a</label><input id="k_name" value="${defaults.studentName||''}" /></div><div class="form-field"><label>Corso</label><input id="k_course" value="${defaults.course||''}" /></div><div class="form-field"><label>Stato</label><input id="k_status" value="${defaults.status||''}" /></div><div class="form-field full"><label>Note</label><textarea id="k_notes" style="height:80px">${defaults.notes||''}</textarea></div></div><div class="form-actions"><button id="cancel-k-btn" class="btn btn-secondary">Annulla</button><button id="save-k-btn" class="btn btn-primary">Salva</button></div>`; const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('open'); const first=modal.querySelector('input,textarea,select'); if(first && typeof first.focus==='function') first.focus(); const escHandler=(e)=>{ if(e.key==='Escape'){ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } }; document.addEventListener('keydown', escHandler); document.getElementById('cancel-k-btn').onclick=()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);}; document.getElementById('save-k-btn').onclick=()=>{ const n=(document.getElementById('k_name').value||'').trim(); if(!n){ showToast('Nome richiesto','error'); return; } const items=Storage.load('catechesi')||[]; const item={studentName:n, course:document.getElementById('k_course').value.trim(), status:document.getElementById('k_status').value.trim(), notes:document.getElementById('k_notes').value.trim()}; if(defaults.index!=null){ items[defaults.index]=item; } else { items.push(item); } Storage.save('catechesi', items); renderCatechesi(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if(typeof showView==='function') showView('sacraments'); } }
    function editCatechesi(i){ const items=Storage.load('catechesi')||[]; if(!items[i]) return; showCatechesiForm({...items[i], index:i}); }
    function removeCatechesi(i){ const items=Storage.load('catechesi')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione di "${items[i].studentName}"?`)) return; items.splice(i,1); Storage.save('catechesi', items); renderCatechesi(); }

    /* INTENTIONS (Messe) */
    function renderIntentions(){ const list=document.getElementById('intentions-list'); if(!list) return; list.innerHTML=''; const items=Storage.load('intentions')||[]; if(!items.length){ list.innerHTML='<p class="muted">Nessuna intenzione registrata.</p>'; return; } items.forEach((it,i)=>{ const el=document.createElement('div'); el.className='list-item'; el.innerHTML=`<div><strong>${it.title}</strong><p>Data: ${it.date||''} • Offerta: ${it.offering||''}</p><p class="muted">Note: ${it.notes||''}</p></div><div><button class="btn btn-outline" data-action="edit-i" data-index="${i}">Modifica</button> <button class="btn btn-secondary" data-action="remove-i" data-index="${i}">Elimina</button></div>`; list.appendChild(el); }); list.querySelectorAll('button[data-action]').forEach(btn=>{ const a=btn.getAttribute('data-action'); const idx=parseInt(btn.getAttribute('data-index'),10); if(a==='edit-i') btn.onclick=()=>editIntention(idx); if(a==='remove-i') btn.onclick=()=>removeIntention(idx); }); }
    function showIntentionForm(defaults={}){ console.log('showIntentionForm called', defaults); const body=document.getElementById('modal-body'); if(!body) return; document.getElementById('modal-title').textContent= defaults.title ? 'Modifica Intenzione' : 'Nuova Intenzione Messa'; body.innerHTML=`<p class="modal-subtitle">Registra intenzione per Messa e offerta.</p><div class="form-grid"><div class="form-field"><label>Titolo</label><input id="i_title" value="${defaults.title||''}" /></div><div class="form-field"><label>Data</label><input id="i_date" value="${defaults.date||''}" /></div><div class="form-field"><label>Offerta</label><input id="i_offering" value="${defaults.offering||''}" /></div><div class="form-field full"><label>Note</label><textarea id="i_notes" style="height:80px">${defaults.notes||''}</textarea></div></div><div class="form-actions"><button id="cancel-i-btn" class="btn btn-secondary">Annulla</button><button id="save-i-btn" class="btn btn-primary">Salva</button></div>`; const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('open'); const first=modal.querySelector('input,textarea,select'); if(first && typeof first.focus==='function') first.focus(); const escHandler=(e)=>{ if(e.key==='Escape'){ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } }; document.addEventListener('keydown', escHandler); document.getElementById('cancel-i-btn').onclick=()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);}; document.getElementById('save-i-btn').onclick=()=>{ const title=(document.getElementById('i_title').value||'').trim(); if(!title){ showToast('Titolo richiesto','error'); return; } const items=Storage.load('intentions')||[]; const item={title, date:document.getElementById('i_date').value.trim(), offering:document.getElementById('i_offering').value.trim(), notes:document.getElementById('i_notes').value.trim()}; if(defaults.index!=null){ items[defaults.index]=item; } else { items.push(item); } Storage.save('intentions', items); renderIntentions(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if(typeof showView==='function') showView('sacraments'); } }
    function editIntention(i){ const items=Storage.load('intentions')||[]; if(!items[i]) return; showIntentionForm({...items[i], index:i}); }
    function removeIntention(i){ const items=Storage.load('intentions')||[]; if(!items[i]) return; if(!confirm(`Confermi eliminazione di "${items[i].title}"?`)) return; items.splice(i,1); Storage.save('intentions', items); renderIntentions(); }

    /* Export helpers for ReportsModule */
    function getAll(){ return { baptisms: Storage.load('baptisms')||[], marriages: Storage.load('marriages')||[], funerals: Storage.load('funerals')||[], celebrations: Storage.load('celebrations')||[], catechesi: Storage.load('catechesi')||[], intentions: Storage.load('intentions')||[] }; }

    return { init, showSub, renderBaptisms, renderMarriages, renderFunerals, renderCelebrations, renderCatechesi, renderIntentions, showBaptismForm, showMarriageForm, showFuneralForm, showCelebrationForm, showCatechesiForm, showIntentionForm, editBaptism, removeBaptism, generateBaptismCertificate };
})();

window.SacramentsModule = SacramentsModule;
console.log('[SACRAMENTS] SacramentsModule global:', window.SacramentsModule);
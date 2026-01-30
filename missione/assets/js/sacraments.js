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

```}]}**Narrative**: The final read truncated, but we've already created sacraments.js with content; good. Now continue to create viewer.js file. Read and create viewer.js. We already included create_file step earlier for sacraments.js. Now continue with viewer.js read and create. We already did for sacraments; need to do viewer.js; earlier I included it in batch 1 read. Let's fetch viewer.js content and create it. We previously read sacraments and created it. Need to fetch viewer.js content: we earlier read mission-app.js etc. viewer.js exists at assets/js/viewer.js; read and create it. We included reading earlier? We read utils, storage, auth, sacraments. Need viewer. Let's read viewer.js and create it. Also ensure that our pwa assets/js folder contains viewer.js. Use read_file and create_file as before. Next step: continue to copy remaining JS files in batches similarly. I'll proceed to read and create viewer.js and then the next batch of 5 files (app.js,dashboard.js,volunteers.js,projects.js,donors.js), then final batch (calendar.js,logistics.js,inventory.js,payments.js,sync.js,reports.js,startup-checks.js). Also copy the three JSON data files in root to pwa folder: sample-data.json etc. Let's proceed with viewer.js read and create. (I must ensure to preface status updates before each batch with short message per reminder: one sentence per action.) I'll state: 
// app.js - gestione vista e inizializzazione
console.log('app.js loaded');
try{ const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Debug: app.js caricato'; }catch(e){}
window.addEventListener('error', e => { console.error('Global JS error:', e.message, 'at', e.filename + ':' + e.lineno, e.error); try{ if (e.error && e.error.stack) console.error(e.error.stack); const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Errore JS: ' + (e.message || (e.error && e.error.message) || 'errore'); }catch(e){} });
window.addEventListener('unhandledrejection', e => { console.error('Unhandled promise rejection:', e.reason); try{ if (e.reason && e.reason.stack) console.error(e.reason.stack); const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Unhandled rejection'; }catch(e){} });

function showView(name) {
    console.log('[DEBUG] showView chiamato con:', name);
    const sections = document.querySelectorAll('.app-section');
    console.log('[DEBUG] Sezioni trovate:', sections.length);
    sections.forEach(s => {
        if (s.classList.contains('active')) console.log('[DEBUG] Rimuovo active da', s.id);
        s.classList.remove('active');
    });
    const id = name + '-section';
    const el = document.getElementById(id);
    console.log('[DEBUG] Cerco sezione con id:', id, '->', el);
    if (el) {
        el.classList.add('active');
        console.log('[DEBUG] Aggiungo active a', id);
        document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.toggle('active', b.getAttribute('data-section') === name));
        try{ const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Sezione: ' + name; }catch(e){}
        showToast && showToast('Aperta sezione: ' + name, 'info');
    } else {
        console.warn('[DEBUG] Nessuna sezione trovata per', id);
    }
}

function initApp() {
    try{
        console.log('initApp start');
        try{ const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Debug: initApp start'; }catch(e){}
        // icone
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();


    // Bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.addEventListener('click', () => showView(btn.getAttribute('data-section'))));

    // Sidebar toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle'); if (mobileToggle) mobileToggle.addEventListener('click', () => { const sb = document.getElementById('sidebar'); const isOpen = sb && sb.classList.toggle('open'); if (isOpen && typeof overlay !== 'undefined' && overlay) overlay.classList.add('open'); if (!isOpen && typeof overlay !== 'undefined' && overlay) overlay.classList.remove('open'); });
    const sidebarCloseBtn = document.getElementById('sidebar-close'); if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

    // Sidebar collapse (icons-only)
    const sidebarCollapse = document.getElementById('sidebar-collapse'); if (sidebarCollapse) sidebarCollapse.addEventListener('click', ()=>{
        const sb = document.getElementById('sidebar'); sb.classList.toggle('collapsed'); localStorage.setItem('sidebarCollapsed', sb.classList.contains('collapsed'));
    });
    // restore state
    try{ if (localStorage.getItem('sidebarCollapsed') === 'true') document.getElementById('sidebar').classList.add('collapsed'); }catch(e){}

    // Backup button
    const backupBtn = document.getElementById('backup-btn'); if (backupBtn) backupBtn.addEventListener('click', () => { console.log('backupBtn clicked'); if (typeof Storage !== 'undefined' && Storage.backupAll) Storage.backupAll(); });

    // Save all (explicit binding to ensure it works)
    const saveAllBtn = document.getElementById('save-all-btn'); if (saveAllBtn) saveAllBtn.addEventListener('click', () => { console.log('saveAllBtn clicked'); if (typeof SyncModule !== 'undefined' && SyncModule.exportData) SyncModule.exportData(); else document.querySelectorAll('[data-action="export-data"]').forEach(a=>a.click()); });

    // Sidebar settings toggle (also manage overlay)
    const settingsBtn = document.getElementById('sidebar-toggle'); const overlay = document.getElementById('sidebar-overlay');
    function showSettingsModal(){
        const body = document.getElementById('modal-body'); document.getElementById('modal-title').textContent = 'Impostazioni';
        body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px;">
                <label><input type="checkbox" id="settings-autobackup"> Abilita backup automatico</label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;gap:12px;">
                <button id="delete-all-data" class="btn btn-danger" style="flex:1;">Cancella tutti i dati</button>
                <button id="save-settings" class="btn btn-primary" style="flex:1;">Salva</button>
            </div>
            <div class="card" style="margin-top:22px;background:#f6f8fa;border:1px solid #e0e7ef;padding:1.2em 1.3em;border-radius:12px;">
                <h3 style="margin-top:0">Info &amp; Contatti</h3>
                <p style="margin-bottom:0.5em;">Programma creato da <a href='https://www.ldm4app.com' target='_blank' rel='noopener'>www.ldm4app.com</a></p>
                <p style="margin-bottom:0;">Per informazioni o supporto: <a href='mailto:info@ldm4app.com'>info@ldm4app.com</a></p>
            </div>
        `;
        document.getElementById('modal').classList.add('open');
        const closeBtn = document.querySelector('.modal-close'); if (closeBtn) closeBtn.onclick = () => document.getElementById('modal').classList.remove('open');
        document.getElementById('save-settings').onclick = ()=>{
            const autob = document.getElementById('settings-autobackup').checked; localStorage.setItem('autoBackup', autob ? '1' : '0');
            showToast && showToast('Impostazioni salvate', 'success'); document.getElementById('modal').classList.remove('open');
        }
        document.getElementById('delete-all-data').onclick = ()=>{
            if (confirm('Sei sicuro di voler cancellare TUTTI i dati? L’operazione è irreversibile!')) {
                // Cancella localStorage
                localStorage.clear();
                // Rimuovi anche la chiave initialized per evitare il ripristino automatico dei dati demo
                try { localStorage.removeItem('initialized'); } catch(e){}
                // Cancella cache
                if ('caches' in window) {
                    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => {
                        console.log('Cache eliminata');
                    });
                }
                // Deregistra i service worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for(let registration of registrations) {
                            registration.unregister();
                        }
                    });
                }
                showToast && showToast('Tutti i dati, cache e service worker sono stati cancellati', 'success');
                setTimeout(()=>location.reload(), 1200);
            }
        }
    }
    if (settingsBtn) settingsBtn.addEventListener('click', () => { console.log('settings button clicked'); showSettingsModal(); });
    // overlay remains to capture clicks when present
    if (overlay) { overlay.addEventListener('click', ()=>{ overlay.classList.remove('open'); }); }

    // Topbar delegated click handler as fallback (handles any buttons inside topbar)
    const topbar = document.querySelector('.top-navbar');
    if (topbar) topbar.addEventListener('click', e => {
        const btn = e.target.closest('button'); if (!btn) return;
        console.log('[DEBUG] Click su topbar:', btn.id || btn.className || btn.textContent.trim().slice(0,20));
        if (btn.id && btn.id.endsWith('-btn')) {
            const match = btn.id.match(/^(\w+)-btn$/);
            if (match && match[1] && match[1] !== 'save' && match[1] !== 'backup' && match[1] !== 'sidebar' && match[1] !== 'open') {
                console.log('[DEBUG] Provo showView per:', match[1]);
                showView(match[1]);
            }
        }
        if (btn.id === 'save-all-btn') { console.log('Topbar handler: save-all'); if (typeof SyncModule !== 'undefined' && SyncModule.exportData) SyncModule.exportData(); }
        else if (btn.id === 'backup-btn') { console.log('Topbar handler: backup'); if (typeof Storage !== 'undefined' && Storage.backupAll) Storage.backupAll(); }
        else if (btn.id === 'sidebar-toggle') { console.log('Topbar handler: sidebar-toggle'); // open settings modal instead of sidebar
            if (typeof showSettingsModal === 'function') showSettingsModal(); }
        // allow other inline handlers to run as usual
    });

    // Global delegated handler for "add-" buttons in case module binding fails
    document.addEventListener('click', e => {
        const btn = e.target.closest('button[id^="add-"]'); if (!btn) return;
        try{
            const id = btn.id; console.log('Global add-button click:', id);
            if (id === 'add-baptism-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showBaptismForm) return SacramentsModule.showBaptismForm();
            if (id === 'add-marriage-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showMarriageForm) return SacramentsModule.showMarriageForm();
            if (id === 'add-funeral-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showFuneralForm) return SacramentsModule.showFuneralForm();
            if (id === 'add-celebration-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showCelebrationForm) return SacramentsModule.showCelebrationForm();
            if (id === 'add-catechesi-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showCatechesiForm) return SacramentsModule.showCatechesiForm();
            if (id === 'add-intention-btn' && typeof SacramentsModule !== 'undefined' && SacramentsModule.showIntentionForm) return SacramentsModule.showIntentionForm();
        }catch(err){ console.error('Delegated add-handler failed', err); }
    });

    // Dropdowns in top navbar
    const dropdownToggles = document.querySelectorAll('.nav-dropdown .dropdown-toggle');
    console.log('Found dropdown toggles:', dropdownToggles.length);
    dropdownToggles.forEach((btn, idx) => {
        console.log('Binding dropdown toggle', idx, btn);
        btn.addEventListener('click', (e) => {
            console.log('Dropdown toggle clicked', idx, btn);
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            // if user clicked the chevron specifically, toggle menu; otherwise open section
            const clickedChevron = e.target.closest('.dropdown-icon');
            const section = btn.getAttribute('data-section');
            const parent = btn.closest('.nav-dropdown');
            const menu = parent.querySelector('.dropdown-menu');
            if (!clickedChevron && section) {
                console.log('Dropdown label clicked -> open section', section);
                showView(section);
                // close any open dropdowns
                document.querySelectorAll('.nav-dropdown.open').forEach(d => { d.classList.remove('open'); const b = d.querySelector('.dropdown-toggle'); if (b) b.setAttribute('aria-expanded','false'); const m = d.querySelector('.dropdown-menu'); if (m) m.style.display = 'none'; });
                return;
            }
            const isOpen = parent.classList.toggle('open');
            // ensure menu visible via inline style for robustness
            if (menu) menu.style.display = isOpen ? 'block' : 'none';
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            // close others
            document.querySelectorAll('.nav-dropdown.open').forEach(d => {
                if (d !== parent){ d.classList.remove('open'); const b = d.querySelector('.dropdown-toggle'); if (b) b.setAttribute('aria-expanded','false'); const m = d.querySelector('.dropdown-menu'); if (m) m.style.display = 'none'; }
            });
            // debug computed style
            try{
                const cs = window.getComputedStyle(menu);
                console.log('Dropdown menu computed display:', cs.display, 'visibility:', cs.visibility, 'height:', cs.height);
                console.log('Dropdown menu rect:', menu.getBoundingClientRect());
            }catch(e){ console.warn('No menu element found', e); }
        });
    });

    // Add logging to dropdown menu links
    const dropdownLinks = document.querySelectorAll('.nav-dropdown .dropdown-menu a');
    console.log('Found dropdown links:', dropdownLinks.length);
    dropdownLinks.forEach((a, i) => {
        a.addEventListener('click', (e) => {
            console.log('Dropdown link clicked', i, a.textContent.trim());
            e.preventDefault();
            e.stopPropagation();
            // try to extract showView param from inline onclick
            const onclick = a.getAttribute('onclick') || '';
            const m = onclick.match(/showView\('([^']+)'\)/);
            if (m && m[1]) { showView(m[1]); }
            // close all dropdowns
            document.querySelectorAll('.nav-dropdown.open').forEach(d=>{ d.classList.remove('open'); const b = d.querySelector('.dropdown-toggle'); if (b) b.setAttribute('aria-expanded','false'); const m = d.querySelector('.dropdown-menu'); if (m) m.style.display='none'; });
        });
    });

    // Add logging and behavior to primary nav buttons (non-dropdown)
    const primaryNavBtns = document.querySelectorAll('.navbar-main > .nav-btn:not(.dropdown-toggle)');
    console.log('Found primary nav buttons:', primaryNavBtns.length);
    primaryNavBtns.forEach((b,i)=>{ b.addEventListener('click', (e)=>{ console.log('Primary nav button clicked', i, b.textContent.trim()); e.preventDefault(); e.stopPropagation(); const onclick = b.getAttribute('onclick') || ''; const m = onclick.match(/showView\('([^']+)'\)/); if (m && m[1]) showView(m[1]); }); });

    // Ensure Reports top button always opens reports
    const reportsTopBtn = document.getElementById('reports-btn'); if (reportsTopBtn) reportsTopBtn.addEventListener('click', (e)=>{ e.preventDefault(); showView('reports'); });

    // Export buttons for section PDFs
    const bindExport = (id, fnName) => { const el = document.getElementById(id); if (el) el.addEventListener('click', ()=>{ if (typeof ReportsModule !== 'undefined' && ReportsModule[fnName]) ReportsModule[fnName](); else showToast && showToast('Modulo report non disponibile','error'); }); };
    bindExport('export-volunteers-btn', 'generateVolunteersPDF');
    bindExport('export-projects-btn', 'generateProjectsPDF');
    bindExport('export-donors-btn', 'generateDonorsPDF');
    bindExport('export-events-btn', 'generateEventsPDF');
    bindExport('export-inventory-btn', 'generateInventoryPDF');
    bindExport('export-shipments-btn', 'generateShipmentsPDF');
    bindExport('export-adoptions-btn', 'generateAdoptionsPDF');
    bindExport('export-all-pdf-btn', 'exportAllDataPDF');

    // Close dropdowns when clicking outside
    document.addEventListener('click', e => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown.open').forEach(d => { d.classList.remove('open'); const b = d.querySelector('.dropdown-toggle'); if (b) b.setAttribute('aria-expanded','false'); });
        }
    });

    // init modules (isolated to avoid one module error blocking others)
    try { console.log('Initializing modules...'); if (typeof DashboardModule !== 'undefined' && DashboardModule.init) DashboardModule.init(); console.log('DashboardModule.init done'); } catch (err) { console.error('Dashboard init failed', err); showToast && showToast('Errore inizializzazione Dashboard','error'); }
    try { if (typeof VolunteersModule !== 'undefined' && VolunteersModule.init) VolunteersModule.init(); console.log('VolunteersModule.init done'); } catch (err) { console.error('Volunteers init failed', err); showToast && showToast('Errore inizializzazione Volontari','error'); }
    try { if (typeof ProjectsModule !== 'undefined' && ProjectsModule.init) ProjectsModule.init(); console.log('ProjectsModule.init done'); } catch (err) { console.error('Projects init failed', err); showToast && showToast('Errore inizializzazione Progetti','error'); }
    try { if (typeof DonorsModule !== 'undefined' && DonorsModule.init) DonorsModule.init(); console.log('DonorsModule.init done'); } catch (err) { console.error('Donors init failed', err); showToast && showToast('Errore inizializzazione Donatori','error'); }
    try { if (typeof CalendarModule !== 'undefined' && CalendarModule.init) CalendarModule.init(); console.log('CalendarModule.init done'); } catch (err) { console.error('Calendar init failed', err); showToast && showToast('Errore inizializzazione Calendario','error'); }
    try { if (typeof ReportsModule !== 'undefined' && ReportsModule.generateSummaryPDF) {
        // lasciare disponibile la funzione di generazione report
        document.querySelectorAll('[data-action="refresh"]').forEach(b=>b.addEventListener('click', () => ReportsModule.generateSummaryPDF()));
        console.log('Reports binding done');
    } } catch (err) { console.error('Reports init failed', err); showToast && showToast('Errore inizializzazione Report','error'); }

    // Sacraments module init
    try { if (typeof SacramentsModule !== 'undefined' && SacramentsModule.init) { SacramentsModule.init(); console.log('SacramentsModule.init done'); } } catch (err) { console.error('Sacraments init failed', err); showToast && showToast('Errore inizializzazione Sacramenti','error'); }

    // seed sample data from sample-data.json once (se non già inizializzato)
    if (!Storage.load('initialized')) {
        // NON caricare più dati demo automaticamente dopo la cancellazione totale
        // Se vuoi ripristinare i dati demo, aggiungi manualmente la chiave 'initialized' o un pulsante apposito
        // (blocco vuoto intenzionale)
    }

    showView('dashboard');
    if (typeof AuthModule !== 'undefined') AuthModule.applyRoleVisibility();
    if (typeof I18n !== 'undefined') I18n.translateAll(localStorage.getItem('lang') || 'it');
    console.log('initApp finished');
    try{ const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Debug: initApp finished'; }catch(e){}
    }catch(err){ console.error('initApp crashed', err); try{ const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'initApp crashed: ' + (err && err.message); }catch(e){} showToast && showToast('Errore inizializzazione app','error'); }
}

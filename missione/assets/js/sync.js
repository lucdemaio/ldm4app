// sync.js - simple cloud sync (MVP, placeholder endpoint)
const SyncModule = (function(){
    const defaultEndpoint = 'https://example.com/api/sync';
    function init(){
        document.getElementById('sync-link')?.addEventListener('click', showSyncModal);
        // quick export/import handlers
        document.querySelectorAll('[data-action="export-data"]').forEach(a=>a.addEventListener('click', exportData));
        document.querySelectorAll('[data-action="import-data"]').forEach(a=>a.addEventListener('click', showImportDialog));
        document.querySelectorAll('[data-action="backup"]').forEach(a=>a.addEventListener('click', exportData));
    }

    function exportData(){
        const payload = {
            volunteers: Storage.load('volunteers') || [],
            projects: Storage.load('projects') || [],
            donors: Storage.load('donors') || [],
            events: Storage.load('events') || [],
            inventory: Storage.load('inventory') || []
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'mission-export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        showToast('Esportazione avviata', 'success');
    }

    function showImportDialog(){
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
        input.onchange = (e) => {
            const f = e.target.files[0]; if (!f) return; const reader = new FileReader();
            reader.onload = (ev) => {
                try { const data = JSON.parse(ev.target.result);
                    if (data.volunteers) Storage.save('volunteers', data.volunteers);
                    if (data.projects) Storage.save('projects', data.projects);
                    if (data.donors) Storage.save('donors', data.donors);
                    if (data.events) Storage.save('events', data.events);
                    if (data.inventory) Storage.save('inventory', data.inventory);
                    showToast('Importazione completata', 'success');
                    if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
                    if (typeof VolunteersModule !== 'undefined') VolunteersModule.renderList();
                    if (typeof ProjectsModule !== 'undefined') ProjectsModule.renderList();
                    if (typeof DonorsModule !== 'undefined') DonorsModule.renderList();
                    if (typeof CalendarModule !== 'undefined') CalendarModule.renderEvents();
                    if (typeof LogisticsModule !== 'undefined') LogisticsModule.renderList();
                } catch (err) { showToast('Import fallita: ' + err.message, 'error'); }
            };
            reader.readAsText(f);
        };
        input.click();
    }

    function showSyncModal(){
        const body = document.getElementById('modal-body'); document.getElementById('modal-title').textContent='Sincronizza (Mock)';
        const saved = localStorage.getItem('syncEndpoint') || defaultEndpoint;
        body.innerHTML = `
            <input id="sync-endpoint" style="width:100%;margin-bottom:8px;" value="${saved}"/>
            <div style="display:flex;gap:8px;justify-content:flex-end;"><button id="push-data" class="btn btn-primary">Invia (push)</button><button id="pull-data" class="btn btn-secondary">Ricevi (pull)</button></div>
            <p class="muted" style="margin-top:8px;">Nota: questo è un mock; inserisci un endpoint reale per sincronizzazione vera.</p>
        `;
        document.getElementById('modal').classList.add('open');
        document.querySelector('.modal-close').onclick = () => document.getElementById('modal').classList.remove('open');
        document.getElementById('push-data').onclick = () => { const ep = document.getElementById('sync-endpoint').value; localStorage.setItem('syncEndpoint', ep); pushData(ep); };
        document.getElementById('pull-data').onclick = () => { const ep = document.getElementById('sync-endpoint').value; localStorage.setItem('syncEndpoint', ep); pullData(ep); };
    }

    async function pushData(endpoint){
        try {
            const payload = {
                volunteers: Storage.load('volunteers') || [],
                projects: Storage.load('projects') || [],
                donors: Storage.load('donors') || [],
                events: Storage.load('events') || [],
                inventory: Storage.load('inventory') || []
            };
            const res = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            if (!res.ok) throw new Error('Errore push: ' + res.status);
            showToast('Dati inviati con successo', 'success');
        } catch (err) { showToast('Push fallito (mock): ' + err.message, 'error'); }
    }

    async function pullData(endpoint){
        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error('Errore pull: ' + res.status);
            const data = await res.json();
            if (data.volunteers) Storage.save('volunteers', data.volunteers);
            if (data.projects) Storage.save('projects', data.projects);
            if (data.donors) Storage.save('donors', data.donors);
            if (data.events) Storage.save('events', data.events);
            if (data.inventory) Storage.save('inventory', data.inventory);
            showToast('Dati importati (mock)', 'success');
            // refresh UI
            if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
            if (typeof VolunteersModule !== 'undefined') VolunteersModule.renderList();
            if (typeof ProjectsModule !== 'undefined') ProjectsModule.renderList();
            if (typeof DonorsModule !== 'undefined') DonorsModule.renderList();
            if (typeof CalendarModule !== 'undefined') CalendarModule.renderEvents();
            if (typeof LogisticsModule !== 'undefined') LogisticsModule.renderList();
        } catch (err) { showToast('Pull fallito (mock): ' + err.message, 'error'); }
    }

    return {init, showSyncModal, pushData, pullData};
})();

document.addEventListener('DOMContentLoaded', SyncModule.init);
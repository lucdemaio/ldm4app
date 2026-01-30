// calendar.js (skeleton per eventi)
const CalendarModule = (function(){

    let currentTab = 'events'; // 'events' o 'trips'
    function init(){
        renderTabs();
        renderCurrent();
        // Pulsanti aggiunta
        const addEventBtn = document.getElementById('add-event-btn');
        if (addEventBtn) addEventBtn.addEventListener('click', showEventForm);
        const addTripBtn = document.getElementById('add-trip-btn');
        if (addTripBtn) addTripBtn.addEventListener('click', showTripForm);
    }

    function renderTabs() {
        const section = document.getElementById('calendar-section');
        if (!section) return;
        let tabs = section.querySelector('.calendar-tabs');
        if (!tabs) {
            tabs = document.createElement('div');
            tabs.className = 'calendar-tabs';
            tabs.style = 'display:flex;gap:1rem;margin-bottom:1.2rem;';
            section.insertBefore(tabs, section.querySelector('.section-header').nextSibling);
        }
        tabs.innerHTML = `
            <button class="btn${currentTab==='events'?' btn-primary':' btn-outline'}" id="tab-events">Eventi & Missioni</button>
            <button class="btn${currentTab==='trips'?' btn-primary':' btn-outline'}" id="tab-trips">Trasferte</button>
        `;
        tabs.querySelector('#tab-events').onclick = ()=>{ currentTab='events'; renderTabs(); renderCurrent(); };
        tabs.querySelector('#tab-trips').onclick = ()=>{ currentTab='trips'; renderTabs(); renderCurrent(); };
    }

    function renderCurrent() {
        if (currentTab==='events') renderEvents();
        else renderTrips();
        // Mostra/nascondi pulsanti
        const addEventBtn = document.getElementById('add-event-btn');
        const addTripBtn = document.getElementById('add-trip-btn');
        if (addEventBtn) addEventBtn.style.display = currentTab==='events' ? '' : 'none';
        if (addTripBtn) addTripBtn.style.display = currentTab==='trips' ? '' : 'none';
    }

    function renderEvents(){
        const container = document.getElementById('calendar-events');
        if (!container) return;
        container.innerHTML = '';
        const events = Storage.load('events') || [];
        if (!events.length) container.innerHTML='<p class="muted">Nessun evento in calendario.</p>';
        events.forEach((ev,i)=>{
            const el=document.createElement('div'); el.className='list-item';
            el.innerHTML=`<div><strong>${ev.title}</strong><p>${ev.date || ''} • ${ev.location || ''}</p></div><div><button class="btn btn-outline" onclick="CalendarModule.editEvent(${i})">Modifica</button> <button class="btn btn-secondary" onclick="CalendarModule.removeEvent(${i})">Elimina</button></div>`;
            container.appendChild(el);
        });
    }

    function renderTrips(){
        const container = document.getElementById('calendar-events');
        if (!container) return;
        container.innerHTML = '';
        const trips = Storage.load('trips') || [];
        if (!trips.length) container.innerHTML='<p class="muted">Nessuna trasferta registrata.</p>';
        trips.forEach((tr,i)=>{
            const el=document.createElement('div'); el.className='list-item';
            el.innerHTML=`<div><strong>${tr.title}</strong><p>${tr.date || ''} • ${tr.destination || ''}</p><p class="muted">${tr.notes||''}</p></div><div><button class="btn btn-outline" onclick="CalendarModule.editTrip(${i})">Modifica</button> <button class="btn btn-secondary" onclick="CalendarModule.removeTrip(${i})">Elimina</button></div>`;
            container.appendChild(el);
        });
    }
    function showTripForm(defaults={}){
        const body = document.getElementById('modal-body'); if (!body) return;
        document.getElementById('modal-title').textContent = defaults.title ? 'Modifica Trasferta' : 'Nuova Trasferta';
        body.innerHTML = `
            <p class="modal-subtitle">Registra una trasferta (viaggio, missione, visita, ecc.).</p>
            <div class="form-grid">
                <div class="form-field"><label>Titolo trasferta</label><input id="ttitle" placeholder="Titolo" value="${defaults.title||''}" /></div>
                <div class="form-field"><label>Data</label><input id="tdate" type="date" value="${defaults.date||''}" /></div>
                <div class="form-field full"><label>Destinazione</label><input id="tdestination" placeholder="Destinazione" value="${defaults.destination||''}" /></div>
                <div class="form-field full"><label>Note</label><textarea id="tnotes" style="height:70px">${defaults.notes||''}</textarea></div>
            </div>
            <div class="form-actions"><button id="cancel-t-btn" class="btn btn-secondary">Annulla</button><button id="save-t-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open');
        const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-t-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-t-btn').onclick = ()=>{
            const title = document.getElementById('ttitle').value.trim(); if (!title) { showToast('Titolo trasferta richiesto', 'error'); return; }
            const trips = Storage.load('trips') || [];
            if (defaults.index != null) { trips[defaults.index] = {title, date:document.getElementById('tdate').value, destination:document.getElementById('tdestination').value, notes:document.getElementById('tnotes').value}; }
            else { trips.push({title, date:document.getElementById('tdate').value, destination:document.getElementById('tdestination').value, notes:document.getElementById('tnotes').value}); }
            Storage.save('trips', trips); renderTrips(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); if (typeof showView === 'function') showView('calendar');
        }
    }

    function editTrip(i){ const trips = Storage.load('trips')||[]; if (!trips[i]) return; showTripForm({...trips[i], index:i}); }
    function removeTrip(i){ const trips = Storage.load('trips')||[]; if (!trips[i]) return; trips.splice(i,1); Storage.save('trips', trips); renderTrips(); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); }

    function showEventForm(defaults={}){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent = defaults.title ? 'Modifica Evento' : 'Nuovo Evento';
        body.innerHTML = `
            <p class="modal-subtitle">Programma un evento o missione. Inserisci data e luogo.</p>
            <div class="form-grid">
                <div class="form-field"><label>Titolo evento</label><input id="etitle" placeholder="Titolo evento" value="${defaults.title||''}" /></div>
                <div class="form-field"><label>Data</label><input id="edate" type="date" value="${defaults.date||''}" /></div>
                <div class="form-field full"><label>Località</label><input id="elocation" placeholder="Località" value="${defaults.location||''}" /></div>
            </div>
            <div class="form-actions"><button id="cancel-e-btn" class="btn btn-secondary">Annulla</button><button id="save-e-btn" class="btn btn-primary">Salva</button></div>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-e-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('save-e-btn').onclick = ()=>{
            const title = document.getElementById('etitle').value.trim(); if (!title) { showToast('Titolo evento richiesto', 'error'); return; }
            const events = Storage.load('events') || [];
            if (defaults.index != null) { events[defaults.index] = {title, date:document.getElementById('edate').value, location:document.getElementById('elocation').value}; }
            else { events.push({title, date:document.getElementById('edate').value, location:document.getElementById('elocation').value}); }
            Storage.save('events', events); CalendarModule.renderEvents(); modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); if (typeof showView === 'function') showView('dashboard');
        }
    }

    function editEvent(i){ const ev = (Storage.load('events')||[])[i]; if (!ev) return; showEventForm({...ev, index:i}); }
    function removeEvent(i){ const evs = Storage.load('events')||[]; if (!evs[i]) return; evs.splice(i,1); Storage.save('events', evs); renderEvents(); if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats(); }

    return {init,renderEvents,showEventForm,editEvent,removeEvent,renderTrips,showTripForm,editTrip,removeTrip};

    return {init,renderEvents,showEventForm};
})();
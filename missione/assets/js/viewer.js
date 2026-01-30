// viewer.js - Mission Viewer: News & Monitoraggio stile portale news

(function(){
    // Config
    const grid = document.getElementById('viewer-bento-grid');
    const feed = document.getElementById('viewer-feed');
    if (!grid || !feed) return;

    // Helper: crea elemento scheda Bento
    function createBentoCard({size, title, subtitle, image, content, impact, date}) {
        const card = document.createElement('div');
        card.className = `bento-card viewer-card ${size}`;
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = title;
            img.style.borderRadius = '24px';
            img.style.width = '100%';
            img.style.maxHeight = '140px';
            img.style.objectFit = 'cover';
            card.appendChild(img);
        }
        const h3 = document.createElement('h3'); h3.textContent = title; card.appendChild(h3);
        if (subtitle) { const sub = document.createElement('p'); sub.className = 'subtitle'; sub.textContent = subtitle; card.appendChild(sub); }
        if (content) { const p = document.createElement('p'); p.textContent = content; card.appendChild(p); }
        if (impact) { const pill = document.createElement('span'); pill.className = 'impact-pill'; pill.textContent = impact; card.appendChild(pill); }
        if (date) { const d = document.createElement('span'); d.className = 'date-pill'; d.textContent = date; card.appendChild(d); }
        // Animazione sollevamento
        card.onmouseenter = ()=>card.style.transform = 'translateY(-6px) scale(1.03)';
        card.onmouseleave = ()=>card.style.transform = '';
        return card;
    }

    // Genera Bento Grid
    function renderBentoGrid() {
        grid.innerHTML = '';
        // Dati: Projects, Events, Impatto
        const projects = (window.Storage && Storage.load('projects')) || [];
        const events = (window.Storage && Storage.load('events')) || [];
        // Scheda grande: ultimo progetto aggiornato
        if (projects.length) {
            const last = projects[projects.length-1];
            grid.appendChild(createBentoCard({
                size: 'large',
                title: last.title,
                subtitle: last.location,
                image: last.image || '',
                content: last.summary,
                date: last.updatedAt || last.createdAt || '',
            }));
        }
        // Scheda media: prossimo evento
        if (events.length) {
            const next = [...events].sort((a,b)=>a.date.localeCompare(b.date))[0];
            grid.appendChild(createBentoCard({
                size: 'medium',
                title: next.title,
                subtitle: next.location,
                date: next.date,
                content: next.summary || '',
            }));
        }
        // Schede piccole: pillole impatto
        const impacts = [
            {impact: 'Oggi distribuiti 20 kit', size:'small'},
            {impact: '5 nuovi volontari iscritti', size:'small'},
            {impact: 'Raccolti €500 questa settimana', size:'small'}
        ];
        impacts.forEach(i=>grid.appendChild(createBentoCard(i)));
    }

    // Genera feed social interno
    function renderFeed() {
        feed.innerHTML = '';
        const projects = (window.Storage && Storage.load('projects')) || [];
        const events = (window.Storage && Storage.load('events')) || [];
        // Unifica e ordina per data
        const items = [
            ...projects.map(p=>({...p, type:'project', date: p.updatedAt || p.createdAt || ''})),
            ...events.map(e=>({...e, type:'event', date: e.date || ''}))
        ].filter(i=>i.date).sort((a,b)=>b.date.localeCompare(a.date));
        items.forEach(item=>{
            const div = document.createElement('div');
            div.className = 'feed-item';
            div.innerHTML = `<div class="feed-type">${item.type==='project'?'Progetto':'Evento'}</div><div class="feed-title">${item.title}</div><div class="feed-date">${item.date}</div><div class="feed-summary">${item.summary||''}</div>`;
            feed.appendChild(div);
        });
    }

    // Filtro sola lettura: nasconde tasti modifica/elimina
    function applyReadOnly() {
        document.querySelectorAll('#viewer-section .btn, #viewer-section [data-action], #viewer-section .toolbar').forEach(el=>el.style.display='none');
    }

    // Inizializza
    renderBentoGrid();
    renderFeed();
    applyReadOnly();

    // Espone per refresh manuale
    window.ViewerModule = { renderBentoGrid, renderFeed };
})();
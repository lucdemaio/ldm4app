// dashboard.js
const DashboardModule = (function(){
    function init() {
        renderStats();
        renderCharts();
    }

    function renderStats() {
        const vols = Storage.load('volunteers') || [];
        const projects = Storage.load('projects') || [];
        const donors = Storage.load('donors') || [];
        document.getElementById('total-volunteers').textContent = vols.length;
        document.getElementById('active-projects').textContent = projects.length;
        const funds = donors.reduce((s,d)=>s+Number(d.amount||0),0);
        document.getElementById('funds-raised').textContent = '€ ' + funds.toFixed(2);
        document.getElementById('upcoming-missions').textContent = (Storage.load('events') || []).length;
        document.getElementById('inventory-count').textContent = (Storage.load('inventory') || []).reduce((s,i) => s + Number(i.qty||0), 0);

        const featured = document.getElementById('featured-projects');
        featured.innerHTML = '';
        projects.slice(0,3).forEach(p => {
            const div = document.createElement('div'); div.className='list-item'; div.innerHTML = `<strong>${p.title}</strong><p>${p.summary || ''}</p>`; featured.appendChild(div);
        });
    }

    function renderCharts() {
        // Simple charts if Chart.js available
        const ctx1 = document.getElementById('expenses-chart');
        const ctx2 = document.getElementById('donation-chart');
        if (window.Chart && ctx1 && ctx2) {
            new Chart(ctx1, {type:'doughnut',data:{labels:['Salute','Istruzione','Acqua','Altro'],datasets:[{data:[40,25,20,15],backgroundColor:['#0b6b4f','#1e90a9','#f59e0b','#9f7aea']}]}});
            new Chart(ctx2, {type:'bar',data:{labels:['Campagna A','Campagna B','Campagna C'],datasets:[{label:'Donazioni €',data:[1200,800,400],backgroundColor:'#0b6b4f'}]}});
        }
    }

    return {init,renderStats};
})();

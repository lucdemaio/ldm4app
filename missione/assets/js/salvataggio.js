// assets/js/salvataggio.js
// Funzioni per esportare i dati dei moduli e tutti i dati in JSON

function downloadModule(module) {
    let data = null;
    if (module === 'sacraments') {
        // Esporta tutti i sacramenti come oggetto
        data = {
            baptisms: Storage.load('baptisms') || [],
            marriages: Storage.load('marriages') || [],
            funerals: Storage.load('funerals') || [],
            celebrations: Storage.load('celebrations') || [],
            catechesi: Storage.load('catechesi') || [],
            intentions: Storage.load('intentions') || []
        };
    } else {
        data = Storage.load(module) || [];
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `missione-${module}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadAll() {
    const allData = {
        volunteers: Storage.load('volunteers') || [],
        projects: Storage.load('projects') || [],
        donors: Storage.load('donors') || [],
        events: Storage.load('events') || [],
        inventory: Storage.load('inventory') || [],
        sacraments: {
            baptisms: Storage.load('baptisms') || [],
            marriages: Storage.load('marriages') || [],
            funerals: Storage.load('funerals') || [],
            celebrations: Storage.load('celebrations') || [],
            catechesi: Storage.load('catechesi') || [],
            intentions: Storage.load('intentions') || []
        }
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'missione-tutti-i-dati.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

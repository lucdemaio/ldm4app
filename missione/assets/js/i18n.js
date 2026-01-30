// i18n.js - minimal internationalization (client-side)
const I18n = (function(){
    const translations = {
        it: {
            Dashboard: 'Dashboard', Volunteers: 'Volontari', Projects: 'Progetti', Donors: 'Donatori', CalendarEvents: 'Calendario Eventi', Logistica: 'Logistica', Reports: 'Report & Documenti', Add: 'Aggiungi', NewProject: 'Nuovo Progetto', AddDonor: 'Aggiungi Donatore', AddEvent: 'Aggiungi Evento', ExportData: 'Esporta Dati', ImportData: 'Importa Dati', BackupCloud: 'Backup Cloud', Settings: 'Impostazioni', Sync: 'Sincronizza', Payments: 'Pagamenti', Inventory: 'Inventario', UpcomingMissions: 'Missioni Prossime' , Inventory: 'Inventario', UpcomingMissions: 'Missioni Prossime'
        },
        en: {
            Dashboard: 'Dashboard', Volunteers: 'Volunteers', Projects: 'Projects', Donors: 'Donors', CalendarEvents: 'Calendar Events', Logistica: 'Logistics', Reports: 'Reports & Docs', Add: 'Add', NewProject: 'New Project', AddDonor: 'Add Donor', AddEvent: 'Add Event', ExportData: 'Export Data', ImportData: 'Import Data', BackupCloud: 'Cloud Backup', Settings: 'Settings', Sync: 'Sync', Payments: 'Payments', Inventory: 'Inventory', UpcomingMissions: 'Upcoming Missions', Inventory: 'Inventory', UpcomingMissions: 'Upcoming Missions'
        }
    };

    function init(){
        const saved = localStorage.getItem('lang') || 'it';
        const select = document.getElementById('lang-select'); if (select) select.value = saved;
        translateAll(saved);
        if (select) select.addEventListener('change', (e)=>{ localStorage.setItem('lang', e.target.value); translateAll(e.target.value); });
    }

    function translateAll(lang){ document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key]; }); }

    return {init, translateAll};
})();

document.addEventListener('DOMContentLoaded', I18n.init);
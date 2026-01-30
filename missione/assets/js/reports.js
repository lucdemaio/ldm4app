// reports.js - generazione report PDF professionale
const ReportsModule = (function(){
    function init(){
        const frBtn = document.getElementById('financial-report-btn'); if (frBtn) frBtn.addEventListener('click', generateFinancialReport);
        // bind export buttons if present
        document.getElementById('export-all-pdf-btn')?.addEventListener('click', exportAllDataPDF);
        document.getElementById('export-volunteers-btn')?.addEventListener('click', generateVolunteersPDF);
        document.getElementById('export-projects-btn')?.addEventListener('click', generateProjectsPDF);
        document.getElementById('export-donors-btn')?.addEventListener('click', generateDonorsPDF);
        document.getElementById('export-events-btn')?.addEventListener('click', generateEventsPDF);
        document.getElementById('export-inventory-btn')?.addEventListener('click', generateInventoryPDF);
        document.getElementById('export-shipments-btn')?.addEventListener('click', generateShipmentsPDF);
        document.getElementById('export-adoptions-btn')?.addEventListener('click', generateAdoptionsPDF);
        document.getElementById('export-baptisms-btn')?.addEventListener('click', generateBaptismsPDF);
        document.getElementById('export-baptisms-btn-2')?.addEventListener('click', generateBaptismsPDF);
        document.getElementById('export-marriages-btn')?.addEventListener('click', generateMarriagesPDF);
        document.getElementById('export-marriages-btn-2')?.addEventListener('click', generateMarriagesPDF);
        document.getElementById('export-funerals-btn')?.addEventListener('click', generateFuneralsPDF);
        document.getElementById('export-funerals-btn-2')?.addEventListener('click', generateFuneralsPDF);
        document.getElementById('export-catechesi-btn')?.addEventListener('click', generateCatechesiPDF);
        document.getElementById('export-intentions-btn')?.addEventListener('click', generateIntentionsPDF);
    }

    function generateSummaryPDF(){
        const volunteers = Storage.load('volunteers') || [];
        const projects = Storage.load('projects') || [];
        const donors = Storage.load('donors') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(18); doc.text('Report Missione - Riepilogo', 40, 60);
        doc.setFontSize(12); doc.text(`Volontari: ${volunteers.length}`, 40, 100);
        doc.text(`Progetti attivi: ${projects.length}`, 40, 120);
        doc.text(`Donatori: ${donors.length}`, 40, 140);
        _addFooter(doc);
        doc.save('mission-report-summary.pdf');
    }

    function generateProfessionalReport(){
        const projects = Storage.load('projects') || [];
        const donors = Storage.load('donors') || [];
        const expenses = Storage.load('expenses') || []; // optional
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        // Header
        doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('Missione - Rendicontazione', 40, 50);
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text(`Generato il: ${new Date().toLocaleString()}`, 40, 70);

        // Expenses split
        const pastoral = expenses.filter(e=>e.category==='Opere Pastorali').map(e=>[e.item, (e.amount||0).toFixed(2)]);
        const humanitarian = expenses.filter(e=>e.category==='Aiuti Umanitari').map(e=>[e.item, (e.amount||0).toFixed(2)]);
        let y = 100;
        if (pastoral.length){
            doc.setFontSize(12); doc.text('Opere Pastorali', 40, y); y += 18;
            pastoral.forEach(r=>{ doc.text(`- ${r[0]}: € ${r[1]}`, 50, y); y += 16; });
            y += 8;
        }
        if (humanitarian.length){
            doc.setFontSize(12); doc.text('Aiuti Umanitari', 40, y); y += 18;
            humanitarian.forEach(r=>{ doc.text(`- ${r[0]}: € ${r[1]}`, 50, y); y += 16; });
            y += 8;
        }
        // Donors summary
        doc.setFontSize(12); doc.text('Donatori principali', 40, y); y += 18;
        donors.slice(0,10).forEach(d=>{ doc.text(`${d.name} - € ${(d.amount||0).toFixed(2)}`, 50, y); y += 16; });

        doc.save('mission-report-professionale.pdf');
    }

    function generateFinancialReport(){
        const user = (typeof AuthModule !== 'undefined' && AuthModule.getCurrentUser) ? AuthModule.getCurrentUser() : Storage.load('currentUser');
        const role = (user && user.role) ? user.role : 'anonymous';
        if (role !== 'admin') { showToast && showToast('Permessi insufficienti: solo admin può generare il rendiconto finanziario','error'); return; }
        // generate more detailed professional report
        generateProfessionalReport();
    }

    /* Helpers */
    function _addFooter(doc){
        try{
            const h = doc.internal.pageSize.getHeight();
            const pageCount = doc.internal.getNumberOfPages();
            for (let i=1;i<=pageCount;i++){
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(110);
                doc.text('creato da: www.ldm4app.com', 40, h - 28);
            }
        }catch(e){ console.warn('Footer add failed', e); }
    }

    function generateVolunteersPDF(){
        const volunteers = Storage.load('volunteers') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Volontari', 40, 60);
        const body = volunteers.map(v=>[v.name||'', v.role||'', v.contact||'']);
        doc.autoTable({startY:80, head:[['Nome','Ruolo','Contatto']], body});
        _addFooter(doc);
        doc.save('volontari.pdf');
    }

    function generateProjectsPDF(){
        const projects = Storage.load('projects') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Progetti', 40, 60);
        const body = projects.map(p=>[p.title||'', p.location||'', p.status||'', (p.summary||'').slice(0,120)]);
        doc.autoTable({startY:80, head:[['Titolo','Località','Stato','Descrizione']], body});
        _addFooter(doc);
        doc.save('progetti.pdf');
    }

    function generateDonorsPDF(){
        const donors = Storage.load('donors') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Donatori', 40, 60);
        const body = donors.map(d=>[d.name||'', (d.amount||0).toFixed(2), d.contact||'']);
        doc.autoTable({startY:80, head:[['Nome','Importo','Contatto']], body});
        _addFooter(doc);
        doc.save('donatori.pdf');
    }

    function generateEventsPDF(){
        const events = Storage.load('events') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Eventi', 40, 60);
        const body = events.map(e=>[e.title||'', e.date||'', e.location||'']);
        doc.autoTable({startY:80, head:[['Titolo','Data','Località']], body});
        _addFooter(doc);
        doc.save('eventi.pdf');
    }

    function generateInventoryPDF(){
        const inventory = Storage.load('inventory') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Inventario', 40, 60);
        const body = inventory.map(it=>[it.name||'', (it.qty||0).toString(), it.notes||'']);
        doc.autoTable({startY:80, head:[['Nome','Quantità','Note']], body});
        _addFooter(doc);
        doc.save('inventario.pdf');
    }

    function generateShipmentsPDF(){
        const shipments = Storage.load('shipments') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Spedizioni', 40, 60);
        const body = shipments.map(s=>[s.title||'', s.departureDate||'', s.destination||'', (s.contents||[]).join('; ')]);
        doc.autoTable({startY:80, head:[['Titolo','Partenza','Destinazione','Contenuti']], body});
        _addFooter(doc);
        doc.save('spedizioni.pdf');
    }

    function generateAdoptionsPDF(){
        const adoptions = Storage.load('adoptions') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Adozioni a distanza', 40, 60);
        const body = adoptions.map(a=>[a.childName||'', a.dob||'', a.country||'', a.donorName||'']);
        doc.autoTable({startY:80, head:[['Nome bambino','Data nascita','Paese','Donatore']], body});
        _addFooter(doc);
        doc.save('adozioni.pdf');
    }

    // Sacraments exports
    function generateBaptismsPDF(){
        let baptisms = Storage.load('baptisms') || [];
        // apply filters from UI if present
        const q = (document.getElementById('filter-b-search')?.value || '').trim().toLowerCase();
        const parish = (document.getElementById('filter-b-parish')?.value || '').trim().toLowerCase();
        const from = document.getElementById('filter-b-from')?.value;
        const to = document.getElementById('filter-b-to')?.value;
        if (q) baptisms = baptisms.filter(b => (b.name||'').toLowerCase().includes(q) || (b.parents||'').toLowerCase().includes(q));
        if (parish) baptisms = baptisms.filter(b => (b.parishRef||'').toLowerCase().includes(parish));
        if (from) baptisms = baptisms.filter(b => (b.baptismDate||'') >= from);
        if (to) baptisms = baptisms.filter(b => (b.baptismDate||'') <= to);
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Battesimi', 40, 60);
        const body = baptisms.map(b=>[b.certificateNumber||'', b.name||'', b.birthDate||'', b.baptismDate||'', b.parents||'', b.parishRef||'']);
        doc.autoTable({startY:80, head:[['Cert.','Nome','Nascita','Batt','Genitori','Parrocchia']], body});
        _addFooter(doc);
        doc.save('battesimi.pdf');
    }

    function generateMarriagesPDF(){
        const marriages = Storage.load('marriages') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Matrimoni', 40, 60);
        const body = marriages.map(m=>[m.spouseA||'', m.spouseB||'', m.date||'', m.parish||'']);
        doc.autoTable({startY:80, head:[['Sposo/a A','Sposo/a B','Data','Parrocchia']], body});
        _addFooter(doc);
        doc.save('matrimoni.pdf');
    }

    function generateFuneralsPDF(){
        const funerals = Storage.load('funerals') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Esequie', 40, 60);
        const body = funerals.map(f=>[f.name||'', f.deathDate||'', f.ritualDate||'', f.burial||'']);
        doc.autoTable({startY:80, head:[['Nome','Decesso','Rito','Sepoltura']], body});
        _addFooter(doc);
        doc.save('esequie.pdf');
    }

    function generateCelebrationsPDF(){
        const celebrations = Storage.load('celebrations') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Altre Celebrazioni', 40, 60);
        const body = celebrations.map(c=>[c.title||'', c.type||'', c.date||'', c.notes||'']);
        doc.autoTable({startY:80, head:[['Titolo','Tipo','Data','Note']], body});
        _addFooter(doc);
        doc.save('celebrazioni.pdf');
    }

    function generateCatechesiPDF(){
        const catechesi = Storage.load('catechesi') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Percorsi Catechistici', 40, 60);
        const body = catechesi.map(k=>[k.studentName||'', k.course||'', k.status||'', k.notes||'']);
        doc.autoTable({startY:80, head:[['Nome','Corso','Stato','Note']], body});
        _addFooter(doc);
        doc.save('catechesi.pdf');
    }

    function generateIntentionsPDF(){
        const intentions = Storage.load('intentions') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        doc.setFontSize(16); doc.text('Intenzioni Messe', 40, 60);
        const body = intentions.map(i=>[i.title||'', i.date||'', i.offering||'', i.notes||'']);
        doc.autoTable({startY:80, head:[['Titolo','Data','Offerta','Note']], body});
        _addFooter(doc);
        doc.save('intenzioni.pdf');
    }

    function exportAllDataPDF(){
        const volunteers = Storage.load('volunteers') || [];
        const projects = Storage.load('projects') || [];
        const donors = Storage.load('donors') || [];
        const events = Storage.load('events') || [];
        const inventory = Storage.load('inventory') || [];
        const shipments = Storage.load('shipments') || [];
        const adoptions = Storage.load('adoptions') || [];
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { showToast && showToast('jsPDF non disponibile','error'); return; }
        const doc = new jsPDF({unit:'pt',format:'a4'});
        let y = 50; doc.setFontSize(16); doc.text('Esportazione completa - Dati Missione', 40, y); y += 20;
        // Volunteers
        doc.setFontSize(12); doc.text('Volontari', 40, y); doc.autoTable({startY:y+18, head:[['Nome','Ruolo','Contatto']], body:volunteers.map(v=>[v.name||'',v.role||'',v.contact||''])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Projects
        doc.setFontSize(12); doc.text('Progetti', 40, y); doc.autoTable({startY:y+18, head:[['Titolo','Località','Stato','Descrizione']], body:projects.map(p=>[p.title||'',p.location||'',p.status||'', (p.summary||'').slice(0,120)])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Donors
        doc.setFontSize(12); doc.text('Donatori', 40, y); doc.autoTable({startY:y+18, head:[['Nome','Importo','Contatto']], body:donors.map(d=>[d.name||'', (d.amount||0).toFixed(2), d.contact||''])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Events
        doc.setFontSize(12); doc.text('Eventi', 40, y); doc.autoTable({startY:y+18, head:[['Titolo','Data','Località']], body:events.map(e=>[e.title||'', e.date||'', e.location||''])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Inventory
        doc.setFontSize(12); doc.text('Inventario', 40, y); doc.autoTable({startY:y+18, head:[['Nome','Quantità','Note']], body:inventory.map(it=>[it.name||'', (it.qty||0).toString(), it.notes||''])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Shipments
        doc.setFontSize(12); doc.text('Spedizioni', 40, y); doc.autoTable({startY:y+18, head:[['Titolo','Partenza','Destinazione','Contenuti']], body:shipments.map(s=>[s.title||'', s.departureDate||'', s.destination||'', (s.contents||[]).join('; ')])}); y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 20 : y + 120;
        // Adoptions
        doc.setFontSize(12); doc.text('Adozioni a distanza', 40, y); doc.autoTable({startY:y+18, head:[['Nome bambino','Data nascita','Paese','Donatore']], body:adoptions.map(a=>[a.childName||'', a.dob||'', a.country||'', a.donorName||''])});
        _addFooter(doc);
        doc.save('missione-tutti-dati.pdf');
    }

    return {init, generateSummaryPDF, generateFinancialReport, generateVolunteersPDF, generateProjectsPDF, generateDonorsPDF, generateEventsPDF, generateInventoryPDF, generateShipmentsPDF, generateAdoptionsPDF, exportAllDataPDF};
})();

document.addEventListener('DOMContentLoaded', ReportsModule.init);

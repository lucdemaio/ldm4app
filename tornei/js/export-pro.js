/**
 * EXPORT PROFESSIONALE
 * PDF, CSV, tabelloni stampabili, attestati
 */

const ExportPro = (function(){
  
  // Genera CSV dal dataset
  function generateCSV(headers, rows, filename = 'export.csv') {
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        // Escape quotes
        const str = String(cell).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') 
          ? `"${str}"` 
          : str;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  }

  // Genera JSON esportabile
  function generateJSON(data, filename = 'export.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, filename);
  }

  // Download di blob generico
  function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Esporta classifiche come PDF
  async function exportClassificaPDF(torneo, classifiche) {
    // Utilizziamo jspdf
    const jsPDF = window.jsPDF || await loadJsPDF();
    if(!jsPDF) {
      alert('Libreria PDF non disponibile');
      return;
    }

    const doc = new jsPDF.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    let y = 20;
    
    // Header
    doc.setFontSize(18);
    doc.text(`Classifica - ${torneo.nome}`, 15, y);
    
    y += 15;
    
    // Tabella Classifiche
    doc.setFontSize(12);
    doc.text('Classifica Finale', 15, y);
    
    y += 10;
    
    const headers = ['Pos.', 'Squadra', 'Partite', 'Vinte', 'Pareggi', 'Perse', 'GF', 'GS', 'DR', 'Punti'];
    const rows = classifiche.map((c, i) => [
      i + 1,
      c.squadra_nome || '--',
      c.partite || 0,
      c.vinte || 0,
      c.pareggi || 0,
      c.perse || 0,
      c.gol_fatti || 0,
      c.gol_subiti || 0,
      c.differenza_reti || 0,
      c.punti || 0
    ]);

    // Usa autotable
    if(window.autoTable) {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headerStyles: { fillColor: [37, 99, 235] }
      });
    } else {
      // Fallback: stampa semplice
      doc.text('Classifica:', 15, y);
      classifiche.forEach((c, i) => {
        doc.text(`${i + 1}. ${c.squadra_nome}: ${c.punti} punti`, 20, y + 10 + (i * 5));
      });
    }

    doc.save(`classifica-${torneo.nome}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Esporta calendario partite
  async function exportCalendarioPDF(torneo, giornate) {
    const jsPDF = window.jsPDF || await loadJsPDF();
    if(!jsPDF) return alert('Libreria PDF non disponibile');

    const doc = new jsPDF.jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text(`Calendario - ${torneo.nome}`, 15, y);
    
    y += 12;

    // Raggruppa per giornata
    const byDate = {};
    giornate.forEach(g => {
      const date = g.data || 'N/A';
      if(!byDate[date]) byDate[date] = [];
      byDate[date].push(g);
    });

    doc.setFontSize(10);
    
    Object.entries(byDate).forEach(([date, matches]) => {
      if(y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(undefined, 'bold');
      doc.text(`📅 ${date}`, 15, y);
      y += 8;

      doc.setFont(undefined, 'normal');
      matches.forEach(m => {
        doc.text(`${m.squadra1 || '--'} vs ${m.squadra2 || '--'}`, 20, y);
        y += 6;
      });

      y += 4;
    });

    doc.save(`calendario-${torneo.nome}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Certificato/Attestato
  function generateAttestat(squadra, posizione = 1) {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = medals[posizione - 1] || '🏆';
    
    return `
      <div style="
        width: 100%;
        max-width: 800px;
        height: 600px;
        background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
        padding: 40px;
        text-align: center;
        font-family: 'Georgia', serif;
        position: relative;
        border: 3px solid #b8860b;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      ">
        <div style="font-size: 4rem;">${medal}</div>
        
        <div>
          <p style="font-size: 1.2rem; margin: 0; color: #333;">ATTESTATO DI MERITO</p>
          <h1 style="font-size: 2.5rem; margin: 0.5rem 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            ${escapeHtml(squadra.nome)}
          </h1>
          <p style="font-size: 1.3rem; margin: 0.5rem 0; color: #fff;">
            ${posizione === 1 ? 'VINCITRICE' : `${posizione}° CLASSIFICATA`}
          </p>
        </div>

        <p style="font-size: 1rem; color: #333; margin: 0;">
          Si attesta la partecipazione e i meriti sportivi<br>
          conseguiti nel nostro torneo
        </p>

        <div style="font-size: 0.9rem; color: #333;">
          <p style="margin: 0.2rem 0;">${new Date().toLocaleDateString('it-IT')}</p>
          <p style="margin: 0.2rem 0; font-style: italic;">
            Gestionale Tornei Pro
          </p>
        </div>
      </div>
    `;
  }

  // Stampa tabellone risultati
  function printScoreboard(giornate) {
    const printWin = window.open('', '', 'width=800,height=600');
    
    let html = `
      <html>
        <head>
          <title>Tabellone Risultati</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .match { 
              background: white; 
              padding: 15px; 
              margin: 10px 0; 
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 1.2rem;
            }
            .team { flex: 1; }
            .score { font-weight: bold; font-size: 1.5rem; margin: 0 20px; }
            .status { color: #666; font-size: 0.9rem; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Tabellone Risultati</h1>
          <div>
    `;

    giornate.forEach(g => {
      html += `
        <div class="match">
          <div class="team">${escapeHtml(g.squadra1 || '--')}</div>
          <div class="score">${g.risultato1 || '-'} : ${g.risultato2 || '-'}</div>
          <div class="team">${escapeHtml(g.squadra2 || '--')}</div>
        </div>
      `;
    });

    html += `
          </div>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  }

  // Helper: carica jsPDF dinamicamente
  function loadJsPDF() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => resolve(window.jsPDF);
        document.head.appendChild(autoTableScript);
      };
      document.head.appendChild(script);
    });
  }

  return {
    generateCSV,
    generateJSON,
    exportClassificaPDF,
    exportCalendarioPDF,
    generateAttestat,
    printScoreboard,
    downloadBlob
  };
})();

// Global reference
if(typeof window !== 'undefined') window.ExportPro = ExportPro;

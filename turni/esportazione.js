// esportazione.js - gestisce export/import Excel (CSV) e PDF dalla tabella dei turni
(function(){
  'use strict';

  // Export buttons
  function handleExportExcel() {
    if (!window.ShiftManager || typeof ShiftManager.exportToExcel !== 'function') {
      alert('Export non disponibile. Ricarica la pagina.');
      return;
    }
    ShiftManager.exportToExcel();
  }

  function handleExportPDF() {
    if (!window.ShiftManager || typeof ShiftManager.exportToPDF !== 'function') {
      alert('Export PDF non disponibile. Ricarica la pagina.');
      return;
    }
    ShiftManager.exportToPDF();
  }

  function handleExportPDFWithTitle() {
    const title = prompt('Titolo per il PDF', `Turni Settimana ${ShiftManager.STATE.currentWeek || ''}`);
    if (title === null) return;
    ShiftManager.exportPDFWithTitle(title);
  }

  // Import Excel/CSV
  async function handleImportExcelFile(file) {
    if (!file) return;
    const name = file.name || '';
    try {
      const data = await file.arrayBuffer();
      const ext = name.split('.').pop().toLowerCase();
      let rows = [];

      if (ext === 'xlsx' || ext === 'xls') {
        const workbook = XLSX.read(data, { type: 'array' });
        const first = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[first], { header: 1 });
      } else {
        // try parse as CSV/text
        const text = new TextDecoder('utf-8').decode(data);
        // split lines, semicolon or comma separated
        const lines = text.split(/\r?\n/).filter(l => l.trim().length);
        rows = lines.map(l => l.split(/;|,/).map(c => c.trim()));
      }

      if (!rows || rows.length === 0) { alert('File vuoto o non leggibile'); return; }

      // Header detection
      const header = rows[0].map(h => (h || '').toString().toLowerCase());
      // determine starting index of day columns - typically after 4 cols
      // We expect something like [id, nome, reparto, sottogruppo, dom, lun, mar, mer, gio, ven, sab, ore, nturni]
      const dayStart = Math.max(0, header.findIndex((h,i) => i>=3 && (h.includes('dom') || h.includes('lun') || h.includes('day'))));
      if (dayStart < 0) {
        // fallback to 4th column
        // assume day columns are 4..10
      }

      const employees = ShiftManager.STATE.employees || [];
      let matched = 0, updated = 0, unmatchedRows = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        const code = (row[0] || '').toString().trim();
        const nameVal = (row[1] || '').toString().trim();

        // find by code first, else by name
        let emp = null;
        if (code) emp = employees.find(e => String(e.code) === String(code));
        if (!emp && nameVal) emp = employees.find(e => (e.name || '').toLowerCase() === nameVal.toLowerCase());

        if (!emp) {
          unmatchedRows.push({ rowIndex: r+1, code, name: nameVal });
          continue;
        }
        matched++;

        // extract 7 day values starting at index 4 if possible, else try dayStart
        const startIdx = (row.length >= 11) ? 4 : (dayStart > 0 ? dayStart : 4);
        const schedule = [];
        for (let d = 0; d < 7; d++) {
          schedule.push((row[startIdx + d] || '').toString().trim() || '');
        }

        // update employee schedule and recalc stats
        emp.schedule = schedule;
        // calculate stats
        const stats = {
          M: schedule.filter(s => s === 'M').length,
          P: schedule.filter(s => s === 'P').length,
          N: schedule.filter(s => s === 'N').length,
          R: schedule.filter(s => s === 'R').length,
          totalHours: schedule.reduce((sum, s) => sum + (calculateHours(s) || 0), 0)
        };
        emp.stats = stats;
        updated++;
      }

      // Save and re-render
      if (updated > 0) {
        if (typeof ShiftManager.saveData === 'function') ShiftManager.saveData();
        if (typeof ShiftManager.renderTable === 'function') ShiftManager.renderTable();
      }

      let msg = `Import completato. Righe aggiornate: ${updated}.`;
      if (unmatchedRows.length) msg += ` Righe non corrisposte: ${unmatchedRows.length} (vedi console).`;
      alert(msg);
      if (unmatchedRows.length) console.warn('Unmatched rows:', unmatchedRows);

    } catch (e) {
      console.error('Errore import Excel:', e);
      alert('Errore durante l\'importazione: ' + (e.message || e));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btnX = document.getElementById('btnExportExcelLocal');
    const btnP = document.getElementById('btnExportPDFLocal');
    const btnPT = document.getElementById('btnExportPDFTitleLocal');
    const importInput = document.getElementById('importExcelInput');
    const btnImportPDF = document.getElementById('btnImportPDF');

    if (btnX) btnX.addEventListener('click', handleExportExcel);
    if (btnP) btnP.addEventListener('click', handleExportPDF);
    if (btnPT) btnPT.addEventListener('click', handleExportPDFWithTitle);
    if (importInput) importInput.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handleImportExcelFile(f); e.target.value = ''; });
    if (btnImportPDF) btnImportPDF.addEventListener('click', () => alert('Import PDF non supportato. Usa Excel/CSV.'));

    // Exports saved locally (in ShiftManager storage)
    const exportsTableBody = document.querySelector('#exportsTable tbody');

    function renderExports() {
      if (!exportsTableBody) return;
      exportsTableBody.innerHTML = '';
      if (!window.ShiftManager || typeof ShiftManager.getExports !== 'function') {
        exportsTableBody.innerHTML = '<tr><td colspan="5">ShiftManager non pronto. Ricarica la pagina.</td></tr>';
        return;
      }
      const arr = ShiftManager.getExports();
      if (!arr || arr.length === 0) {
        exportsTableBody.innerHTML = '<tr><td colspan="5">Nessuna esportazione salvata.</td></tr>';
        return;
      }
      arr.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${e.name || ''}</td>
          <td>${e.week || ''}</td>
          <td>${new Date(e.date).toLocaleString()}</td>
          <td style="text-align:center">${e.employeeCount || 0}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-outline" data-action="download-csv" data-id="${e.id}">⬇️ CSV</button>
            <button class="btn btn-outline" data-action="download-pdf" data-id="${e.id}">⬇️ PDF</button>
            <button class="btn btn-danger" data-action="delete" data-id="${e.id}">🗑️ Elimina</button>
          </td>
        `;
        exportsTableBody.appendChild(tr);
      });
    }

    // Event delegation for table
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (act === 'download-csv') {
        const ex = (ShiftManager.getExports()||[]).find(x => x.id === id);
        if (!ex) { alert('Export non trovato'); return; }
        const blob = new Blob([ex.csv || ''], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ex.csvFilename || `turni_${ex.week||'export'}.csv`; a.click(); URL.revokeObjectURL(a.href);
      }
      if (act === 'download-pdf') {
        const ex = (ShiftManager.getExports()||[]).find(x => x.id === id);
        if (!ex) { alert('Export non trovato'); return; }
        const base64 = ex.pdfBase64 || '';
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ex.pdfFilename || `turni_${ex.week||'export'}.pdf`; a.click(); URL.revokeObjectURL(a.href);
      }
      if (act === 'delete') {
        if (!confirm('Confermi eliminazione?')) return;
        const ok = ShiftManager.deleteExportById(id);
        if (ok) renderExports(); else alert('Errore eliminazione');
      }
    });

    // Save current week export button
    const btnSaveEx = document.getElementById('btnSaveExportLocal');
    if (btnSaveEx) btnSaveEx.addEventListener('click', async () => {
      if (!ShiftManager.STATE.currentWeek) { alert('Seleziona prima la settimana'); return; }
      const name = `Export ${ShiftManager.STATE.currentWeek}`;
      btnSaveEx.disabled = true;
      const ok = await ShiftManager.saveExportForCurrentWeek(name);
      btnSaveEx.disabled = false;
      if (ok) renderExports();
    });

    // Wrap saveExportForCurrentWeek to notify UI
    if (ShiftManager && typeof ShiftManager.saveExportForCurrentWeek === 'function') {
      const orig = ShiftManager.saveExportForCurrentWeek;
      if (!orig._wrappedByExports) {
        ShiftManager.saveExportForCurrentWeek = async function(name) {
          const res = await orig(name);
          setTimeout(renderExports, 200);
          return res;
        };
        ShiftManager.saveExportForCurrentWeek._wrappedByExports = true;
      }
    }

    // Expose a callback so external saves (like saveExportFromBackup) can notify us
    ShiftManager._onExportsChanged = function() { setTimeout(renderExports, 200); };

    // Initial render
    setTimeout(renderExports, 250);
  });

})();
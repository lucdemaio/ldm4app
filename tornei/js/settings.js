// Settings UI handlers: export, import, clear all
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-all-settings');
  const importInput = document.getElementById('import-file-input');
  const clearBtn = document.getElementById('clear-all-settings');

  if(exportBtn){
    exportBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try{
        const data = await window.ExportImport.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `gestionale-tornei-export-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      }catch(err){ alert('Esportazione fallita: '+err.message); }
    });
  }

  if(importInput){
    importInput.addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if(!f) return;
      try{
        const txt = await f.text();
        const json = JSON.parse(txt);
        if(!confirm('Importare i dati dal file selezionato? I dati correnti verranno sovrascritti.')) return;
        await window.ExportImport.importAll(json);
        alert('Import completato');
        // refresh UI
        if(window.Router && Router.init) Router.init(); else location.reload();
      }catch(err){ alert('Import fallito: '+err.message); }
      importInput.value = '';
    });
  }

  if(clearBtn){
    clearBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if(!confirm('Sei sicuro di voler cancellare TUTTI i dati (tornei, squadre, giornate, coda offline)? Questa azione è irreversibile.')) return;
      try{
        await Promise.all([
          IDB.clear('tornei'),
          IDB.clear('squadre'),
          IDB.clear('giornate'),
          IDB.clear('offlineQueue')
        ]);
        alert('Tutti i dati sono stati cancellati');
        if(window.Router && Router.init) Router.init(); else location.reload();
      }catch(err){ alert('Cancellazione fallita: '+err.message); }
    });
  }
});
// salvataggi.js - gestisce la UI interna per i backup
(function(){
  'use strict';

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }

  function renderBackups() {
    const tbody = document.querySelector('#backupsTableLocal tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!window.ShiftManager || typeof ShiftManager.getBackups !== 'function') {
      tbody.innerHTML = '<tr><td colspan="4">ShiftManager non pronto. Ricarica la pagina.</td></tr>';
      return;
    }
    const backups = ShiftManager.getBackups();
    if (!backups || backups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Nessun backup salvato.</td></tr>';
      return;
    }
    backups.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${(b.name || '')}</td>
        <td>${fmtDate(b.date || b.id)}</td>
        <td style="text-align:center">${b.employeeCount || (b.data && b.data.state && (b.data.state.employees||[]).length) || 0}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-outline" data-action="export-backup" data-id="${b.id}">📤 Esporta</button>
          <button class="btn btn-outline" data-action="restore" data-id="${b.id}">🔁 Ripristina</button>
          <button class="btn btn-outline" data-action="download" data-id="${b.id}">⬇️ Scarica</button>
          <button class="btn btn-danger" data-action="delete" data-id="${b.id}">🗑️ Elimina</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function restoreBackup(id) {
    if (!confirm('⚠️ Ripristinare questo backup? I dati correnti saranno sovrascritti.')) return;
    const ok = ShiftManager.loadBackupById(id);
    if (ok) {
      alert('Backup ripristinato.');
      // refresh UI
      renderBackups();
    } else {
      alert('Errore durante il ripristino del backup. Controlla la console.');
    }
  }

  function downloadBackup(id) {
    const b = ShiftManager.getBackups().find(x => x.id === id);
    if (!b) { alert('Backup non trovato'); return; }
    const filename = `shift_backup_${(b.date || b.id).replace(/[:]/g,'-')}.json`;
    const blob = new Blob([JSON.stringify(b.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  function deleteBackup(id) {
    if (!confirm("Confermi l'eliminazione del backup?")) return;
    const ok = ShiftManager.deleteBackupById(id);
    if (ok) renderBackups(); else alert('Errore eliminazione backup');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (action === 'export-backup') {
      // create an export entry from this backup and open Esportazione
      (async function() {
        try {
          btn.disabled = true;
          const ok = await (typeof ShiftManager.saveExportFromBackup === 'function' ? ShiftManager.saveExportFromBackup(id, `Export from ${id}`) : Promise.resolve(false));
          btn.disabled = false;
          if (ok) {
            alert('Esportazione creata dalla copia di backup. Vai alla sezione Esportazione.');
            try { if (typeof showSection === 'function') { showSection('esportazione'); } else { window.location.href = 'index.html#esportazione'; } } catch (e) { try { window.location.href = 'index.html#esportazione'; } catch (ex) {} }
            try { if (typeof ShiftManager._onExportsChanged === 'function') ShiftManager._onExportsChanged(); } catch (e) {}
          } else {
            alert('Errore durante esportazione da backup.');
          }
        } catch (e) {
          console.error('export-backup handler error', e);
          btn.disabled = false; alert('Errore durante esportazione da backup');
        }
      })();
      return;
    }
    if (action === 'restore') restoreBackup(id);
    if (action === 'download') downloadBackup(id);
    if (action === 'delete') deleteBackup(id);
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Wait for ShiftManager
    const wait = setInterval(() => {
      if (window.ShiftManager && typeof ShiftManager.getBackups === 'function') {
        clearInterval(wait);
        renderBackups();

        const saveBtn = document.getElementById('btnSaveBackupLocal');
        const nameInput = document.getElementById('backupNameLocal');
        const clearBtn = document.getElementById('btnClearAllBackupsLocal');

        if (saveBtn) saveBtn.addEventListener('click', () => {
          const name = nameInput ? nameInput.value.trim() : '';
          const ok = ShiftManager.saveNamedBackup(name);
          if (ok) {
            if (nameInput) nameInput.value = '';
            renderBackups();
          }
        });

        if (clearBtn) clearBtn.addEventListener('click', () => {
          if (!confirm('Confermi la cancellazione di TUTTI i backup?')) return;
          const arr = ShiftManager.getBackups() || [];
          arr.forEach(b => ShiftManager.deleteBackupById(b.id));
          renderBackups();
        });

        // Also re-render when other parts call saveNamedBackup directly
        const origSave = ShiftManager.saveNamedBackup;
        if (origSave && !origSave._wrappedBySalvataggi) {
          ShiftManager.saveNamedBackup = function(name) {
            const res = origSave(name);
            setTimeout(renderBackups, 200);
            return res;
          };
          ShiftManager.saveNamedBackup._wrappedBySalvataggi = true;
        }

        // Expose callback so other parts of the app can notify us when backups change
        try { ShiftManager._onBackupsChanged = renderBackups; } catch (e) { console.error('register onBackupsChanged failed', e); }

        // Toggle guida rapida nella sezione Salvataggi
        try {
          const btnToggle = document.getElementById('btnToggleGuidaLocal');
          if (btnToggle) btnToggle.addEventListener('click', () => {
            const content = document.getElementById('guidaContentLocal');
            if (!content) return;
            if (content.style.display === 'none' || content.style.display === '') {
              content.style.display = 'block';
              btnToggle.textContent = 'Nascondi Guida';
              content.scrollIntoView({behavior:'smooth', block:'start'});
            } else {
              content.style.display = 'none';
              btnToggle.textContent = 'Mostra Guida';
            }
          });
        } catch(e){ console.error('init guida toggle local failed', e); }
      }
    }, 150);
  });
})();
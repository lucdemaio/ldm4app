// SM CORE - gestione CONFIG e STATE, salvataggio e helper globali
(function(){
    'use strict';

    // Inizializza namespace globale
    window.ShiftManager = window.ShiftManager || {};

    // CONFIGURAZIONE GLOBALE (estratta da script.js)
    const CONFIG = {
        ROTATION_SEQUENCE: [], // Popolato automaticamente da STATE.timeSlots
        DAYS_PER_WEEK: 7,
        REST_DAYS_PER_WEEK: 1,
        // Se true, il sistema non assegnerà mai lo stesso turno della settimana precedente (se possibile)
        AVOID_PREV_SLOT_ALWAYS: true,
        HOLIDAYS: [],
        STORAGE_KEY: 'shift_manager_data',
        MAX_ROWS_BEFORE_VIRTUAL: 100
    };

    // STATE globale (estratto da script.js)
    const STATE = {
        employees: [],
        currentWeek: null,
        weekDates: [],
        filters: { search: '' },
        customStates: JSON.parse(localStorage.getItem('customStates') || '[]'),
        departmentRotations: JSON.parse(localStorage.getItem('departmentRotations') || '{}'),
        timeSlots: JSON.parse(localStorage.getItem('timeSlots') || '["06:00 - 12:15", "12:15 - 19:30", "19:30 - 02:00"]'),
        distributionPerShift: JSON.parse(localStorage.getItem('distributionPerShift') || '[]'),
        rotationOffset: parseInt(localStorage.getItem('rotationOffset') || '0'),
        weeklySchedules: JSON.parse(localStorage.getItem('weeklySchedules') || '{}'),
        riepilogoSort: 'timeSlot-asc',
        dom: {}
    };

    // Persistenza completa dei dati (backup locale)
    function saveData() {
        // Serializza lo STATE evitando proprietà DOM o funzioni
        const snapshot = {
            employees: STATE.employees || [],
            currentWeek: STATE.currentWeek || null,
            weekDates: STATE.weekDates || [],
            filters: STATE.filters || {},
            customStates: STATE.customStates || [],
            departmentRotations: STATE.departmentRotations || {},
            timeSlots: STATE.timeSlots || [],
            distributionPerShift: STATE.distributionPerShift || [],
            rotationOffset: typeof STATE.rotationOffset !== 'undefined' ? STATE.rotationOffset : 0,
            weeklySchedules: STATE.weeklySchedules || {},
            riepilogoSort: STATE.riepilogoSort || '',
            metadata: {
                lastSaved: new Date().toISOString(),
                appVersion: '2.2'
            }
        };

        const data = {
            config: {
                holidays: CONFIG.HOLIDAYS || [],
                daysPerWeek: CONFIG.DAYS_PER_WEEK,
                restDaysPerWeek: CONFIG.REST_DAYS_PER_WEEK,
                timeSlots: STATE.timeSlots || []
            },
            state: snapshot
        };

        try {
            // Backoff suppression if recent quota error
            if (window.ShiftManager && window.ShiftManager._saveDataBackoffUntil && Date.now() < window.ShiftManager._saveDataBackoffUntil) {
                console.warn('[WARN] saveData suppressed due to recent quota error until', new Date(window.ShiftManager._saveDataBackoffUntil));
                return false;
            }

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            // Successful full save -> clear cleaned flag if present
            try { localStorage.removeItem('shift_manager_cleaned'); } catch (e) {}
            // clear any backoff
            try { delete window.ShiftManager._saveDataBackoffUntil; } catch(e){}
            window.ShiftManager._lastSaveTime = Date.now();
            console.log('[DEBUG] saveData: full snapshot saved to localStorage', 'lastSaveTime=', window.ShiftManager._lastSaveTime);
            return true;
        } catch (e) {
            console.error('[ERROR] saveData failed:', e);
            // On quota errors, set a backoff to avoid spamming attempts
            const isQuota = (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014 || String(e).toLowerCase().includes('quota')));
            if (isQuota) {
                try { window.ShiftManager._saveDataBackoffUntil = Date.now() + (60*1000); } catch(e){}
            }
            // Fallback: attempt to save a compact version that excludes heavy snapshots
            try {
                const compact = {
                    config: data.config,
                    state: Object.assign({}, data.state, {
                        employees: (data.state && Array.isArray(data.state.employees)) ? data.state.employees.map(emp => ({ id: emp.id, name: emp.name, department: emp.department, schedule: emp.schedule })) : []
                    })
                };
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(compact));
                try { localStorage.setItem('shift_manager_cleaned', '1'); } catch(e) {}
                console.warn('[WARN] saveData: saved compact snapshot due to storage quota');
                ShiftManager.showNotification('⚠️ Spazio locale insufficiente, salvato snapshot compatto. Esporta un backup completo (💾 Backup JSON).', 'warning');
                return true;
            } catch (e2) {
                console.error('[ERROR] saveData fallback also failed:', e2);

                // Attempt an automatic cleanup of heavy fields (weeklySchedules / snapshot.employeesSnapshot)
                try {
                    const cleaned = JSON.parse(JSON.stringify(data));
                    let cleanedSomething = false;
                    if (cleaned.state) {
                        if (cleaned.state.weeklySchedules) { delete cleaned.state.weeklySchedules; cleanedSomething = true; }
                        if (cleaned.state.snapshot && cleaned.state.snapshot.employeesSnapshot) { delete cleaned.state.snapshot.employeesSnapshot; cleanedSomething = true; }
                        // also reduce employees to lightweight representation
                        if (Array.isArray(cleaned.state.employees)) {
                            cleaned.state.employees = cleaned.state.employees.map(emp => ({ id: emp.id, name: emp.name }));
                            cleanedSomething = true;
                        }
                    }
                    if (cleanedSomething) {
                        try {
                            // record before/after and what was removed
                            const beforeLen = JSON.stringify(data).length;
                            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cleaned));
                            const afterLen = JSON.stringify(cleaned).length;
                            const freed = beforeLen - afterLen;
                            const cleanedFields = [];
                            if (data.state && data.state.weeklySchedules && !cleaned.state.weeklySchedules) cleanedFields.push('weeklySchedules');
                            if (data.state && data.state.snapshot && data.state.snapshot.employeesSnapshot && !(cleaned.state && cleaned.state.snapshot && cleaned.state.snapshot.employeesSnapshot)) cleanedFields.push('snapshot.employeesSnapshot');
                            ShiftManager._lastSaveCleaning = { beforeLen, afterLen, freed, cleanedFields };
                            try { localStorage.setItem('shift_manager_cleaned', '1'); } catch(e) {}
                            console.warn('[WARN] saveData: saved cleaned snapshot (heavy fields removed) due to storage quota', ShiftManager._lastSaveCleaning);
                            ShiftManager.showNotification('⚠️ Spazio locale insufficiente: rimossi dati pesanti e salvato snapshot pulito. Esporta un backup completo se necessario.', 'warning');
                            return true;
                        } catch (eClean) {
                            console.error('[ERROR] saveData cleaned attempt failed:', eClean);
                            // Continue to final minimal fallback
                        }
                    } else {
                        console.log('[DEBUG] saveData: nothing heavy to clean automatically');
                    }
                } catch (eCleanGen) {
                    console.error('[ERROR] saveData cleaning generation failed:', eCleanGen);
                }

                try {
                    // Final minimal save: store only essential metadata and counts
                    const minimal = {
                        config: data.config,
                        state: {
                            currentWeek: data.state && data.state.currentWeek,
                            employeeCount: Array.isArray(data.state && data.state.employees) ? data.state.employees.length : 0,
                            timeSlotsCount: Array.isArray(data.state && data.state.timeSlots) ? data.state.timeSlots.length : 0
                        },
                        metadata: { warning: 'truncated due to storage quota' }
                    };
                    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(minimal));
                    console.warn('[WARN] saveData: saved minimal snapshot due to storage quota');

                    // Offer automatic download of full snapshot so user does not lose data
                    try {
                        const filename = `shift_backup_autosave_${new Date().toISOString().split('T')[0]}.json`;
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = filename; a.click();
                        URL.revokeObjectURL(url);
                        try { localStorage.setItem('shift_manager_cleaned', '1'); } catch(e) {}
                        ShiftManager.showNotification('⚠️ Salvataggio locale limitato. È stato scaricato automaticamente un backup completo. Libera spazio e importa il file se necessario.', 'warning');
                    } catch (ex) {
                        console.error('[ERROR] Automatic backup download failed:', ex);
                        ShiftManager.showNotification('❌ Impossibile salvare localmente e il download automatico del backup non è riuscito. Esporta manualmente i dati.', 'error');
                    }

                    return true;
                } catch (e3) {
                    console.error('[ERROR] final saveData fallback failed:', e3);
                    ShiftManager.showNotification('❌ Impossibile salvare i dati localmente: spazio esaurito. Esporta backup manuale e libera spazio.', 'error');
                    return false;
                }
            }
        }
    }

    function loadData() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Support new snapshot format { config, state }
                if (data && data.state) {
                    const st = data.state;
                    STATE.employees = st.employees || [];
                    STATE.currentWeek = st.currentWeek || null;
                    STATE.weekDates = st.weekDates || [];
                    STATE.filters = st.filters || {};
                    STATE.customStates = st.customStates || [];
                    STATE.departmentRotations = st.departmentRotations || {};
                    STATE.timeSlots = st.timeSlots || STATE.timeSlots;
                    STATE.distributionPerShift = st.distributionPerShift || STATE.distributionPerShift;
                    STATE.rotationOffset = typeof st.rotationOffset !== 'undefined' ? st.rotationOffset : STATE.rotationOffset;
                    STATE.weeklySchedules = st.weeklySchedules || STATE.weeklySchedules;
                    STATE.riepilogoSort = st.riepilogoSort || STATE.riepilogoSort;
                    if (data.config && data.config.holidays) CONFIG.HOLIDAYS = data.config.holidays;
                } else {
                    // legacy format
                    STATE.employees = data.employees || [];
                    STATE.currentWeek = data.currentWeek;
                    CONFIG.HOLIDAYS = data.holidays || [];
                }
                return true;
            } catch (e) {
                console.error('Errore caricamento dati:', e);
                return false;
            }
        }
        return false;
    }

    // ==========================
    // Gestione Salvataggi (backups)
    // ==========================

    // Key in localStorage dove vengono salvati i backup multipli
    CONFIG.BACKUPS_KEY = CONFIG.BACKUPS_KEY || 'shift_manager_backups';

    function buildBackupData() {
        return {
            meta: {
                exportDate: new Date().toISOString(),
                version: '2.2',
                employeeCount: STATE.employees?.length || 0
            },
            config: {
                holidays: CONFIG.HOLIDAYS || [],
                daysPerWeek: CONFIG.DAYS_PER_WEEK,
                restDaysPerWeek: CONFIG.REST_DAYS_PER_WEEK,
                timeSlots: STATE.timeSlots || []
            },
            state: {
                employees: STATE.employees || [],
                currentWeek: STATE.currentWeek || null,
                weekDates: STATE.weekDates || [],
                filters: STATE.filters || {},
                customStates: STATE.customStates || [],
                departmentRotations: STATE.departmentRotations || {},
                timeSlots: STATE.timeSlots || [],
                distributionPerShift: STATE.distributionPerShift || [],
                rotationOffset: STATE.rotationOffset || 0,
                weeklySchedules: STATE.weeklySchedules || {},
                riepilogoSort: STATE.riepilogoSort || ''
            },
            snapshot: {
                employeesSnapshot: (STATE.employees || []).map(emp => ({ id: emp.id, code: emp.code, name: emp.name, department: emp.department, schedule: emp.schedule, stats: emp.stats }))
            }
        };
    }

    function getBackups() {
        try {
            const raw = localStorage.getItem(CONFIG.BACKUPS_KEY) || '[]';
            const arr = JSON.parse(raw);
            // Ensure array sorted by date desc
            return Array.isArray(arr) ? arr.sort((a, b) => (b.date || b.id || '') > (a.date || a.id || '') ? 1 : -1) : [];
        } catch (e) {
            console.error('getBackups error:', e);
            return [];
        }
    }

    function saveNamedBackup(name) {
        try {
            const id = new Date().toISOString();
            const data = buildBackupData();
            const backup = {
                id,
                name: name || `Backup ${new Date().toLocaleString()}`,
                date: new Date().toISOString(),
                employeeCount: (STATE.employees || []).length,
                data
            };
            const arr = getBackups();
            arr.unshift(backup);
            // Enforce auto-prune policy if enabled
            try {
                const apr = getAutoPruneSettings();
                if (apr && apr.enabled && typeof apr.keepBackups === 'number') {
                    // write and then prune if over limit
                    localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr));
                    pruneBackupsIfNeeded(apr.keepBackups);
                } else {
                    localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr));
                }
            } catch (e) { localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr)); }
            ShiftManager.showNotification('✅ Backup salvato: ' + backup.name, 'success');
            try { if (typeof ShiftManager._onBackupsChanged === 'function') ShiftManager._onBackupsChanged(); } catch (e) { console.error('onBackupsChanged callback failed', e); }
            return true;
        } catch (e) {
            console.error('saveNamedBackup error:', e);
            // Detect quota exceeded errors
            const isQuota = (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014 || String(e).toLowerCase().includes('quota')));
            if (isQuota) {
                console.warn('[WARN] localStorage quota exceeded while saving backup. Attempting pruning and fallbacks.');
                ShiftManager.showNotification('⚠️ Spazio locale esaurito: provo a liberare spazio rimuovendo backup vecchi...', 'warning');
                // 1) Try pruning oldest backups to free up space
                try {
                    let arr2 = getBackups();
                    while (arr2.length > 0) {
                        arr2.pop(); // remove oldest
                        try {
                            localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr2));
                            // try to save our backup now
                            arr2.unshift(backup);
                            localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr2));
                            ShiftManager.showNotification('✅ Backup salvato dopo rimozione backup vecchi: ' + backup.name, 'success');
                            try { if (typeof ShiftManager._onBackupsChanged === 'function') ShiftManager._onBackupsChanged(); } catch (e2) { console.error('onBackupsChanged callback failed', e2); }
                            return true;
                        } catch (inner) {
                            // continue pruning
                        }
                    }
                } catch (pruneErr) { console.warn('[WARN] prune backups failed', pruneErr); }

                // 2) Try saving a compact backup that strips heavy fields
                try {
                    const compactData = {
                        meta: { weekDates: STATE.weekDates || [], currentWeek: STATE.currentWeek || null, timeSlots: STATE.timeSlots || [] },
                        snapshot: {
                            employeesSnapshot: (STATE.employees || []).map(emp => ({ id: emp.id, name: emp.name, department: emp.department }))
                        }
                    };
                    const compactBackup = Object.assign({}, backup, { id: backup.id + '-compact', name: backup.name + ' (compatta)', data: compactData, compact: true });
                    const arr3 = getBackups();
                    arr3.unshift(compactBackup);
                    localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr3));
                    ShiftManager.showNotification('✅ Backup compatto salvato: ' + compactBackup.name, 'success');
                    try { if (typeof ShiftManager._onBackupsChanged === 'function') ShiftManager._onBackupsChanged(); } catch(e3){}
                    return true;
                } catch (compactErr) {
                    console.warn('[WARN] compact save failed', compactErr);
                }

                // 3) Final fallback: offer download of the full backup as a file
                try {
                    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (backup.name || 'backup') + '.json';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    ShiftManager.showNotification('🔽 Backup troppo grande per il browser - è stato scaricato un file locale.', 'info');
                } catch (dlErr) {
                    console.error('[ERROR] saveNamedBackup final fallback failed', dlErr);
                    ShiftManager.showNotification('❌ Errore salvataggio backup: ' + (e.message || e), 'error');
                }
                return false;
            }

            ShiftManager.showNotification('❌ Errore salvataggio backup: ' + (e.message || e), 'error');
            return false;
        }
    }

    function deleteBackupById(id) {
        try {
            const arr = getBackups().filter(b => b.id !== id);
            localStorage.setItem(CONFIG.BACKUPS_KEY, JSON.stringify(arr));
            return true;
        } catch (e) {
            console.error('deleteBackupById error:', e);
            return false;
        }
    }

    function loadBackupById(id) {
        try {
            const arr = getBackups();
            const b = arr.find(x => x.id === id);
            if (!b) return false;
            // Write backup data into main storage and reload state
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(b.data));
            const ok = loadData(); // populate STATE from storage
            if (ok) {
                if (typeof window.ShiftManager.renderTable === 'function') window.ShiftManager.renderTable();
                ShiftManager.showNotification('✅ Backup ripristinato: ' + (b.name || b.date), 'success');
            }
            return ok;
        } catch (e) {
            console.error('loadBackupById error:', e);
            ShiftManager.showNotification('❌ Errore ripristino backup: ' + (e.message || e), 'error');
            return false;
        }
    }

    // Espongo le funzioni nel namespace pubblico
    window.ShiftManager.getBackups = getBackups;
    window.ShiftManager.saveNamedBackup = saveNamedBackup;
    window.ShiftManager.deleteBackupById = deleteBackupById;
    window.ShiftManager.loadBackupById = loadBackupById;

    // ==========================
    // Gestione Export (Excel/PDF salvati localmente)
    // ==========================
    CONFIG.EXPORTS_KEY = CONFIG.EXPORTS_KEY || 'shift_manager_exports';

    function getExports() {
        try {
            const raw = localStorage.getItem(CONFIG.EXPORTS_KEY) || '[]';
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.sort((a,b) => (b.date||b.id||'') > (a.date||a.id||'') ? 1 : -1) : [];
        } catch (e) {
            console.error('getExports error:', e);
            return [];
        }
    }

    function deleteExportById(id) {
        try {
            const arr = getExports().filter(x => x.id !== id);
            localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr));
            return true;
        } catch (e) {
            console.error('deleteExportById error:', e);
            return false;
        }
    }

    async function saveExportForCurrentWeek(name) {
        try {
            const SM = window.ShiftManager;
            if (!SM || typeof SM.buildCSVString !== 'function' || typeof SM.buildPDFBlob !== 'function') {
                throw new Error('Export helpers non disponibili');
            }
            const { csv, filename } = SM.buildCSVString();
            const pdfBlob = await SM.buildPDFBlob(`Turni Settimana ${STATE.currentWeek || ''}`);

            // Convert PDF blob to base64
            const pdfBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => { try { resolve(String(reader.result).split(',')[1]); } catch (e) { reject(e); } };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
            });

            const id = new Date().toISOString();
            const entry = {
                id,
                name: name || `Export ${STATE.currentWeek || ''}`,
                date: new Date().toISOString(),
                week: STATE.currentWeek || null,
                employeeCount: (STATE.employees || []).length,
                csv,
                csvFilename: filename,
                pdfBase64,
                pdfFilename: `turni_${STATE.currentWeek || 'export'}.pdf`
            };

            const arr = getExports();
            arr.unshift(entry);
            localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr));

            ShiftManager.showNotification('✅ Esportazione salvata', 'success');
            // trigger callback if UI wrapped
            if (typeof ShiftManager._onExportsChanged === 'function') ShiftManager._onExportsChanged();
            return true;
        } catch (e) {
            console.error('saveExportForCurrentWeek error:', e);
            ShiftManager.showNotification('❌ Errore salva esportazione: ' + (e.message || e), 'error');
            return false;
        }
    }

    window.ShiftManager.getExports = getExports;
    window.ShiftManager.saveExportForCurrentWeek = saveExportForCurrentWeek;
    window.ShiftManager.deleteExportById = deleteExportById;

    // Save an export derived from an existing backup
    async function saveExportFromBackup(backupId, name) {
        // declare entry outside try to allow fallback code in catch to reference it
        let entry = null;
        let id = null;
        try {
            const b = getBackups().find(x => x.id === backupId);
            if (!b) throw new Error('Backup non trovato');
            const data = b.data;
            const SM = window.ShiftManager;
            if (!SM || typeof SM.buildCSVStringFromData !== 'function' || typeof SM.buildPDFBlobFromData !== 'function') throw new Error('Helpers export non disponibili');

            const { csv, filename: csvFilename } = SM.buildCSVStringFromData(data);
            const pdfBlob = await SM.buildPDFBlobFromData(data, `Turni ${b.name || b.date || ''}`);

            const pdfBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => { try { resolve(String(reader.result).split(',')[1]); } catch (e) { reject(e); } };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
            });

            id = new Date().toISOString();
            entry = {
                id,
                name: name || `Export from ${b.name || b.date}`,
                date: new Date().toISOString(),
                week: (data && data.state && data.state.currentWeek) ? data.state.currentWeek : null,
                employeeCount: (data && data.state && data.state.employees) ? data.state.employees.length : 0,
                csv,
                csvFilename,
                pdfBase64,
                pdfFilename: `turni_${(data && data.state && data.state.currentWeek) || 'export'}.pdf`,
                sourceBackupId: backupId
            };

            const arr = getExports();
            arr.unshift(entry);
            try {
                const apr = getAutoPruneSettings();
                if (apr && apr.enabled && typeof apr.keepExports === 'number') {
                    localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr));
                    pruneExportsIfNeeded(apr.keepExports);
                } else {
                    localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr));
                }
            } catch (e) { localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr)); }

            ShiftManager.showNotification('✅ Esportazione creata da backup', 'success');
            if (typeof ShiftManager._onExportsChanged === 'function') ShiftManager._onExportsChanged();
            return true;
        } catch (e) {
            console.error('saveExportFromBackup error:', e);
            const isQuota = (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014 || String(e).toLowerCase().includes('quota')));
            if (isQuota) {
                console.warn('[WARN] localStorage quota exceeded while saving export. Attempting pruning and fallbacks.');
                ShiftManager.showNotification('⚠️ Spazio locale esaurito: provo a liberare spazio rimuovendo export vecchi...', 'warning');
                // 1) Try pruning oldest exports
                try {
                    let arr2 = getExports();
                    while (arr2.length > 0) {
                        arr2.pop();
                        try {
                            localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr2));
                            // try to save our entry now
                            arr2.unshift(entry);
                            localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr2));
                            ShiftManager.showNotification('✅ Esportazione salvata dopo rimozione export vecchi: ' + entry.name, 'success');
                            if (typeof ShiftManager._onExportsChanged === 'function') ShiftManager._onExportsChanged();
                            return true;
                        } catch (inner) {
                            // continue pruning
                        }
                    }
                } catch (pruneErr) { console.warn('[WARN] prune exports failed', pruneErr); }

                // 2) Try saving a compact export (no pdfBase64)
                try {
                    const compactEntry = Object.assign({}, entry, { id: entry.id + '-compact', name: entry.name + ' (compatto)', pdfBase64: null, pdfFilename: null });
                    const arr3 = getExports();
                    arr3.unshift(compactEntry);
                    localStorage.setItem(CONFIG.EXPORTS_KEY, JSON.stringify(arr3));
                    ShiftManager.showNotification('✅ Esportazione compatta salvata: ' + compactEntry.name, 'success');
                    if (typeof ShiftManager._onExportsChanged === 'function') ShiftManager._onExportsChanged();
                    return true;
                } catch (compactErr) { console.warn('[WARN] compact export save failed', compactErr); }

                // 3) Final fallback: force download of files to user
                try {
                    // download CSV
                    try {
                        const csvBlob = new Blob([entry.csv || ''], { type: 'text/csv;charset=utf-8;' });
                        const urlCsv = URL.createObjectURL(csvBlob);
                        const aCsv = document.createElement('a'); aCsv.href = urlCsv; aCsv.download = entry.csvFilename || 'export.csv'; document.body.appendChild(aCsv); aCsv.click(); aCsv.remove(); URL.revokeObjectURL(urlCsv);
                    } catch (csvErr) { console.warn('[WARN] CSV download failed', csvErr); }
                    // download PDF
                    try {
                        if (entry.pdfBase64) {
                            const byteChars = atob(entry.pdfBase64);
                            const byteNumbers = new Array(byteChars.length);
                            for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
                            const byteArray = new Uint8Array(byteNumbers);
                            const pdfBlobDown = new Blob([byteArray], { type: 'application/pdf' });
                            const urlPdf = URL.createObjectURL(pdfBlobDown);
                            const aPdf = document.createElement('a'); aPdf.href = urlPdf; aPdf.download = entry.pdfFilename || 'export.pdf'; document.body.appendChild(aPdf); aPdf.click(); aPdf.remove(); URL.revokeObjectURL(urlPdf);
                        }
                    } catch (pdfErr) { console.warn('[WARN] PDF download failed', pdfErr); }

                    ShiftManager.showNotification('🔽 Esportazione troppo grande per il browser - i file sono stati scaricati localmente.', 'info');
                    return false;
                } catch (finalErr) {
                    console.error('[ERROR] saveExportFromBackup final fallback failed', finalErr);
                    ShiftManager.showNotification('❌ Errore durante esportazione da backup: ' + (e.message || e), 'error');
                    return false;
                }
            }

            ShiftManager.showNotification('❌ Errore durante esportazione da backup: ' + (e.message || e), 'error');
            return false;
        }
    }

    window.ShiftManager.saveExportFromBackup = saveExportFromBackup;

    // Prompt helper: show confirm once per trigger per week
    function promptSaveExportForCurrentWeek(trigger) {
        try {
            const week = STATE.currentWeek || null;
            if (!week) return false;
            STATE._exportPromptMap = STATE._exportPromptMap || {};
            STATE._exportPromptMap[week] = STATE._exportPromptMap[week] || {};
            if (STATE._exportPromptMap[week][trigger]) return false; // already prompted for this trigger and week
            // ask user
            const msg = `Vuoi salvare in Excel e PDF la settimana corrente (${week})?`;
            const should = confirm(msg);
            STATE._exportPromptMap[week][trigger] = true;
            if (should) {
                // Save with a readable name including trigger
                const name = `Export ${week} (${trigger})`;
                return saveExportForCurrentWeek(name);
            }
            return false;
        } catch (e) {
            console.error('promptSaveExportForCurrentWeek error:', e);
            return false;
        }
    }

    window.ShiftManager.promptSaveExportForCurrentWeek = promptSaveExportForCurrentWeek;

    // Ripristino della funzione originale
    function clearAllData() {
        if (confirm('⚠️ Cancellare TUTTI i dati? Questa operazione è irreversibile!')) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            STATE.employees = [];
            STATE.currentWeek = null;
            if (typeof window.ShiftManager.renderTable === 'function') {
                window.ShiftManager.renderTable();
            }
            showNotification('🗑️ Tutti i dati cancellati', 'warning');
        }
    }

    // UI helpers
    function showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    function showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Desktop notification se permesso
        try {
            if (window.Notification && Notification.permission === 'granted') {
                new Notification('Shift Manager', { body: String(message) });
            }
        } catch (e) {
            console.warn('Notification error:', e);
        }
        // Implementazione minimale: si possono aggiungere toast reali qui
    }

    // LocalStorage diagnostics: return array of {key, bytes}
    function getLocalStorageUsage(topN = 10) {
        try {
            const usage = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key) || '';
                    usage.push({ key, bytes: value.length });
                } catch (e) {
                    usage.push({ key, bytes: 0 });
                }
            }
            usage.sort((a, b) => b.bytes - a.bytes);
            return usage.slice(0, topN);
        } catch (e) {
            console.error('getLocalStorageUsage error:', e);
            return [];
        }
    }

    // Expose diagnostics
    window.ShiftManager.getLocalStorageUsage = getLocalStorageUsage;

    // Automatic cleanup helper: tries to free space by pruning backups/exports and large keys
    async function autoCleanLocalStorage(opts = {}) {
        const keepBackups = typeof opts.keepBackups === 'number' ? opts.keepBackups : 3;
        const keepExports = typeof opts.keepExports === 'number' ? opts.keepExports : 3;
        const maxPrune = typeof opts.maxPrune === 'number' ? opts.maxPrune : 50;
        const report = { removed: [], freedBytes: 0, attempts: 0 };
        try {
            // If saveData already works, nothing to do
            try { if (saveData()) return Object.assign({ success: true }, report); } catch(e) {/* continue */ }

            // 1) prune backups (oldest first)
            let bks = getBackups();
            while (bks.length > keepBackups && report.attempts < maxPrune) {
                const last = bks.pop();
                if (!last || !last.id) continue;
                const before = localStorage.getItem(CONFIG.STORAGE_KEY) ? localStorage.getItem(CONFIG.STORAGE_KEY).length : 0;
                deleteBackupById(last.id);
                report.removed.push({ type: 'backup', id: last.id });
                report.attempts++;
                try { if (saveData()) { report.freedBytes += before - (localStorage.getItem(CONFIG.STORAGE_KEY) ? localStorage.getItem(CONFIG.STORAGE_KEY).length : 0); return Object.assign({ success: true }, report); } } catch(e) { /* continue */ }
                bks = getBackups();
            }

            // 2) prune exports
            let exs = getExports();
            while (exs.length > keepExports && report.attempts < maxPrune) {
                const lastE = exs.pop();
                if (!lastE || !lastE.id) continue;
                deleteExportById(lastE.id);
                report.removed.push({ type: 'export', id: lastE.id });
                report.attempts++;
                try { if (saveData()) return Object.assign({ success: true }, report); } catch(e) { /* continue */ }
                exs = getExports();
            }

            // 3) Remove other large keys (except essential ones)
            const essential = [CONFIG.STORAGE_KEY, CONFIG.BACKUPS_KEY, CONFIG.EXPORTS_KEY, 'timeSlots', 'customStates', 'departmentRotations', 'distributionPerShift', 'rotationOffset'];
            const usage = getLocalStorageUsage(50);
            for (let u of usage) {
                if (report.attempts >= maxPrune) break;
                if (essential.indexOf(u.key) >= 0) continue;
                try {
                    const val = localStorage.getItem(u.key);
                    if (val === null) continue;
                    // download value as backup
                    try {
                        const blob = new Blob([val], { type: 'application/json' });
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${u.key}_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(a.href);
                    } catch (dl) { /* ignore download errors */ }
                    localStorage.removeItem(u.key);
                    report.removed.push({ type: 'key', key: u.key, bytes: u.bytes });
                    report.attempts++;
                    try { if (saveData()) { report.freedBytes += u.bytes; return Object.assign({ success: true }, report); } } catch(e) { /* continue */ }
                } catch (e) {
                    console.warn('[WARN] autoCleanLocalStorage failed removing key', u.key, e);
                }
            }

            // 4) If still not saved, as last resort attempt minimal save
            try {
                if (saveData()) return Object.assign({ success: true }, report);
            } catch (e) { /* ignore */ }

            // If we reach here, we could not free enough space
            return Object.assign({ success: false }, report);
        } catch (err) {
            console.error('[ERROR] autoCleanLocalStorage failed', err);
            return Object.assign({ success: false, error: String(err) }, report);
        }
    }
    window.ShiftManager.autoCleanLocalStorage = autoCleanLocalStorage;

    // Esponi nel namespace global
    window.ShiftManager.CONFIG = CONFIG;
    window.ShiftManager.STATE = STATE;
    window.ShiftManager.saveData = saveData;
    window.ShiftManager.loadData = loadData;
    window.ShiftManager.clearAllData = clearAllData;
    window.ShiftManager.showLoading = showLoading;
    window.ShiftManager.showNotification = showNotification;
    // Esponi helper di salvataggio sicuro weeklySchedules (se definito in sm-engine)
    window.ShiftManager.saveWeeklySchedulesSafely = window.ShiftManager.saveWeeklySchedulesSafely || function() { console.warn('saveWeeklySchedulesSafely not initialized yet'); return false; };
    // Expose some utilities to global (used by UI modals)
    window.ShiftManager.getSlotIndexFromShift = window.ShiftManager.getSlotIndexFromShift || function() { console.warn('getSlotIndexFromShift not initialized'); return null; };
    window.ShiftManager.generateEmployeeSchedule = window.ShiftManager.generateEmployeeSchedule || function() { console.warn('generateEmployeeSchedule not initialized'); return null; };
    window.ShiftManager.scheduleRespectsMinRest = window.ShiftManager.scheduleRespectsMinRest || function() { console.warn('scheduleRespectsMinRest not initialized'); return true; };

    // Mantieni le variabili globali per retrocompatibilità
    window.CONFIG = CONFIG;
    window.STATE = STATE;
    window.saveData = saveData;
    window.loadData = loadData;
    window.clearAllData = clearAllData;
    window.showLoading = showLoading;
    window.showNotification = showNotification;
})();
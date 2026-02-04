/**
 * FILESYSTEM-MANAGER.JS
 * File System Access API Manager
 * Gestione permanente di documenti, PDF e database su filesystem locale
 */

/*
 * assets/js/filesystem-manager.js
 * Lightweight, robust File System Access API manager for SoccerManager
 * - persist directory handle in IndexedDB
 * - select / restore permissions
 * - create season folder structure
 * - save/export/import database.json
 * - autosync triggered on localStorage changes (best-effort)
 */

(function () {
    class FileSystemManager {
        constructor() {
            this.rootDirectoryHandle = null; // handle to SoccerManagerPro directory
            this.savedHandle = null; // persisted handle from IDB
            this.handleReady = false;
            this.needsPermissionActivation = false;
            this.currentSeason = this.getCurrentSeason();
            this.isSupported = typeof window.showDirectoryPicker === 'function';
            this._autoSyncTimeout = null;
            this._init();
        }

        async _init() {
            await this.loadSavedHandle();
            this._wrapLocalStorageForAutosync();
        }

        getCurrentSeason() {
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                if (month >= 7) return `${year}-${year + 1}`;
                return `${year - 1}-${year}`;
            } catch (e) { return '2025-2026'; }
        }

        showAlert(msg, type = 'info') {
            if (typeof Utils !== 'undefined' && typeof Utils.showToast === 'function') {
                try { Utils.showToast(msg, type); return; } catch (e) { /* fallthrough */ }
            }
            console.log('[FS]', type, msg);
        }

        // Backwards-compatible UI entry point expected by existing HTML
        async showFileSystemDashboard() {
            if (!this.isSupported) {
                this.showAlert('File System Access API non supportata dal browser.', 'error');
                return;
            }
            if (!this.rootDirectoryHandle || !this.handleReady) {
                // Ask user to select folder
                if (confirm('Nessuna cartella collegata. Vuoi selezionare la cartella ora?')) {
                    await this.selectRootDirectory();
                } else {
                    this.showAlert('Operazione annullata.', 'info');
                }
                return;
            }
            // If ready, show simple status (expand later into a full dashboard)
            this.showAlert('File System pronto. Cartella collegata.', 'success');
        }

        async selectRootDirectory() {
            if (!this.isSupported) { this.showAlert('File System Access API non supportata dal browser.', 'error'); return; }
            try {
                const picked = await window.showDirectoryPicker({ mode: 'readwrite' });
                // ensure we have an app folder inside picked folder
                const appHandle = await picked.getDirectoryHandle('SoccerManagerPro', { create: true });
                this.rootDirectoryHandle = appHandle;
                this.savedHandle = appHandle;
                await this.saveHandleToIndexedDB(appHandle);
                await this.createFolderStructure();
                this.handleReady = true;
                this.needsPermissionActivation = false;
                this.showAlert('Cartella collegata. Backup automatico attivo.', 'success');
                this.scheduleAutoSync(1000);
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                console.error('selectRootDirectory error', err);
                this.showAlert('Selezione cartella annullata o fallita.', 'error');
            }
        }

        async saveHandleToIndexedDB(handle) {
            try {
                const db = await this._openDatabase();
                const tx = db.transaction('handles', 'readwrite');
                const store = tx.objectStore('handles');
                store.put({ id: 'rootDirectory', handle });
                return tx.complete;
            } catch (e) { console.error('saveHandleToIndexedDB', e); }
        }

        async loadSavedHandle() {
            try {
                const db = await this._openDatabase();
                const tx = db.transaction('handles', 'readonly');
                const store = tx.objectStore('handles');
                const req = store.get('rootDirectory');
                req.onsuccess = async () => {
                    const res = req.result;
                    if (res && res.handle) {
                        this.savedHandle = res.handle;
                        try {
                            const perm = await this.savedHandle.queryPermission({ mode: 'readwrite' });
                            if (perm === 'granted') {
                                this.rootDirectoryHandle = this.savedHandle;
                                this.handleReady = true;
                                this.needsPermissionActivation = false;
                                this.scheduleAutoSync(2000);
                            } else {
                                this.rootDirectoryHandle = this.savedHandle;
                                this.handleReady = false;
                                this.needsPermissionActivation = true;
                            }
                        } catch (e) {
                            this.needsPermissionActivation = true;
                        }
                    }
                };
                req.onerror = () => { /* ignore */ };
            } catch (e) { console.error('loadSavedHandle', e); }
        }

        async requestPermissionOnSavedHandle() {
            if (!this.savedHandle) { this.showAlert('Nessun handle salvato. Seleziona una cartella.', 'warning'); return; }
            try {
                const perm = await this.savedHandle.requestPermission({ mode: 'readwrite' });
                if (perm === 'granted') {
                    this.rootDirectoryHandle = this.savedHandle;
                    this.handleReady = true;
                    this.needsPermissionActivation = false;
                    await this.createFolderStructure();
                    this.showAlert('Permessi ripristinati.', 'success');
                    this.scheduleAutoSync(500);
                    await this.syncDatabaseJson(false);
                } else {
                    this.showAlert('Permessi non concessi.', 'error');
                }
            } catch (e) { console.error('requestPermissionOnSavedHandle', e); this.showAlert('Errore nel ripristino permessi.', 'error'); }
        }

        async createFolderStructure() {
            if (!this.rootDirectoryHandle) return;
            try {
                const seasonHandle = await this.rootDirectoryHandle.getDirectoryHandle(this.currentSeason, { create: true });
                const subfolders = ['Verbali', 'Documenti_Legali', 'Ricevute', 'Report', 'Backup'];
                for (const f of subfolders) await seasonHandle.getDirectoryHandle(f, { create: true });
            } catch (e) { console.error('createFolderStructure', e); }
        }

        async saveFile(filename, content, subfolder = null) {
            if (!this.isSupported || !this.rootDirectoryHandle || !this.handleReady) {
                this.showAlert('File system non disponibile o permessi assenti. Scaricamento locale.', 'warning');
                return this._fallbackDownload(filename, content);
            }
            try {
                const seasonHandle = await this.rootDirectoryHandle.getDirectoryHandle(this.currentSeason, { create: true });
                let target = seasonHandle;
                if (subfolder) target = await seasonHandle.getDirectoryHandle(subfolder, { create: true });
                const fh = await target.getFileHandle(filename, { create: true });
                const writable = await fh.createWritable();
                if (content instanceof Blob) await writable.write(content); else await writable.write(new Blob([content], { type: 'application/json' }));
                await writable.close();
                return true;
            } catch (e) {
                console.error('saveFile', e);
                return this._fallbackDownload(filename, content);
            }
        }

        _fallbackDownload(filename, content) {
            try {
                const blob = content instanceof Blob ? content : new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                return true;
            } catch (e) { console.error('fallback download', e); return false; }
        }

        async syncDatabaseJson(showToast = true) {
            if (!this.isSupported || !this.rootDirectoryHandle || !this.handleReady) {
                if (showToast) this.showAlert('Seleziona una cartella per attivare il backup automatico.', 'warning');
                return;
            }
            try {
                const data = this._collectAppData();
                const json = JSON.stringify(data, null, 2);

                // write root database.json
                const rootHandle = this.rootDirectoryHandle;
                const fileHandle = await rootHandle.getFileHandle('database.json', { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(json); await writable.close();

                // write backup into season/Backup
                const seasonHandle = await rootHandle.getDirectoryHandle(this.currentSeason, { create: true });
                const backupHandle = await seasonHandle.getDirectoryHandle('Backup', { create: true });
                const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const backupFileHandle = await backupHandle.getFileHandle(backupName, { create: true });
                const backupWritable = await backupFileHandle.createWritable();
                await backupWritable.write(json); await backupWritable.close();

                if (showToast) this.showAlert('Backup completato.', 'success');
            } catch (e) { console.error('syncDatabaseJson', e); this.showAlert('Errore durante il backup: ' + (e.message || e), 'error'); }
        }

        async exportAllData() { return this.syncDatabaseJson(true); }

        _collectAppData() {
            const data = { version: '1.0', exportDate: new Date().toISOString(), season: this.currentSeason };
            try {
                if (typeof Storage !== 'undefined' && typeof Storage.exportAll === 'function') {
                    Object.assign(data, Storage.exportAll());
                } else {
                    // best-effort collection from localStorage
                    const keys = Object.keys(localStorage);
                    for (const k of keys) {
                        try { data[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { data[k] = localStorage.getItem(k); }
                    }
                }
            } catch (e) { console.error('collectAppData', e); }
            return data;
        }

        async importData() {
            if (!this.isSupported || !this.rootDirectoryHandle || !this.handleReady) { this.showAlert('Seleziona la cartella per importare i dati.', 'warning'); return; }
            try {
                let fileHandle = null;
                try {
                    const seasonHandle = await this.rootDirectoryHandle.getDirectoryHandle(this.currentSeason, { create: false });
                    const backupHandle = await seasonHandle.getDirectoryHandle('Backup', { create: false });
                    fileHandle = await backupHandle.getFileHandle('database.json');
                } catch (e) {
                    try { fileHandle = await this.rootDirectoryHandle.getFileHandle('database.json'); } catch (e2) { this.showAlert('database.json non trovato.', 'error'); return; }
                }
                const file = await fileHandle.getFile();
                const text = await file.text();
                const data = JSON.parse(text);
                if (!confirm('Importare i dati sovrascriverà i dati locali. Continuare?')) return;
                for (const k in data) {
                    try { localStorage.setItem(k, JSON.stringify(data[k])); } catch (e) { localStorage.setItem(k, data[k]); }
                }
                this.showAlert('Dati importati. Ricarico la pagina.', 'success');
                setTimeout(() => window.location.reload(), 800);
            } catch (e) { console.error('importData', e); this.showAlert('Errore importazione dati.', 'error'); }
        }

        async _openDatabase() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('SoccerManagerDB', 1);
                req.onerror = () => reject(req.error);
                req.onsuccess = () => resolve(req.result);
                req.onupgradeneeded = (ev) => {
                    const db = ev.target.result;
                    if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles', { keyPath: 'id' });
                };
            });
        }

        scheduleAutoSync(delay = 1000) {
            try {
                clearTimeout(this._autoSyncTimeout);
                this._autoSyncTimeout = setTimeout(() => { this.syncDatabaseJson(false); }, delay);
            } catch (e) { /* ignore */ }
        }

        _wrapLocalStorageForAutosync() {
            try {
                const original = localStorage.setItem.bind(localStorage);
                const self = this;
                localStorage.setItem = function (k, v) {
                    original(k, v);
                    if (k === 'theme' || k === 'lastExport') return;
                    if (self.handleReady) self.scheduleAutoSync(1500);
                };
            } catch (e) { console.warn('Could not wrap localStorage.setItem', e); }
        }
    }

    const fileSystemManager = new FileSystemManager();
    window.fileSystemManager = fileSystemManager;
    window.syncDatabaseJsonManually = () => fileSystemManager.syncDatabaseJson(true);

    // expose helper for UI code that may call exportAllData
    window.exportAllData = () => fileSystemManager.exportAllData();

})();

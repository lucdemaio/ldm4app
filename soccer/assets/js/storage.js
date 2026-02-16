/**
 * Clean Storage implementation
 */
class Storage {
    static STORAGE_KEY = 'soccermanager_app_state';
    static BACKUP_KEY = 'soccermanager_backup';

    static saveState(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            localStorage.setItem(`${this.STORAGE_KEY}_timestamp`, new Date().toISOString());
            console.log('💾 Stato salvato in LocalStorage');
            return true;
        } catch (error) {
            console.error('❌ Errore salvataggio stato:', error);
            return false;
        }
    }

    static loadState() {
        try {
            const serialized = localStorage.getItem(this.STORAGE_KEY);
            if (!serialized) return null;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('❌ Errore caricamento stato:', error);
            return this.restoreFromBackup();
        }
    }

    static createBackup() {
        try {
            const currentState = localStorage.getItem(this.STORAGE_KEY);
            if (currentState) {
                localStorage.setItem(this.BACKUP_KEY, currentState);
                localStorage.setItem(`${this.BACKUP_KEY}_timestamp`, new Date().toISOString());
                console.log('💾 Backup creato con successo');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Errore creazione backup:', error);
            return false;
        }
    }

    static restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            if (backup) return JSON.parse(backup);
            return null;
        } catch (error) {
            console.error('❌ Errore ripristino backup:', error);
            return null;
        }
    }

    static clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(`${this.STORAGE_KEY}_timestamp`);
            localStorage.removeItem(this.BACKUP_KEY);
            localStorage.removeItem(`${this.BACKUP_KEY}_timestamp`);
            return true;
        } catch (error) {
            console.error('❌ Errore pulizia storage:', error);
            return false;
        }
    }

    static exportToFile() {
        try {
            const state = localStorage.getItem(this.STORAGE_KEY);
            if (!state) { alert('⚠️ Nessun dato da esportare'); return false; }
            const blob = new Blob([state], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `soccermanager-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.href = url; link.click(); URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('❌ Errore esportazione dati:', error); return false;
        }
    }

    static importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try { const content = e.target.result; localStorage.setItem(this.STORAGE_KEY, content); resolve(JSON.parse(content)); }
                catch (err) { reject(err); }
            };
            reader.onerror = () => reject(new Error('Errore lettura file'));
            reader.readAsText(file);
        });
    }

    static isAvailable() {
        try { const t='__storage_test__'; localStorage.setItem(t,t); localStorage.removeItem(t); return true; }
        catch (e) { return false; }
    }

    static getUsedSpace() {
        let total=0; for (let k in localStorage) if (Object.prototype.hasOwnProperty.call(localStorage,k)) total+=localStorage[k].length + k.length; return this.formatBytes(total);
    }

    static getStorageInfo() {
        try {
            const state = localStorage.getItem(this.STORAGE_KEY) || '';
            const backup = localStorage.getItem(this.BACKUP_KEY) || '';
            const stateSize = this.formatBytes(state.length);
            const backupSize = this.formatBytes(backup.length);
            const lastSaved = localStorage.getItem(`${this.STORAGE_KEY}_timestamp`) || 'N/D';
            const lastBackup = localStorage.getItem(`${this.BACKUP_KEY}_timestamp`) || 'N/D';
            return { stateSize, backupSize, lastSaved, lastBackup };
        } catch (e) {
            return { stateSize: 'N/D', backupSize: 'N/D', lastSaved: 'N/D', lastBackup: 'N/D' };
        }
    }

    static formatBytes(bytes){ if(bytes===0) return '0 Bytes'; const k=1024,s=['Bytes','KB','MB','GB'],i=Math.floor(Math.log(bytes)/Math.log(k)); return Math.round(bytes/Math.pow(k,i)*100)/100 + ' ' + s[i]; }

    static exportAll() {
        const keys = ['athletes','teams','events','evaluations','attendance','finances','fiscalReceipts','fiscalCollaborators','fiscalLedger','legalDocuments','meetingMinutes'];
        const out = {};
        for (const k of keys) {
            try { out[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { out[k] = localStorage.getItem(k); }
        }
        return out;
    }

    // ----------------------
    // Blob storage (IndexedDB) per file pesanti (immagini, documenti)
    // ----------------------
    static openBlobDB() {
        return new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open('soccermanager-blobs', 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'key' });
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
            } catch (err) {
                reject(err);
            }
        });
    }

    static async saveBlob(dataURL, key = null) {
        try {
            const db = await this.openBlobDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction('blobs', 'readwrite');
                const store = tx.objectStore('blobs');
                const blobKey = key || 'blob-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
                store.put({ key: blobKey, dataURL, createdAt: new Date().toISOString() });
                tx.oncomplete = () => { db.close(); resolve(blobKey); };
                tx.onerror = () => { db.close(); reject(tx.error || new Error('Transaction error')); };
            });
        } catch (err) {
            console.error('Storage.saveBlob error', err);
            throw err;
        }
    }

    static async getBlob(key) {
        try {
            const db = await this.openBlobDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction('blobs', 'readonly');
                const store = tx.objectStore('blobs');
                const req = store.get(key);
                req.onsuccess = () => { db.close(); resolve(req.result ? req.result.dataURL : null); };
                req.onerror = () => { db.close(); reject(req.error || new Error('Get failed')); };
            });
        } catch (err) {
            console.error('Storage.getBlob error', err);
            return null;
        }
    }

    static async deleteBlob(key) {
        try {
            const db = await this.openBlobDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction('blobs', 'readwrite');
                const store = tx.objectStore('blobs');
                const req = store.delete(key);
                req.onsuccess = () => { db.close(); resolve(true); };
                req.onerror = () => { db.close(); reject(req.error || new Error('Delete failed')); };
            });
        } catch (err) {
            console.error('Storage.deleteBlob error', err);
            return false;
        }
    }

    static async publishEncryptedData(password){ try { const state=localStorage.getItem(this.STORAGE_KEY); if(!state) return false; const conn=JSON.parse(localStorage.getItem('ldm_connection')||'{}'); if(!conn.url) return false; const encrypted=await this.encryptAES(state,password); const res=await fetch(conn.url,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:encrypted}); return res.ok; } catch(e){console.error(e);return false;} }

    static async encryptAES(text,password){ const enc=new TextEncoder(); const salt=crypto.getRandomValues(new Uint8Array(16)); const iv=crypto.getRandomValues(new Uint8Array(12)); const keyMaterial=await crypto.subtle.importKey('raw',enc.encode(password),{name:'PBKDF2'},false,['deriveKey']); const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['encrypt']); const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(text)); const out=new Uint8Array(16+12+ciphertext.byteLength); out.set(salt,0); out.set(iv,16); out.set(new Uint8Array(ciphertext),28); return out; }

}

window.Storage = Storage;

if (!Storage.isAvailable()) {
    console.error('❌ LocalStorage non disponibile. L\'app potrebbe non funzionare correttamente.');
}

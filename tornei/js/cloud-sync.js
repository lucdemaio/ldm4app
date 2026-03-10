/**
 * CLOUD SYNC API
 * Sincronizzazione con server, backup automatico, condivisione
 */

const CloudSync = (function(){
  
  const API_BASE = localStorage.getItem('cloud-api-url') || 'https://api.tornei-pro.com';
  const API_KEY = localStorage.getItem('cloud-api-key');
  
  let syncTimer = null;
  let lastSync = localStorage.getItem('last-sync-time');
  let pendingChanges = [];

  // Configurazione API
  function setAPIConfig(baseUrl, apiKey) {
    localStorage.setItem('cloud-api-url', baseUrl);
    localStorage.setItem('cloud-api-key', apiKey);
    Config.API.ENABLED = true;
  }

  // Realizza una richiesta API con retry
  async function apiCall(method, endpoint, data = null, retries = Config.API.RETRY_ATTEMPTS) {
    if(!API_KEY) {
      console.warn('API Key non configurata');
      return null;
    }

    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: Config.API.TIMEOUT_MS
    };

    if(data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(url, options);
      
      if(!response.ok) {
        if(response.status === 401) {
          console.error('API Key non valida');
          Config.API.ENABLED = false;
          return null;
        }
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch(error) {
      console.error(`API call failed (${method} ${endpoint}):`, error);
      
      if(retries > 0) {
        // Retry con backoff
        await new Promise(r => setTimeout(r, 1000 * (Config.API.RETRY_ATTEMPTS - retries + 1)));
        return apiCall(method, endpoint, data, retries - 1);
      }

      // Se tutti i retry falliscono, aggiungi alla coda offline
      if(method !== 'GET') {
        addPendingChange(method, endpoint, data);
      }

      return null;
    }
  }

  // Aggiungi cambio alla coda offline
  async function addPendingChange(method, endpoint, data) {
    const change = {
      id: makeId('sync'),
      method,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    pendingChanges.push(change);
    localStorage.setItem('pending-sync-changes', JSON.stringify(pendingChanges));
    
    // Salva anche in IDB per persistenza
    await IDB.put('offlineQueue', change);
  }

  // Sincronizza i cambiamenti in sospeso
  async function syncPendingChanges() {
    const pending = JSON.parse(localStorage.getItem('pending-sync-changes') || '[]');
    
    if(pending.length === 0) return true;

    let successCount = 0;

    for(const change of pending) {
      try {
        const result = await apiCall(change.method, change.endpoint, change.data);
        if(result) {
          successCount++;
          // Rimuovi dalla coda
          await IDB.delete('offlineQueue', change.id);
        }
      } catch(e) {
        console.error('Errore sincronizzazione:', e);
      }
    }

    // Aggiorna la lista
    const remaining = pending.slice(successCount);
    localStorage.setItem('pending-sync-changes', JSON.stringify(remaining));
    pendingChanges = remaining;

    return successCount === pending.length;
  }

  // Sincronizza un singolo torneo al cloud
  async function syncTournament(torneo) {
    if(!Config.API.ENABLED || !API_KEY) return false;

    try {
      const result = await apiCall('POST', '/tournaments/sync', {
        torneo,
        timestamp: new Date().toISOString()
      });

      if(result) {
        updateLastSync();
        return true;
      }
    } catch(e) {
      console.error('Errore sync torneo:', e);
    }

    return false;
  }

  // Scarica tornei dal cloud
  async function fetchTournamentsFromCloud() {
    if(!Config.API.ENABLED || !API_KEY) return [];

    try {
      const result = await apiCall('GET', '/tournaments/list');
      return result?.tournaments || [];
    } catch(e) {
      console.error('Errore fetch tornei:', e);
    }

    return [];
  }

  // Backup automatico nel cloud
  async function autoBackupToCloud() {
    if(!Config.API.ENABLED || !API_KEY) return false;

    try {
      // Prepara dump di tutti i dati
      const backup = {};
      for(const store of Config.DB.STORES) {
        backup[store] = await IDB.getAll(store);
      }

      const result = await apiCall('POST', '/backups/create', {
        backup,
        timestamp: new Date().toISOString(),
        version: Config.VERSION
      });

      if(result) {
        console.log('Backup cloud completato');
        updateLastSync();
        return true;
      }
    } catch(e) {
      console.error('Errore backup cloud:', e);
    }

    return false;
  }

  // Ripristina da backup cloud
  async function restoreFromCloud(backupId) {
    if(!Config.API.ENABLED || !API_KEY) return false;

    try {
      const result = await apiCall('GET', `/backups/${backupId}`);
      
      if(result?.backup) {
        // Restore a IDB
        for(const [store, items] of Object.entries(result.backup)) {
          for(const item of items) {
            await IDB.put(store, item);
          }
        }
        return true;
      }
    } catch(e) {
      console.error('Errore restore:', e);
    }

    return false;
  }

  // Avvia sincronizzazione periodica
  function startAutoSync(intervalMs = 5 * 60 * 1000) { // Default 5 minuti
    if(syncTimer) clearInterval(syncTimer);

    syncTimer = setInterval(async () => {
      if(Config.API.ENABLED && navigator.onLine) {
        await syncPendingChanges();
        
        // Ogni ora, fai backup completo
        const lastBackup = localStorage.getItem('last-cloud-backup');
        const now = Date.now();
        if(!lastBackup || (now - parseInt(lastBackup)) > 3600000) {
          await autoBackupToCloud();
          localStorage.setItem('last-cloud-backup', now);
        }
      }
    }, intervalMs);

    console.log('Auto-sync abilitato:', intervalMs, 'ms');
  }

  function stopAutoSync() {
    if(syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  function updateLastSync() {
    lastSync = new Date().toISOString();
    localStorage.setItem('last-sync-time', lastSync);
  }

  function getLastSync() {
    return lastSync;
  }

  function getPendingChangesCount() {
    return pendingChanges.length;
  }

  // Condividi torneo via link
  async function shareViaLink(torneo) {
    try {
      const result = await apiCall('POST', '/shares/create', {
        torneo: {
          id: torneo.id,
          nome: torneo.nome,
          sport: torneo.sport,
          dataInizio: torneo.dataInizio
        }
      });

      if(result?.shareUrl) {
        return result.shareUrl;
      }
    } catch(e) {
      console.error('Errore share:', e);
    }

    return null;
  }

  // Importa torneo condiviso
  async function importSharedTournament(shareId) {
    try {
      const result = await apiCall('GET', `/shares/${shareId}`);
      
      if(result?.torneo) {
        const torneo = result.torneo;
        torneo.id = makeId('torneo');
        torneo.createdAt = new Date().toISOString();
        
        await IDB.put('tornei', torneo);
        return torneo;
      }
    } catch(e) {
      console.error('Errore import share:', e);
    }

    return null;
  }

  // Listener per online/offline
  window.addEventListener('online', () => {
    console.log('Online - sincronizzazione...');
    if(Config.API.ENABLED) syncPendingChanges();
  });

  window.addEventListener('offline', () => {
    console.log('Offline - modalità locale attivata');
  });

  return {
    setAPIConfig,
    apiCall,
    syncPendingChanges,
    syncTournament,
    fetchTournamentsFromCloud,
    autoBackupToCloud,
    restoreFromCloud,
    shareViaLink,
    importSharedTournament,
    startAutoSync,
    stopAutoSync,
    getLastSync,
    getPendingChangesCount,
    isEnabled: () => Config.API.ENABLED,
    isOnline: () => navigator.onLine
  };
})();

// Global reference
if(typeof window !== 'undefined') window.CloudSync = CloudSync;

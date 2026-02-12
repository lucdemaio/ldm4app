(function(){
  // Simple IndexedDB helper (minimal, no external libs)
  const DB_NAME = 'gtw-offline-store';
  const STORE_NAME = 'failedRequests';
  const DB_VERSION = 1;

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  }

  async function saveFailedRequest(entry) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const r = store.add(Object.assign({ timestamp: Date.now() }, entry));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function listFailedRequests() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  }

  async function deleteFailedRequest(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const r = store.delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }

  async function replayRequest(item) {
    try {
      const headers = new Headers(item.headers || {});
      const resp = await fetch(item.url, { method: item.method, headers, body: item.body });
      return { ok: resp.ok, status: resp.status, statusText: resp.statusText };
    } catch (err) {
      return { ok: false, status: 0, statusText: String(err) };
    }
  }

  // expose helpers to window for Blazor interop
  window.__gtw_offline = {
    list: () => listFailedRequests(),
    delete: (id) => deleteFailedRequest(id),
    replay: (id) => listFailedRequests().then(list => {
      const it = list.find(x => x.id === id);
      if (!it) return Promise.reject('not-found');
      return replayRequest(it);
    }),
    replayAll: async () => {
      const saved = await listFailedRequests();
      const results = [];
      for (const s of saved) {
        const r = await replayRequest(s);
        results.push({ id: s.id, result: r });
      }
      return results;
    }
  };

  // wrap fetch to catch failed POST/PUT/DELETE to relative API paths and persist payloads
  if (!window.fetch.__gtw_wrapped) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
      const method = (init && init.method) || (typeof input === 'string' ? 'GET' : (input && input.method)) || 'GET';
      const url = (typeof input === 'string') ? input : (input && input.url) || '';

      // perform the request normally
      try {
        const response = await originalFetch(input, init);
        // if server returns 4xx/5xx and it's an API write request, save locally
        if (!response.ok && ['POST','PUT','DELETE','PATCH'].includes(method.toUpperCase())) {
          // only for same-origin or relative API paths
          try {
            const isApi = url.startsWith('/api') || url.indexOf(window.location.origin + '/api') === 0 || url.indexOf(window.location.pathname) === 0;
            if (isApi) {
              const body = init && init.body ? init.body : null;
              let bodyText = null;
              if (body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams) {
                // best-effort: cannot always read back; store a placeholder
                bodyText = '[unserializable body]';
              } else if (typeof body === 'string') {
                bodyText = body;
              } else if (body && typeof body === 'object') {
                try { bodyText = JSON.stringify(body); } catch(e){ bodyText = String(body); }
              }
              await saveFailedRequest({ url, method, headers: init && init.headers ? init.headers : {}, body: bodyText, status: response.status, statusText: response.statusText });
            }
          } catch(e){ /* swallow */ }
        }
        return response;
      } catch (err) {
        // network error: save POST/PUT/DELETE locally
        if (['POST','PUT','DELETE','PATCH'].includes(method.toUpperCase())) {
          try {
            const body = init && init.body ? init.body : null;
            let bodyText = null;
            if (typeof body === 'string') bodyText = body;
            else if (body && typeof body === 'object') {
              try { bodyText = JSON.stringify(body); } catch(e) { bodyText = String(body); }
            }
            await saveFailedRequest({ url, method, headers: init && init.headers ? init.headers : {}, body: bodyText, networkError: String(err) });
          } catch(e) { /* swallow */ }
        }
        throw err; // rethrow so application sees the failure
      }
    };
    window.fetch.__gtw_wrapped = true;
  }
})();
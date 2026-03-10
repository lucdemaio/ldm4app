/* Lightweight IndexedDB wrapper for the static Gestionale Tornei
   - stores: tornei, squadre, giornate, offlineQueue
   - simple Promise API
*/
const DB_NAME = 'gestionale-tornei';
const DB_VERSION = 1;

const IDB = (function(){
  let db;
  function open(){
    return new Promise((res, rej)=>{
      if(db) return res(db);
      const rq = indexedDB.open(DB_NAME, DB_VERSION);
      rq.onupgradeneeded = e => {
        const d = e.target.result;
        if(!d.objectStoreNames.contains('tornei')) d.createObjectStore('tornei', { keyPath: 'id' });
        if(!d.objectStoreNames.contains('squadre')) d.createObjectStore('squadre', { keyPath: 'id' });
        if(!d.objectStoreNames.contains('giornate')) d.createObjectStore('giornate', { keyPath: 'id' });
        if(!d.objectStoreNames.contains('offlineQueue')) d.createObjectStore('offlineQueue', { keyPath: 'id' });
      };
      rq.onsuccess = () => { db = rq.result; res(db); };
      rq.onerror = () => rej(rq.error);
    });
  }

  function tx(storeName, mode = 'readonly'){
    return open().then(d => d.transaction(storeName, mode).objectStore(storeName));
  }

  return {
    async getAll(store){ const s = await tx(store); return new Promise((res,rej)=>{ const r = s.getAll(); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }); },
    async get(store, id){ const s = await tx(store); return new Promise((res,rej)=>{ const r = s.get(id); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }); },
    async put(store, obj){ const s = await tx(store, 'readwrite'); return new Promise((res,rej)=>{ const r = s.put(obj); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }); },
    async delete(store, id){ const s = await tx(store, 'readwrite'); return new Promise((res,rej)=>{ const r = s.delete(id); r.onsuccess = ()=>res(true); r.onerror = ()=>rej(r.error); }); },
    async clear(store){ const s = await tx(store, 'readwrite'); return new Promise((res,rej)=>{ const r = s.clear(); r.onsuccess = ()=>res(true); r.onerror = ()=>rej(r.error); }); }
  };
})();

// helper id
function makeId(prefix='id'){ return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }

// offline queue API (stores failed requests to be replayed later)
const OfflineQueue = {
  async list(){ return IDB.getAll('offlineQueue'); },
  async add(entry){ entry.id = makeId('queue'); entry.createdAt = new Date().toISOString(); return IDB.put('offlineQueue', entry); },
  async remove(id){ return IDB.delete('offlineQueue', id); },
  async clear(){ return IDB.clear('offlineQueue'); }
};

// tornei API (client-side storage)
const TorneiStore = {
  async list(){ return IDB.getAll('tornei'); },
  async get(id){ return IDB.get('tornei', id); },
  async save(t){ t.id = t.id || makeId('torneo'); t.created = t.created || new Date().toISOString(); return IDB.put('tornei', t); },
  async remove(id){ return IDB.delete('tornei', id); }
};

// squadre API (client-side storage)
const SquadreStore = {
  async list(){ return IDB.getAll('squadre'); },
  async get(id){ return IDB.get('squadre', id); },
  async save(s){ s.id = s.id || makeId('squadra'); s.created = s.created || new Date().toISOString(); return IDB.put('squadre', s); },
  async remove(id){ return IDB.delete('squadre', id); }
};

window.IDB = IDB; window.TorneiStore = TorneiStore; window.SquadreStore = SquadreStore; window.OfflineQueue = OfflineQueue;

// Export / Import whole DB (serialize stores)
window.ExportImport = {
  async exportAll(){
    const tornei = await IDB.getAll('tornei');
    const squadre = await IDB.getAll('squadre');
    const giornate = await IDB.getAll('giornate');
    const offline = await IDB.getAll('offlineQueue');
    return { tornei, squadre, giornate, offline, exportedAt: new Date().toISOString() };
  },
  async importAll(data){
    if(!data) throw new Error('No data');
    // clear existing
    await IDB.clear('tornei'); await IDB.clear('squadre'); await IDB.clear('giornate'); await IDB.clear('offlineQueue');
    // bulk put
    for(const t of (data.tornei||[])) await IDB.put('tornei', t);
    for(const s of (data.squadre||[])) await IDB.put('squadre', s);
    for(const g of (data.giornate||[])) await IDB.put('giornate', g);
    for(const q of (data.offline||[])) await IDB.put('offlineQueue', q);
    return true;
  }
};

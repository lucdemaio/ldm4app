// Service Worker per servire i file modello memorizzati in IndexedDB sotto /local-models/{modelId}/{file}
// POSIZIONA questo file alla radice del sito (stesso scope della pagina ia.turni.html)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (ev) => { ev.waitUntil(self.clients.claim()); });

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('webllm-model-store', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetFileRecord(key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('files', 'readonly');
    const r = tx.objectStore('files').get(key);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}

function contentTypeFromName(name) {
  if (name.endsWith('.wasm')) return 'application/wasm';
  if (name.endsWith('.json')) return 'application/json; charset=utf-8';
  if (name.endsWith('.safetensors') || name.endsWith('.bin') || name.endsWith('.msgpack')) return 'application/octet-stream';
  if (name.endsWith('.txt') || name.endsWith('.md')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Intercetta solo richieste verso /local-models/
  if (!url.pathname.startsWith('/local-models/')) return; // lascia passare

  event.respondWith((async () => {
    const parts = url.pathname.split('/').filter(Boolean); // ['local-models', '{modelId}', ...file]
    if (parts.length < 2) return fetch(event.request);
    const modelId = parts[1];
    const filePath = parts.slice(2).join('/') || '';
    const key = modelId + '|' + filePath;

    try {
      const rec = await idbGetFileRecord(key);
      if (rec && rec.blob) {
        return new Response(rec.blob, { headers: { 'Content-Type': contentTypeFromName(filePath) } });
      }
      return fetch(event.request);
    } catch (err) {
      return fetch(event.request);
    }
  })());
});

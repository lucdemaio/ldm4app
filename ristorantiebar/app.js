// --- Aggiunta/Modifica Bevande e Dolci ---
function clearDrinkForm() {
  document.getElementById('drinkName').value = '';
  document.getElementById('drinkPrice').value = '';
  document.getElementById('drinkUnit').value = '';
  document.getElementById('drinkSku').value = '';
  document.getElementById('addDrinkBtn').dataset.editing = '';
}

function fillDrinkForm(drink) {
  document.getElementById('drinkName').value = drink.name || '';
  document.getElementById('drinkPrice').value = drink.price || '';
  document.getElementById('drinkUnit').value = drink.unit || '';
  document.getElementById('drinkSku').value = drink.sku || '';
  document.getElementById('addDrinkBtn').dataset.editing = drink.id;
}

async function addOrUpdateDrink() {
  const name = document.getElementById('drinkName').value.trim();
  const price = Number(document.getElementById('drinkPrice').value);
  const unit = document.getElementById('drinkUnit').value.trim();
  const sku = document.getElementById('drinkSku').value.trim();
  if (!name || !unit || isNaN(price) || price <= 0) return showToast('Compila tutti i campi', true);
  DB.drinks = DB.drinks || [];
  const editingId = document.getElementById('addDrinkBtn').dataset.editing;
  if (editingId) {
    // Modifica
    const idx = DB.drinks.findIndex(d => d.id == editingId);
    if (idx !== -1) {
      DB.drinks[idx] = { ...DB.drinks[idx], name, price, unit, sku };
    }
  } else {
    // Nuovo
    const newId = Date.now();
    DB.drinks.push({ id: newId, name, price, unit, sku });
  }

  // Se è stata fornita una SKU, assicurati che esista anche in inventario
  DB.inventory = DB.inventory || [];
  if (sku) {
    const ex = DB.inventory.find(i => i.sku === sku);
    if (ex) {
      // Aggiorna alcune proprietà se mancanti
      ex.name = ex.name || name;
      ex.unit = ex.unit || unit;
      ex.unit_cost = ex.unit_cost || price;
    } else {
      DB.inventory.push({ sku: sku, name: name || sku, unit: unit || 'pcs', qty: 0, unit_cost: price || 0, min_qty: 0, reorder_to: 0 });
    }
  }

  await saveToLocalStorage();
  renderDrinksSelect();
  renderInventory();
  renderDashboard();
  if(isServerAvailable) await syncLocalToServer();
  showToast('Salvato');
  clearDrinkForm();
}
// Carica bevande di esempio
async function loadSampleDrinks() {
  try {
    const res = await fetch('sample-drinks.json');
    const data = await res.json();
    DB.drinks = (DB.drinks||[]).concat(data);
    // Aggiungi le bevande caricate anche all'inventario (qty iniziale 0 se manca)
    DB.inventory = DB.inventory || [];
    data.forEach(d => {
      if (!d.sku) return;
      const ex = DB.inventory.find(i => i.sku === d.sku);
      if (!ex) DB.inventory.push({ sku: d.sku, name: d.name || d.sku, unit: d.unit || 'pcs', qty: 0, unit_cost: d.price || 0, min_qty: 0, reorder_to: 0 });
    });
    await saveToLocalStorage();
    renderDrinksSelect();
    renderInventory();
    showToast('Bevande caricate');
  } catch (e) { showToast('Errore caricamento bevande', true); }
}
// Carica dolci di esempio
async function loadSampleDesserts() {
  try {
    const res = await fetch('sample-desserts.json');
    const data = await res.json();
    DB.drinks = (DB.drinks||[]).concat(data);
    // Aggiungi i dolci caricati anche all'inventario (qty iniziale 0 se manca)
    DB.inventory = DB.inventory || [];
    data.forEach(d => {
      if (!d.sku) return;
      const ex = DB.inventory.find(i => i.sku === d.sku);
      if (!ex) DB.inventory.push({ sku: d.sku, name: d.name || d.sku, unit: d.unit || 'pcs', qty: 0, unit_cost: d.price || 0, min_qty: 0, reorder_to: 0 });
    });
    await saveToLocalStorage();
    renderDrinksSelect();
    renderInventory();
    showToast('Dolci caricati');
  } catch (e) { showToast('Errore caricamento dolci', true); }
}
// --- Bevande, Caffè, Dolci ---
function renderDrinksSelect() {
  const sel = document.getElementById('drinksItem');
  if (!sel) return;
  sel.innerHTML = '';
  // Solo prodotti con categoria "bevanda", "caffè", "dolce"
  const drinks = (DB.drinks||[]);
  drinks.forEach(d => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = `${d.name} — ${currency(d.price)}`;
    sel.appendChild(o);
  });
  // Lista per modifica
  const panel = sel.closest('.panel');
  let list = panel && panel.querySelector('#drinksEditList');
  if (!list) {
    list = document.createElement('ul');
    list.id = 'drinksEditList';
    list.className = 'orders-list';
    panel.appendChild(list);
  }
  list.innerHTML = '';
  drinks.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="o-head">${escapeHtml(d.name)} • ${currency(d.price)} <span class="muted">${escapeHtml(d.unit||'')}</span></div><div class="o-items">SKU: ${escapeHtml(d.sku||'')}</div><button class="btn ghost small" onclick="window.editDrink(${d.id})">Modifica</button>`;
    list.appendChild(li);
  });
}

// Assicura che tutte le bevande/dolci con SKU siano presenti anche in inventario
function ensureDrinksInInventory(){
  DB.inventory = DB.inventory || [];
  (DB.drinks||[]).forEach(d => {
    if (!d.sku) return;
    const ex = DB.inventory.find(i => i.sku === d.sku);
    if (!ex) DB.inventory.push({ sku: d.sku, name: d.name || d.sku, unit: d.unit || 'pcs', qty: 0, unit_cost: d.price || 0, min_qty: 0, reorder_to: 0 });
  });
}

function renderDrinksSales() {
  const salesList = document.getElementById('drinksSalesList');
  if (salesList) {
    salesList.innerHTML = '';
    (DB.drinksSales||[]).slice().reverse().forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="o-head">Ordine #${s.id} • ${escapeHtml(s.name)} • ${currency(s.unit_price)} • ${s.qty} ${s.unit||''}</div><div class="o-items">${escapeHtml(s.note||'')}</div>`;
      salesList.appendChild(li);
    });
  }
}

function renderDrinksShortages() {
  const list = document.getElementById('drinksShortagesList');
  if (!list) return;
  list.innerHTML = '';
  (DB.drinksShortages||[]).slice().reverse().forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="o-head">${escapeHtml(s.sku||'')} — Mancano ${s.shortage} ${s.unit||''}</div>`;
    list.appendChild(li);
  });
}

async function createDrinkSale() {
  const sel = document.getElementById('drinksItem');
  const qty = Number(document.getElementById('drinksQty').value || 1);
  if (!sel || !sel.value || qty <= 0) return showToast('Seleziona prodotto e quantità valida', true);
  const drink = (DB.drinks||[]).find(d => d.id == sel.value);
  if (!drink) return showToast('Prodotto non trovato', true);
  DB.drinksSales = DB.drinksSales || [];
  const sale = { id: Date.now(), drinkId: drink.id, name: drink.name, qty: qty, unit_price: drink.price, unit: drink.unit, createdAt: new Date().toISOString() };
  // Gestione magazzino (se serve)
  let shortageOccurred = false;
  DB.inventory = DB.inventory || [];
  if (drink.sku) {
    const it = DB.inventory.find(i => i.sku === drink.sku);
    if (it) {
      if (Number(it.qty) >= qty) {
        it.qty = Number(it.qty) - qty;
      } else {
        shortageOccurred = true;
        it.qty = 0;
        DB.drinksShortages = DB.drinksShortages || [];
        DB.drinksShortages.push({ sku: drink.sku, requested: qty, available: it.qty, shortage: qty - Number(it.qty), unit: drink.unit, at: new Date().toISOString() });
      }
    }
  }
  if (shortageOccurred) sale.note = 'Attenzione: prodotto esaurito!';
  DB.drinksSales.push(sale);
  await saveToLocalStorage();
  renderInventory();
  renderDrinksSales();
  renderDrinksShortages();
  renderDashboard();
  showToast('Ordine registrato');
}

function attachDrinksPanelEvents() {
        // Salva dati solo per drinks
        const saveDrinksBtn = document.getElementById('saveDrinksBtn');
        if (saveDrinksBtn) saveDrinksBtn.onclick = async function() {
          await saveToLocalStorage();
          showToast('Dati bevande/dolci salvati');
        };
      const addDrinkBtn = document.getElementById('addDrinkBtn');
      if (addDrinkBtn) addDrinkBtn.onclick = addOrUpdateDrink;
      const clearDrinkFormBtn = document.getElementById('clearDrinkFormBtn');
      if (clearDrinkFormBtn) clearDrinkFormBtn.onclick = clearDrinkForm;
      window.editDrink = function(id) {
        const drink = (DB.drinks||[]).find(d => d.id == id);
        if (drink) fillDrinkForm(drink);
      };
    const loadDrinksBtn = document.getElementById('loadDrinksBtn');
    if (loadDrinksBtn) loadDrinksBtn.onclick = loadSampleDrinks;
    const loadDessertsBtn = document.getElementById('loadDessertsBtn');
    if (loadDessertsBtn) loadDessertsBtn.onclick = loadSampleDesserts;
    const loadDrinksFileBtn = document.getElementById('loadDrinksFileBtn');
    if (loadDrinksFileBtn) loadDrinksFileBtn.onclick = function(){ openFilePickerFor('drinks'); };
  const btn = document.getElementById('createDrinkSaleBtn');
  if (btn) btn.onclick = createDrinkSale;
  const sel = document.getElementById('drinksItem');
  if (sel) sel.onchange = function() {
    const drink = (DB.drinks||[]).find(d => d.id == sel.value);
    document.getElementById('drinksUnit').textContent = drink ? (drink.unit || '—') : '—';
  };
}

// Inizializzazione eventi per la sezione drinks
attachDrinksPanelEvents();

// --- Sample files disponibili ---
const SAMPLE_FILES = {
  inventory: [
    'sample-inventory.json',
    'sample-inventory-extended.json',
    'sample-bar-full.json',
    'sample-bistro-full.json',
    'sample-ristorante-full.json',
    'sample-full-extended.json',
    'sample-database.json',
    'sample-data.json'
  ],
  menu: [
    'sample-menu.json',
    'sample-menu-extended.json',
    'sample-bar-full.json',
    'sample-bistro-full.json',
    'sample-ristorante-full.json',
    'sample-full-extended.json',
    'sample-database.json',
    'sample-data.json'
  ],
  drinks: [
    'sample-drinks.json',
    'sample-drinks-extended.json',
    'sample-desserts.json',
    'sample-desserts-extended.json',
    'sample-bar-full.json',
    'sample-bistro-full.json',
    'sample-ristorante-full.json',
    'sample-full-extended.json',
    'sample-database.json',
    'sample-data.json'
  ]
};

function populateSampleSelects() {
  const invSel = document.getElementById('inventorySampleSelect');
  if (invSel) {
    invSel.innerHTML = '<option value="">Carica esempio...</option>' + SAMPLE_FILES.inventory.map(f => `<option value="${f}">${f}</option>`).join('');
    invSel.onchange = async function() {
      if (!this.value) return;
      await importSampleFile('inventory', this.value);
      this.value = '';
    };
  }
  const menuSel = document.getElementById('menuSampleSelect');
  if (menuSel) {
    menuSel.innerHTML = '<option value="">Carica esempio...</option>' + SAMPLE_FILES.menu.map(f => `<option value="${f}">${f}</option>`).join('');
    menuSel.onchange = async function() {
      if (!this.value) return;
      await importSampleFile('menu', this.value);
      this.value = '';
    };
  }
  const drinksSel = document.getElementById('drinksSampleSelect');
  if (drinksSel) {
    drinksSel.innerHTML = '<option value="">Carica esempio...</option>' + SAMPLE_FILES.drinks.map(f => `<option value="${f}">${f}</option>`).join('');
    drinksSel.onchange = async function() {
      if (!this.value) return;
      await importSampleFile('drinks', this.value);
      this.value = '';
    };
  }
}

async function importSampleFile(target, file) {
  try {
    const res = await fetch(file);
    if (!res.ok) return showToast('File non trovato', true);
    const data = await res.json();
    if (target === 'inventory') {
      if (Array.isArray(data)) DB.inventory = data;
      else if (data.inventory) DB.inventory = data.inventory;
      else return showToast('Formato file non valido', true);
      await saveToLocalStorage();
      renderInventory();
      showToast('Inventario di esempio caricato');
    } else if (target === 'menu') {
      if (Array.isArray(data)) DB.menu = data;
      else if (data.menu) DB.menu = data.menu;
      else return showToast('Formato file non valido', true);
      await saveToLocalStorage();
      renderMenu();
      showToast('Menu di esempio caricato');
    } else if (target === 'drinks') {
      if (Array.isArray(data)) DB.drinks = data;
      else if (data.drinks) DB.drinks = data.drinks;
      else return showToast('Formato file non valido', true);
      ensureDrinksInInventory();
      await saveToLocalStorage();
      renderDrinksSelect();
      renderInventory();
      showToast('Bevande/dolci di esempio caricati');
    }
  } catch (e) {
    showToast('Errore caricamento esempio', true);
  }
}

window.addEventListener('DOMContentLoaded', populateSampleSelects);

// Chiamare queste funzioni quando si mostra la sezione drinks
function showDrinksSection() {
  renderDrinksSelect();
  renderDrinksSales();
  renderDrinksShortages();
  attachDrinksPanelEvents();
}

// Hook per navigation
const oldShowSection = window.showSection;
function showSectionWithDrinks(id) {
  showSection(id);
  if (id === 'drinks') showDrinksSection();
}
// Salva la quantità minima modificata per un prodotto
window.saveMinQty = async function(idx) {
  const input = document.getElementById('minQtyInput_' + idx);
  const targetInput = document.getElementById('targetQtyInput_' + idx);
  if (!input) return showToast('Input non trovato', true);
  const val = Number(input.value);
  if (isNaN(val) || val < 0) return showToast('Valore non valido', true);
  DB.inventory[idx].min_qty = val;
  if (targetInput) {
    const targetVal = Number(targetInput.value);
    if (!isNaN(targetVal) && targetVal >= 0) DB.inventory[idx].reorder_to = targetVal;
  }
  await saveToLocalStorage();
  showToast('Quantità minima/target aggiornata');
  renderInventory();
}
/* app.js — Procurement (Suppliers, Inventory, Purchases, Invoices)
   - Interagisce con /api/data per caricare e salvare il DB (server sovrascrive database.json)
*/

/* Prevent redeclaration when multiple copies are loaded (PWA + original). Use window-scoped fallbacks. */
if (!window.APP_VERSION) window.APP_VERSION = '2026-01-28-01';
window.API = window.API || '/api/data';
window.DB = window.DB || { suppliers: [], inventory: [], purchases: [], invoices: [], settings: { currency: 'EUR' } };
window.currentPO = window.currentPO || { supplierId: null, lines: [] };
window.isServerAvailable = window.isServerAvailable !== undefined ? window.isServerAvailable : true; // updated via pingServer
window.pendingImportTarget = window.pendingImportTarget || null; // when user opens file picker to import specific data
var APP_VERSION = window.APP_VERSION;
var API = window.API;
var DB = window.DB;
var currentPO = window.currentPO;
var isServerAvailable = window.isServerAvailable;
var pendingImportTarget = window.pendingImportTarget;
window.APP_VERSION = APP_VERSION; // expose for debugging

function fetchWithTimeout(resource, options = {}) {
  const { timeout = 4000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function pingServer() {
  try {
    const res = await fetchWithTimeout('/api/data', { timeout: 2500 });
    if (res && res.ok) {
      isServerAvailable = true;
      hideServerBanner();
      uiLog('server reachable');
      return true;
    }
  } catch (e) {
    // failed
  }
  isServerAvailable = false;
  // server banner intentionally disabled
  uiLog('server unreachable');
  return false;
}

function showServerBanner(){ /* server banner disabled */ }
function hideServerBanner(){ /* server banner disabled */ }

// exportDBFallback disabilitato: non più download automatico JSON
function exportDBFallback(){ showToast('Dati NON scaricati. I dati sono salvati solo in locale.', true); uiLog('export fallback DISABLED'); }

/* ---------- Utils ---------- */
function showToast(msg, err = false) {
  // Mostra solo errori utente o dati, mai errori di connessione/server
  if (typeof msg === 'string' && /server|server non raggiung|connessione.*(assente|fallita)|server ancora irraggiungibile|impossibile caricare libreria zip|dati non scaricati|salvataggio fallito|sincronizzazione fallita|export fallback/i.test(msg)) return;
  const t = document.getElementById('toast');
  if (!t) { console.log((err? 'ERROR: ': '') + msg); return; }
  t.textContent = msg; t.classList.remove('hidden'); t.classList.toggle('err', !!err);
  setTimeout(() => t.classList.add('hidden'), 2500);
}



async function fetchData() {
  if (location && location.protocol === 'file:' && !API.startsWith('http')) {
    return;
  }

  if (!isServerAvailable) {
    uiLog('skipping fetchData: server not available');
    showServerBanner();
    return;
  }

  // If there are unsynced local changes, avoid fetching from server (prevents overwriting local save)
  if (DB && DB._local_unsynced) {
    uiLog('skipping fetchData: local unsynced present');
    showToast('Dati locali in sospeso; premi Sync per inviarli', true);
    return;
  }

  try {
    const res = await fetchWithTimeout(API, { timeout: 4000 });
    const json = await res.json();
    if (!json.ok) throw new Error('Errore caricamento DB');
    // Merge server data with local drinks (to avoid accidental deletion if server doesn't store drinks)
    const serverData = json.data || {};
    serverData.drinks = serverData.drinks || DB.drinks || [];
    DB = serverData;
    DB.suppliers = DB.suppliers || [];
    DB.inventory = DB.inventory || [];
    DB.purchases = DB.purchases || [];
    DB.invoices = DB.invoices || [];
    DB.sales = DB.sales || [];
    DB.shortages = DB.shortages || [];
    DB.menu = DB.menu || [];
    DB.settings = DB.settings || { currency: 'EUR' };
    DB.drinks = DB.drinks || [];
    // Ensure inventory items have a unit
    DB.inventory.forEach(i=>{ if(!i.unit) i.unit = 'pcs'; });
    hideServerBanner();
    renderAll();
  } catch (err) {
    console.error('[UI] fetchData error', err);
    uiLog('fetchData error: '+(err.message||err));
    isServerAvailable = false;
    showServerBanner(); // banner disabled
    // Toast suppressed for connectivity errors to avoid top-page alert
  }
}

async function saveDataImpl() {
  if (!isServerAvailable) {
    uiLog('server down: export fallback DISABLED');
    return;
  }

  try {
    console.debug('[UI] saveData: POST to', API, 'payloadKeys', Object.keys(DB || {}).join(','));
    const res = await fetchWithTimeout(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(DB), timeout: 5000 });
    console.debug('[UI] saveData: response status', res.status);
    const json = await res.json();
    console.debug('[UI] saveData: response json', json);
    if (!json.ok) throw new Error(json.error || 'Salvataggio fallito');
    showToast('DB aggiornato ✅');
    // If a local unsynced marker exists, clear it on successful server save
    try{ localStorage.removeItem('gestionale_local_db'); if(DB._local_unsynced) { DB._local_unsynced = false; uiLog('local changes cleared after sync'); } }catch(e){}
    isServerAvailable = true;
    await fetchData();
  } catch (err) {
    console.error('[UI] saveData error', err);
    isServerAvailable = false;
    showServerBanner();
    uiLog('save failed: saving local fallback');
    try{ await saveToLocalStorage(); showToast('Salvataggio locale effettuato'); }catch(e){ uiLog('local save also failed: '+(e.message||e)); showToast('Salvataggio locale fallito', true); }
  }
}

/* ---------- Render / Sections ---------- */
function showSection(id) {
  // Hide all sections
  document.querySelectorAll('.panel-section, .dashboard').forEach(el => el.style.display = 'none');
  // Show requested section
  const s = document.getElementById('section-' + id);
  if (s) {
    s.style.display = '';
    if (id === 'menu') {
      // ensure menu UI is up-to-date and focus input to guide user
      setTimeout(()=>{ renderMenu(); const mn = document.getElementById('menuName'); if(mn) mn.focus(); const ing = document.querySelector('#menuIngredients select.sku'); if(ing) ing.focus(); }, 60);
    }
    if (id === 'sales') {
      // Aggiorna sempre la lista piatti ordinabili quando si entra in Ordini clienti
      setTimeout(()=>{
        renderSales();
        // Reset selezione menu a tendina e quantità
        const sel = document.getElementById('salesItem');
        const qty = document.getElementById('salesQty');
        if(sel && sel.options.length > 0) sel.selectedIndex = 0;
        if(qty) qty.value = 1;
      }, 30);
    }
  }
  // Update active state in the sidebar
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    const sec = a.dataset && a.dataset.section;
    if (sec === id) a.classList.add('active'); else a.classList.remove('active');
  });
  if (window.lucide && typeof window.lucide.createIcons === 'function') try { window.lucide.createIcons(); } catch (e) {}
}

function renderAll() {
  renderDashboard();
  renderInventory();
  renderSuppliers();
  renderPurchases();
  renderInvoices();
  renderSales();
  renderMenu();
}

// ---------- Menu and Shopping List ----------
function renderMenu(){
  DB.menu = DB.menu || [];
  // populate ingredient SKU selects
  const skuOptions = DB.inventory.map(i=>`<option value="${escapeHtml(i.sku)}">${escapeHtml(i.sku)} — ${escapeHtml(i.name)}</option>`).join('');
  const menuList = document.getElementById('menuList');
  if(menuList){
    menuList.innerHTML='';
    DB.menu.forEach((m, idx)=>{
      const li = document.createElement('li');
      const lines = (m.lines||[]).map(l=>`${escapeHtml(l.sku)} x${l.qty}${l.unit? ' '+escapeHtml(l.unit):''}`).join('<br>');
      li.innerHTML = `<div class="o-head">${escapeHtml(m.name)} • ${currency(m.price)}</div><div class="o-items">${lines}</div><div style="margin-top:8px;display:flex;gap:8px;align-items:center"><input type="number" id="orderQty_${m.id}" value="1" min="1" style="width:80px;margin-right:8px"><button class="btn primary" onclick="window.orderMenuFromMenuList(${m.id})">Ordina</button><button class="btn ghost" onclick="window.editMenuItem(${idx})">Modifica</button></div>`;
      menuList.appendChild(li);
    });
  }
  // Funzione globale per ordinare dal menu senza doppio salvataggio
  window.orderMenuFromMenuList = function(menuId) {
    // Porta alla sezione ordini clienti e seleziona SOLO il piatto e la quantità
    showSection('sales');
    setTimeout(() => {
      const sel = document.getElementById('salesItem');
      if (!sel) return showToast('Pannello ordini clienti non disponibile', true);
      // Trova l'opzione corretta e selezionala
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === 'menu:' + menuId) {
          sel.selectedIndex = i;
          break;
        }
      }
      const qtyInput = document.getElementById('orderQty_' + menuId);
      const qty = qtyInput ? Number(qtyInput.value) : 1;
      document.getElementById('salesQty').value = qty;
      // L'utente deve premere "Registra ordine" per confermare
    }, 120);
  }
  // Funzione globale per modificare un piatto
  window.editMenuItem = function(idx) {
    const m = DB.menu[idx];
    if(!m) return showToast('Piatto non trovato', true);
    document.getElementById('menuName').value = m.name;
    document.getElementById('menuPrice').value = m.price;
    const ingBox = document.getElementById('menuIngredients');
    ingBox.innerHTML = '';
    (m.lines||[]).forEach(ln => {
      const row = document.createElement('div');
      row.className = 'menu-ingredient-row';
      row.innerHTML = `<select class="sku small"></select><input type="number" class="qty small" min="0.01" step="0.01" placeholder="qty" value="${ln.qty}"><button class="btn ghost small remove">Rimuovi</button><button class="btn ghost small newIngBtn" title="Crea nuovo ingrediente in inventario">Nuovo ingrediente</button><div class="new-ingredient hidden"><input class="new-sku" placeholder="sku"><input class="new-name" placeholder="nome"><select class="new-unit"><option value="pcs">pcs</option><option value="kg">kg</option></select><button class="btn small createNewBtn">Crea</button></div>`;
      // Popola select SKU
      const selectsHtml = DB.inventory.map(i=>`<option value="${escapeHtml(i.sku)}">${escapeHtml(i.sku)} — ${escapeHtml(i.name)}</option>`).join('');
      const sel = row.querySelector('select');
      sel.innerHTML = '<option value="">-- seleziona --</option>' + selectsHtml;
      sel.value = ln.sku;
      // Handler remove
      row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); });
      // Handler nuovo ingrediente
      const newBtn = row.querySelector('.newIngBtn');
      const newForm = row.querySelector('.new-ingredient');
      newBtn.addEventListener('click', ()=>{ newForm.classList.toggle('hidden'); const ns = newForm.querySelector('.new-sku'); if(ns) ns.focus(); });
      const createBtn = row.querySelector('.createNewBtn');
      createBtn.addEventListener('click', async ()=>{
        const ns = newForm.querySelector('.new-sku').value.trim();
        const nn = newForm.querySelector('.new-name').value.trim();
        const nu = newForm.querySelector('.new-unit').value || 'pcs';
        if(!ns||!nn) return showToast('SKU e nome richiesti per nuovo ingrediente', true);
        if((DB.inventory||[]).find(i=>i.sku===ns)) return showToast('SKU già presente in inventario', true);
        DB.inventory = DB.inventory || [];
        DB.inventory.push({sku: ns, name: nn, unit: nu, qty: 0, unit_cost: 0});
        await saveData();
        renderInventory();
        sel.innerHTML = '<option value="">-- seleziona --</option>' + DB.inventory.map(i=>`<option value="${escapeHtml(i.sku)}">${escapeHtml(i.sku)} — ${escapeHtml(i.name)}</option>`).join('');
        sel.value = ns;
        newForm.classList.add('hidden');
        showToast('Ingrediente creato e selezionato');
      });
      ingBox.appendChild(row);
    });
  }
  // ensure form ingredient box is up to date
  const ingBox = document.getElementById('menuIngredients'); if(ingBox){ if(!ingBox.children.length) addMenuIngredientRow(); const selects = ingBox.querySelectorAll('select.sku'); selects.forEach(s=>{ if(!s.querySelector('option')) s.innerHTML = '<option value="">-- seleziona --</option>'+skuOptions; }); }
}

function addMenuIngredientRow(){ const box = document.getElementById('menuIngredients'); if(!box) return; const row = document.createElement('div'); row.className='menu-ingredient-row'; row.innerHTML = `<select class="sku small"><option value="">-- seleziona --</option></select><input type="number" class="qty small" min="0.01" step="0.01" placeholder="qty"><button class="btn ghost small remove">Rimuovi</button><button class="btn ghost small newIngBtn" title="Crea nuovo ingrediente in inventario">Nuovo ingrediente</button><div class="new-ingredient hidden"><input class="new-sku" placeholder="sku"><input class="new-name" placeholder="nome"><select class="new-unit"><option value="pcs">pcs</option><option value="kg">kg</option></select><button class="btn small createNewBtn">Crea</button></div>`; box.appendChild(row);
  // fill options
  const selectsHtml = DB.inventory.map(i=>`<option value="${escapeHtml(i.sku)}">${escapeHtml(i.sku)} — ${escapeHtml(i.name)}</option>`).join('');
  const sel = row.querySelector('select'); sel.innerHTML = '<option value="">-- seleziona --</option>' + selectsHtml;
  // autofocus the new SKU select to guide the user
  try{ if(sel && typeof sel.focus==='function') sel.focus(); }catch(e){}
  // remove handler
  row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); });
  // new ingredient toggle and handler
  const newBtn = row.querySelector('.newIngBtn'); const newForm = row.querySelector('.new-ingredient');
  newBtn.addEventListener('click', ()=>{ newForm.classList.toggle('hidden'); const ns = newForm.querySelector('.new-sku'); if(ns) ns.focus(); });
  const createBtn = row.querySelector('.createNewBtn'); createBtn.addEventListener('click', async ()=>{
    const ns = newForm.querySelector('.new-sku').value.trim(); const nn = newForm.querySelector('.new-name').value.trim(); const nu = newForm.querySelector('.new-unit').value || 'pcs'; if(!ns||!nn) return showToast('SKU e nome richiesti per nuovo ingrediente', true);
    // avoid duplicates
    if((DB.inventory||[]).find(i=>i.sku===ns)) return showToast('SKU già presente in inventario', true);
    // create with qty 0
    DB.inventory = DB.inventory || []; DB.inventory.push({sku: ns, name: nn, unit: nu, qty: 0, unit_cost: 0});
    // persist and refresh selects
    await saveData(); renderInventory(); // refresh current row select and set value
    sel.innerHTML = '<option value="">-- seleziona --</option>' + DB.inventory.map(i=>`<option value="${escapeHtml(i.sku)}">${escapeHtml(i.sku)} — ${escapeHtml(i.name)}</option>`).join('');
    sel.value = ns; newForm.classList.add('hidden'); showToast('Ingrediente creato e selezionato');
  });
}

async function addMenuItem(){ const name = document.getElementById('menuName').value.trim(); const price = Number(document.getElementById('menuPrice').value||0); if(!name || price<=0) return showToast('Nome e prezzo corretti richiesti', true);
  const ingBox = document.getElementById('menuIngredients'); if(!ingBox) return showToast('Aggiungi almeno un ingrediente', true);
  const rows = Array.from(ingBox.querySelectorAll('.menu-ingredient-row'));
  const lines = [];
  for(const r of rows){
    const sku = r.querySelector('select').value;
    const qty = Number(r.querySelector('.qty').value||0);
    if(!sku||qty<=0) continue;
    const item = DB.inventory.find(i=>i.sku===sku);
    lines.push({ sku, qty, unit: item? item.unit : 'pcs' });
  }
  if(!lines.length) return showToast('Aggiungi almeno un ingrediente valido', true);
  DB.menu = DB.menu || [];
  DB.menu.push({ id: Date.now(), name, price, lines });
  document.getElementById('menuName').value='';
  document.getElementById('menuPrice').value='';
  document.getElementById('menuIngredients').innerHTML='';
  addMenuIngredientRow();
  await saveToLocalStorage();
  if(isServerAvailable) await syncLocalToServer();
  showToast('Piatto salvato');
  renderMenu();
  renderDashboard();
}

async function createMenuOrder(menuId, qtyOverride){ const menu = (DB.menu||[]).find(m=>m.id==menuId); if(!menu) return showToast('Menu item non trovato', true); const qty = Number(qtyOverride || (document.getElementById('orderQty_'+menuId) && document.getElementById('orderQty_'+menuId).value) || 1); if(qty<=0) return showToast('Quantità non valida', true);
  DB.sales = DB.sales || [];
  const sale = { id: Date.now(), menuId: menuId, name: menu.name, qty: qty, unit_price: menu.price, createdAt: new Date().toISOString() };
  let shortageOccurred = false; const shortageDetails = [];
  // Log ingredienti richiesti e magazzino
  console.log('[ORDER] Ingredienti richiesti per', menu.name, ':', (menu.lines||[]));
  console.log('[ORDER] Inventario attuale:', DB.inventory);
  // Controlla SOLO gli ingredienti richiesti dal piatto
  for(const ln of (menu.lines||[])){
    const needed = Number(ln.qty) * qty;
    const it = DB.inventory.find(i=>i.sku===ln.sku);
    if(!it){
      shortageOccurred = true;
      shortageDetails.push({ sku: ln.sku, requested: needed, available: 0, shortage: needed, unit: ln.unit });
      console.log(`[ORDER] Shortage: ingrediente mancante in magazzino: ${ln.sku}`);
      continue;
    }
    if(Number(it.qty||0) >= needed){
      console.log(`[ORDER] Ingrediente ${ln.sku} sufficiente: serve ${needed}, disponibile ${it.qty}`);
      it.qty = Number(it.qty) - needed;
    } else {
      const available = Number(it.qty||0);
      const shortage = needed - available;
      it.qty = 0;
      shortageOccurred = true;
      shortageDetails.push({ sku: ln.sku, requested: needed, available, shortage, unit: ln.unit || it.unit });
      console.log(`[ORDER] Shortage: ${ln.sku} serve ${needed}, disponibile ${available}, mancano ${shortage}`);
    }
  }
  // Gli ingredienti NON richiesti dal piatto non vengono mai controllati/scalati
  if(shortageOccurred && shortageDetails.length > 0){
    sale.note = 'Attenzione: ingredienti insufficienti!';
    console.log('[ORDER] Shortage rilevato, ordine consentito ma con avviso/modal. Dettagli:', shortageDetails);
    DB.shortages = DB.shortages || [];
    shortageDetails.forEach(sd=> DB.shortages.push(Object.assign({}, sd, { at: new Date().toISOString() })));
    showModal('Mancanza prodotti', `<div class="muted">Alcuni ingredienti non sono sufficienti. Verrà generata una lista della spesa.</div>`, { okText: 'OK' });
    // auto-generate shopping list for shortages
    generateShoppingList();
  } else {
    delete sale.note;
    console.log('[ORDER] Nessuna mancanza, ordine consentito.');
    showToast('Ordine preparato, scorte aggiornate');
  }
  DB.sales.push(sale);
  // Salva e aggiorna UI
  await saveToLocalStorage();
  renderInventory();
  renderSales();
  renderShortages();
  renderDashboard();
}

async function generateShoppingList(){ // create purchases draft based on min/reorder thresholds and recorded shortages
  const lines = [];
  DB.inventory.forEach(i=>{
    const min = Number(i.min_qty||0);
    if(min>0 && i.qty < min){
      const diff = min - Number(i.qty||0);
      if(diff>0) lines.push({ sku: i.sku, name: i.name, qty: diff, unit: i.unit||'pcs' });
    }
  });
  if(!lines.length) return showToast('Nessun articolo da ordinare');

  // Svuota ordini clienti
  DB.sales = [];
  await saveToLocalStorage();
  renderSales && renderSales();

  // Mostra popup con la lista della spesa e bottone PDF
  let html = '<div class="shopping-list-modal"><h2>Lista della spesa</h2>';
  html += '<div class="muted">Questi prodotti sono sotto la soglia minima:</div>';
  html += '<ul>';
  lines.forEach(l => {
    html += `<li><strong>${escapeHtml(l.sku)}</strong> — ${escapeHtml(l.name||'')}<br>Da acquistare: <strong>${l.qty} ${l.unit}</strong></li>`;
  });
  html += '</ul>';
  html += '<div class="modal-actions">';
  html += '<button id="exportShoppingListPdfBtn" class="btn">Esporta PDF</button>';
  html += '<button id="modalOk" class="btn primary">Chiudi</button>';
  html += '</div></div>';

  // Mostra modal custom (senza Annulla)
  const modal = document.getElementById('modal');
  modal.innerHTML = html;
  modal.classList.remove('hidden');
  modal.querySelector('#modalOk').addEventListener('click', ()=> { modal.classList.add('hidden'); });
  modal.querySelector('#exportShoppingListPdfBtn').addEventListener('click', ()=> {
    exportShoppingListPdf(lines);
  });
// Esporta la lista della spesa in PDF (stampa browser)
function exportShoppingListPdf(lines){
  // Crea una finestra temporanea con la lista e lancia la stampa
  const win = window.open('', '', 'width=700,height=900');
  win.document.write('<html><head><title>Lista della spesa</title>');
  win.document.write('<style>body{font-family:Inter,Arial,sans-serif;padding:24px;}h2{color:#059669;}ul{padding-left:18px;}li{margin-bottom:10px;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h2>Lista della spesa</h2>');
  win.document.write('<ul>');
  lines.forEach(l => {
    win.document.write(`<li><strong>${escapeHtml(l.sku)}</strong> — ${escapeHtml(l.name||'')}<br>Da acquistare: <strong>${l.qty} ${l.unit}</strong></li>`);
  });
  win.document.write('</ul>');
  win.document.write('<div style="position:fixed;left:24px;bottom:18px;font-size:13px;color:#888;">Creato da <a href="https://www.ldm4app.com" style="color:#888;text-decoration:underline;">www.ldm4app.com</a></div>');
  win.document.write('</body></html>');
  win.document.close();
  setTimeout(()=>{ win.print(); }, 300);
}
// window.showSection = showSection; // già ridefinito sopra
window.showSection = showSectionWithDrinks;
}

// Adds sample inventory items and a sample menu item (Pizza Margherita)
async function addSampleMenu(){
  DB.inventory = DB.inventory || [];
  const sampleItems = [
    {sku:'FARINA', name:'Farina', unit:'kg', qty:10, unit_cost:1.2, min_qty:5, reorder_to:20},
    {sku:'POM', name:'Pomodoro', unit:'kg', qty:8, unit_cost:1.5, min_qty:3, reorder_to:10},
    {sku:'MOZZ', name:'Mozzarella', unit:'pcs', qty:30, unit_cost:0.8, min_qty:10, reorder_to:50},
    {sku:'BAS', name:'Basilico', unit:'pcs', qty:50, unit_cost:0.05, min_qty:10, reorder_to:100},
    {sku:'OLIO', name:"Olio d'Oliva", unit:'pcs', qty:20, unit_cost:3.0, min_qty:5, reorder_to:30}
  ];
  sampleItems.forEach(si=>{ if(!DB.inventory.find(i=>i.sku===si.sku)) DB.inventory.push(si); });
  DB.menu = DB.menu || [];
  if(!DB.menu.find(m=>m.name==='Pizza Margherita')){
    DB.menu.push({ id: Date.now(), name: 'Pizza Margherita', price: 8.5, lines: [
      { sku: 'FARINA', qty: 0.25, unit: 'kg' },
      { sku: 'POM', qty: 0.15, unit: 'kg' },
      { sku: 'MOZZ', qty: 1, unit: 'pcs' },
      { sku: 'BAS', qty: 0.01, unit: 'pcs' },
      { sku: 'OLIO', qty: 0.02, unit: 'pcs' }
    ] });
  }
  await saveToLocalStorage();
  if(isServerAvailable) await syncLocalToServer();
  showToast('Esempio aggiunto');
  renderInventory(); renderMenu();
}



function renderDashboard() {
  const totalValue = DB.inventory.reduce((s,i)=>s + (Number(i.unit_cost||0) * Number(i.qty||0)), 0);
  document.getElementById('inventoryValue').textContent = currency(totalValue);
  document.getElementById('suppliersCount').textContent = (DB.suppliers||[]).length;
  document.getElementById('purchasesOpen').textContent = (DB.purchases||[]).filter(p=>p.status!=='received').length;
  // Calcola incasso totale dai piatti ordinati
  const salesRevenue = (DB.sales||[]).reduce((sum, s) => sum + (Number(s.unit_price||0) * Number(s.qty||1)), 0);
  const salesRevenueElem = document.getElementById('salesRevenue');
  if (salesRevenueElem) salesRevenueElem.textContent = currency(salesRevenue);
  // small reports: outstanding invoices
  const outstanding = (DB.invoices||[]).filter(inv=>!inv.paid).reduce((s,inv)=>s+Number(inv.total||0),0);
  // attach a small badge to inventory card
  const invCard = document.getElementById('tavoliCard'); if(invCard) invCard.querySelector('.card-value').textContent = currency(totalValue);
  // show a quick report in dashboard area
  const hasReport = document.getElementById('quickReport'); if(!hasReport){ const div = document.createElement('div'); div.id='quickReport'; div.style.marginTop='16px'; div.innerHTML = `<div class="card" style="padding:12px"><div class="card-title">Report rapido</div><div style="margin-top:6px">Fatture aperte: <strong>${currency(outstanding)}</strong></div></div>`; const dash = document.querySelector('.dashboard'); dash.appendChild(div);} else { hasReport.innerHTML = `<div class="card" style="padding:12px"><div class="card-title">Report rapido</div><div style="margin-top:6px">Fatture aperte: <strong>${currency(outstanding)}</strong></div></div>`; }
}

let inventoryFilter = '';

function renderInventory() {
  const tbody = document.getElementById('inventoryTable');
  tbody.innerHTML = '';
  const list = (DB.inventory || []).filter(it => {
    const q = inventoryFilter.trim().toLowerCase();
    if (!q) return true;
    return it.sku.toLowerCase().includes(q) || it.name.toLowerCase().includes(q);
  });
  list.forEach((it, idx) => {
    const tr = document.createElement('tr');
    const min = Number(it.min_qty || 0);
    const qty = Number(it.qty || 0);
    const lowClass = (min>0 && qty <= min) || qty<=0 ? 'low' : '';
    tr.innerHTML = `
      <td>${escapeHtml(it.sku)}</td>
      <td>${escapeHtml(it.name)}</td>
      <td>${currency(it.unit_cost)}</td>
      <td>${escapeHtml(it.unit||'pcs')}</td>
      <td class="${lowClass}">${it.qty}</td>
      <td>
        <input type="number" min="0" step="1" value="${it.min_qty||''}" style="width:60px" id="minQtyInput_${idx}">
        <input type="number" min="0" step="1" value="${it.reorder_to||''}" style="width:60px;margin-left:4px" id="targetQtyInput_${idx}" placeholder="Target">
        <button class="btn small" onclick="window.saveMinQty(${idx})">Salva</button>
      </td>
      <td>${it.reorder_to||''}</td>
      <td><button class="btn" onclick="editInventory(${idx})">Modifica</button> <button class="btn ghost" onclick="confirmDeleteInventory(${idx})">Elimina</button></td>`;
    tbody.appendChild(tr);
  });
  // populate SKU select for POs and menu forms
  const skuSelect = document.getElementById('poSku'); if(skuSelect){ skuSelect.innerHTML = '<option value="">-- seleziona --</option>'; DB.inventory.forEach(it => { const o = document.createElement('option'); o.value = it.sku; o.textContent = `${it.sku} — ${it.name}`; skuSelect.appendChild(o); }); }
  const menuIngBoxes = document.querySelectorAll('#menuIngredients select.sku'); menuIngBoxes.forEach(sel=>{ sel.innerHTML = '<option value="">-- seleziona --</option>'; DB.inventory.forEach(it => { const o=document.createElement('option'); o.value = it.sku; o.textContent = `${it.sku} — ${it.name}`; sel.appendChild(o); }); });
}

let supplierFilter = '';
function renderSuppliers() {
  const list = document.getElementById('suppliersList'); list.innerHTML = '';
  const items = (DB.suppliers || []).filter(s => { const q = supplierFilter.trim().toLowerCase(); if(!q) return true; return (s.name||'').toLowerCase().includes(q) || (s.contact||'').toLowerCase().includes(q); });
  items.forEach((s, idx) => {
    const li = document.createElement('li'); li.innerHTML = `<div class="o-head">${escapeHtml(s.name)}</div><div class="o-items">${escapeHtml(s.contact || '')}</div><div style="margin-top:8px"><button class="btn" onclick="confirmDeleteSupplier(${idx})">Elimina</button></div>`;
    list.appendChild(li);
  });
  const sel = document.getElementById('poSupplier'); sel.innerHTML = '<option value="">-- seleziona --</option>';
  DB.suppliers.forEach((s,idx)=>{ const o=document.createElement('option'); o.value=s.id||s.name; o.textContent=s.name; sel.appendChild(o); });
}

function renderPurchases() {
  const ul = document.getElementById('purchasesList'); ul.innerHTML = '';
  DB.purchases.forEach((p, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="o-head">PO #${p.id} • ${p.supplierName} • <span class="muted">${p.status}</span></div><div class="o-items">${escapeHtml(p.lines.map(l=>l.sku+ ' x'+l.qty).join(', '))}</div>`;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    if (p.status === 'draft') { const sendBtn=document.createElement('button'); sendBtn.className='btn primary'; sendBtn.textContent='Segna come ordinato'; sendBtn.addEventListener('click', async ()=>{ p.status='ordered'; p.orderedAt=new Date().toISOString(); await saveData(); }); actions.appendChild(sendBtn); }
    if (p.status === 'ordered') { const recvBtn=document.createElement('button'); recvBtn.className='btn'; recvBtn.textContent='Ricevuto'; recvBtn.addEventListener('click', async ()=>{ await receivePurchase(idx); }); actions.appendChild(recvBtn); }
    li.appendChild(actions); ul.appendChild(li);
  });
}

function renderInvoices() {
  const ul = document.getElementById('invoicesList'); ul.innerHTML = '';
  DB.invoices.forEach((inv, idx) => {
    const li = document.createElement('li'); li.innerHTML = `<div class="o-head">Fattura #${inv.id} • ${inv.supplierName} • ${currency(inv.total)} <span class="muted">${inv.paid? 'pagata':'aperta'}</span></div><div class="o-items">${escapeHtml(inv.lines.map(l=>l.sku+' x'+l.qty).join(', '))}</div>`;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    if (!inv.paid) { const pay = document.createElement('button'); pay.className='btn primary'; pay.textContent='Registra pagamento'; pay.addEventListener('click', async ()=>{ inv.paid=true; inv.paidAt=new Date().toISOString(); await saveData(); }); actions.appendChild(pay); }
    li.appendChild(actions); ul.appendChild(li);
  });
}

/* ---------- Sales (Ordini clienti) ---------- */
function renderSales(){
  const sel = document.getElementById('salesItem'); if(!sel) return; sel.innerHTML = '';
  // Menu items first
  if((DB.menu||[]).length){ const ogMenu = document.createElement('optgroup'); ogMenu.label = 'Menu'; DB.menu.forEach(m=>{ const o = document.createElement('option'); o.value = 'menu:'+m.id; o.textContent = `${m.name} — ${currency(m.price)}`; ogMenu.appendChild(o); }); sel.appendChild(ogMenu); }
  // Products next
  if((DB.inventory||[]).length){ const ogProd = document.createElement('optgroup'); ogProd.label = 'Prodotti'; DB.inventory.forEach(it=>{ const o = document.createElement('option'); o.value = 'prod:'+it.sku; o.textContent = `${it.sku} — ${it.name} (${it.qty} ${it.unit||'pcs'})`; ogProd.appendChild(o); }); sel.appendChild(ogProd); }

  // default unit display: if first menu item exists show 'porz.' else product unit
  const unitSpan = document.getElementById('salesUnit'); if((DB.menu||[])[0]){ if(unitSpan) unitSpan.textContent = 'porz.'; }
  else if(DB.inventory[0] && unitSpan) unitSpan.textContent = DB.inventory[0].unit || 'pcs';

  // update sales list
  const salesList = document.getElementById('salesList'); if(salesList) { salesList.innerHTML=''; (DB.sales||[]).slice().reverse().forEach(s=>{ const li=document.createElement('li'); if(s.menuId){ li.innerHTML=`<div class="o-head">Ordine #${s.id} • ${escapeHtml(s.name)} • ${currency(s.unit_price)} • ${s.qty} porz.</div><div class="o-items">${escapeHtml(s.note||'')}</div>`; } else { li.innerHTML=`<div class="o-head">Ordine #${s.id} • ${s.sku} • ${currency(s.unit_price)} • ${s.qty} ${s.unit}</div><div class="o-items">${escapeHtml(s.note||'')}</div>`; } salesList.appendChild(li); }); }
  renderShortages();
}

function renderShortages(){ const sl = document.getElementById('shortagesList'); if(!sl) return; sl.innerHTML=''; (DB.shortages||[]).slice().reverse().forEach(sh=>{ const li=document.createElement('li'); li.className='shortage'; li.innerHTML = `<div><strong>${escapeHtml(sh.sku)}</strong> mancano ${sh.shortage} ${sh.unit} (richiesti ${sh.requested})</div><div class="muted">${sh.at}</div>`; sl.appendChild(li); }); }

// Unified panel-based sale creator (handles both Menu and Product selections)
async function createSaleFromPanel(){
  const sel = document.getElementById('salesItem');
  if(!sel) return showToast('Seleziona prodotto', true);
  const v = sel.value || '';
  const qty = Number(document.getElementById('salesQty').value||0);
  if(!v || qty<=0) return showToast('Seleziona prodotto e quantità valida', true);
  // Log per debug
  console.log('[SALE] createSaleFromPanel: selezionato', v, 'quantità', qty);
  if(v.startsWith('menu:')){
    const menuId = Number(v.split(':')[1]);
    // Sanity check: se il menu trovato per id non coincide con il testo selezionato, prova a cercare per nome
    const selectedText = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
    let menu = (DB.menu||[]).find(m=>m.id==menuId);
    if (menu && selectedText && !selectedText.startsWith(menu.name)) {
      console.warn('[SALE] selected text does not match menu id. Selected:', selectedText, 'menuById:', menu.name);
      const nameFromText = selectedText.split(' — ')[0].trim();
      const byName = (DB.menu||[]).find(m => m.name === nameFromText);
      if (byName) { console.log('[SALE] resolved menu by name:', byName.name); menu = byName; }
    }
    if (!menu) {
      // fallback: try find by name directly
      const nameFromText = selectedText.split(' — ')[0].trim();
      menu = (DB.menu||[]).find(m => m.name === nameFromText);
      if (menu) console.log('[SALE] fallback resolved menu by name:', menu.name);
    }
    if (!menu) {
      console.error('[SALE] menu item not found for value', v, 'selectedText', selectedText);
      return showToast('Piatto non trovato', true);
    }
    // Now call createMenuOrder with resolved id
    await createMenuOrder(menu.id, qty);
    return;
  }
  if(v.startsWith('prod:')){
    const sku = v.split(':')[1];
    const item = DB.inventory.find(i=>i.sku===sku);
    if(!item) return showToast('SKU non trovato', true);
    const unit = item.unit||'pcs';
    DB.sales = DB.sales || [];
    const sale = { id: Date.now(), sku: sku, qty, unit: unit, unit_price: item.unit_cost||0, createdAt: new Date().toISOString() };
    if(Number(item.qty||0) >= qty){
      item.qty = Number(item.qty) - qty;
      DB.sales.push(sale);
      await saveToLocalStorage();
      uiLog('sale recorded '+sale.id);
      showToast('Ordine cliente registrato');
    }
    else {
      const shortage = qty - Number(item.qty||0);
      const available = Number(item.qty||0);
      item.qty = 0;
      DB.sales.push(Object.assign({}, sale, { note: 'Parziale, merce disponibile solo parzialmente' }));
      DB.shortages = DB.shortages || [];
      DB.shortages.push({ sku: sku, requested: qty, available: available, shortage: shortage, unit: unit, at: new Date().toISOString() });
      await saveToLocalStorage();
      uiLog('shortage recorded for '+sku+' shortage '+shortage);
      showModal('Mancanza prodotto', `<div class="muted">Non c'è abbastanza <strong>${escapeHtml(sku)}</strong>. Mancano <strong>${shortage} ${unit}</strong>.</div>`, { okText: 'OK' });
    }
    renderInventory();
    renderSales();
    renderDashboard();
    return;
  }
  showToast('Tipo di selezione non riconosciuto', true);
}

async function createCustomerOrder(){ const sku = document.getElementById('salesSku').value; const qty = Number(document.getElementById('salesQty').value||0); if(!sku||qty<=0) return showToast('Seleziona prodotto e quantità valida', true);
  const item = DB.inventory.find(i=>i.sku===sku); if(!item) return showToast('SKU non trovato', true);
  const unit = item.unit||'pcs';
  DB.sales = DB.sales || [];
  const sale = { id: Date.now(), sku: sku, qty, unit: unit, unit_price: item.unit_cost || 0, createdAt: new Date().toISOString() };
  if(Number(item.qty||0) >= qty){
    item.qty = Number(item.qty) - qty;
    DB.sales.push(sale);
    await saveData();
    uiLog('sale recorded '+sale.id);
    showToast('Ordine cliente registrato');
  } else {
    const shortage = qty - Number(item.qty||0);
    const available = Number(item.qty||0);
    // consume what is available
    item.qty = 0;
    DB.sales.push(Object.assign({}, sale, { note: 'Parziale, merce disponibile solo parzialmente' }));
    DB.shortages = DB.shortages || [];
    DB.shortages.push({ sku: sku, requested: qty, available: available, shortage: shortage, unit: unit, at: new Date().toISOString() });
    await saveData();
    uiLog('shortage recorded for '+sku+' shortage '+shortage);
    showModal('Mancanza prodotto', `<div class="muted">Non c'è abbastanza <strong>${escapeHtml(sku)}</strong>. Mancano <strong>${shortage} ${unit}</strong>.</div>`, { okText: 'OK' });
  }
  renderInventory(); renderSales(); renderDashboard(); renderDashboard(); }

// Hook sale button in attachButtonsRobust


/* ---------- Actions: Suppliers ---------- */
async function addSupplier(){ const name=document.getElementById('supplierName').value.trim(); const contact=document.getElementById('supplierContact').value.trim(); if(!name) return showToast('Nome fornitore richiesto',true); DB.suppliers=DB.suppliers||[]; DB.suppliers.push({id:Date.now(),name,contact}); document.getElementById('supplierName').value=''; document.getElementById('supplierContact').value=''; await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }
function confirmDeleteSupplier(idx){ const s=DB.suppliers[idx]; if(!s) return; showModal('Elimina fornitore', `Eliminare <strong>${escapeHtml(s.name)}</strong>?`, { okText: 'Elimina', onConfirm: ()=>{ deleteSupplier(idx); } }); }
async function deleteSupplier(idx){ DB.suppliers.splice(idx,1); await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }

/* ---------- Actions: Inventory ---------- */
async function addOrUpdateInventory(){ const sku=document.getElementById('skuInput').value.trim(); const name=document.getElementById('nameInput').value.trim(); const cost=Number(document.getElementById('costInput').value||0); const qty=Number(document.getElementById('qtyInput').value||0); const unit=document.getElementById('unitInput') ? document.getElementById('unitInput').value : 'pcs'; const minQty = document.getElementById('minInput') ? Number(document.getElementById('minInput').value||0) : 0; const reorderTo = document.getElementById('reorderToInput') ? Number(document.getElementById('reorderToInput').value||0) : 0; if(!sku||!name) return showToast('SKU e nome richiesti',true); DB.inventory=DB.inventory||[]; const existing = DB.inventory.find(i=>i.sku===sku); if(existing){ existing.name=name; existing.unit_cost=cost; existing.qty=qty; existing.unit=unit; existing.min_qty=minQty; existing.reorder_to=reorderTo; } else { DB.inventory.push({sku,name,unit_cost:cost,qty,unit, min_qty: minQty, reorder_to: reorderTo}); }
  document.getElementById('skuInput').value=''; document.getElementById('nameInput').value=''; document.getElementById('costInput').value=''; document.getElementById('qtyInput').value=''; if(document.getElementById('unitInput')) document.getElementById('unitInput').value='pcs'; if(document.getElementById('minInput')) document.getElementById('minInput').value=''; if(document.getElementById('reorderToInput')) document.getElementById('reorderToInput').value=''; await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }
function confirmDeleteInventory(idx){ const it=DB.inventory[idx]; if(!it) return; showModal('Elimina prodotto', `Eliminare <strong>${escapeHtml(it.name)} (${escapeHtml(it.sku)})</strong>?`, { okText: 'Elimina', onConfirm: ()=>{ deleteInventory(idx); } }); }
async function deleteInventory(idx){ DB.inventory.splice(idx,1); await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }
function editInventory(idx){
  const it = DB.inventory[idx];
  if (!it) return;
  const sku = document.getElementById('skuInput');
  const name = document.getElementById('nameInput');
  const cost = document.getElementById('costInput');
  const qty = document.getElementById('qtyInput');
  if (sku) sku.value = it.sku;
  if (name) name.value = it.name;
  if (cost) cost.value = it.unit_cost;
  if (qty) qty.value = it.qty;
  // Focus sul primo campo per usabilità
  if (sku) sku.focus();
  // Cambia il testo del bottone in "Salva modifiche" e collega la funzione di update
  const btn = document.getElementById('addStockBtn');
  if (btn) {
    btn.textContent = 'Salva modifiche';
    btn.onclick = async function() {
      // Aggiorna i dati del prodotto
      it.sku = sku ? sku.value.trim() : it.sku;
      it.name = name ? name.value.trim() : it.name;
      it.unit_cost = cost ? Number(cost.value) : it.unit_cost;
      it.qty = qty ? Number(qty.value) : it.qty;
      await saveToLocalStorage();
      renderInventory();
      renderDashboard();
      // Reset bottone e form
      btn.textContent = 'Salva prodotto';
      btn.onclick = addOrUpdateInventory;
      if (sku) sku.value = '';
      if (name) name.value = '';
      if (cost) cost.value = '';
      if (qty) qty.value = '';
      showToast('Prodotto aggiornato');
    };
  }
  // Campi opzionali (unit, min, reorder) non più presenti nel form base
  const unit = document.getElementById('unitInput');
  if (unit) unit.value = it.unit || 'pcs';
  const min = document.getElementById('minInput');
  if (min) min.value = it.min_qty || '';
  const reorder = document.getElementById('reorderToInput');
  if (reorder) reorder.value = it.reorder_to || '';
  showSection('inventory');
}

/* ---------- Actions: Purchases (PO) ---------- */
function addPoLine(){ const sku=document.getElementById('poSku').value; const qty=Number(document.getElementById('poQty').value||1); const supplierId=document.getElementById('poSupplier').value; if(!supplierId||!sku||qty<=0) return showToast('Seleziona fornitore, SKU e qty',true); const item=DB.inventory.find(i=>i.sku===sku); if(!item) return showToast('SKU non trovato',true); currentPO.supplierId=supplierId; currentPO.lines.push({sku,qty,unit_cost:item.unit_cost}); renderPoLines(); }
function renderPoLines(){ const tbody = document.getElementById('poLinesTable'); tbody.innerHTML=''; currentPO.lines.forEach((l,idx)=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td>${escapeHtml(l.sku)}</td><td><input type="number" min="1" value="${l.qty}" onchange="(function(v,i){ currentPO.lines[i].qty=Number(v); renderPoLines(); })(this.value,${idx})" /></td><td><input type="number" step="0.01" value="${Number(l.unit_cost).toFixed(2)}" onchange="(function(v,i){ currentPO.lines[i].unit_cost=Number(v); renderPoLines(); })(this.value,${idx})" /></td><td><button class="btn" onclick="currentPO.lines.splice(${idx},1);renderPoLines();">Rimuovi</button></td>`; tbody.appendChild(tr); }); }

async function createPO(){ if(!currentPO.supplierId||!currentPO.lines.length) return showToast('Fornitore o righe PO mancanti',true); const supplier = DB.suppliers.find(s=>s.id==currentPO.supplierId);
  const po = { id: Date.now(), supplierId: supplier.id, supplierName: supplier.name, lines: currentPO.lines.slice(), status: 'draft', createdAt: new Date().toISOString() };
  DB.purchases = DB.purchases || []; DB.purchases.push(po); currentPO={ supplierId:null, lines:[] }; document.getElementById('poLinesTable').innerHTML=''; await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }

async function receivePurchase(idx){ const p = DB.purchases[idx]; if(!p) return; showModal('Conferma ricezione', `<div class="muted">Ricevere e aggiornare inventario con le seguenti righe?</div><div style="margin-top:8px">${escapeHtml(p.lines.map(l=>l.sku+' x'+l.qty).join('\n'))}</div>`, { okText: 'Conferma ricezione', onConfirm: async ()=>{
    p.lines.forEach(l=>{ const item = DB.inventory.find(i=>i.sku===l.sku); if(item){ item.qty = Number(item.qty||0) + Number(l.qty||0); } else { DB.inventory.push({ sku: l.sku, name: l.sku, unit_cost: l.unit_cost, qty: l.qty }); } });
    p.status = 'received'; p.receivedAt = new Date().toISOString(); // generate invoice
    const total = p.lines.reduce((s,l)=>s + l.qty * l.unit_cost, 0);
    DB.invoices = DB.invoices || []; DB.invoices.push({ id: Date.now(), purchaseId: p.id, supplierId: p.supplierId, supplierName: p.supplierName, lines: p.lines, subtotal: total, tax: 0, total: total, paid: false, createdAt: new Date().toISOString() });
    await saveToLocalStorage(); renderAll(); showToast('Ricezione registrata'); if(isServerAvailable) await syncLocalToServer(); } }); }

/* ---------- Helpers ---------- */
function currency(v){ return (DB.settings && DB.settings.currency ? DB.settings.currency + ' ' : '') + Number(v||0).toFixed(2); }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// On-screen debug log for users who don't open DevTools
function uiLog(msg){ try{ const container = document.getElementById('debugLog'); if(!container) return; const entry = document.createElement('div'); entry.className='entry'; entry.textContent = (new Date()).toISOString() + ' — ' + msg; container.appendChild(entry); while(container.children.length>20) container.removeChild(container.firstChild); }catch(e){ console.warn('uiLog failed', e); } }

/* ---------- Modal helper ---------- */
function showModal(title, bodyHtml, opts = {}){
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div style="font-weight:700;margin-bottom:8px">${escapeHtml(title)}</div><div>${bodyHtml}</div><div class="modal-actions"><button id="modalCancel" class="btn ghost">Annulla</button><button id="modalOk" class="btn primary">${opts.okText || 'Conferma'}</button></div>`;
  modal.classList.remove('hidden');
  modal.querySelector('#modalCancel').addEventListener('click', ()=> { modal.classList.add('hidden'); if (opts.onCancel) opts.onCancel(); });
  modal.querySelector('#modalOk').addEventListener('click', ()=> { modal.classList.add('hidden'); if (opts.onConfirm) opts.onConfirm(); });
}

/* ---------- Import / Export ---------- */
function exportDB(){ const dataStr = JSON.stringify(DB, null, 2); const blob = new Blob([dataStr], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gestionale-procurement.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// Save DB to localStorage (used for menu orders to avoid frequent server writes)
async function saveToLocalStorage(){ try{ const clone = JSON.parse(JSON.stringify(DB)); // remove any transient props
  delete clone._local_unsynced;
  const wrapper = { db: clone, _local_unsynced: true, savedAt: (new Date()).toISOString() };
  localStorage.setItem('gestionale_local_db', JSON.stringify(wrapper));
  DB._local_unsynced = true; showToast('Salvato localmente'); uiLog('saved to localStorage'); return Promise.resolve(); }catch(e){ console.error('saveToLocalStorage failed', e); showToast('Salvataggio locale fallito', true); return Promise.reject(e); } }

// Attempt to sync local changes to server
async function syncLocalToServer(){ const payloadStr = localStorage.getItem('gestionale_local_db'); if(!payloadStr) return showToast('Nessuna modifica locale da sincronizzare', true);
  const ok = await pingServer(); if(!ok) return showToast('Connessione assente, riprova dopo', true);
  try{ const stored = JSON.parse(payloadStr); const payload = stored && stored.db ? stored.db : stored; DB = Object.assign({}, DB, payload); await saveData(); // saveData will remove local marker on success
    localStorage.removeItem('gestionale_local_db'); DB._local_unsynced = false; showToast('Sincronizzazione completata'); uiLog('local sync complete'); renderAll(); }catch(e){ console.error('syncLocalToServer failed', e); showToast('Sincronizzazione fallita', true); } }

// Load from localStorage (global function so it can be invoked at boot)
function loadFromLocalStorage(){ try{ const raw = localStorage.getItem('gestionale_local_db'); if(!raw) return false; const stored = JSON.parse(raw); const payload = stored && stored.db ? stored.db : stored; DB = Object.assign({}, DB, payload); DB._local_unsynced = !!(stored && (stored._local_unsynced || stored.savedAt)); renderAll(); uiLog('local data loaded'); showToast(DB._local_unsynced ? 'Dati locali caricati (non sincronizzati)' : 'Dati locali caricati'); return true; }catch(e){ console.error('loadFromLocalStorage failed', e); return false; } }

// expose to window for early invocation
window.loadFromLocalStorage = loadFromLocalStorage;

function handleFileUpload(file){ if(!file) return; const reader = new FileReader(); reader.onload = (e) => {
  try{
    const parsed = JSON.parse(e.target.result);
    showModal('Conferma import', `<div class="muted">Il file caricato contiene i seguenti nodi: <strong>${Object.keys(parsed).join(', ')}</strong></div><div style="margin-top:8px">Sostituire i dati correnti con i dati importati?</div>`, { okText: 'Sostituisci e salva', onConfirm: async ()=>{ DB = parsed; await saveToLocalStorage(); if(isServerAvailable) await syncLocalToServer(); }, onCancel: ()=>{} });
  }catch(err){ showToast('File JSON non valido', true); }
}
reader.onerror = ()=>{ showToast('Errore lettura file', true); };
reader.readAsText(file);
}

function openFilePickerFor(target){ pendingImportTarget = target; const fi = document.getElementById('fileInput'); if(fi) fi.click(); else showToast('File input non disponibile', true); }

async function handleFileUploadFor(target, file){ if(!file) return showToast('File non selezionato', true);
  try{
    const parsed = await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>{ try{ resolve(JSON.parse(r.result)); }catch(e){ reject(e); } }; r.onerror=()=>reject(r.error); r.readAsText(file); });
    let items;
    if(Array.isArray(parsed)) items = parsed; else if(parsed && parsed[target]) items = parsed[target]; else return showModal('Formato non valido', `<div class="muted">Il file non contiene dati validi per <strong>${escapeHtml(target)}</strong>.</div>`, { okText: 'OK' });

    if(target === 'inventory'){
      const exist = DB.inventory || [];
      let newCount=0, updCount=0;
      items.forEach(it=>{ if(!it.sku) return; const ex = exist.find(e=>e.sku===it.sku); if(ex) updCount++; else newCount++; });
      showModal('Importa inventario', `<div class="muted">Trovati ${items.length} elementi. Nuovi: ${newCount}, Aggiornati: ${updCount}. Procedere?</div>`, { okText: 'Importa', onConfirm: async ()=>{
        DB.inventory = DB.inventory || [];
        items.forEach(it=>{ if(!it.sku) return; const ex = DB.inventory.find(e=>e.sku===it.sku); if(ex){ ex.name = it.name || ex.name; ex.qty = Number(it.qty||ex.qty||0); ex.unit = it.unit || ex.unit; ex.unit_cost = Number(it.unit_cost||ex.unit_cost||0); ex.min_qty = it.min_qty || ex.min_qty; ex.reorder_to = it.reorder_to || ex.reorder_to; } else { DB.inventory.push({ sku: it.sku, name: it.name||it.sku, qty: Number(it.qty||0), unit: it.unit||'pcs', unit_cost: Number(it.unit_cost||0), min_qty: it.min_qty||0, reorder_to: it.reorder_to||0 }); } });
        await saveData(); showToast('Inventario importato'); renderInventory(); } });
    } else if(target === 'menu'){
      const exist = DB.menu || [];
      let newCount=0, updCount=0;
      items.forEach(it=>{ if(!it.name) return; const ex=exist.find(m=>m.name===it.name); if(ex) updCount++; else newCount++; });
      showModal('Importa menu', `<div class="muted">Trovati ${items.length} piatti. Nuovi: ${newCount}, Aggiornati: ${updCount}. Procedere?</div>`, { okText: 'Importa', onConfirm: async ()=>{
        DB.menu = DB.menu || [];
        items.forEach(it=>{ if(!it.name) return; const ex = DB.menu.find(m=>m.name===it.name); if(ex){ ex.price = it.price || ex.price; ex.lines = it.lines || ex.lines; } else { DB.menu.push({ id: Date.now()+Math.floor(Math.random()*1000), name: it.name, price: it.price||0, lines: it.lines||[] }); } });
        await saveData(); showToast('Menu importato'); renderMenu(); } });
    } else if (target === 'drinks') {
      const exist = DB.drinks || [];
      let newCount = 0, updCount = 0;
      items.forEach(d => { if(!d.name) return; const ex = d.sku ? exist.find(e=>e.sku===d.sku) : exist.find(e=>e.name===d.name); if(ex) updCount++; else newCount++; });
      showModal('Importa bevande/dolci', `<div class="muted">Trovati ${items.length} elementi. Nuovi: ${newCount}, Aggiornati: ${updCount}. Procedere?</div>`, { okText: 'Importa', onConfirm: async ()=>{
        DB.drinks = DB.drinks || [];
        DB.inventory = DB.inventory || [];
        items.forEach(d => {
          if(!d.name) return;
          const ex = d.sku ? DB.drinks.find(e=>e.sku===d.sku) : DB.drinks.find(e=>e.name===d.name);
          if(ex){ ex.name = d.name || ex.name; ex.price = d.price || ex.price; ex.unit = d.unit || ex.unit; ex.sku = d.sku || ex.sku; }
          else { DB.drinks.push({ id: Date.now()+Math.floor(Math.random()*1000), name: d.name, price: d.price||0, unit: d.unit||'pcs', sku: d.sku||'' }); }
          // ensure inventory entry if SKU provided
          if(d.sku){ const inv = DB.inventory.find(i=>i.sku===d.sku); if(!inv) DB.inventory.push({ sku: d.sku, name: d.name||d.sku, unit: d.unit||'pcs', qty: 0, unit_cost: d.price||0, min_qty: 0, reorder_to: 0 }); }
        });
        await saveData(); showToast('Bevande/Dolci importati'); renderDrinksSelect(); renderInventory(); } });
    } else { showToast('Target import non supportato', true); }
  }catch(err){ console.error('import failed', err); showToast('Import fallito: '+(err.message||err), true); }
}

/* ---------- Boot ---------- */
function attachButtons(){
  const refreshBtnEl = document.getElementById('refreshBtn'); if (refreshBtnEl) refreshBtnEl.addEventListener('click', fetchData);
  const addSupplierBtnEl = document.getElementById('addSupplierBtn'); if (addSupplierBtnEl) addSupplierBtnEl.addEventListener('click', addSupplier);
  const addStockBtnEl = document.getElementById('addStockBtn'); if (addStockBtnEl) addStockBtnEl.addEventListener('click', addOrUpdateInventory);
  const addPoBtnEl = document.getElementById('addPoBtn'); if (addPoBtnEl) addPoBtnEl.addEventListener('click', addPoLine);
  const createPoBtnEl = document.getElementById('createPoBtn'); if (createPoBtnEl) createPoBtnEl.addEventListener('click', ()=>{
    // confirm create PO
    if(!currentPO.supplierId || !currentPO.lines.length) return showToast('PO incompleto', true);
    const summary = currentPO.lines.map(l=>`${escapeHtml(l.sku)} x${l.qty} @ ${currency(l.unit_cost)}`).join('<br>');
    showModal('Conferma PO', `<div class="muted">Fornitore: <strong>${escapeHtml((DB.suppliers.find(s=>s.id==currentPO.supplierId)||{}).name||'')}</strong></div><div style="margin-top:8px">${summary}</div>`, { okText: 'Crea PO', onConfirm: createPO });
  });

  const loadBtn = document.getElementById('loadBtn');
  if (loadBtn) loadBtn.addEventListener('click', async () => {
    // Try to fetch the sample data from server first
    try {
      const res = await fetch('sample-data.json');
      if (res.ok) {
        const parsed = await res.json();
        showModal('Carica dati d\'esempio', `<div class="muted">Il file di esempio è stato trovato. Sostituire i dati correnti con i dati di esempio?</div>`, { okText: 'Sostituisci e salva', onConfirm: async () => { DB = parsed; await saveData(); }, onCancel: () => { showToast('Import annullato'); uiLog('import cancelled'); } });
        return;
      }
    } catch (e) {
      // ignore fetch error and fallback to file input
      console.warn('No sample file available, fallback to file input');
    }
    document.getElementById('fileInput').click();
  });
  const fileInput = document.getElementById('fileInput'); if(fileInput) fileInput.addEventListener('change', (e)=>{ uiLog('file selected: '+(e.target.files && e.target.files[0] && e.target.files[0].name)); handleFileUpload(e.target.files[0]); });
  const saveBtn = document.getElementById('saveBtn'); if(saveBtn) saveBtn.addEventListener('click', async () => { uiLog('save requested'); showToast('Salvataggio sul server...'); await saveData(); });
  // saveAllTopBtn non esiste più
  const saveAllFloat = document.getElementById('saveAllFloatingBtn'); if(saveAllFloat) saveAllFloat.addEventListener('click', async ()=>{ uiLog('saveAll float clicked'); await saveAll(); });

  // Save all: persist to localStorage and attempt immediate sync to server
  async function saveAll(){ try{ await saveToLocalStorage(); const ok = await pingServer(); if(ok){ await syncLocalToServer(); showToast('Salvato e sincronizzato'); } else { showToast('Salvato localmente; sincronizza quando server disponibile'); } }catch(e){ console.error('saveAll failed', e); showToast('Salvataggio fallito', true); } }

  // NOTE: loadFromLocalStorage is implemented globally to ensure it runs at boot
  // (removed local nested implementation to avoid scope issues)

  // Sales bindings for legacy attach
  // NOTE: createSaleBtn binding moved to attachButtonsRobust to avoid duplicate handlers
  const salesSel = document.getElementById('salesItem'); if(salesSel) salesSel.addEventListener('change', (e)=>{ const v = e.target.value || ''; const unitSpan=document.getElementById('salesUnit'); if(v.startsWith('menu:')){ if(unitSpan) unitSpan.textContent = 'porz.'; } else if(v.startsWith('prod:')){ const sku = v.split(':')[1]; const it = DB.inventory.find(i=>i.sku===sku); if(it && unitSpan) unitSpan.textContent = it.unit || 'pcs'; } else { if(unitSpan) unitSpan.textContent = '—'; } }); else console.warn('[UI] salesItem not found');

  const invSearch = document.getElementById('inventorySearch'); if(invSearch) invSearch.addEventListener('input', (e)=>{ inventoryFilter = e.target.value || ''; renderInventory(); });
  const supSearch = document.getElementById('supplierSearch'); if(supSearch) supSearch.addEventListener('input', (e)=>{ supplierFilter = e.target.value || ''; renderSuppliers(); });
  const globalSearch = document.getElementById('globalSearch'); if(globalSearch) globalSearch.addEventListener('input',(e)=>{ globalFilter = e.target.value || ''; renderAll(); });

  const resetPo = document.getElementById('resetPoBtn'); if(resetPo) resetPo.addEventListener('click', ()=>{ currentPO = { supplierId:null, lines:[] }; document.getElementById('poLinesTable').innerHTML=''; });
}

(function init(){
      // Pulsante Genera lista spesa in inventario
      const genListBtn = document.getElementById('generateShoppingListBtn');
      if(genListBtn) genListBtn.addEventListener('click', ()=>{ generateShoppingList(); });
    // Pulsante cancella tutti i dati (locale e server quando possibile)
    const clearBtn = document.getElementById('clearAllDataBtn');
    if (clearBtn) clearBtn.addEventListener('click', async ()=>{
      if (!confirm('Sei sicuro di voler cancellare TUTTI i dati locali e remoti? L’operazione è irreversibile.')) return;
      // Svuota il DB in memoria
      DB = { suppliers: [], inventory: [], purchases: [], invoices: [], sales: [], menu: [], drinks: [], drinksSales: [], drinksShortages: [], settings: { currency: 'EUR' } };
      try {
        // Prova a contattare il server e sovrascrivere il DB remoto
        const ok = await pingServer();
        if (ok) {
          await saveData(); // invia DB vuoto al server
          // Rimuovi eventuale salvataggio locale residuo
          localStorage.removeItem('gestionale_local_db');
          showToast('Tutti i dati cancellati (locale e server). L’app verrà ricaricata.');
          setTimeout(()=>location.reload(), 1200);
          return;
        }
      } catch (e) {
        console.error('Errore durante la cancellazione server', e);
      }
      // Se il server non è raggiungibile, cancella comunque i dati locali
      localStorage.removeItem('gestionale_local_db');
      showToast('Dati locali cancellati. I dati remoti non sono stati modificati.');
      setTimeout(()=>location.reload(), 1200);
    });
  console.log('[UI] script loaded - init start — version ' + (window.APP_VERSION || 'dev'));
  // Attach legacy and robust handlers
  try{ attachButtons(); }catch(e){ console.error('[UI] attachButtons threw', e); }
  try{ attachButtonsRobust(); }catch(e){ console.error('[UI] attachButtonsRobust threw', e); }
  // Bind server banner controls (disabled)
  // reconnect/export handlers removed to prevent banner display

  // --- BOOTSTRAP DATI ---
  let hadLocal = false;
  try {
    hadLocal = window.loadFromLocalStorage ? window.loadFromLocalStorage() : false;
    // Se sono presenti bevande/dolci con SKU ma mancanti in inventario, sincronizza ora
    ensureDrinksInInventory();
  } catch(e) {
    console.warn('loadFromLocalStorage not available at boot', e);
  }

  if (hadLocal && DB._local_unsynced) {
    // Dati locali non sincronizzati: NON sovrascrivere mai!
    showToast('Dati locali caricati (non sincronizzati)', true);
    uiLog('bootstrap: dati locali caricati, nessun fetch dal server');
    // opzionale: puoi proporre la sync
  } else if (location && location.protocol==='file:') {
    isServerAvailable = false;
  } else {
    if(window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); } catch(e){}
    // Solo se non ci sono dati locali, fetch dal server
    pingServer().then(ok=>{ if(ok){ fetchData(); } });
  }
})();

// Robust attach fallback - ensures handlers are present and logs state
function attachButtonsRobust(){
  console.log('[UI] attachButtonsRobust executing');
  uiLog('init attach');
  const map = [

    ['helpBtn', ()=>{ console.log('[UI] helpBtn clicked'); uiLog('help requested'); showHelp(); }],
    ['loadBtn', async ()=>{ console.log('[UI] loadBtn clicked'); uiLog('load requested'); showToast('Caricamento dati...'); try{ const res = await fetchWithTimeout('sample-data.json', { timeout: 3000 }); console.log('[UI] load sample status', res && res.status); if(res && res.ok){ const parsed = await res.json(); console.log('[UI] sample parsed keys', Object.keys(parsed || {})); showModal('Carica dati d\'esempio', `<div class="muted">Il file di esempio è stato trovato. Sostituire i dati correnti con i dati di esempio?</div>`, { okText: 'Sostituisci e salva', onConfirm: async () => { DB = parsed; ensureDrinksInInventory(); await saveData(); showToast('Dati esempio importati'); uiLog('sample data imported'); }, onCancel: () => { showToast('Import annullato'); uiLog('import cancelled'); } });
        return; }
        uiLog('sample-data.json not accessible'); showModal('Impossibile caricare il file di esempio', `<div class="muted">Non è stato possibile caricare <code>sample-data.json</code> automaticamente. Vuoi selezionare un file JSON dal disco?</div>`, { okText: 'Seleziona file', onConfirm: ()=>{ const fi=document.getElementById('fileInput'); if(fi) fi.click(); }, onCancelText: 'Annulla' });
      }catch(e){
        console.warn('[UI] sample fetch failed', e);
        showToast('Nessun file di esempio, seleziona un file'); uiLog('sample fetch failed: '+(e.message||e));
        showModal('Caricamento fallito', `<div class="muted">Errore caricamento file di esempio: ${escapeHtml(e.message||'errore')}</div>`, { okText: 'Seleziona file', onConfirm: ()=>{ const fi=document.getElementById('fileInput'); if(fi) fi.click(); }, onCancelText: 'Annulla' });
      }
      const fi=document.getElementById('fileInput'); if(fi) fi.click(); else showToast('File input non disponibile'); uiLog('opened file picker'); }],
    ['saveBtn', async ()=>{ console.log('[UI] saveBtn clicked'); uiLog('save requested'); showToast('Salvataggio sul server...'); await saveData(); }],
    ['addSupplierBtn', ()=>{ uiLog('add supplier'); addSupplier(); }],
    ['addStockBtn', ()=>{ uiLog('add stock'); addOrUpdateInventory(); }],
    ['addPoBtn', ()=>{ uiLog('add PO line'); addPoLine(); }],
    ['createPoBtn', ()=>{ console.log('[UI] createPoBtn clicked'); uiLog('create PO'); if(!currentPO.supplierId || !currentPO.lines.length) return showToast('PO incompleto', true); const summary = currentPO.lines.map(l=>`${escapeHtml(l.sku)} x${l.qty} @ ${currency(l.unit_cost)}`).join('<br>');
    showModal('Conferma PO', `<div class="muted">Fornitore: <strong>${escapeHtml((DB.suppliers.find(s=>s.id==currentPO.supplierId)||{}).name||'')}</strong></div><div style="margin-top:8px">${summary}</div>`, { okText: 'Crea PO', onConfirm: createPO });
  }],
    ['importExamplesBtn', ()=>{ console.log('[UI] importExamplesBtn clicked'); uiLog('import examples'); showImportExamplesModal(); }],
    ['downloadExamplesBtn', ()=>{ console.log('[UI] downloadExamplesBtn clicked'); uiLog('download examples'); downloadExamples(); }],
    ['addMenuIngredientBtn', ()=>{ uiLog('add menu ingredient'); addMenuIngredientRow(); }],
    ['addMenuItemBtn', ()=>{ uiLog('add menu item'); addMenuItem(); }],
    ['generateShoppingListBtn', ()=>{ uiLog('generate shopping list'); generateShoppingList(); }],
    ['loadInventoryBtn', ()=>{ uiLog('load inventory'); openFilePickerFor('inventory'); }],
    ['loadMenuBtn', ()=>{ uiLog('load menu'); openFilePickerFor('menu'); }],
    // ['saveAllTopBtn', ()=>{ uiLog('save all top'); saveAll(); }],
    ['saveAllFloatingBtn', ()=>{ uiLog('save all float'); saveAll(); }]
  ];

  map.forEach(([id,fn])=>{
    const el = document.getElementById(id);
    if(el){ el.removeEventListener('click', fn); el.addEventListener('click', fn); console.log('[UI] bound', id); }
    else console.warn('[UI] element not found for', id);
  });

  const fileInput = document.getElementById('fileInput'); if(fileInput){ if(fileInput._handler) fileInput.removeEventListener('change', fileInput._handler);
    fileInput._handler = async (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; console.log('[UI] file selected', f.name); uiLog('file selected: '+f.name);
      if(pendingImportTarget){ await handleFileUploadFor(pendingImportTarget, f); pendingImportTarget = null; }
      else { handleFileUpload(f); }
      // reset so user can pick same file again later
      e.target.value = '';
    };
    fileInput.addEventListener('change', fileInput._handler);
  }

  // Import examples modal
  window.showImportExamplesModal = function(){
    const modal = document.getElementById('modal');
    modal.innerHTML = `
      <div class="shopping-list-modal" style="max-width:720px;">
        <h2>Importa esempi</h2>
        <div class="muted">Scegli un file di esempio JSON dal tuo disco o usa i file sample inclusi nel progetto. Il file può essere un DB completo o contenere nodi specifici come <code>inventory</code>, <code>menu</code> o <code>drinks</code>.</div>
        <div style="margin-top:12px;display:flex;gap:8px"><button id="impChooseSet" class="btn">Importa set che preferisci</button></div>
        <div style="margin-top:12px" class="muted">Nota: dopo la selezione ti verrà chiesto di confermare l'import. Puoi scegliere di sostituire i dati correnti o annullare.</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button id="impCloseBtn" class="btn">Chiudi</button></div>
      </div>
    `;
    modal.classList.remove('hidden');
    const close = document.getElementById('impCloseBtn'); if(close) close.addEventListener('click', ()=>{ modal.classList.add('hidden'); });
    const chooseBtn = document.getElementById('impChooseSet');
    if (chooseBtn) chooseBtn.addEventListener('click', ()=>{
      const fi = document.getElementById('fileInput');
      if(fi){ fi.click(); } else showToast('File input non disponibile', true);
    });
  };

  async function loadExampleSet(name){
    try{
      showToast('Import in corso...');
      const res = await fetchWithTimeout(`sample-${name}-full.json`, { timeout: 3000 });
      if(!res || !res.ok){
        console.warn('Sample file not found for', name);
        // Ask user to select a file manually; open file picker WITHOUT forcing a specific target
        showModal('File esempi non trovato', `<div class="muted">Non è stato trovato il file <strong>sample-${name}-full.json</strong> sul server. Vuoi selezionare un file JSON dal disco per importare il set <strong>${escapeHtml(name)}</strong>? Il file può essere un DB completo o un file con i nodi specifici (inventory/menu/drinks).</div>`, { okText: 'Seleziona file', onConfirm: ()=>{ const fi = document.getElementById('fileInput'); if(fi) { /* do not set pendingImportTarget so handler calls generic handleFileUpload */ fi.click(); } else showToast('File input non disponibile', true); }, onCancel: ()=>{ showToast('Import annullato'); } });
        return;
      }
      const parsed = await res.json();
      showModal('Importa esempi', `<div class="muted">Sostituire i dati correnti con il set di esempi <strong>${escapeHtml(name)}</strong>?</div>`, { okText: 'Sostituisci e salva', onConfirm: async ()=>{
          try{
            DB = parsed;
            ensureDrinksInInventory();
            // Save locally first so UI updates even if server is down
            await saveToLocalStorage();
            renderAll();
            if (isServerAvailable) {
              await syncLocalToServer();
            }
            showToast('Esempi importati: ' + name);
          }catch(e){ console.error('import apply failed', e); showToast('Import failed: '+(e.message||e), true); }
        }, onCancel: ()=>{ showToast('Import annullato'); } });
    }catch(e){ console.error('load example failed', e); showModal('Errore import esempi', `<div class="muted">Errore import esempi: ${escapeHtml(e.message||'errore')}</div>`, { okText: 'Seleziona file', onConfirm: ()=>{ const fi = document.getElementById('fileInput'); if(fi) fi.click(); }, onCancel: ()=>{ showToast('Import annullato'); } }); }
  }

  // Download all sample files as a ZIP
  async function downloadExamples(){
    // Ensure libraries are present
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined'){
      try{
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
      }catch(e){ console.error('Failed to load ZIP libraries', e); showToast('Impossibile caricare libreria ZIP', true); return; }
    }

    const files = [
      'sample-data.json', 'sample-database.json', 'sample-full-extended.json',
      'sample-menu-extended.json','sample-inventory-extended.json','sample-drinks-extended.json','sample-desserts-extended.json',
      'sample-bar-full.json','sample-bistro-full.json','sample-ristorante-full.json',
      'sample-inventory-extended.csv','sample-menu-extended.csv','sample-drinks-extended.csv','sample-desserts-extended.csv'
    ];

    const zip = new JSZip();
    const added = [];
    for(const f of files){
      try{
        const res = await fetchWithTimeout(f, { timeout: 4000 });
        if(!res || !res.ok){ uiLog('file not accessible: '+f); continue; }
        const blob = await res.blob();
        zip.file(f, blob);
        added.push(f);
      }catch(err){ uiLog('fetch failed for '+f+': '+(err.message||err)); }
    }

    if(!added.length){ showToast('Nessun file disponibile da scaricare', true); return; }
    showToast('Preparazione download...'); uiLog('creating zip with '+added.length+' files');
    try{
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'gestionale-samples.zip');
      showToast('Download avviato');
    }catch(e){ console.error('zip generation failed', e); showToast('Errore creazione ZIP', true); }
  }

  // Load script helper
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector('script[src="'+src+'"]')) return resolve();
      const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = ()=>reject(new Error('Script load failed: '+src)); document.body.appendChild(s);
    });
  }

  // Help modal
  window.showHelp = function() {
    const modal = document.getElementById('modal');
    modal.innerHTML = `
      <div class="shopping-list-modal" style="max-width:780px;">
        <h2>Guida completa</h2>
        <div class="muted">Questa guida passo‑passo spiega le operazioni principali per utilizzare il gestionale anche se non hai esperienza.</div>

        <h3>1) Primo avvio e dati di esempio</h3>
        <ol>
          <li>Clicca <strong>Carica dati</strong> in alto per importare dati di esempio (se disponibili). Conferma l'importazione quando richiesto.</li>
          <li>Per salvare le modifiche permanenti sul server clicca <strong>Salva dati</strong>. Se il server non è raggiungibile i dati verranno comunque salvati in locale.</li>
        </ol>

        <h3>2) Inventario</h3>
        <ol>
          <li>Vai su <strong>Inventario</strong> → <em>Aggiungi/Modifica prodotto</em>.</li>
          <li>Compila i campi: <strong>SKU</strong> (codice univoco), <strong>Nome</strong>, <strong>Prezzo unitario</strong> e <strong>Quantità</strong>. Premi <strong>Salva prodotto</strong>.</li>
          <li>Apri la lista prodotti per modificare quantità, unità, o impostare <strong>Min</strong> (soglia minima) e <strong>Target</strong> (quantità a cui riordinare).</li>
          <li>Se più prodotti sono sotto soglia usa <strong>Genera lista spesa</strong> per creare la lista della spesa.</li>
        </ol>

        <h3>3) Fornitori e Acquisti (PO)</h3>
        <ol>
          <li>In <strong>Fornitori</strong> aggiungi i contatti.</li>
          <li>In <strong>Acquisti (PO)</strong> crea un ordine selezionando fornitore e SKU, aggiungi le righe e premi <strong>Crea PO</strong>.</li>
          <li>Quando ricevi la merce apri il PO e premi <strong>Ricevuto</strong> per aggiornare il magazzino automaticamente e generare la fattura.</li>
        </ol>

        <h3>4) Menu e piatti</h3>
        <ol>
          <li>Vai su <strong>Menu</strong> → <em>Nuovo piatto</em>.</li>
          <li>Aggiungi il nome, il prezzo e poi usa <strong>Aggiungi ingrediente</strong> per selezionare ingredienti dal magazzino (SKU) e indicare la quantità usata per porzione.</li>
          <li>Salva il piatto. Verrà mostrato nella lista del menu per gli ordini clienti.</li>
        </ol>

        <h3>5) Registrare ordini clienti</h3>
        <ol>
          <li>Apri <strong>Ordini clienti</strong>, scegli il prodotto dal menu o dal magazzino e inserisci la quantità.</li>
          <li>Premi <strong>Registra ordine</strong>. Il sistema scalerà automaticamente le quantità degli ingredienti o del prodotto dal magazzino.</li>
          <li>Se non c'è abbastanza prodotto, verrà segnalata una <em>mancanza</em> e potrai generare la lista della spesa per ordinare.</li>
        </ol>

        <h3>6) Bevande, Caffè, Dolci</h3>
        <ol>
          <li>Apri <strong>Bevande, Caffè, Dolci</strong> per aggiungere singoli articoli (nome, prezzo, unità e SKU opzionale).</li>
          <li>Se inserisci una SKU, l'articolo verrà aggiunto anche all'Inventario (quantità iniziale = 0) e potrà essere ordinato come prodotto normale.</li>
          <li>Registra ordini bevande come per i prodotti; gli ordini vengono salvati sotto <em>Ordini recenti</em>.</li>
        </ol>

        <h3>7) Salvataggio, backup e import/export</h3>
        <ul>
          <li><strong>Carica dati</strong>: importa file JSON (es. dati di esempio o backup locali).</li>
          <li><strong>Salva dati</strong>: invia le modifiche al server. Se il server non risponde, i dati vengono salvati localmente e marcati come non sincronizzati.</li>
          <li>Puoi anche cancellare tutti i dati da <strong>Impostazioni</strong> (operazione irreversibile).</li>
        </ul>

        <h3>8) Segnalazioni e problemi comuni</h3>
        <ul>
          <li>Se la pagina non trova il server (errore di connessione), controlla che il server locale sia avviato con <code>node server.js</code> o <code>npm start</code>.</li>
          <li>Se un articolo non appare negli elenchi, verifica che abbia un <strong>SKU</strong> valido o che sia stato salvato correttamente.</li>
        </ul>

        <h3>9) Consigli rapidi</h3>
        <ul>
          <li>Salva spesso i dati dopo modifiche importanti.</li>
          <li>Usa i dati di esempio per esplorare le funzionalità prima di inserire i tuoi prodotti reali.</li>
          <li>Se non sei sicuro, crea una copia di backup: esporta i dati dal server o salva il file <code>database.json</code>.</li>
        </ul>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button id="exportHelpPdfBtn" class="btn">Esporta PDF</button><button id="helpCloseBtn" class="btn primary">Chiudi</button></div>
      </div>
    `;
    modal.classList.remove('hidden');
    const close = document.getElementById('helpCloseBtn'); if(close) close.addEventListener('click', ()=>{ modal.classList.add('hidden'); });
    const exportBtn = document.getElementById('exportHelpPdfBtn'); if(exportBtn) exportBtn.addEventListener('click', ()=>{ exportHelpPdf(); });
  };

  // Esporta la Guida in PDF (stampa browser) con footer di branding
  function exportHelpPdf(){
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write('<html><head><title>Guida completa - Mission Manager</title>');
    win.document.write('<style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111;}h2{color:#059669;}h3{margin-top:18px;}ol{padding-left:18px;}ul{padding-left:18px;}li{margin-bottom:8px;} .footer{position:fixed;left:24px;right:24px;bottom:18px;font-size:13px;color:#888;text-align:center;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Guida completa</h2>');
    win.document.write('<div class="muted">Questa guida passo‑passo spiega le operazioni principali per utilizzare il gestionale anche se non hai esperienza.</div>');
    win.document.write('<h3>1) Primo avvio e dati di esempio</h3>');
    win.document.write('<ol><li>Clicca Carica dati in alto per importare dati di esempio (se disponibili). Conferma l\'importazione quando richiesto.</li><li>Per salvare le modifiche permanenti sul server clicca Salva dati. Se il server non è raggiungibile i dati verranno comunque salvati in locale.</li></ol>');
    win.document.write('<h3>2) Inventario</h3>');
    win.document.write('<ol><li>Vai su Inventario → Aggiungi/Modifica prodotto e compila i campi: SKU, Nome, Prezzo unitario e Quantità.</li><li>Imposta Min (soglia minima) e Target (quantità da riordinare) e usa Genera lista spesa.</li></ol>');
    win.document.write('<h3>3) Fornitori e Acquisti (PO)</h3>');
    win.document.write('<ol><li>Aggiungi fornitori in Fornitori.</li><li>Crea PO in Acquisti, poi segna Ricevuto per aggiornare il magazzino.</li></ol>');
    win.document.write('<h3>4) Menu</h3>');
    win.document.write('<ol><li>Crea piatti, aggiungi ingredienti dallo SKU e salva.</li><li>I piatti saranno disponibili in Ordini clienti.</li></ol>');
    win.document.write('<h3>5) Ordini</h3>');
    win.document.write('<ol><li>Registra ordini dal pannello Ordini clienti; il magazzino viene scalato automaticamente.</li><li>In caso di mancanze il sistema segnala e consente di generare la lista della spesa.</li></ol>');
    win.document.write('<h3>6) Bevande, Caffè, Dolci</h3>');
    win.document.write('<ol><li>Aggiungi articoli con SKU per inserili anche in Inventario (qty iniziale = 0).</li><li>Registra ordini bevande dal relativo pannello.</li></ol>');
    win.document.write('<h3>7) Salvataggio e backup</h3>');
    win.document.write('<ul><li>Carica dati: importa file JSON.</li><li>Salva dati: invia i cambi al server o salva in locale se il server non risponde.</li><li>Cancella tutti i dati: operazione irreversibile.</li></ul>');
    win.document.write('<h3>8) Problemi comuni</h3>');
    win.document.write('<ul><li>Connessione al server assente — verifica lo stato del server se necessario.</li><li>Articoli mancanti: verifica SKU e salvataggio.</li></ul>');
    win.document.write('<div class="footer">Creato da <a href="https://www.ldm4app.com" style="color:#888;text-decoration:underline;">www.ldm4app.com</a></div>');
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(()=>{ win.print(); }, 300);
  }
  const invSearch = document.getElementById('inventorySearch'); if(invSearch) invSearch.addEventListener('input', (e)=>{ inventoryFilter = e.target.value || ''; renderInventory(); });
  const supSearch = document.getElementById('supplierSearch'); if(supSearch) supSearch.addEventListener('input', (e)=>{ supplierFilter = e.target.value || ''; renderSuppliers(); });
  const globalSearch = document.getElementById('globalSearch'); if(globalSearch) globalSearch.addEventListener('input',(e)=>{ globalFilter = e.target.value || ''; renderAll(); });

  // Sales specific bindings
  const createSaleBtn = document.getElementById('createSaleBtn'); if(createSaleBtn) createSaleBtn.addEventListener('click', async ()=>{ console.log('[UI] createSaleBtn clicked'); await createSaleFromPanel(); }); else console.warn('[UI] createSaleBtn not found');
  const salesSel = document.getElementById('salesItem'); if(salesSel) salesSel.addEventListener('change', (e)=>{ const v = e.target.value || ''; const unitSpan = document.getElementById('salesUnit'); if(v.startsWith('menu:')){ if(unitSpan) unitSpan.textContent = 'porz.'; } else if(v.startsWith('prod:')){ const sku = v.split(':')[1]; const it = DB.inventory.find(i=>i.sku===sku); if(it && unitSpan) unitSpan.textContent = it.unit || 'pcs'; } else { if(unitSpan) unitSpan.textContent = '—'; } }); else console.warn('[UI] salesItem not found');



  console.log('[UI] attachButtonsRobust completed');
} 

async function saveData() { return saveDataImpl(); }

/* Restaurant-specific UI removed after app conversion to Procurement. */

/* ---------- Composer (draft order) ---------- */
function openComposer(table) {
  activeDraft = { table: table, items: [], total: 0 };
  // show floating composer UI
  let comp = document.getElementById('composer');
  if (!comp) {
    comp = document.createElement('div'); comp.id = 'composer';
    comp.style.position = 'fixed'; comp.style.right = '20px'; comp.style.bottom = '20px'; comp.style.width = '360px';
    comp.style.padding = '12px'; comp.style.borderRadius = '12px'; comp.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
    comp.style.border = '1px solid rgba(255,255,255,0.03)'; comp.style.boxShadow = '0 10px 30px rgba(2,6,23,0.6)';
    document.body.appendChild(comp);
  }
  comp.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">Nuova comanda — Tavolo ${table}</div><button id="closeComposer" class="btn ghost">Chiudi</button></div><div id="draftItems" style="margin-top:10px"></div><div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end"><button id="sendKitchen" class="btn primary">Invia in cucina</button><button id="addAsOrder" class="btn">Salva come ordine</button></div>`;

  comp.querySelector('#closeComposer').addEventListener('click', () => { comp.remove(); activeDraft = null; });
  comp.querySelector('#sendKitchen').addEventListener('click', async () => { await sendDraftToKitchen(); });
  comp.querySelector('#addAsOrder').addEventListener('click', async () => { await saveDraftAsOrder(); });
  renderDraft();
}

function renderDraft() {
  const wrap = document.getElementById('draftItems');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!activeDraft) { wrap.innerHTML = '<div class="muted">Nessun draft</div>'; return; }
  activeDraft.items.forEach((it, idx) => {
    const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='6px 0';
    row.innerHTML = `<div><div style="font-weight:700">${escapeHtml(it.name)} x${it.qty}</div><div style="font-size:13px;color:#94a3b8">${currency(it.price)} cad.</div></div>`;
    const rem = document.createElement('button'); rem.className='btn ghost'; rem.textContent='Rimuovi'; rem.addEventListener('click', ()=>{ activeDraft.items.splice(idx,1); computeDraftTotal(); renderDraft(); });
    row.appendChild(rem); wrap.appendChild(row);
  });
  const tot = document.createElement('div'); tot.style.marginTop='8px'; tot.style.fontWeight='700'; tot.textContent = 'Totale: ' + currency(activeDraft.total);
  wrap.appendChild(tot);
}

function addToDraft(menuItem) {
  if (!activeDraft) { showToast('Seleziona prima un tavolo cliccando sulla mappa', true); return; }
  const exist = activeDraft.items.find(i => i.id === menuItem.id);
  if (exist) exist.qty++; else activeDraft.items.push({ id: menuItem.id, name: menuItem.name, qty: 1, price: menuItem.price });
  computeDraftTotal(); renderDraft();
}

function computeDraftTotal() { activeDraft.total = activeDraft.items.reduce((s, it) => s + it.price * it.qty, 0); }

async function saveDraftAsOrder() {
  if (!activeDraft) return;
  const order = { id: Date.now(), table: activeDraft.table, items: activeDraft.items.map(i => `${i.name} x${i.qty}`).join(', '), total: Number(activeDraft.total), status: 'active', createdAt: new Date().toISOString() };
  DB.orders = DB.orders || []; DB.orders.push(order);
  await saveData();
  const comp = document.getElementById('composer'); if (comp) comp.remove(); activeDraft = null;
}

async function sendDraftToKitchen() {
  if (!activeDraft) return;
  const order = { id: Date.now(), table: activeDraft.table, items: activeDraft.items.map(i => `${i.name} x${i.qty}`).join(', '), total: Number(activeDraft.total), status: 'sent', createdAt: new Date().toISOString(), sentAt: new Date().toISOString() };
  DB.orders = DB.orders || []; DB.orders.push(order);
  await saveData();
  const comp = document.getElementById('composer'); if (comp) comp.remove(); activeDraft = null;
}

/* ---------- Cassa ---------- */
function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';
  const items = (DB.history || []).slice().reverse();
  if (!items.length) { list.innerHTML = '<li class="muted">Nessun storico</li>'; return; }
  items.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="o-head">Tavolo ${h.table} • ${currency(h.total)} <span class="muted">archiviato</span></div><div class="o-items">${escapeHtml(String(h.items || ''))}</div>`;
    list.appendChild(li);
  });
}

async function closeAndArchiveOrder(orderId) {
  const idx = (DB.orders || []).findIndex(o => o.id === orderId);
  if (idx === -1) return showToast('Ordine non trovato', true);
  const order = DB.orders[idx];
  const subtotal = Number(order.total || 0);
  const tax = +(subtotal * 0.10).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const record = Object.assign({}, order, { closedAt: new Date().toISOString(), payment: { method: 'cash', amount: total }, subtotal, tax, total });
  DB.history = DB.history || [];
  DB.history.push(record);
  DB.orders.splice(idx, 1);
  await saveData();
  renderAll();
  showToast('Conto chiuso e archiviato');
}

function openTavoli(){ const el = document.getElementById('tablesPanel'); if (el) el.scrollIntoView({behavior:'smooth'}); }

function openCashier(orderId) {
  const order = (DB.orders || []).find(o => o.id === orderId);
  if (!order) return showToast('Ordine non trovato', true);
  const receiptId = 'cassa-' + orderId;
  let wrap = document.getElementById(receiptId);
  if (!wrap) {
    wrap = document.createElement('div'); wrap.id = receiptId; wrap.style.position='fixed'; wrap.style.left='50%'; wrap.style.top='50%'; wrap.style.transform='translate(-50%,-50%)'; wrap.style.width='420px'; wrap.style.padding='14px'; wrap.style.borderRadius='12px'; wrap.style.background='linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))'; wrap.style.border='1px solid rgba(255,255,255,0.03)'; wrap.style.boxShadow='0 14px 40px rgba(2,6,23,0.6)';
    document.body.appendChild(wrap);
  }
  const subtotal = Number(order.total || 0);
  const tax = +(subtotal * 0.10).toFixed(2); // 10% IVA demo
  const total = +(subtotal + tax).toFixed(2);
  wrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">Cassa — Tavolo ${order.table}</div><button id="closeCashier" class="btn ghost">Chiudi</button></div>
    <div style="margin-top:10px">${escapeHtml(order.items || '')}</div>
    <div style="margin-top:10px"><div>Subtotale: ${currency(subtotal)}</div><div>IVA (10%): ${currency(tax)}</div><div style="font-weight:700;margin-top:6px">Totale: ${currency(total)}</div></div>
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button id="closeAccountBtn" class="btn primary">Chiudi conto</button><button id="invoiceBtn" class="btn">Ricevuta</button></div>`;

  wrap.querySelector('#closeCashier').addEventListener('click', () => wrap.remove());
  wrap.querySelector('#closeAccountBtn').addEventListener('click', async () => {
    await closeAndArchiveOrder(order.id);
    wrap.remove();
  });
  wrap.querySelector('#invoiceBtn').addEventListener('click', () => {
    alert(`Riepilogo\nTavolo ${order.table}\n${order.items}\nTotale: ${currency(total)}`);
  });
}

/* ---------- Helpers ---------- */
function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ---------- Boot ---------- */
function attachLegacyButtons() {
  const helpBtn = document.getElementById('helpBtn'); if (helpBtn) helpBtn.addEventListener('click', showHelp);
  const importExamplesBtn = document.getElementById('importExamplesBtn'); if (importExamplesBtn) importExamplesBtn.addEventListener('click', showImportExamplesModal);
  const clearBtn = document.getElementById('clearBtn'); if (clearBtn) clearBtn.addEventListener('click', () => { document.getElementById('tableInput').value = 1; document.getElementById('itemsInput').value = ''; document.getElementById('totalInput').value = '0.00'; });
  const saveOrderBtn = document.getElementById('saveOrderBtn'); if (saveOrderBtn) saveOrderBtn.addEventListener('click', async () => {
    const table = Number(document.getElementById('tableInput').value);
    const items = document.getElementById('itemsInput').value;
    const total = Number(document.getElementById('totalInput').value || 0);
    const order = { id: Date.now(), table, items, total, status: 'active', createdAt: new Date().toISOString() };
    DB.orders = DB.orders || []; DB.orders.push(order);
    await saveData();
    document.getElementById('itemsInput').value = '';
    document.getElementById('totalInput').value = '0.00';
  });
}

// Init
(function init() {
  attachLegacyButtons();
  // if (location && location.protocol === 'file:') showFileProtocolBanner();
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try { window.lucide.createIcons(); } catch (e) { console.warn('Lucide icons init failed', e); }
  }
  fetchData();
})();
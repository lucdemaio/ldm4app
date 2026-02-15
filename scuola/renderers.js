/* renderers.js — UI rendering and DOM handlers. Import AI client + utils. */
import { getApiKey, setApiKey, clearApiKey, listAvailableModels, chiediAiutoIA } from './ai-client.js';
import { escapeHtml, renderTextAsHtml, csvToHtmlTable, downloadDataUrl, htmlDecode, exportHtmlToPrintableWindow, generatePosterSvg, downloadSvgString, shareToWhatsApp, shareToTelegram } from './utils.js';

// Navigation helpers
export function setActiveNav(route){
  document.querySelectorAll('.nav-link').forEach(btn=> btn.classList.toggle('bg-white/3', btn.dataset.route===route));
}

export function navigate(route){
  setActiveNav(route);
  const container = document.getElementById('app');
  if(route === 'dashboard') return renderDashboard(container);
  if(route === 'ai') return renderAiTutor(container);
  if(route === 'code') return renderCodeTutor(container);
  if(route === 'excel') return renderExcelTutor(container);

  return renderDashboard(container);
}

// Message UI helpers
export function appendMessage(who, text){
  const log = document.getElementById('chat-log');
  if(!log) return;
  const wrapper = document.createElement('div');
  wrapper.className = who === 'user' ? 'msg-bubble msg-user' : 'msg-bubble msg-ai';
  wrapper.innerHTML = renderTextAsHtml(text);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;
}

// Mermaid rendering (sanitizes input)
export function renderMermaidIn(root){
  if(!window.mermaid) return;
  root.querySelectorAll('.mermaid').forEach((el) => {
    const parent = el.parentElement;
    const container = document.createElement('div');
    container.className = 'mermaid-wrapper';
    parent.replaceChild(container, el);

    let code = el.textContent.trim();
    if(code.includes('&lt;') || code.includes('&gt;') || code.includes('&amp;')) code = htmlDecode(code);
    if(code.includes('<')) code = code.replace(/<[^>]+>/g, '').trim();
    const diagMatch = code.match(/(?:graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie)[\s\S]*/i);
    if(diagMatch) code = diagMatch[0].trim();

    const mermaidNode = document.createElement('div');
    mermaidNode.className = 'mermaid';
    mermaidNode.textContent = code;
    container.appendChild(mermaidNode);

    try{ if(mermaid.parse) mermaid.parse(code); }catch(err){ container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid: sintassi non valida.</div>`; return; }
    try{ const maybePromise = mermaid.init(undefined, container); if(maybePromise && typeof maybePromise.then === 'function'){ maybePromise.catch(err=>{ container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid durante il rendering.</div>`; }); } }catch(e){ container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid durante il rendering.</div>`; }
  });
}

export async function processAiOutput(){
  if(window.MathJax && window.MathJax.typesetPromise){ try{ await MathJax.typesetPromise(); }catch(e){} }
  renderMermaidIn(document.getElementById('app'));
}

// ---------- Renderers for pages (Dashboard, IA Tutor, Code, Excel) ----------
export function renderDashboard(container){
  container.innerHTML = `
    <section class="bento-grid grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="app-card p-6 rounded-2xl glass-card col-span-2 lg:col-span-2 transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-slate-100">Dashboard Principale</h2>
            <p class="text-sm text-slate-400 mt-1">Panoramica — moduli principali in stile Bento Grid e Glassmorphism.</p>
          </div>
          <div class="text-sm text-slate-400">Ultimo accesso: oggi</div>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl border border-[rgba(255,255,255,0.03)] shadow-softglass hover:translate-y-1 transition-all duration-300">
            <div class="flex items-center gap-3">
              <div class="dot-accent bg-neon-blue" />
              <div>
                <div class="text-sm text-slate-200 font-medium">Attività recenti</div>
                <div class="text-xs text-slate-400 mt-1">Ultime operazioni IA e Code Tutor</div>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl border border-[rgba(255,255,255,0.03)] shadow-softglass hover:translate-y-1 transition-all duration-300">
            <div class="flex items-center gap-3">
              <div class="dot-accent bg-cyber-purple" />
              <div>
                <div class="text-sm text-slate-200 font-medium">Supporto</div>
                <div class="text-xs text-slate-400 mt-1">Link rapidi e guide per API Key</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="p-4 rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] shadow-inset">
            <div class="text-sm text-slate-300">Attività recenti</div>
            <ul class="mt-3 text-xs text-slate-400 space-y-2">
              <li>IA: spiegazione equazione differenziale — <span class="text-slate-200">Completata</span></li>
              <li>Code Tutor: revisione snippet JS — <span class="text-slate-200">In attesa</span></li>
            </ul>
          </div>
        </div>
      </div>

      <aside class="app-card p-6 rounded-2xl glass-card col-span-2 lg:col-span-2 transition-all duration-300">
        <h4 class="text-sm text-slate-300">Guida rapida — Google AI Studio</h4>
        <p class="mt-3 text-sm text-slate-400">Per ottenere una API Key visita <a href="https://aistudio.google.com/app/" target="_blank" rel="noopener noreferrer" class="underline text-neon-blue">Google AI Studio</a>. Abilita <em>Generative Language API</em>, crea una API key e assicurati che il billing sia attivo.</p>
        <div class="mt-4 grid grid-cols-1 gap-3">
          <a href="https://aistudio.google.com/app/" target="_blank" rel="noopener noreferrer" class="w-full inline-flex justify-center items-center px-3 py-2 rounded-xl bg-neon-blue text-black font-semibold transition-all duration-300 hover:brightness-105">Apri Google AI Studio</a>
          <div class="text-xs text-slate-400">Dopo aver creato la chiave: vai su <strong>IA Tutor</strong>, incolla la key e premi <strong>Configura IA</strong>. Usa un proxy in produzione per nascondere la key.</div>

          <div class="mt-4 flex gap-2">
            <button id="share-dashboard-ws" class="w-1/2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm">Condividi su WhatsApp</button>
            <button id="share-dashboard-tg" class="w-1/2 bg-sky-500 text-white px-3 py-2 rounded-lg text-sm">Condividi su Telegram</button>
          </div>
        </div>
      </aside>
    </section>
  `;
  renderMermaidIn(container);

  // Dashboard share handlers
  const sdWs = document.getElementById('share-dashboard-ws');
  const sdTg = document.getElementById('share-dashboard-tg');
  if(sdWs) sdWs.addEventListener('click', ()=> shareToWhatsApp('Prova Scuola 2026 — gestionale didattico', window.location.href));
  if(sdTg) sdTg.addEventListener('click', ()=> shareToTelegram('Prova Scuola 2026 — gestionale didattico', window.location.href));
}

// IA Tutor renderer and handlers
export function renderAiTutor(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">IA Tutor</h2>
          <p class="text-sm text-slate-400 mt-1">Inserisci la tua Google Gemini API Key per abilitare il tutor.</p>
        </div>
        <div class="text-xs text-slate-300">Regole: LaTeX per matematica, codice commentato, Mermaid per schemi.</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-white/3">
          <label class="block text-xs text-slate-300">Google Gemini API Key</label>
          <input id="api-key-input" type="password" placeholder="Inserisci API Key" class="mt-2 input-glass w-full px-3 py-2 rounded-lg text-sm outline-none" />

          <div class="mt-3 flex gap-2 items-center">
            <button id="save-api-btn" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg">Configura IA</button>
            <button id="remove-api-btn" class="ml-2 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg">Rimuovi Key</button>
            <div id="api-status" class="ml-2 text-xs font-medium text-red-400">Key non configurata</div>
          </div>

          <div class="mt-3">
            <label class="block text-xs text-slate-300">Modello selezionato</label>
            <div class="flex gap-2 items-center mt-2">
              <select id="model-select" class="input-glass px-3 py-2 rounded-lg text-sm w-full">
                <option value="">(configura la key per caricare i modelli)</option>
              </select>
              <button id="list-models-btn" class="ml-2 text-xs underline text-slate-400">Verifica modelli</button>
            </div>
            <div class="mt-2 text-xs text-slate-400">Seleziona un modello disponibile (predefinito consigliato: <code>gemini-2.5-pro</code> se presente).</div>
          </div>

          <div class="mt-4 text-xs text-slate-400"><strong>Come ottenere la API Key (breve guida)</strong>
            <ol class="mt-2 pl-4 list-decimal text-xs text-slate-400">
              <li>Apri <a href="https://aistudio.google.com/app/" target="_blank" rel="noopener noreferrer" class="underline">Google AI Studio</a> e accedi o crea un account Google.</li>
              <li>Seleziona/crea un progetto, abilita <em>Generative Language API</em> (Library).</li>
              <li>Vai in <strong>Credentials</strong> e clicca <em>Generate API keys</em> (o Create credentials → API key).</li>
              <li>Copia la API Key e incollala qui; per test rimuovi le restrizioni temporaneamente, poi applicale per produzione.</li>
              <li>Verifica che il billing sia attivo per il progetto.</li>
            </ol>
            </div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-white/3 flex flex-col" style="min-height:280px;">
          <div id="chat-log" class="mb-4 overflow-auto space-y-3 flex-1 pr-2" style="max-height:380px"></div>

          <div class="flex gap-3 mt-3">
            <input id="user-prompt" class="input-glass flex-1 px-4 py-2 rounded-xl" placeholder="Chiedi qualcosa all'IA (es. Spiega la regola di L'Hôpital)" />
            <button id="send-prompt" class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl">Invia</button>
          </div>

          <div class="mt-3 flex gap-2 items-center text-xs">
            <button id="export-ai-pdf" class="input-glass px-3 py-1 rounded">Esporta PDF</button>
            <button id="poster-ai-svg" class="input-glass px-3 py-1 rounded">Locandina (SVG)</button>
            <button id="share-ai-ws" class="input-glass px-3 py-1 rounded">Condividi WhatsApp</button>
            <button id="share-ai-tg" class="input-glass px-3 py-1 rounded">Condividi Telegram</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // attach IA-related listeners
  const saveBtn = document.getElementById('save-api-btn');
  if(saveBtn) saveBtn.addEventListener('click', ()=>{
    const input = document.getElementById('api-key-input');
    const val = input?.value?.trim();
    if(!val){ alert('Inserisci una API Key valida.'); return; }
    if(/cdn\.tailwindcss\.com/i.test(val) || val.includes(' ')) { alert('API Key non valida — incolla solo la stringa della key.'); return; }
    setApiKey(val);
    input.value = '';
    updateApiUi();
    populateModelSelect().catch(e=> console.warn(e));
    alert('API Key configurata con successo.');
  });

  const removeBtn = document.getElementById('remove-api-btn');
  if(removeBtn) removeBtn.addEventListener('click', ()=>{ clearApiKey(); updateApiUi(); alert('API Key rimossa.'); });

  const listBtn = document.getElementById('list-models-btn');
  if(listBtn) listBtn.addEventListener('click', async ()=>{
    if(!getApiKey()) return alert('Configura prima la API Key.');
    appendMessage('ai','Recupero modelli disponibili...');
    try{ const models = await listAvailableModels(); appendMessage('ai', 'Modelli disponibili:\n' + models.map(m=>`- ${m}`).join('\n')); }catch(err){ appendMessage('ai', 'Errore: ' + (err.message||err)); }
  });

  const sendBtn = document.getElementById('send-prompt');
  if(sendBtn) sendBtn.addEventListener('click', async ()=>{
    const prompt = document.getElementById('user-prompt').value.trim(); if(!prompt) return; appendMessage('user', prompt); document.getElementById('user-prompt').value=''; appendMessage('ai','Sto pensando...');
    try{ const raw = await chiediAiutoIA(prompt); const lastAi = document.querySelectorAll('#chat-log .msg-ai'); if(lastAi.length) lastAi[lastAi.length-1].remove(); appendMessage('ai', raw); processAiOutput(); }catch(err){ const lastAi = document.querySelectorAll('#chat-log .msg-ai'); if(lastAi.length) lastAi[lastAi.length-1].remove(); appendMessage('ai','Errore: '+(err.message||err)); }
  });

  updateApiUi();

  // --- Export / poster / share handlers for IA Tutor ---
  const exportAiPdfBtn = document.getElementById('export-ai-pdf');
  if(exportAiPdfBtn) exportAiPdfBtn.addEventListener('click', ()=>{
    const chat = document.getElementById('chat-log');
    if(!chat || !chat.innerHTML.trim()) return alert('Nessuna conversazione da esportare.');
    const html = `<h1>IA Tutor - Conversazione</h1><div>${chat.innerHTML}</div>`;
    exportHtmlToPrintableWindow('IA Tutor - Conversazione', html);
  });

  const posterAiBtn = document.getElementById('poster-ai-svg');
  if(posterAiBtn) posterAiBtn.addEventListener('click', async ()=>{
    const snippet = (document.querySelector('#chat-log .msg-user')?.textContent || 'IA Tutor').trim();
    const aiBody = (document.querySelector('#chat-log .msg-ai:last-of-type')?.textContent || '').trim();
    const svg = await generatePosterSvg({ title: 'IA Tutor — Scuola 2026', subtitle: snippet, body: aiBody, qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'scheda-ia.svg');
  });

  const shareAiWs = document.getElementById('share-ai-ws');
  if(shareAiWs) shareAiWs.addEventListener('click', ()=> shareToWhatsApp('Prova l\'IA Tutor di Scuola 2026', window.location.href));
  const shareAiTg = document.getElementById('share-ai-tg');
  if(shareAiTg) shareAiTg.addEventListener('click', ()=> shareToTelegram('Prova l\'IA Tutor di Scuola 2026', window.location.href));
}

// UI helpers for IA module
export function updateApiUi(){
  const status = document.getElementById('api-status');
  const saveBtn = document.getElementById('save-api-btn');
  const removeBtn = document.getElementById('remove-api-btn');
  const sendBtn = document.getElementById('send-prompt');
  const modelSelect = document.getElementById('model-select');
  if(getApiKey()){
    if(status) status.textContent = 'Key configurata'; if(saveBtn) saveBtn.disabled = true; if(removeBtn) removeBtn.disabled = false; if(sendBtn) sendBtn.disabled = false; if(modelSelect) modelSelect.disabled = false; status.classList.remove('text-red-400'); status.classList.add('text-emerald-400');
  } else {
    if(status) status.textContent = 'Key non configurata'; if(saveBtn) saveBtn.disabled = false; if(removeBtn) removeBtn.disabled = true; if(sendBtn) sendBtn.disabled = true; if(modelSelect) modelSelect.disabled = true; status.classList.remove('text-emerald-400'); status.classList.add('text-red-400');
  }
}

export async function populateModelSelect(){
  const sel = document.getElementById('model-select'); if(!sel) return; sel.innerHTML = '<option>Caricamento...</option>';
  try{ const models = await listAvailableModels(); sel.innerHTML = ''; const preferred = ['models/gemini-2.5-pro','models/gemini-pro-latest','models/gemini-flash-latest','models/gemini-2.5-flash']; let picked=''; models.forEach(m=>{ const opt = document.createElement('option'); opt.value = m; opt.textContent = m; sel.appendChild(opt); if(!picked && preferred.includes(m)) picked = m; }); if(!picked && models.length) picked = models[0]; if(picked) sel.value = picked; }catch(err){ sel.innerHTML = '<option disabled>Impossibile caricare modelli</option>'; throw err; }
}



// Export renderers that are used externally
export { renderDashboard as renderDashboardTemplate };

// Boot helper used by main app
export function boot(){
  // attach nav listeners
  document.querySelectorAll('.nav-link').forEach(btn=>{ btn.addEventListener('click', ()=> navigate(btn.dataset.route)); });
  try{ if(window.lucide) lucide.replace({ width:16, height:16, stroke:'#9beafe' }); }catch(e){}
  // If there are templates embedded in window.__templates, use them when rendering IA Tutor, etc.
  navigate('dashboard');
}

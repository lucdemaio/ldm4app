/*
  app.js — Scuola 2026
  - SPA navigation (no full reload)
  - IA integration logic separated (API client + UI)
  - Renders LaTeX (MathJax) and Mermaid diagrams when present
*/

// ---------- State (no API key persisted in source) ----------
let googleApiKey = ""; // kept in-memory only

// ---------- Helpers: UI / Router ----------
function setActiveNav(route){
  document.querySelectorAll('.nav-link').forEach(btn=>{
    btn.classList.toggle('bg-white/3', btn.dataset.route===route);
  });
}

function navigate(route){
  setActiveNav(route);
  const container = document.getElementById('app');
  if(route === 'dashboard') return renderDashboard(container);
  if(route === 'ai') return renderAiTutor(container);
  if(route === 'code') return renderCodeTutor(container);
  if(route === 'excel') return renderExcelTutor(container);
  if(route === 'math') return renderMatematica(container);
  if(route === 'sintesi') return renderSintesi(container);
  if(route === 'schemi') return renderSchemi(container);

  return renderDashboard(container);
}

// ---------- UI Modules (return HTML inserted into #app) ----------
function renderDashboard(container){
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
        <div class="mt-3 text-sm text-slate-400">
          <strong>Guida rapida (passaggi)</strong>
          <ol class="mt-2 pl-4 list-decimal text-sm text-slate-400">
            <li>Apri <a href="https://aistudio.google.com/app/" target="_blank" rel="noopener noreferrer" class="underline text-neon-blue">Google AI Studio</a> e accedi con il tuo account Google (crea un account se non ne hai uno).</li>
            <li>Seleziona o crea un <strong>Project</strong> (in alto a sinistra / selettore progetto).</li>
            <li>Abilita l'API <em>Generative Language</em> dal pannello <em>APIs &amp; Services</em> (Library) se non è già attiva.</li>
            <li>Vai in <strong>Credentials</strong> (panoramica API) e clicca <em>Generate API keys</em> o <em>Create credentials → API key</em> (di solito in basso a sinistra o nella sezione Credentials).</li>
            <li>Copia la stringa della API Key (la incollerai in <strong>IA Tutor</strong> qui nell'app). Per test rimuovi temporaneamente le restrizioni; in produzione aggiungi restrizioni HTTP o IP e usa un proxy per non esporla lato client.</li>
            <li>Assicurati che il billing del progetto sia attivo (necessario per usare i modelli generativi).</li>
          </ol>
          <div class="mt-3 text-xs text-slate-400">Dopo aver creato la chiave: torna su <strong>IA Tutor</strong>, incolla la key e premi <strong>Configura IA</strong>. Per la produzione raccomandiamo un proxy server per tenere la chiave al sicuro.</div>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-3">
          <a href="https://aistudio.google.com/app/" target="_blank" rel="noopener noreferrer" class="w-full inline-flex justify-center items-center px-3 py-2 rounded-xl bg-neon-blue text-black font-semibold transition-all duration-300 hover:brightness-105">Apri Google AI Studio</a>
        </div>
      </aside>
    </section>
  `;
  // render mermaid or other nodes after insertion
  renderMermaidIn(container);
}





function renderAiTutor(container){
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
  document.getElementById('save-api-btn').addEventListener('click', () => {
    saveApiKey();
  });
  const removeBtn = document.getElementById('remove-api-btn');
  removeBtn.addEventListener('click', () => {
    removeApiKey();
  });

  // Ensure send is only enabled when API key is configured
  const sendBtn = document.getElementById('send-prompt');
  sendBtn.addEventListener('click', async () => {
    const prompt = document.getElementById('user-prompt').value.trim();
    if(!prompt) return;
    appendMessage('user', prompt);
    document.getElementById('user-prompt').value = '';

    appendMessage('ai', 'Sto pensando...');
    const lastAiBubble = document.querySelectorAll('#chat-log .msg-ai');
    try{
      const raw = await chiediAiutoIA(prompt);
      // replace last 'Sto pensando...' with actual content
      if(lastAiBubble.length) lastAiBubble[lastAiBubble.length-1].remove();
      appendMessage('ai', raw);
      processAiOutput();
    }catch(err){
      if(lastAiBubble.length) lastAiBubble[lastAiBubble.length-1].remove();
      appendMessage('ai', 'Errore: ' + (err.message || err));
    }
  });

  // attach model-list button
  const listBtn = document.getElementById('list-models-btn');
  if(listBtn){
    listBtn.addEventListener('click', async ()=>{
      if(!googleApiKey) return alert('Configura prima la API Key.');
      appendMessage('ai', 'Recupero modelli disponibili...');
      try{
        const models = await listAvailableModels();
        appendMessage('ai', 'Modelli disponibili:\n' + models.map(m => `- ${m}`).join('\n'));
      }catch(err){
        appendMessage('ai', 'Errore nel recupero modelli: ' + (err.message || err));
      }
    });
  }

  // set UI state according to whether a key is present
  updateApiUi();

  // --- Export / poster / share handlers (IA Tutor) ---
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
    const svg = await generatePosterSvg({ title: 'IA Tutor — Scuola 2026', subtitle: snippet, qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'scheda-ia.svg');
  });

  const shareAiWs = document.getElementById('share-ai-ws');
  if(shareAiWs) shareAiWs.addEventListener('click', ()=> shareToWhatsApp('Prova l\'IA Tutor di Scuola 2026', window.location.href));
  const shareAiTg = document.getElementById('share-ai-tg');
  if(shareAiTg) shareAiTg.addEventListener('click', ()=> shareToTelegram('Prova l\'IA Tutor di Scuola 2026', window.location.href));
}

// ---------- Code Tutor module (Scrivi & Spiega) ----------
function renderCodeTutor(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Code Tutor — Scrivi & Spiega</h2>
          <p class="text-sm text-slate-400 mt-1">Inserisci codice, scegli il linguaggio e chiedi una spiegazione dettagliata e commentata.</p>
        </div>
        <div class="text-xs text-slate-300">Esempi disponibili: Python, JavaScript, HTML</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-white/3">
          <label class="block text-xs text-slate-300">Linguaggio</label>
          <select id="code-lang" class="mt-2 input-glass w-full px-3 py-2 rounded-lg text-sm outline-none">
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
          </select>

          <div class="mt-4 text-xs text-slate-300">Esempi rapidi</div>
          <div class="mt-3 flex flex-col gap-2">
            <button class="example-btn input-glass px-3 py-2 rounded-lg text-sm text-left" data-lang="python">Esempio Python — Fibonacci</button>
            <button class="example-btn input-glass px-3 py-2 rounded-lg text-sm text-left" data-lang="javascript">Esempio JS — Closure</button>
            <button class="example-btn input-glass px-3 py-2 rounded-lg text-sm text-left" data-lang="html">Esempio HTML — Card Responsiva</button>
          </div>

          <div class="mt-6">
            <button id="explain-code-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg">Spiega il codice</button>
            <div class="mt-2 text-xs text-slate-400">L'IA fornirà codice commentato, spiegazioni e una sezione "Concetti Fondamentali".</div>
            <div class="mt-3 flex gap-2">
              <button id="export-code-pdf" class="input-glass px-3 py-1 rounded text-xs">Esporta PDF</button>
              <button id="poster-code-svg" class="input-glass px-3 py-1 rounded text-xs">Locandina (SVG)</button>
              <button id="share-code-ws" class="input-glass px-3 py-1 rounded text-xs">WhatsApp</button>
              <button id="share-code-tg" class="input-glass px-3 py-1 rounded text-xs">Telegram</button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-white/3 flex flex-col">
          <label class="block text-xs text-slate-300">Codice</label>
          <textarea id="code-input" class="input-glass mt-2 w-full h-48 p-3 rounded-xl text-sm font-mono" placeholder="Incolla qui il codice da spiegare..."></textarea>

          <div class="mt-4 flex gap-3">
            <button id="insert-sample" class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl">Inserisci esempio selezionato</button>
            <button id="clear-code" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl">Pulisci</button>
          </div>

          <div id="explain-output" class="mt-6 overflow-auto p-4 bg-black/20 rounded-xl" style="max-height:360px"></div>
        </div>
      </div>
    </div>
  `;

  // UI behavior
  document.querySelectorAll('.example-btn').forEach(b => b.addEventListener('click', (e)=>{
    document.getElementById('code-lang').value = e.currentTarget.dataset.lang;
  }));
  document.getElementById('insert-sample').addEventListener('click', insertSelectedSample);
  document.getElementById('clear-code').addEventListener('click', ()=>{ document.getElementById('code-input').value = ''; document.getElementById('explain-output').innerHTML = ''; });
  document.getElementById('explain-code-btn').addEventListener('click', async ()=>{
    const code = document.getElementById('code-input').value.trim();
    const lang = document.getElementById('code-lang').value;
    if(!code) return alert('Incolla o inserisci un esempio prima di chiedere la spiegazione.');
    if(!googleApiKey) return alert('Configura prima la Google Gemini API Key nel modulo IA Tutor.');

    // Build an instruction for the IA
    const instruction = `Sei un tutor di programmazione. Spiega il seguente codice (${lang}) riga per riga, aggiungi una versione commentata, fornisci suggerimenti per miglioramento e un breve blocco "Concetti Fondamentali". Se opportuno, fornisci snippet alternativi. Usa Markdown per il formato, includi blocchi di codice e, se utile, uno schema Mermaid.`;
    const prompt = `${instruction}\n\nCodice:\n\n${code}`;

    const outputEl = document.getElementById('explain-output');
    outputEl.innerHTML = '<div class="text-sm text-slate-400">Sto interrogando il tutor IA…</div>';
    try{
      const resp = await chiediAiutoIA(prompt);
      // render response (supports mermaid/code fences/LaTeX via existing helpers)
      outputEl.innerHTML = renderTextAsHtml(resp);
      await processAiOutput();
    }catch(err){
      outputEl.innerHTML = `<div class="text-sm text-red-400">Errore: ${escapeHtml(err.message||err)}</div>`;
    }
  });

  // --- Export / poster / share handlers (Code Tutor) ---
  const exportCodePdf = document.getElementById('export-code-pdf');
  if(exportCodePdf) exportCodePdf.addEventListener('click', ()=>{
    const code = document.getElementById('code-input').value || '';
    const out = document.getElementById('explain-output').innerHTML || '';
    const html = `<h1>Code Tutor - ${escapeHtml(document.getElementById('code-lang').value)}</h1><h2>Codice</h2><pre>${escapeHtml(code)}</pre><h2>Spiegazione</h2>${out}`;
    exportHtmlToPrintableWindow('Code Tutor - Esportazione', html);
  });

  const posterCodeBtn = document.getElementById('poster-code-svg');
  if(posterCodeBtn) posterCodeBtn.addEventListener('click', async ()=>{
    const snippet = (document.getElementById('code-input').value || '').split('\n').slice(0,3).join(' ');
    const svg = await generatePosterSvg({ title: 'Code Tutor — Scuola 2026', subtitle: snippet || 'Snippet di codice', qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'poster-code.svg');
  });

  const shareCodeWs = document.getElementById('share-code-ws');
  if(shareCodeWs) shareCodeWs.addEventListener('click', ()=> shareToWhatsApp('Dai un\'occhiata al Code Tutor di Scuola 2026', window.location.href));
  const shareCodeTg = document.getElementById('share-code-tg');
  if(shareCodeTg) shareCodeTg.addEventListener('click', ()=> shareToTelegram('Dai un\'occhiata al Code Tutor di Scuola 2026', window.location.href));
}

function insertSelectedSample(){
  const lang = document.getElementById('code-lang').value;
  const el = document.getElementById('code-input');
  const samples = {
    python: `def fibonacci(n):\n    """Restituisce i primi n numeri della serie di Fibonacci"""\n    a, b = 0, 1\n    res = []\n    for _ in range(n):\n        res.append(a)\n        a, b = b, a + b\n    return res\n\nprint(fibonacci(10))`,
    javascript: `function makeAdder(x) {\n  // closure: restituisce una funzione che aggiunge x\n  return function(y) {\n    return x + y;\n  };\n}\nconst add5 = makeAdder(5);\nconsole.log(add5(3)); // 8`,
    html: `<div class=\"card\">\n  <h3>Card responsiva</h3>\n  <p>Contenuto della card</p>\n</div>\n<style>\n.card{ padding:1rem; border-radius:12px; background:linear-gradient(180deg,#111827,#0f1724); color:#e5e7eb; }\n@media(min-width:640px){ .card{ max-width:420px } }\n</style>`
  };
  el.value = samples[lang] || '';
  el.focus();
}

// ---------- Excel Tutor module ----------
function renderExcelTutor(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Excel Tutor</h2>
          <p class="text-sm text-slate-400 mt-1">Usa l'IA per scrivere formule, spiegare funzioni e trasformare CSV in tabelle Excel.</p>
        </div>
        <div class="text-xs text-slate-400">Suggerimenti: incolla dati CSV, chiedi formule, ottieni spiegazioni passo‑passo.</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)]">
          <label class="block text-xs text-slate-300">Esempi rapidi</label>
          <div class="mt-3 flex flex-col gap-2">
            <button class="excel-example input-glass px-3 py-2 rounded-lg text-sm text-left" data-sample="sum">Formula SUM / range</button>
            <button class="excel-example input-glass px-3 py-2 rounded-lg text-sm text-left" data-sample="vlookup">Esempio VLOOKUP</button>
            <button class="excel-example input-glass px-3 py-2 rounded-lg text-sm text-left" data-sample="pivot">Consigli creazione Pivot</button>
          </div>

          <div class="mt-4">
            <label class="block text-xs text-slate-300">Carica CSV (opzionale)</label>
            <input id="excel-csv-file" type="file" accept=".csv,text/csv" class="mt-2 text-xs" />
            <button id="preview-csv" class="mt-3 w-full bg-cyber-purple text-white px-3 py-2 rounded-lg">Anteprima CSV</button>
          </div>

          <div class="mt-4">
            <button id="explain-excel-btn" class="w-full bg-neon-blue text-black px-3 py-2 rounded-lg">Spiega / Genera Formula</button>
            <div class="mt-2 text-xs text-slate-400">L'IA produrrà la formula richiesta, una spiegazione passo‑passo e una sezione "Concetti Fondamentali".</div>
          </div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] flex flex-col" style="min-height:320px;">
          <label class="block text-xs text-slate-300">Dati / Richiesta</label>
          <textarea id="excel-input" class="input-glass mt-2 w-full h-40 p-3 rounded-xl text-sm font-mono" placeholder="Incolla CSV o descrivi il problema (es. 'calcola somma condizionale per colonna B')"></textarea>

          <div class="mt-3 flex gap-3">
            <button id="insert-excel-sample" class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl">Inserisci esempio</button>
            <button id="clear-excel" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl">Pulisci</button>
          </div>

          <div id="excel-preview" class="mt-4 overflow-auto p-3 rounded-xl bg-[rgba(0,0,0,0.15)] text-xs text-slate-300" style="max-height:220px"></div>
        </div>
      </div>

      <div class="mt-6 app-card p-4 rounded-2xl bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)]">
        <div class="flex items-center justify-between">
          <h4 class="text-sm text-slate-300">Risposta IA</h4>
          <div class="flex gap-2 text-xs">
            <button id="export-excel-pdf" class="input-glass px-3 py-1 rounded">Esporta PDF</button>
            <button id="poster-excel-svg" class="input-glass px-3 py-1 rounded">Locandina (SVG)</button>
            <button id="share-excel-ws" class="input-glass px-3 py-1 rounded">WhatsApp</button>
            <button id="share-excel-tg" class="input-glass px-3 py-1 rounded">Telegram</button>
          </div>
        </div>
        <div id="excel-output" class="mt-3 text-sm text-slate-200"></div>
      </div>
    </div>
  `

  // UI handlers
  document.querySelectorAll('.excel-example').forEach(b=> b.addEventListener('click', (e)=>{
    const t = e.currentTarget.dataset.sample;
    const el = document.getElementById('excel-input');
    const map = {
      sum: 'Esempio: calcolare la somma di B2:B20 escludendo celle vuote. Vuoi la formula per Excel? (fornisci range e condizione se necessaria).',
      vlookup: 'Esempio: usare VLOOKUP per cercare valore in A e restituire corrispondenza dalla colonna C. Mostrami la formula e spiegala.',
      pivot: 'Vorrei creare una tabella pivot che raggruppi vendite per mese e categoria: suggerisci i campi e i passaggi.'
    };
    el.value = map[t] || '';
    el.focus();
  }));

  document.getElementById('insert-excel-sample').addEventListener('click', ()=>{
    const el = document.getElementById('excel-input');
    el.value = 'Date,Category,Amount\n2026-01-10,Books,45\n2026-01-12,Stationery,12\n2026-02-01,Books,23';
    document.getElementById('excel-preview').innerHTML = csvToHtmlTable(el.value);
  });
  document.getElementById('clear-excel').addEventListener('click', ()=>{ document.getElementById('excel-input').value=''; document.getElementById('excel-preview').innerHTML=''; document.getElementById('excel-output').innerHTML=''; });

  document.getElementById('preview-csv').addEventListener('click', ()=>{
    const f = document.getElementById('excel-csv-file').files[0];
    if(!f) return alert('Seleziona un file CSV prima.');
    const reader = new FileReader();
    reader.onload = (ev)=>{ document.getElementById('excel-input').value = ev.target.result; document.getElementById('excel-preview').innerHTML = csvToHtmlTable(ev.target.result); };
    reader.readAsText(f);
  });

  document.getElementById('explain-excel-btn').addEventListener('click', async ()=>{
    const text = document.getElementById('excel-input').value.trim();
    if(!text) return alert('Inserisci dati o descrivi il problema prima di chiedere all\'IA.');
    if(!googleApiKey) return alert('Configura prima la Google Gemini API Key nel modulo IA Tutor.');

    const instruction = `Sei un tutor esperto in Microsoft Excel. Fornisci la formula richiesta (uso Excel), spiega ogni parte della formula, mostra eventuali alternative (ad es. formule dinamiche / LET / LAMBDA), e termina con una sezione "Concetti Fondamentali". Quando utile, fornisci una breve tabella di esempio e passi pratici.`;
    const prompt = `${instruction}\n\nRichiesta utente:\n${text}`;

    const out = document.getElementById('excel-output');
    out.innerHTML = '<div class="text-sm text-slate-400">Interrogando il tutor IA…</div>';
    try{
      const resp = await chiediAiutoIA(prompt);
      out.innerHTML = renderTextAsHtml(resp);
      processAiOutput();
    }catch(err){
      out.innerHTML = `<div class="text-sm text-red-400">Errore: ${escapeHtml(err.message||err)}</div>`;
    }
  });

  // --- Export / poster / share handlers (Excel Tutor) ---
  const exportExcelPdf = document.getElementById('export-excel-pdf');
  if(exportExcelPdf) exportExcelPdf.addEventListener('click', ()=>{
    const input = document.getElementById('excel-input').value || '';
    const preview = document.getElementById('excel-preview').innerHTML || '';
    const outHtml = document.getElementById('excel-output').innerHTML || '';
    const html = `<h1>Excel Tutor - Richiesta</h1><h2>Dati</h2><pre>${escapeHtml(input)}</pre><h2>Anteprima</h2>${preview}<h2>Risposta IA</h2>${outHtml}`;
    exportHtmlToPrintableWindow('Excel Tutor - Esportazione', html);
  });

  const posterExcel = document.getElementById('poster-excel-svg');
  if(posterExcel) posterExcel.addEventListener('click', async ()=>{
    const snippet = (document.getElementById('excel-input').value || '').split('\n').slice(0,3).join(' ');
    const svg = await generatePosterSvg({ title: 'Excel Tutor — Scuola 2026', subtitle: snippet || 'Analisi dati', qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'poster-excel.svg');
  });

  const shareExcelWs = document.getElementById('share-excel-ws'); if(shareExcelWs) shareExcelWs.addEventListener('click', ()=> shareToWhatsApp('Guarda l\'Excel Tutor di Scuola 2026', window.location.href));
  const shareExcelTg = document.getElementById('share-excel-tg'); if(shareExcelTg) shareExcelTg.addEventListener('click', ()=> shareToTelegram('Guarda l\'Excel Tutor di Scuola 2026', window.location.href));
}

function csvToHtmlTable(csv){
  try{
    const rows = csv.trim().split('\n').map(r=>r.split(','));
    let html = '<div class="overflow-auto"><table class="w-full text-xs"><thead><tr class="text-slate-300">';
    rows[0].forEach(h=> html += `<th class="px-2 py-1 text-left">${escapeHtml(h)}</th>`);
    html += '</tr></thead><tbody>';
    rows.slice(1).forEach(r=>{ html += '<tr class="text-slate-400">'; r.forEach(c=> html += `<td class="px-2 py-1">${escapeHtml(c)}</td>`); html += '</tr>'; });
    html += '</tbody></table></div>';
    return html;
  }catch(e){ return '<div class="text-xs text-red-400">Errore nella lettura del CSV</div>' }
}

/* Photo Creator module removed — page and image-generation disabled */




  // Image-generation code removed (Photo Creator disabled) — no runtime references remain

  /* image-generation removed when Photo Creator was disabled */
  /* const res = await fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  if(!res.ok){ const t = await res.text(); throw new Error(`Image API error ${res.status}: ${t}`); }
  const json = await res.json(); */
  // image extraction and fallback helpers removed (clean)




function downloadDataUrl(dataUrl, filename){ const a = document.createElement('a'); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }


// ---------- Chat UI helpers ----------
function appendMessage(who, text){
  const log = document.getElementById('chat-log');
  if(!log) return;
  const wrapper = document.createElement('div');
  wrapper.className = who === 'user' ? 'msg-bubble msg-user' : 'msg-bubble msg-ai';

  // Preserve possible code fences and mermaid blocks as HTML
  wrapper.innerHTML = renderTextAsHtml(text);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;
}

function renderTextAsHtml(text){
  // Very small renderer: code fences -> <pre><code>, mermaid fences preserved as .mermaid
  // Convert Markdown-style ```lang\n...``` blocks
  const fenced = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
    if((lang||'').toLowerCase() === 'mermaid'){
      return `<div class="mermaid">${escapeHtml(code)}</div>`;
    }
    return `<pre class="rounded-md p-3 bg-black/60 overflow-auto"><code class="language-${escapeHtml(lang||'')}">${escapeHtml(code)}</code></pre>`;
  });

  // simple line breaks -> <br>
  return fenced.split('\n').map(escapeHtml).join('<br>');
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Called after AI response inserted: render LaTeX and Mermaid blocks
async function processAiOutput(){
  // MathJax render
  if(window.MathJax && window.MathJax.typesetPromise){
    try{ await MathJax.typesetPromise(); }catch(e){}
  }
  // Mermaid render
  renderMermaidIn(document.getElementById('app'));
}

function htmlDecode(input){
  const txt = document.createElement('textarea');
  txt.innerHTML = input;
  return txt.value;
}

function renderMermaidIn(root){
  if(!window.mermaid) return;
  root.querySelectorAll('.mermaid').forEach((el, idx) => {
    const parent = el.parentElement;
    const container = document.createElement('div');
    container.className = 'mermaid-wrapper';
    parent.replaceChild(container, el);

    // read textContent (may contain escaped HTML like &lt;div&gt;...)
    let code = el.textContent.trim();

    // decode HTML entities if present (e.g. &lt;div class='mermaid'&gt;...)
    if(code.includes('&lt;') || code.includes('&gt;') || code.includes('&amp;')){
      code = htmlDecode(code);
    }

    // remove literal HTML tags if any remain
    if(code.includes('<')){
      code = code.replace(/<[^>]+>/g, '').trim();
    }

    // If the mermaid block was double-wrapped or contains extra content,
    // extract the diagram starting from a known diagram keyword
    const diagMatch = code.match(/(?:graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie)[\s\S]*/i);
    if(diagMatch){
      code = diagMatch[0].trim();
    }

    // insert the diagram as plain text to avoid HTML-injection/escaping issues
    const mermaidNode = document.createElement('div');
    mermaidNode.className = 'mermaid';
    mermaidNode.textContent = code;
    container.appendChild(mermaidNode);

    // Try synchronous parse first (if supported) to catch obvious syntax errors
    try{
      if(mermaid.parse) mermaid.parse(code);
    }catch(err){
      console.error('Mermaid parse failed:', err, '\nSanitized code:\n', code);
      container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid: sintassi non valida.</div>`;
      return; // don't attempt render
    }

    // mermaid.init can be asynchronous in some builds — handle promise rejections explicitly
    try{
      const maybePromise = mermaid.init(undefined, container);
      if(maybePromise && typeof maybePromise.then === 'function'){
        maybePromise.then(()=>{/* rendered */}).catch((err)=>{
          console.error('Mermaid async render failed:', err);
          container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid durante il rendering.</div>`;
        });
      }
    }catch(err){
      console.error('Mermaid render failed (sync):', err);
      container.innerHTML = `<div class="text-xs text-red-400">Errore Mermaid durante il rendering.</div>`;
    }
  });
}

// Global unhandled rejection handler for debugging Mermaid/async errors
window.addEventListener('unhandledrejection', (ev) => {
  console.warn('Unhandled promise rejection:', ev.reason);
});

// ---------- IA Client (separata dalla UI) ----------
// saveApiKey: legge dall'input e mette in memoria (non hardcoded, non persistente)
function saveApiKey(){
  const input = document.getElementById('api-key-input');
  if(!input) return alert('Campo API Key non trovato.');
  const raw = input.value || '';
  const val = raw.trim();
  if(!val) return alert('Inserisci una API Key valida.');

  // Basic validation to catch obvious paste mistakes (e.g. paste di warning/HTML)
  const invalidPatterns = [ /cdn\.tailwindcss\.com/i, /http(s?):\/\//i, /should not be used in production/i ];
  if(invalidPatterns.some(rx => rx.test(val)) || val.includes(' ')){
    alert('API Key non valida: sembra tu abbia incollato del testo non corretto. Copia la API key dal Google Cloud Console (solo la stringa della key).');
    return;
  }

  // Heuristic length check (API keys are usually > 20 chars)
  if(val.length < 20){
    const ok = confirm('La stringa inserita sembra corta per una API Key. Vuoi comunque salvarla?');
    if(!ok) return;
  }

  googleApiKey = val; // in-memory only
  input.value = '';
  updateApiUi();
  // populate models dropdown automatically after key set
  populateModelSelect().catch(err => {
    console.warn('populateModelSelect failed', err);
    alert('Impossibile caricare i modelli: ' + (err.message || err));
  });
  alert('API Key configurata con successo. Il tutor è attivo.');
}

function removeApiKey(){
  googleApiKey = '';
  const input = document.getElementById('api-key-input');
  if(input) input.value = '';
  updateApiUi();
  alert('API Key rimossa. Puoi inserire una nuova chiave.');
}

function updateApiUi(){
  const status = document.getElementById('api-status');
  const saveBtn = document.getElementById('save-api-btn');
  const removeBtn = document.getElementById('remove-api-btn');
  const sendBtn = document.getElementById('send-prompt');
  const modelSelect = document.getElementById('model-select');
  if(googleApiKey){
    if(status) status.textContent = 'Key configurata';
    if(saveBtn) saveBtn.disabled = true;
    if(removeBtn) removeBtn.disabled = false;
    if(sendBtn) sendBtn.disabled = false;
    if(modelSelect) modelSelect.disabled = false;
    status.classList.remove('text-red-400');
    status.classList.add('text-emerald-400');
  } else {
    if(status) status.textContent = 'Key non configurata';
    if(saveBtn) saveBtn.disabled = false;
    if(removeBtn) removeBtn.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
    if(modelSelect) modelSelect.disabled = true;
    status.classList.remove('text-emerald-400');
    status.classList.add('text-red-400');
  }
}

// chiediAiutoIA: effettua la chiamata HTTP al modello generativo Google
// Nota: l'endpoint e la shape della richiesta possono cambiare con le versioni dell'API.
async function chiediAiutoIA(promptUtente, modelName){
  if(!googleApiKey) throw new Error('API Key non configurata. Vai su IA Tutor e premi "Configura IA".');

  // choose model: explicit param -> DOM -> fallback
  const sel = modelName || (document.getElementById('model-select') && document.getElementById('model-select').value) || 'models/gemini-2.5-pro';

  // Compose a prompt with explicit behavior rules (tutor universitario)
  const systemInstruction = `Sei un tutor universitario. Usa LaTeX per le formule matematiche, fornisci codice commentato, includi diagrammi Mermaid quando utile, e termina con una sezione "Concetti Fondamentali".`;
  const body = { prompt: `${systemInstruction}\n\nUtente: ${promptUtente}` };

  // first attempt: use :generateContent (some models support it)
  // NOTE: `sel` already contains the full resource name returned by ListModels (e.g. "models/gemini-2.5-pro").
  // Do NOT encode the slash in the model name — build the path literally.
  const modelResource = sel.startsWith('models/') ? sel : `models/${sel}`;
  const contentEndpoint = `https://generativelanguage.googleapis.com/v1beta/${modelResource}:generateContent?key=${encodeURIComponent(googleApiKey)}`;
  const contentReq = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt }] }] }) };

  let res;
  try{
    res = await fetch(contentEndpoint, contentReq);
  }catch(netErr){
    // network / CORS / origin null errors
    throw new Error(`Network/CORS error when calling model endpoint. Serve the app via http://localhost or use a server-side proxy. (${netErr.message})`);
  }

  // If generateContent is unsupported or returns bad-request, try :generateText as fallback
  if(!res.ok){
    const errText = await res.text();

    // If model not found -> list alternatives
    if(res.status === 404){
      try{ const models = await listAvailableModels(); throw new Error(`Modello non trovato (404). Modelli disponibili: ${models.join(', ')}`); }
      catch(inner){ throw new Error(`Modello non trovato (404). Impossibile elencare i modelli: ${inner.message}`); }
    }

    // For 400/unsupported-method, attempt generateText fallback
    if(res.status === 400 || /not supported for generateContent|unsupported/i.test(errText)){
      console.warn('generateContent failed, trying generateText fallback:', errText);
      const textEndpoint = `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(sel)}:generateText?key=${encodeURIComponent(googleApiKey)}`;
      const textReqBody = { prompt: { text: body.prompt } };
      const textRes = await fetch(textEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(textReqBody) });
      if(!textRes.ok){
        const tErr = await textRes.text();
        throw new Error(`generateText fallback failed ${textRes.status}: ${tErr}`);
      }
      const tJson = await textRes.json();
      // try to extract text from common shapes
      const tText = tJson.candidates?.[0]?.content?.parts?.[0]?.text || tJson.output?.[0]?.content || tJson.result?.output || JSON.stringify(tJson);
      return tText;
    }

    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  try{
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || data.output?.[0]?.content || JSON.stringify(data);
    return text;
  }catch(e){
    return JSON.stringify(data);
  }
}

// Recupera la lista di modelli disponibili per l'API (usato per suggerire alternative quando il modello richiesto non esiste)
async function listAvailableModels(){
  if(!googleApiKey) throw new Error('API Key non configurata.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(googleApiKey)}`;
  let res;
  try{
    res = await fetch(url);
  }catch(err){
    // likely a network / CORS problem (e.g. origin null from file://)
    throw new Error(`Network or CORS error while listing models. Se stai aprendo "index.html" direttamente, avvia un server locale (es. "npx http-server" o "python -m http.server") o usa un proxy server. (${err.message})`);
  }

  if(!res.ok){
    const t = await res.text();
    throw new Error(`ListModels failed ${res.status}: ${t}`);
  }
  const json = await res.json();
  return (json.models || []).map(m => m.name || m.displayName || JSON.stringify(m));
}

// Popola la select dei modelli nella UI e seleziona un modello consigliato se presente
async function populateModelSelect(){
  const sel = document.getElementById('model-select');
  if(!sel) return;
  sel.innerHTML = '<option>Caricamento...</option>';
  try{
    const models = await listAvailableModels();
    sel.innerHTML = '';
    // preferenze di default in ordine
    const preferred = ['models/gemini-2.5-pro','models/gemini-pro-latest','models/gemini-flash-latest','models/gemini-2.5-flash'];
    let picked = '';
    models.forEach(m => {
      const name = m;
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
      if(!picked && preferred.includes(name)) picked = name;
    });
    // se non trovato un preferito, prendi il primo
    if(!picked && models.length) picked = models[0];
    if(picked) sel.value = picked;
  }catch(err){
    sel.innerHTML = '<option disabled>Impossibile caricare modelli</option>';
    throw err;
  }
}

// ---------- Schemi (diagram maker) ----------
function extractMermaidFromText(text){
  // Extract fenced mermaid block if present, otherwise try to find diagram by keywords
  const fence = /```\s*mermaid\s*\n([\s\S]*?)```/i.exec(text);
  if(fence && fence[1]) return fence[1].trim();
  // look for raw mermaid starting keywords
  const diag = text.match(/(?:graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie)[\s\S]*/i);
  if(diag) return diag[0].trim();
  return null;
}

function downloadSvgElement(svgEl, filename){
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);
  // add namespace if missing
  if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)){
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'diagram.svg'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 5000);
}

function downloadMermaidAsPng(svgEl, filename){
  return new Promise((resolve, reject)=>{
    try{
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgEl);
      if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const svgBlob = new Blob([source], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        // white background
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0);
        const png = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = png; a.download = filename || 'diagram.png'; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = (e)=>{ URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    }catch(err){ reject(err); }
  });
}

function renderMatematica(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Matematica — Calcoli & Formule</h2>
          <p class="text-sm text-slate-400 mt-1">Inserisci un problema matematico o una formula; l'IA risponderà usando LaTeX e spiegazioni passo‑passo.</p>
        </div>
        <div class="text-xs text-slate-300">Usa LaTeX per le formule e troverai equazioni pronte da copiare.</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-white/3">
          <label class="block text-xs text-slate-300">Richiesta (es. "Dimostra che..." o "Risolvere ∫ e^x / x dx")</label>
          <textarea id="math-input" class="input-glass mt-2 w-full h-36 p-3 rounded-lg text-sm" placeholder="Scrivi qui il problema matematico..."></textarea>

          <div class="mt-3 flex gap-2">
            <button id="math-send" class="flex-1 bg-neon-blue text-black px-3 py-2 rounded-lg">Chiedi all'IA</button>
            <button id="clear-math" class="ml-2 bg-red-600 text-white px-3 py-2 rounded-lg">Pulisci</button>
          </div>

          <div class="mt-3 text-xs text-slate-400">L'IA userà LaTeX per formattare le formule e fornirà una spiegazione passo‑passo.</div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] flex flex-col" style="min-height:280px;">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm text-slate-300">Risposta IA</div>
            <div class="flex gap-2 text-xs">
              <button id="export-math-pdf" class="input-glass px-3 py-1 rounded">Esporta PDF</button>
              <button id="poster-math-svg" class="input-glass px-3 py-1 rounded">Locandina (SVG)</button>
              <button id="share-math-ws" class="input-glass px-3 py-1 rounded">WhatsApp</button>
              <button id="share-math-tg" class="input-glass px-3 py-1 rounded">Telegram</button>
            </div>
          </div>

          <div id="math-output" class="mt-2 overflow-auto p-4 rounded-xl bg-black/20 text-xs" style="max-height:360px"></div>
        </div>
      </div>
    </div>
  `;

  // UI handlers
  const sendBtn = document.getElementById('math-send');
  if(sendBtn) sendBtn.addEventListener('click', async ()=>{
    const prompt = (document.getElementById('math-input').value || '').trim();
    const out = document.getElementById('math-output');
    if(!prompt) return alert('Inserisci prima il problema o la formula.');
    if(!googleApiKey) return alert('Configura prima la Google Gemini API Key nel modulo IA Tutor.');
    out.innerHTML = '<div class="text-sm text-slate-400">Sto interrogando il tutor IA…</div>';
    try{
      const instruction = `Sei un tutor di matematica. Rispondi con spiegazioni chiare, usa LaTeX per tutte le formule, mostra i passaggi e termina con una sezione "Concetti Fondamentali".`;
      const resp = await chiediAiutoIA(instruction + '\n\n' + prompt);
      out.innerHTML = renderTextAsHtml(resp);
      await processAiOutput();
    }catch(err){ out.innerHTML = `<div class="text-sm text-red-400">Errore: ${escapeHtml(err.message||err)}</div>`; }
  });

  const clearBtn = document.getElementById('clear-math'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ document.getElementById('math-input').value = ''; document.getElementById('math-output').innerHTML = ''; });

  const exportPdfBtn = document.getElementById('export-math-pdf'); if(exportPdfBtn) exportPdfBtn.addEventListener('click', ()=>{
    const req = escapeHtml(document.getElementById('math-input').value || '');
    const outHtml = document.getElementById('math-output').innerHTML || '';
    exportHtmlToPrintableWindow('Matematica - Esportazione', `<h1>Matematica - Richiesta</h1><h2>Richiesta</h2><pre>${req}</pre><h2>Risposta IA</h2>${outHtml}`);
  });

  const posterBtn = document.getElementById('poster-math-svg'); if(posterBtn) posterBtn.addEventListener('click', async ()=>{
    const snippet = (document.getElementById('math-input').value || '').split('\n').slice(0,3).join(' ');
    const svg = await generatePosterSvg({ title: 'Matematica — Scuola 2026', subtitle: snippet || 'Esercizio', qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'poster-math.svg');
  });

  const shareWs = document.getElementById('share-math-ws'); if(shareWs) shareWs.addEventListener('click', ()=> shareToWhatsApp('Guarda questo esercizio di Matematica', window.location.href));
  const shareTg = document.getElementById('share-math-tg'); if(shareTg) shareTg.addEventListener('click', ()=> shareToTelegram('Guarda questo esercizio di Matematica', window.location.href));
}

function renderSintesi(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Sintesi — Riassumi testi</h2>
          <p class="text-sm text-slate-400 mt-1">Incolla un testo lungo e chiedi all'IA una sintesi in punti, un abstract o una versione per la scuola.</p>
        </div>
        <div class="text-xs text-slate-300">Scegli il tipo di sintesi all'invio.</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-white/3">
          <label class="block text-xs text-slate-300">Tipo di sintesi</label>
          <select id="sintesi-mode" class="mt-2 input-glass w-full px-3 py-2 rounded-lg text-sm outline-none">
            <option value="short">Breve (3 punti)</option>
            <option value="detailed">Dettagliata</option>
            <option value="school">Versione per la scuola</option>
          </select>

          <div class="mt-4">
            <button id="sintesi-send" class="w-full bg-neon-blue text-black px-3 py-2 rounded-lg">Genera sintesi</button>
            <div class="mt-2 text-xs text-slate-400">L'IA produrrà la sintesi richiesta. Puoi poi esportarla o condividerla.</div>
            <div class="mt-3 flex gap-2">
              <button id="export-sintesi-pdf" class="input-glass px-3 py-1 rounded text-xs">Esporta PDF</button>
              <button id="poster-sintesi-svg" class="input-glass px-3 py-1 rounded text-xs">Locandina (SVG)</button>
              <button id="share-sintesi-ws" class="input-glass px-3 py-1 rounded text-xs">WhatsApp</button>
              <button id="share-sintesi-tg" class="input-glass px-3 py-1 rounded text-xs">Telegram</button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] flex flex-col" style="min-height:280px;">
          <label class="block text-xs text-slate-300">Testo da sintetizzare</label>
          <textarea id="sintesi-input" class="input-glass mt-2 w-full h-48 p-3 rounded-xl text-sm" placeholder="Incolla qui il testo lungo..."></textarea>
          <div id="sintesi-output" class="mt-4 overflow-auto p-3 rounded-xl bg-black/20 text-xs" style="max-height:300px"></div>
        </div>
      </div>
    </div>
  `;

  // handlers
  const send = document.getElementById('sintesi-send');
  if(send) send.addEventListener('click', async ()=>{
    const txt = (document.getElementById('sintesi-input').value || '').trim();
    const mode = document.getElementById('sintesi-mode').value;
    const out = document.getElementById('sintesi-output');
    if(!txt) return alert('Incolla prima il testo da sintetizzare.');
    if(!googleApiKey) return alert('Configura prima la Google Gemini API Key nel modulo IA Tutor.');
    out.innerHTML = '<div class="text-sm text-slate-400">Sto interrogando il tutor IA…</div>';
    try{
      const instruction = mode === 'short' ? 'Fornisci una sintesi in 3 punti chiari.' : (mode === 'school' ? 'Scrivi una versione sintetica adatta a studenti.' : 'Fornisci una sintesi dettagliata, evidenziando i punti chiave.');
      const resp = await chiediAiutoIA(instruction + '\n\n' + txt);
      out.innerHTML = renderTextAsHtml(resp);
      await processAiOutput();
    }catch(err){ out.innerHTML = `<div class="text-sm text-red-400">Errore: ${escapeHtml(err.message||err)}</div>`; }
  });

  const exportBtn = document.getElementById('export-sintesi-pdf'); if(exportBtn) exportBtn.addEventListener('click', ()=>{
    const inTxt = escapeHtml(document.getElementById('sintesi-input').value || '');
    const outHtml = document.getElementById('sintesi-output').innerHTML || '';
    exportHtmlToPrintableWindow('Sintesi - Esportazione', `<h1>Sintesi</h1><h2>Originale</h2><pre>${inTxt}</pre><h2>Sintesi</h2>${outHtml}`);
  });
  const posterBtn = document.getElementById('poster-sintesi-svg'); if(posterBtn) posterBtn.addEventListener('click', async ()=>{ const snippet = (document.getElementById('sintesi-input').value || '').split('\n').slice(0,3).join(' '); const svg = await generatePosterSvg({ title: 'Sintesi — Scuola 2026', subtitle: snippet || 'Sintesi', qrUrl: 'https://www.ldm4app.com' }); downloadSvgString(svg, 'poster-sintesi.svg'); });
  const sws = document.getElementById('share-sintesi-ws'); if(sws) sws.addEventListener('click', ()=> shareToWhatsApp('Ecco una sintesi da Scuola 2026', window.location.href));
  const stg = document.getElementById('share-sintesi-tg'); if(stg) stg.addEventListener('click', ()=> shareToTelegram('Ecco una sintesi da Scuola 2026', window.location.href));
}

function renderSchemi(container){
  container.innerHTML = `
    <div class="app-card p-6 rounded-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Schemi — Genera diagrammi (Mermaid)</h2>
          <p class="text-sm text-slate-400 mt-1">Chiedi all'IA di generare uno schema; l'output in Mermaid verrà renderizzato e potrai scaricarlo.</p>
        </div>
        <div class="text-xs text-slate-400">Suggerimento: chiedi "Genera un diagramma mermaid che mostri..."</div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)]">
          <label class="block text-xs text-slate-300">Prompt per IA</label>
          <textarea id="schemi-prompt" class="input-glass mt-2 w-full h-36 p-3 rounded-lg text-sm" placeholder="Esempio: 'Genera un diagramma mermaid che mostra i principali componenti di un circuito elettrico e le loro connessioni'" ></textarea>
          <div class="mt-3 flex gap-2">
            <button id="generate-schema-btn" class="flex-1 bg-neon-blue text-black px-3 py-2 rounded-lg">Genera con IA</button>
            <button id="render-local-btn" class="ml-2 bg-emerald-500 text-white px-3 py-2 rounded-lg">Render locale</button>
          </div>

          <div class="mt-3 text-xs text-slate-400">L'IA cercherà di rispondere con un blocco \`\`\`mermaid\`\`\` contenente solo il diagramma. In mancanza di blocco, cercheremo parole chiave.</div>
        </div>

        <div class="lg:col-span-2 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] flex flex-col" style="min-height:320px;">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm text-slate-300">Anteprima schema</div>
            <div class="flex gap-2 text-xs">
              <button id="copy-mermaid" class="input-glass px-3 py-1 rounded">Copia Mermaid</button>
              <button id="download-svg" class="input-glass px-3 py-1 rounded">Scarica SVG</button>
              <button id="download-png" class="input-glass px-3 py-1 rounded">Scarica PNG</button>
              <button id="export-schema-pdf" class="input-glass px-3 py-1 rounded">Esporta PDF</button>
              <button id="poster-schema-svg" class="input-glass px-3 py-1 rounded">Locandina (SVG)</button>
            </div>
          </div>

          <div id="schema-output" class="p-3 rounded-xl bg-[rgba(0,0,0,0.12)] flex-1 overflow-auto text-xs text-white"></div>
          <textarea id="schema-source" class="mt-3 input-glass w-full h-28 p-3 rounded-lg text-xs font-mono" placeholder="Mermaid source (modificabile)"></textarea>
        </div>
      </div>
    </div>
  `;

  // UI bindings
  document.getElementById('render-local-btn').addEventListener('click', async ()=>{
    const src = document.getElementById('schema-source').value.trim();
    if(!src) return alert('Incolla o scrivi il codice mermaid nella casella sottostante.');
    document.getElementById('schema-output').innerHTML = `<div class="mermaid">${escapeHtml(src)}</div>`;
    await processAiOutput();
  });

  document.getElementById('copy-mermaid').addEventListener('click', async ()=>{
    const src = document.getElementById('schema-source').value.trim();
    if(!src) return alert('Nessun codice mermaid da copiare.');
    await navigator.clipboard.writeText(src);
    alert('Mermaid copiato negli appunti');
  });

  document.getElementById('download-svg').addEventListener('click', ()=>{
    const svg = document.querySelector('#schema-output .mermaid-wrapper svg');
    if(!svg) return alert('Nessun SVG trovato. Renderizza prima lo schema.');
    downloadSvgElement(svg, 'schema.svg');
  });

  document.getElementById('download-png').addEventListener('click', async ()=>{
    const svg = document.querySelector('#schema-output .mermaid-wrapper svg');
    if(!svg) return alert('Nessun SVG trovato. Renderizza prima lo schema.');
    try{ await downloadMermaidAsPng(svg, 'schema.png'); }catch(err){ alert('Errore nella conversione PNG: ' + (err.message||err)); }
  });

  // ---- Export / poster / share handlers (Schemi) ----
  document.getElementById('export-schema-pdf').addEventListener('click', ()=>{
    const src = document.getElementById('schema-source').value.trim();
    if(!src) return alert('Nessun codice mermaid da esportare.');
    // also try to include rendered SVG if present
    const svgEl = document.querySelector('#schema-output .mermaid-wrapper svg');
    const svgHtml = svgEl ? svgEl.outerHTML : '';
    const html = `<h1>Schema</h1><h2>Mermaid source</h2><pre>${escapeHtml(src)}</pre><h2>Anteprima</h2>${svgHtml}`;
    exportHtmlToPrintableWindow('Schema - Esportazione', html);
  });

  document.getElementById('poster-schema-svg').addEventListener('click', async ()=>{
    const src = document.getElementById('schema-source').value.trim();
    const snippet = src.split('\n').slice(0,2).join(' ');
    const svg = await generatePosterSvg({ title: 'Schema — Scuola 2026', subtitle: snippet || 'Diagramma', qrUrl: 'https://www.ldm4app.com' });
    downloadSvgString(svg, 'poster-schema.svg');
  });

  document.getElementById('generate-schema-btn').addEventListener('click', async ()=>{
    const prompt = document.getElementById('schemi-prompt').value.trim();
    if(!prompt) return alert('Inserisci un prompt per l\'IA.');
    if(!googleApiKey) return alert('Configura prima la API Key in IA Tutor.');

    // instruct the model to return only a mermaid fenced block
    const instruction = `Rispondi SOLO con un blocco \\\`\\\`\\\`mermaid e il codice del diagramma. Non aggiungere spiegazioni testuali.`;
    const fullPrompt = `${instruction}\n\nPrompt utente: ${prompt}`;

    const out = document.getElementById('schema-output');
    out.innerHTML = '<div class="text-xs text-slate-400">Interrogando l\'IA per generare Mermaid…</div>';
    try{
      const resp = await chiediAiutoIA(fullPrompt);
      // insert raw response and extract mermaid
      const mermaidCode = extractMermaidFromText(resp) || resp;
      document.getElementById('schema-source').value = mermaidCode;
      out.innerHTML = `<div class="mermaid">${escapeHtml(mermaidCode)}</div>`;
      await processAiOutput();
    }catch(err){
      out.innerHTML = `<div class="text-xs text-red-400">Errore: ${escapeHtml(err.message||err)}</div>`;
    }
  });
}

// ---------- Theme toggle + initial boot ----------
(function boot(){
  // attach nav listeners
  document.querySelectorAll('.nav-link').forEach(btn=>{
    btn.addEventListener('click', ()=> navigate(btn.dataset.route));
  });

  // initialize Lucide icons (renders <i data-lucide="...">)
  try{ if(window.lucide) lucide.replace({ width:16, height:16, stroke:'#9beafe' }); }catch(e){ console.warn('lucide init failed', e); }

  // attach global share buttons (header)
  const gWs = document.getElementById('share-global-ws');
  const gTg = document.getElementById('share-global-tg');
  if(gWs) gWs.addEventListener('click', ()=> window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Prova Scuola 2026 — ' + window.location.href)}`, '_blank'));
  if(gTg) gTg.addEventListener('click', ()=> window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Prova Scuola 2026')}`, '_blank'));

  // default route
  navigate('dashboard');
})();

/*
  NOTE: Security & next steps
  - Do NOT hardcode API keys in the source.
  - For production, proxy requests via a secure server to keep keys secret.
  - Update model/endpoint parameters according to Google's latest API docs.
*/

// --- PWA: register service worker + 'install' CTA handling ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', reg);

      // if an updated SW is waiting, prompt user to reload
      if (reg.waiting) notifyUpdateAvailable(reg);

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        installing && (installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // new content available
            notifyUpdateAvailable(reg);
          }
        }));
      });

      // reload when the new SW activates after skipWaiting
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}

function notifyUpdateAvailable(registration) {
  const doReload = confirm('È disponibile una nuova versione dell\'app. Ricaricare ora per aggiornare?');
  if (doReload) {
    // tell SW to activate immediately
    registration.waiting && registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// beforeinstallprompt -> show install button
let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const btn = document.getElementById('install-pwa-btn');
  if (btn) btn.classList.remove('hidden');
});

const installBtn = document.getElementById('install-pwa-btn');
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  const choice = await deferredPwaPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    console.log('PWA install accepted');
  } else {
    console.log('PWA install dismissed');
  }
  deferredPwaPrompt = null;
  installBtn.classList.add('hidden');
});

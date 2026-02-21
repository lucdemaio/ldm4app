// AI integration for SoccerManager — Groq (proxy-first), context-aware, actionable suggestions
(function(){
  'use strict';
  console.log('🤖 Soccer AI module loaded');

  // Helper: fetch with timeout
  async function aiFetchWithTimeout(resource, options = {}, timeout = 6000){
    const controller = new AbortController();
    const id = setTimeout(()=> controller.abort(), timeout);
    try{
      const resp = await fetch(resource, {...options, signal: controller.signal});
      clearTimeout(id);
      return resp;
    }catch(e){
      clearTimeout(id);
      throw e;
    }
  }

  function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function appendAiMessage(who, text){
    const area = document.getElementById('soccer-ai-chat-log');
    if(!area) return;
    const el = document.createElement('div');
    el.className = who === 'user' ? 'ai-msg ai-user' : 'ai-msg ai-bot';
    el.innerHTML = `<strong>${who==='user'? '👤 Tu:' : '🤖 IA:'}</strong> ${escapeHtml(text)}`;
    area.appendChild(el);
    area.scrollTop = area.scrollHeight;
  }

  function setAiStatus(s){ const st = document.getElementById('soccer-ai-status'); if(st) st.textContent = s; }

  // Build a concise textual snapshot of the soccer app state for the model (trimmed)
  function getSoccerContext(){
    try{
      const teams = (typeof appState !== 'undefined' && typeof appState.getTeams === 'function') ? appState.getTeams() : [];
      const athletes = (typeof appState !== 'undefined' && typeof appState.getAthletes === 'function') ? appState.getAthletes() : [];
      const events = (typeof appState !== 'undefined' && typeof appState.getCalendarEvents === 'function') ? appState.getCalendarEvents() : [];

      const teamSummary = teams.slice(0,10).map(t=>`${t.id||t.name}: ${t.name}`).join('; ');
      const topPlayers = athletes.slice(0,40).map(a=>`${a.id||a.playerId||a.firstName+' '+a.lastName}(${a.role||'?'}/${a.teamId||'no-team'})`).join('\n');
      const upcoming = events.slice(0,10).map(e=>`${e.date||''} ${e.type||e.title||'event'} -> ${e.teamId||e.title||''}`).join('; ');

      const ctx = `TEAMS:${teamSummary}\nUPCOMING:${upcoming}\nPLAYERS:\n${topPlayers}`.slice(0,6000);
      return ctx;
    }catch(e){ return 'Nessun contesto disponibile.'; }
  }

  // Parse suggestions JSON from model output (fenced or plain)
  function parseSoccerSuggestions(text){
    if(!text) return [];
    console.log('🔍 Parsing AI response for suggestions...', text.slice(0, 200));
    
    const fenced = /```json\s*([\s\S]*?)```/i.exec(text);
    let candidate = fenced ? fenced[1].trim() : null;
    if(!candidate){
      const js = /({[\s\S]*})/.exec(text);
      candidate = js ? js[1] : null;
    }
    if(!candidate){
      console.log('❌ No JSON found in response, attempting natural language extraction...');
      // Try to extract player name and action from natural language
      const playerMatch = text.match(/(?:aggiungi|add|crea|create)\s+(?:un\s+)?giocatore?\s+(?:di\s+)?(?:nome\s+)?["']?([^"'\n]+?)["']?(?:\s|,|\.)/i);
      const roleMatch = text.match(/ruolo?\s*[:=]?\s*["']?([^"'\n]+?)["']?(?:\s|,|\.)/i);
      const teamMatch = text.match(/squadra?\s*[:=]?\s*["']?([^"'\n]+?)["']?(?:\s|,|\.)/i);
      
      if(playerMatch){
        const action = { 
          type: 'add_athlete', 
          playerName: playerMatch[1].trim(),
          role: roleMatch ? roleMatch[1].trim() : 'player',
          teamId: teamMatch ? teamMatch[1].trim() : ''
        };
        console.log('✅ Extracted action:', action);
        return [{ type: 'add_athlete', payload: action }];
      }
      return [];
    }
    
    try{
      const parsed = JSON.parse(candidate);
      console.log('✅ JSON parsed:', parsed);
      const arr = Array.isArray(parsed) ? parsed : (parsed.soccer_changes || parsed.changes || parsed.suggestions || parsed.actions || []);
      if(!Array.isArray(arr)) return [];
      return arr.map(it => {
        // normalize some common shapes
        return {
          type: it.type || it.action || (it.playerCode || it.playerId ? 'player_update' : (it.event ? 'add_event' : 'unknown')),
          payload: it
        };
      });
    }catch(e){ console.debug('❌ AI parse JSON failed', e.message); return []; }
  }

  // Try to apply parsed suggestions to appState (limited, safe operations)
  function applySoccerSuggestions(list){
    if(!Array.isArray(list) || list.length===0) return 0;
    if(typeof appState === 'undefined'){
      console.error('❌ appState is not defined — cannot apply suggestions');
      return 0;
    }
    const applied = [];
    list.forEach(item => {
      try{
        const t = item.type || item.action || 'unknown';
        const p = item.payload || item;
        console.log(`📋 Applying suggestion type="${t}":`, p);
        
        if(t === 'add_athlete' || t === 'add_player'){
          // Create new athlete
          const newAthlete = {
            id: `athlete-${Date.now()}`,
            playerId: `player-${Date.now()}`,
            firstName: (p.playerName || p.firstName || 'New').split(' ')[0],
            lastName: (p.playerName || p.lastName || 'Player').split(' ').slice(1).join(' '),
            role: p.role || 'player',
            teamId: p.teamId || p.team || '',
            number: p.number || null,
            nationality: p.nationality || '',
            birthDate: p.birthDate || '',
            height: p.height || null,
            weight: p.weight || null
          };
          if(typeof appState.addAthlete === 'function'){
            appState.addAthlete(newAthlete);
            applied.push({type:'add_athlete', athlete: newAthlete});
            console.log('✅ Added athlete:', newAthlete);
          } else {
            console.warn('⚠️ appState.addAthlete not available');
          }
        } else if(t === 'player_update' || p.playerId || p.playerName){
          // find player by id or name
          const id = p.playerId || p.id || p.code || p.playerCode || '';
          let player = null;
          if(id && typeof appState.getAthlete === 'function'){ 
            player = appState.getAthlete(id); 
          }
          if(!player && typeof appState.getAthletes === 'function'){
            player = appState.getAthletes().find(x=> (x.id==id || x.code==id || `${x.firstName} ${x.lastName}`.toLowerCase()==id.toLowerCase())); 
          }
          if(!player && p.playerName && typeof appState.getAthletes === 'function'){
            player = appState.getAthletes().find(a=> (`${a.firstName} ${a.lastName}`).toLowerCase().includes((p.playerName||'').toLowerCase())); 
          }
          if(player){
            const updates = {};
            if(p.role) updates.role = p.role;
            if(p.teamId || p.teamName){ 
              if(typeof appState.getTeam === 'function' && p.teamId){ 
                const team = appState.getTeam(p.teamId); 
                if(team) updates.teamId = team.id;
              } else if(typeof appState.getTeams === 'function'){
                const team = appState.getTeams().find(t=> t.name && t.name.toLowerCase().includes((p.teamName||'').toLowerCase()));
                if(team) updates.teamId = team.id;
              }
            }
            if(p.number) updates.number = p.number;
            if(Object.keys(updates).length){
              if(typeof appState.updateAthlete === 'function'){
                appState.updateAthlete(player.id, updates);
                applied.push({type:'player_update', player: player.id, updates});
                console.log('✅ Updated player:', player.id, updates);
              }
            }
          } else {
            console.warn('⚠️ Player not found for update:', id, p.playerName);
          }
        } else if(t === 'add_event' || p.event){
          const ev = p.event || p;
          const newEv = { title: ev.title || 'Evento AI', date: ev.date || new Date().toISOString().slice(0,10), type: ev.type || 'match', teamId: ev.teamId || ev.team || '' };
          if(typeof appState.addEvent === 'function'){
            appState.addEvent(newEv);
            applied.push({type:'add_event', event: newEv});
            console.log('✅ Added event:', newEv);
          }
        } else if(t === 'move_player'){
          // similar to player_update
          const id = p.playerId || p.id || p.playerCode || '';
          let player = null;
          if(typeof appState.getAthlete === 'function') player = appState.getAthlete(id);
          if(!player && typeof appState.getAthletes === 'function'){
            player = appState.getAthletes().find(x=> (x.id==id || x.code==id));
          }
          if(player && (p.teamId || p.teamName)){
            let team = null;
            if(typeof appState.getTeam === 'function' && p.teamId) team = appState.getTeam(p.teamId);
            if(!team && typeof appState.getTeams === 'function'){
              team = appState.getTeams().find(t=> t.name && t.name.toLowerCase().includes((p.teamName||'').toLowerCase()));
            }
            if(team && typeof appState.updateAthlete === 'function'){ 
              appState.updateAthlete(player.id, { teamId: team.id }); 
              applied.push({type:'move_player', player: player.id, team: team.id});
              console.log('✅ Moved player:', player.id, 'to team:', team.id);
            }
          }
        }
      }catch(err){ console.error('❌ Apply suggestion failed:', err); }
    });
    return applied.length;
  }

  // Called after AI response to show UI affordance for applying suggestions
  function handlePossibleSuggestions(text){
    const suggestions = parseSoccerSuggestions(text);
    const area = document.getElementById('soccer-ai-suggestions-area');
    if(!area) return;
    area.innerHTML = '';
    if(suggestions && suggestions.length){
      console.log('🎯 Found suggestions, attempting auto-apply:', suggestions);
      // Try auto-apply first
      const applied = applySoccerSuggestionsAndRefresh(suggestions);
      if(applied > 0){
        area.innerHTML = `<div style="padding:8px; background:#d1fae5; border:1px solid #6ee7b7; border-radius:6px; color:#065f46;">✅ <strong>${applied}</strong> modifiche applicate automaticamente!</div>`;
        setTimeout(()=>{ area.innerHTML=''; }, 5000);
      } else {
        // If auto-apply failed, show manual button
        const container = document.createElement('div');
        container.style.display='flex'; container.style.gap='8px'; container.style.alignItems='center';
        container.innerHTML = `<div style="flex:1; font-size:13px;">Rilevate <strong>${suggestions.length}</strong> azioni suggerite dall'IA.</div>`;
        const apply = document.createElement('button'); apply.className='btn btn-primary'; apply.textContent='Applica suggerimenti';
        const view = document.createElement('button'); view.className='btn btn-secondary'; view.textContent='Mostra JSON';
        apply.addEventListener('click', ()=>{ const n = applySoccerSuggestionsAndRefresh(suggestions); area.innerHTML=''; if(n>0) appendAiMessage('bot', `✅ Applicate ${n} modifiche suggerite`); });
        view.addEventListener('click', ()=>{ appendAiMessage('bot', JSON.stringify(suggestions, null, 2)); });
        container.appendChild(apply); container.appendChild(view);
        area.appendChild(container);
      }
    }
  }

  function applySoccerSuggestionsAndRefresh(suggestions){
    const normalized = suggestions.map(s => (s.payload ? s.payload : s));
    const applied = applySoccerSuggestions(normalized);
    try{ if(typeof AthletesModule !== 'undefined' && typeof AthletesModule.render === 'function') AthletesModule.render(); }catch(e){}
    try{ if(typeof TeamsModule !== 'undefined' && typeof TeamsModule.render === 'function') TeamsModule.render(); }catch(e){}
    try{ if(typeof CalendarModule !== 'undefined' && typeof CalendarModule.render === 'function') CalendarModule.render(); }catch(e){}
    return applied;
  }

  // Main inference function (proxy-first -> Groq direct -> Gemini proxy -> demo)
  async function performSoccerAiInference(prompt){
    const systemPreface = `Sei l'assistente virtuale per la gestione calcistica (SoccerManager).

ISTRUZIONI CRITICHE:
1. Se l'utente chiede di AGGIUNGERE, MODIFICARE o SPOSTARE giocatori, SEMPRE rispondi con un blocco JSON strutturato.
2. Formato JSON preferito:
\`\`\`json
{
  "soccer_changes": [
    {"type": "add_athlete", "playerName": "Nome Cognome", "role": "role", "teamId": "squadra"},
    {"type": "player_update", "playerId": "ID", "role": "ruolo", "number": 10},
    {"type": "move_player", "playerId": "ID", "teamId": "nuova_squadra"}
  ]
}
\`\`\`
3. Includi SEMPRE il JSON anche se dai una risposta testuale.
4. Supporta: aggiornare ruolo/numero di un giocatore, aggiungere nuovi giocatori, spostare giocatore in squadra diversa, aggiungere eventi.
5. Qualsiasi altra domanda: rispondi normalmente senza JSON.`;

    const includeCtx = document.getElementById('soccer-ai-include-context')?.checked;
    const context = includeCtx ? getSoccerContext() : '';
    const bodyPrompt = (context ? `CONTEXT:\n${context}\n\n` : '') + prompt;

    // 1) Groq via proxy
    try{
      const proxyResp = await aiFetchWithTimeout('https://www.ldm4app.com/proxy/groq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `${systemPreface}\n\n${bodyPrompt}` }) }, 8000);
      if(proxyResp.ok){ 
        const pj = await proxyResp.json(); 
        const text = pj.text || pj.result || pj.choices?.[0]?.message?.content || ''; 
        setAiStatus('⚡ Groq (proxy)'); 
        handlePossibleSuggestions(text); 
        return text; 
      }
    }catch(e){ console.debug('Groq proxy not available', e && e.message); }

    // 2) Groq direct (client key or localStorage)
    const groqKey = document.getElementById('soccer-ai-groq-key')?.value.trim() || localStorage.getItem('soccer_groq_key');
    if(groqKey){
      try{
        const resp = await aiFetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [ { role: 'system', content: systemPreface }, { role: 'user', content: bodyPrompt } ], max_tokens: 800, temperature: 0.8 }) }, 20000);
        if(!resp.ok){ const t = await resp.text(); throw new Error('Groq API error ' + resp.status + ': ' + t); }
        const j = await resp.json(); const out = j.choices?.[0]?.message?.content || JSON.stringify(j);
        setAiStatus('⚡ Groq (direct)'); handlePossibleSuggestions(out); return out;
      }catch(e){ throw new Error('Groq error: ' + (e.message||e)); }
    }

    // 3) Gemini proxy fallback
    try{
      const gp = await aiFetchWithTimeout('/proxy/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: bodyPrompt }) }, 8000);
      if(gp.ok){ const pj = await gp.json(); setAiStatus('🎯 Gemini (proxy)'); const txt = pj.text||pj.result||pj.output||''; handlePossibleSuggestions(txt); return txt; }
    }catch(e){ console.debug('Gemini proxy not available', e && e.message); }

    setAiStatus('demo');
    return `**[RISPOSTA DEMO]**\nPer risposte reali, salva la Groq API key o configura il proxy.\nDomanda: "${prompt}"`;
  }

  // Attach UI when DOM is ready
  document.addEventListener('DOMContentLoaded', ()=>{
    // save/remove key handlers
    const saveBtn = document.getElementById('soccer-ai-save-groq');
    if(saveBtn) saveBtn.addEventListener('click', ()=>{
      const v = document.getElementById('soccer-ai-groq-key').value.trim();
      if(!v) return alert('Inserisci la Groq API key');
      try{ localStorage.setItem('soccer_groq_key', v); document.getElementById('soccer-ai-groq-status').textContent = 'Groq key salvata (localStorage)'; alert('Groq key salvata localmente.'); }catch(e){ alert('Impossibile salvare la key: '+e.message); }
    });
    const remBtn = document.getElementById('soccer-ai-remove-groq');
    if(remBtn) remBtn.addEventListener('click', ()=>{ try{ localStorage.removeItem('soccer_groq_key'); document.getElementById('soccer-ai-groq-key').value=''; document.getElementById('soccer-ai-groq-status').textContent='Groq key rimossa'; alert('Groq key rimossa.'); }catch(e){} });

    const ask = document.getElementById('soccer-ai-ask-btn');
    if(ask) ask.addEventListener('click', async ()=>{
      const prompt = document.getElementById('soccer-ai-prompt').value.trim();
      if(!prompt) return alert('Inserisci una domanda.');
      appendAiMessage('user', prompt);
      setAiStatus('in esecuzione...');
      try{
        const out = await performSoccerAiInference(prompt);
        appendAiMessage('bot', out);
        setAiStatus('ok');
        document.getElementById('soccer-ai-prompt').value = '';
      }catch(err){ appendAiMessage('bot', 'Errore: '+(err.message||err)); setAiStatus('errore'); }
    });

    const clearBtn = document.getElementById('soccer-ai-clear-chat');
    if(clearBtn) clearBtn.addEventListener('click', ()=>{ const c = document.getElementById('soccer-ai-chat-log'); if(c) c.innerHTML=''; const s = document.getElementById('soccer-ai-suggestions-area'); if(s) s.innerHTML=''; setAiStatus('pronto'); });

    // pre-load saved key if present
    try{ const saved = localStorage.getItem('soccer_groq_key'); if(saved) document.getElementById('soccer-ai-groq-key').value = saved; }catch(e){}
  });

})();
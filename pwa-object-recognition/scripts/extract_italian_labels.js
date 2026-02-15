<<<<<<< HEAD
#!/usr/bin/env node
// Per ogni mappatura eng->it ottenuta precedentemente, scarica l'estratto it.wikipedia.org e prova a estrarre il lemma italiano semplice
// Output: dialects_it_clean.json { "label": "italian_word" }

const fs = require('fs');
const path = require('path');

const IN_FILE = path.resolve(__dirname, '..', 'dialects_it.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it_clean.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

function cleanCandidate(str){
  if (!str) return null;
  let s = str.trim();
  // remove quotes
  s = s.replace(/^['"\s]+|['"\s]+$/g,'');
  // lowercase and normalize diacritics? keep as-is
  return s;
}

async function extractLemma(title){
  try{
    const q = `https://it.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.missing) return null;
      const ex = p.extract;
      if (!ex) return null;
      const first = ex.split('\n')[0].split('. ')[0];
      // try to capture pattern: "X è ..." or "X, ..." or "X (... ) ..."
      const m = first.match(/^\s*([^,\(–—]+?)\s*(?:\(|,|–|—|\bè\b)\s*/i);
      if (m && m[1]) return cleanCandidate(m[1]);
      // fallback: take first words before 'is/è' or before comma
      const m2 = first.match(/^\s*([^,\.]+?)\s*(?:is|è|is an|is a)\b/i);
      if (m2 && m2[1]) return cleanCandidate(m2[1]);
      // as fallback, take entire first chunk truncated to 3 words
      const words = first.split(/\s+/).slice(0,3).join(' ');
      return cleanCandidate(words);
    }
  }catch(e){ return null; }
  return null;
}

(async ()=>{
  const data = JSON.parse(fs.readFileSync(IN_FILE,'utf8'));
  const out = {};
  const keys = Object.keys(data);
  console.log('Processing', keys.length, 'entries');
  for (const k of keys){
    process.stdout.write('.');
    const title = data[k];
    const lemma = await extractLemma(title);
    if (lemma) out[k] = lemma;
    await new Promise(r=>setTimeout(r, 220));
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote', Object.keys(out).length, 'clean mappings to', OUT_FILE);
})().catch(e=>{ console.error('Fatal', e); process.exit(1); });
=======
#!/usr/bin/env node
// Per ogni mappatura eng->it ottenuta precedentemente, scarica l'estratto it.wikipedia.org e prova a estrarre il lemma italiano semplice
// Output: dialects_it_clean.json { "label": "italian_word" }

const fs = require('fs');
const path = require('path');

const IN_FILE = path.resolve(__dirname, '..', 'dialects_it.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it_clean.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

function cleanCandidate(str){
  if (!str) return null;
  let s = str.trim();
  // remove quotes
  s = s.replace(/^['"\s]+|['"\s]+$/g,'');
  // lowercase and normalize diacritics? keep as-is
  return s;
}

async function extractLemma(title){
  try{
    const q = `https://it.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.missing) return null;
      const ex = p.extract;
      if (!ex) return null;
      const first = ex.split('\n')[0].split('. ')[0];
      // try to capture pattern: "X è ..." or "X, ..." or "X (... ) ..."
      const m = first.match(/^\s*([^,\(–—]+?)\s*(?:\(|,|–|—|\bè\b)\s*/i);
      if (m && m[1]) return cleanCandidate(m[1]);
      // fallback: take first words before 'is/è' or before comma
      const m2 = first.match(/^\s*([^,\.]+?)\s*(?:is|è|is an|is a)\b/i);
      if (m2 && m2[1]) return cleanCandidate(m2[1]);
      // as fallback, take entire first chunk truncated to 3 words
      const words = first.split(/\s+/).slice(0,3).join(' ');
      return cleanCandidate(words);
    }
  }catch(e){ return null; }
  return null;
}

(async ()=>{
  const data = JSON.parse(fs.readFileSync(IN_FILE,'utf8'));
  const out = {};
  const keys = Object.keys(data);
  console.log('Processing', keys.length, 'entries');
  for (const k of keys){
    process.stdout.write('.');
    const title = data[k];
    const lemma = await extractLemma(title);
    if (lemma) out[k] = lemma;
    await new Promise(r=>setTimeout(r, 220));
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote', Object.keys(out).length, 'clean mappings to', OUT_FILE);
})().catch(e=>{ console.error('Fatal', e); process.exit(1); });
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58

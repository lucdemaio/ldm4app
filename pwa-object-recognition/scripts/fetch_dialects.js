<<<<<<< HEAD
#!/usr/bin/env node
// Script semplice per raccogliere suggerimenti di traduzione da Wiktionary
// Prereq: Node 18+ (ha fetch nativo) oppure installa node-fetch

const fs = require('fs');
const path = require('path');

const LABELS_URL = 'https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json';
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_suggestions.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

async function queryWiktionaryForIt(label){
  try{
    const q = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(label)}&prop=langlinks&lllang=it&format=json&origin=*`;
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.langlinks && p.langlinks.length){
        return p.langlinks.map(l => l['*']);
      }
    }
    return null;
  }catch(e){ return null; }
}

(async ()=>{
  console.log('Fetch labels...');
  let labels = [];
  try{ labels = await fetchJson(LABELS_URL); }catch(e){ console.error('Failed to fetch label list', e); process.exit(1); }

  const out = {};
  for (const label of labels){
    process.stdout.write(`.${label.slice(0,1)}`);
    const normalized = label.toLowerCase();
    const suggestions = {};
    const it = await queryWiktionaryForIt(normalized);
    if (it && it.length) suggestions.it = Array.from(new Set(it.map(s => s.trim())));

    if (Object.keys(suggestions).length){
      out[normalized] = { suggestions, sources: ['wiktionary'] };
    }
    // respectful delay to avoid hammering
    await new Promise(r => setTimeout(r, 220));
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote suggestions to', OUT_FILE);
})().catch(e => { console.error('Fatal', e); process.exit(1); });
=======
#!/usr/bin/env node
// Script semplice per raccogliere suggerimenti di traduzione da Wiktionary
// Prereq: Node 18+ (ha fetch nativo) oppure installa node-fetch

const fs = require('fs');
const path = require('path');

const LABELS_URL = 'https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json';
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_suggestions.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

async function queryWiktionaryForIt(label){
  try{
    const q = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(label)}&prop=langlinks&lllang=it&format=json&origin=*`;
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.langlinks && p.langlinks.length){
        return p.langlinks.map(l => l['*']);
      }
    }
    return null;
  }catch(e){ return null; }
}

(async ()=>{
  console.log('Fetch labels...');
  let labels = [];
  try{ labels = await fetchJson(LABELS_URL); }catch(e){ console.error('Failed to fetch label list', e); process.exit(1); }

  const out = {};
  for (const label of labels){
    process.stdout.write(`.${label.slice(0,1)}`);
    const normalized = label.toLowerCase();
    const suggestions = {};
    const it = await queryWiktionaryForIt(normalized);
    if (it && it.length) suggestions.it = Array.from(new Set(it.map(s => s.trim())));

    if (Object.keys(suggestions).length){
      out[normalized] = { suggestions, sources: ['wiktionary'] };
    }
    // respectful delay to avoid hammering
    await new Promise(r => setTimeout(r, 220));
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote suggestions to', OUT_FILE);
})().catch(e => { console.error('Fatal', e); process.exit(1); });
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58

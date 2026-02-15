<<<<<<< HEAD
#!/usr/bin/env node
// Script: per ogni etichetta ImageNet prova a recuperare il titolo della pagina italiana su Wikipedia
// Output: dialects_it.json { "label": "titolo_it" }

const fs = require('fs');
const path = require('path');

const SUGGESTIONS_FILE = path.resolve(__dirname, '..', 'dialects_suggestions.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

async function queryWikipediaIt(label){
  const q = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(label)}&prop=langlinks&lllang=it&format=json&origin=*`;
  try{
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.missing) return null;
      if (p.langlinks && p.langlinks.length){
        return p.langlinks[0]['*'];
      }
    }
  }catch(e){ return null; }
  return null;
}

(async ()=>{
  const data = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE,'utf8'));
  const labels = Object.keys(data);
  const out = {};
  console.log('Processing', labels.length, 'labels');
  for (const label of labels){
    process.stdout.write('.');
    const it = await queryWikipediaIt(label);
    if (it) out[label] = it;
    await new Promise(r=>setTimeout(r, 200));
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote', Object.keys(out).length, 'mappings to', OUT_FILE);
})().catch(e=>{ console.error('Fatal', e); process.exit(1); });
=======
#!/usr/bin/env node
// Script: per ogni etichetta ImageNet prova a recuperare il titolo della pagina italiana su Wikipedia
// Output: dialects_it.json { "label": "titolo_it" }

const fs = require('fs');
const path = require('path');

const SUGGESTIONS_FILE = path.resolve(__dirname, '..', 'dialects_suggestions.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it.json');

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return await r.json();
}

async function queryWikipediaIt(label){
  const q = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(label)}&prop=langlinks&lllang=it&format=json&origin=*`;
  try{
    const json = await fetchJson(q);
    const pages = json.query && json.query.pages;
    if (!pages) return null;
    for (const pid of Object.keys(pages)){
      const p = pages[pid];
      if (p.missing) return null;
      if (p.langlinks && p.langlinks.length){
        return p.langlinks[0]['*'];
      }
    }
  }catch(e){ return null; }
  return null;
}

(async ()=>{
  const data = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE,'utf8'));
  const labels = Object.keys(data);
  const out = {};
  console.log('Processing', labels.length, 'labels');
  for (const label of labels){
    process.stdout.write('.');
    const it = await queryWikipediaIt(label);
    if (it) out[label] = it;
    await new Promise(r=>setTimeout(r, 200));
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('\nWrote', Object.keys(out).length, 'mappings to', OUT_FILE);
})().catch(e=>{ console.error('Fatal', e); process.exit(1); });
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58

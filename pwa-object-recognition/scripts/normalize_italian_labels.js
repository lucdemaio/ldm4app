<<<<<<< HEAD
#!/usr/bin/env node
// Normalizza i testi estratti per ricavare un lemma italiano breve e pulito
// Input: dialects_it_clean.json
// Output: dialects_it_lemma.json

const fs = require('fs');
const path = require('path');

const IN_FILE = path.resolve(__dirname, '..', 'dialects_it_clean.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it_lemma.json');

function normalize(s){
  if (!s) return null;
  let t = s.trim();
  // remove leading articles
  t = t.replace(/^((L'|Il|Lo|La|Gli|Le|I|Un|Una|Uno)\s+)/i, '');
  // split on parentheses, dashes, semicolons, ' è ', ' è', ' is ', ' , '
  t = t.split(/\(|–|—|;|,|\s+è\s+|\s+è|\s+is\s+|\.|:|\n/)[0];
  t = t.trim();
  // if contains ' o ' (or), pick the shortest token
  if (t.includes(' o ')){
    const parts = t.split(' o ').map(p=>p.trim());
    parts.sort((a,b)=>a.length-b.length);
    t = parts[0];
  }
  // if contains ' or ', same
  if (t.includes(' or ')){
    const parts = t.split(' or ').map(p=>p.trim());
    parts.sort((a,b)=>a.length-b.length);
    t = parts[0];
  }
  // remove trailing ' the' etc
  t = t.replace(/\b(è|e'|di)\b.*$/i, '').trim();
  // to lowercase
  t = t.toLowerCase();
  // remove accidental 'il' prefix remaining
  t = t.replace(/^il\s+/i,'');
  t = t.replace(/\s+$/,'');
  return t || null;
}

(function(){
  const data = JSON.parse(fs.readFileSync(IN_FILE,'utf8'));
  const out = {};
  for (const [k,v] of Object.entries(data)){
    const n = normalize(v);
    if (n) out[k] = n;
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', Object.keys(out).length, 'lemmas to', OUT_FILE);
})();
=======
#!/usr/bin/env node
// Normalizza i testi estratti per ricavare un lemma italiano breve e pulito
// Input: dialects_it_clean.json
// Output: dialects_it_lemma.json

const fs = require('fs');
const path = require('path');

const IN_FILE = path.resolve(__dirname, '..', 'dialects_it_clean.json');
const OUT_FILE = path.resolve(__dirname, '..', 'dialects_it_lemma.json');

function normalize(s){
  if (!s) return null;
  let t = s.trim();
  // remove leading articles
  t = t.replace(/^((L'|Il|Lo|La|Gli|Le|I|Un|Una|Uno)\s+)/i, '');
  // split on parentheses, dashes, semicolons, ' è ', ' è', ' is ', ' , '
  t = t.split(/\(|–|—|;|,|\s+è\s+|\s+è|\s+is\s+|\.|:|\n/)[0];
  t = t.trim();
  // if contains ' o ' (or), pick the shortest token
  if (t.includes(' o ')){
    const parts = t.split(' o ').map(p=>p.trim());
    parts.sort((a,b)=>a.length-b.length);
    t = parts[0];
  }
  // if contains ' or ', same
  if (t.includes(' or ')){
    const parts = t.split(' or ').map(p=>p.trim());
    parts.sort((a,b)=>a.length-b.length);
    t = parts[0];
  }
  // remove trailing ' the' etc
  t = t.replace(/\b(è|e'|di)\b.*$/i, '').trim();
  // to lowercase
  t = t.toLowerCase();
  // remove accidental 'il' prefix remaining
  t = t.replace(/^il\s+/i,'');
  t = t.replace(/\s+$/,'');
  return t || null;
}

(function(){
  const data = JSON.parse(fs.readFileSync(IN_FILE,'utf8'));
  const out = {};
  for (const [k,v] of Object.entries(data)){
    const n = normalize(v);
    if (n) out[k] = n;
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', Object.keys(out).length, 'lemmas to', OUT_FILE);
})();
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58

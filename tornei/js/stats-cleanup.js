(function(){
    // More robust cleanup using TreeWalker and MutationObserver

    function formatNumber(value){
        if(value === null || value === undefined) return '';
        const n = Number(value);
        if(isNaN(n)) return '';
        return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function extractNumber(text){
        if(!text) return null;
        const m = text.match(/-?\d+[\.,]?\d*/);
        if(!m) return null;
        const normalized = m[0].replace(',', '.');
        const n = parseFloat(normalized);
        return isNaN(n) ? null : n;
    }

    function cleanTextNode(textNode){
        const txtOrig = textNode.nodeValue || '';
        const txt = txtOrig.trim();
        if(!txt) return;

        // If contains ToString(...) then try to salvage number or remove
        if(/ToString\(/i.test(txt)){
            const n = extractNumber(txt);
            const isPercent = txt.includes('%');
            if(n !== null){
                textNode.nodeValue = formatNumber(n) + (isPercent ? '%' : '');
                return;
            }
            // mark problematic node so developer can spot it in the DOM
            try{
                const el = textNode.parentElement;
                if(el && !el.hasAttribute('data-stats-issue')){
                    el.setAttribute('data-stats-issue','ToString');
                    el.style.outline = '2px dashed #d32f2f';
                }
                window.__statsCleanupProblems = window.__statsCleanupProblems || [];
                window.__statsCleanupProblems.push({text: txt, node: textNode});
                console.warn('[stats-cleanup] detected ToString artifact', txt, el);
            }catch(e){}
            // remove captions containing Media/gol/partite or ToString
            if(/\bMedia\b|\bgol\b|\bpartite\b|ToString\(/i.test(txt)){
                textNode.nodeValue = '';
                return;
            }
            // fallback: strip .ToString(...) occurrences and leave remainder
            textNode.nodeValue = txt.replace(/\.ToString\([^)]*\)/gi, '').trim();
            return;
        }

        // If numeric with many decimals -> format
        const n = extractNumber(txt);
        if(n !== null){
            const suffix = txt.replace(/-?\d+[\.,]?\d*/,'').trim();
            textNode.nodeValue = formatNumber(n) + (suffix ? (suffix.startsWith('%') ? suffix : ' ' + suffix) : '');
        }
    }

    function traverseAndClean(root){
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let node = walker.nextNode();
        while(node){
            try{ cleanTextNode(node); }catch(e){}
            node = walker.nextNode();
        }
    }

    function removeCardCaptions(){
        // aggressively remove lines that contain Media: or ToString inside card-like containers
        const candidates = document.querySelectorAll('[class*=card], [class*=Card], .panel, .mud-card, .card');
        candidates.forEach(card=>{
            traverseAndClean(card);
            // remove text nodes under the card that match caption patterns
            const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
            let n = walker.nextNode();
            while(n){
                const t = (n.nodeValue||'').trim();
                if(/\bMedia\b|ToString\(|\bgol\b|\bpartite\b/i.test(t)) n.nodeValue = '';
                n = walker.nextNode();
            }
        });
    }

    function formatStatsTables(){
        const tables = document.querySelectorAll('table');
        tables.forEach(table=>{
            const head = table.querySelector('thead');
            const headerText = (head ? head.textContent : table.textContent) || '';
            if(/Statistiche|Media Gol|Punti|Vittorie|Diff\.? Reti/i.test(headerText)){
                traverseAndClean(table);
            }
        });
    }

    function runAll(){
        try{
            // Clean tables first
            formatStatsTables();
            // Remove card captions
            removeCardCaptions();
            // Fallback full-page pass
            traverseAndClean(document.body);
        }catch(e){ console.warn('[stats-cleanup] error', e); }
    }

    // Observe DOM changes to rerun cleaning when Blazor updates the DOM
    const mo = new MutationObserver((mutations)=>{ runAll(); });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Initial runs after load and periodically for a short time
    document.addEventListener('DOMContentLoaded', runAll);
    let runs = 0; const id = setInterval(()=>{ runs++; runAll(); if(runs>20){ clearInterval(id); } }, 300);

    // run an immediate pass synchronously so early-rendered artifacts are fixed
    try{ runAll(); }catch(e){ console.warn('[stats-cleanup] immediate run error', e); }

    window.__statsCleanup = { run: runAll };
})();
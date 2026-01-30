// startup-checks.js - runtime diagnostics to find missing globals and onclick references
window.addEventListener('load', function(){
    try{
        const missing = new Set();
        // 1) scan DOM onclick attributes
        document.querySelectorAll('[onclick]').forEach(el=>{
            const code = el.getAttribute('onclick') || '';
            // match object names BEFORE a dot (e.g. `VolunteersModule.showTraining()`)
            const reObj = /([A-Za-z_$][\w$]*)\s*\./g;
            let m;
            while((m = reObj.exec(code))){ const id = m[1]; try{ const t = Function('return typeof ' + id)(); if (t === 'undefined') missing.add(id + ' (from onclick: ' + code.slice(0,80) + ')'); }catch(e){} }
            // match global function calls NOT preceded by a dot (e.g. `initApp()`)
            const reGlob = /(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
            while((m = reGlob.exec(code))){ const id = m[1]; try{ const t = Function('return typeof ' + id)(); if (t === 'undefined') missing.add(id + ' (from onclick: ' + code.slice(0,80) + ')'); }catch(e){} }
        });

        // 2) scan inline script tags (skip JSON payloads like #sample-data) for identifiers used with dot (object property usage)
        document.querySelectorAll('script').forEach(s => {
            if (s.src) return; // ignore external scripts
            if (s.type === 'application/json' || s.id === 'sample-data') return; // skip JSON payloads
            const txt = s.textContent || '';
            const re = /([A-Za-z_$][\w$]*)\s*\./g;
            let m; while((m = re.exec(txt))){ const id = m[1];
                // ignore common lowercase properties / short local variables (e.g. protocol, head, l) and reserved builtins
                if (['document','window','console','localStorage','Math','JSON','Array','Object','location','navigator','fetch'].indexOf(id) !== -1) continue;
                if (!(id[0] && id[0] === id[0].toUpperCase()) && !id.endsWith('Module')) continue; // likely not a global module name
                try{ const t = Function('return typeof ' + id)(); if (t === 'undefined') missing.add(id + ' (from inline script)'); }catch(e){} }
        });

        if (missing.size){
            console.warn('Startup checks - missing globals detected:', Array.from(missing));
            const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Attenzione: ' + Array.from(missing).slice(0,3).join(', '); // show a few
        }else{
            console.log('Startup checks - no missing globals found');
            const dbg = document.getElementById('debug-banner'); if (dbg) dbg.textContent = 'Startup checks OK';
        }
    }catch(err){ console.error('Startup checks failed', err); }
});
Checklist di deploy per www.ldm4app.com/tornei

1) Contenuto della cartella da caricare (caricare TUTTI questi file e cartelle nella root /tornei/ del server):
   - index.html
   - web.config
   - manifest.webmanifest
   - favicon.png, icon-192.png, icon-512.png
   - css/ (tutti i file)
   - js/ (tutti i file)
   - _content/ (tutti i file, es. MudBlazor)
   - _framework/ (tutti i file .js, .wasm, .dll, ecc.)
   - wwwroot/ (se presente)

2) Service Worker
   - Il service worker è stato disabilitato nella copia di deploy. Non caricare file service-worker.js se non sai cosa fai.

3) web.config (IIS)
   - Controlla che il file web.config sia presente in /tornei/ e contenga i mapping MIME per .js, .wasm, .css, .webmanifest.
   - Regola di rewrite esclude _framework, css, js, _content, favicon, manifest.webmanifest, sample-data.

4) Verifiche post-deploy
   - Esegui lo script PowerShell verify-deploy.ps1:
       .\verify-deploy.ps1 -BaseUrl 'https://www.ldm4app.com/tornei'
   - Controlla che tutti gli endpoint rispondano 200 OK e abbiano il Content-Type corretto (application/javascript, application/wasm, text/css, application/manifest+json).

5) Cose a cui prestare attenzione
   - Se il server restituisce file .br o .gz senza header Content-Encoding corretti, il browser potrebbe rifiutarli. Configura il server per servire correttamente la compressione.
   - Controlla i log del server per eventuali 404/403.

6) Pulizia cache
   - Dopo il deploy, chiedi agli utenti (o tu stesso) di provare in modalità incognito. Se prima era registrato un service worker, potrebbe essere necessario rimuoverlo dal browser (Application -> Service Workers -> Unregister).

Se vuoi, posso preparare anche un file ZIP pronto per l'upload o uno script FTP/PowerShell per caricare automaticamente la cartella sul tuo server.

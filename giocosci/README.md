Coppa del Mondo 2026 - Istruzioni locali

Per motivi di sicurezza (CORS), il browser blocca le immagini caricate tramite file://. Per far funzionare correttamente il gioco 3D (caricamento sky, texture della neve, alberi), serve avviare un semplice server HTTP locale nella cartella del progetto.

Opzioni rapide:

1) Python 3 (raccomandato, semplice):

   - Apri un terminale nella cartella del progetto e esegui:

     py -m http.server 8000

     oppure

     python -m http.server 8000

   - Apri il browser su: http://localhost:8000

2) Node.js (se hai npm):

   - Installa il pacchetto http-server (opzionale):

     npm i -g http-server

   - Poi avvia:

     npx http-server -p 8000

   - Apri il browser su: http://localhost:8000

3) VS Code: usa l'estensione Live Server — premi "Go Live" nella barra in basso.

Se non vuoi o non puoi installare nulla, puoi comunque aprire il progetto via file:// ma alcune immagini non verranno caricate e il gioco userà i fallback (meno dettagli grafici).

Se vuoi, esegui lo script `start-server.bat` (Windows) fornitо in questo progetto: esegui un doppio click o apri PowerShell nella cartella e lancia `./start-server.bat`.

Nota: ho aggiunto dei **file placeholder** in `assets/` (`sky.svg`, `snow_texture.svg`, `snow_normal.svg`) che vengono usati automaticamente se le texture JPG/PNG non sono presenti. Questi sono utili per avviare il gioco senza asset esterni.

Aggiornamento: il progetto è stato migrato per usare **Three.js come ES Modules**. Il file `game3d.js` ora viene caricato come `type="module"` e importa Three.js dai moduli ufficiali (es. `three.module.js` e `examples/jsm/pmrem/PMREMGenerator.js`). Se devi servire il progetto su una CDN o includerlo in un'app più grande, questa modalità è raccomandata per compatibilità futura con Three r150+. 

Se vuoi che configuri un `package.json` o aggiunga comandi npm per sviluppo automatico, dimmelo pure.
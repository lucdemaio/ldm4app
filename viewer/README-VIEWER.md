Test locale del Viewer

1) Apri PowerShell o CMD e vai nella cartella del viewer:
   cd "C:\Users\Luca\Desktop\sitoldm4app\viewer"

2) Avvia il server locale (scegli uno dei due):
   - Con Node (se hai Node.js):
     npx http-server -p 8000
   - Con Python (se hai Python):
     python -m http.server 8000

3) Apri il browser all'indirizzo corretto (dipende da dove hai avviato il server):
   - Se hai avviato il server dalla cartella root del progetto (sitoldm4app):
     http://localhost:8000/viewer/index-viewer.html
   - Se hai avviato il server dentro la cartella viewer:
     http://localhost:8000/index-viewer.html

Note e risoluzione problemi
- Se vedi messaggi di errore CORS o "Service Worker non registrato" significa che stai aprendo il file via file://; usa il server come sopra.
- Se il browser non raggiunge il sito, controlla che il firewall non blocchi il programma (http-server o python). Puoi provare anche http://127.0.0.1:8000.
- Se hai bisogno, esegui il file serve-viewer.bat nella cartella viewer per tentare l'avvio automatico.

Se preferisci, posso aggiungere un comando che apre automaticamente il browser dopo l'avvio del server.
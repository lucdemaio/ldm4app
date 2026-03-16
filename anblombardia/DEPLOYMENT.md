# 📦 DEPLOYMENT - Guida al Caricamento su Repository e Server

## 🎯 Riepilogo File Modificati e Creati

### ✅ File NUOVI Creati (Elenco Completo)

```
1. index_new_2026.html
   └─ Nuova homepage moderna con design 2026
   └─ Contiene: HTML5, Meta tags SEO, referenze ai CSS e JS
   └─ Mantiene: Tutti i link originali, struttura navigazione

2. css/modern2026.css
   └─ Stili CSS moderni con effetti dinamici
   └─ Contiene: Gradients, animazioni, responsive design
   └─ Dimensione: ~15 KB (compresso: ~4 KB)

3. js/modern2026.js
   └─ JavaScript per interattività e effetti
   └─ Contiene: Particelle animate, parallax, dropdown
   └─ Dimensione: ~12 KB (compresso: ~3 KB)

4. SETUP_2026.html
   └─ Guida interattiva di setup
   └─ Per referenza durante deployment
   └─ Non critico per il funzionamento

5. README_2026.md
   └─ Documentazione completa del progetto
   └─ Linee guida per manutenzione futura
   └─ Non critico per il funzionamento

6. DEPLOYMENT.md
   └─ Questo file
   └─ Istruzioni per caricamento
```

---

## 🗂️ Struttura Directory Finale

```
www.anblombardia.it/
│
├── index.html                    ← VECCHIO (Originale)
├── index_new_2026.html          ← ⭐ NUOVO - PRINCIPALE
├── index_old_backup.html        ← BACKUP (opzionale)
│
├── p1.html                       ← Mantenuto (dipendenza)
├── Sezioni.html                  ← Mantenuto (dipendenza)
├── Fanfare_calendario.html       ← Mantenuto
├── storia.html                   ← Mantenuto
│
├── css/
│   ├── modern2026.css           ← ⭐ NUOVO - CRITICO
│   ├── StyleRegione.css         ← Originale (mantenuto)
│   ├── w3.css                   ← Framework (mantenuto)
│   └── ... altri CSS
│
├── js/
│   ├── modern2026.js            ← ⭐ NUOVO - CRITICO
│   └── ... altri JS
│
├── images/                       ← Tutte immagini (mantenute)
├── province/                     ← PDF (mantenuti)
├── doc/                          ← Documenti (mantenuti)
├── views/                        ← Mantenuto
├── vendor/                       ← Mantenuto
│
├── SETUP_2026.html              ← Guida (opzionale)
├── README_2026.md               ← Documentazione (opzionale)
└── DEPLOYMENT.md                ← Questo file (opzionale)
```

---

## 🚀 Passo 1: Preparazione Locale (Prima del Deploy)

### 1.1 Verifica File Nuovi

```bash
# Naviga alla cartella del progetto
cd /path/to/www.anblombardia.it

# Verifica file critici
ls -lh index_new_2026.html
ls -lh css/modern2026.css
ls -lh js/modern2026.js

# Output atteso:
# -rw-r--r--  1 user  staff   8.5K  2026-03-16  index_new_2026.html
# -rw-r--r--  1 user  staff  15.2K  2026-03-16  css/modern2026.css
# -rw-r--r--  1 user  staff  12.1K  2026-03-16  js/modern2026.js
```

### 1.2 Test Locale nel Browser

```bash
# Apri il file locale nel browser
# Windows:
start index_new_2026.html

# Mac:
open index_new_2026.html

# Linux:
firefox index_new_2026.html

# Oppure via Python:
python -m http.server 8000
# Poi apri: http://localhost:8000/index_new_2026.html
```

### 1.3 Checklist Verifica

- [ ] Header carica correttamente (con loghi)
- [ ] Menu navigation visibile e funzionante
- [ ] Dropdown menu funziona al hover
- [ ] Particelle animate nel background
- [ ] Responsive funziona (prova F12 + ridimensiona)
- [ ] iFrame con p1.html carica
- [ ] Footer visibile
- [ ] Scroll parallax funziona (scroll la pagina)
- [ ] Links esterni aprono nei tab (es. Province PDF)
- [ ] Colori gradients visibili

---

## 📦 Passo 2: Preparazione Repository Git

### 2.1 Setup Git (Se non fatto)

```bash
# Naviga alla cartella
cd /path/to/www.anblombardia.it

# Inizializza repository (se nuovo)
git init

# Aggiungi remote (es. GitHub)
git remote add origin https://github.com/tuonome/www.anblombardia.it.git

# Oppure per GitLab:
git remote add origin https://gitlab.com/tuonome/www.anblombardia.it.git
```

### 2.2 Crea .gitignore (Consigliato)

```bash
# Crea file .gitignore
cat > .gitignore << 'EOF'
# System files
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# Editor
.vscode/
.idea/
*.sublime-workspace

# Backup
*.backup
*_old.html
*.bak

# Logs
*.log
node_modules/
npm-debug.log

# Compilati
*.min.css.map
*.min.js.map

# Temporary
temp/
tmp/
.temp/
EOF
```

### 2.3 Commit File Nuovi

```bash
# Aggiungi file critici
git add index_new_2026.html
git add css/modern2026.css
git add js/modern2026.js

# Aggiungi documentazione
git add README_2026.md
git add SETUP_2026.html
git add DEPLOYMENT.md

# Verifica lo staging
git status

# Commit
git commit -m "🎉 Modernizzazione 2026 - Nuovo design dinamico

- Nuovo layout moderno con effetti 2026
- CSS responsive con animazioni spettacolari  
- JavaScript per interattività e dinamica
- Mantenuti tutti link e immagini originali
- Performance ottimizzate
- Backward compatible"

# Push verso repository
git push -u origin main
# o: git push -u origin master
```

---

## 🌐 Passo 3: Deploy su Server Aruba (Hosting Web)

### 3.1 Connessione FTP

```bash
# Usa client FTP (FileZilla, WinSCP, Cyberduck)
# Oppure da terminale:

# macOS/Linux - sftp
sftp tuoutente@ftp.tuodominio.it

# Comandi SFTP:
cd public_html/
put index_new_2026.html
put css/modern2026.css
put js/modern2026.js
quit

# Windows - PowerShell
$session = New-PSSession -ComputerName ftp.tuodominio.it -Credential $cred
```

### 3.2 Backup Vecchio Sito (IMPORTANTE!)

```bash
# Prima di tutto, fai backup del vecchio index.html
cd /public_html/

# Rinomina vecchio sito come backup
mv index.html index_backup_2026_03_16.html

# Oppure con FTP client, scarica il vecchio index.html
```

### 3.3 Upload File Nuovi

#### Via FileZilla:
1. Apri FileZilla → File → Site Manager
2. Nuovo sito → Inserisci dati Aruba
   - **Host**: ftp.tuodominio.it
   - **Username**: tuoutente@tuodominio.it
   - **Password**: tua_password
   - **Porta**: 21 (o 22 se SFTP)
3. Connetti
4. Naviga a cartella pubblica_html/
5. Trascinaci i 3 file:
   - `index_new_2026.html`
   - `css/modern2026.css`
   - `js/modern2026.js`

#### Via SCP (Terminale):
```bash
# Linux/macOS
scp index_new_2026.html user@server:/path/to/public_html/
scp css/modern2026.css user@server:/path/to/public_html/css/
scp js/modern2026.js user@server:/path/to/public_html/js/

# Windows PowerShell
scp -r .\index_new_2026.html user@server:/path/to/public_html/
scp -r .\css\modern2026.css user@server:/path/to/public_html/css/
scp -r .\js\modern2026.js user@server:/path/to/public_html/js/
```

### 3.4 Verifica Upload

```bash
# Connettiti via SSH/Telnet
ssh user@tuodominio.it

# Verifica file
ls -la public_html/index_new_2026.html
ls -la public_html/css/modern2026.css
ls -la public_html/js/modern2026.js

# Verifica permessi
chmod 644 public_html/index_new_2026.html
chmod 644 public_html/css/modern2026.css
chmod 644 public_html/js/modern2026.js
```

---

## ✅ Passo 4: Test del Nuovo Sito Live

### 4.1 Accesso Tramite Browser

```
Vecchio sito: www.tuodominio.it/index.html
Nuovo sito: www.tuodominio.it/index_new_2026.html
```

### 4.2 Checklist Test Live

- [ ] Sito carica completamente
- [ ] Logica visualizzati e centrati
- [ ] Header e footer allineati
- [ ] Menu navigation funzionante
- [ ] Dropdown menu responsive
- [ ] Particelle animate visibili
- [ ] Gradients colori corretti
- [ ] Immagini caricate correttamente
- [ ] iFrame p1.html funziona
- [ ] Scroll parallax opera
- [ ] Links funzionano:
  - [ ] Province PDF
  - [ ] Reggimenti
  - [ ] Fanfare
  - [ ] WhatsApp
  - [ ] Email
- [ ] Responsive su mobile (apri da cellulare)
- [ ] Responsive su tablet
- [ ] Caricamento veloce

### 4.3 Page Speed Test

```
Vai su: https://pagespeed.web.dev/

Inserisci URL: www.tuodominio.it/index_new_2026.html

Target Performance Score: > 85
```

---

## 🔀 Passo 5: Attivazione Nuovo Sito come Predefinito

### Opzione A: Rinomina (Consigliato)

```bash
# Via SSH
cd public_html/

# Rinomina vecchio
mv index.html index_old_backup_$(date +%Y%m%d_%H%M%S).html

# Rinomina nuovo come predefinito
mv index_new_2026.html index.html

# Verifica
ls -la index.html
```

### Opzione B: Redirect nel Vecchio Index

```bash
# Modifica vecchio index.html per redirect
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="refresh" content="0;url=index_new_2026.html" />
<title>ANB Regione Lombardia - 2026</title>
</head>
<body>
<p>Reindirizzamento al nuovo sito...</p>
</body>
</html>
EOF
```

### Opzione C: Mantieni Entrambi

```bash
# Tutte e due le versioni disponibili
- www.tuodominio.it/index.html (vecchio)
- www.tuodominio.it/index_new_2026.html (nuovo)

# Configura a preferenza attraverso:
# - Link dal sito vecchio al nuovo
# - Annuncio in home del vecchio sito
```

---

## 📊 Passo 6: Monitoraggio Post-Deploy

### 6.1 Verifica Errori Browser

```javascript
// Apri Console Browser (F12)
// Cercali errori rossi/gialli
// Accesso via: https://www.tuodominio.it/index_new_2026.html

// Console dovrebbe mostrare:
// ✓ ANB REGIONE LOMBARDIA - 2026
// ✓ Versione Moderna con Effetti Dinamici
```

### 6.2 Monitoraggio Analytics

```bash
# Aggiungi a Google Analytics (opzionale)
# Nel file index_new_2026.html, aggiungi prima di </head>:

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 6.3 Monitoraggio Uptime

```bash
# Usa servizi di monitoraggio:
# - UptimeRobot.com
# - Statuscake.com
# - Pingdom.com
# - Gratis: https://www.tuodominio.it/index_new_2026.html
```

---

## 🔄 Passo 7: Backup e Versionamento

### 7.1 Backup Completo Locale

```bash
# Crea zip di backup completo
zip -r backup_2026_03_16.zip .

# Salva in cloud (Dropbox, Drive, etc.)
# o in un repository backup separato
```

### 7.2 Versionamento Git Tags

```bash
# Crea tag per questa versione
git tag -a v2026.1 -m "Modernizzazione 2026 - Deploy Live"

# Visualizza tags
git tag -l

# Push tags
git push origin v2026.1
```

---

## 📋 File da Caricare in Repository - Checklist Finale

### 🔴 CRITICI (Necessari per funzionamento)
```
☑ index_new_2026.html
☑ css/modern2026.css
☑ js/modern2026.js
```

### 🟠 DIPENDENZE (Richiesti dal nuovo sito)
```
☑ p1.html
☑ Sezioni.html
☑ images/ (cartella intera)
☑ province/ (cartella intera)
☑ doc/ (cartella intera)
☑ font/ (se presente)
☑ views/ (se usato)
```

### 🟡 OPTIONAL (Per compatibilità/riferimento)
```
☑ index.html (vecchio - backup)
☑ css/ (tutti gli altri CSS)
☑ js/ (tutti gli altri JS)
☑ SETUP_2026.html (guida)
☑ README_2026.md (documentazione)
☑ DEPLOYMENT.md (questo file)
```

### ⚫ NON CARICARE
```
✗ index_old_backup_*.html
✗ *.map files (sourcemaps)
✗ node_modules/
✗ .DS_Store, Thumbs.db
✗ .git/ (se usi Git)
✗ Temp files
```

---

## 🎯 Comandi Post-Deploy

### Verifica Integrità File

```bash
# SSH nel server
ssh user@tuodominio.it

# Verifica file critici esistono
test -f public_html/index_new_2026.html && echo "✓ HTML OK" || echo "✗ HTML Missing"
test -f public_html/css/modern2026.css && echo "✓ CSS OK" || echo "✗ CSS Missing"
test -f public_html/js/modern2026.js && echo "✓ JS OK" || echo "✗ JS Missing"

# Verifica permessi (644 per file)
stat -c "%a" public_html/index_new_2026.html

# Verifica dimensioni
du -h public_html/index_new_2026.html
du -h public_html/css/modern2026.css
du -h public_html/js/modern2026.js
```

### Clear Cache Server

```bash
# Se usi Cloudflare
# Da dashboard: Caching > Purge Cache > Purge Everything

# Se usi Apache
sudo service apache2 reload

# Se usi Nginx
sudo service nginx reload
```

---

## 🆘 Troubleshooting Post-Deploy

### Problema: "404 Not Found"
```
Soluzione:
1. Verifica file caricato via FTP
2. Controlla path nei link CSS/JS
3. Verifica permessi file (644)
4. Pulisci cache browser
```

### Problema: "CSS non carica"
```
Soluzione:
1. Verifica: css/modern2026.css esiste
2. Controlla path in index_new_2026.html
3. Verifica CORS se su CDN
4. Apri DevTools > Network > cercai modern2026.css
```

### Problema: "JavaScript non funziona"
```
Soluzione:
1. Verifica: js/modern2026.js caricato
2. Apri Console (F12) cercai errori
3. Controlla path dello script
4. Verifica permessi file (644)
```

### Problema: "Immagini non visibili"
```
Soluzione:
1. Verifica cartella images/ presente
2. Controlla path negli HTML
3. Verifica permessi (755 per dir, 644 per file)
4. Prova a visualizzare URL immagine direttamente
```

---

## 📞 Contatti Supporto Hosting

### Aruba Support
- **Email**: support@aruba.it
- **Telefono**: +39 02 3000 9000
- **Live Chat**: https://www.aruba.it/support

### Procedure Comuni Aruba
1. Accedi a **Pannello di Controllo** (http://gestionedomini.aruba.it)
2. Vai a **Gestione Hosting** → **Spazio Web**
3. Seleziona il tuo dominio
4. Usa **Gestione File** per FTP web-based

---

## ✨ Risultato Finale

Dopo aver completato tutti questi step:

✅ **Sito moderno 2026 live**  
✅ **Design accattivante con effetti dinamici**  
✅ **Tutti i link e immagini funzionanti**  
✅ **Performance ottimizzate**  
✅ **Responsive su tutti i device**  
✅ **Backup creati**  
✅ **Versionato su Git**  
✅ **Monitorato e funzionante**  

## 🎉 Congratulazioni!

Il nuovo sito ANB Regione Lombardia 2026 è **LIVE** e funzionante!

---

**Data Deployment**: 16 Marzo 2026  
**Versione**: 2026.1  
**Status**: ✓ Production Ready  

*Per domande: controlla README_2026.md*

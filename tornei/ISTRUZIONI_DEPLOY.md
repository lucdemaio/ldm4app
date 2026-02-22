# 📦 Istruzioni per il Deploy del Gestionale Tornei

## 🔨 PASSO 1: Compilare l'Applicazione

Apri il terminale nella cartella del progetto (`C:\Users\lucde\Desktop\GestionaleTorneiWeb`) ed esegui:

```bash
dotnet publish -c Release
```

Aspetta che la compilazione finisca (potrebbero volerci 1-2 minuti).

---

## 📁 PASSO 2: Identificare i File da Caricare

Dopo la compilazione, i file pronti per il deploy si trovano in:

```
bin\Release\net8.0\publish\wwwroot\
```

**⚠️ IMPORTANTE: Devi caricare SOLO il contenuto della cartella `wwwroot`, non l'intera cartella!**

---

## 🌐 PASSO 3: Caricare Online

### Opzione A: **Netlify** (CONSIGLIATO - Gratis e Facile)

1. Vai su [netlify.com](https://www.netlify.com)
2. Registrati/Accedi
3. Trascina la cartella `bin\Release\net8.0\publish\wwwroot\` nell'area "Drop"
4. Fatto! Il sito sarà online in pochi secondi

**OPPURE** se usi GitHub:
1. Carica il progetto su GitHub
2. Connetti il repository a Netlify
3. Netlify userà il file `netlify.toml` per compilare automaticamente

---

### Opzione B: **Azure Static Web Apps** (Gratis con account Microsoft)

1. Vai su [portal.azure.com](https://portal.azure.com)
2. Crea una nuova "Static Web App"
3. Collega il tuo repository GitHub OPPURE carica manualmente
4. Azure userà il file `staticwebapp.config.json` per la configurazione

---

### Opzione C: **GitHub Pages** (Gratis)

1. Carica il progetto su GitHub
2. Vai nelle impostazioni del repository → Pages
3. Scegli "GitHub Actions" come sorgente
4. Il workflow in `.github/workflows/deploy.yml` farà tutto automaticamente

**NOTA**: Dovrai modificare la riga `Change base-tag` nel workflow con il nome del tuo repository.

---

### Opzione D: **Vercel** (Gratis)

1. Vai su [vercel.com](https://vercel.com)
2. Importa il progetto da GitHub o carica manualmente
3. Configura:
   - Build Command: `dotnet publish -c Release`
   - Output Directory: `bin/Release/net8.0/publish/wwwroot`

---

### Opzione E: **Server IIS** (Windows Server)

1. Copia il contenuto di `bin\Release\net8.0\publish\wwwroot\` sul server
2. Il file `web.config` è già pronto
3. Crea un nuovo sito in IIS puntando alla cartella
4. Assicurati che i MIME types siano configurati (il web.config lo fa automaticamente)

---

### Opzione F: **Hosting Tradizionale** (cPanel, FTP, etc.)

1. Carica il contenuto di `bin\Release\net8.0\publish\wwwroot\` via FTP
2. Assicurati che il server supporti i file .wasm
3. Potrebbe essere necessario aggiungere un file `.htaccess` per Apache:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

AddType application/wasm .wasm
AddType application/octet-stream .dll
```

---

## ✅ Cosa Devi Caricare (Riepilogo)

Dopo aver eseguito `dotnet publish -c Release`, carica **tutto il contenuto** di:

```
bin\Release\net8.0\publish\wwwroot\
```

Che include:
- ✅ `index.html`
- ✅ `_framework/` (cartella con tutti i file .dll, .wasm, .json)
- ✅ `css/` (cartella con gli stili)
- ✅ `wwwroot/` (eventuali altri file statici)
- ✅ `manifest.webmanifest`
- ✅ `service-worker.js`
- ✅ Tutti gli altri file nella cartella

---

## 🔍 Verifica che Funzioni

Una volta caricato, apri il sito nel browser:
- Dovresti vedere l'applicazione Blazor caricarsi
- Controlla la console del browser (F12) per eventuali errori
- Se vedi errori 404 sui file della cartella `_framework`, verifica:
  - Che hai caricato TUTTA la cartella `_framework`
  - Che il server supporti i MIME types corretti

---

## 🆘 Problemi Comuni

### "Loading..." infinito
- Controlla la console del browser (F12)
- Probabilmente mancano file della cartella `_framework`

### Errore 404 sui file .wasm o .dll
- Il server non ha i MIME types configurati
- Usa i file di configurazione forniti (web.config, .htaccess, etc.)

### Pagina bianca
- Verifica che `index.html` sia nella root del sito
- Controlla che il path base sia corretto (dovrebbe essere `/`)

---

## 💡 Consiglio Personale

Per la massima semplicità, usa **Netlify**:
1. Esegui `dotnet publish -c Release`
2. Trascina `bin\Release\net8.0\publish\wwwroot\` su Netlify
3. Fatto!

È gratis, veloce e gestisce automaticamente tutto (HTTPS, CDN, ecc.).

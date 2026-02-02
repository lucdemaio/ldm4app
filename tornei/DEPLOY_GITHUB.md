# 🚀 Deploy su GitHub Pages

## Passo 1: Crea la Repository su GitHub

1. Vai su [github.com](https://github.com) e accedi
2. Clicca su **"New repository"** (il pulsante verde con il +)
3. Compila:
   - **Nome repository**: `GestionaleTorneiWeb` (o quello che preferisci)
   - **Descrizione**: "Gestionale per tornei sportivi - Blazor WebAssembly"
   - **Visibilità**: Scegli Public o Private (entrambi funzionano con GitHub Pages)
4. **NON** selezionare "Add a README file" (ce l'hai già)
5. Clicca su **"Create repository"**

---

## Passo 2: Carica il Codice su GitHub

Apri il terminale nella cartella del progetto (`C:\Users\lucde\Desktop\GestionaleTorneiWeb`) ed esegui questi comandi:

```bash
# Inizializza Git (se non l'hai già fatto)
git init

# Aggiungi tutti i file
git add .

# Crea il primo commit
git commit -m "Initial commit - Gestionale Tornei Web"

# Collega alla repository GitHub (sostituisci TUO-USERNAME con il tuo username GitHub)
git remote add origin https://github.com/TUO-USERNAME/GestionaleTorneiWeb.git

# Carica il codice
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANTE**: Sostituisci `TUO-USERNAME` con il tuo vero username GitHub!

---

## Passo 3: Attiva GitHub Pages

1. Vai sulla tua repository su GitHub
2. Clicca su **"Settings"** (in alto a destra)
3. Nel menu a sinistra, clicca su **"Pages"**
4. In **"Source"**, seleziona **"GitHub Actions"**
5. Fatto! Il workflow è già configurato

---

## Passo 4: Modifica il Workflow (IMPORTANTE!)

Prima di fare il push, devi modificare il file `.github/workflows/deploy.yml`:

**Trova questa riga:**
```yaml
run: sed -i 's/<base href="\/" \/>/<base href="\/GestionaleTorneiWeb\/" \/>/g' release/wwwroot/index.html
```

**Sostituisci `GestionaleTorneiWeb` con il nome della TUA repository.**

Se la tua repository si chiama diversamente, cambia anche quello!

---

## Passo 5: Attendi il Deploy Automatico

1. Dopo il push, vai sulla tab **"Actions"** della repository
2. Vedrai il workflow in esecuzione (pallino giallo 🟡)
3. Dopo 2-3 minuti, diventerà verde ✅
4. Il sito sarà online su:
   ```
   https://TUO-USERNAME.github.io/GestionaleTorneiWeb/
   ```

---

## 🔧 Comandi Git Utili per il Futuro

Quando modifichi il codice:

```bash
# Verifica i file modificati
git status

# Aggiungi le modifiche
git add .

# Crea un commit
git commit -m "Descrizione delle modifiche"

# Carica su GitHub (il deploy si attiverà automaticamente)
git push
```

---

## ❓ Problemi Comuni

### "Permission denied" quando fai push
- Devi autenticarti con GitHub
- Usa un Personal Access Token invece della password
- Oppure usa GitHub Desktop per un'interfaccia grafica

### Il sito mostra una pagina bianca
- Controlla che il `base href` nel workflow sia corretto
- Verifica nella console del browser (F12) eventuali errori

### Il workflow fallisce
- Vai su Actions → Clicca sul workflow fallito → Leggi i log
- Probabilmente è un problema con .NET SDK

---

## 🎯 URL Finale del Sito

Dopo il deploy, il tuo sito sarà accessibile su:

```
https://TUO-USERNAME.github.io/NOME-REPOSITORY/
```

Esempio:
```
https://lucde.github.io/GestionaleTorneiWeb/
```

---

## 💡 Vantaggi di GitHub Pages

✅ **Gratis** e veloce  
✅ **Deploy automatico** ad ogni push  
✅ **HTTPS** incluso  
✅ **CDN** globale  
✅ Perfetto per app Blazor WebAssembly

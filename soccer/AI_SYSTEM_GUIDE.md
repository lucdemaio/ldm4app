# 🤖 AI Action Executor System - Manuale Completo

## Overview
Il sistema di **AI Action Executor** trasforma l'assistente IA da un semplice chatbot che "spiega come fare" a un vero assistente **interattivo che modifica il gestionale in tempo reale**.

---

## 🎯 Come Funziona

### 1. **Flusso di Esecuzione**

```
Utente digita comando
         ↓
Sistema Speech-to-Text (italiano)
         ↓
Groq API elabora con system prompt speciale
         ↓
IA genera risposta JSON + messaggio
         ↓
`extractCommandFromResponse()` estrae il JSON
         ↓
`AICommandExecutor.executeCommand()` esegue l'azione
         ↓
Dati salvati in appState (LocalStorage)
         ↓
Messaggio di conferma all'utente
```

### 2. **Comandi Supportati**

#### ✅ Aggiungere Atleta
```javascript
{
  "action": "addAthlete",
  "data": {
    "firstName": "Marco",
    "lastName": "Rossi",
    "role": "Attaccante",
    "birthDate": "2005-03-15",
    "teamId": "id_squadra_opzionale",
    "medicalExpiry": "2026-02-22",
    "active": true,
    "notes": "Note facoltative"
  }
}
```

**Comandi equivalenti:**
- "Aggiungi atleta Marco Rossi come attaccante"
- "Crea un nuovo giocatore: Marco Rossi, ruolo attaccante"
- "Registra Marco Rossi nel gestionale come attaccante"

---

#### ✅ Modificare Atleta
```javascript
{
  "action": "updateAthlete",
  "athleteId": "id_atleta",
  "data": {
    "role": "Difensore",
    "active": false,
    "notes": "Infortunato"
  }
}
```

**Comandi equivalenti:**
- "Modifica Marco Rossi da attaccante a difensore"
- "Marco Rossi è infortunato"
- "Cambia il ruolo di Marco Rossi"

---

#### ✅ Eliminare Atleta
```javascript
{
  "action": "deleteAthlete",
  "athleteId": "id_atleta"
}
```

**Comandi equivalenti:**
- "Elimina Marco Rossi dal gestionale"
- "Rimuovi Marco Rossi"
- "Cancella Marco Rossi"

---

#### ✅ Creare Squadra
```javascript
{
  "action": "addTeam",
  "data": {
    "name": "FC Milano",
    "season": "2025/2026",
    "category": "Allievi",
    "primaryColor": "#1e40af",
    "secondaryColor": "#ffffff"
  }
}
```

**Comandi equivalenti:**
- "Crea una squadra FC Milano stagione 2025/2026 categoria Allievi"
- "Aggiungi la squadra FC Milano"

---

#### ✅ Modificare Squadra
```javascript
{
  "action": "updateTeam",
  "teamId": "id_squadra",
  "data": {
    "category": "Junior"
  }
}
```

---

#### ✅ Ricerca Atleti
```javascript
{
  "action": "search",
  "query": "Marco Rossi"
}
```

**Comandi equivalenti:**
- "Trovami Marco Rossi"
- "Mostrami tutti gli atleti di nome Marco"
- "Cerca Rossi nel gestionale"

---

#### ✅ Listare Atleti o Squadre
```javascript
{
  "action": "list",
  "target": "athletes"  // o "teams"
}
```

**Comandi equivalenti:**
- "Mostrami tutti gli atleti"
- "Fammi una lista di tutte le squadre"
- "Quanti atleti ho nel gestionale?"

---

## 🔧 System Prompt Nuovo

L'IA riceve un prompt che le dice di:

1. **eseguire l'azione direttamente** invece di spiegare come fare
2. **Generare JSON in formato preciso** per ogni comando
3. **Fornire un messaggio in italiano** dopo il comando

### Il prompt dice:
```
"Quando l'utente chiede di aggiungere/modificare/eliminare qualcosa, 
ESEGUI l'azione generando un comando JSON... 
Se l'azione è completata, continua normalmente.
Rispondi SEMPRE in italiano e ESEGUI l'azione. 
Non spiegare come fare - FALLO DIRETTAMENTE."
```

---

## 📝 Utilizzo Pratico

### Scenario 1: Aggiungere un Atleta
```
👤 Tu: Aggiungi atleta Marco Rossi come attaccante

🤖 IA: {"action": "addAthlete", "data": {...}}
✅ Atleta "Marco Rossi" aggiunto con successo (ID: 1708...)
```

### Scenario 2: Modificare Ruolo
```
👤 Tu: Marco Rossi ora è difensore

🤖 IA: {"action": "updateAthlete", "athleteId": "...", "data": {"role": "Difensore"}}
✅ Atleta "Marco Rossi" modificato
```

### Scenario 3: Ricerca
```
👤 Tu: Quanti atleti abbiamo?

🤖 IA: {"action": "list", "target": "athletes"}
✅ Lista atleti (totale: 5)
- Marco Rossi (Attaccante)
- Luigi Bianchi (Difensore)
- ...
```

---

## 🛠️ Funzioni Disponibili

### `AICommandExecutor.addAthlete(data)`
Aggiunge un nuovo atleta al gestionale
- **Parametri**: firstName, lastName, birthDate, role, teamId, medicalExpiry, active, notes
- **Return**: `{ success: true, data: newAthlete, message: "..." }`

### `AICommandExecutor.updateAthlete(athleteId, data)`
Modifica un atleta esistente
- **Parametri**: athleteId, data (con i campi da modificare)
- **Return**: `{ success: true, data: updated, message: "..." }`

### `AICommandExecutor.deleteAthlete(athleteId)`
Elimina un atleta
- **Parametri**: athleteId
- **Return**: `{ success: true, data: deleted, message: "..." }`

### `AICommandExecutor.addTeam(data)`
Crea una nuova squadra
- **Parametri**: name, season, category, primaryColor, secondaryColor
- **Return**: `{ success: true, data: newTeam, message: "..." }`

### `AICommandExecutor.searchAthletes(query)`
Ricerca atleti per nome
- **Parametri**: query (stringa di ricerca)
- **Return**: `{ success: true, data: results[], message: "..." }`

### `AICommandExecutor.getAthletesList(teamId)`
Ottiene lista di tutti gli atleti (opzionalmente filtrati per squadra)
- **Parametri**: teamId (opzionale)
- **Return**: `{ success: true, data: athletes[], message: "..." }`

### `AICommandExecutor.getTeamsList()`
Ottiene lista di tutte le squadre
- **Return**: `{ success: true, data: teams[], message: "..." }`

### `AICommandExecutor.executeCommand(cmd)`
Funzione generica che esegue qualsiasi comando
- **Parametri**: cmd (oggetto con action e dati)
- **Return**: Risultato dell'esecuzione

---

## 💾 Persistenza Dati

Tutti i dati modificati dall'IA vengono:
1. **Salvati in appState** (stato centralizzato dell'app)
2. **Persistiti in LocalStorage** automaticamente via `saveState()`
3. **Sincronizzati con tutte le sezioni dell'app** (dashboard, atleti, squadre)

### Verifica che i dati siano salvati:
```javascript
// Apri console browser (F12)
console.log(appState.state.athletes)  // Mostra tutti gli atleti
localStorage.getItem('gestionale-state')  // Mostra dati salvati
```

---

## ⚡ Voice Command

Premi il bottone **🎤** per registrare un comando vocale:
1. Il sistema ascolta in **italiano**
2. Trascrive automaticamente
3. Invia il testo all'IA
4. Esegue il comando

### Comandi Vocali Supportati:
- "Aggiungi atleta Marco Rossi come attaccante"
- "Modificami Marco Rossi a difensore"
- "Mostrami tutti gli atleti"
- "Quante squadre ho?"

---

## 🚨 Gestione Errori

Se c'è un errore, il sistema mostra:
```
❌ Errore: [descrizione dettagliata]
```

Possibili errori:
- **appState non disponibile** → Ricarica la pagina
- **Chiave API non configurata** → Salva la chiave Groq prima
- **Atleta non trovato** → Controlla l'ID o il nome
- **Dati mancanti** → Fornisci informazioni complete

---

## 🔐 Privacy e Sicurezza

- **Nessun dato caricato online**: tutto rimane nel dispositivo
- **Chiave API Groq**: salvata solo in localStorage locale
- **Dati gestionale**: sincronizzati esclusivamente lato client
- **LocalStorage**: cifrato dal browser (HTTPS)

---

## 📱 Compatibilità

| Caratteristica | Desktop | Mobile |
|---|---|---|
| Chat IA | ✅ | ✅ |
| Voice Commands | ✅ | ✅* |
| Aggiunta Atleti | ✅ | ✅ |
| Modifica Dati | ✅ | ✅ |
| LocalStorage | ✅ | ✅ |

*Voice commands su mobile richiedono HTTPS e permessi del browser

---

## 🎓 Esempi Avanzati

### Aggiungi atleta + affidalo a squadra
```
Tu: Aggiungi Marco Rossi come attaccante della squadra FC Milano
```

### Bulk search
```
Tu: Mostrami tutti gli attaccanti
IA: {"action": "search", "query": "Attaccante"}
```

### Gestione infortuni
```
Tu: Marco Rossi è infortunato, contrassegnalo come inattivo
IA: {"action": "updateAthlete", "athleteId": "...", "data": {"active": false, "notes": "Infortunato"}}
```

---

## 📞 Supporto

Se il comando non viene eseguito:
1. Verifica che la chiave Groq sia salvata
2. Controlla la console browser (F12 → Console) per errori
3. Assicurati che appState sia caricato correttamente
4. Ricarica la pagina se il sistema non risponde

---

**Commit**: 90accab
**Data**: 22 Feb 2026
**Versione**: 1.0 AI Action Executor

# 🔄 Rotazione Reparti Automatica

## 🎯 Funzionalità

Oltre alla rotazione degli orari, il sistema ora permette ai dipendenti di **ruotare automaticamente tra più reparti ogni settimana**.

## ✨ Come Funziona

### Configurazione Rotazione Reparti per Dipendente

1. **Apri Anagrafica Dipendente**
   - Clicca sull'icona ✍️ vicino al nome del dipendente
   - OPPURE: Aggiungi un nuovo dipendente

2. **Inserisci i Reparti in Rotazione**
   - Campo: **🔄 Rotazione Reparti (opzionale)**
   - Inserisci i reparti separati da virgola
   - Esempio: `Picking, Ribalta, Mamme, Ricevitori`

3. **Salva**
   - Clicca **"💾 Salva Solo Rotazione Reparti"** (solo modifica)
   - OPPURE: Clicca **"✅ Aggiungi"** o **"💾 Aggiorna"**

### Generazione Automatica

Quando clicchi **"✨ Genera Turni"**:

1. ✅ Ogni dipendente con rotazione reparti viene automaticamente spostato al reparto successivo
2. ✅ La rotazione è ciclica: dopo l'ultimo reparto, si torna al primo
3. ✅ Il sistema mostra un messaggio: `🔄 X dipendenti con rotazione reparti`

### Esempio Pratico

**Mario Rossi** ha configurato: `Picking, Ribalta, Mamme`

- **Settimana 1**: Genera Turni → Mario lavora in **Picking**
- **Settimana 2**: Genera Turni → Mario lavora in **Ribalta**
- **Settimana 3**: Genera Turni → Mario lavora in **Mamme**
- **Settimana 4**: Genera Turni → Mario torna in **Picking** (ricomincia il ciclo)

## 📊 Visualizzazione

### Nella Tabella Turni

1. **Badge Verde** 🔄: Indica che il dipendente ha rotazione reparti
   - Testo: `🔄 3 reparti` (numero reparti in rotazione)
   - Tooltip: Mostra tutti i reparti

2. **Colonna Reparto**: Mostra il reparto corrente + prossimo
   - Esempio: `Picking → Prossimo: Ribalta`

### Nel Form Dipendente

- Il campo **"🔄 Rotazione Reparti"** mostra tutti i reparti separati da virgola
- Durante la modifica, puoi vedere e modificare la lista

## 🔧 Gestione

### Pulsante "Salva Solo Rotazione Reparti"

- 📍 Posizione: Form modifica dipendente, sotto il campo rotazione reparti
- 🎯 Funzione: Salva rapidamente solo la rotazione senza modificare altri dati
- ⚠️ Disponibile solo in modalità modifica

### Modifica Rotazione

Per modificare i reparti in rotazione:
1. Modifica il dipendente
2. Cambia il campo **"🔄 Rotazione Reparti"**
3. Salva (il sistema resetterà l'indice al primo reparto)

### Rimuovere Rotazione

Per tornare a un reparto fisso:
1. Modifica il dipendente
2. Svuota il campo **"🔄 Rotazione Reparti"**
3. Inserisci il reparto fisso in **"Reparto Principale"**
4. Salva

## 💾 Backup e Persistenza

### Export/Import Automatico

✅ **Backup Generale** (`shift_backup_YYYY-MM-DD.json`)
- Include `allowedDepartments` e `currentDepartmentIndex`

✅ **Anagrafica** (`anagrafica_YYYY-MM-DD.json`)
- Include tutti i dati di rotazione reparti

### Campi Salvati

```javascript
{
  department: "Picking",                    // Reparto attuale
  allowedDepartments: ["Picking", "Ribalta", "Mamme"],  // Reparti in rotazione
  currentDepartmentIndex: 0                 // Indice reparto corrente (0 = primo)
}
```

## 🎯 Priorità e Vincoli

### Fasce Orarie

La rotazione reparti è **indipendente** dalla rotazione fasce orarie:
- ✅ Un dipendente può ruotare sia reparti che fasce
- ✅ Le due rotazioni lavorano in parallelo

### Vincoli per Reparto

Se configuri **"Rotazioni per Reparto"** (sezione dedicata):
- ✅ Il vincolo si applica al reparto **attuale** del dipendente
- ✅ Quando il dipendente cambia reparto, cambia anche il vincolo fasce

**Esempio:**
- Reparto **Picking** → Vincolo: solo T1-T2
- Reparto **Ribalta** → Vincolo: solo T3

Quando Mario ruota da Picking a Ribalta:
- ✅ Automaticamente passerà a fare solo T3

## 📋 Casi d'Uso

### 1. Rotazione Completa Reparti

**Dipendente polivalente** che copre più reparti:
- Rotazione: `Picking, Ribalta, Mamme, Ricevitori`
- Ogni settimana lavora in un reparto diverso

### 2. Rotazione Limitata (2 Reparti)

**Alternanza tra due reparti**:
- Rotazione: `Picking1, Picking2`
- Settimana 1: Picking1
- Settimana 2: Picking2
- Settimana 3: Picking1 (ricomincia)

### 3. Combinazione con Fasce Personalizzate

**Dipendente con rotazione reparti + fasce specifiche**:
- Rotazione Reparti: `Mamme, Notturno`
- Fasce Orarie: T1, T3 (solo mattina e pomeriggio)
- Risultato: Alterna reparti ma lavora sempre T1 o T3

## ⚡ Funzionalità Avanzate

### Reset Automatico

Quando modifichi i reparti in rotazione:
- ✅ `currentDepartmentIndex` viene resettato a 0
- ✅ Il sistema riparte dal primo reparto della nuova lista

### Gestione Errori

Se un reparto viene rimosso dalle fasce configurate:
- ✅ Il sistema continua a funzionare
- ⚠️ Potrebbe non applicare vincoli fasce per quel reparto

## 🔍 Verifica Stato Rotazione

Per verificare quale reparto è attivo:
1. Guarda la **colonna Reparto** nella tabella turni
2. Mostra: `NomeReparto → Prossimo: AltrReparto`
3. Il primo è il reparto **attuale**, il secondo è il **prossimo**

## 💡 Suggerimenti

1. **Ordine Importante**: I reparti ruotano nell'ordine in cui li inserisci
2. **Nomi Precisi**: Usa gli stessi nomi dei reparti esistenti
3. **Backup Frequenti**: Esporta regolarmente per preservare le configurazioni

---

**Versione**: 2.1  
**Data**: 9 Gennaio 2026  
**Compatibilità**: Funziona con tutte le altre funzionalità (fasce, vincoli reparto, distribuzione)

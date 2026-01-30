Questi file di esempio sono inclusi nella cartella e possono essere caricati nell'app tramite il pulsante **Carica dati** (in alto) o i pulsanti specifici nelle singole sezioni.

File disponibili:

- `sample-inventory-extended.json` — inventario esteso con SKU, quantità, costi, min e reorder.
- `sample-menu-extended.json` — menu esteso con piatti e linee ingredienti (SKU)
- `sample-drinks-extended.json` — lista bevande estesa con SKU
- `sample-desserts-extended.json` — dolci di esempio
- `sample-suppliers-extended.json` — elenco fornitori
- `sample-recipes.json` — ricette dettagliate con ingredienti e passaggi
- `sample-full-extended.json` — file completo che include suppliers, inventory, menu, drinks e impostazioni (ideale per import rapido)
- `sample-bar-full.json` — set di esempio specifico per attività Bar (menu snack, bevande, inventario dedicato)
- `sample-bistro-full.json` — set di esempio specifico per Bistrò (menu primi/secondi, ingredienti e bevande)- `sample-ristorante-full.json` — set completo per Ristorante (piatti, ingredienti e bevande)
- `sample-bar-full.json` — set completo per Bar (menu snack, bevande, inventario dedicato)
Come caricare:
- Pulsante principale: clicca su **Carica dati** in alto, seleziona `sample-full-extended.json` o gli altri file; conferma l'importazione quando richiesto.
- Sezione specifica: nella pagina **Inventario**, **Menu** o **Bevande, Caffè, Dolci** usa i pulsanti **Carica menu**, **Carica prodotti** o **Carica dati** presenti nel pannello per importare file mirati.
- Nuovo: è disponibile il pulsante **Scarica esempi** (in alto a destra) che crea uno ZIP con tutti i sample JSON e le versioni CSV dei file estesi per scaricare e condividere rapidamente.

Formato accettato:
- Array JSON (es. `[{...}, {...}]`) o oggetto con nodo specifico (es. `{ "drinks": [...] }` o `{ "inventory": [...] }`).

Se vuoi, posso anche generare una versione CSV di alcuni file o uno script che importa automaticamente `sample-full-extended.json` al boot del server per prove rapide.
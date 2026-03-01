// Knowledge Base Tesla
// Database locale con informazioni su prodotti e servizi Tesla

const teslaKnowledgeBase = {
    // Prodotti
    products: {
        'model3': {
            name: 'Tesla Model 3',
            shortDesc: 'Berlina elettrica compatta e performante',
            description: `
La Tesla Model 3 è una berlina elettrica che combina prestazioni elevate con efficienza energetica. 
È il modello più venduto di Tesla e rappresenta il miglior rapporto prezzo/prestazioni.

CARATTERISTICHE PRINCIPALI:
- Accelerazione 0-100 km/h: 5.8 secondi
- Velocità massima: 225 km/h
- Autonomia: fino a 568 km con una carica
- Batteria: 75 kWh Long Range
- Carica Supercharger: 200 km in 15 minuti
- Peso: 1.611 kg
- Lunghezza: 4.69 m
- Passeggeri: 5

TECNOLOGIA:
- Autopilot completo incluso
- Schermo tattile 15.4 pollici
- Carica bidirezionale (V2G)
- Over-the-air software updates

PREZZO BASE: €55.990 (in Europa)
GARANZIA: 8 anni sulla batteria
            `,
            price: '€55.990',
            range: '568 km',
            acceleration: '5.8 sec',
            seats: '5'
        },
        'models': {
            name: 'Tesla Model S',
            shortDesc: 'Berlina di lusso a prestazioni estreme',
            description: `
La Tesla Model S è la berlina di lusso di Tesla con prestazioni di supercar.
Rappresenta il massimo in termini di accelerazione, autonomia e comfort.

CARATTERISTICHE PRINCIPALI:
- Accelerazione 0-100 km/h: 3.2 secondi (Plaid)
- Velocità massima: 322 km/h (Plaid)
- Autonomia: fino a 730 km
- Batteria: 100 kWh Plaid
- Carica Supercharger: 275 km in 15 minuti
- Peso: 2.154 kg
- Lunghezza: 4.97 m
- Passeggeri: 5
- Bagagliaio: 760 L + 100 L

TECNOLOGIA:
- Autopilot Full Self-Driving (opzionale)
- Schermo tattile 17 pollici
- Sistema audio premium (12 speaker)
- Tetto in vetro panoramico

PREZZO BASE: €104.990 (in Europa)
GARANZIA: 8 anni sulla batteria
            `,
            price: '€104.990',
            range: '730 km',
            acceleration: '3.2 sec',
            seats: '5'
        },
        'modelx': {
            name: 'Tesla Model X',
            shortDesc: 'SUV elettrico con porte Falcon Wing',
            description: `
La Tesla Model X è un SUV premium con le iconiche porte Falcon Wing.
Combina lo spazio di un SUV con le prestazioni moderne.

CARATTERISTICHE PRINCIPALI:
- Accelerazione 0-100 km/h: 4.8 secondi
- Velocità massima: 250 km/h
- Autonomia: fino a 650 km
- Batteria: 100 kWh
- Carica Supercharger: 200 km in 15 minuti
- Peso: 2.391 kg
- Lunghezza: 5.06 m
- Passeggeri: 5-7 (con terza fila)
- Bagagliaio: 1.580 L

TECNOLOGIA:
- Porte Falcon Wing automatiche
- Pre-condizionamento bioclimatico
- Filtraggio aria HEPA
- Autopilot completo

PREZZO BASE: €99.990 (in Europa)
GARANZIA: 8 anni sulla batteria
            `,
            price: '€99.990',
            range: '650 km',
            acceleration: '4.8 sec',
            seats: '5-7'
        },
        'modely': {
            name: 'Tesla Model Y',
            shortDesc: 'SUV compatto versatile e accessibile',
            description: `
La Tesla Model Y è il SUV compatto di Tesla, perfetto per famiglie e uso quotidiano.
È il modello più versatile della gamma Tesla.

CARATTERISTICHE PRINCIPALI:
- Accelerazione 0-100 km/h: 6.1 secondi
- Velocità massima: 190 km/h
- Autonomia: fino a 525 km
- Batteria: 75 kWh
- Carica Supercharger: 200 km in 15 minuti
- Peso: 1.921 kg
- Lunghezza: 4.75 m
- Passeggeri: 5
- Bagagliaio: 525 L

TECNOLOGIA:
- Autopilot completo
- Freno rigenerativo intelligente
- App Tesla per controllo remoto
- Over-the-air updates

PREZZO BASE: €62.990 (in Europa)
GARANZIA: 8 anni sulla batteria
            `,
            price: '€62.990',
            range: '525 km',
            acceleration: '6.1 sec',
            seats: '5'
        }
    },

    // Servizi e Tecnologie
    services: {
        'supercharger': {
            name: 'Supercharger',
            description: `
La rete di ricarica Supercharger è la più grande al mondo per veicoli elettrici.

CARATTERISTICHE:
- Oltre 60.000 stazioni in tutto il mondo
- In Italia: oltre 500 stazioni
- Velocità di ricarica: fino a 350 kW
- Tempo di ricarica: 200 km in 15 minuti
- Accesso tramite app Tesla
- Pagamento automatico

VANTAGGI:
✓ Compatibilità universale con standard NACS
✓ Stazioni in posizioni strategiche (autostrade, centri commerciali)
✓ Comfort room: WiFi, caffè, bagni
✓ Ricarica intelligente con prenotazione
✓ Prezzi competitivi: €0,45-0,60/kWh

COME USARLO:
1. Avvia la Tesla
2. Tocca l'icona Supercharger sulla mappa
3. Seleziona una stazione
4. Segui le indicazioni
5. Estrai il connettore e ricarica
6. La transazione è automatica
            `
        },
        'autopilot': {
            name: 'Autopilot',
            description: `
L'Autopilot è il sistema di assistenza alla guida di Tesla che rende la guida più sicura e comoda.

FUNZIONALITÀ PRINCIPALI:
- Traffic-Aware Cruise Control: mantiene distanza dai veicoli davanti
- Autosteer: guida autonomamente in corsia
- Auto Lane Change: cambia corsia automaticamente
- Navigate on Autopilot: percorsi ulteriori autonomi
- Summon: il veicolo si sposta autonomamente nel parcheggio
- Smart Summon: richiama l'auto da remoto con l'app

VANTAGGI:
✓ Riduce la fatica di guida
✓ Migliora la sicurezza stradale
✓ Statisticamente riduce gli incidenti (dati di telemetria)
✓ Rende piacevole il viaggio su autostrada
✓ Conviene su tragitti lunghi

FULL SELF-DRIVING (opzionale, €8.500):
- Riconosce semafori e stop
- Naviga nelle strade urbane
- Riconosce segnali stradali
- Parcheggio autonomo
- Evita ostacoli in tempo reale

COME ATTIVARE:
Menu > Controlli > Guida > Autopilot > Attiva
            `
        },
        'batteria': {
            name: 'Sistema Batteria',
            description: `
Le batterie Tesla sono il cuore dell'innovazione elettrica.

TECNOLOGIA:
- Celle 4680 di ultima generazione
- Chimica LFP (Litio-Ferro-Fosfato) su alcuni modelli
- Gestione termica intelligente
- BMS (Battery Management System) avanzato

SPECIFICHE:
- Capacità: 50-100 kWh a seconda del modello
- Tensione nominale: 350-400 Volt
- Cicli di vita: 1.000+ cicli con 80% di capacità
- Garanzia: 8 anni

PRESTAZIONI:
✓ Ricarica 10-80% in 25 minuti con Supercharger
✓ Precondizionamento per ottimire ricarica in freddo
✓ Degradazione minima nel tempo
✓ Facilità di sostituzione (modulare)

CONSIGLI PER LA LONGEVITÀ:
1. Impostare carica massima a 80% per uso quotidiano
2. Precondizionare prima di ricarica rapida
3. Evitare scariche complete (< 10%)
4. Parcheggiare al coperto
5. Aggiornamenti software regolari

COSTO SOSTITUZIONE: €8.000-15.000 (varies by capacity)
            `
        },
        'charging_at_home': {
            name: 'Ricarica a Casa',
            description: `
La ricarica domestica è il modo più conveniente per i proprietari Tesla.

WALLBOX TESLA (Wall Connector):
- Potenza: fino a 11 kW (Fase 3, 400V)
- Tempo di ricarica: 50 km/ora
- Model 3 full: ~11 ore da 0%
- Smart scheduling: ricarica in orari con corrente più economica
- Prezzo: €450-600 (installazione extra)

RICARICA STANDARD (presa domestica):
- Potenza: 2.3 kW
- Tempo di ricarica: 3-5 km/ora
- Model 3 full: 60-80 ore
- NON consigliato per uso quotidiano (sovraccarico)

RICARICA INTELLIGENTE:
- Pianifica ricarica per orari fuori picco
- Integrazione con pannelli solari
- App Tesla mostra costo totale

INSTALAZIONE:
1. Contatta Tesla per ispezione impianto
2. Verifica corrente disponibile (minimo 10A)
3. Installazione da elettricista qualificato
4. Costo: €1.000-2.000 (inclusa wallbox e lavori)

COSTO RICARICA:
- Con wallbox: ~€0,25/kWh (a casa tua)
- Model 3 da 0-100%: ~€15 (340 km)
- Risparmio annuale vs benzina: €2.000-3.000
            `
        }
    },

    // Q&A comuni
    commonQuestions: {
        'price_model3': 'Quanto costa il Model 3?',
        'price_models': 'Quanti euro costa il Model S?',
        'supercharger_time': 'Quanto tempo ci vuole per ricaricare a un Supercharger?',
        'autopilot_safe': 'L\'Autopilot è sicuro?',
        'battery_warranty': 'Qual è la garanzia della batteria?',
        'charging_cost': 'Quanto costa ricaricare a casa?',
        'range_model3': 'Qual è l\'autonomia del Model 3?',
        'acceleration_models': 'Quanto accelera il Model S?',
        'warranty_general': 'Qual è la garanzia generale di Tesla?',
        'service_centers': 'Dove sono i centri assistenza Tesla?'
    },

    // Funzioni helper
    searchProduct(query) {
        const lowerQuery = query.toLowerCase();
        for (const [key, product] of Object.entries(this.products)) {
            if (key.includes(lowerQuery) || product.name.toLowerCase().includes(lowerQuery)) {
                return product;
            }
        }
        return null;
    },

    searchService(query) {
        const lowerQuery = query.toLowerCase();
        for (const [key, service] of Object.entries(this.services)) {
            if (key.includes(lowerQuery) || service.name.toLowerCase().includes(lowerQuery)) {
                return service;
            }
        }
        return null;
    },

    findRelevantInfo(query) {
        const lowerQuery = query.toLowerCase();
        
        // Cerca nei prodotti
        for (const [key, product] of Object.entries(this.products)) {
            if (product.name.toLowerCase().includes(lowerQuery) || 
                product.description.toLowerCase().includes(lowerQuery)) {
                return { type: 'product', data: product };
            }
        }
        
        // Cerca nei servizi
        for (const [key, service] of Object.entries(this.services)) {
            if (service.name.toLowerCase().includes(lowerQuery) || 
                service.description.toLowerCase().includes(lowerQuery)) {
                return { type: 'service', data: service };
            }
        }
        
        // Cerca negli argomenti generali
        for (const [key, general] of Object.entries(this.generali)) {
            if (general.name.toLowerCase().includes(lowerQuery) || 
                general.keywords.some(k => lowerQuery.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerQuery.split(' ')[0])) ||
                general.description.toLowerCase().includes(lowerQuery)) {
                return { type: 'general', data: general };
            }
        }
        
        return null;
    }
};

// AGGIUNGI: Knowledge base con argomenti generali
teslaKnowledgeBase.generali = {
    'scienza': {
        name: 'Scienza e Fisica',
        keywords: ['scienza', 'fisica', 'energia', 'atomo', 'molecola', 'gravità', 'velocità', 'forza'],
        description: `
La scienza studia i fenomeni naturali attraverso il metodo scientifico. La fisica è la disciplina che studia la materia, l'energia e le forze.

CONCETTI FONDAMENTALI:
- Energia: La capacità di un corpo di compiere lavoro
- Velocità: Lo spazio percorso in un'unità di tempo
- Forza: L'agente che produce variazioni di moto
- Gravità: La forza che attrae i corpi verso il centro della Terra
- Atomo: La più piccola unità indivisibile della materia ordinaria
- Molecola: L'insieme di due o più atomi legati chimicamente

Le tre leggi di Newton sono fondamentali per capire il movimento dei corpi.
        `
    },
    'storia': {
        name: 'Storia',
        keywords: ['storia', 'guerra', 'romano', 'medioevo', 'rinascimento', 'imperatore', 'battaglia', 'antico'],
        description: `
La storia è la disciplina che studia gli eventi del passato umano e le società che li hanno generati.

PERIODI STORICI PRINCIPALI:
- Preistoria: Prima della scrittura (fino alle 3000 a.C.)
- Antichità: Dalla scrittura al crollo dell'Impero Romano (3000 a.C. - 476 d.C.)
- Medioevo: Dal crollo dell'Impero Romano al Rinascimento (476 - 1492)
- Età moderna: Dal 1492 alla Rivoluzione Francese (1492 - 1789)
- Età contemporanea: Dalla Rivoluzione Francese a oggi (1789 - presente)

La storia ci aiuta a comprendere il presente attraverso la conoscenza del passato.
        `
    },
    'geografia': {
        name: 'Geografia', 
        keywords: ['geografia', 'continente', 'paese', 'città', 'montagna', 'fiume', 'mare', 'clima'],
        description: `
La geografia studia i luoghi, i popoli e le loro interazioni con l'ambiente.

GLI ELEMENTI GEOGRAFICI:
- Continenti: Asia, Africa, Europa, Nord America, Sud America, Oceania, Antartide
- Oceani: Pacifico, Atlantico, Indiano, Artico, Antartico
- Climi: Tropicale, temperato, artico, desertico, oceanico
- Biomi: Foreste, savane, deserti, praterie, tundra

L'Italia è un paese mediterraneo con una ricca storia geografica e culturale.
        `
    },
    'matematica': {
        name: 'Matematica',
        keywords: ['matematica', 'numero', 'equazione', 'algebra', 'geometria', 'calcolo', 'teorema'],
        description: `
La matematica è la scienza che studia quantità, spazio e forme.

AREE PRINCIPALI:
- Aritmetica: Operazioni con i numeri (addizione, sottrazione, moltiplicazione, divisione)
- Algebra: Risoluzione di equazioni e manipolazione di simboli
- Geometria: Studio delle forme, delle figure e dello spazio
- Calcolo: Analisi del cambiamento e del movimento
- Statistica: Analisi dei dati e delle probabilità

La matematica è il linguaggio universale della scienza e della tecnologia.
        `
    },
    'tecnologia': {
        name: 'Tecnologia e Innovazione',
        keywords: ['tecnologia', 'computer', 'internet', 'app', 'software', 'hardware', 'programmazione', 'intelligenza artificiale'],
        description: `
La tecnologia è l'applicazione pratica della scienza per risolvere problemi e migliorare la vita.

INNOVAZIONI CHIAVE:
- Internet: Rete globale di comunicazione che connette miliardi di dispositivi
- Intelligenza Artificiale: Sistemi che imitano l'intelligenza umana
- Cloud Computing: Accesso a risorse informatiche via internet
- Blockchain: Tecnologia di registro distribuito altamente sicura
- IoT (Internet of Things): Rete di dispositivi intelligenti connessi

La trasformazione digitale sta cambiando tutti gli aspetti della società.
        `
    },
    'salute': {
        name: 'Salute e Medicina',
        keywords: ['salute', 'medicina', 'malattia', 'vaccino', 'virus', 'ospedale', 'medico', 'cura'],
        description: `
La salute è uno stato di completo benessere fisico, mentale e sociale, non solo l'assenza di malattia.

IMPORTANTI ASPETTI DELLA SALUTE:
- Esercizio fisico: Attività motoria regolare per mantenersi in forma
- Nutrizione: Alimentazione equilibrata con nutrienti essenziali
- Sonno: Riposo adeguato per il recupero fisico e mentale
- Igiene: Mantenersi puliti per prevenire malattie
- Prevenzione: Screening regolari e vaccinazioni
- Equilibrio mentale: Gestione dello stress e della salute psicologica

L'OMS (Organizzazione Mondiale della Sanità) promuove buone pratiche sanitarie globali.
        `
    },
    'ambiente': {
        name: 'Ambiente e Sostenibilità',
        keywords: ['ambiente', 'sostenibilità', 'inquinamento', 'clima', 'energia rinnovabile', 'riciclo', 'CO2', 'green'],
        description: `
La sostenibilità ambientale è la capacità di soddisfare i bisogni presenti senza compromettere le generazioni future.

SFIDE AMBIENTALI PRINCIPALI:
- Cambiamento climatico: Riscaldamento globale causato da gas serra
- Inquinamento: Contaminazione di aria, acqua e suolo
- Deforestazione: Perdita di foreste e habitat naturali
- Consumo di risorse: Utilizzo maggiore rispetto alla capacità di rigenerazione
- Perdita di biodiversità: Estinzione di specie animali e vegetali

SOLUZIONI SOSTENIBILI:
- Energie rinnovabili: Solare, eolico, idroelettrico, geotermico
- Economia circolare: Riduzione, riuso, riciclo
- Trasporti sostenibili: Veicoli elettrici e mobilità condivisa
        `
    },
    'cultura': {
        name: 'Arte e Cultura',
        keywords: ['arte', 'cultura', 'musica', 'film', 'letteratura', 'pittura', 'scultura', 'teatro'],
        description: `
L'arte e la cultura sono espressioni della creatività umana e della nostra identità.

FORME D'ARTE PRINCIPALI:
- Pittura: Espressione visiva su superfici
- Scultura: Creazione di forme tridimensionali
- Musica: Organizzazione di suoni nel tempo
- Letteratura: Espressione scritta di idee e storie
- Teatro: Rappresentazione di storie davanti al pubblico
- Cinema: Combinazione di immagini in movimento e suono

La cultura riflette i valori, le credenze e la storia di una società.
        `
    },
    'sport': {
        name: 'Sport e Atletica',
        keywords: ['sport', 'calcio', 'tennis', 'atletica', 'nuoto', 'calcio', 'pallavolo', 'olimpiadi'],
        description: `
Lo sport è un'attività fisica competitiva che promuove la salute e il benessere.

SPORT PRINCIPALI MONDIALI:
- Calcio: Sport di squadra più popolare al mondo
- Tennis: Sport individuale di racchetta
- Pallavolo: Sport di squadra con una rete
- Nuoto: Movimento nell'acqua per esercizio e competizione
- Atletica leggera: Corsa, salti e lanci
- Basket: Sport di squadra con palla e canestro

Le Olimpiadi sono il più grande evento sportivo mondiale che celebra l'eccellenza atletica.
        `
    },
    'economia': {
        name: 'Economia e Finanza',
        keywords: ['economia', 'finanza', 'soldi', 'borsa', 'denaro', 'investimento', 'mercato', 'commercio'],
        description: `
L'economia studia la produzione, la distribuzione e il consumo di beni e servizi.

CONCETTI ECONOMICI CHIAVE:
- Offerta e Domanda: I fattori che determinano i prezzi di mercato
- Inflazione: Aumento del livello generale dei prezzi
- PIL: Il valore totale dei beni e servizi prodotti in un paese
- Mercato Borsistico: Luogo (fisico o virtuale) dove si scambiano azioni e titoli
- Moneta: Mezzo di scambio accettato universalmente
- Tasse: Prelievi sui redditi per finanziare servizi pubblici

L'economia globale è sempre più interconnessa e interdipendente.
        `
    },
    'letteratura': {
        name: 'Letteratura e Narrativa',
        keywords: ['letteratura', 'romanzo', 'poesia', 'poeta', 'scrittore', 'autore', 'racconto', 'novella', 'dramma', 'Shakespeare', 'Dante', 'Manzoni'],
        description: `
La letteratura è l'arte dell'espressione scritta creativa e rappresenta la cultura di un popolo attraverso testi di valore estetico e significato.

GENERI LETTERARI PRINCIPALI:
- Romanzo: Narrazione lunga di vicende umane e sociali
- Novella: Racconto più breve del romanzo con trama concentrata
- Dramma: Opera destinata alla rappresentazione teatrale
- Poesia: Composizione in versi con ritmo, rima e musicità
- Fantasy: Genere con elementi magici e mondi immaginari
- Fantascienza: Esplorazione di futuri possibili e scienze speculative
- Thriller: Genere di suspense e tensione narrativa
- Horror: Genere che genera paura nei lettori
- Giallo: Racconto investigativo di crimini e misteri

AUTORI FAMOSI DELLA STORIA:
- Omero (VIII a.C.): Iliade e Odissea (epica greca)
- Dante Alighieri (1265-1321): La Divina Commedia
- William Shakespeare (1564-1616): Amleto, Romeo e Giulietta, Macbeth
- Miguel de Cervantes (1547-1616): Don Chisciotte
- Jane Austen (1775-1817): Orgoglio e Pregiudizio
- Lev Tolstoi (1828-1910): Guerra e Pace, Anna Karenina
- Fedor Dostoevskij (1821-1881): Crimine e Castigo, Delitto e Castigo
- Victor Hugo (1802-1885): I Miserabili, Notre-Dame di Parigi
- Charles Dickens (1812-1870): David Copperfield, Aspettative

PERIODI LETTERARI:
- Medioevo: Letteratura epica e cortese
- Rinascimento: Umanesimo e rinascita classica
- Barocco: Ornamentazione elaborata
- Illuminismo: Razionalità e saggezza
- Romanticismo: Emozioni e natura
- Realismo: Descrizione veridica della società
- Modernismo: Sperimentalismo formale
- Postmodernismo: Metanarrazione e ironia
        `
    },
    'astronomia': {
        name: 'Astronomia e Astrofisica',
        keywords: ['astronomia', 'stella', 'pianeta', 'galassia', 'universo', 'spazio', 'sole', 'luna', 'telescopio', 'cosmologia'],
        description: `
L'astronomia è la scienza che studia i corpi celesti, le stelle, i pianeti, le galassie e l'universo intero.

OGGETTI CELESTI:
- Stella: Sfera di plasma incandescente che brilla di fusione nucleare
- Pianeta: Corpo celeste orbitante attorno a una stella
- Satellite: Corpo celeste orbitante attorno a un pianeta
- Cometa: Corpo di ghiaccio e roccia
- Asteroide: Corpo di roccia e metallo nello spazio
- Buco nero: Oggetto con gravità estrema
- Pulsar: Stella di neutroni che emette radiazione
- Quasar: Nuclei galattici attivi luminosissimi
- Nebulosa: Nube di gas e polveri interstellari

IL SISTEMA SOLARE:
- 8 Pianeti: Mercurio, Venere, Terra, Marte, Giove, Saturno, Urano, Nettuno
- Le Lune: La Terra ha 1 luna, Marte 2, Giove 79, Saturno 82
- Fascia di Kuiper: Regione di piccoli oggetti gelidi oltre Nettuno
- Nube di Oort: Sfera teorica di comete attorno al Sistema Solare

GALASSIE:
- Via Lattea: La nostra galassia con 200-400 miliardi di stelle
- Andromeda: Galassia spirale più vicina
- Galassie ellittiche: Forma ellissoidale
- Galassie lenticolari: Disco con alone
- Galassie irregolari: Forma indefinita

L'UNIVERSO:
- Big Bang: Origine 13,8 miliardi di anni fa
- Radiazione cosmica: Luce primordiale dell'universo
- Espansione accelerata: Lo spazio si espande sempre più velocemente
- Energia oscura: Misteriosa forza di repulsione
- Materia oscura: Materia invisibile che costituisce l'85% della materia
        `
    },
    'biologia': {
        name: 'Biologia e Evoluzione',
        keywords: ['biologia', 'cellula', 'DNA', 'evoluzione', 'specie', 'vita', 'organismo', 'genetica', 'mutazione', 'selezione naturale', 'darwin'],
        description: `
La biologia è la scienza che studia la vita e i processi biologici.

ORIGINI DELLA VITA:
- Abiogenesi: Processo che genera la vita dalla materia non vivente
- Comparsa della vita: 3,7-4 miliardi di anni fa
- Evoluzione dei microbi: Primi organismi unicellulari
- Fotosintesi: Processo che libera ossigeno nell'atmosfera
- Vita multicellulare: Emerge circa 1,2 miliardi di anni fa

TEORIA DELL'EVOLUZIONE:
- Charles Darwin: Naturalista che formula selezione naturale
- Selezione naturale: Tratti vantaggiosi si trasmettono alle generazioni
- Adattamento: Caratteristiche che favoriscono la sopravvivenza
- Speciazione: Processo che genera nuove specie da antenati comuni
- Radiazione adattativa: Diversificazione rapida in ambienti nuovi

LIVELLI DI ORGANIZZAZIONE:
- Atomi: Unità fondamentali della materia
- Molecole: Combinazioni di atomi legati
- Cellula: Unità basilare della vita
- Tessuti: Gruppi di cellule simili
- Organi: Strutture composte da tessuti
- Apparati: Gruppi di organi
- Organismo: Entità vivente completa
- Popolazione: Organismi della stessa specie
- Comunità: Diverse specie nello stesso ambiente
- Ecosistema: Comunità e ambiente fisico
- Biosfera: Tutti gli ecosistemi terrestri

DIVISIONI DELLA BIOLOGIA:
- Botanica: Studio delle piante
- Zoologia: Studio degli animali
- Microbiologia: Studio dei microorganismi
- Ecologia: Relazioni tra organismi e ambiente
- Genetica: Eredità e geni
- Fisiologia: Funzioni degli organismi
- Anatomia: Struttura degli organismi
- Embriologia: Sviluppo degli embrioni
        `
    },
    'storia_medievale': {
        name: 'Medioevo e Feudalesimo',
        keywords: ['medioevo', 'feudalesimo', 'cavaliere', 'castello', 'chiesa', 'inquisizione', 'crociata', 're', 'signore', 'vassallo', 'feudo'],
        description: `
Il Medioevo (V-XV secolo) è il periodo tra il crollo dell'Impero Romano e il Rinascimento.

PERIODI DEL MEDIOEVO:
- Alto Medioevo (V-XI secolo): Invasioni barbariche, declino urbano, frammentazione
- Medioevo pieno (XI-XIII secolo): Feudalesimo consolidato, Rinascimento carolingio
- Basso Medioevo (XIII-XV secolo): Crisi economica, Peste Nera, Rinascimento

SISTEMA FEUDALE:
Struttura gerarchia: Re → Duchi e Conti → Baroni → Cavalieri → Contadini servi
- Re: Sovrano assoluto, suprema autorità
- Feudatari: Nobili che possiedono terre (feudi)
- Vassalli: Subordinati che prestano obbedienza
- Glieleanza: Contadini legati alla terra
- Contratto feudale: Doveri reciproci tra signore e vassallo

RELIGIONE E CHIESA:
- Papa: Capo della Chiesa Cattolica, potere temporale
- Monaci: Comunità religiose in monasteri
- Studi monastici: Conservazione della cultura classica
- Catacombe: Cimiteri sotterranei cristiani
- Chiese romaniche: Architettura robusta con archi tondi
- Cattedrali gotiche: Architettura massiccia con archi a sesto acuto
- Inquisizione: Tribunale ecclesiastico contro l'eresia

SOCIETÀ MEDIEVALE:
- Casta guerriera: Cavalieri con codice cavalleresco (onore, lealtà)
- Castelli: Fortezze difensive dei signori
- Borghi e città: Centri commerciali e artigianali
- Ghilde: Associazioni di artigiani e commercianti
- Fiere: Mercati annuali importanti
- Pellegrinaggi: Viaggi religiosi verso santuari

CROCIATI:
Guerre per riconquistare il controllo della Terra Santa dal Islam
- Prima Crociata (1096-1099): Successo, fondazione di Stati crociati
- Seconda Crociata (1147-1149): Fallimento
- Terza Crociata (1189-1192): Richard Leone Cuor d'Oro
- Quarta Crociata (1202-1204): Sacco di Costantinopoli
- Ulteriori crociate: Insuccessi gradualmente
- Fine delle crociate: Caduta di Acri nel 1291

FIGURE MEDIEVALI IMPORTANTI:
- Carlo Magno (747-814): Imperatore del Sacro Romano Impero
- Guglielmo il Conquistatore (1027-1087): Battaglia di Hastings, Normandia
- Re Riccardo Leone Cuor d'Oro (1157-1199): Crociato, cattività, riscatto
- Re Giovanni d'Inghilterra (1167-1216): Magna Carta
- Giovanna d'Arco (1412-1431): Eroina francese, santificata
- Dante Alighieri (1265-1321): Poeta, Divina Commedia

Eventi STORICI CHIAVE:
- Caduta dell'Impero Romano (476 d.C.): Inizio del Medioevo
- Invasioni barbariche: Franchi, Goti, Vandali, Unni
- Battaglia di Tours (732): Arresto dell'espansione musulmana
- Rinascimento carolingio (VIII-IX): Cultura sotto Carlo Magno
- Riforma gregoriana (XI): Riforma della Chiesa cattolica
- Schisma orientale (1054): Divisione tra Chiesa romana e ortodossa
- Battaglia di Stamford Bridge (1066): Invasione normanna dell'Inghilterra
- Papa Urbano II (1088-1099): Indice la Prima Crociata
- Firma della Magna Carta (1215): Limiti al potere reale inglese
- Battaglia di Bouvines (1214): Rafforzamento della Francia
- Mongoli di Gengis Khan (XIII sec.): Orde che conquistano l'Asia
- Battaglia di Lepanto (1571): Vittoria cristiana navale sui Turchi Ottomani
- Peste Nera (1347-1353): Pandemia che uccide 75-200 milioni
- Rivolta dei contadini (1381): Sollevazione Peasants' Revolt in Inghilterra
- Caduta di Costantinopoli (1453): Fine dell'Impero Bizantino, inizio del Rinascimento
        `
    },
    'arte_rinascimento': {
        name: 'Arte Rinascimentale e Maestri',
        keywords: ['arte', 'rinascimento', 'leonardo', 'michelangelo', 'raffaello', 'pittura', 'scultura', 'bottega', 'prospettiva', 'quattrocento'],
        description: `
Il Rinascimento (XIV-XVI secolo) è il periodo di rinascita culturale e artistica dal Medioevo all'Età Moderna.

MAESTRI DEL RINASCIMENTO ITALIANO:
- Leonardo da Vinci (1452-1519): Poliedrico genio, La Gioconda, L'Ultima Cena
- Michelangelo Buonarroti (1475-1564): Scultore e pittore, Cappella Sistina, Davide
- Raffaello Sanzio (1483-1520): Equilibrio, Scuola di Atena
- Donatello (1386-1466): Scultore innovativo, primo nudo moderno
- Botticelli (1445-1510): Nascita di Venere, Primavera
- Masaccio (1401-1428): Prospettiva scientifica
- Filippo Brunelleschi (1377-1446): Architetto, Cupola di Firenze

CARATTERISTICHE DELL'ARTE RINASCIMENTALE:
- Prospettiva: Rappresentazione realistica della profondità
- Anatomia: Studi accurati del corpo umano
- Proporzioni classiche: Modelli greco-romani
- Chiaroscuro: Contrasto tra luce e ombra
- Umanità: Focus sentimenti umani e dignità
- Naturismo: Osservazione attenta della natura
- Poliedricità: Artisti-scienziati

PERIODI DEL RINASCIMENTO:
- Rinascimento Primitivo (XIV-inizio XV): Transizione gotica
- Rinascimento Maturo (1480-1520): Apice creativo
- Rinascimento Tardivo (XVI): Manierismo

TECNICHE ARTISTICHE:
- Tempera: Pigmenti con legante uovo
- Olio: Tecnica sviluppata dai fiamminghi
- Scultura marmorea: Ripresa tradizione greco-romana
- Affresco: Dipingere su intonaco umido
- Acquaforte: Incisione su rame

OPERE ICONICHE:
- La Gioconda (Leonardo): Ritratto enigmatico, Louvre
- L'Ultima Cena (Leonardo): Refettorio Milano
- Cappella Sistina (Michelangelo): Soffitto e Giudizio Universale
- Scuola di Atena (Raffaello): Stanze del Vaticano
- Davide (Michelangelo): Scultura marmorea suprema

MECENATI IMPORTANTI:
- Famiglia Medici: Banchieri-mecenati di Firenze
- Leone X: Papa che patrocina gli artisti
- Federick da Montefeltro: Duca d'Urbino, collezionista
        `
    },
    'musica_classica': {
        name: 'Musica Classica e Compositori',
        keywords: ['musica', 'composizione', 'sinfonia', 'beethoven', 'mozart', 'bach', 'opera', 'violino', 'orchestra', 'classicismo', 'barocco'],
        description: `
La musica classica è la tradizione artistica di musica d'arte sviluppata principalmente in Europa.

PERIODI MUSICALI:
- Barocco (1600-1750): Contrasto, drammaticità, ornamentazione, opera
- Classicismo (1730-1820): Simmetria, chiarezza, forme definite, sonata
- Romanticismo (1820-1900): Emotività, nazionalismo, estensione armonica
- Modernismo (XX): Atonalità, dodecafonia, sperimentalismo
- Contemporaneo (XX-XXI): Minimalismo, elettronica

COMPOSITORI MAGGIORI:
- Johann Sebastian Bach (1685-1750): L'Arte della Fuga, Variazioni Goldberg
- Georg Friedrich Händel (1685-1759): Concerti Grossi, Messia
- Wolfgang Amadeus Mozart (1756-1791): Sinfonie, Concertati, Flauto magico
- Ludwig van Beethoven (1770-1827): Sinfonia n.9 "Ode alla Gioia"
- Gioachino Rossini (1792-1868): Il Barbiere di Siviglia
- Giuseppe Verdi (1813-1901): La Traviata, Rigoletto, Aida
- Georges Bizet (1838-1875): Carmen
- Pyotr Tchaikovsky (1840-1893): Lago dei Cigni, Schiaccianoci
- Claude Debussy (1862-1918): Impressionismo, Clair de lune
- Igor Stravinsky (1882-1971): Rite of Spring

FORME MUSICALI:
- Sonata: Tre movimenti (veloce-lento-veloce)
- Sinfonia: Sonata per orchestra
- Concerto: Solista con orchestra
- Ouverture: Introduzione orchestrale
- Suite: Raccolta di danze
- Tema e variazioni: Tema ripetuto modificato
- Fuga: Composizione contrappuntistica
- Opera: Dramma musicale cantato

STRUMENTI ORCHESTRALI:
- Archi: Violino, viola, violoncello, contrabbasso
- Legni: Flauto, oboe, clarinetto, fagotto
- Ottoni: Tromba, corno, trombone, tuba
- Percussioni: Timpani, piatti, xilofono, gong
- Tastiere: Pianoforte, organo, clavicembalo
        `
    },
    'psicologia': {
        name: 'Psicologia e Comportamento',
        keywords: ['psicologia', 'mente', 'comportamento', 'emozione', 'cognizione', 'memoria', 'apprendimento', 'personalità', 'stress', 'ansia', 'freud'],
        description: `
La psicologia è la scienza che studia il comportamento umano e i processi mentali.

AREE DELLA PSICOLOGIA:
- Psicologia cognitiva: Memoria, attenzione, percezione, linguaggio
- Psicologia dello sviluppo: Cambiamenti durante la vita
- Psicologia sociale: Comportamento nei gruppi e relazioni
- Psicologia clinica: Diagnosi e trattamento disturbi mentali
- Neuropsicologia: Correlazioni cervello-comportamento
- Psicologia dello sport: Prestazioni atletiche
- Psicologia educativa: Apprendimento e insegnamento

TEORIE PSICOLOGICHE:
- Comportamentismo: Comportamento = Stimoli + Rinforzi
- Cognitivismo: Focus su processi mentali e interpretazione
- Psicoanalisi (Freud): Inconscio, complessi, difese psicologiche
- Psicologia umanistica: Crescita personale e autorealizzazione
- Psicologia biologica: Ruolo del cervello e neurotrasmettitori
- Psicologia evolutiva: Adattamenti derivati da evoluzione

PROCESSI COGNITIVI:
- Percezione: Interpretazione stimoli sensoriali
- Attenzione: Selezione informazioni rilevanti
- Memoria breve: Conservazione temporanea
- Memoria lunga: Immagazzinamento permanente
- Pensiero: Elaborazione e problem solving
- Linguaggio: Comunicazione attraverso simboli
- Ragionamento: Analisi logica e conclusioni

DISTURBI PSICOLOGICI:
- Depressione: Umore depresso persistente
- Ansia: Apprensione eccessiva
- PTSD: Risposta a trauma grave
- Schizofrenia: Perdita contatto con realtà
- Disturbi alimentari: Anoressia, bulimia
- Dipendenze: Uso compulsivo di sostanze
- Fobie: Paura irrazionale
        `
    },
    'filosofia': {
        name: 'Filosofia e Metafisica',
        keywords: ['filosofia', 'etica', 'morale', 'logica', 'metafisica', 'epistemologia', 'ontologia', 'platone', 'aristotele', 'kant'],
        description: `
La filosofia è la ricerca della saggezza e della verità attraverso il ragionamento critico.

BRANCHE DELLA FILOSOFIA:
- Metafisica: Studio della realtà e della natura dell'essere
- Epistemologia: Studio della conoscenza e come sappiamo
- Etica: Studio del bene, male, morale
- Logica: Studio del ragionamento valido
- Estetica: Studio della bellezza e dell'arte
- Politica: Studio del governo e società
- Ontologia: Studio dell'essere
- Fenomenologia: Studio della coscienza

SCUOLE FILOSOFICHE:
- Platonismo (Platone): Mondo delle idee eterne
- Aristotelismo (Aristotele): Osservazione empirica
- Stoicismo: Controllo del desiderio
- Epicureismo: Piacere moderato
- Scetticismo: Dubbio sulla conoscenza
- Idealismo: Realtà di natura mentale
- Materialismo: Realtà fisica e materiale
- Razionalismo: Ragione come fonte di conoscenza
- Empirismo: Esperienza come fonte di conoscenza
- Kantismo (Kant): Sintesi ragione-esperienza
- Hegelianismo (Hegel): Processo dialettico

FILOSOFI IMPORTANTI:
- Socrate (470-399 a.C.): Dialogo filosofico
- Platone (428-348 a.C.): Mondo delle idee
- Aristotele (384-322 a.C.): Logica e metafisica
- Descartes (1596-1650): "Cogito ergo sum"
- David Hume (1711-1776): Scetticismo empirista
- Jean-Jacques Rousseau (1712-1778): Contratto sociale
- Immanuel Kant (1724-1804): Categoria imperative
- Friedrich Nietzsche (1844-1900): Volontà di potenza
- Søren Kierkegaard (1813-1855): Esistenzialismo
- Karl Marx (1818-1883): Materialismo storico

CONCETTI FILOSOFICI CHIAVE:
- Libero arbitrio: Abbiamo vera libertà di scelta?
- Realismo: Gli oggetti esistono indipendentemente?
- Verità: Cosa rende vera una proposizione?
- Significato: Come derivano il significato le parole?
- Identità: Cosa ci rende la stessa persona nel tempo?
- Morale: Cosa è bene e cosa è male?
- Conoscenza: Cosa sappiamo realmente?
        `
    },
    'dinosauri': {
        name: 'Dinosauri e Preistoria',
        keywords: ['dinosauro', 'tirannosauro', 'triceratopo', 'estinzione', 'preistorico', 'era mesozoica', 'triassico', 'giurassico', 'cretaceo'],
        description: `
I dinosauri erano rettili dominanti durante l'era mesozoica, estinti 66 milioni di anni fa.

ERA MESOZOICA (252-66 milioni di anni fa):
- Triassico (252-201 m.a.): Primi dinosauri piccoli
- Giurassico (201-145 m.a.): Giganti erbivori
- Cretaceo (145-66 m.a.): Massima diversità

DINOSAURI FAMOSI:
- T-Rex: Carnivoro supremo, 12-15 metri, 9 tonnellate
- Triceratopo: Erbivoro con tre corna
- Bracciosaurus: Sauropo gigante, lungo 30 metri
- Stegosauro: Erbivoro con piastre dorsali
- Ankilosauro: Erbivoro corazzato
- Velociraptor: Piccolo carnivoro veloce
- Spinosaurus: Carnivoro più grande del T-Rex
- Parasaurolophus: Erbivoro con cresta
- Iguanodonte: Erbivoro di medie dimensioni
- Pterodattilo: Rettile volante contemporaneo

ESTINZIONE CRETACEO-PALEOGENO:
- Impatto di asteroide: 10 km colpisce la Penisola dello Yucatán
- Conseguenze: Esplosioni, terremoti, tsunami, inverno nucleare
- Tasso di estinzione: 75% di specie scomparvero
- Sopravvivenza uccelli: Discendono da teropodi

FOSSILI E SCOPERTE:
- Fossilizzazione: Conservazione di resti antichi
- Lucy: Ominide di 3 milioni di anni fa
- Homo erectus: Antenato diretto umano
- Homo neanderthalensis: Specie coesistita con Homo sapiens
        `
    },
    'geografia_mondo': {
        name: 'Geografia del Mondo',
        keywords: ['geografia', 'continente', 'paese', 'città', 'montagna', 'fiume', 'mare', 'clima', 'deserto', 'foresta', 'popolazione'],
        description: `
La geografia studia i luoghi, le persone e le interazioni con l'ambiente.

CONTINENTI:
- Asia: Il continente più grande e popolazione, contiene 60% della popolazione mondiale
- Africa: Secondo continente per grandezza, ricchezza minerale e biodiversità
- Europa: Continente più sviluppato economicamente, origine della civiltà occidentale
- Nord America: Sviluppato economicamente, Stati Uniti e Canada
- Sud America: Ricchezza biologica, Amazzonia, ricchezze minerali
- Oceania: Arcipelaghi e isole nella regione del Pacifico
- Antartide: Continente più freddo, coperto di ghiaccio, ricerca scientifica

OCEANI E MARI:
- Oceano Pacifico: Il più grande, 165 milioni km²
- Oceano Atlantico: Il secondo più grande, separa Europa-Africa da America
- Oceano Indiano: Circonda l'Asia meridionale
- Oceano Artico: Attorno al Polo Nord
- Mar Mediterraneo: Tra Europa-Africa-Asia
- Mar dei Caraibi: Tra Nord-Sud America
- Mar Baltico: Nord Europa
- Mar Nero: Tra Europa-Asia

CATENE MONTUOSE:
- Himalaya: La catena più alta al mondo, contiene l'Everest (8.848 m)
- Ande: La catena più lunga, in Sud America
- Montagne Rocciose: Nord America
- Alpi: Europa centrale
- Urali: Divisione geografica tra Europa e Asia
- Appennini: Italia
- Pirenei: Spagna-Francia

FIUMI IMPORTANTI:
- Nilo: Il fiume più lungo, 6.650 km, Africa
- Amazzoni: Il più largo e volume d'acqua, Sud America
- Yangtze: Il più lungo in Asia, Cina
- Mississippi: Nord America
- Danubio: Europa, passa per 10 paesi
- Volga: Il più lungo in Europa
- Gange: India, sacro all'induismo
- Tigri ed Eufrate: Mesopotamia, Medio Oriente

CLIMI:
- Tropicale: Caldo e umido, attorno all'equatore
- Temperato: Stagioni ben definite, moderate temperature
- Artico: Freddo estremo, Poli
- Desertico: Precipitazioni minime, giornate calde notti fredde
- Oceanico: Moderato, influenzato dagli oceani
- Continentale: Escursioni termiche ampie

BIOMI:
- Foresta pluviale: Ricchezza biologica massima
- Savana: Erbe e alberi sparsi, Africa
- Deserto: Aridità, poca vegetazione
- Praterie: Erbe, pochi alberi, ampie superfici
- Tundra: Freddo estremo, vegetazione scarsa
- Foresta boreale: Conifere, clima freddo
        `
    },
    'storia_moderna': {
        name: 'Età Moderna e Rinascimento',
        keywords: ['storia moderna', 'rinascimento', 'illuminismo', 'rivoluzione', 'guerra', 'impero', 'colonialismo', 'scoperte geografiche'],
        description: `
L'Età Moderna (XV-XVIII secolo) è il periodo di transizione dal Medioevo al mondo contemporaneo.

PERIODI DELL'ETÀ MODERNA:
- Rinascimento (XIV-XVI): Umanesimo, rinascita classica, scoperte artistiche
- Riforma protestante (XVI): Rottura con Chiesa cattolica, Lutero, Calvino
- Controriforma (XVI-XVII): Risposta cattolica, Concilio di Trento
- Assolutismo (XVI-XVIII): Potere centralizzato dei re
- Illuminismo (XVIII): Razionalità, scienza, critica all'autorità

EVENTI STORICI CHIAVE:
- Scoperte geografiche (1492-1520): Colombo, Magellano, Vasco da Gama
- Caduta di Costantinopoli (1453): Fine Impero Bizantino
- Invenzione della stampa (1440): Gutenberg, diffusione conoscenza
- Scoperta dell'America (1492): Colombo raggiunge il Nuovo Mondo
- Riforma protestante (1517): Martino Lutero pubblica 95 tesi
- Rinascimento superiore (1480-1520): Apice dell'arte e cultura
- Conquista dell'Inghilterra (1485): Fine Guerra delle Due Rose
- Reale Accademiae (1662): Fondazione Academy of Sciences

ESPLORATORI E CONQUISTATORI:
- Cristoforo Colombo (1451-1506): Scopritore dell'America
- Bartolomeo Diaz (1450-1500): Capo di Buona Speranza
- Vasco da Gama (1469-1525): Route alle Indie via capo
- Ferdinando Magellano (1480-1521): Primo circumnavigazione
- Hernán Cortés (1485-1547): Conquistatore del Messico
- Francisco Pizarro (1478-1541): Conquistatore del Perù

IMPERI COLONIALI:
- Impero Portoghese: Primo impero ultramarino
- Impero Spagnolo: Domina Nuovo Mondo e Caraibi
- Impero Francese: Acquisisce Canada e territori africani
- Impero Olandese: Commerci asiatici, VOC
- Impero Britannico: Espansione globale nel XVIII secolo

FIGURE IMPORTANTI:
- Enrico VIII (1491-1547): Re Inghilterra, rottura con Roma
- Elisabetta I (1533-1603): Regina Inghilterra, Età d'Oro
- Luigi XIV (1638-1715): Re Sole, assolutismo francese
- Federico il Grande (1712-1786): Re Prussia, illuminismo
- Maria Teresa (1717-1780): Imperatrice Austria, riforme
- Pietro I (1672-1725): Zar Russia, occidentalizzazione
- Caterina la Grande (1729-1796): Imperatrice Russia, illuminismo

GUERRA E CONFLITTI:
- Guerra dei Trent'anni (1618-1648): Devastazione Europa centale
- Pace di Westfalia (1648): Riconosce sovranità stati
- Guerre di religione francesi (1562-1598): Cattolici vs Ugonotti
- Guerra di successione spagnola (1701-1714): Riarrangiamento potenze
- Guerra dei Sette anni (1756-1763): Conflitto globale, Gran Bretagna vince
        `
    },
    'chimica_elementi': {
        name: 'Chimica e Tavola Periodica',
        keywords: ['chimica', 'elemento', 'atomo', 'molecola', 'reazione', 'composto', 'tavola periodica', 'ossigeno', 'idrogeno', 'carbonio', 'azoto'],
        description: `
La chimica è la scienza che studia la materia, le sue proprietà e le reazioni.

TAVOLA PERIODICA:
118 elementi noti organizzati per numero atomico e proprietà chimiche

ELEMENTI PRINCIPALI:
- Idrogeno (H): Elemento più leggero, essenziale per acqua e vita
- Carbonio (C): Base di tutte le molecole organiche
- Azoto (N): Componente aria, proteine e DNA
- Ossigeno (O): Essenziale respirazione, presente acqua
- Fosforo (P): Energia cellulare (ATP), DNA e RNA
- Zolfo (S): Minerali, proteine, aminoacidi
- Calcio (Ca): Ossa e denti
- Ferro (Fe): Emoglobina nel sangue
- Sodio (Na): Elettroliti, sistema nervoso
- Potassio (K): Trasmissione nervosa
- Cloro (Cl): Acido gastrico, equilibrio salini
- Floro (F): Denti, fluoridazione
- Iodio (I): Ormoni tiroidei

GRUPPI DI ELEMENTI:
- Metalli alcalini: Litio, sodio, potassio, cesio (reattivi)
- Metalli alcalinoterrosi: Calcio, magnesio, stronzio
- Metalli di transizione: Ferro, rame, oro, argento, platino
- Non-metalli: Carbonio, azoto, ossigeno, zolfo
- Alogeni: Fluoro, cloro, bromo, iodio
- Gas nobili: Elio, neon, argon, cripto, xeno

LEGAMI CHIMICI:
- Legame covalente: Condivisione elettroni tra atomi
- Legame ionico: Trasferimento elettroni tra atomi
- Legame metallico: Ioni in mare di elettroni
- Legame idrogeno: Attrazione con idrogeno
- Legame di Van der Waals: Forze intermolecolari deboli

REAZIONI CHIMICHE:
- Sintesi: Combinazione di due sostanze in una
- Decomposizione: Rottura in sostanze più semplici
- Sostituzione: Scambio elementi tra composti
- Reazione redox: Scambio di elettroni
- Combustione: Reazione con ossigeno producendo calore
- Neutralizzazione: Acido + Base = Sale + Acqua
- Fermentazione: Reazione anaerobia producendo energia
- Fotosintesi: Luce in energia chimica

ACIDITÀ E pH:
- Acidità: pH da 0-7 (acido)
- Neutralità: pH = 7
- Alcalinità: pH da 7-14 (basico)
- Tamponi: Soluzioni che resistono cambiamenti pH
- Indicatori: Sostanze che cambiano colore con pH
        `
    },
    'sport_olimpico': {
        name: 'Sport e Olimpiadi',
        keywords: ['sport', 'calcio', 'tennis', 'atletica', 'nuoto', 'atletica', 'olimpiadi', 'campionato mondiale', 'calcio', 'pallavolo', 'pallacanestro'],
        description: `
Lo sport è attività fisica competitiva che promuove salute e benessere.

SPORT PRINCIPALI:
- Calcio: Sport squadra più popolare, 22 giocatori (11 per squadra)
- Tennis: Sport individuale con racchetta, giocato su campo
- Pallavolo: Sport squadra con rete, 12 giocatori (6 per squadra)
- Pallacanestro: Sport con palla e canestro, rapido e dinamico
- Nuoto: Movimento in acqua competitivo, varie stili
- Atletica leggera: Corsa, salti e lanci
- Sci: Sport invernale, sci alpino e nordico
- Pattinaggio: Ghiaccio e in linea
- Equitazione: Sport con cavalli
- Boxe: Combattimento con pugni, regole strictly
- Lotta: Combattimento fisico ravvicinato
- Judo: Arte marziale giapponese
- Karate: Arte marziale giapponese con calci e pugni
- Ciclismo: Su strada, pista, montagna
- Canottaggio: Barche a remi su acqua
- Vela: Con barche a vela su acqua

OLIMPIADI:
Competizioni sportive internazionali fondatenel 776 a.C. in Grecia
- Olimpiadi antiche: Competizioni nel santuario di Olimpia
- Rinascita moderna: Pierre de Coubertin, 1896
- Olimpiadi estive: Ogni 4 anni, molteplici discipline
- Olimpiadi invernali: Ogni 4 anni, sport invernali
- Paralimpiadi: Athlete con disabilità fisiche
- Cerimonie: Apertura, competizioni, cerimonia chiusura
- Fiamma olimpica: Accesa all'inizio, spenta al termine
- Anelli olimpici: Simbolo olimpico, 5 continenti
- Medaglie: Oro (1°), Argento (2°), Bronzo (3°)

CAMPIONATI MONDIALI:
- Calcio: FIFA World Cup ogni 4 anni
- Tennis: Grande Slam (Australian Open, Roland Garros, Wimbledon, US Open)
- Atletica leggera: Campionati mondiali ogni 2 anni
- Nuoto: Mondiali ogni 2 anni, Olimpiadi ogni 4
- Sci: Mondiale ogni 2 anni

ATLETE FAMOSE:
- Pelé: Leggenda calcio, tre volte Mondiale
- Diego Maradona: Campione calcio, Argentina 1986
- Cristiano Ronaldo: Giocatore prolifico moderno
- Lionel Messi: Giocatore completist, 8 Palloni d'Oro
- Serena Williams: Campionessa tennis, 23 titoli Grand Slam
- Roger Federer: Campionessa tennis, 20 Grand Slam
- Michael Phelps: Nuotatore Olimpico, 28 medaglie oro
- Usain Bolt: Velocista, record mondiale 100m e 200m
- Muhammad Ali: Pugile leggendario, tre volte campione mondo
- Pelé: Leggenda calcio brasiliano, 3 Mondiali

REGOLE E FAIR PLAY:
- Antidoping: Controlli per evitare sostanze illegali
- Fair play: Spirit di competizione onesta
- Card: Giallo (ammonizione), rosso (espulsione)
- Fuorigioco: Regola nel calcio per lealtà
- Arbitraggio: Ufficiali per faire applicare regole
- Fair point: Rivisione del gol e risultati dubbi
        `
    },
    'religione_mondo': {
        name: 'Religioni del Mondo',
        keywords: ['religione', 'cristianesimo', 'islam', 'ebraismo', 'buddhismo', 'induismo', 'fede', 'dio', 'divinità'],
        description: `
Le religioni sono sistemi di credenze e pratiche condivise da comunità.

RELIGIONI PRINCIPALI:
- Cristianesimo (2,4 mld): Fede in Gesù Cristo, chiesa, bibbia
- Islam (1,9 mld): Fede in Allah, Corano, profeta Muhammad
- Induismo (1,2 mld): Politeismo, karma, reincarnazione, vedas
- Buddhismo (520 milioni): Illuminazione, nirvana, meditazione
- Ebraismo (15 milioni): Torah, Yom Kippur, Pasqua
- Taoismo: Armonia con il Tao
- Confucianesimo: Etica e morale
- Sikhismo (30 milioni): Guru Nanak, monoteismo
- Religio Zoroastriana: Bene vs Male, Persia antica

CONCETTI RELIGIOSI:
- Fede: Credenza nel divino
- Preghiera: Comunicazione con dio
- Meditazione: Pratica contemplativa
- Miracolo: Evento inspiegabile naturalmente
- Setta: Gruppo religioso separato
- Heresis: Insegnamento contrario dottrina
        `
    },
    'informatica_web': {
        name: 'Informatica e Tecnologia Web',
        keywords: ['informatica', 'computer', 'software', 'programmazione', 'web', 'internet', 'database', 'codice', 'algoritmo', 'AI'],
        description: `
L'informatica è la scienza dell'elaborazione automatica dei dati.

COMPONENTI COMPUTER:
- CPU: Processore, cervello del computer
- RAM: Memoria temporanea veloce
- SSD: Storage solido permanente
- GPU: Processore grafico
- Scheda madre: Connette i componenti
- Alimentatore: Fornisce energia

LINGUAGGI DI PROGRAMMAZIONE:
- Python: Versatile, machine learning
- JavaScript: Linguaggio web
- Java: Compilato, portabilità
- C++: Veloce, sistema
- SQL: Database
- R: Analisi dati
- Go: Performance
- Rust: Sicurezza

WEB TECHNOLOGIES:
- HTML: Struttura pagine
- CSS: Styling e design
- HTTP/HTTPS: Protocolli web
- DNS: Traduce nomi in indirizzi IP
- REST API: Interfacce servizi
- WebSocket: Comunicazione real-time

CONCETTI INFORMATICI:
- Algoritmo: Sequenza istruzioni
- Debug: Ricerca errori
- Testing: Verifica correttezza
- Cloud Computing: Calcolo remoto
- Big Data: Analisi dati enormi
- AI: Intelligenza artificiale
- Machine Learning: Algoritmi che imparano
        `
    },
    'ambiente_ecologia': {
        name: 'Ambiente e Ecologia',
        keywords: ['ambiente', 'ecologia', 'sostenibilità', 'inquinamento', 'clima', 'energia rinnovabile', 'CO2', 'biodiversità'],
        description: `
L'ecologia studia relazioni tra organismi viventi e ambiente.

PROBLEMI AMBIENTALI:
- Cambiamento climatico: Riscaldamento globale
- Inquinamento aria: Emissioni auto e fabbriche
- Inquinamento acqua: Plastica, petrolio
- Deforestazione: Perdita foreste
- Perdita biodiversità: Estinzione specie
- Sovrapesca: Pesca eccessiva
- Buco ozono: Diminuzione ozono atmosferico

SOLUZIONI SOSTENIBILI:
- Energie rinnovabili: Solare, eolico, idroelettrico
- Economia circolare: Riduzione, riuso, riciclo
- Agricoltura biologica: Sostenibile, organi biologici
- Trasporti: Veicoli elettrici, biciclette
- Rimboschimento: Piantare alberi per CO2
- Protezione aree: Parchi e riserve

ECOSISTEMA:
- Catena alimentare: Produttori-consumatori
- Rete alimentare: Interconnessioni
- Bioma: Area con clima e flora caratteristici
- Habitat: Ambiente specifico
- Predazione: Un organismo mangia altro
- Simbiosi: Associazione vantaggiosa
- Biodiversità: Varietà specie assolutamente
        `
    },
    'medicina_sanita': {
        name: 'Medicina e Sanità Pubblica',
        keywords: ['medicina', 'malattia', 'farmaco', 'ospedale', 'medico', 'vaccino', 'chirurgia', 'diagnosi', 'epidemia'],
        description: `
La medicina studia le malattie e le loro cura.

SPECIALITÀ MEDICHE:
- Cardiologia: Cuore e circolazione
- Neurologia: Sistema nervoso
- Oncologia: Cancro e tumori
- Chirurgia: Interventi chirurgici
- Pediatria: Bambini
- Geriatria: Anziani
- Psichiatria: Malattie mentali
- Radiologia: Imaging medico

MALATTIE CRONICHE:
- Diabete: Glucosio nel sangue
- Ipertensione: Pressione alta
- Asma: Malattia respiratoria
- Artrite: Infiammazione articolazioni
- Depressione: Disturbo mentale
- Ansia: Apprensione eccessiva

MALATTIE INFETTIVE:
- COVID-19: Pandemia 2019-presente
- Influenza: Virus stagionale
- Tubercolosi: Infezione polmonare
- HIV/AIDS: Immunodeficienza
- Malaria: Parassita zanzare
- Colera: Batterio acquatico
- Morbillo: Virus contagioso

VACCINI:
- COVID-19: mRNA, adenovirus
- Influenzale: Protezione stagionale
- MPR: Morbillo-Parotite-Rosolia
- Varicella: Varicella
- Polio: Quasi eradicato

TRATTAMENTI:
- Farmaci: Molecole terapeutiche
- Antibiotici: Infezioni batteriche
- Antivirali: Infezioni virali
- Chirurgia: Interventi invasivi
- Radioterapia: Raggi per cancro
- Fisioterapia: Rehabilitazione movimento
        `
    },
    'gastronomia': {
        name: 'Gastronomia e Cucina Mondiale',
        keywords: ['cucina', 'cibo', 'ricetta', 'chef', 'piatto', 'gastronomia', 'vino', 'ristorante'],
        description: `
La gastronomia è l'arte della buona cucina e alimentazione.

CUCINE REGIONALI ITALIANE:
- Meridionale: Pasta, pomodoro, aglio, pesce
- Centrale: Pasta uovo, carne
- Settentrionale: Riso, burro, parmigiano
- Siciliana: Fusione araba-normanna
- Toscana: Bistecca, ribollita
- Romana: Cacio e pepe, carbonara
- Veneziana: Risotto, pesce

CUCINE MONDIALI:
- Francese: Raffinata, salse classiche
- Spagnola: Paella, tapas, jamón
- Tedesca: Schnitzel, bratwurst
- Greca: Tzatziki, feta, moussaka
- Turca: Kebab, meze
- Mediorientale: Hummus, falafel
- Indiana: Curry, tandoori, dal
- Tailandese: Tom yum, pad thai
- Giapponese: Sushi, tempura, ramen
- Cinese: Wok, riso, dim sum
- Messicana: Tacos, enchiladas
- Brasiliana: Feijoada, churrasco

INGREDIENTI:
- Olio d'oliva: Grasso Mediterraneo
- Aglio: Aromatizzante
- Pepe: Spezia
- Sale: Conservante
- Riso: Alimento asiatico base
- Pasta: Alimento italiano base
- Pane: Alimento staple

PIATTI FAMOSI:
- Lasagna: Pasta a strati ragù
- Spaghetti carbonara: Pasta, uova, guanciale
- Risotto: Riso mantecato
- Pizza: Pane pomodoro formaggio
- Paella: Riso spagnolo
- Curry: Stufato speziato
- Tacos: Tortilla con filling
- Sushi: Riso e pesce crudo

VINI:
- Rossi: Barolo, Brunello, Rioja
- Bianchi: Sauvignon, Riesling
- Spumanti: Champagne, Prosecco
        `
    },
    'storia_eventi': {
        name: 'Storia Contemporanea e Eventi',
        keywords: ['storia', 'guerra mondiale', 'rivoluzione', 'conflitto', 'guerra fredda', 'vietnam', 'medio oriente', 'terrorismo'],
        description: `
La storia contemporanea copre i principali eventi dal 1900 ad oggi.

CONFLITTI MONDIALI:
- Prima Guerra Mondiale (1914-1918): 17 milioni morti, trincee
- Seconda Guerra Mondiale (1939-1945): 70-85 milioni morti, olocausto
- Guerra Fredda (1947-1991): Tensione USA-URSS, nucleare
- Guerra di Corea (1950-1953): Divisione Nord-Sud
- Guerra del Vietnam (1955-1975): Conflitto USA-Vietnam
- Guerra del Golfo (1990-1991): Iraq invade Kuwait
- Guerre balcaniche (1991-2001): Disgregazione Jugoslavia
- Conflitto medio-orientale: Israele-Palestina, 70 anni
- Guerre in Iraq-Afghanistan: Dopo 11 settembre 2001
- Crisi ucraina: 2014-presente

EVENTI STORICI:
- Rivoluzione Russa (1917): Comunismo bolscevico
- Grande Depressione (1929-1939): Collasso economico
- Ascesa nazismo (1933): Hitler toma potere
- D-Day (1944): Sbarco in Normandia
- Bombe atomiche (1945): Hiroshima e Nagasaki
- ONU fondata (1945): Organizzazione pacifico
- Stato di Israele (1948): Indipendenza
- Blocco Berlino (1948-1949): Crisi fredda
- Rivoluzione Cubana (1959): Castro prende potere
- Crisi missilistica cubana (1962): Nucleare USA-URSS
- Assassinio Kennedy (1963): JFK ucciso
- Uomo sulla Luna (1969): Apollo 11
- Caduta Muro di Berlino (1989): Fine guerra fredda
- Crollo Unione Sovietica (1991): URSS si disintegra
- 11 settembre 2001: Attacchi terroristici USA
- Crisi finanziaria (2008): Collasso mercati
- Primavera araba (2011): Rivolte Nord Africa
- Pandemia COVID-19 (2019-2023): 7 milioni morti
        `
    },
    'arte_moderna': {
        name: 'Arte Moderna e Contemporanea',
        keywords: ['arte', 'arte moderna', 'arte contemporanea', 'pittura', 'scultura', 'installazione', 'artista', 'museo', 'galleria', 'impressionismo', 'cubismo', 'surrealismo'],
        description: `
L'arte moderna e contemporanea rappresentano le evoluzioni artistiche dal 1880 ad oggi.

MOVIMENTI ARTISTICI MODERNI:
- Impressionismo (1870-1900): Monet, Renoir, luce e colore
- Post-impressionismo (1880-1910): Van Gogh, Cezanne
- Fauvismo (1905-1910): Colori saturi, Matisse
- Cubismo (1907-1920): Picasso, forme geometriche
- Futurismo (1909-1944): Velocità, modernità, Marinetti
- Dadaismo (1916-1924): Assurdità, anti-arte, Duchamp
- Surrealismo (1924-1950): Inconscio, sogni, Dalí
- Costruttivismo (1915-1930): Arte politica russa
- De Stijl (1917-1931): Geometria pura, Mondrian
- Bauhaus (1919-1933): Design e arte, Walter Gropius
- Astrattismo (1910-presente): No rappresentazione
- Espressionismo Astratto (1940-1950): Pollock, azione
- Pop Art (1950-1960): Warhol, consumerismo
- Arte Cinetica (1950-1960): Movimento nello spazio
- Minimalismo (1960-1970): Forme semplici
- Arte Concettuale (1960-1970): Idea valore
- Iperrealismo (1960-1970): Dettaglio fotografico
- Street Art (1980-presente): Murales urbani
- Installazione (1970-presente): Esperienza immersiva
- Video Art (1970-presente): Arte con video
- Arte Digitale (1980-presente): Computer e internet

ARTISTI MODERNI CELEBRI:
- Pablo Picasso (1881-1973): Cubismo, Les Demoiselles d'Avignon
- Henri Matisse (1869-1954): Novità, colore, Danza
- Marcel Duchamp (1887-1968): Arte concettuale, Fontana
- Salvador Dalí (1904-1989): Surrealismo, temporalità
- Jackson Pollock (1912-1956): Action painting, spattering
- Andy Warhol (1928-1987): Pop art, Marilyn
- Jean-Michel Basquiat (1960-1988): Neoespressionism, street
- Banksy (1974-presente): Street art politica contemporanea
- Anselm Kiefer (1945-presente): Memoria, storia
- Ai Weiwei (1957-presente): Arte attivismo, arte concettuale

SCULTURA MODERNA:
- Auguste Rodin (1840-1917): Il Pensatore
- Henry Moore (1898-1986): Forme astratte organiche
- Alexander Calder (1898-1976): Mobili, arte cinetica
- Louise Bourgeois (1911-2010): Aracne
- Magdalena Abakanowicz (1930-2021): Teste colossali
        `
    },
    'psicologia_clinica': {
        name: 'Psicologia Clinica e Terapia',
        keywords: ['psicologia clinica', 'terapia', 'terapeuta', 'psicologo', 'depressione', 'ansia', 'disturbo mentale', 'trattamento', 'counseling'],
        description: `
La psicologia clinica diagnostica e tratta i disturbi mentali e comportamentali.

DISTURBI MENTALI PRINCIPALI:
- Depressione maggiore: Umore persistentemente depresso
- Disturbo bipolare: Cicli mania-depressione
- Ansia generalizzata: Preoccupazione eccessiva persistente
- Attacchi di panico: Paura intensa improvvisa
- Fobia specifica: Paura irrazionale di oggetto/situazione
- Agorafobia: Paura di spazi pubblici
- Disturbo ossessivo-compulsivo: Ossessioni e compulsioni
- PTSD: Trauma grave e reazioni
- Schizofrenia: Allucinazioni, delusioni, disorganizzazione
- Disturbo borderline: Relazioni instabili, rabbia
- Disturbo narcisistico: Esibizionismo, mancanza empatia
- Disturbo antisociale: Violazione diritti altrui
- Disturbi alimentari: Anoressia, bulimia, binge eating
- Dipendenza: Droga, alcol, gambling
- ADHD: Deficit attenzione, iperattività
- Autismo: Difficoltà interazione sociale, interessi ristretti
- Disturbo dissociativo: Frammentazione coscienza

PSICOTERAPIE PRINCIPALI:
- Terapia cognitivo-comportamentale (TCC): Cambia pensiero-comportamento
- Psicoanalisi: Freud, inconscio, transfert
- Psicodynamica: Versione moderna psicoanalisi
- Umanistica: Rogers, congruenza, empatia
- Comportamentale: Condizionamento, rinforzi
- Gestalt: Consapevolezza, esperienza presente
- Sistemica familiare: Dinamica famiglia
- EMDR: Desensibilizzazione movimento oculare
- Mindfulness: Consapevolezza meditazione
- DBT: Dialettica comportamentale terapia
- Psicodrammatica: Dramatizzazione e scena

FARMACI PSICHIATRICI:
- Antidepressivi SSRI: Serotonina (fluoxetina, paroxetina)
- Antidepressivi triciclici: Azione assai diversa
- IMAO: Inibitori monoamino ossidasi
- Antipsicotici: Neurolettici (aloperidolo, risperidone)
- Ansiolitici: Benzodiazepine (diazepam, alprazolam)
- Stabilizzanti umore: Litio, acido valproico
- Stimolanti: ADHD (metilfenidato, anfetamina)
- Sonniferi: Ipnotici (zolpidem, zaleplon)
- Antiepiletici: Psichiatria off-label
- Barbiturici: Sedativi (ormai obsoleti)

TECNICHE TERAPEUTICHE:
- Ipnosi: Stato alterato suggestibile
- Rilassamento: Tecniche stress reduction
- Biofeedback: Monitor funzioni corpo
- Esposizione: Affrontare gradualmente paure
- Desensibilizzazione sistematica: Scala ansia
- Ristrutturazione cognitiva: Sfida pensieri disadattivi
- Assertività: Espressione asserzioni diretta
- Problem-solving: Strategia risoluzioni problemi
- Metafore terapeutiche: Insegnamento indiretto
        `
    },
    'fisica_quantistica': {
        name: 'Fisica Moderna e Quantistica',
        keywords: ['fisica', 'quantistica', 'fisica moderna', 'particella', 'energia', 'relatività', 'einstein', 'fotone', 'atomo', 'nucleo', 'meccanica quantistica'],
        description: `
La fisica moderna studia il comportamento della materia a piccole e grandi scale.

RIVOLUZIONE QUANTISTICA:
- Max Planck (1900): Quantizzazione energia
- Albert Einstein (1905): Relatività speciale, E=mc²
- Niels Bohr (1913): Modello atomico
- Werner Heisenberg (1927): Principio incertezza
- Erwin Schrödinger (1926): Equazione onda
- Paul Dirac (1928): Antimateria
- Wolfgang Pauli (1925): Principio esclusione

CONCETTI CHIAVE:
- Quanti: Particelle elementari di energia
- Fotone: Particella di luce
- Elettrone: Particella carica negativa
- Protone: Particella carica positiva
- Neutrone: Particella neutra nel nucleo
- Nucleo: Centro denso dell'atomo
- Orbita: Percorso particella attorno nucleo
- Superposizione: Stato multiplo simultaneamente
- Entanglement: Correlazione quantistica

RELATIVITÀ:
- Relatività speciale (1905): Velocità luce costante
- Dilatazione temporale: Tempo scorre diversamente per velocità
- Contrazione lunghezza: Lunghezza ridotta ad alta velocità
- Equivalenza massa-energia: E=mc²
- Relatività generale (1915): Gravità come curvatura spazio
- Buco nero: Curvatura infinita spazio-tempo
- Onda gravitazionale: Increspatura spazio-tempo

FISICA NUCLEARE:
- Fissione: Rottura nucleo liberando energia
- Fusione: Unione nuclei liberando energia
- Radioattività: Emissione particelle da nuclei instabili
- Reazioni nucleari: Trasmutazione elementi
- Energia nucleare: Centrali nucleari
- Bomba atomica: Fissione incontrollata
- Acceleratore particelle: Macchinari ricerca

PARTICELLE ELEMENTARI:
- Quark: Costituenti protoni e neutroni
- Gluone: Particella forza nucleare
- Bosone W e Z: Forza debole
- Fotone: Forza elettromagnetica
- Gravitone: Teorico, gravità (non scoperto)
- Particella di Higgs: Dà massa alle particelle

STANDARD MODEL:
Unifica tre delle quattro forze fondamentali:
1. Forza nucleare forte
2. Forza nucleare debole
3. Forza elettromagnetica
4. Gravità (non ancora unificata)
        `
    }
};

// Rendi disponibile globalmente per i moduli
window.teslaKnowledgeBase = teslaKnowledgeBase;

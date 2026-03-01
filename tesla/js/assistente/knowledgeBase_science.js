// Knowledge Base - Scienze e Tecnologia Avanzata
// Database locale con scienze, tecnologie, innovazioni

const scienceKnowledge = {
    'fisica_nucleare': {
        name: 'Fisica Nucleare e Particelle',
        keywords: ['fisica nucleare', 'particella', 'quark', 'protone', 'neutrone', 'fissione', 'fusione', 'radioattività'],
        description: `La fisica nucleare studia il nucleo atomico e le reazioni nucleari.

PARTICELLE ELEMENTARI:
- Quark: Up, Down, Charm, Strange, Top, Bottom
- Leptoni: Elettrone, muone, tau, neutrini
- Bosoni di gauge: Fotone, bosone W, bosone Z, gluone
- Bosone di Higgs: Particella che dà massa
- Antiparticelle: Antielettroni, antiprotoni

REAZIONI NUCLEARI:
- Fissione: Splitting nuclei pesanti (Uranio-235, Plutonio-239)
- Fusione: Combinazione nuclei leggeri (idrogeno → elio)
- Decadimento beta: Emissione di particelle beta
- Decadimento alfa: Emissione di particelle alfa (elio)
- Decadimento gamma: Emissione di raggi gamma
- Reazioni termonucleari: Fusione con calore intenso

APPLICAZIONI:
- Centrali nucleari: Fissione controllata per energia
- Bombe atomiche: Fissione incontrollata
- Bomb alle idrogeno: Fusione termonucleare
- Acceleratori di particelle: LHC, CERN, ricerca fondamentale
- Medicina nucleare: PET, SPECT, radioterapia
- Datazione radiometrica: Carbonio-14, decadimento
- Armi nucleari: Deterrenza strategica

SCOPERTE STORICHE:
- J.J. Thomson (1897): Scoperta elettrone
- Ernest Rutherford (1911): Modello nucleare dell'atomo
- Niels Bohr (1913): Modello atomico con orbite quantizzate
- James Chadwick (1932): Scoperta neutrone
- Enrico Fermi (1938): Fissione nucleare primo riconosciuto
- Team di Los Alamos (1945): Progetto Manhattan, bombe atomiche
        `
    },
    'astrofisica': {
        name: 'Astrofisica e Cosmologia',
        keywords: ['astrofisica', 'stella', 'buco nero', 'materia oscura', 'radiazione cosmica', 'universo primordiale'],
        description: `L'astrofisica studia le proprietà fisiche di corpi celesti e universo.

EVOLUZIONE STELLARE:
- Sequenza principale: Stelle funzionano con fusione idrogeno
- Gigante rossa: Stella espande dopo esaurimento H
- Nova: Esplosione termonucleare su nana bianca
- Supernova: Esplosione catastrofica brillantissima
- Pulsar: Stella neutroni in rotazione rapida
- Magnetar: Pulsar con magnetismo estremo
- Buco nero: Singolarità con gravità infinita

COSMOLOGIA:
- Universo stazionario (falsificato): Universo eterno e immutato
- Big Bang: Universo inizia da singolarità 13,8 miliardi anni fa
- Nucleosintesi primordiale: Formazione elementi leggeri nei primi minuti
- Ricombinazione: Atomi primi 380,000 anni dopo Big Bang
- Età oscura: Prima stelle si accendono (100-180 milioni anni)
- Reionizzazione: Prime stelle ionizzano idrogeno neutro
- Era strutturale: Galassie si formano da fluttuazioni densità

OSSERVAZIONI:
- Redshift cosmologico: Universo si espande
- Fondo a microonde cosmico (CMB): Radiazione 2.7K da BBQ
- Onde gravitazionali: Increspature spazio-tempo da LIGO
- Supernove di tipo Ia: Candele standard per distanza cosmiche
- Rotazione galassie: Evidenza materia oscura

MISTERI NON RISOLTI:
- Materia oscura: 85% della materia, invisibile
- Energia oscura: 68% universo, causa espansione accelerata
- Fine-tuning: Costanti fisiche perfettes per vita
- Paradosso di Olbers: Perché universo non è infinitamente brillante?
- Singolarità: Cosa succede all'interno buchi neri?
        `
    },
    'nanotecnologia': {
        name: 'Nanotecnologia e Materiali',
        keywords: ['nanotecnologia', 'nanoparticella', 'grafene', 'nanobot', 'materiale intelligente', 'nanomedicina'],
        description: `La nanotecnologia manipola materia a scala nanometrica (1-100 nm).

NANOMATERIALI:
- Grafene: Foglio singolo atomi carbonio, superconduttore
- Nanotubi di carbonio: Strutture tubolari ultra-resistenti
- Fullereni: Molecole carbonio sferiche tipo calcio
- Quantum dots: Particelle semiconduttore minuscole
- Aerogel: Materiale ultra-leggero poroso
- Metamateriali: Proprietà non trovate in natura

APPLICAZIONI:
- Nanomedicina: Nanoparticelle per drug delivery
- Nanoelettronica: Transistor più piccoli per chip
- Fotovoltaico nanometrico: Celle solari efficienti
- Nanofiltrazione: Acqua ultra-pura
- Nanocompositi: Materiali con proprietà migliorate
- Cosmetica nanotech: Creme con nanoparticelle
- Tessuti nanotech: Vestiti con proprietà speciali

SFIDE:
- Tossicità nanoparticelle: Effetti sulla salute non completamente noti
- Costi di produzione: Elevati per applicazioni su massa
- Regolamentazione: Criteri di sicurezza ancora in sviluppo
- Etica: Rischi di abuso biotecnologico

PROSPETTIVE FUTURE:
- Assemblatori molecular: Costruire strutture atom-by-atom
- Nanorobot: Microbot per chirurgia e riparazione
- Computer quantici: Usando principi nanotecnologia
- Energia infinita: Nanomateriali per raccolta solare totale
        `
    },
    'biotecnologia': {
        name: 'Biotecnologia e Ingegneria Genetica',
        keywords: ['biotecnologia', 'DNA', 'geni', 'CRISPR', 'clonazione', 'ingegneria genetica', 'biorisorse'],
        description: `La biotecnologia usa organismi viventi per applicazioni tecnologiche.

TECNOLOGIE GENETICHE:
- PCR: Polymerase chain reaction, copia DNA
- Sequenziamento DNA: Decodificazione genomica
- CRISPR-Cas9: Gene editing rivoluzionario preciso
- TALENs: Nucleasi per modificazione genetica
- Mutagenesi: Generazione mutazioni controllate
- Clonazione: Riproduzione genetica identica
- Trasgenica: Inserimento geni da altre specie
- Terapia genica: Correzione geni malfunzionanti

APPLICAZIONI MEDICHE:
- Vaccini mRNA: Istruzioni genetiche per immune
- Immunoterapia: Potenziamento sistema immunitario
- Medicina personalizzata: Trattamento basato genetica
- Terapia cellulare: Usa cellule per curare
- Rigenerazione tessuti: Crescita organi lab
- Cura malattie genetiche: Distrofia muscolare, emofilia

AGRICOLTURA GENETICA:
- Colture OGM: Resistenza pesticidi e malattie
- Alimenti biofortificati: Arricchiti nutrienti
- Animali transgenici: Mucche più productive
- Sviluppo sostenibile: Meno acqua e fertilizzanti

BIOFUELs:
- Bioetanolo: Da microrganismi e piante
- Biodiesel: Da alghe e oli vegetali
- Biogas: Da rifiuti organici
- Idrogenazione biologica: Produzione H2 sostenibile

BIOINFORMATICA:
- Genomica computazionale: Analisi sequenze
- Proteomica: Studio proteine
- Metabolomica: Studio metaboliti
- Modellazione biologica: Simulazioni sistemi biologici
        `
    },
    'intelligenza_artificiale': {
        name: 'Intelligenza Artificiale e Machine Learning',
        keywords: ['AI', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'algoritmo', 'ChatGPT', 'LLM'],
        description: `L'AI è la capacità di macchine di imitare intelligenza umana.

TIPI DI AI:
- AI stretta (Narrow AI): Intelligenza specializzata compito specifico
- AI generale (AGI): Intelligenza equivalente umana (teorica)
- AI super (ASI): Intelligenza superiore umana (speculativa)
- Simbolica: Logica e regole esplicite
- Subsimbolica: Reti neurali e apprendimento

MACHINE LEARNING:
- Apprendimento supervisionato: Training su dati etichettati
- Apprendimento non supervisionato: Scoperta pattern senza etichette
- Reinforcement learning: Apprendimento da ricompense-penalità
- Transfer learning: Riuso modelli per nuovi compiti
- Few-shot learning: Apprendimento da pochi esempi
- Zero-shot learning: Generalizzazione a categorie mai viste

DEEP LEARNING:
- Reti neurali artificiali: Mimano neuroni del cervello
- Convolutional neurali (CNN): Elaborazione immagini
- Recurrent neurali (RNN): Sequenze temporali
- Transformer: Attenzione meccanismo rivoluzionaria
- Autoencoder: Compressione non supervisionata
- Generative adversarial networks (GAN): Generazione dati

APPLICAZIONI ATTUALI:
- Visione artificiale: Riconoscimento immagini, facial recognition
- Elaborazione linguaggio naturale (NLP): Comprensione testo
- Large Language Models (LLM): ChatGPT, Claude, GPT-4
- Raccomandazioni: Netflix, Amazon, Spotify
- Veicoli autonomi: Auto senza guidatore
- Medicina diagnostica: Analisi radiologiche, predict malattie
- Ricerca scientifica: Scoperte proteiche, Drug discovery
- Robotica: Automazione industriale e domestica

SFIDE ETICHE:
- Bias algoritmico: Discriminazione nei decisioni AI
- Privacy: Raccolta dati massicci
- Disoccupazione: Automazione sostituisce lavori
- Autonomia killer robot: Armi AI decentralizzate
- Controllabilità: Assicurare AI rimane sottocrontrollo umano
- Trasparenza: Black box decisioni AI
- Responsabilità legale: Chi è colpevole se AI causa danno?

FUTURO:
- AGI: Intelligenza generale artificiale (10-50 anni ipotesi)
- Superintelligenza: AI superiore all'intelligenza umana
- Singularità technologica: Punto di non ritorno
- MindUpload: Trasferimento coscienza in computer
- Coevoluzione: Umani e AI insieme
        `
    },
    'quantum_computing': {
        name: 'Quantum Computing e Computazione Quantistica',
        keywords: ['quantum computing', 'qubit', 'quantum entanglement', 'quantum gat', 'quantum algoritmo', 'superposition'],
        description: `I computer quantici usano principi meccanica quantistica per computazione.

FONDAMENTI QUANTISTICI:
- Qubit: Unità quantica (combinazione 0 e 1 contemporaneamente)
- Superposizione: Qubit può essere 0, 1 o entrambi
- Entanglement: Correlazione quantistica tra qubit
- Interferenza: Amplificazione risposte corrette
- Misurazione: Collasso stato quantico
- Decoherence: Perdita proprietà quantiche

PORTE QUANTICHE:
- Hadamard: Crea superposizione
- CNOT: Porta controllata NOT
- Toffoli: Porta quantica reversibile universale
- Pauli X, Y, Z: Rotazioni base
- Phase gate: Modifica fase

ALGORITMI QUANTICI:
- Algoritmo Shor: Fattorizzazione efficiente (rischio crittografia)
- Algoritmo Grover: Ricerca veloce in database non ordinato
- Variational Quantum Eigensolver (VQE): Chimici quantistici
- Quantum Approximate Optimization Algorithm (QAOA): Ottimizzazione
- Quantum Machine Learning: ML con computer quantici

IMPLEMENTAZIONI FISICHE:
- Qubit superconduttivi: Attualmente più avanzati (IBM, Google)
- Ioni intrappolati: Accuratezza alta, scaling complesso
- Fotoni: Qubit di luce, scalabilità promettente
- Nuclei atomici: Risonanza magnetica nucleare
- Anyon topologico: Teorico, immunità errori

SFIDE:
- Decoherence: Perdita informazione quantica rapidamente
- Errori qubit: Frazioni percento fedeltà
- Cooling: Necessario raffreddamento vicino zero assoluto
- Scaling: Aumentare numero qubit difficile
- Classicità: Simulare quantico classicamente ancora possibile fino certo punto

APPLICAZIONI FUTURE:
- Droga discovery: Simulazione molecole complesse
- Ottimizzazione finanziaria: Portfolio management
- Machine Learning quantico: Modelli ibridi
- Simulazione fisica: Comportamento materiali
- Crittografia quantica: Comunicazione theoretically inviolabile
- Teleportazione: Trasferimento stato quantico

COMPUTER QUANTICI ATTUALI:
- IBM Quantum: Cloud access simulator
- Google Sycamore: 53 qubit, dimostrazione supremazia quantica
- IonQ: Ioni intrappolati commerciale
- Rigetti: Ibrido quantico-classico QPU
- D-Wave: Annealing quantico specializzato
        `
    },
    'neuroscienze': {
        name: 'Neuroscienze e Cervello Umano',
        keywords: ['neuroscienze', 'cervello', 'neurone', 'sinapsi', 'neuroplasticità', 'neurochemistry', 'coscienza'],
        description: `Le neuroscienze studiano il sistema nervoso e cervello.

ANATOMIA CEREBRALE:
- Corteccia cerebrale: Materia grigia, pensiero e elaborazione
- Talamo: Stazione ripetitore sensoriale
- Ippocampo: Formazione memoria
- Amigdala: Emozioni e paura
- Cerebelletto: Coordinazione e equilibrio
- Lobi cerebrali:
  - Frontale: Decisioni, linguaggio, controllo motore
  - Parietale: Sensazioni, spazio
  - Temporale: Memoria, audio
  - Occipitale: Visione

CELLULE NEURALI:
- Neuroni: 86 miliardi nel cervello
- Glia: Cellule supporto
- Sinapsi: Connessioni tra neuroni
- Neurotrasmettitori: Serotonina, dopamina, acetilcolina, GABA, glutammato
- Potenziale azione: Propagazione segnale neuronale
- Plasticità sinaptica: Fortifica o debolisce connessioni

PROCESSI COGNITIVI:
- Coscienza: Consapevolezza soggettiva (ancora mistero)
- Attenzione: Focalizzazione su informazioni rilevanti
- Memoria: Codificazione, immagazzinamento, recupero
- Apprendimento: Cambiamenti permanenti da esperienza
- Riconoscimento: Identificazione pattern
- Ragionamento: Pensiero logico e deduzione
- Immaginazione: Creazione scenari mentali

NEUROPLASTICITÀ:
- Neurogenesi: Formazione nuovi neuroni (ippocampo)
- Sinaptogenesi: Creazione nuove sinapsi
- Mielinizzazione: Isolamento assone per velocità
- Remappaggio: Riorganizzazione funzione cerebrale
- Recupero post-trauma: Neuroplasticità per riabilitazione
- Esercizio mentale: Allenamento neuronale

NEUROTRASMETTITORI:
- Serotonina: Umore, regolazione sonno, appetito
- Dopamina: Motivazione, piacere, movimento
- Noradrenalina: Vigilanza e attenzione
- Acetilcolina: Memoria e apprendimento
- GABA: Inibizione, ansia
- Glutammato: Eccitazione, aprendimento
- Ossitocina: Bonding sociale, fiducia
- Vasopressina: Memoria, aggressività

TECNICHE DI IMAGING:
- PET: Positron emission tomography, metabolismo
- fMRI: Functional MRI, attività cerebrale
- EEG: Electroencephalography, attività elettrica
- MEG: Magnetoencephalography, campi magnetici
- SPECT: Flusso sanguigno cerebrale
- OCT: Optical coherence tomography, risoluzione alta

DISORDINI E CONDIZIONI:
- Alzheimer: Neurodegenerazione progressiva
- Parkinson: Movimento disordine da perdita dopamina
- Schizofrenia: Disturbo psichiatrico profondo
- Depressione: Desequilibrio neurochimico
- Autismo: Neurospettro, sviluppo atipico
- Dislessia: Difficoltà lettura genetica
- Coma: Perdita coscienza prolungata
- Stroke: Interruzione flusso sanguigno cerebrale

FUTURE FRONTIERS:
- Brain-computer interfaces: Controlllo mente-macchina
- Neuroimaging avanzato: Ultra-risoluzione
- Farmaci neurodegenerativi: Cure Alzheimer
- Stimolazione profonda cervello: Terapia parkinson
- Mind uploading: Trasferimento coscienza (teorico)
        `
    },
    'energia_futura': {
        name: 'Energia del Futuro e Fonti Sostenibili',
        keywords: ['energia', 'energia rinnovabile', 'solare', 'eolico', 'fusione nucleare', 'idrogeno verde', 'energia pulita'],
        description: `Le tecnologie energetiche sostenibili per il futuro dell'umanità.

ENERGIE RINNOVABILI ATTUALI:
- Solare fotovoltaico: Luce direttamente in elettricità
- Solare termico: Luce in calore per acqua
- Eolico onshore: Vento su terra
- Eolico offshore: Vento in mare (più efficiente)
- Idroelettrico: Acqua che cade genera energia
- Geotermico: Calore dal sottosuolo
- Biomassa: Combustione materia organica
- Maremotrix (tide): Energia marea oceanica
- Wave: Energia onde oceaniche

TECNOLOGIE EMERGENTI:
- Fusione nucleare: Reactor commerciali (Commonwealth Fusion, ITER)
- Economia idrogeno: H2 come vettore energetico
- Celle a combustibile: H2 → Energia + Acqua
- Batterie avanzate: Litio-aria, stato solido, flusso
- Superconduttori ad alta T: Trasmissione zero-perdita
- Accumulo energetico: Batterie giganti, aria compressa

PROGETTI FUTURISTICI:
- Satellite solare: Pannelli nello spazio mittono energia
- Centrale geotermica gigante: Trivelle profondissime
- Nuclear fusion DEMO: ITER francese, 50x gain energetico
- Tokamak commerciale: Commonwealth Fusion 2025
- Batteri biologici: Batterio fotosintesi artificiale
- Zero point energy: Teoria estrazione vuoto quantico

STOCCAGGIO ENERGIA:
- Batterie Li-ion: Attuali, densità energetica buona
- Batterie all-solid-state: Futura 2025-2030
- Idrogeno verde: Da energia rinnovabile + acqua
- Aria compressa: Accumulo meccanico
- Gravità: Caduta blocchi su torre
- Flywheel: Rotazione a velocità ultra-alta
- Molten salt: Sali fusi per calore storage

EFFICIENZA ENERGETICA:
- Illuminazione LED: 90% meno energia lampadine
- Edifici smart: Controllo temperatura automatico
- Motori ibridi/elettrici: Efficienza 85-90% vs 25-30% benzina
- Isolamento termico: Ridurre perdite di calore
- Smart grid: Distribuzione elettricità intelligente
- Riciclo calore: Recuperare energia dispersa

SCENARIO ENERGETICO 2050:
- 80% energia da rinnovabili
- Transizione idrogeno per industria pesante
- Fusione nucleare commerciale maatura
- Rete energetica globalizzato interconnesso
- Emissioni CO2 quasi zerizzate
- Abbondanza energetica eliminà povertà energetica
        `
    },
    'biologia_marina': {
        name: 'Biologia Marina e Oceani',
        keywords: ['oceano', 'mare', 'biologia marina', 'corallo', 'balena', 'pesce', 'ecosistema marino', 'abissi'],
        description: `La biologia marina studia la vita negli oceani e ambienti acquatici.

ZONE OCEANICHE:
- Epipelagica (Zona di luce): 0-200m, dove sole penetra
- Mesopelagica (Crepuscolo): 200-1000m, poca luce
- Batiabisale: 1000-4000m, completa oscurità
- Abissale: 4000-6000m, pressione estrema
- Adiabisale: >6000m, Fosse Marianna

ORGANISMI MARINI PRINCIPALI:
- Fitoplancton: Piante marine microscopiche, base catena
- Zooplancton: Animali marini microscopici
- Copepodi: Crostacei più abbondanti terra
- Krill: Gamberetti, cibo balene
- Pesci: 30,000 specie, 99% biodiversità marina
- Molluschi: Calamari, polpi, vongole
- Crostacei: Granchi, aragoste, gamberetti
- Echinodermi: Stelle marine, ricci di mare
- Coralli: Animali coloniali, emisferi costruttori
- Squali: Predatori apex, poco studiati
- Cetacei: Balene, delfini, capodogli

ECOSISTEMI MARINI:
- Barriera corallina: Biodiversità massima marina
- Foresta kelp: Alghe giganti, comunità ricca
- Praterie posidonia: Fanerogame marine, nursery
- Mangrovie: Alberi costieri, riproduzione pesci
- Sorgenti idrotermali: Microbi chemosintesi, ecosistema estremo
- Zone morte costali: Anossia da inquinamento

ADATTAMENTI ESTREMI:
- Bioluminescenza: Luce generata organismi
- Gigantismo abissale: Creature enormi in profondità
- Colonna d'acqua: Galleggiamento neutro
- Compressione profonda: Protezione pressione
- Metabolismo lentissimo: Conservare energia
- Visione estesa: Occhi giganti per catturare poca luce

MIGRAZIONE MARINA:
- Balena grigia: 12,000 km migrazione annuale
- Anguilla europea: Nascita Sargassos, ritorno Europa
- Tartaruga marina: 1000+ km oceanica
- Salmone: Ritorno fiume natale per riproduzione
- Carrucci: Migrazioni verticali giornaliere

MINACCE OCEANICHE:
- Sovrapesca: Deplezione stock ittici
- Inquinamento plastica: 8 milioni tonnellate/anno
- Acidificazione: CO2 assorbita cambia chimica
- Riscaldamento: Coralli sbiancamento
- Eutrofizzazione: Alghe bloom tossiche
- Inquinamento sonoro: Rotta balene
- Pesca illegale: Specie minacciate
- Shipping: Noduli polimetallic estrazione

RICERCA FRONT-TIER:
- Genomica marina: Sequenziamento specie nuove
- Intelligenza cetacei: Comunicazione balene
- Epigenetica marina: Adattamento veloce
- Bioprospecting: Farmaci da organismi marini
- Allevamento sostenibile: Acquacoltura green
- Restoration ecologica: Recupero barriere coralline
        `
    }
};

// Esporta e rendi globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = scienceKnowledge;
}
window.scienceKnowledge = scienceKnowledge;

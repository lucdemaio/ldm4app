// Knowledge Base - Tecnologia e Informatica
// Database locale con computer programmazione internet reti AI

const technologyKnowledge = {
    'informatica_fondamenti': {
        name: 'Informatica e Fondamenti Computazionali',
        keywords: ['informatica', 'computer', 'algoritmo', 'programmazione', 'software', 'hardware', 'bit', 'byte', 'processore'],
        description: `L'informatica studia computazione algoritmi software sistemi informazione.

STORIA DELL'INFORMATICA:
- Macchina Turing (1936): Modello computazione universale teoria
- Colossus (1943): Primo computer elettronico Brittanico crittografia
- ENIAC (1945): Primo computer moderno USA valvole gigantesco
- IBM System/360 (1964): Mainframe commerciale standardizzazione
- Personal Computer (1970s): Apple Commodore IBM democratizzazione
- Microprocessore Intel: 4004 8086 i386 Pentium progresso
- Smartphone Era (2000+): Mobile computing ubiquitous
- Cloud Computing: Server remoto storage scalabilità ondemand
- AI Deep Learning: Reti neurali trasformer LLM moderna

ARCHITETTURA COMPUTER:
- Processore CPU: Unità centrale elaborazione calcolo istruzioni
  · Core: Nucleo elaborazione parallela multitask
  · Cache: Memoria veloce intermedia accesso
  · Clock: Frequenza sincronia cicli al secondo GHz
  · Instruction Set: Assembly istruzioni basso livello

- Memoria:
  · RAM: Volatile veloce lettura scrittura accesso casuale
  · ROM: Permanente startup BIOS firmware
  · Disco Rigido SSD: Persistente storage velocità rotazione
  · Cache L1/L2/L3: Livelli velocità vicinanza core

- Bus Comunicazione:
  · FSB Front Side Bus: Processore memoria comunicazione
  · PCIe: Schede espansione grafica rete veloce
  · USB: Universale seriale periferico plug-play
  · SATA: Disco di archiviazione collegamento

- Alimentazione Raffreddamento:
  · Power Supply: Tensione stabile distribuzione
  · Ventilatori: Dissipazione termica processore grafica
  · Radiatori: Trasferimento calore acqua aria
  · Thermals: Paste pasta calore conduttibe

SISTEMI OPERATIVI:
- Windows: Microsoft predominante desktop business
  · Versioni: 95 98 2000 XP Vista 7 8 10 11
  · Architettura: kernel registro driver file system
  · GUI: Interfaccia grafica windows menu desktop

- Linux: Open source kernel Linus Torvalds libero
  · Distribuzioni: Ubuntu Debian Fedora CentOS Alpine
  · Filosofia: Modulare componibile transparent
  · Shell Bash: Command line terminale programmazione

- macOS: Apple Unix-based elegante integrazione hardware
  · Versioni: 10.x Big Sur Monterey Ventura Sonoma
  · Darwin kernel: Mach microkernel BSD componenti
  · Walled Garden: Controllo software sicurezza privacy

- Smartphone OS:
  · Android: Google APK Linux kernel open source
  · iOS: Apple proprietario UX design chiuso
  · Comparison: Market share feature sicurezza modello

PROGRAMMAZIONE LINGUAGGI:
- Linguaggi Imperativo:
  · C: Procedure parsimonia performance sistema
  · C++: Orientato oggetti estensione C moderato
  · Java: Platform agnostico JVM garbage collection
  · Python: Interpretato semplice readabilità prolifero
  · C#: Dotnet Microsoft enterprise Windows

- Linguaggi Funzionali:
  · Lisp Scheme: Simboli metaprogramming Turing equabilità
  · Haskell: Puro lazy evaluation tipato fortemente
  · Erlang: Concorrente tolleranza guasto telecomunicazioni
  · Clojure: Immutabilità JVM funzionale moderna

- Linguaggi Web:
  · JavaScript: Browser client side DOM manipulation
  · TypeScript: Tipato superset JavaScript type safety
  · PHP: Server-side backend web dinamico
  · Ruby: Elegant conciso produttività web rails
  · Go: Concorrente semplice compilato moderno
  · Rust: Sicurezza memoria performance sistema moderno

- Paradigmi Programmativo:
  · Imperativo: Sequenza istruzioni modifica stato
  · Dichiarativo: Risultato desiderato non come
  · Procedura Strutturato: Funzioni loop condizioni
  · Orientato Oggetto: Classi ereditarietà polimorfismo
  · Funzionale: Funzioni pure no effetti laterali
  · Logica: Predicati query inference Prolog

STRUTTURE DATI ALGORITMI:
- Array Lista: Indexato sequenza ordinata
- Hashmap Dizionario: Key-value pari veloce lookup
- Albero Grafo: Nodo gerarchia connessione relazione
- Stack Coda: LIFO FIFO stack queue
- Heap Priorità: Albero binario elemento priority
- Set Insieme: Elemento unico senza duplicato
- Linked List: Nodo puntatore catena dinamica

- Algoritmi Sorteggio:
  · Bubble Sort: Simple O(n2) swap vicini
  · Insertion Sort: Costruisci ordinato incrementale
  · Merge Sort: Divide conquer O(n log n) stabil
  · Quick Sort: Pivot partizione probabilistico
  · Heap Sort: Heap struttura O(n log n) in-place
  · Counting Sort: Conteggio valore speciale O(n)

- Ricerca Algoritmi:
  · Linear Search: Sequenziale semplice O(n)
  · Binary Search: Dividi ordinato O(log n) veloce
  · Depth First: Graph traversal stack profondità
  · Breadth First: Livello graph queue ampiezza
  · Dijkstra: Cammino più breve ponderato

- Dynamic Programming:
  · Fibonacci: Sottocompilare riuso memorizzazione
  · Knapsack: Ottimale sottoserie riempimento
  · Floyd Warshall: Cammino breve tutti paia
  · Edit Distance: String somiglianza paragone

BASI DATI:
- Relazionali:
  · SQL: Structured query language tabelle relazioni
  · MySQL: Open source database popolare web
  · PostgreSQL: Avanzate feature ACID open source
  · Oracle: Enterprise database commerciale scale
  · SQL Server: Microsoft Windows integration

- NoSQL:
  · MongoDB: Documento JSON flessibile schema
  · Redis: Chiave valore memoria veloce cache
  · Cassandra: Distribuito colonna NoSQL scala
  · DynamoDB: AWS proprietario serverless
  · Elasticsearch: Document ricerca indice full text

- Query Manipolazione:
  · SELECT: Retrieval colonne filtri join
  · INSERT UPDATE DELETE: Creazione modifica cancellazione
  · Index: Velocizzazione ricerca B-tree hash
  · Trigger Stored Procedure: Automazione logica database
  · Transaction ACID: Consistenza affidabilità

ARCHITETTURA SOFTWARE:
- Design Patterns:
  · Singleton: Una istanza sola globale
  · Factory: Creazione oggetto dinamica
  · Observer: Notifica cambiamento evento
  · Strategy: Algoritmo intercambiabile
  · MVC: Modello vista controller separazione
  
- Architetture:
  · Monolitica: Singola applicazione deployment
  · Microservizi: Piccolo indipendente scalabile
  · Serverless: Funzione evento-driven infrascruttura
  · Client-Server: Centralizzato richiesta-risposta
  · Peer-to-Peer: Distribuito nodo nodo

- Metodologie:
  · Waterfall: Sequenziale fase predittivo
  · Agile: Iterativo incrementale flessibile
  · Scrum: Sprint backlog team auto-organizzato
  · Kanban: Workflow visualizzato limite lavoro
  · DevOps: Sviluppo operazione integrazione continua

SICUREZZA INFORMATICA:
- Crittografia:
  · Simmetrica: Stessa chiave encoder decoder
  · Asimmetrica: Chiave pubblica privata RSA
  · Hash: Funzione unidirezionale impronta digitale
  · SSL/TLS: Comunicazione sicura internet certificato
  · Blockchain: Distribuito immutabile catena bloco

- Attacchi Malware:
  · Virus: Replica infetta programma danno
  · Worm: Autonome replica rete propagazione
  · Trojano: Gratuito malvagio trojan horse
  · Ransomware: Crittografia riscatto dati blocco
  · Phishing: Inganno credenziale social engineering
  · DDoS: Distributed denial servizio sovraccarico

- Protezione:
  · Firewall: Rete filtro traffico policy
  · Antivirus: Malware rilevamento quarantena pulizia
  · VPN: Virtuale privato rete tunneling crittografia
  · Autenticazione: Password fattore biometrica
  · Autorizzazione: Accesso controllo permesso ruolo

INGEGNERIA SOFTWARE:
- Testing:
  · Unit Test: Componente singolo isolato prova
  · Integration Test: Combinazione modulo interazione
  · System Test: Intero sistema funzionalità
  · Acceptance Test: Requisito utente validazione
  · Regression Test: Cambiamento non rompe precedente

- Debugging:
  · Breakpoint: Sospensione esecuzione ispezione
  · Stepping: Esecuzione passo istruzione
  · Profiling: Analisi performance memoria CPU
  · Logging: Registrazione evento traccia

- Version Control:
  · Git: Distribuito Linus Torvalds collaborazione
  · Branching: Linea sviluppo parallela feature
  · Merging: Combinazione ramo integrazione
  · Conflict Resolution: Differenza riconciliazione

PERFORMANCE OTTIMIZZAZIONE:
- Time Complexity: O(1) O(log n) O(n) O(n2) algoritmo
- Space Complexity: Memoria richiesta dataset
- Caching: Memoization risultati ripetuti
- Multithreading: Concorrenza parallelo processore
- Load Balancing: Distribuzione carico server
- Compressione: Danati ridotto bytes efficienza

FIGURA INFORMATICA:
- Turing Alan: Macchina computazione universale
- Von Neumann John: Architettura computer moderno
- Jobs Steve: Apple iPhone graphical interface
- Gates Bill: Microsoft SQL Windows software
- Torvalds Linus: Linux kernel open source
- Stallman Richard: Free software FSF GPL
- Ritchie Dennis: C linguaggio sistema programmazione
- Berners-Lee Tim: World Wide Web HTTP HTML
        `
    },
    'internet_web': {
        name: 'Internet e Web Tecnologie Globali',
        keywords: ['internet', 'web', 'HTTP', 'HTML', 'browser', 'DNS', 'IP', 'TCP', 'cloud', 'web3'],
        description: `Internet è la rete globale distribuita comunicazione informazione mondiale.

STORIA INTERNET:
- ARPANET (1969): Rete militare USA ARPADept Defense
- TCP/IP (1970s-80s): Protocollo standard universale
- Email (1971): Messaggio inizio digitale Tomlinson
- Modem (1970s): Telefono linea internet accesso
- World Wide Web (1989): Berners Lee CERN ipertesto
- Browser (1990s): Mosaic Netscape Internet Explorer
- Smartphone Era (2000+): Mobile internet ubiquitous
- Cloud Computing (2000+): Immagazzinamento remoto scalabile
- Social Media (2004+): Facebook Twitter YouTube collaborazione
- IoT Internet Cose (2010+): Dispositivi sensori rete
- 5G (2020+): Velocità latenza bassa banda larga

ARCHITETTURA INTERNET:
- Network Topology:
  · Star: Central hub comunicazione radiale
  · Mesh: Nodo multiplo connesso ridondanza
  · Ring: Circolare sequenziale dati circolazione
  · Bus: Linea comunicazione broadcast condiviso
  · Tree: Gerarchia nodo padre figli

- Protocol Stack OSI:
  · Layer 1 Fisica: Cavi luce segnali elettrici
  · Layer 2 Data Link: Ethernet MAC indirizzo
  · Layer 3 Network: IP routing indirizzo
  · Layer 4 Transport: TCP UDP connessione flusso
  · Layer 5 Session: Negoziazione establishment sessione
  · Layer 6 Presentazione: Compressione crittografia formato
  · Layer 7 Applicazione: HTTP FTP SMTP DNS protocollo

PROTOCOLLI RETE:
- TCP/IP: Transmission Control Internet Protocol
  · TCP: Affidabile ordinato connessione three-handshake
  · UDP: Inaffidabile datagram veloce overhead
  · IP: Indirizzo routing pacchetto distribuzione
  · IPv4: 32-bit indirizzo esaurimento carenza
  · IPv6: 128-bit indirizzo futuro espansione
  · ICMP: Message control internet ping diagnostica

- Routing Switching:
  · Router: Networking gateway pacchetto inoltro
  · Switch: LAN locale dato flusso efficiente
  · Gateway: Rete rete traduzione protocollo
  · Firewall: Filtraggio accesso ingresso uscita

- DNS Domain Name System:
  · Risoluzione: Nome dominio indirizzo IP
  · Root Server: Autoritario TLD top-level
  · Recursive Query: Resolver client query
  · Caching: Lookup veloce memoria locale
  · DNSSEC: Sicurezza firma autenticazione

- HTTP HTTPS:
  · HTTP: Hyper Text Transfer Protocol stateless
  · Methods: GET POST PUT DELETE HEAD OPTIONS
  · Status: 200 OK 404 Not Found 500 Server Error
  · HTTPS: HTTP Secure TLS SSL crittografia
  · HTTP/2: Multiplexing compressione header server push
  · HTTP/3: QUIC protocollo velocità latenza ridotta

WORLD WIDE WEB:
- HTML: HyperText Markup Language struttura
  · Elementi: Head body tag attributo semantico
  · Form: Input textarea select button invio
  · SVG: Grafica vettoriale scalabile disegno
  · Canvas: Raster disegno JavaScript dinamico

- CSS: Cascading Style Sheet presentazione
  · Selectori: Element class id pseudo-class
  · Proprietà: Colore font positioning flessibile
  · Flexbox Grid: Layout moderno responsivo
  · Media Query: Mobile desktop responsive design
  · Animation Transform: Movimento transizione dinamico

- JavaScript: Programmazione browser client-side
  · DOM: Document Object Model manipolazione
  · Event: Click submit evento listener callback
  · AJAX: Asincrono richiesta server senza refresh
  · Framework: React Vue Angular NodeJS ecosistema
  · Asynchronous: Promesse async await callback

- Web Storage Caching:
  · Cookie: Client storage sessione persistente
  · LocalStorage: Dominio persistente dati grande
  · SessionStorage: Sessione browser tab specifica
  · IndexedDB: Database browser NoSQL big data

APPLICAZIONI WEB:
- SPA Single Page Application:
  · Caricamento: HTML iniziale asset bundle
  · Routing Client-side: Senza server refresh
  · Framework: React Vue Angular Svelte

- PWA Progressive Web App:
  · Service Worker: Cache offline funzionalità
  · Manifest: Metadata installabile home screen
  · Push Notification: Utente alert notifiche

- REST API:
  · Endpoint: URL risorsa http metodo
  · JSON: Struttura dati leggera formato
  · Authentication: API key token JWT Bearer
  · Versioning: Compatibilità compatibilità

CLOUD COMPUTING:
- IaaS Infrastructure as Service:
  · Virtual Machine: Server affittabile on-demand
  · AWS EC2: Amazon compute elastico scalabile
  · Azure VM: Microsoft cloud compute
  · Instance tipo: CPU memoria storage configurazione

- PaaS Platform as Service:
  · Heroku: Deploy semplice linguaggio agnostico
  · Firebase: Google backend database authentication
  · Netlify: Frontend deploy vercel CI/CD
  · Managed: Database host middleware astrazione

- SaaS Software as Service:
  · Saas: Applicazione cloud sottoscrizione
  · Slack: Comunicazione team collaboration
  · Salesforce: Customer relationship management
  · Office 365: Microsoft productivity suite

- Container Orchestration:
  · Docker: Container isolamento lightweight virtualization
  · Kubernetes: Orches distributed scalabile automazione
  · Service Mesh: Istio Linkerd networking comunicazione

SICUREZZA WEB:
- Vulnerabilità Comuni:
  · SQL Injection: Query inganno database accesso
  · XSS: Cross-site scripting iniezione javascript
  · CSRF: Cross-site request forgery falsificazione
  · XPath Injection: Query manipolazione XML
  · Command Injection: Esecuzione comando sistema

- Protezione:
  · Input Validation: Sanitizzazione filtro controllo
  · Output Encoding: Escape speciale carattere
  · CORS: Cross-origin resource sharing policy
  · Rate Limiting: Throttling preve abuso
  · WAF: Web application firewall protezione

WEB FUTURE:
- Web3 Blockchain:
  · Decentralizzato: Peer rete fiducia distribuita
  · Smart Contract: Ethereum automatico esecuzione
  · DApp: Decentralized applicazione blockchain
  · NFT: Non-fungible token unico digitale

- Tecnologie Emergenti:
  · WebAssembly: Binario fast native performance
  · GraphQL: Query linguaggio alternativa REST
  · Serverless Function: AWS Lambda on-demand
  · Edge Computing: Computare vicinanza latenza ridotta

FIGURA WEB TECNOLOGIA:
- Berners-Lee Tim: World Wide Web inventor CERN
- Andreessen Marc: Netscape browser commerciale
- Zuckerberg Mark: Facebook social network
- Dorsey Jack: Twitter microblog
- Brin Sergei Page Larry: Google search engine
- Musk Elon: Tesla SpaceX blockchain interest
- Nakamoto Satoshi: Bitcoin cryptocurrency creator
        `
    }
};

// Esporta e rendi globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = technologyKnowledge;
}
window.technologyKnowledge = technologyKnowledge;

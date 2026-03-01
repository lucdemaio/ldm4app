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
        
        return null;
    }
};

// Rendi disponibile globalmente per i moduli
window.teslaKnowledgeBase = teslaKnowledgeBase;

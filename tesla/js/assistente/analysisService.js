// Analysis Service - Analisi testi con AI
// Usa i modelli per sentiment, classificazione, QA

import { getModelManager } from './modelManager.js';

class AnalysisService {
    constructor() {
        this.sentimentThreshold = 0.8;
    }

    async analyzeSentiment(text) {
        try {
            const modelManager = getModelManager();
            const analyzer = await modelManager.getSentimentAnalyzer();
            const result = await analyzer(text);

            return {
                text: text,
                sentiment: result[0].label,
                score: result[0].score,
                isPositive: result[0].label === 'POSITIVE',
                isNegative: result[0].label === 'NEGATIVE',
                confidence: (result[0].score * 100).toFixed(1)
            };
        } catch (error) {
            console.error('Errore sentiment analysis:', error);
            return null;
        }
    }

    async classifyIntent(text) {
        try {
            const modelManager = getModelManager();
            const classifier = await modelManager.getZeroShotClassifier();
            
            const categories = [
                'domanda su prodotti',
                'domanda su prezzo',
                'domanda su ricarica',
                'domanda su tecnologia',
                'domanda su servizio',
                'saluto',
                'ringraziamento',
                'altro'
            ];

            const result = await classifier(text, categories, {
                multi_class: true
            });

            return {
                text: text,
                primaryCategory: result.labels[0],
                confidence: (result.scores[0] * 100).toFixed(1),
                allCategories: result.labels.map((label, idx) => ({
                    category: label,
                    confidence: (result.scores[idx] * 100).toFixed(1)
                }))
            };
        } catch (error) {
            console.error('Errore classificazione intent:', error);
            return null;
        }
    }

    async answerQuestion(question, context) {
        try {            const modelManager = getModelManager();            const qa = await modelManager.getQAModel();

            // Limita il contesto a lunghezza massima (512 token)
            const maxContextLength = 500;
            let truncatedContext = context;
            
            if (context.length > maxContextLength) {
                truncatedContext = context.substring(0, maxContextLength) + '...';
            }

            const result = await qa({
                question: question,
                context: truncatedContext
            });

            return {
                question: question,
                answer: result.answer,
                score: result.score,
                confidence: (result.score * 100).toFixed(1),
                start: result.start,
                end: result.end
            };
        } catch (error) {
            console.error('Errore QA:', error);
            return null;
        }
    }

    searchAllKnowledgeBases(query) {
        // Raccoglidi tutti i knowledge base disponibili
        const allKBs = [
            { name: 'Tesla', kb: window.teslaKnowledgeBase, type: 'tesla' },
            { name: 'Science', kb: window.scienceKnowledge, type: 'general' },
            { name: 'Arts', kb: window.artsKnowledge, type: 'general' },
            { name: 'History', kb: window.historyKnowledge, type: 'general' },
            { name: 'Society', kb: window.societyKnowledge, type: 'general' },
            { name: 'Nature', kb: window.natureKnowledge, type: 'general' },
            { name: 'Technology', kb: window.technologyKnowledge, type: 'general' },
            { name: 'Humanities', kb: window.humanitiesKnowledge, type: 'general' },
            { name: 'Sports', kb: window.sportsKnowledge, type: 'general' }
        ];

        const queryLower = query.toLowerCase();
        let bestMatch = null;
        let bestMatchScore = 0;

        // Cerca in cada KB
        for (const kbSource of allKBs) {
            if (!kbSource.kb) continue;

            // Se è Tesla KB (con struttura speciale)
            if (kbSource.type === 'tesla' && kbSource.kb.findRelevantInfo) {
                const match = kbSource.kb.findRelevantInfo(query);
                if (match) {
                    return { ...match, source: kbSource.name, score: bestMatchScore };
                }
            } else if (kbSource.type === 'general') {
                // Per gli altri KB, cerca nei topics
                for (const [key, topic] of Object.entries(kbSource.kb)) {
                    if (!topic.keywords || !topic.description) continue;

                    // Calcola score di somiglianza
                    let currentScore = 0;
                    
                    // Controlla keywords
                    for (const keyword of topic.keywords) {
                        if (queryLower.includes(keyword.toLowerCase())) {
                            currentScore += 2; // Peso maggiore per match di parole chiave
                        }
                    }

                    // Controlla nome topic
                    if (queryLower.includes(topic.name.toLowerCase())) {
                        currentScore += 1.5;
                    }

                    // Controlla descrizione (primi 100 caratteri)
                    const descStart = topic.description.substring(0, 200).toLowerCase();
                    if (queryLower.split(/\s+/).some(word => word.length > 3 && descStart.includes(word))) {
                        currentScore += 1;
                    }

                    // Se trovo un match migliore, lo salvo
                    if (currentScore > bestMatchScore) {
                        bestMatchScore = currentScore;
                        bestMatch = {
                            type: 'topic',
                            name: topic.name,
                            data: topic,
                            source: kbSource.name + ' - ' + topic.name,
                            score: currentScore
                        };
                    }
                }
            }
        }

        return bestMatch;
    }

    async searchWikidata(query) {
        try {
            console.log('[DEBUG] Cercando in Wikidata:', query);
            
            // Timeout di 5 secondi per la fetch
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                console.log('[DEBUG] Wikidata TIMEOUT - passando a Wikipedia');
                controller.abort();
            }, 5000);
            
            try {
                console.log('[DEBUG] Wikidata: iniziando fetch...');
                const response = await fetch(
                    `https://www.wikidata.org/w/api.php?` +
                    `action=wbsearchentities&search=${encodeURIComponent(query)}&language=it` +
                    `&format=json&origin=*`,
                    { 
                        mode: 'cors',
                        signal: controller.signal
                    }
                );

                clearTimeout(timeout);
                console.log('[DEBUG] Wikidata: risposta ricevuta, status:', response.status);

                if (!response.ok) {
                    console.warn('[DEBUG] Wikidata API risposta non OK:', response.status);
                    console.log('[DEBUG] Wikidata: fallendo a Wikipedia...');
                    return await this.searchWikipedia(query);
                }

                const data = await response.json();
                console.log('[DEBUG] Wikidata: JSON parsato, risultati:', data.search?.length || 0);
                
                if (data.search && data.search.length > 0) {
                    console.log('[DEBUG] Trovati', data.search.length, 'risultati in Wikidata');
                    // Ritorna i primi 3 risultati
                    const result = {
                        type: 'wikidata',
                        results: data.search.slice(0, 3),
                        source: 'Wikidata',
                        query: query
                    };
                    console.log('[DEBUG] Wikidata: ritornando risultati:', result);
                    return result;
                }
                
                console.log('[DEBUG] Nessun risultato in Wikidata (data.search vuoto)');
                console.log('[DEBUG] Wikidata: passando a Wikipedia...');
                return await this.searchWikipedia(query);
            } catch (fetchError) {
                clearTimeout(timeout);
                console.warn('[DEBUG] Errore Wikidata fetch:', fetchError.message, fetchError.name);
                console.log('[DEBUG] Wikidata: errore, passando a Wikipedia...');
                return await this.searchWikipedia(query);
            }
        } catch (error) {
            console.warn('[DEBUG] Errore generale searchWikidata:', error);
            return null;
        }
    }

    async searchWikipedia(query) {
        try {
            console.log('[DEBUG] ==> WIKIPEDIA: Cercando per:', query);
            
            // Timeout di 5 secondi
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                console.log('[DEBUG] Wikipedia TIMEOUT');
                controller.abort();
            }, 5000);
            
            try {
                console.log('[DEBUG] Wikipedia: iniziando fetch...');
                const url = `https://it.wikipedia.org/w/api.php?` +
                    `action=query&titles=${encodeURIComponent(query)}&` +
                    `prop=extracts&explaintext=true&format=json&origin=*`;
                console.log('[DEBUG] Wikipedia URL:', url);

                const response = await fetch(url, { 
                    mode: 'cors',
                    signal: controller.signal
                });

                clearTimeout(timeout);
                console.log('[DEBUG] Wikipedia: risposta ricevuta, status:', response.status);

                if (!response.ok) {
                    console.warn('[DEBUG] Wikipedia API risposta non OK:', response.status);
                    return null;
                }

                const data = await response.json();
                console.log('[DEBUG] Wikipedia: JSON parsato');
                console.log('[DEBUG] Wikipedia data:', data);

                if (data.query && data.query.pages) {
                    console.log('[DEBUG] Wikipedia: trovate', data.query.pages.length, 'pagine');
                    const pages = data.query.pages.filter(p => !p.missing && p.extract);
                    
                    if (pages.length > 0) {
                        console.log('[DEBUG] Wikipedia: pagine valide:', pages.length);
                        const result = {
                            type: 'wikipedia',
                            results: pages.slice(0, 3).map(p => ({
                                label: p.title,
                                description: p.extract ? p.extract.substring(0, 300) : 'Articolo trovato'
                            })),
                            source: 'Wikipedia',
                            query: query
                        };
                        console.log('[DEBUG] Wikipedia: ritornando risultati');
                        return result;
                    } else {
                        console.log('[DEBUG] Wikipedia: nessuna pagina valida con extract');
                    }
                } else {
                    console.log('[DEBUG] Wikipedia: nessun query.pages nella risposta');
                }
                
                console.log('[DEBUG] Wikipedia: nessun risultato trovato');
                return null;
            } catch (fetchError) {
                clearTimeout(timeout);
                console.warn('[DEBUG] Errore Wikipedia fetch:', fetchError.message, fetchError.name);
                return null;
            }
        } catch (error) {
            console.warn('[DEBUG] Errore generale searchWikipedia:', error);
            return null;
        }
    }

    extractKeywords(text) {
        // Estrai parole chiave (implementazione semplice)
        const keywords = text
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['come', 'qual', 'dove', 'quando', 'quale', 'che', 'per', 'del', 'una', 'con'].includes(word));

        return [...new Set(keywords)]; // Rimuovi duplicati
    }

    async generateResponse(userMessage) {
        try {
            console.log('[DEBUG] Generando risposta per:', userMessage);
            
            // Analizza il messaggio
            const sentiment = await this.analyzeSentiment(userMessage);
            const intent = await this.classifyIntent(userMessage);
            const keywords = this.extractKeywords(userMessage);
            
            console.log('[DEBUG] Cercando in tutte le knowledge base disponibili...');

            // Cerca informazioni rilevanti in TUTTI i KB
            const relevantInfo = this.searchAllKnowledgeBases(userMessage);
            console.log('[DEBUG] Informazioni rilevanti trovate:', !!relevantInfo, 'Score:', relevantInfo?.score);

            let response = '';
            let hasAnswer = false;

            if (relevantInfo && relevantInfo.score > 0.5) {
                // Se il match è buono, usa il KB locale
                hasAnswer = true;
                
                if (relevantInfo.type === 'product') {
                    response = this.formatProductResponse(relevantInfo.data, userMessage);
                } else if (relevantInfo.type === 'service') {
                    response = this.formatServiceResponse(relevantInfo.data, userMessage);
                } else if (relevantInfo.type === 'general') {
                    response = this.formatGeneralResponse(relevantInfo.data, userMessage);
                }
            } else if (relevantInfo && relevantInfo.score <= 0.5) {
                // Score basso, prova Wikidata per disambiguazione
                console.log('[DEBUG] Score basso, cercando in Wikidata...');
                const wikidataResult = await this.searchWikidata(userMessage);
                
                if (wikidataResult && wikidataResult.results.length > 0) {
                    hasAnswer = true;
                    response = this.formatWikidataResponse(wikidataResult);
                } else {
                    // Nessun risultato neanche in Wikidata
                    response = this.generateGenericResponse(userMessage, intent, keywords);
                }
            } else {
                // Non trovato nei KB locali, prova Wikidata
                console.log('[DEBUG] Nessun match nei KB locali, cercando in Wikidata...');
                const wikidataResult = await this.searchWikidata(userMessage);
                
                if (wikidataResult && wikidataResult.results.length > 0) {
                    hasAnswer = true;
                    response = this.formatWikidataResponse(wikidataResult);
                } else {
                    // Fallback generico
                    response = this.generateGenericResponse(userMessage, intent, keywords);
                }
            }

            // Se non ha trovato risposta diretta, prova QA
            if (!hasAnswer && relevantInfo) {
                try {
                    const context = relevantInfo.type === 'product' 
                        ? relevantInfo.data.description 
                        : relevantInfo.data.description;

                    const qaResult = await this.answerQuestion(userMessage, context);
                    if (qaResult && qaResult.score > 0.2) {
                        response = `✓ ${qaResult.answer}\n\n_Confidenza: ${qaResult.confidence}%_`;
                        hasAnswer = true;
                    }
                } catch (e) {
                    console.log('QA fallback non disponibile');
                }
            }

            return {
                userMessage,
                response,
                sentiment,
                intent,
                keywords,
                metadata: {
                    hasAnswer,
                    timestamp: new Date().toISOString(),
                    modelUsed: 'Transformers.js (Xenova) + Wikidata'
                }
            };
        } catch (error) {
            console.error('Errore generazione risposta:', error);
            return {
                userMessage,
                response: '❌ Scusa, ho avuto un problema nell\'elaborare la tua domanda. Prova di nuovo!',
                sentiment: null,
                intent: null,
                keywords: [],
                error: error.message
            };
        }
    }

    formatProductResponse(product, userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        let response = `**${product.name}** 🚗\n\n`;
        response += product.shortDesc + '\n\n';

        if (lowerMsg.includes('prezzo') || lowerMsg.includes('costa')) {
            response += `💰 **Prezzo:** ${product.price}\n`;
        }

        if (lowerMsg.includes('autonomia') || lowerMsg.includes('km')) {
            response += `⚡ **Autonomia:** ${product.range}\n`;
        }

        if (lowerMsg.includes('accelerazione') || lowerMsg.includes('prestazioni') || lowerMsg.includes('0-100')) {
            response += `🏁 **0-100 km/h:** ${product.acceleration}\n`;
        }

        if (lowerMsg.includes('posti') || lowerMsg.includes('persone') || lowerMsg.includes('passeggeri')) {
            response += `👥 **Posti:** ${product.seats}\n`;
        }

        response += `\n${product.description}`;

        return response;
    }

    formatServiceResponse(service, userMessage) {
        let response = `**${service.name}** ℹ️\n\n`;
        response += service.description;
        return response;
    }

    formatGeneralResponse(general, userMessage) {
        let response = `**${general.name}** 📚\n\n`;
        
        // Se è un topic da un KB generale, mostra nome + descrizione
        if (general.description) {
            response += general.description;
        } else {
            response += 'Informazioni disponibili su questo argomento.';
        }
        
        return response;
    }

    formatWikidataResponse(result) {
        let response = '';
        
        if (result.type === 'wikidata') {
            response = `🌐 **Risultati da Wikidata**\n\n`;
        } else if (result.type === 'wikipedia') {
            response = `📖 **Risultati da Wikipedia**\n\n`;
        }
        
        result.results.forEach((item, index) => {
            response += `**${index + 1}. ${item.label}**`;
            if (item.description) {
                response += ` - ${item.description}`;
            }
            response += '\n';
        });

        if (result.type === 'wikidata') {
            response += '\n_📚 Informazioni fornite da Wikidata - Enciclopedia globale libera_';
        } else if (result.type === 'wikipedia') {
            response += '\n_📚 Informazioni fornite da Wikipedia - Enciclopedia online_';
        }
        
        return response;
    }

    generateGenericResponse(userMessage, intent, keywords) {
        const responses = [
            `Ho cercato di trovare informazioni su "${keywords[0] || 'questo'}" ma non ho trovato corrispondenze esatte. La mia knowledge base copre: Scienze, Arti, Storia, Società, Natura, Tecnologia, Filosofia e Sport. Prova a chiedere su questi argomenti!`,
            
            `Non sono sicuro di come rispondere a questo. Conosco bene i prodotti Tesla, scienze, storia mondiale, arte, società, ecologia, tecnologia e sport. Cosa vorresti sapere?`,

            `Questa è una domanda interessante! Sfortunatamente non ho informazioni specifiche su questo nella mia knowledge base. Prova a cercatori con parole chiave diverse o chiedimi di argomenti come scienza, storia, arte, filosofia o sport.`,

            `Mi dispiace, non riesco a trovare una risposta precisa nel mio database. Prova a riformulare la domanda o chiedimi di altri argomenti nella mia knowledge base.`,

            `Non ho trovato informazioni su questo. La mia knowledge base è molto estesa e copre molti argomenti - prova a chiedere su: prodotti Tesla, scienze, storia, arti, società, natura, tecnologia, filosofia o sport!`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Singleton globale - creato al primo utilizzo
let analysisServiceInstance = null;

export function getAnalysisService() {
    if (!analysisServiceInstance) {
        analysisServiceInstance = new AnalysisService();
    }
    return analysisServiceInstance;
}

// Istanza predefinita per l'uso diretto
window.analysisService = null;

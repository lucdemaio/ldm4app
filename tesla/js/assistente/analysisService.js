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
            
            // Genera query alternative
            const alternativeQueries = await this.generateAlternativeQueries(query);
            console.log('[DEBUG] Provando', alternativeQueries.length, 'query alternative');

            // Prova ogni query fino a trovare risultati
            for (let qIndex = 0; qIndex < alternativeQueries.length; qIndex++) {
                const currentQuery = alternativeQueries[qIndex];
                console.log(`[DEBUG] Tentativo ${qIndex + 1}/${alternativeQueries.length}: "${currentQuery}"`);

                const result = await this.tryWikipediaSearch(currentQuery);
                
                if (result && result.results && result.results.length > 0) {
                    console.log(`[DEBUG] ✓ Successo con query: "${currentQuery}"`);
                    // ✨ NUOVO: Elabora con QA model per risposta conversazionale
                    const enhancedResult = await this.enhanceWikipediaWithQA(currentQuery, result);
                    return enhancedResult || result;
                }
            }

            console.log('[DEBUG] Nessun risultato trovato con nessuna query alternativa');
            return null;
        } catch (error) {
            console.warn('[DEBUG] Errore generale searchWikipedia:', error);
            return null;
        }
    }

    async enhanceWikipediaWithQA(userQuery, wikipediaResult) {
        try {
            console.log('[DEBUG] ✨ Elaborazione Wikipedia con QA model...');
            
            if (!wikipediaResult || !wikipediaResult.results || wikipediaResult.results.length === 0) {
                return wikipediaResult;
            }

            const modelManager = getModelManager();
            const qa = await modelManager.getQAModel();
            
            const enhancedResults = [];
            
            for (const item of wikipediaResult.results.slice(0, 2)) {
                try {
                    // Limita il contesto a 512 token
                    const context = item.description.substring(0, 600);
                    
                    console.log(`[DEBUG] QA su: "${item.label}"`);
                    
                    const qaResult = await qa({
                        question: userQuery,
                        context: context
                    });
                    
                    if (qaResult && qaResult.score > 0.1) {
                        console.log(`[DEBUG] ✓ QA risposta trovata (score: ${qaResult.score.toFixed(3)})`);
                        
                        // Creiamo risposta conversazionale
                        enhancedResults.push({
                            label: item.label,
                            description: item.description,
                            // ✨ NUOVO: Risposta intelligente dal QA model
                            conversational_answer: qaResult.answer,
                            qa_confidence: (qaResult.score * 100).toFixed(1),
                            is_enhanced: true
                        });
                    } else {
                        enhancedResults.push(item);
                    }
                } catch (error) {
                    console.warn(`[DEBUG] QA fallback per "${item.label}":`, error.message);
                    enhancedResults.push(item);
                }
            }
            
            return {
                ...wikipediaResult,
                results: enhancedResults,
                is_qa_enhanced: true
            };
        } catch (error) {
            console.warn('[DEBUG] Errore enhanceWikipediaWithQA:', error);
            return wikipediaResult; // Fallback ai raw results
        }
    }

    async tryWikipediaSearch(query) {
        try {
            // Timeout di 3 secondi per singola query
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                console.log(`[DEBUG] Wikipedia TIMEOUT per query: "${query}"`);
                controller.abort();
            }, 3000);
            
            try {
                // Usa Wikipedia SEARCH API (list=search) per cercare nel contenuto
                // non solo nei titoli
                const url = `https://it.wikipedia.org/w/api.php?` +
                    `action=query&list=search&srsearch=${encodeURIComponent(query)}&` +
                    `srprop=snippet&srlimit=3&srinfo=totalhits&format=json&origin=*`;

                console.log(`[DEBUG] Wikipedia Search URL (query: "${query}")`);

                const response = await fetch(url, { 
                    mode: 'cors',
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    console.log(`[DEBUG] Wikipedia risposta non OK (${response.status}) per: "${query}"`);
                    return null;
                }

                const data = await response.json();
                console.log(`[DEBUG] Wikipedia Search data:`, data);

                if (data.query && data.query.search && data.query.search.length > 0) {
                    console.log(`[DEBUG] ✓ Wikipedia trovate ${data.query.search.length} risultati di ricerca`);
                    
                    // Ora recupera il contenuto completo per ogni risultato trovato
                    const searchResults = data.query.search.slice(0, 3);
                    const titles = searchResults.map(r => r.title).join('|');
                    
                    // Fetch completo del contenuto usando i titoli trovati
                    const extractUrl = `https://it.wikipedia.org/w/api.php?` +
                        `action=query&titles=${encodeURIComponent(titles)}&` +
                        `prop=extracts&explaintext=true&exintro=true&exsectionformat=plain&format=json&origin=*`;
                    
                    const extractResponse = await fetch(extractUrl, {
                        mode: 'cors',
                        signal: controller.signal
                    });

                    if (extractResponse.ok) {
                        const extractData = await extractResponse.json();
                        
                        if (extractData.query && extractData.query.pages) {
                            const pages = Object.values(extractData.query.pages)
                                .filter(p => !p.missing && p.extract && p.extract.length > 50)
                                .slice(0, 3);
                            
                            if (pages.length > 0) {
                                console.log(`[DEBUG] ✓ Estratto contenuto da ${pages.length} pagine`);
                                return {
                                    type: 'wikipedia',
                                    results: pages.map(p => ({
                                        label: p.title,
                                        description: p.extract || 'Articolo trovato'
                                    })),
                                    source: 'Wikipedia',
                                    query: query,
                                    pagesCount: pages.length,
                                    method: 'search+extract'
                                };
                            }
                        }
                    }

                    // Se non riusciamo ad estrarre, ritorna almeno lo snippet
                    console.log(`[DEBUG] Usando snippet dalla ricerca Wikipedia`);
                    return {
                        type: 'wikipedia',
                        results: searchResults.map(r => ({
                            label: r.title,
                            description: r.snippet ? r.snippet.replace(/<[^>]*>/g, '') : 'Risultato trovato'
                        })),
                        source: 'Wikipedia',
                        query: query,
                        pagesCount: searchResults.length,
                        method: 'search-only'
                    };
                }
                
                console.log(`[DEBUG] Nessun risultato di ricerca per: "${query}"`);
                return null;
            } catch (fetchError) {
                clearTimeout(timeout);
                if (fetchError.name === 'AbortError') {
                    console.log(`[DEBUG] Fetch abortato per timeout su query: "${query}"`);
                } else {
                    console.warn(`[DEBUG] Errore fetch Wikipedia per query "${query}":`, fetchError.message);
                }
                return null;
            }
        } catch (error) {
            console.warn('[DEBUG] Errore tryWikipediaSearch:', error);
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

    async generateAlternativeQueries(userMessage) {
        try {
            console.log('[DEBUG] Generando query alternative per:', userMessage);
            
            // Estrai keywords usando estrazione avanzata
            const words = userMessage.toLowerCase().split(/\s+/);
            
            // **NUOVA LOGICA**: Rileva anni (1900-2100)
            const yearMatch = userMessage.match(/\b(19\d{2}|20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : null;
            
            // Se c'è un anno, rimuovilo per analizzare il resto
            let messageWithoutYear = userMessage;
            if (year) {
                messageWithoutYear = userMessage.replace(year, '').trim();
                console.log(`[DEBUG] Anno rilevato: ${year}`);
            }
            
            // Nomi comuni di oggetti e concetti per ricerca Wikipedia
            const contextWords = {
                'vinto': ['vincitore', 'vittoria', 'campione'],
                'primo': ['primo', 'iniziale', 'origins'],
                'mondiale': ['mondiale', 'world', 'internazionale'],
                'calcio': ['calcio', 'football', 'soccer'],
                'chi': ['chi', 'quale', 'nome'],
                'cosa': ['cosa', 'argomento', 'tema'],
                'come': ['come', 'metodo', 'modalità'],
                'quando': ['quando', 'date', 'periodo', 'anno'],
                'dove': ['dove', 'luogo', 'location'],
                'fiore': ['fiore', 'pianta', 'flowers', 'botanica'],
                'colore': ['colore', 'color', 'bianco', 'giallo', 'blu', 'rosso'],
                'bianco': ['bianco', 'white', 'bianca'],
                'giallo': ['giallo', 'yellow', 'oro'],
            };

            // Genera varianti di query
            const queries = [];
            
            // Variante 0: Query originale
            queries.push(userMessage);

            // **NUOVA**: Se c'è un anno, crea varianti specifiche per anno
            if (year) {
                // Variante: Anno + parole chiave importanti (senza articoli)
                const keywordsForYear = words
                    .filter(w => w.length > 2 && 
                        !['il', 'la', 'lo', 'di', 'da', 'per', 'che', 'chi', 'cosa', 'come', 'dove', 'quando', 'quale', 'ha', 'del'].includes(w) &&
                        w !== year)
                    .slice(0, 3) // Prendi max 3 keywords
                    .join(' ');
                
                if (keywordsForYear) {
                    // "calcio mondiale 1934"
                    queries.push(`${keywordsForYear} ${year}`);
                    // "1934 mondiale calcio"
                    queries.push(`${year} ${keywordsForYear}`);
                }
                
                // Variante: Anno + evento specifico
                const hasWorld = userMessage.toLowerCase().includes('mondiale') || userMessage.toLowerCase().includes('world');
                const hasFootball = userMessage.toLowerCase().includes('calcio') || userMessage.toLowerCase().includes('football') || userMessage.toLowerCase().includes('soccer');
                
                if (hasWorld && hasFootball) {
                    queries.push(`FIFA World Cup ${year}`);
                    queries.push(`Campionato mondiale calcio ${year}`);
                    queries.push(`World Cup ${year} winner`);
                }
            }

            // Variante 1: Solo keywords importanti
            const importantWords = words.filter(w => 
                w.length > 2 && 
                !['il', 'la', 'lo', 'di', 'da', 'per', 'che', 'chi', 'cosa', 'come', 'dove', 'quando', 'quale', 'ha', 'del'].includes(w) &&
                w !== year // Escludi l'anno se già considerato
            );
            if (importantWords.length > 0) {
                queries.push(importantWords.join(' '));
            }

            // Variante 2: Con sinonimi/espansioni (mantenendo l'anno)
            let expandedQuery = messageWithoutYear;
            for (const [key, synonyms] of Object.entries(contextWords)) {
                if (messageWithoutYear.toLowerCase().includes(key)) {
                    expandedQuery += ' ' + synonyms[0];
                }
            }
            if (year && !expandedQuery.includes(year)) {
                expandedQuery += ` ${year}`;
            }
            if (expandedQuery !== userMessage && expandedQuery.trim().length > 0) {
                queries.push(expandedQuery);
            }

            // Variante 3: Query con Wikipedia/Enciclopedia/Storia + anno
            if (year) {
                queries.push(messageWithoutYear + ` ${year} wikipedia`);
                queries.push(messageWithoutYear + ` ${year} history`);
            } else {
                queries.push(userMessage + ' wikipedia');
                queries.push(userMessage + ' enciclopedia');
                queries.push(userMessage + ' storia');
            }

            // Variante 4: Ricerca con nome evento se contiene parole chiave
            const eventPatterns = {
                'mondiale': ['Campionato mondiale', 'World Championship'],
                'olimpiad': ['Giochi olimpici', 'Olympic Games'],
                'guerra': ['World War', 'Guerra mondiale'],
                'guerra mondiale': year ? [`Seconda guerra mondiale ${year}`, `First World War ${year}`] : [],
            };
            
            for (const [pattern, alternatives] of Object.entries(eventPatterns)) {
                if (userMessage.toLowerCase().includes(pattern)) {
                    alternatives.forEach(alt => {
                        if (year && !alt.includes(year)) {
                            queries.push(`${alt} ${year}`);
                        } else {
                            queries.push(alt);
                        }
                    });
                }
            }

            // Rimuovi duplicati e filtra stringhe vuote
            const uniqueQueries = [...new Set(queries)]
                .filter(q => q.trim().length > 0 && q.trim() !== userMessage)
                .slice(0, 10); // Max 10 varianti
            
            // Aggiungi query originale prima
            const finalQueries = [userMessage, ...uniqueQueries];
            
            console.log('[DEBUG] Query alternative generate (smart with years):');
            finalQueries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));
            
            return finalQueries;
        } catch (error) {
            console.warn('[DEBUG] Errore generazione query alternative:', error);
            return [userMessage]; // Fallback alla query originale
        }
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
                    // Prova Wikipedia con varianti
                    const wikipediaResult = await this.searchWikipedia(userMessage);
                    if (wikipediaResult && wikipediaResult.results.length > 0) {
                        hasAnswer = true;
                        response = this.formatWikidataResponse(wikipediaResult);
                    } else {
                        // Prova altre API (OpenLibrary, PoetryDB, Countries, DBpedia)
                        console.log('[DEBUG] Wikipedia non ha risposto, provando API esterne...');
                        const apiResults = await this.searchMultipleAPIs(userMessage);
                        if (apiResults && apiResults.length > 0) {
                            hasAnswer = true;
                            response = this.formatMultipleAPIsResponse(apiResults);
                        } else {
                            response = this.generateGenericResponse(userMessage, intent, keywords);
                        }
                    }
                }
            } else {
                // Non trovato nei KB locali, prova Wikidata
                console.log('[DEBUG] Nessun match nei KB locali, cercando in Wikidata...');
                const wikidataResult = await this.searchWikidata(userMessage);
                
                if (wikidataResult && wikidataResult.results.length > 0) {
                    hasAnswer = true;
                    response = this.formatWikidataResponse(wikidataResult);
                } else {
                    // Prova Wikipedia
                    const wikipediaResult = await this.searchWikipedia(userMessage);
                    if (wikipediaResult && wikipediaResult.results.length > 0) {
                        hasAnswer = true;
                        response = this.formatWikidataResponse(wikipediaResult);
                    } else {
                        // Prova altre API
                        console.log('[DEBUG] Wikipedia non ha risposto, trying API esterne...');
                        const apiResults = await this.searchMultipleAPIs(userMessage);
                        if (apiResults && apiResults.length > 0) {
                            hasAnswer = true;
                            response = this.formatMultipleAPIsResponse(apiResults);
                        } else {
                            response = this.generateGenericResponse(userMessage, intent, keywords);
                        }
                    }
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

            // Se ancora non ha risposta, prova con risposta conversazionale intelligente
            if (!hasAnswer && !response) {
                console.log('[DEBUG] Nessuna risposta trovata, usando generateConversationalResponse...');
                const conversationalResponse = await this.generateConversationalResponse(userMessage);
                if (conversationalResponse) {
                    response = conversationalResponse;
                } else {
                    // Fallback finale
                    response = this.generateGenericResponse(userMessage, intent, keywords);
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
                    modelUsed: 'Transformers.js (Xenova) + Wikidata + Wikipedia + Multi-APIs (OpenLibrary, PoetryDB, DBpedia, REST Countries)'
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
        
        // ✨ NUOVO: Se è stata elaborata con QA, mostra il risultato conversazionale
        if (result.is_qa_enhanced && result.results.some(r => r.conversational_answer)) {
            response = `🧠 **Risposta Intelligente (elaborata con AI)**\n\n`;
            
            result.results.forEach((item, index) => {
                if (item.conversational_answer) {
                    // Mostra la risposta conversazionale intelligente
                    response += `**${item.label}**\n`;
                    response += `${item.conversational_answer}\n\n`;
                    response += `_Fonte: ${item.label} | Confidenza: ${item.qa_confidence}%_\n\n`;
                } else {
                    // Fallback a descrizione raw
                    response += `**${index + 1}. ${item.label}**\n`;
                    if (item.description) {
                        response += `${item.description}\n\n`;
                    }
                }
            });
            
            response += '_📚 Elaborato con intelligenza artificiale + Wikipedia - Risposte conversazionali e naturali_';
        } else {
            // Formato originale raw (Wikidata / Wikipedia raw)
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
        }
        
        return response;
    }

    formatMultipleAPIsResponse(results) {
        let response = '🔍 **Ricerche da fonti diverse:**\n\n';
        
        results.forEach(result => {
            const icon = this.getAPIIcon(result.source);
            response += `${icon} **${result.source}**\n`;
            
            if (result.type === 'openlibrary') {
                result.results.forEach(book => {
                    response += `📕 **${book.label}**\n`;
                    response += `   ${book.description}\n`;
                });
            } else if (result.type === 'poetry') {
                result.results.forEach(poem => {
                    response += `✨ **${poem.label}**\n`;
                    response += `   "_${poem.description}_"\n`;
                });
            } else if (result.type === 'countries') {
                result.results.forEach(country => {
                    response += `🌍 **${country.label}**\n`;
                    response += `   ${country.description}\n`;
                });
            } else if (result.type === 'dbpedia') {
                result.results.forEach(item => {
                    response += `📊 **${item.label}**\n`;
                    response += `   ${item.description.substring(0, 150)}...\n`;
                });
            }
            
            response += '\n';
        });
        
        response += '_Informazioni raccolte da OpenLibrary, PoetryDB, REST Countries, e DBpedia_';
        return response;
    }

    getAPIIcon(source) {
        const icons = {
            'Open Library': '📚',
            'PoetryDB': '✏️',
            'REST Countries': '🗺️',
            'DBpedia': '🔗',
            'Wikipedia': '📖',
            'Wikidata': '🌐'
        };
        return icons[source] || '📄';
    }

    async searchOpenLibrary(query) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
            const response = await fetch(url, {
                mode: 'cors',
                signal: controller.signal,
                headers: { 'User-Agent': 'Tesla-Assistente/1.0' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.docs && data.docs.length > 0) {
                    console.log(`[DEBUG] ✓ Open Library trovato: ${data.docs.length} libri`);
                    return {
                        type: 'openlibrary',
                        results: data.docs.slice(0, 3).map(book => ({
                            label: book.title + (book.first_publish_year ? ` (${book.first_publish_year})` : ''),
                            description: `Autore: ${book.author_name ? book.author_name[0] : 'Sconosciuto'}. Edizioni: ${book.edition_count || 0}`,
                            isbn: book.isbn ? book.isbn[0] : null
                        })),
                        source: 'Open Library',
                        query: query,
                        count: data.docs.length
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('[DEBUG] Open Library timeout/error:', error.message);
            return null;
        }
    }

    async searchPoetryDB(query) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // PoetryDB search by author or title
            const url = `https://poetrydb.org/author,title/${encodeURIComponent(query)}/lines.json`;
            const response = await fetch(url, {
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`[DEBUG] ✓ PoetryDB trovato: ${data.length} poesie`);
                    return {
                        type: 'poetry',
                        results: data.slice(0, 3).map(poem => ({
                            label: `${poem.title} - ${poem.author}`,
                            description: poem.lines.slice(0, 2).join(' '),
                            fullLines: poem.lines
                        })),
                        source: 'PoetryDB',
                        query: query,
                        count: data.length
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('[DEBUG] PoetryDB timeout/error:', error.message);
            return null;
        }
    }

    async searchCountries(query) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,capital,region,population,area,flags`;
            const response = await fetch(url, {
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`[DEBUG] ✓ REST Countries trovato: ${data.length} paesi`);
                    return {
                        type: 'countries',
                        results: data.slice(0, 3).map(country => ({
                            label: country.name.common || country.name.official,
                            description: `Capitale: ${country.capital?.[0] || 'N/A'} | Popolazione: ${country.population?.toLocaleString() || 'N/A'} | Regione: ${country.region || 'N/A'}`,
                            flag: country.flags?.svg || null
                        })),
                        source: 'REST Countries',
                        query: query,
                        count: data.length
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('[DEBUG] REST Countries timeout/error:', error.message);
            return null;
        }
    }

    async searchDBpedia(query) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // DBpedia SPARQL endpoint - ricerca per abstract
            const sparqlQuery = `SELECT ?resource ?label ?abstract WHERE {
                ?resource rdfs:label "${query}"@it ;
                         rdf:type ?type ;
                         dbo:abstract ?abstract .
                FILTER(LANG(?abstract) = "it")
                LIMIT 3
            }`;

            const url = `https://dbpedia.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
            const response = await fetch(url, {
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.bindings.length > 0) {
                    console.log(`[DEBUG] ✓ DBpedia trovato: ${data.results.bindings.length} risultati`);
                    return {
                        type: 'dbpedia',
                        results: data.results.bindings.map(item => ({
                            label: item.label?.value || 'DBpedia',
                            description: item.abstract?.value || 'Informazione trovata'
                        })),
                        source: 'DBpedia',
                        query: query,
                        count: data.results.bindings.length
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('[DEBUG] DBpedia error:', error.message);
            return null;
        }
    }

    async searchMultipleAPIs(query) {
        console.log(`[DEBUG] 🔍 Ricerca multi-API per: "${query}"`);
        
        // Esegui tutte le ricerche in parallelo
        const [openLibResult, poetryResult, countriesResult, dbpediaResult] = await Promise.all([
            this.searchOpenLibrary(query),
            this.searchPoetryDB(query),
            this.searchCountries(query),
            this.searchDBpedia(query)
        ]);

        const results = [openLibResult, poetryResult, countriesResult, dbpediaResult].filter(r => r !== null);
        
        if (results.length > 0) {
            console.log(`[DEBUG] ✓ Trovati ${results.length} risultati da API esterne`);
            return results;
        }

        console.log(`[DEBUG] Nessun risultato da API esterne`);
        return null;
    }

    async generateConversationalResponse(userMessage) {
        try {
            // Se la lunghezza è ragionevole, genera risposta più intelligente
            if (userMessage.length < 256) {
                // Analizza intent per adattare la risposta
                const intent = await this.classifyIntent(userMessage);
                const sentiment = await this.analyzeSentiment(userMessage);
                
                // Estrae la prima categoria di intent
                const primaryIntent = intent?.primaryCategory || 'altro';
                
                // Genera risposta intelligente basata su intent + sentiment
                let baseResponse = `Ho ricevuto la tua domanda: "${userMessage}". `;
                
                // Adatta il tono in base al sentiment
                const tonalPrefix = sentiment?.isNegative 
                    ? "Capisco la tua frustrazione. "
                    : sentiment?.isPositive 
                    ? "Che bello! "
                    : "";
                
                // Risposta specifica per tipo di domanda
                if (primaryIntent.includes('domanda su prodotti')) {
                    return baseResponse + tonalPrefix + 'Sembra che tu voglia sapere qualcosa su un prodotto Tesla. ' +
                        'Prova a cercare "Tesla Model S", "Tesla Model 3", o altri modelli Tesla per ottenere informazioni dettagliate. ' +
                        'Puoi anche chiedermi direttamente dei prezzi, delle prestazioni, o della ricarica!';
                } else if (primaryIntent.includes('domanda su prezzo')) {
                    return baseResponse + tonalPrefix + 'Stai cercando informazioni sui prezzi. ' +
                        'Purtroppo, i prezzi variano in base al mercato e alle configurazioni. ' +
                        'Ti consiglio di visitare il sito ufficiale Tesla per i prezzi aggiornati, oppure chiedimi di un modello specifico!';
                } else if (primaryIntent.includes('domanda su ricarica')) {
                    return baseResponse + tonalPrefix + 'Hai domande sulla ricarica dei veicoli Tesla. ' +
                        'Questo è un argomento importante! Prova a chiedermi "come ricaricare una Tesla", "tempo di ricarica", o "stazioni di ricarica".';
                } else if (primaryIntent.includes('domanda su tecnologia')) {
                    return baseResponse + tonalPrefix + 'Interessante! Vuoi sapere di più sulla tecnologia Tesla. ' +
                        'Puoi chiedermi di Autopilot, batterie, motori elettrici, o altre innovazioni Tesla.';
                } else if (primaryIntent.includes('saluto')) {
                    return 'Ciao! 👋 Come posso aiutarti oggi? Puoi chiedermi di Tesla, veicoli elettrici, tecnologia, o qualsiasi argomento tu voglia esplorare!';
                } else if (primaryIntent.includes('ringraziamento')) {
                    return 'Di nulla! 😊 Sono sempre qui per aiutarti. Hai altre domande?';
                } else {
                    // Fallback generico ma intelligente
                    return baseResponse + 'Purtroppo non ho trovato informazioni specifiche su questo argomento nel mio database attuale. ' +
                        'Puoi provare a riformulare la domanda con parole chiave diverse o aggiungere più dettagli? ' +
                        'Ad esempio, se mi chiedi di una persona, una scoperta scientifica, un evento storico, posso cercare su Wikipedia e altre fonti!';
                }
            }
            
            // Per messaggi lunghi
            return 'Ho ricevuto una domanda interessante! Sfortunatamente, il messaggio è molto lungo. ' +
                   'Prova a formulare una domanda più concisa, e farò del mio meglio per aiutarti!';

        } catch (error) {
            console.error('[ERROR] Errore in generateConversationalResponse:', error);
            return null;
        }
    }

    generateGenericResponse(userMessage, intent, keywords) {
        const responses = [
            `Ho cercato di trovare informazioni su "${keywords[0] || 'questo'}" ma non ho trovato corrispondenze esatte. La mia knowledge base copre: Scienze, Arti, Storia, Società, Natura, Tecnologia, Filosofia e Sport. Prova a chiedere su questi argomenti!`,
            
            `Non sono sicuro di come rispondere a questo. Conosco bene i prodotti Tesla, scienze, storia mondiale, arte, società, ecologia, tecnologia e sport. Cosa vorresti sapere?`,

            `Questa è una domanda interessante! Sfortunatamente non ho informazioni specifiche su questo nella mia knowledge base. Prova a cercare con parole chiave diverse o chiedimi di argomenti come scienza, storia, arte, filosofia o sport.`,

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

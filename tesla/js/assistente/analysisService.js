// Analysis Service - Analisi testi con AI
// Usa i modelli per sentiment, classificazione, QA

class AnalysisService {
    constructor() {
        this.sentimentThreshold = 0.8;
    }

    async analyzeSentiment(text) {
        try {
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
        try {
            const qa = await modelManager.getQAModel();

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
            // Analizza il messaggio
            const sentiment = await this.analyzeSentiment(userMessage);
            const intent = await this.classifyIntent(userMessage);
            const keywords = this.extractKeywords(userMessage);

            // Cerca informazioni rilevanti nella KB
            const relevantInfo = teslaKnowledgeBase.findRelevantInfo(userMessage);

            let response = '';
            let hasAnswer = false;

            if (relevantInfo) {
                hasAnswer = true;
                
                if (relevantInfo.type === 'product') {
                    response = this.formatProductResponse(relevantInfo.data, userMessage);
                } else if (relevantInfo.type === 'service') {
                    response = this.formatServiceResponse(relevantInfo.data, userMessage);
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

            // Fallback generico
            if (!hasAnswer) {
                response = this.generateGenericResponse(userMessage, intent, keywords);
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
                    modelUsed: 'Transformers.js (Xenova)'
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

    generateGenericResponse(userMessage, intent, keywords) {
        const responses = [
            `Ho cercato di trovare informazioni su "${keywords[0] || 'questo'}" ma non ho trovato corrispondenze esatte nella mia knowledge base Tesla. Prova a chiedere di un modello specifico (Model 3, Model S, Model X, Model Y) o di servizi come Supercharger, Autopilot, o Batteria.`,
            
            `Non sono sicuro di come rispondere a questo. Conosco bene i prodotti Tesla, i prezzi, le caratteristiche tecniche, il funzionamento del Supercharger e dell'Autopilot. Cosa vorresti sapere su questi argomenti?`,

            `Questa è una domanda interessante! Sfortunatamente non ho informazioni su questo nella mia knowledge base. Puoi contattare Tesla direttamente o visitare tesla.com per più dettagli.`,

            `Mi dispiace, non riesco a trovare una risposta precisa nel mio database. Prova a riformulare la domanda o chiedimi di un prodotto Tesla specifico.`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Singleton globale
const analysisService = new AnalysisService();

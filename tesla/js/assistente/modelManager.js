// Model Manager - Gestione modelli Transformers.js
// Carica e gestisce i modelli AI locali

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers';

class ModelManager {
    constructor() {
        this.models = {};
        this.isInitializing = false;
        this.initError = null;
        
        // Configura cache per modelli
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        
        // USA cache locale se disponibile
        // env.localModelPath = '/models/';
    }

    async initializeModels() {
        if (this.isInitializing) {
            console.log('Modelli già in caricamento...');
            return;
        }

        this.isInitializing = true;
        try {
            console.log('Caricamento modelli Transformers.js...');
            
            // Carica Sentiment Analysis (consigliato: distilbert leggero)
            console.log('→ Caricamento Sentiment Analysis...');
            this.models.sentiment = await pipeline(
                'sentiment-analysis',
                'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
                {
                    quantized: true, // Usa versione quantizzata (più veloce)
                    progress_callback: (p) => {
                        console.log(`  Sentiment: ${Math.round(p.progress * 100)}%`);
                    }
                }
            );
            console.log('✓ Sentiment Analysis caricato');

            // Carica Question Answering (per risposte da KB)
            console.log('→ Caricamento Question Answering...');
            this.models.qa = await pipeline(
                'question-answering',
                'Xenova/distilbert-base-cased-distilled-squad',
                {
                    quantized: true,
                    progress_callback: (p) => {
                        console.log(`  QA: ${Math.round(p.progress * 100)}%`);
                    }
                }
            );
            console.log('✓ Question Answering caricato');

            // Carica Zero-Shot Classification (per categoria domande)
            console.log('→ Caricamento Zero-Shot Classification...');
            this.models.zeroShot = await pipeline(
                'zero-shot-classification',
                'Xenova/mobilebert-uncased-mnli',
                {
                    quantized: true,
                    progress_callback: (p) => {
                        console.log(`  Zero-Shot: ${Math.round(p.progress * 100)}%`);
                    }
                }
            );
            console.log('✓ Zero-Shot Classification caricato');

            console.log('✓ Tutti i modelli caricati con successo!');
            return true;
        } catch (error) {
            this.initError = error;
            console.error('Errore caricamento modelli:', error);
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    async getSentimentAnalyzer() {
        if (!this.models.sentiment) {
            await this.initializeModels();
        }
        return this.models.sentiment;
    }

    async getQAModel() {
        if (!this.models.qa) {
            await this.initializeModels();
        }
        return this.models.qa;
    }

    async getZeroShotClassifier() {
        if (!this.models.zeroShot) {
            await this.initializeModels();
        }
        return this.models.zeroShot;
    }

    isReady() {
        return this.models.sentiment && this.models.qa && this.models.zeroShot;
    }

    clearCache() {
        this.models = {};
        console.log('Cache modelli svuotato');
    }

    getStatus() {
        return {
            isReady: this.isReady(),
            isInitializing: this.isInitializing,
            error: this.initError,
            loadedModels: Object.keys(this.models)
        };
    }
}

// Singleton globale
export const modelManager = new ModelManager();
window.modelManager = modelManager;

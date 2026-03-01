# Guida Implementazione Pratica - AI Solutions per Tesla

## 📚 Guida Tecnica con Codice Eseguibile

---

## 1. Setup Ambiente Base

```bash
# Crea nuovo progetto
npm init -y
npm install --save @huggingface/transformers onnxruntime-web
npm install --save-dev typescript ts-node

# Per LangChain.js RAG
npm install --save langchain @langchain/core @langchain/openai

# Per supporto Node.js + Browser
npm install --save-dev webpack webpack-cli tslib
```

**Configurazione TypeScript (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 2. Sentiment Analysis (Client-Side)

```typescript
// src/analysis/sentiment.ts

import { pipeline, env } from '@huggingface/transformers';

// Configura cache per modelli
env.localModelPath = '/models/';
env.allowLocalModels = true;

export class SentimentAnalyzer {
  private classifier: any;
  
  async initialize() {
    this.classifier = await pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
  }
  
  async analyze(text: string) {
    return await this.classifier(text);
    // Returns: [{ label: 'POSITIVE', score: 0.9998 }]
  }
  
  async batchAnalyze(texts: string[]) {
    return Promise.all(
      texts.map(text => this.analyze(text))
    );
  }
}

// Utilizzo
const analyzer = new SentimentAnalyzer();
await analyzer.initialize();

const result = await analyzer.analyze('Tesla è un'azienda innovativa!');
console.log(result); // { label: 'POSITIVE', score: 0.997 }
```

---

## 3. Named Entity Recognition (NER)

```typescript
// src/analysis/ner.ts

import { pipeline } from '@huggingface/transformers';

export class EntityExtractor {
  private classifier: any;
  
  async initialize() {
    this.classifier = await pipeline(
      'token-classification',
      'Xenova/dbmdz-bert-large-cased-finetuned-conll03-english'
    );
  }
  
  async extract(text: string) {
    const entities = await this.classifier(text);
    
    // Aggrega entities contigui
    const grouped = this.groupEntities(entities);
    return grouped;
  }
  
  private groupEntities(entities: any[]) {
    const grouped: { [key: string]: string[] } = {};
    
    entities.forEach(entity => {
      const type = entity.entity.split('-')[1]; // Remove I-, B- prefix
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(entity.word.replace('##', ''));
    });
    
    return grouped;
  }
}

// Utilizzo
const extractor = new EntityExtractor();
await extractor.initialize();

const entities = await extractor.extract(
  'Elon Musk ha fondato Tesla a San Francisco nel 2003.'
);
// {
//   PERSON: ['Elon', 'Musk'],
//   ORG: ['Tesla'],
//   LOC: ['San', 'Francisco']
// }
```

---

## 4. Question Answering (RAG Local)

```typescript
// src/rag/local-qa.ts

import { pipeline } from '@huggingface/transformers';

export class LocalQAEngine {
  private qaModel: any;
  private knowledgeBase: { [key: string]: string } = {};
  
  async initialize() {
    this.qaModel = await pipeline(
      'question-answering',
      'Xenova/distilbert-base-cased-distilled-squad'
    );
  }
  
  async addDocument(id: string, content: string) {
    this.knowledgeBase[id] = content;
  }
  
  async query(question: string) {
    const answers = [];
    
    for (const [docId, context] of Object.entries(this.knowledgeBase)) {
      try {
        const answer = await this.qaModel({
          question,
          context
        });
        
        if (answer.score > 0.1) { // Filter low confidence
          answers.push({
            docId,
            ...answer,
            score: answer.score
          });
        }
      } catch (e) {
        // Context troppo lungo o altro errore
        console.warn(`Errore QA per doc ${docId}`);
      }
    }
    
    // Ritorna top risultato
    return answers.sort((a, b) => b.score - a.score)[0];
  }
}

// Utilizzo
const qaEngine = new LocalQAEngine();
await qaEngine.initialize();

// Carica Tesla Knowledge Base
await qaEngine.addDocument('model3', `
  Tesla Model 3 è una berlina elettrica compatta.
  Prezzo base: $43,990. Accelerazione 0-100 km/h: 5.8 secondi.
  Autonomia: fino a 568 km con una carica.
`);

await qaEngine.addDocument('supercharging', `
  La rete Supercharger di Tesla ha oltre 60,000 stazioni nel mondo.
  Tempo ricarica: 15 minuti per 200 km di autonomia.
  Disponibile solo per veicoli Tesla.
`);

const answer = await qaEngine.query(
  'Quanto costa un Model 3?'
);
console.log(answer);
// {
//   answer: '$43,990',
//   score: 0.987,
//   docId: 'model3'
// }
```

---

## 5. LangChain.js RAG (Serverless Compatible)

```typescript
// src/rag/langchain-rag.ts

import { VectorStoreIndex, Document } from 'llamaindex';
import { OpenAI } from 'langchain/llms/openai';
import { HuggingFaceInference } from 'langchain/embeddings/hf';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

export class TeslaKnowledgeBase {
  private index: any;
  private retriever: any;
  private llm: OpenAI;
  
  constructor() {
    // Inizializza modello
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.5
    });
  }
  
  async initialize(documents: { text: string; metadata?: any }[]) {
    // Crea embeddings
    const embeddings = new HuggingFaceInference({
      apiKey: process.env.HF_API_KEY,
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });
    
    // Crea indice
    const docs = documents.map(
      d => new Document({ pageContent: d.text, metadata: d.metadata })
    );
    
    // Opzione 1: In-memory (per MVP)
    this.retriever = await VectorStoreIndex.fromDocuments(docs);
    
    // Opzione 2: Pinecone (per production)
    // this.retriever = await PineconeStore.fromDocuments(docs, embeddings, {
    //   pineconeIndex: 'tesla-kb',
    //   namespace: 'products'
    // });
  }
  
  async query(question: string) {
    // Retrieval
    const context = await this.retriever.asQueryEngine().query(question);
    
    // Augmentation + Generation
    const response = await this.llm.call(`
      Context: ${context}
      Question: ${question}
      
      Rispondi basandoti solo sul contesto fornito.
      Se non conosci la risposta, di' "Non ho questa informazione."
    `);
    
    return {
      answer: response,
      sources: context.sourceNodes.map(n => n.metadata)
    };
  }
}

// Utilizzo
const tesla_kb = new TeslaKnowledgeBase();

await tesla_kb.initialize([
  {
    text: 'Model S è la berlina di lusso di Tesla...',
    metadata: { product: 'Model S', type: 'product' }
  },
  {
    text: 'Autopilot è il sistema di guida autonoma...',
    metadata: { feature: 'Autopilot', type: 'feature' }
  }
]);

const result = await tesla_kb.query('Come funziona Autopilot?');
```

---

## 6. Speech-to-Text Integration

```typescript
// src/voice/speech-recognizer.ts

export class SpeechRecognizer {
  private recognition: any;
  private isListening = false;
  
  constructor() {
    // Use native Web Speech API (free, browser-based)
    const SpeechRecognition = (window as any).SpeechRecognition 
      || (window as any).webkitSpeechRecognition;
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'it-IT';
    this.recognition.continuous = false;
  }
  
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Listening...');
      };
      
      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        resolve(transcript);
      };
      
      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.start();
    });
  }
  
  stop() {
    this.recognition.stop();
    this.isListening = false;
  }
}

// Per backend: Azure Speech-to-Text
async function transcribeWithAzure(audioStream: any) {
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_REGION;
  
  const response = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'audio/wav',
      },
      body: audioStream
    }
  );
  
  return await response.json();
}
```

---

## 7. Image Generation (Replicate)

```typescript
// src/image/replicate-generator.ts

const Replicate = require('replicate');

export class ImageGenerator {
  private client: any;
  
  constructor(apiToken: string) {
    this.client = new Replicate({ auth: apiToken });
  }
  
  async generateImage(prompt: string, options?: {
    model?: string;
    width?: number;
    height?: number;
  }) {
    const model = options?.model || 
      'black-forest-labs/flux-pro';
    
    try {
      const output = await this.client.run(model, {
        input: {
          prompt,
          width: options?.width || 1024,
          height: options?.height || 1024,
          num_outputs: 1
        }
      });
      
      return output[0]; // URL immagine
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }
  
  async editImage(imageUrl: string, prompt: string) {
    // Per modelli che supportano il-to-image
    const output = await this.client.run(
      'stability-ai/sdxl',
      {
        input: {
          image: imageUrl,
          prompt
        }
      }
    );
    
    return output[0];
  }
}

// Utilizzo
const generator = new ImageGenerator(process.env.REPLICATE_API_TOKEN!);

const imageUrl = await generator.generateImage(
  'A sleek Tesla electric car on a futuristic highway, neon lights'
);

console.log('Generated:', imageUrl);
```

---

## 8. Chat Widget Component (React)

```typescript
// src/components/TeslaAIChat.tsx

import React, { useState, useRef } from 'react';
import { SentimentAnalyzer } from '../analysis/sentiment';
import { LocalQAEngine } from '../rag/local-qa';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string;
}

export const TeslaAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const qaEngine = useRef<LocalQAEngine | null>(null);
  const analyzer = useRef<SentimentAnalyzer | null>(null);
  
  // Init models
  React.useEffect(() => {
    const init = async () => {
      qaEngine.current = new LocalQAEngine();
      analyzer.current = new SentimentAnalyzer();
      
      await qaEngine.current.initialize();
      await analyzer.current.initialize();
      
      // Carica KB
      await qaEngine.current.addDocument('intro', 
        'Ciao! Sono l\'Assistente IA di Tesla. Posso aiutarti con...');
    };
    
    init();
  }, []);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Aggiungi messaggio utente
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setIsLoading(true);
    
    try {
      // Analizza sentimento dell'input
      const sentiment = await analyzer.current!.analyze(input);
      
      // Genera risposta
      const answer = await qaEngine.current!.query(input);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer?.answer || 'Non ho trovato una risposta.',
        sentiment: sentiment[0].label
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Errore nel processare la richiesta.'
      }]);
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="tesla-chat-widget">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.sentiment && (
              <span className={`sentiment ${msg.sentiment.toLowerCase()}`}>
                {msg.sentiment}
              </span>
            )}
          </div>
        ))}
        {isLoading && <div className="loading">Elaborazione...</div>}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Chia una domanda su Tesla..."
        />
        <button onClick={handleSend} disabled={isLoading}>
          Invia
        </button>
      </div>
    </div>
  );
};
```

---

## 9. Streaming Response (Alternative per LLM remoti)

```typescript
// src/llm/streaming.ts

export async function streamResponse(
  question: string,
  onChunk: (text: string) => void,
  apiKey: string
) {
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: question }],
        stream: true
      })
    }
  );
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const chunk = data.choices[0].delta.content;
          if (chunk) onChunk(chunk);
        } catch (e) {
          // Skip parsing errors
        }
      }
    }
  }
}
```

---

## 10. Deployable Stack (Next.js)

```typescript
// pages/api/ask.ts - API Route (serverless)

import type { NextApiRequest, NextApiResponse } from 'next';
import { LocalQAEngine } from '@/lib/rag/local-qa';

let qaEngine: LocalQAEngine | null = null;

const initEngine = async () => {
  if (qaEngine) return qaEngine;
  
  qaEngine = new LocalQAEngine();
  await qaEngine.initialize();
  
  // Carica KB
  // await qaEngine.addDocument(...);
  
  return qaEngine;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { question } = req.body;
    const engine = await initEngine();
    const answer = await engine.query(question);
    
    res.status(200).json(answer);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
```

---

## 🔧 Production Deployment Checklist

```yaml
Optimization:
  - ✅ Model quantization (q4/q8)
  - ✅ CDN caching per modelli
  - ✅ Service Workers per offline
  - ✅ Lazy loading components

Monitoring:
  - ✅ Error tracking (Sentry)
  - ✅ Performance metrics (Web Vitals)
  - ✅ API latency monitoring
  - ✅ Model inference time logs

Security:
  - ✅ Rate limiting API
  - ✅ Input sanitization
  - ✅ CORS configuration
  - ✅ API key rotation
  - ✅ Data privacy compliance

Testing:
  - ✅ Unit tests (Jest)
  - ✅ Integration tests
  - ✅ E2E tests (Playwright)
  - ✅ Model accuracy tests
  - ✅ Load testing

CI/CD:
  - ✅ GitHub Actions
  - ✅ Automated testing
  - ✅ Deployment pipelines
  - ✅ Rollback strategy
```

---

**Ultimo Aggiornamento:** 1 Marzo 2026

# Quick Start Template - Progetto Tesla AI

## 📦 Setup Progetto in 5 Minuti

### 1. Clona template base
```bash
# Crea cartella progetto
mkdir tesla-ai-app && cd tesla-ai-app

# Inizializza package.json
npm init -y
npm install --save @huggingface/transformers onnxruntime-web

# Per versione Next.js (consigliato)
npx create-next-app@latest tesla-ai --typescript --tailwind
cd tesla-ai
npm install @huggingface/transformers onnxruntime-web
```

---

## 🎯 Progetto Minimo Funzionante (MVP)

### Struttura Cartelle
```
src/
├── components/
│   ├── ChatWidget.tsx         # Widget chat
│   └── AnalysisPanel.tsx      # Panel analisi sentiment
├── lib/
│   ├── models/
│   │   ├── sentiment.ts       # Sentiment analysis
│   │   ├── qa.ts             # Question answering
│   │   └── ner.ts            # Entity recognition
│   └── kb/
│       └── tesla-docs.ts     # Knowledge base
├── pages/
│   ├── index.tsx             # Homepage
│   └── api/
│       └── chat.ts           # API endpoint (opzionale)
└── styles/
    └── globals.css           # Tailwind styles
```

---

## 🚀 Code Starter (TypeScript + React)

### 1️⃣ Model Manager Centralizzato

```typescript
// src/lib/ModelManager.ts

import { pipeline, env } from '@huggingface/transformers';

export class ModelManager {
  private static instance: ModelManager;
  private models: { [key: string]: any } = {};
  
  private constructor() {
    // Cache models in /public/models
    env.localModelPath = '/models/';
    env.allowLocalModels = true;
  }
  
  static getInstance() {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }
  
  async getModel(
    modelName: string,
    modelId: string,
    force = false
  ) {
    if (!force && this.models[modelName]) {
      return this.models[modelName];
    }
    
    console.log(`Loading ${modelName}...`);
    const model = await pipeline(modelName, modelId);
    this.models[modelName] = model;
    return model;
  }
  
  clearCache() {
    this.models = {};
    console.log('Model cache cleared');
  }
}
```

### 2️⃣ Service Layer

```typescript
// src/lib/services/AnalysisService.ts

import { ModelManager } from '../ModelManager';

export class AnalysisService {
  private manager = ModelManager.getInstance();
  
  async analyzeSentiment(text: string) {
    const classifier = await this.manager.getModel(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    
    const result = await classifier(text);
    return {
      text,
      sentiment: result[0].label,
      score: result[0].score,
      timestamp: new Date().toISOString()
    };
  }
  
  async extractEntities(text: string) {
    const classifier = await this.manager.getModel(
      'token-classification',
      'Xenova/dbmdz-bert-large-cased-finetuned-conll03-english'
    );
    
    const entities = await classifier(text);
    return this.groupEntities(entities);
  }
  
  async answerQuestion(question: string, context: string) {
    const qa = await this.manager.getModel(
      'question-answering',
      'Xenova/distilbert-base-cased-distilled-squad'
    );
    
    try {
      const result = await qa({ question, context });
      return {
        answer: result.answer,
        score: result.score,
        context: context.substring(
          result.start,
          result.end + 50
        )
      };
    } catch (error) {
      return { error: 'Unable to find answer in context' };
    }
  }
  
  private groupEntities(entities: any[]) {
    const grouped: { [key: string]: string[] } = {};
    
    entities.forEach(entity => {
      const type = entity.entity.split('-')[1];
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(entity.word.replace('##', ''));
    });
    
    return grouped;
  }
}
```

### 3️⃣ Main Chat Component

```typescript
// src/components/TeslaChatWidget.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnalysisService } from '@/lib/services/AnalysisService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  entities?: { [key: string]: string[] };
  timestamp: Date;
}

export default function TeslaChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analysisService = useRef<AnalysisService | null>(null);
  
  // Initialize service
  useEffect(() => {
    analysisService.current = new AnalysisService();
  }, []);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Analisi simultanea
      const analysis = await analysisService.current!.analyzeSentiment(input);
      const entities = await analysisService.current!.extractEntities(input);
      
      // Simula risposta intelligente basata su sentiment
      let responseContent = '';
      
      if (analysis.sentiment === 'POSITIVE') {
        responseContent = `Grazie per il feedback positivo! 😊 
        
Ho rilevato entità: ${Object.entries(entities)
  .map(([type, values]) => `${type}: ${values.join(', ')}`)
  .join(' | ') || 'nessuna'}

Come posso aiutarti ulteriormente con Tesla?`;
      } else if (analysis.sentiment === 'NEGATIVE') {
        responseContent = `Mi dispiace che tu abbia una preoccupazione. 😔
        
Capisco che menzioni: ${Object.entries(entities)
  .map(([type, values]) => `${type}: ${values.join(', ')}`)
  .join(' | ') || 'alcuni argomenti'}

Raccontami di più sulla tua situazione per poter aiutare meglio.`;
      } else {
        responseContent = `Interessante! Ho notato:
        
Entità: ${Object.entries(entities)
  .map(([type, values]) => `${type}: ${values.join(', ')}`)
  .join(' | ') || 'nessuna'}

Cosa vorresti sapere su Tesla?`;
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        sentiment: analysis.sentiment as any,
        entities,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Errore: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">🤖 Tesla AI Assistant</h1>
        <p className="text-sm opacity-90">Analisi intelligente alimentata da IA locale</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Ciao! Sono l'Assistente IA di Tesla</p>
              <p className="text-sm">Fammi una domanda su Tesla, automobile, o altro...</p>
            </div>
          </div>
        )}
        
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg
                ${msg.role === 'user'
                  ? 'bg-red-600 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
            >
              <p className="text-sm">{msg.content}</p>
              
              {msg.sentiment && (
                <div className="mt-2 text-xs opacity-75">
                  📊 Sentiment: <span className="font-semibold">
                    {msg.sentiment}
                  </span>
                </div>
              )}
              
              {msg.entities && Object.keys(msg.entities).length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  🏷️ Entità: {Object.entries(msg.entities)
                    .map(([type, values]) => `${type}: ${values.join(', ')}`)
                    .join(' · ')}
                </div>
              )}
              
              <div className="text-xs opacity-50 mt-1">
                {msg.timestamp.toLocaleTimeString('it-IT')}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-gray-600 bg-gray-800 p-4">
        {error && (
          <div className="bg-red-900 text-red-100 p-2 rounded mb-2 text-sm">
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Scrivi il tuo messaggio..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '...' : '▶️'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 4️⃣ Home Page (Next.js)

```typescript
// src/app/page.tsx

'use client';

import TeslaChatWidget from '@/components/TeslaChatWidget';

export default function Home() {
  return (
    <main className="w-full h-screen">
      <TeslaChatWidget />
    </main>
  );
}
```

### 5️⃣ Tailwind Config (se non già configurato)

```javascript
// tailwind.config.js

module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        bounce: 'bounce 1s infinite',
      },
      transitionDelay: {
        100: '100ms',
        200: '200ms',
      }
    },
  },
  plugins: [],
}
```

---

## 📥 Download Modelli in Anticipo

```bash
# Crea cartella modelli
mkdir public/models

# Download tramite Hugingface CLI (opzionale)
# Questo accelera il caricamento iniziale
huggingface-cli download \
  Xenova/distilbert-base-uncased-finetuned-sst-2-english \
  --cache-dir=public/models
```

---

## 🔥 Feature Aggiuntive

### Modalità Offline

```typescript
// src/lib/services/OfflineService.ts

export class OfflineService {
  static isOnline = navigator.onLine;
  
  static init() {
    window.addEventListener('online', () => {
      OfflineService.isOnline = true;
      console.log('🟢 Online');
    });
    
    window.addEventListener('offline', () => {
      OfflineService.isOnline = false;
      console.log('🔴 Offline');
    });
  }
}
```

### Database Locale (IndexedDB)

```typescript
// src/lib/db/ChatDB.ts

export class ChatDB {
  private dbName = 'tesla-ai-db';
  
  async saveMessage(message: ChatMessage) {
    const db = await this.getDB();
    const tx = db.transaction('messages', 'readwrite');
    tx.store.add(message);
    await tx.done;
  }
  
  async getMessages() {
    const db = await this.getDB();
    return await db.getAll('messages');
  }
  
  private async getDB() {
    return new Promise<any>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('messages', { autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

---

## 🚀 Deploy

### Vercel (Consigliato)
```bash
npm install -g vercel
vercel # interattivo deployment
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Build Statico
```bash
npm run build
# Output in .next/ per hosting statico
```

---

## ✅ Checklist Deployment

- [ ] Models cached localmente
- [ ] Environment variables configurate (.env.local)
- [ ] Error handling implementato
- [ ] Loading states visibili
- [ ] Offline functionality testata
- [ ] Mobile responsive verificato
- [ ] Lighthouse score > 80
- [ ] Security headers configurati

---

## 📊 Metrics da Monitorare

```typescript
// src/lib/analytics/metrics.ts

export class Metrics {
  static track(event: string, data?: any) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data);
    }
  }
  
  static trackModelLoad(modelName: string, duration: number) {
    this.track('model_loaded', {
      model: modelName,
      duration_ms: duration
    });
  }
  
  static trackQuery(type: string, success: boolean) {
    this.track('query_executed', {
      type,
      success
    });
  }
}
```

---

**Pronto per iniziare? Esegui:**
```bash
npm run dev
# Visita http://localhost:3000
```

**Ultimo Aggiornamento:** 1 Marzo 2026

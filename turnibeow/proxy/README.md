# Proxy for Turni AI

Questa cartella contiene il codice del proxy da caricare su `www.ldm4app.com/turni/proxy` (o similare).
Il servizio accetta richieste POST da browser e inoltra i dati ai provider remoti (Gemini, Grok, Groq, OpenAI)
con la chiave memorizzata solo sul server.

## Installazione
```bash
cd proxy
npm install
GEMINI_KEY=your_gemini_key GROK_KEY=your_grok_key OPENAI_KEY=your_openai_key node server.js
```

## Endpoint disponibili
- `/proxy/gemini` : Google Generative Language
- `/proxy/grok`   : xAI Grok
- `/proxy/groq`   : alias (typo) per Grok, usato da soccer-app
- `/proxy/openai` : opzionale fallback verso OpenAI

Ogni endpoint passando "key" nel body sovrascrive la chiave server (utile per testing).

## Esempio Nginx
```nginx
location /turni/proxy/ {
  proxy_pass http://127.0.0.1:3000/;
  # ...set headers/CORS come nel file di esempio già presente...
}
```

Una volta caricati questi file nella cartella `www.ldm4app.com/turni/proxy` e avviato
il server Node, le pagine client (`ia.turni.html`, `soccer-app.html`) possono
chiamare `/turni/proxy/grok`, `/turni/proxy/gemini` ecc. senza incorrere in errori CORS.
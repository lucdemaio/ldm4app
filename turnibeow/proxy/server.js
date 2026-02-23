/*
 * Lightweight proxy for Gemini/Grok requests
 * Place this directory under your web server (e.g. www.ldm4app.com/turni/proxy)
 * and run with:
 *   cd proxy && npm install && node server.js
 *
 * The proxy will accept POST requests to /proxy/gemini, /proxy/grok
 * and /proxy/groq (common typo seen in soccer-app).  It forwards the JSON
 * body to the corresponding remote API using a server-side key, avoiding
 * CORS errors in the browser.
 *
 * Environment variables:
 *   GEMINI_KEY  - Google Generative API key (optional if sent in body)
 *   GROK_KEY    - xAI Grok key (optional if sent in body)
 *   OPENAI_KEY  - OpenAI key (used as fallback)
 *   ALLOWED_ORIGINS - comma separated list of origins allowed by CORS
 */

const express = require('express');
const cors = require('cors');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config();

const app = express();

// configure CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (allowedOrigins.length) {
  app.use(cors({ origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins.includes(origin));
  }}));
  console.log('CORS restricted to:', allowedOrigins);
} else {
  app.use(cors());
  console.log('CORS unrestricted');
}

app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, note: 'proxy listening' }));

function forward(url, keyName, req, res) {
  const serverKey = process.env[keyName] || req.body?.key || null;
  if (!serverKey) {
    return res.status(500).json({ error: `${keyName} missing` });
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serverKey}` },
    body: JSON.stringify(req.body)
  })
    .then(r => r.text().then(txt => ({ status: r.status, text: txt })))
    .then(r => res.status(r.status).send(r.text))
    .catch(err => res.status(502).json({ error: err.message }));
}

// grok endpoint
app.post('/proxy/grok', (req, res) => {
  forward('https://api.grok.ai/v1/generate', 'GROK_KEY', req, res);
});

// groq typo
app.post('/proxy/groq', (req, res) => {
  forward('https://api.grok.ai/v1/generate', 'GROK_KEY', req, res);
});

// gemini endpoint
app.post('/proxy/gemini', (req, res) => {
  forward('https://generativelanguage.googleapis.com/v1/models/' +
          (req.body?.model || 'models/gemini-2.5-flash') +
          ':generate', 'GEMINI_KEY', req, res);
});

// optional OpenAI fallback route
app.post('/proxy/openai', (req, res) => {
  forward('https://api.openai.com/v1/chat/completions', 'OPENAI_KEY', req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`proxy listening on http://localhost:${PORT}`));

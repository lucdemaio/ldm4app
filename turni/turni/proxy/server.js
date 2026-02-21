/* Minimal proxy server for Grok/OpenAI
   Place this folder under your webapp deployment (example: /turni/proxy)
   Usage (local dev):
     cd turni/proxy
     npm install
     GROK_KEY=your_grok_key node server.js

   Security: keep GROK_KEY on the server. This proxy forwards JSON POSTs
   from the browser to the provider and returns the provider response.
*/

const express = require('express');
const cors = require('cors');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config();

const app = express();

// Configure CORS from env (comma-separated origins) for production safety.
// If ALLOWED_ORIGINS is empty, allow all (useful for local/dev).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
if (allowedOrigins.length) {
  app.use(cors({ origin: function(origin, cb) {
    // allow non-browser requests (no origin) and allowedOrigins only
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins.includes(origin));
  }}));
  console.log('CORS restricted to:', allowedOrigins);
} else {
  app.use(cors());
  console.log('CORS: unrestricted (ALLOWED_ORIGINS not set)');
}

app.use(express.json());

// Health/info
app.get('/', (req, res) => res.json({ ok: true, note: 'Turni proxy ready' }));

// Forward to Grok. Accepts client POST JSON; uses server GROK_KEY if set,
// otherwise (fallback, dev only) will accept a "key" field in the body.
app.post('/proxy/grok', async (req, res) => {
  const serverKey = process.env.GROK_KEY || req.body?.key || null;
  if (!serverKey) return res.status(500).json({ error: 'GROK_KEY missing on server and no key in request body' });

  try {
    const r = await fetch('https://api.grok.ai/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serverKey}` },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Forward to Gemini (Google Generative Language) — uses GEMINI_KEY on server or key in request body
app.post('/proxy/gemini', async (req, res) => {
  const serverKey = process.env.GEMINI_KEY || req.body?.key || null;
  if (!serverKey) return res.status(500).json({ error: 'GEMINI_KEY missing on server and no key in request body' });
  const model = (req.body && req.body.model) ? req.body.model : 'models/gemini-2.5-flash';
  const promptText = req.body && (req.body.prompt || req.body.input) ? (req.body.prompt || req.body.input) : '';
  const maxOutputTokens = req.body && (req.body.max_tokens || req.body.maxOutputTokens) ? (req.body.max_tokens || req.body.maxOutputTokens) : 512;
  const temperature = (req.body && req.body.temperature !== undefined) ? req.body.temperature : 0.2;
  const glBody = { prompt: { text: String(promptText) }, maxOutputTokens, temperature };

  const useAuthHeader = serverKey.startsWith('ya29.') || serverKey.startsWith('ya29');
  let url = `https://generativelanguage.googleapis.com/v1/models/${model}:generate`;
  const headers = { 'Content-Type': 'application/json' };
  if (useAuthHeader) headers.Authorization = `Bearer ${serverKey}`; else url += `?key=${encodeURIComponent(serverKey)}`;

  try {
    let r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(glBody) });
    if (r.status === 404) {
      // fallback to v1beta2 if available
      url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generate`;
      r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(glBody) });
    }
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Optionally forward to OpenAI-compatible endpoint (if you want)
app.post('/proxy/openai', async (req, res) => {
  const serverKey = process.env.OPENAI_KEY || req.body?.key || null;
  if (!serverKey) return res.status(500).json({ error: 'OPENAI_KEY missing on server and no key in request body' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serverKey}` },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Turni proxy listening on http://localhost:${PORT}`));

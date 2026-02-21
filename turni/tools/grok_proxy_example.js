/*
Minimal proxy example for Grok / OpenAI (for local testing when provider blocks browser CORS).
Usage:
  1) Install: npm init -y && npm install express cors node-fetch dotenv
     (Node 18+ has global fetch; node-fetch used for compatibility)
  2) Create .env with GROK_KEY and/or OPENAI_KEY
  3) Run: node tools/grok_proxy_example.js
  4) POST JSON to /proxy/grok or /proxy/openai

Security: keep API keys on server-side only. This is an example for local/dev use.
*/

const express = require('express');
const cors = require('cors');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Forward to Grok (server-side key from env)
app.post('/proxy/grok', async (req, res) => {
  const apiKey = process.env.GROK_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROK_KEY missing in .env' });
  try {
    const r = await fetch('https://api.grok.ai/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Forward to Gemini (Google Generative Language) — allows server GEMINI_KEY or key in body for dev
app.post('/proxy/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_KEY || req.body?.key || null;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_KEY missing in .env and no key provided' });
  const model = req.body?.model || 'models/gemini-2.5-flash';
  const body = { prompt: { text: req.body?.prompt || req.body?.input || '' }, maxOutputTokens: req.body?.max_tokens || 256 };
  try {
    let url = `https://generativelanguage.googleapis.com/v1/models/${model}:generate`;
    // if using API key (not OAuth) pass ?key=
    if (!apiKey.startsWith('ya29.')) url += `?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: apiKey.startsWith('ya29.') ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Forward to OpenAI-compatible endpoint (useful if you want to expose OpenAI via server)
app.post('/proxy/openai', async (req, res) => {
  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_KEY missing in .env' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on http://localhost:${port}`));

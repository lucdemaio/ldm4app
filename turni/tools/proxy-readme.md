Proxy example (tools/grok_proxy_example.js)

Purpose
- Small Express proxy to forward requests to Gemini (Google Generative), Grok or OpenAI from the browser without exposing your API key.

Quick start
1. cd to project root
2. npm init -y
3. npm i express cors node-fetch dotenv
4. create a .env file with:
   GROK_KEY=your_grok_key_here
   OPENAI_KEY=your_openai_key_here
5. node tools/grok_proxy_example.js
6. From browser code, POST to http://localhost:3000/proxy/grok (body forwarded to Grok)

Security
- Never store production API keys in client-side code. Use this proxy only for local/dev testing or implement proper auth on the server.
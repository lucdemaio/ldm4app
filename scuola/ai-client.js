/* ai-client.js — gestione della API key e chiamate alle API Google Generative */
let _googleApiKey = ""; // in-memory only

export function getApiKey(){ return _googleApiKey; }
export function setApiKey(key){ _googleApiKey = key; }
export function clearApiKey(){ _googleApiKey = ''; }

export async function listAvailableModels(){
  if(!_googleApiKey) throw new Error('API Key non configurata.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(_googleApiKey)}`;
  const res = await fetch(url);
  if(!res.ok){
    const t = await res.text();
    throw new Error(`ListModels failed ${res.status}: ${t}`);
  }
  const json = await res.json();
  return (json.models || []).map(m => m.name || m.displayName || JSON.stringify(m));
}

// Chiamata generica al modello testuale (generateContent con fallback generateText)
export async function chiediAiutoIA(promptUtente, modelName){
  if(!_googleApiKey) throw new Error('API Key non configurata.');

  const sel = modelName || '';
  const modelResource = sel || 'models/gemini-2.5-pro';

  const instruction = `Sei un tutor universitario. Usa LaTeX per le formule matematiche, fornisci codice commentato, includi diagrammi Mermaid quando utile, e termina con una sezione "Concetti Fondamentali".`;
  const body = { prompt: `${instruction}\n\nUtente: ${promptUtente}` };

  const contentEndpoint = `https://generativelanguage.googleapis.com/v1beta/${modelResource}:generateContent?key=${encodeURIComponent(_googleApiKey)}`;
  const contentReq = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt }] }] }) };

  let res = await fetch(contentEndpoint, contentReq);
  if(!res.ok){
    const errText = await res.text();
    // 404 -> list models
    if(res.status === 404){
      try{ const models = await listAvailableModels(); throw new Error(`Modello non trovato (404). Modelli disponibili: ${models.join(', ')}`); }
      catch(inner){ throw new Error(`Modello non trovato (404). Impossibile elencare i modelli: ${inner.message}`); }
    }
    // fallback generateText
    if(res.status === 400 || /not supported for generateContent|unsupported/i.test(errText)){
      const textEndpoint = `https://generativelanguage.googleapis.com/v1beta/${modelResource}:generateText?key=${encodeURIComponent(_googleApiKey)}`;
      const textReqBody = { prompt: { text: body.prompt } };
      const textRes = await fetch(textEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(textReqBody) });
      if(!textRes.ok){ const tErr = await textRes.text(); throw new Error(`generateText fallback failed ${textRes.status}: ${tErr}`); }
      const tJson = await textRes.json();
      const tText = tJson.candidates?.[0]?.content?.parts?.[0]?.text || tJson.output?.[0]?.content || tJson.result?.output || JSON.stringify(tJson);
      return tText;
    }

    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || data.output?.[0]?.content || JSON.stringify(data);
  return text;
}

// Image generation — tries common Google image endpoints and extracts base64/URIs
// generateImageAI removed (Photo Creator disabled) // function intentionally removed to clean up unused image-generation code
  // model/image generation removed
  // endpoint removed (image generation disabled)
  // request body removed (image generation disabled)
  // fetch removed (image generation disabled)
  if(!res.ok){ const t = await res.text(); throw new Error(`Image API error ${res.status}: ${t}`); }
  const json = await res.json();

  // find base64 or image URIs in response
  const results = [];
  // collectBase64 helper removed (unused)
  // b64 handling removed

  const uris = [];
  // collectUris removed
  if(uris.length){
    const out = [];
    // uri fetch removed
    return out;
  }

  // no-image error removed

// blobToDataURL removed (no longer used)

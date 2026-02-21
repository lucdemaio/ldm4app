/**
 * API Translator - Support per Grok e Gemini
 * Traduzioni multilingue via API
 */

const API_ENDPOINTS = {
  grok: {
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta',
    name: 'Grok (X.AI)'
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    name: 'Gemini (Google)'
  }
};

// Memorizza le prompt per efficienza
const getTranslationPrompt = (text, fromLang, toLang) => {
  return `Traduci il seguente testo da ${fromLang} a ${toLang}. 
Rispondi SOLO con la traduzione, senza spiegazioni aggiuntive.

Testo: "${text}"

Traduzione:`;
};

/**
 * Traduci usando Grok API
 */
export async function translateWithGrok(text, fromLang, toLang, apiKey) {
  if (!apiKey) throw new Error('Chiave Grok non configurata');
  
  try {
    const response = await fetch(API_ENDPOINTS.grok.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_ENDPOINTS.grok.model,
        messages: [
          {
            role: 'user',
            content: getTranslationPrompt(text, fromLang, toLang)
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Grok API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translated = data.choices[0]?.message?.content?.trim();
    
    if (!translated) {
      throw new Error('Nessuna risposta da Grok');
    }
    
    return translated;
  } catch (err) {
    console.error('[Grok API]', err);
    throw err;
  }
}

/**
 * Traduci usando Gemini API
 */
export async function translateWithGemini(text, fromLang, toLang, apiKey) {
  if (!apiKey) throw new Error('Chiave Gemini non configurata');
  
  try {
    const response = await fetch(`${API_ENDPOINTS.gemini.url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: getTranslationPrompt(text, fromLang, toLang)
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!translated) {
      throw new Error('Nessuna risposta da Gemini');
    }
    
    return translated;
  } catch (err) {
    console.error('[Gemini API]', err);
    throw err;
  }
}

/**
 * Seleziona il servizio API migliore disponibile
 */
export async function translateWithAvailableAPI(text, fromLang, toLang, apiKeys) {
  // Prova Grok first (più veloce generalmente)
  if (apiKeys.grok) {
    try {
      return await translateWithGrok(text, fromLang, toLang, apiKeys.grok);
    } catch (err) {
      console.warn('[API Translator] Grok failed:', err.message);
    }
  }

  // Fallback a Gemini
  if (apiKeys.gemini) {
    try {
      return await translateWithGemini(text, fromLang, toLang, apiKeys.gemini);
    } catch (err) {
      console.warn('[API Translator] Gemini failed:', err.message);
    }
  }

  throw new Error('Nessuna API chiave disponibile. Configura almeno una tra Grok o Gemini.');
}

/**
 * Valida una chiave API
 */
export async function validateAPIKey(service, apiKey) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Chiave API vuota');
  }

  try {
    if (service === 'grok') {
      // Test semplice
      await translateWithGrok('test', 'English', 'Italian', apiKey);
      return true;
    } else if (service === 'gemini') {
      // Test semplice
      await translateWithGemini('test', 'English', 'Italian', apiKey);
      return true;
    }
  } catch (err) {
    throw new Error(`Chiave ${service} non valida: ${err.message}`);
  }
}

export default {
  translateWithGrok,
  translateWithGemini,
  translateWithAvailableAPI,
  validateAPIKey,
};

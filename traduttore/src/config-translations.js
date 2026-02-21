/**
 * Configurazione traduzioni
 * Definisce quale modello usare per ogni coppia linguistica
 */

export const SUPPORTED_LANGUAGES = {
  // Lingue con modello ONNX locale (sempre disponibili)
  en: {
    name: 'Inglese',
    emoji: '🇬🇧',
    nativeName: 'English',
    color: '#2D5016',
    flores: 'eng_Latn',
    type: 'onnx',
    model: 'opus',
  },
  es: {
    name: 'Spagnolo',
    emoji: '🇪🇸',
    nativeName: 'Español',
    color: '#FF6B35',
    flores: 'spa_Latn',
    type: 'onnx',
    model: 'opus',
  },
  fr: {
    name: 'Francese',
    emoji: '🇫🇷',
    nativeName: 'Français',
    color: '#4169E1',
    flores: 'fra_Latn',
    type: 'onnx',
    model: 'opus',
  },

  // Lingue con API (richiedono chiave API)
  de: {
    name: 'Tedesco',
    emoji: '🇩🇪',
    nativeName: 'Deutsch',
    color: '#FFD700',
    type: 'api',
  },
  it: {
    name: 'Italiano',
    emoji: '🇮🇹',
    nativeName: 'Italiano',
    color: '#009246',
    type: 'api',
  },
  pt: {
    name: 'Portoghese',
    emoji: '🇵🇹',
    nativeName: 'Português',
    color: '#228B22',
    type: 'api',
  },
  ru: {
    name: 'Russo',
    emoji: '🇷🇺',
    nativeName: 'Русский',
    color: '#E30613',
    type: 'api',
  },
  pl: {
    name: 'Polacco',
    emoji: '🇵🇱',
    nativeName: 'Polski',
    color: '#DC143C',
    type: 'api',
  },
  nl: {
    name: 'Olandese',
    emoji: '🇳🇱',
    nativeName: 'Nederlands',
    color: '#FF6B35',
    type: 'api',
  },
  ja: {
    name: 'Giapponese',
    emoji: '🇯🇵',
    nativeName: '日本語',
    color: '#BC002D',
    type: 'api',
  },
  zh: {
    name: 'Cinese',
    emoji: '🇨🇳',
    nativeName: '中文',
    color: '#DE2910',
    type: 'api',
  },
  ar: {
    name: 'Arabo',
    emoji: '🌍',
    nativeName: 'العربية',
    color: '#006C35',
    type: 'api',
  },
};

/**
 * Ritorna le lingue disponibili offline (ONNX)
 */
export function getOfflineLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES)
    .filter(([_, config]) => config.type === 'onnx')
    .reduce((acc, [code, config]) => {
      acc[code] = config;
      return acc;
    }, {});
}

/**
 * Ritorna le lingue disponibili con API
 */
export function getAPILanguages() {
  return Object.entries(SUPPORTED_LANGUAGES)
    .filter(([_, config]) => config.type === 'api')
    .reduce((acc, [code, config]) => {
      acc[code] = config;
      return acc;
    }, {});
}

/**
 * Cambia lingua: da una coppia (fromLang, toLang)
 * Se locali: usa ONNX
 * Se almeno uno è API: richiede chiave API
 */
export function getTranslationMethod(fromLang, toLang, hasAPIKey = false) {
  const fromConfig = SUPPORTED_LANGUAGES[fromLang];
  const toConfig = SUPPORTED_LANGUAGES[toLang];

  if (!fromConfig || !toConfig) {
    return { type: 'error', reason: 'Lingua non supportata' };
  }

  // Se entrambe sono ONNX e sono una coppia supportata
  if (
    fromConfig.type === 'onnx' &&
    toConfig.type === 'onnx' &&
    fromLang === 'it'
  ) {
    return { type: 'onnx', pair: `it-${toLang}` };
  }

  // Se inversa (es: en->it)
  if (
    fromConfig.type === 'onnx' &&
    toConfig.type === 'onnx' &&
    toConfig.flores === 'ita_Latn'
  ) {
    return { type: 'onnx', pair: `it-${fromLang}`, reverse: true };
  }

  // Altrimenti richiede API
  if (!hasAPIKey) {
    return { type: 'needsAPI', reason: 'Configura almeno una chiave API (Grok o Gemini)' };
  }

  return { type: 'api', pair: `${fromLang}-${toLang}` };
}

export default {
  SUPPORTED_LANGUAGES,
  getOfflineLanguages,
  getAPILanguages,
  getTranslationMethod,
};

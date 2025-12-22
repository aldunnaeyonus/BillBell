import i18n, { LanguageDetectorModule, Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import { storage } from "../storage/storage"; 
import { userSettings } from "../storage/userSettings"; // Import settings to save currency
import "intl-pluralrules";

import en from "../locales/en.json";
import es from "../locales/es.json";
import de from "../locales/de.json";
import fr from "../locales/fr.json";
import ja from "../locales/ja.json";
import zhHans from "../locales/zh-Hans.json";
import ptBR from "../locales/pt-BR.json";
import it from "../locales/it.json";
import nl from "../locales/nl.json";

// --- 1. Define Language -> Currency Map ---
const CURRENCY_MAP: Record<string, string> = {
  // English Regions
  "en-US": "USD", "en-GB": "GBP", "en-CA": "CAD", 
  "en-AU": "AUD", "en-SG": "SGD", "en-IN": "INR",
  
  // Euro Zone
  "de-DE": "EUR", "de-AT": "EUR",
  "fr-FR": "EUR", "fr-BE": "EUR", 
  "it-IT": "EUR", "es-ES": "EUR", "nl-NL": "EUR",

  // Specific Currencies
  "ja-JP": "JPY", // Japan -> Yen
  "zh-CN": "CNY", "zh-Hans": "CNY", "zh-SG": "SGD", // China -> Yuan
  "pt-BR": "BRL", // Brazil -> Real
  "es-MX": "MXN", // Mexico -> Peso
  "fr-CA": "CAD", // Quebec -> CAD
  "fr-CH": "CHF", "de-CH": "CHF", "it-CH": "CHF", // Switzerland -> Franc
  "ru-RU": "RUB", // Russia -> Ruble
  "ko-KR": "KRW", // Korea -> Won

  // Fallbacks
  "en": "USD", "de": "EUR", "fr": "EUR", "it": "EUR", 
  "es": "EUR", "ja": "JPY", "pt": "BRL", "zh": "CNY", "nl": "EUR"
};

const resources: Resource = {
  // ... (Keep your existing resources object exactly as is)
  en: { translation: en },
  "en-US": { translation: en },
  "en-GB": { translation: en },
  "en-CA": { translation: en },
  "en-AU": { translation: en },
  "en-IN": { translation: en },
  "en-NZ": { translation: en },
  "en-IE": { translation: en },
  "en-ZA": { translation: en },
  "en-SG": { translation: en },
  "en-PH": { translation: en },

  es: { translation: es },
  "es-ES": { translation: es },
  "es-MX": { translation: es },
  "es-US": { translation: es },
  "es-AR": { translation: es },
  "es-CO": { translation: es },
  "es-CL": { translation: es },
  "es-PE": { translation: es },

  de: { translation: de },
  "de-DE": { translation: de },
  "de-AT": { translation: de },
  "de-CH": { translation: de },

  fr: { translation: fr },
  "fr-FR": { translation: fr },
  "fr-CA": { translation: fr },
  "fr-BE": { translation: fr },
  "fr-CH": { translation: fr },

  ja: { translation: ja },
  "ja-JP": { translation: ja },

  "zh-Hans": { translation: zhHans },
  "zh-CN": { translation: zhHans },
  "zh-SG": { translation: zhHans },

  "pt-BR": { translation: ptBR },
  pt: { translation: ptBR },

  it: { translation: it },
  "it-IT": { translation: it },
  "it-CH": { translation: it },

  nl: { translation: nl },
  "nl-NL": { translation: nl },
  "nl-BE": { translation: nl },
  "nl-SR": { translation: nl },
  "nl-AW": { translation: nl },
  "nl-SX": { translation: nl },

  "rm-CH": { translation: de }, 
};

const MODULE_TYPE = "languageDetector";
const LANGUAGE_KEY = "user-language";
const CURRENCY_KEY = "billbell_currency_code"; // Match key from userSettings.ts

const languageDetector: LanguageDetectorModule = {
  type: MODULE_TYPE,
  init: () => {},
  detect: () => {
    try {
      let detectedLng = storage.getString(LANGUAGE_KEY);

      // 1. If no language saved, detect from device
      if (!detectedLng) {
        const supportedLanguages = Object.keys(resources);
        const bestMatch = RNLocalize.findBestLanguageTag(supportedLanguages);
        detectedLng = bestMatch?.languageTag || "en";
        
        // Save Language
        storage.set(LANGUAGE_KEY, detectedLng);
      }

      // 2. AUTO-CURRENCY: Check if currency is missing (New or Existing User)
      // We check raw storage to see if it's explicitly set.
      if (!storage.contains(CURRENCY_KEY)) {
        // Map Language -> Currency (e.g., 'en-GB' -> 'GBP')
        const autoCurrency = CURRENCY_MAP[detectedLng] || "USD";
        
        // Save via UserSettings (or direct storage)
        userSettings.setCurrency(autoCurrency);
        console.log(`[i18n] Auto-detected currency: ${autoCurrency} for locale: ${detectedLng}`);
      }
      
      return detectedLng;
    } catch (error) {
      console.log("Error reading language", error);
      return "en";
    }
  },
  cacheUserLanguage: (language: string) => {
    storage.set(LANGUAGE_KEY, language);
    // Optional: If you want changing language to ALSO change currency for existing users,
    // you could uncomment the lines below. However, usually, users prefer these separate 
    // after the initial setup (e.g., an expat living abroad).
    
    /*
    const newCurrency = CURRENCY_MAP[language];
    if (newCurrency) {
       userSettings.setCurrency(newCurrency);
    }
    */
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4", 
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false, 
    },
  });

export default i18n;
import i18n, { LanguageDetectorAsyncModule, Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const resources: Resource = {
  // --- English (World) ---
  en: { translation: en },
  "en-US": { translation: en }, // USA
  "en-GB": { translation: en }, // UK
  "en-CA": { translation: en }, // Canada
  "en-AU": { translation: en }, // Australia
  "en-IN": { translation: en }, // India
  "en-NZ": { translation: en }, // New Zealand
  "en-IE": { translation: en }, // Ireland
  "en-ZA": { translation: en }, // South Africa
  "en-SG": { translation: en }, // Singapore
  "en-PH": { translation: en }, // Philippines

  // --- Spanish (World) ---
  es: { translation: es },
  "es-ES": { translation: es }, // Spain
  "es-US": { translation: es }, // USA
  "es-MX": { translation: es }, // Mexico
  "es-419": { translation: es }, // Latin America (Generic)
  "es-AR": { translation: es }, // Argentina
  "es-BO": { translation: es }, // Bolivia
  "es-CL": { translation: es }, // Chile
  "es-CO": { translation: es }, // Colombia
  "es-CR": { translation: es }, // Costa Rica
  "es-CU": { translation: es }, // Cuba
  "es-DO": { translation: es }, // Dominican Republic
  "es-EC": { translation: es }, // Ecuador
  "es-GT": { translation: es }, // Guatemala
  "es-HN": { translation: es }, // Honduras
  "es-NI": { translation: es }, // Nicaragua
  "es-PA": { translation: es }, // Panama
  "es-PE": { translation: es }, // Peru
  "es-PR": { translation: es }, // Puerto Rico
  "es-PY": { translation: es }, // Paraguay
  "es-SV": { translation: es }, // El Salvador
  "es-UY": { translation: es }, // Uruguay
  "es-VE": { translation: es }, // Venezuela

  // --- German (DACH + Microstates) ---
  de: { translation: de },
  "de-DE": { translation: de }, // Germany
  "de-AT": { translation: de }, // Austria
  "de-CH": { translation: de }, // Switzerland
  "de-LI": { translation: de }, // Liechtenstein
  "de-LU": { translation: de }, // Luxembourg

  // --- French (Francophonie) ---
  fr: { translation: fr },
  "fr-FR": { translation: fr }, // France
  "fr-CA": { translation: fr }, // Canada
  "fr-BE": { translation: fr }, // Belgium
  "fr-CH": { translation: fr }, // Switzerland
  "fr-LU": { translation: fr }, // Luxembourg
  "fr-MC": { translation: fr }, // Monaco

  // --- Japanese ---
  ja: { translation: ja },
  "ja-JP": { translation: ja },

  // --- Chinese (Simplified) ---
  "zh-Hans": { translation: zhHans }, 
  "zh-CN": { translation: zhHans }, // Mainland
  "zh-SG": { translation: zhHans }, // Singapore

  // --- Chinese (Traditional) ---
  "zh-Hant": { translation: zhHans }, 
  "zh-TW": { translation: zhHans }, // Taiwan
  "zh-MO": { translation: zhHans }, // Macau

  // --- Chinese (Hong Kong) ---
  "zh-HK": { translation: zhHans },

  // --- Portuguese ---
  pt: { translation: ptBR },       
  "pt-BR": { translation: ptBR }, // Brazil
  "pt-PT": { translation: ptBR }, // Portugal (Fallback to BR)
  "pt-AO": { translation: ptBR }, // Angola (Fallback to BR)
  "pt-MZ": { translation: ptBR }, // Mozambique (Fallback to BR)

  // --- Italian ---
  it: { translation: it },
  "it-IT": { translation: it },
  "it-CH": { translation: it }, // Switzerland
  "it-SM": { translation: it }, // San Marino
  "it-VA": { translation: it }, // Vatican City

  // --- Dutch ---
  nl: { translation: nl },
  "nl-NL": { translation: nl }, // Netherlands
  "nl-BE": { translation: nl }, // Belgium (Flemish)
  "nl-SR": { translation: nl }, // Suriname
  "nl-AW": { translation: nl }, // Aruba
  "nl-SX": { translation: nl }, // Sint Maarten

  // --- Switzerland Special Case: Romansh ---
  "rm-CH": { translation: de }, 
};

const MODULE_TYPE = "languageDetector";

const languageDetector: LanguageDetectorAsyncModule = {
  type: MODULE_TYPE,
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    try {
      // 1. Check AsyncStorage for saved language
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        callback(savedLanguage);
        return savedLanguage; // FIX: Explicitly return the string
      }
    } catch (error) {
      console.log("Error reading language", error);
    }

    // 2. If no saved language, use device locale
    const supportedLanguages = Object.keys(resources);
    const bestMatch = RNLocalize.findBestLanguageTag(supportedLanguages);
    const detectedLng = bestMatch?.languageTag || "en";
    
    callback(detectedLng);
    return detectedLng; // FIX: Explicitly return the string
},
  cacheUserLanguage: (language: string) => {
    // 3. Save language whenever it changes
    AsyncStorage.setItem("user-language", language);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4", // Change "v3" to "v4"
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
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "intl-pluralrules";

import en from "../locales/en.json";
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import zhHans from '../locales/zh-Hans.json';
import ptBR from '../locales/pt-BR.json';
import it from '../locales/it.json';
import zhHant from '../locales/zh-Hans.json';
import zhHK from '../locales/zh-Hans.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  ja: { translation: ja },
  "zh-Hans": { translation: zhHans },
  "pt-BR": { translation: ptBR },
  pt: { translation: ptBR }, // Reuse the variable
  it: { translation: it },
  zh: { translation: zhHans },
  zh: { translation: zhHant },
  zh: { translation: zhHK },
};

const MODULE_TYPE = "languageDetector";

const languageDetector = {
  type: MODULE_TYPE,
  async: true,
  init: () => {},
  detect: async (callback) => {
    try {
      // 1. Check AsyncStorage for saved language
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.log("Error reading language", error);
    }

    // 2. If no saved language, use device locale
    const supportedLanguages = Object.keys(resources);
    const bestMatch = RNLocalize.findBestLanguageTag(supportedLanguages);
    callback(bestMatch?.languageTag || "en");
  },
  cacheUserLanguage: (language) => {
    // 3. Save language whenever it changes
    AsyncStorage.setItem("user-language", language);
  },
};

i18n
  .use(languageDetector) // Add the detector
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Prevents UI blocking while loading language
    }
  });

export default i18n;
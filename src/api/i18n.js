import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import "intl-pluralrules";

import en from "../locales/en.json";
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import zhHans from '../locales/zh-Hans.json';
import ptBR from '../locales/pt-BR.json';
import it from '../locales/it.json';
import pt from '../locales/pt-BR.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  ja: { translation: ja },
  pt: { translation: pt },
  "zh-Hans": { translation: zhHans },
  "pt-BR": { translation: ptBR },
  it: { translation: it },
  zh: { translation: zhHans },
};

// 2. Determine the best available language
// This creates an array ["en", "es"] to compare against device settings
const supportedLanguages = Object.keys(resources);

// RNLocalize checks the device's full list of preferences (e.g., ["es-MX", "fr-FR", "en-US"])
// and finds the first one that matches your supported list.
const bestMatch = RNLocalize.findBestLanguageTag(supportedLanguages);

// If a match is found, use it (e.g., "es"). If not, fallback to "en".
const translationToUse = bestMatch?.languageTag || "en";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources,
  lng: translationToUse, // Uses the detected language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import am from "./am.json";

const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: stored || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language;
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;

export const setLanguage = (lng: "en" | "am") => {
  i18n.changeLanguage(lng);
  localStorage.setItem("lang", lng);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
};
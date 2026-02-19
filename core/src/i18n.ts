import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

// createInstance() = completely private i18n. No other MFE can access or corrupt it.
const i18n = createInstance()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: document.documentElement.getAttribute('lang') ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false,
})

// Keep in sync when Core fires the language-change event
window.addEventListener('app:language-change', (e) => {
  i18n.changeLanguage((e as CustomEvent<{ language: string }>).detail.language)
})

export default i18n

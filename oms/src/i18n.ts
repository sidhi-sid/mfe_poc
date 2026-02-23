import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const initialLang = document.documentElement.getAttribute('lang') ?? 'en'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    initImmediate: false,
  })
} else {
  // Shared instance already initialized by Core — merge our translations in
  i18n.addResourceBundle('en', 'translation', en, true, true)
  i18n.addResourceBundle('ar', 'translation', ar, true, true)
}

// Listen to Core's language change event — zero dependency on Core code
window.addEventListener('app:language-change', (e) => {
  const { language } = (e as CustomEvent<{ language: string }>).detail
  i18n.changeLanguage(language)
})

export default i18n

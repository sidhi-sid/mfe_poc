export type Language = 'en' | 'ar'

const STORAGE_KEY = 'bm-language'

/** Apply language to <html> dir/lang, persist it, and notify all MFEs via window event. */
export function applyLanguage(lang: Language): void {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lang)
  try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('app:language-change', { detail: { language: lang, dir } }))
}

/** Read persisted language (falls back to 'en'). */
export function getStoredLanguage(): Language {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'ar' ? 'ar' : 'en'
  } catch { return 'en' }
}

/**
 * host-bootstrap.ts — MUST be imported FIRST in main.tsx
 *
 * Parses URL query params set by Core's FederationMFE component and applies
 * them to the DOM synchronously, BEFORE i18n / React / anything else runs.
 *
 * This guarantees the MFE renders with the correct theme and language on the
 * very first frame — no flash of wrong content, no timing races.
 *
 * Params set by Core:
 *   ?_theme=dark|light  — host's current theme
 *   ?_lang=en|ar         — host's current language
 *   ?_dir=ltr|rtl        — host's current text direction
 */

const params = new URLSearchParams(window.location.search)
const urlTheme = params.get('_theme')
const urlLang = params.get('_lang')
const urlDir = params.get('_dir')

// --- Theme: apply immediately so initTheme() reads the correct state -------
if (urlTheme === 'dark' || urlTheme === 'light') {
  const root = document.documentElement
  if (urlTheme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
  try { localStorage.setItem('bm-theme', urlTheme) } catch { /* ignore */ }
}

// --- Language: set <html lang="..." dir="..."> so i18n.ts picks up the
//     correct language when it reads document.documentElement.getAttribute('lang') -------
if (urlLang) {
  document.documentElement.setAttribute('lang', urlLang)
  document.documentElement.setAttribute(
    'dir',
    urlDir || (urlLang === 'ar' ? 'rtl' : 'ltr'),
  )
}

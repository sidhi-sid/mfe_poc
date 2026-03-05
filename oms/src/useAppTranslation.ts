/**
 * Tiny translation hook — no i18n library.
 * Language is driven by the 'app:language-change' event:
 *   • Standalone / Module Federation → CustomEvent fired by Core on same window
 *   • Iframe mode → re-dispatched by setupHostSync() from postMessage
 * RTL layout is handled by <html dir="rtl"> set in theme-sync.ts (host bridge).
 */
import { useState, useEffect } from 'react'
import en from './locales/en.json'
import ar from './locales/ar.json'

const dicts: Record<string, Record<string, unknown>> = { en, ar }

function lookup(dict: Record<string, unknown>, key: string): string | null {
  const parts = key.split('.')
  let val: unknown = dict
  for (const p of parts) val = (val as Record<string, unknown>)?.[p]
  return typeof val === 'string' ? val : null
}

export function useAppTranslation() {
  const [lang, setLang] = useState(
    () => document.documentElement.getAttribute('lang') ?? 'en'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ language: string; dir?: string }>).detail
      const language = detail.language
      const dir = detail.dir ?? (language === 'ar' ? 'rtl' : 'ltr')

      // Update <html> attributes so CSS dir-aware styles work inside the iframe
      document.documentElement.setAttribute('lang', language)
      document.documentElement.setAttribute('dir', dir)

      setLang(language)
    }
    window.addEventListener('app:language-change', handler)
    return () => window.removeEventListener('app:language-change', handler)
  }, [])

  const dict = dicts[lang] ?? dicts['en']

  const t = (key: string, vars?: Record<string, unknown>): string => {
    let result: string | null = null

    if (vars?.count !== undefined) {
      const count = Number(vars.count)
      result =
        lookup(dict, `${key}_${count === 1 ? 'one' : 'other'}`) ??
        lookup(dict, key)
    } else {
      result = lookup(dict, key)
    }

    result = result ?? key

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(`{{${k}}}`, String(v))
      }
    }

    return result
  }

  return { t }
}

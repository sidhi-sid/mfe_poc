/**
 * Tiny translation hook — no i18n library.
 * Language is driven by the 'app:language-change' window event fired by Core.
 * RTL layout is handled automatically by the <html dir="rtl"> CSS contract.
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
      setLang((e as CustomEvent<{ language: string }>).detail.language)
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

import type { ModuleWithAvailability } from '@/hooks/useModules'
import { useEffect, useMemo, useRef } from 'react'
import type { Theme } from '@/lib/theme'

interface FederationMFEProps {
  module: ModuleWithAvailability
}

export function FederationMFE({ module }: FederationMFEProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const src = useMemo(() => {
    const base = (module.baseUrl ?? '').toString().trim()
    const path = module.path || '/'

    if (!base) {
      // If no baseUrl, assume the module is served under the same origin.
      return path
    }

    const normalizedBase = base.replace(/\/$/, '')
    return `${normalizedBase}${path}`
  }, [module.baseUrl, module.path])

  if (!src) {
    return (
      <p className="text-muted-foreground">
        Unable to resolve URL for module: {module.id}. Check its configuration.
      </p>
    )
  }

  useEffect(() => {
    const postThemeToIframe = (theme: Theme) => {
      const win = iframeRef.current?.contentWindow
      if (!win) return
      if (theme !== 'light' && theme !== 'dark') return
      win.postMessage(
        {
          type: 'theme-change',
          theme,
        },
        '*',
      )
    }

    const initialTheme: Theme =
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    postThemeToIframe(initialTheme)

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ theme?: Theme }>
      const next = custom.detail?.theme
      if (next === 'light' || next === 'dark') {
        postThemeToIframe(next)
      }
    }

    window.addEventListener('theme-change', handler as EventListener)
    return () => {
      window.removeEventListener('theme-change', handler as EventListener)
    }
  }, [src])

  return (
    <div className="w-full h-full min-h-[200px]">
      <iframe
        ref={iframeRef}
        src={src}
        title={module.label ?? module.id}
        className="w-full h-full border-0"
      />
    </div>
  )
}

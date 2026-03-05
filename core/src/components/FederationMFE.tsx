import type { ModuleWithAvailability } from '@/hooks/useModules'
import { useCallback, useEffect, useMemo, useRef } from 'react'

// ---------------------------------------------------------------------------
// HOST_EVENTS — the single registry of events Core forwards to every MFE iframe.
//
// To broadcast a new event to all MFEs:
//   1. Fire a CustomEvent on `window` with any name (e.g. 'my-event').
//   2. Add an entry below.
//   That's it — the MFE-side bridge (`setupHostSync`) will re-dispatch it
//   as a local CustomEvent so existing listeners in each MFE keep working.
// ---------------------------------------------------------------------------
interface HostEvent {
  /** The CustomEvent name fired on the Core window (e.g. 'theme-change'). */
  eventName: string
  /** Extract the payload from the CustomEvent to send via postMessage. */
  getPayload: (e: CustomEvent) => unknown
  /** Return the current (initial) value so we can push it on iframe load. */
  getInitialPayload: () => unknown
}

const HOST_EVENTS: HostEvent[] = [
  {
    eventName: 'theme-change',
    getPayload: (e) => e.detail,
    getInitialPayload: () => ({
      theme: document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light',
    }),
  },
  {
    eventName: 'app:language-change',
    getPayload: (e) => e.detail,
    getInitialPayload: () => ({
      language: document.documentElement.getAttribute('lang') || 'en',
      dir: document.documentElement.getAttribute('dir') || 'ltr',
    }),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface FederationMFEProps {
  module: ModuleWithAvailability
}

export function FederationMFE({ module }: FederationMFEProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Build the iframe URL with current host state as query params.
  // We read theme/language directly from the DOM (NOT from a ref) because
  // React Router may reuse this component instance across navigations —
  // a ref would hold stale values from the first mount.
  //
  // The deps only include module props, so changing theme/language at runtime
  // does NOT cause a reload (postMessage handles runtime updates).
  // But when navigating to a different MFE (module.path changes), useMemo
  // recalculates and reads the CURRENT theme/language from the DOM.
  const src = useMemo(() => {
    const base = (module.baseUrl ?? '').toString().trim()
    const path = module.path || '/'

    if (!base) return path

    const normalizedBase = base.replace(/\/$/, '')
    const baseUrl = `${normalizedBase}${path}`

    // Read fresh from DOM — guaranteed current
    const currentTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
    const currentLang = document.documentElement.getAttribute('lang') || 'en'
    const currentDir = document.documentElement.getAttribute('dir') || 'ltr'

    const params = new URLSearchParams({
      _theme: currentTheme,
      _lang: currentLang,
      _dir: currentDir,
    })

    return `${baseUrl}?${params.toString()}`
  }, [module.baseUrl, module.path])

  // Helper: send a namespaced message to the iframe
  const postToIframe = useCallback(
    (eventName: string, payload: unknown) => {
      const win = iframeRef.current?.contentWindow
      if (!win) return
      win.postMessage({ type: `core:${eventName}`, payload }, '*')
    },
    [],
  )

  // Push current state for all HOST_EVENTS to the iframe
  const pushAllInitialState = useCallback(() => {
    for (const evt of HOST_EVENTS) {
      postToIframe(evt.eventName, evt.getInitialPayload())
    }
  }, [postToIframe])

  useEffect(() => {
    // Subscribe to all HOST_EVENTS on Core's window and forward to iframe
    const handlers: Array<{ name: string; handler: EventListener }> = []

    for (const evt of HOST_EVENTS) {
      const handler = ((e: CustomEvent) => {
        postToIframe(evt.eventName, evt.getPayload(e))
      }) as EventListener

      window.addEventListener(evt.eventName, handler)
      handlers.push({ name: evt.eventName, handler })
    }

    return () => {
      for (const { name, handler } of handlers) {
        window.removeEventListener(name, handler)
      }
    }
  }, [postToIframe])

  if (!src) {
    return (
      <p className="text-muted-foreground">
        Unable to resolve URL for module: {module.id}. Check its configuration.
      </p>
    )
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <iframe
        ref={iframeRef}
        src={src}
        title={module.label ?? module.id}
        className="w-full h-full border-0"
        onLoad={pushAllInitialState}
      />
    </div>
  )
}

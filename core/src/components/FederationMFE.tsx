import { type ComponentType, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ModuleWithAvailability } from '@/hooks/useModules'

interface RemoteModule {
  Component: ComponentType
  cssText: string
}

type RemoteLoader = () => Promise<RemoteModule>

const REMOTE_LOADERS: Record<string, RemoteLoader> = {
  oms: () => import('oms/App') as unknown as Promise<RemoteModule>,
  dashboard: () => import('dashboard/App') as unknown as Promise<RemoteModule>,
}

interface FederationMFEProps {
  module: ModuleWithAvailability
}

function FederatedFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
      Loading remote app…
    </div>
  )
}

function syncThemeState(el: HTMLElement) {
  el.classList.toggle('dark', document.documentElement.classList.contains('dark'))

  const computed = getComputedStyle(document.documentElement)
  for (let i = 0; i < computed.length; i += 1) {
    const key = computed.item(i)
    if (!key.startsWith('--')) continue
    const value = computed.getPropertyValue(key)
    if (value) el.style.setProperty(key, value)
  }
}

export function FederationMFE({ module }: FederationMFEProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [remote, setRemote] = useState<RemoteModule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const remoteLoader = REMOTE_LOADERS[module.id]

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (!remoteLoader) {
          throw new Error(`Unknown module: ${module.id}. Add it to REMOTE_LOADERS.`)
        }

        const raw = await remoteLoader() as unknown as Record<string, unknown>
        if (cancelled) return

        // Federation plugin wraps named exports inside a `default` namespace object
        const ns = (raw.default && typeof raw.default === 'object' ? raw.default : raw) as Record<string, unknown>

        const Component = (
          typeof ns.Component === 'function' ? ns.Component
          : typeof ns.default === 'function' ? ns.default
          : null
        ) as ComponentType | null

        if (!Component) {
          throw new Error(`Remote "${module.id}" has no Component export. Keys: ${Object.keys(ns).join(', ')}`)
        }

        const mod: RemoteModule = {
          Component,
          cssText: typeof ns.cssText === 'string' ? ns.cssText : '',
        }

        setRemote(mod)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    void load()
    return () => { cancelled = true }
  }, [module.id, remoteLoader])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !remote) return

    let shadowRoot = container.shadowRoot
    if (!shadowRoot) {
      shadowRoot = container.attachShadow({ mode: 'open' })
    } else {
      shadowRoot.innerHTML = ''
    }

    if (remote.cssText) {
      const style = document.createElement('style')
      style.textContent = remote.cssText
      shadowRoot.appendChild(style)
    }

    const appRoot = document.createElement('div')
    appRoot.setAttribute('data-mfe', module.id)
    shadowRoot.appendChild(appRoot)

    syncThemeState(appRoot)
    const observer = new MutationObserver(() => syncThemeState(appRoot))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    setPortalTarget(appRoot)

    return () => {
      observer.disconnect()
      setPortalTarget(null)
      shadowRoot!.innerHTML = ''
    }
  }, [remote, module.id])

  if (!remoteLoader) {
    return <p className="text-muted-foreground">Unknown module: {module.id}</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  const RemoteComponent = remote?.Component

  return (
    <div ref={containerRef}>
      {!remote && <FederatedFallback />}
      {portalTarget && RemoteComponent && createPortal(<RemoteComponent />, portalTarget)}
    </div>
  )
}

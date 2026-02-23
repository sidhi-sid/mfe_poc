/// <reference types="vite/client" />
import { useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import mfeCss from './mfe-federation.css?inline'

/**
 * Renders children inside an isolated Shadow DOM root.
 *
 * CSS strategy:
 *   - mfe-federation.css is injected into the shadow root via adoptedStyleSheets
 *   - Tailwind preflight + utilities are scoped to the shadow root only
 *   - CSS custom properties (--background, --foreground, etc.) inherit from
 *     Core's :root through the shadow boundary automatically
 *
 * React context (Router, etc.) flows through createPortal unchanged —
 * the portal changes where children render in the DOM, not in the React tree.
 *
 * Known limitation: components using document.body portals (shadcn Dialog,
 * Tooltip, Popover) will render outside the shadow root and may lose
 * shadow-scoped styles. Core's stylesheet covers these cases since it shares
 * the same Tailwind theme.
 */
export function ShadowWrapper({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Reuse existing shadow root (React Strict Mode runs effects twice on same node)
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })

    // Inject MFE's Tailwind CSS into the shadow root
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(mfeCss)
    shadow.adoptedStyleSheets = [sheet]

    // Reuse or create the React portal target inside the shadow root
    let div = shadow.querySelector<HTMLDivElement>(':scope > div')
    if (!div) {
      div = document.createElement('div')
      shadow.appendChild(div)
    }
    setContainer(div)
  }, [])

  return (
    <div ref={hostRef}>
      {container && createPortal(children, container)}
    </div>
  )
}

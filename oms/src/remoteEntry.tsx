/**
 * Module Federation remote entry for OMS.
 * Wraps OmsRoutes (without BrowserRouter) in a Shadow DOM root for complete
 * CSS isolation. React Router context from Core flows through the portal
 * unchanged, so nested routing works correctly.
 * Core's CSS custom properties (--background, --foreground, etc.) are still
 * accessible inside the shadow root via CSS variable inheritance.
 */
import { ShadowWrapper } from './ShadowWrapper'
import { OmsRoutes } from './App'

export default function OmsRemote() {
  return (
    <ShadowWrapper>
      <OmsRoutes />
    </ShadowWrapper>
  )
}

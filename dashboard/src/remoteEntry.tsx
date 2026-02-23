/**
 * Module Federation remote entry for Dashboard.
 * Wraps the Dashboard app in a Shadow DOM root for complete CSS isolation.
 * Core's CSS custom properties (--background, --foreground, etc.) are still
 * accessible inside the shadow root via CSS variable inheritance.
 */
import { ShadowWrapper } from './ShadowWrapper'
import App from './App'

export default function DashboardRemote() {
  return (
    <ShadowWrapper>
      <App />
    </ShadowWrapper>
  )
}

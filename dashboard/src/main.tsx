import './host-bootstrap' // MUST be first — sets theme/lang from URL params before i18n/React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './i18n'
import { initTheme } from './lib/theme'
import { setupHostSync } from './theme-sync'
import App from './App.tsx'

initTheme()
setupHostSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

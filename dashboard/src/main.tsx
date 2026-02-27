import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './i18n'
import { initTheme } from './lib/theme'
import { setupThemeSync } from './theme-sync'
import App from './App.tsx'

initTheme()
setupThemeSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

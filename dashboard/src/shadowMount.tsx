import { createRoot, type Root } from "react-dom/client"
import App from "./App"
import cssText from "./index.css?inline"

type MountOptions = {
  moduleId?: string
}

type ShadowAppInstance = {
  root: Root
  shadowRoot: ShadowRoot
  appRoot: HTMLDivElement
  themeObserver: MutationObserver
}

const INSTANCES = new WeakMap<HTMLElement, ShadowAppInstance>()

function syncThemeState(appRoot: HTMLElement) {
  appRoot.classList.toggle("dark", document.documentElement.classList.contains("dark"))

  const computed = getComputedStyle(document.documentElement)
  for (let idx = 0; idx < computed.length; idx += 1) {
    const key = computed.item(idx)
    if (!key.startsWith("--")) continue
    const value = computed.getPropertyValue(key)
    if (value) {
      appRoot.style.setProperty(key, value)
    }
  }
}

export function mount(container: HTMLElement, _options?: MountOptions) {
  let shadowRoot = container.shadowRoot
  if (!shadowRoot) {
    shadowRoot = container.attachShadow({ mode: "open" })
  }

  const styleEl = document.createElement("style")
  styleEl.textContent = cssText
  shadowRoot.appendChild(styleEl)

  const appRoot = document.createElement("div")
  appRoot.className = "dashboard-shadow-root"
  shadowRoot.appendChild(appRoot)

  syncThemeState(appRoot)
  const themeObserver = new MutationObserver(() => syncThemeState(appRoot))
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  })

  const root = createRoot(appRoot)
  root.render(<App />)

  INSTANCES.set(container, {
    root,
    shadowRoot,
    appRoot,
    themeObserver,
  })
}

export function unmount(container: HTMLElement) {
  const instance = INSTANCES.get(container)
  if (!instance) return

  instance.themeObserver.disconnect()
  instance.root.unmount()
  instance.shadowRoot.innerHTML = ""
  INSTANCES.delete(container)
}

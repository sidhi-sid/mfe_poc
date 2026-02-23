import { createContext, useContext, type ReactNode } from "react"

type PortalContainer = HTMLElement | ShadowRoot | null

const ShadowPortalContainerContext = createContext<PortalContainer>(null)

export function ShadowPortalProvider({
  container,
  children,
}: {
  container: PortalContainer
  children: ReactNode
}) {
  return (
    <ShadowPortalContainerContext.Provider value={container}>
      {children}
    </ShadowPortalContainerContext.Provider>
  )
}

export function useShadowPortalContainer() {
  return useContext(ShadowPortalContainerContext)
}

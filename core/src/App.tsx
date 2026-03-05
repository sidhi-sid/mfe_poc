import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { I18nextProvider } from "react-i18next"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import coreI18n from "./i18n"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { useModules } from "@/hooks/useModules"
import { FederationMFE } from "@/components/FederationMFE"
import { useMfeNotifications } from "@/hooks/useMfeNotifications"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})

// Wrapper to handle sidebar toggle from Header
const AppLayout = () => {
  const { toggleSidebar } = useSidebar();
  const { availableModules, loading } = useModules();
  useMfeNotifications();

  return (
    <SidebarInset>
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 flex-col pt-14 overflow-auto">
        {/* MFE slot: remote apps render inside <main> via Routes / Module Federation.
            Shell keeps: SidebarProvider + AppSidebar (left) + this SidebarInset (header + main).
            Each route can lazy-load a remote MFE component as the element. */}
        <main className="flex-1 p-6">
          {loading ? (
            <p className="text-muted-foreground">Loading modules...</p>
          ) : (
            <Routes>
              {availableModules.map((m) => (
                <Route
                  key={m.id}
                  path={`${m.path}/*`}
                  element={<FederationMFE key={m.id} module={m} />}
                />
              ))}
              <Route
                path="*"
                element={
                  availableModules.length > 0 ? (
                    <Navigate to={availableModules[0].path} replace />
                  ) : (
                    <p className="text-muted-foreground">No modules available. Check that at least one MFE is running.</p>
                  )
                }
              />
            </Routes>
          )}
        </main>
      </div>
    </SidebarInset>
  )
}

function CoreContent() {
  return (
    <I18nextProvider i18n={coreI18n}>
      <BrowserRouter>
        <SidebarProvider>
          <AppSidebar />
          <AppLayout />
        </SidebarProvider>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </I18nextProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CoreContent />
    </QueryClientProvider>
  )
}

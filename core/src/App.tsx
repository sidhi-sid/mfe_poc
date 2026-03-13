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
import { IframeMFE } from "@/components/IframeMFE"
import { useMfeNotifications } from "@/hooks/useMfeNotifications"
import { useOnboardingAuth, useAccountData } from "./hooks/useOnboardingBootstrap"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})

// Flow: getWMURL → authSelfOnboarding → modules (authenticated) → fetchAccountByCifNumber → portfolio/bank
const AppLayout = () => {
  const { toggleSidebar } = useSidebar();
  const { loading: authLoading, error: authError, auth } = useOnboardingAuth();
  const { availableModules, loading: modulesLoading, error: modulesError } = useModules(auth?.token ?? null);
  const modulesLoaded = !modulesLoading && (auth?.token ? true : false);
  const { account, loading: accountLoading, error: accountError } = useAccountData(auth, modulesLoaded);
  useMfeNotifications();

  const onboardingData = auth && account ? { auth, account } : null;
  const loading = authLoading || modulesLoading || accountLoading;
  const error = authError ?? modulesError ?? accountError;

  return (
    <SidebarInset>
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 flex-col pt-14 overflow-auto">
        {/* MFE slot: remote apps render inside <main> via iframes.
            Shell keeps: SidebarProvider + AppSidebar (left) + this SidebarInset (header + main).
            Each route renders the MFE in an iframe via IframeMFE component. */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
              <p className="text-center text-[15px] font-medium text-foreground">Loading Wealth App…</p>
              <p className="text-center text-xs text-muted-foreground">Connecting to wealth management platform</p>
            </div>
          ) : error ? (
            <p className="text-destructive">
              Failed to bootstrap: {error.message}
            </p>
          ) : (
            <Routes>
              {availableModules.map((m) => (
                <Route
                  key={m.id}
                  path={`${m.path}/*`}
                  element={<IframeMFE key={m.id} module={m} onboardingData={onboardingData} />}
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

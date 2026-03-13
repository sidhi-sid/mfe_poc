import { useAppTranslation } from './useAppTranslation'
import { PortfolioCard } from '@/components/PortfolioCard'
import { BankOverviewCards } from '@/components/BankOverviewCards'
import { useDashboardData } from '@/hooks/useDashboardData'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})

function useHostParams() {
  const params = new URLSearchParams(window.location.search)
  const clientId = Number(params.get('_clientId')) || null
  const accessToken = params.get('_accessToken') || null
  return { clientId, accessToken }
}

function DashboardContent() {
  const { t } = useAppTranslation()
  const { clientId, accessToken } = useHostParams()
  const { data: portfolio, bankSections, loading, error, usingMock } = useDashboardData(clientId, accessToken)

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div
          className="mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-t-primary"
          aria-hidden
        />
        <p className="text-center text-[15px] font-medium text-foreground">Loading Wealth App…</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Connecting to wealth management platform
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>
      <BankOverviewCards bankSections={bankSections} />
      <PortfolioCard portfolio={portfolio} error={error} usingMock={usingMock} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  )
}

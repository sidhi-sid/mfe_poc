import { useAppTranslation } from './useAppTranslation'
import { useWMURL } from './hooks/useWMURL'
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

/** Inner app that uses TanStack Query hooks; must be rendered inside QueryClientProvider. */
function DashboardContent() {
  const { t } = useAppTranslation()
  const { authResponse } = useWMURL({ cifNumber: '123456', accountType: 'Individual' })
  const accessToken = authResponse?.token ?? null
  const { bankSections } = useDashboardData(201, accessToken)

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
      <PortfolioCard accessToken={accessToken} />
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

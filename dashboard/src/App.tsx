import { useAppTranslation } from './useAppTranslation'
import { useWMURL } from './hooks/useWMURL'
import { PortfolioCard } from "@/components/PortfolioCard"

export default function App() {
  const { t } = useAppTranslation()
  const { authResponse } = useWMURL({ cifNumber: '123456', accountType: 'Individual' })
  const accessToken = authResponse?.token ?? null

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>
      <PortfolioCard accessToken={accessToken} />
    </div>
  )
}

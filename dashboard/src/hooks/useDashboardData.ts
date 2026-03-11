import { useQueries } from '@tanstack/react-query'
import type { CustomerPortfolio, BankSections } from '@/data/portfolio-mock'
import { mockPortfolio } from '@/data/portfolio-mock'
import { fetchPortfolio, fetchBank } from '@/api/client'

/**
 * Hook to fetch portfolio overview data from the Fastify API via TanStack Query.
 * Uses query keys ['portfolio', clientId] and ['bank', clientId] for caching.
 * Queries run only when accessToken is present (enabled). Falls back to mock data on API error.
 */
export function useDashboardData(clientId: number = 201, accessToken?: string | null) {
  const enabled = !!accessToken

  const results = useQueries({
    queries: [
      {
        queryKey: ['portfolio', clientId],
        queryFn: () => fetchPortfolio(clientId, accessToken!),
        enabled,
      },
      {
        queryKey: ['bank', clientId],
        queryFn: () => fetchBank(clientId, accessToken!),
        enabled,
      },
    ],
  })

  const [portfolioQuery, bankQuery] = results
  const portfolioData = portfolioQuery.data
  const bankData = bankQuery.data
  const portfolioError = portfolioQuery.error
  const bankError = bankQuery.error
  const isPending = portfolioQuery.isPending || bankQuery.isPending
  const isError = portfolioQuery.isError || bankQuery.isError

  let data: CustomerPortfolio | null = null
  let error: string | null = null
  let usingMock = false
  let bankSections: BankSections | null = null

  if (isError) {
    data = mockPortfolio
    usingMock = true
    error = (portfolioError ?? bankError) instanceof Error
      ? (portfolioError ?? bankError)!.message
      : 'Unknown error'
  } else if (portfolioData != null && bankData != null) {
    data = transformDashboardData(portfolioData, bankData, clientId)
    usingMock = false
    const bankDetails = (bankData as any)?.bankDetails?.data
    if (bankDetails) {
      // totalBalancePosition values are in AED (reference currency = currencyId 247).
      // The API response has no top-level currency field on each section, so we inject it here.
      const withCurrency = (section: any) =>
        section ? { ...section, currency: 'AED' } : null
      bankSections = {
        savings: withCurrency(bankDetails.savingsDetails),
        loans: withCurrency(bankDetails.loanDetails),
        deposits: withCurrency(bankDetails.depositDetails),
        cards: bankDetails.cardDetails ?? null,
      }
    }
  }

  return {
    data,
    rawPortfolio: portfolioData ?? null,
    rawBank: bankData ?? null,
    bankSections,
    loading: enabled ? isPending : true,
    error,
    usingMock,
  }
}

/**
 * Transform API responses into our CustomerPortfolio shape.
 * portfolioJson: portfolioSeries, portfolioSummary, timedTransactions, portfolioNetValue
 * bankJson: bankDetails (savings, loans)
 */
function transformDashboardData(portfolioJson: any, bankJson: any, clientId: number): CustomerPortfolio {
  const summary = portfolioJson?.portfolioSummary?.data
  const netValue = portfolioJson?.portfolioNetValue?.data

  const totalValue = netValue?.netValue ?? summary?.totalMarketValue ?? 0
  const investedValue = summary?.totalCostValue ?? summary?.totalInvestedValue ?? 0
  const dayChangePercent = summary?.dayChangePercent ?? 0

  const bankDetails = bankJson?.bankDetails?.data
  const savings = bankDetails?.savingsDetails
  const cashBalance = savings?.totalBalancePosition ?? 0

  const seriesData = portfolioJson?.portfolioSeries?.data
  let holdings: any[] = []

  if (Array.isArray(seriesData) && seriesData.length > 0) {
    holdings = seriesData.map((item: any, idx: number) => ({
      symbol: item.ticker || item.assetClass || item.name || `ITEM-${idx}`,
      name: item.name || item.assetClass || `Holding ${idx + 1}`,
      quantity: item.quantity ?? item.units ?? 1,
      price: item.currentPrice ?? item.marketValue ?? 0,
      value: item.marketValue ?? item.currentValue ?? 0,
      changePercent: item.changePercent ?? item.returnPercent ?? 0,
    }))
  } else if (savings?.breakdown) {
    holdings = savings.breakdown.map((account: any, idx: number) => ({
      symbol: account.accountType ?? `ACCT-${idx}`,
      name: `${account.accountType} (${account.currency})`,
      quantity: 1,
      price: account.availableBalPos ?? 0,
      value: account.availableBalPos ?? 0,
      changePercent: 0,
    }))
  }

  return {
    customerId: `CLIENT-${clientId}`,
    customerName: `Client ${clientId}`,
    totalValue: totalValue || cashBalance,
    cashBalance,
    investedValue,
    dayChangePercent,
    holdings,
    lastUpdated: new Date().toISOString(),
  }
}

import { useState, useEffect } from 'react'
import type { CustomerPortfolio } from '@/data/portfolio-mock'
import { mockPortfolio } from '@/data/portfolio-mock'

const DASHBOARD_API_BASE = 'http://localhost:4001'

/**
 * Hook to fetch portfolio overview data from the Fastify API.
 * Called on dashboard page load and when navigating back from OMS.
 * Falls back to mock data if the API is unreachable.
 */
export function useDashboardData(clientId: number = 201) {
  const [data, setData] = useState<CustomerPortfolio | null>(null)
  const [rawPortfolio, setRawPortfolio] = useState<any>(null)
  const [rawBank, setRawBank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        // Fetch both portfolio overview and bank details in parallel
        const [portfolioRes, bankRes] = await Promise.all([
          fetch(`${DASHBOARD_API_BASE}/api/dashboard/${clientId}/portfolio?fromDate=2025-01-01&currencyId=247`),
          fetch(`${DASHBOARD_API_BASE}/api/dashboard/${clientId}/bank?fromDate=2025-01-01&currencyId=247`),
        ])

        if (!portfolioRes.ok) throw new Error(`Portfolio API returned ${portfolioRes.status}`)
        if (!bankRes.ok) throw new Error(`Bank API returned ${bankRes.status}`)

        const portfolioJson = await portfolioRes.json()
        const bankJson = await bankRes.json()

        if (!cancelled) {
          setRawPortfolio(portfolioJson)
          setRawBank(bankJson)

          const portfolio = transformDashboardData(portfolioJson, bankJson, clientId)
          setData(portfolio)
          setUsingMock(false)
        }
      } catch (err) {
        console.warn('Dashboard API unavailable, using mock data:', err)
        if (!cancelled) {
          setData(mockPortfolio)
          setUsingMock(true)
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [clientId])

  return { data, rawPortfolio, rawBank, loading, error, usingMock }
}

/**
 * Transform LoopBack's response into our CustomerPortfolio shape.
 *
 * portfolioJson contains: portfolioSeries, portfolioSummary, timedTransactions, portfolioNetValue
 * bankJson contains: bankDetails (savings, loans)
 */
function transformDashboardData(portfolioJson: any, bankJson: any, clientId: number): CustomerPortfolio {
  // --- Portfolio overview data ---
  const summary = portfolioJson?.portfolioSummary?.data
  const netValue = portfolioJson?.portfolioNetValue?.data

  // Try to extract totals from portfolio summary/net value
  const totalValue = netValue?.netValue ?? summary?.totalMarketValue ?? 0
  const investedValue = summary?.totalCostValue ?? summary?.totalInvestedValue ?? 0
  const dayChangePercent = summary?.dayChangePercent ?? 0

  // --- Bank data ---
  const bankDetails = bankJson?.bankDetails?.data
  const savings = bankDetails?.savingsDetails
  const cashBalance = savings?.totalBalancePosition ?? 0

  // --- Build holdings from portfolio series or summary ---
  const seriesData = portfolioJson?.portfolioSeries?.data
  let holdings: any[] = []

  if (Array.isArray(seriesData) && seriesData.length > 0) {
    // Use portfolio series data as holdings
    holdings = seriesData.map((item: any, idx: number) => ({
      symbol: item.ticker || item.assetClass || item.name || `ITEM-${idx}`,
      name: item.name || item.assetClass || `Holding ${idx + 1}`,
      quantity: item.quantity ?? item.units ?? 1,
      price: item.currentPrice ?? item.marketValue ?? 0,
      value: item.marketValue ?? item.currentValue ?? 0,
      changePercent: item.changePercent ?? item.returnPercent ?? 0,
    }))
  } else if (savings?.breakdown) {
    // Fallback: use bank account breakdown
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

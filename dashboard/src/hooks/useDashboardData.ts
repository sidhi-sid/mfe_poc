import { useState, useEffect } from 'react'
import type { CustomerPortfolio } from '@/data/portfolio-mock'
import { mockPortfolio } from '@/data/portfolio-mock'

const DASHBOARD_API_BASE = 'http://localhost:4001'

/**
 * Hook to fetch dashboard data from the Fastify API.
 * Falls back to mock data if the API is unreachable.
 */
export function useDashboardData(clientId: number = 201) {
  const [data, setData] = useState<CustomerPortfolio | null>(null)
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const params = new URLSearchParams({
          fromDate: '2025-01-01',
          currencyId: '247',
          contextFilter: JSON.stringify({ custodialAccountId: [1] }),
          widgetsToInclude: JSON.stringify({
            bankDetails: {
              filters: { accountId: [clientId], currencyId: 247, offset: 0, limit: 5 },
            },
          }),
        })

        const res = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${clientId}?${params}`)

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }

        const json = await res.json()

        if (!cancelled) {
          setRawData(json)

          // Transform LoopBack response into our portfolio shape
          const portfolio = transformDashboardData(json, clientId)
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

  return { data, rawData, loading, error, usingMock }
}

/**
 * Transform LoopBack's ClientDashboard response into our CustomerPortfolio shape.
 * Adjust this mapping as you explore the real API response structure.
 */
function transformDashboardData(json: any, clientId: number): CustomerPortfolio {
  const bankDetails = json?.bankDetails?.data
  const savings = bankDetails?.savingsDetails
  const loans = bankDetails?.loanDetails

  // Calculate totals from bank data
  const totalSavings = savings?.totalBalancePosition ?? 0
  const totalLoans = loans?.totalBalancePosition ?? 0
  const totalValue = totalSavings
  const cashBalance = totalSavings - totalLoans

  // Build holdings from savings breakdown
  const holdings = (savings?.breakdown ?? []).map((account: any, idx: number) => ({
    symbol: account.accountType ?? `ACCT-${idx}`,
    name: `${account.accountType} (${account.currency})`,
    quantity: 1,
    price: account.availableBalPos ?? 0,
    value: account.availableBalPos ?? 0,
    changePercent: 0,
  }))

  return {
    customerId: `CLIENT-${clientId}`,
    customerName: `Client ${clientId}`,
    totalValue,
    cashBalance,
    investedValue: totalLoans,
    dayChangePercent: 0,
    holdings,
    lastUpdated: new Date().toISOString(),
  }
}

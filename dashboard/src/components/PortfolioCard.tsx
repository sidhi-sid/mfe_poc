import { useState } from "react"
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useAppTranslation } from '../useAppTranslation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CustomerPortfolio } from "@/data/portfolio-mock"

const SYMBOL_TO_INSTRUMENT_ID: Record<string, string> = {
  AAPL: "INS001",
  MSFT: "INS002",
  GOOGL: "INS011",
  AMZN: "INS012",
  VOO: "INS013",
  NVDA: "INS014",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

interface PortfolioCardProps {
  portfolio?: CustomerPortfolio | null
  error?: string | null
  usingMock?: boolean
}

export function PortfolioCard({ portfolio, error, usingMock }: PortfolioCardProps = {}) {
  const { t } = useAppTranslation()
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  if (!portfolio) {
    return (
      <Card className="w-full overflow-hidden shadow-sm">
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Failed to load data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const isPositive = portfolio.dayChangePercent >= 0

  const totalPages = Math.ceil((portfolio.holdings?.length || 0) / pageSize)
  const paginatedHoldings = portfolio.holdings?.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  ) || []

  return (
    <Card className="w-full overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-card pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{t('portfolio.title')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {portfolio.customerName} · {portfolio.customerId}
            </CardDescription>
          </div>
          {usingMock && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Mock Data
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex min-h-[88px] flex-col justify-between rounded-lg border border-border/80 bg-muted/40 p-4 transition-colors hover:bg-muted/60">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('portfolio.totalValue')}
            </span>
            <div>
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {formatCurrency(portfolio.totalValue)}
              </p>
              <p className={`mt-0.5 text-xs font-medium tabular-nums ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}>
                {formatPercent(portfolio.dayChangePercent)} {t('portfolio.today')}
              </p>
            </div>
          </div>
          <div className="flex min-h-[88px] flex-col justify-between rounded-lg border border-border/80 bg-muted/40 p-4 transition-colors hover:bg-muted/60">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('portfolio.invested')}
            </span>
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              {formatCurrency(portfolio.investedValue)}
            </p>
          </div>
          <div className="flex min-h-[88px] flex-col justify-between rounded-lg border border-border/80 bg-muted/40 p-4 transition-colors hover:bg-muted/60">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('portfolio.cashBalance')}
            </span>
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              {formatCurrency(portfolio.cashBalance)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">{t('portfolio.holdings')}</h3>
          <div className="rounded-lg border border-border/80 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border/80 hover:bg-transparent">
                  <TableHead className="h-11 bg-muted/50 font-medium text-muted-foreground">
                    {t('portfolio.symbol')}
                  </TableHead>
                  <TableHead className="h-11 bg-muted/50 font-medium text-muted-foreground">
                    {t('portfolio.name')}
                  </TableHead>
                  {/* text-end = logical right-align: right in LTR, left in RTL */}
                  <TableHead className="h-11 bg-muted/50 text-end font-medium text-muted-foreground">
                    {t('portfolio.qty')}
                  </TableHead>
                  <TableHead className="h-11 bg-muted/50 text-end font-medium text-muted-foreground">
                    {t('portfolio.value')}
                  </TableHead>
                  <TableHead className="h-11 bg-muted/50 text-end font-medium text-muted-foreground">
                    {t('portfolio.change')}
                  </TableHead>
                  <TableHead className="h-11 bg-muted/50 text-center font-medium text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHoldings.map((holding) => (
                  <TableRow key={holding.symbol} className="border-border/80">
                    <TableCell className="py-3 font-medium">{holding.symbol}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">{holding.name}</TableCell>
                    <TableCell className="py-3 text-end tabular-nums">{holding.quantity}</TableCell>
                    <TableCell className="py-3 text-end tabular-nums">
                      {formatCurrency(holding.value)}
                    </TableCell>
                    <TableCell className={`py-3 text-end font-medium tabular-nums ${holding.changePercent >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(holding.changePercent)}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {SYMBOL_TO_INSTRUMENT_ID[holding.symbol] ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            window.location.href = `/oms/order/${SYMBOL_TO_INSTRUMENT_ID[holding.symbol]}`
                          }}
                        >
                          Trade
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, portfolio.holdings.length)} of {portfolio.holdings.length} entries
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <div className="text-sm font-medium">
                  {currentPage + 1} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-muted-foreground border-t border-border/80 pt-4 text-xs">
          {t('portfolio.lastUpdated')}: {new Date(portfolio.lastUpdated).toLocaleString()}
          {usingMock && ' (mock)'}
        </p>
      </CardContent>
    </Card>
  )
}

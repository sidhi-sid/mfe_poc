import { useState } from "react"
import { Building2, TrendingUp, Coins, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppTranslation } from '../useAppTranslation'
import type { BankSections, CardDetail } from '@/data/portfolio-mock'

const CURRENCY_AR: Record<string, string> = {
  OMR: 'ر.ع.',
  AED: 'د.إ',
  KWD: 'د.ك',
  BHD: 'د.ب',
  SAR: 'ر.س',
  QAR: 'ر.ق',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

function formatBankAmount(value: number, currency?: string): string {
  const abs = Math.abs(value)
  const curr = currency ? (CURRENCY_AR[currency] ?? currency) : ''
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(3)} ${curr}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(3)} ${curr}K`
  return curr ? `${value.toFixed(3)} ${curr}` : value.toFixed(3)
}

function CreditCardWidget({
  card,
  currency,
  animKey,
  direction,
}: {
  card: CardDetail
  currency?: string
  animKey: number
  direction: 'left' | 'right'
}) {
  const { t } = useAppTranslation()
  const consumed = Math.abs(card.consumedAmountPosition)
  const limit = card.creditLimitPosition
  const progressPct = limit > 0 ? Math.min((consumed / limit) * 100, 100) : 0

  return (
    <div className="w-full shrink-0 rounded-xl bg-[#e07070] p-4 text-white overflow-hidden">
      <div
        key={animKey}
        className={direction === 'right' ? 'slide-from-right' : 'slide-from-left'}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium opacity-80">{t('bank.consumed')}</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">
              {formatBankAmount(consumed, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium opacity-80">{t('bank.creditLimit')}</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">
              {formatBankAmount(limit, currency)}
            </p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-medium tracking-widest opacity-90">{card.cardNumber}</p>
        <div className="mt-1">
          <p className="text-xs opacity-70">{t('bank.expire')}</p>
          <p className="text-sm font-medium">
            {`${card.cardExpDate.slice(5, 7)}/${card.cardExpDate.slice(2, 4)}`}
          </p>
        </div>
      </div>
    </div>
  )
}

function CardCarousel({ cards, currency }: { cards: CardDetail[]; currency?: string }) {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [animKey, setAnimKey] = useState(0)

  function goTo(index: number, dir: 'left' | 'right') {
    setDirection(dir)
    setAnimKey(k => k + 1)
    setActive((index + cards.length) % cards.length)
  }

  return (
    <div>
      <style>{`
        @keyframes slideFromRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .slide-from-right { animation: slideFromRight 0.45s ease-out; }
        .slide-from-left  { animation: slideFromLeft  0.45s ease-out; }
      `}</style>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => goTo(active - 1, 'left')}
          className="shrink-0 text-gray-500 transition hover:text-gray-800 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={4} />
        </button>

        <div className="flex-1">
          <CreditCardWidget
            card={cards[active]}
            currency={currency}
            animKey={animKey}
            direction={direction}
          />
        </div>

        <button
          onClick={() => goTo(active + 1, 'right')}
          className="shrink-0 text-gray-500 transition hover:text-gray-800 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={4} />
        </button>
      </div>

      {cards.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > active ? 'right' : 'left')}
              className={`h-2 rounded-full transition-all ${i === active ? 'w-4 bg-gray-500' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface BankOverviewCardsProps {
  bankSections: BankSections | null
}

export function BankOverviewCards({ bankSections }: BankOverviewCardsProps) {
  const { t } = useAppTranslation()

  if (!bankSections) return null

  const { savings, loans, deposits, cards } = bankSections

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Col 1: Savings */}
      {savings && (
        <Card className="shadow-sm py-0">
          <CardContent className="flex h-full items-center gap-4" style={{ padding: '16px 20px' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Building2 className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('bank.savingBalance')}</p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight">
                {formatBankAmount(savings.totalBalancePosition, savings.currency ?? savings.breakdown[0]?.currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Col 2: Deposits + Loan stacked — fills grid row height */}
      <div className="flex h-full flex-col gap-2">
        {deposits && (
          <Card className="shadow-sm flex-1 py-0">
            <CardContent className="flex h-full items-center gap-3" style={{ padding: '12px 16px' }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('bank.depositsInvestment')}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatBankAmount(deposits.totalBalancePosition, deposits.currency ?? deposits.breakdown[0]?.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loans && (
          <Card className="shadow-sm flex-1 py-0">
            <CardContent className="flex h-full items-center gap-3" style={{ padding: '12px 16px' }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Coins className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('bank.loan')}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatBankAmount(loans.totalBalancePosition, loans.currency ?? loans.breakdown[0]?.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Col 3: Cards carousel — sets grid row height */}
      {cards && cards.length > 0 && (
        <CardCarousel cards={cards} currency={savings?.currency ?? savings?.breakdown[0]?.currency} />
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '../useAppTranslation';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import useOmsStore from '@/store/useOmsStore';

const ASSET_VARIANT_MAP = {
  Equity: 'bg-blue-500/10 text-blue-700 border-blue-200',
  ETF: 'bg-violet-500/10 text-violet-700 border-violet-200',
  'Fixed Income': 'bg-amber-500/10 text-amber-700 border-amber-200',
  'Mutual Fund': 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  Commodity: 'bg-red-500/10 text-red-700 border-red-200',
};

export default function InstrumentList() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const searchQuery = useOmsStore((s) => s.searchQuery);
  const setSearchQuery = useOmsStore((s) => s.setSearchQuery);
  const filteredInstruments = useOmsStore((s) => s.filteredInstruments);
  const selectInstrument = useOmsStore((s) => s.selectInstrument);

  const instruments = filteredInstruments();

  const handleSelect = (instrument) => {
    selectInstrument(instrument);
    navigate(`order/${instrument.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('search.subtitle')}</p>
      </div>

      <div className="relative mb-4">
        {/* start-3 / end-2 = logical left/right — flip automatically in RTL */}
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9 pe-9"
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute end-2 top-1/2 -translate-y-1/2"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {t('search.found', { count: instruments.length })}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {instruments.map((ins) => (
          <Card
            key={ins.id}
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md py-0"
            onClick={() => handleSelect(ins)}
          >
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={ASSET_VARIANT_MAP[ins.assetType] || 'bg-muted text-muted-foreground'}
                >
                  {ins.assetType}
                </Badge>
                <span className="text-xs text-muted-foreground">{ins.exchange}</span>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-2">
              <CardTitle className="text-lg">{ins.ticker}</CardTitle>
              <CardDescription className="mt-0.5 truncate">{ins.name}</CardDescription>
              <p className="mt-0.5 text-xs text-muted-foreground">{ins.subAssetType}</p>
            </CardContent>

            <Separator />

            <CardFooter className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold">
                {ins.currency}{' '}
                {ins.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {/* rtl:rotate-180 flips the arrow direction in RTL */}
              <ArrowRight className="h-4 w-4 text-primary rtl:rotate-180 transition-transform" />
            </CardFooter>
          </Card>
        ))}

        {instruments.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            {t('search.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}

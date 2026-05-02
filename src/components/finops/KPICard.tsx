import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from './Sparkline';
import { DeltaBadge } from './DeltaBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { FinOpsKPI } from '@/types/finops';

interface Props {
  label: string;
  hint?: string;
  data?: FinOpsKPI | null;
  format: (v: number | null | undefined) => string;
  invertDelta?: boolean; // true for cost-like (lower is better)
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  loading?: boolean;
}

const accentMap = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
} as const;

export function KPICard({
  label,
  hint,
  data,
  format,
  invertDelta = false,
  accent = 'primary',
  className,
  loading,
}: Props) {
  const value = data?.value;
  const spark = data?.spark;
  const delta = data?.delta_pct;
  const confidence = data?.confidence;

  // When the value is exactly 0 with low confidence, do not pretend it's
  // a real "R$ 0,00". Render an em dash with a tooltip explaining missing data.
  const isMissingZero =
    !loading && (value === 0 || value == null) && confidence === 'low';

  return (
    <Card className={cn('p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help opacity-60" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <ConfidenceBadge level={confidence} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          {loading ? (
            <span className="text-2xl font-bold tabular-nums leading-tight opacity-30">—</span>
          ) : isMissingZero ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-2xl font-bold tabular-nums leading-tight text-muted-foreground/50 cursor-help">
                  —
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Sem dados ingeridos no período. Veja o banner acima para detalhes.
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className={cn('text-2xl font-bold tabular-nums leading-tight', accentMap[accent])}>
              {format(value)}
            </span>
          )}
          {!isMissingZero && <DeltaBadge value={delta} invertColor={invertDelta} className="mt-1" />}
        </div>
        {spark && spark.length > 1 && (
          <div className={cn('opacity-80', accentMap[accent])}>
            <Sparkline data={spark} width={88} height={28} stroke="currentColor" fill="currentColor" />
          </div>
        )}
      </div>
    </Card>
  );
}

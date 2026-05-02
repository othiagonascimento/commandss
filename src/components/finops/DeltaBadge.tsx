import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pct as fmtPct } from '@/lib/finops/format';

interface Props {
  value?: number | null; // delta percentage (can be negative)
  /** Whether higher = better (revenue, margin) or lower = better (cost) */
  invertColor?: boolean;
  className?: string;
  showZero?: boolean;
}

export function DeltaBadge({ value, invertColor = false, className, showZero = false }: Props) {
  if (value == null || Number.isNaN(value)) {
    return <span className={cn('text-xs text-muted-foreground tabular-nums', className)}>—</span>;
  }

  const abs = Math.abs(value);
  const isFlat = abs < 0.05;
  if (isFlat && !showZero) {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums', className)}>
        <ArrowRight className="h-3 w-3" /> 0%
      </span>
    );
  }

  const positive = value > 0;
  const good = invertColor ? !positive : positive;
  const tone = isFlat
    ? 'text-muted-foreground'
    : good
      ? 'text-success'
      : 'text-destructive';

  const Icon = isFlat ? ArrowRight : positive ? ArrowUp : ArrowDown;

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', tone, className)}>
      <Icon className="h-3 w-3" />
      {fmtPct(abs, abs >= 100 ? 0 : 1)}
    </span>
  );
}

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from './Surface';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: { value: number; suffix?: string } | null;
  sub?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  variant?: 'hero' | 'standard' | 'compact';
  tone?: 'default' | 'plasma' | 'ember' | 'jade' | 'coral';
  loading?: boolean;
  crosshairs?: boolean;
  className?: string;
}

const toneText: Record<string, string> = {
  default: 'text-ink',
  plasma: 'text-plasma',
  ember: 'text-ember',
  jade: 'text-jade',
  coral: 'text-coral',
};

export function MetricCard({
  label, value, unit, delta, sub, badge, footer,
  variant = 'standard', tone = 'default', loading, crosshairs, className,
}: MetricCardProps) {
  const valueClass = cn(
    'font-mono font-semibold tabular leading-none tracking-tight',
    toneText[tone],
    variant === 'hero' && 'text-[clamp(2.5rem,7vw,5.5rem)]',
    variant === 'standard' && 'text-3xl sm:text-4xl',
    variant === 'compact' && 'text-xl sm:text-2xl',
  );

  return (
    <Surface
      variant={variant === 'hero' ? 'raised' : 'panel'}
      crosshairs={crosshairs ?? variant === 'hero'}
      className={cn('p-5 sm:p-6 flex flex-col gap-3 lift-hover', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="editorial-label flex items-center gap-2 min-w-0">
          <span className="truncate">{label}</span>
          {unit && <span className="text-ink-faint normal-case tracking-normal">/ {unit}</span>}
        </div>
        {badge}
      </div>

      {loading ? (
        <div className="skeleton-sweep h-12 w-32 rounded-sm" />
      ) : (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={valueClass}>{value}</span>
          {delta && (
            <span className={cn(
              'font-mono text-xs tabular',
              delta.value >= 0 ? 'text-plasma' : 'text-coral'
            )}>
              {delta.value >= 0 ? '↑' : '↓'} {Math.abs(delta.value).toFixed(1)}%{delta.suffix ?? ''}
            </span>
          )}
        </div>
      )}

      {sub && <div className="text-sm text-ink-2">{sub}</div>}
      {footer && <div className="hairline-t pt-2 mt-1 text-[10px] font-mono uppercase tracking-wider text-ink-faint">{footer}</div>}
    </Surface>
  );
}

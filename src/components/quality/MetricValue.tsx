import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { MasterReadMeta } from '@/lib/masterContract';
import { shouldHideMetric, isUntrustedRead } from '@/lib/masterContract';

interface Props {
  meta: MasterReadMeta | undefined | null;
  /** Renders the actual value (e.g. "R$ 12.000"). */
  children: ReactNode;
  /** Fallback label when metric is hidden. Default "Indisponível". */
  unavailableLabel?: string;
  className?: string;
}

/**
 * Renders a metric respecting data quality rules:
 *  - method=unavailable OR freshness=missing → hide value, show fallback label
 *  - method=estimated/fallback/wrapped OR freshness=stale → render in muted color
 *  - otherwise render normally
 */
export function MetricValue({ meta, children, unavailableLabel = 'Indisponível', className }: Props) {
  if (shouldHideMetric(meta)) {
    return (
      <span className={cn('text-muted-foreground italic font-normal', className)}>
        {unavailableLabel}
      </span>
    );
  }
  if (isUntrustedRead(meta)) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        {children}
      </span>
    );
  }
  return <span className={className}>{children}</span>;
}

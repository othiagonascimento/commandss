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

interface NoticeProps {
  variant?: 'warning' | 'error' | 'info';
  message: string;
  className?: string;
}

/** Inline banner explaining data quality issues for a widget/page. */
export function DataQualityNotice({ variant = 'warning', message, className }: NoticeProps) {
  const styles = {
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    error: 'border-destructive/40 bg-destructive/10 text-destructive',
    info: 'border-border bg-muted/40 text-muted-foreground',
  } as const;
  return (
    <div className={cn('mb-4 rounded-md border px-3 py-2 text-xs', styles[variant], className)}>
      {message}
    </div>
  );
}

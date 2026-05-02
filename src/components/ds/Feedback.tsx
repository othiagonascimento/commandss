import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-sweep rounded-sm', className)} />;
}

export function EmptyState({
  numeral = '00',
  title,
  description,
  action,
  className,
}: {
  numeral?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-surface-1 border border-hairline rounded-md p-8 flex flex-col items-start gap-3', className)}>
      <div className="font-mono text-5xl text-ink-faint tabular">{numeral}</div>
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {description && <p className="text-sm text-ink-2 mt-1 max-w-md">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Ticker({ items }: { items: { label: string; value: string; tone?: 'plasma' | 'ember' | 'jade' | 'default' }[] }) {
  const tone: Record<string, string> = {
    plasma: 'text-plasma', ember: 'text-ember', jade: 'text-jade', default: 'text-ink',
  };
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden hairline-l hairline-r relative">
      <div className="flex gap-8 whitespace-nowrap animate-ticker py-1">
        {doubled.map((it, i) => (
          <span key={i} className="flex items-baseline gap-1.5 font-mono text-[11px]">
            <span className="text-ink-faint uppercase tracking-wider">{it.label}</span>
            <span className={cn('tabular', tone[it.tone ?? 'default'])}>{it.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

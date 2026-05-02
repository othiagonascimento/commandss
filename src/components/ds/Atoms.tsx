import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Severity = 'critical' | 'warning' | 'info' | 'success';

const severityBar: Record<Severity, string> = {
  critical: 'bg-coral',
  warning: 'bg-ember',
  info: 'bg-cobalt',
  success: 'bg-jade',
};

interface AlertRowProps {
  severity: Severity;
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AlertRow({ severity, title, detail, meta, action, onClick, className }: AlertRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-stretch gap-3 bg-surface-1 border border-hairline rounded-sm pr-3 hover:border-plasma/30 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className={cn('w-[2px] shrink-0 rounded-full my-2', severityBar[severity])} />
      <div className="flex-1 min-w-0 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-ink font-medium truncate">{title}</div>
          {detail && <div className="text-xs text-ink-2 mt-0.5 truncate">{detail}</div>}
        </div>
        {meta && <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint shrink-0">{meta}</div>}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function StatusDot({ tone = 'success', label, className }: { tone?: 'success' | 'warning' | 'error' | 'offline'; label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('status-dot', `status-dot-${tone}`)} />
      {label && <span className="font-mono text-[10px] uppercase tracking-wider text-ink-2">{label}</span>}
    </span>
  );
}

export function TrendDelta({ value, suffix = '%', className }: { value: number; suffix?: string; className?: string }) {
  const positive = value >= 0;
  return (
    <span className={cn('font-mono text-xs tabular', positive ? 'text-plasma' : 'text-coral', className)}>
      {positive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

export function Tag({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'plasma' | 'ember' | 'jade' | 'coral' | 'cobalt'; children: ReactNode; className?: string }) {
  const map: Record<string, string> = {
    neutral: 'bg-surface-2 text-ink-2 border-hairline',
    plasma: 'bg-plasma/10 text-plasma border-plasma/30',
    ember:  'bg-ember/10 text-ember border-ember/30',
    jade:   'bg-jade/10 text-jade border-jade/30',
    coral:  'bg-coral/10 text-coral border-coral/30',
    cobalt: 'bg-cobalt/10 text-cobalt border-cobalt/30',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 border rounded-sm font-mono text-[10px] uppercase tracking-wider',
      map[tone], className
    )}>{children}</span>
  );
}

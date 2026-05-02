import { cn } from '@/lib/utils';

const styles = {
  low: 'bg-success/15 text-success border-success/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/50 font-bold',
} as const;

const labels = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico',
} as const;

export function RiskBadge({ level, className }: { level?: 'low' | 'medium' | 'high' | 'critical' | null; className?: string }) {
  if (!level) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border',
        styles[level],
        className,
      )}
    >
      {labels[level]}
    </span>
  );
}

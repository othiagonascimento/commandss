import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Confidence } from '@/types/finops';

const map: Record<Confidence, { label: string; cls: string; explain: string }> = {
  high: {
    label: 'Alta',
    cls: 'bg-success/15 text-success border-success/30',
    explain: 'Dado direto de api_usage_logs ou media_usage_events.',
  },
  medium: {
    label: 'Média',
    cls: 'bg-warning/15 text-warning border-warning/30',
    explain: 'Derivado de eventos operacionais (mensagens, ai_events).',
  },
  low: {
    label: 'Baixa',
    cls: 'bg-destructive/15 text-destructive border-destructive/30',
    explain: 'Rateio a partir de billing agregado / platform_cost_allocations.',
  },
};

interface Props {
  level?: Confidence | null;
  className?: string;
}

export function ConfidenceBadge({ level, className }: Props) {
  if (!level) return null;
  const c = map[level];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border',
            c.cls,
            className,
          )}
        >
          {c.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">Confiança: {c.label}</p>
        <p className="text-xs text-muted-foreground">{c.explain}</p>
      </TooltipContent>
    </Tooltip>
  );
}

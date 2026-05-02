import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, Database, Sparkles, HelpCircle,
} from 'lucide-react';
import type { MasterReadMeta } from '@/lib/masterContract';

interface Props {
  meta: MasterReadMeta | undefined | null;
  /** When true, shows full label. When false (default), only icon + dot. */
  verbose?: boolean;
  className?: string;
}

const methodCopy: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  live: { label: 'Tempo real', icon: Sparkles },
  cached: { label: 'Cache válido', icon: Database },
  snapshot: { label: 'Snapshot', icon: Database },
  wrapped: { label: 'Contrato legado (v1)', icon: HelpCircle },
  fallback: { label: 'Fonte alternativa', icon: AlertTriangle },
  estimated: { label: 'Estimativa', icon: AlertTriangle },
  unavailable: { label: 'Indisponível', icon: XCircle },
  unknown: { label: 'Origem desconhecida', icon: HelpCircle },
};

function ageLabel(ms: number | null): string {
  if (ms == null) return 'sem timestamp';
  if (ms < 0) return 'agora';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function classes(meta: MasterReadMeta | null | undefined) {
  if (!meta) return 'bg-muted text-muted-foreground border-border';
  if (meta.method === 'unavailable' || meta.freshness.status === 'missing') {
    return 'bg-destructive/10 text-destructive border-destructive/40';
  }
  if (meta.freshness.status === 'stale') {
    return 'bg-destructive/10 text-destructive border-destructive/40';
  }
  if (meta.method === 'fallback' || meta.method === 'estimated' || meta.method === 'wrapped') {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40';
  }
  if (meta.confidence === 'low') {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40';
  }
  return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40';
}

export function DataQualityBadge({ meta, verbose = false, className }: Props) {
  // Re-render every 30s so age stays accurate without parent refetching
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!meta) {
    return (
      <Badge variant="outline" className={cn('gap-1 text-[10px] font-medium', className)}>
        <HelpCircle className="h-3 w-3" /> sem metadados
      </Badge>
    );
  }

  const cfg = methodCopy[meta.method] ?? methodCopy.unknown;
  const Icon = cfg.icon;
  const observedAt = meta.freshness.observed_at ?? meta.generated_at;
  const ageMs = observedAt ? Date.now() - new Date(observedAt).getTime() : null;
  const colorClasses = classes(meta);
  const stale = meta.freshness.status === 'stale' || meta.freshness.status === 'missing';

  const tooltipContent = (
    <div className="text-xs space-y-1 max-w-xs">
      <div className="font-semibold">{cfg.label}</div>
      <div className="text-muted-foreground">
        Confiança: <span className="font-medium text-foreground">{meta.confidence}</span>
      </div>
      <div className="text-muted-foreground">
        Atualidade: <span className="font-medium text-foreground">{meta.freshness.status}</span>
        {' '}({ageLabel(ageMs)})
      </div>
      <div className="text-muted-foreground">
        Origem: <span className="font-mono text-[10px]">{meta.source_project_id}</span>
      </div>
      {meta.warnings.length > 0 && (
        <div className="pt-1 border-t border-border/50 mt-1">
          {meta.warnings.map((w, i) => (
            <div key={i} className="text-amber-600 dark:text-amber-400 text-[11px]">⚠ {w}</div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 text-[10px] font-medium border whitespace-nowrap',
              colorClasses,
              stale && 'animate-pulse',
              className
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {verbose ? (
              <span>{cfg.label} · {ageLabel(ageMs)}</span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {ageLabel(ageMs)}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline warning panel — use inside a card when meta has warnings or is untrusted.
 * Shows nothing when meta is healthy.
 */
export function DataQualityNotice({ meta, className }: { meta: MasterReadMeta | undefined | null; className?: string }) {
  if (!meta) return null;
  const stale = meta.freshness.status === 'stale' || meta.freshness.status === 'missing';
  const untrusted = meta.method === 'fallback' || meta.method === 'estimated' || meta.method === 'unavailable';
  const isLegacy = meta.schema_version === 'v1' || meta.method === 'wrapped';
  if (!stale && !untrusted && !isLegacy && meta.warnings.length === 0) return null;

  const tone = (stale || meta.method === 'unavailable')
    ? 'border-destructive/40 bg-destructive/5 text-destructive'
    : 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400';

  return (
    <div className={cn('rounded-md border px-3 py-2 text-xs space-y-1', tone, className)}>
      {isLegacy && (
        <div className="flex items-center gap-1.5 font-medium">
          <HelpCircle className="h-3 w-3" /> Contrato legado (v1) — dados sem garantia de atualidade.
        </div>
      )}
      {meta.method === 'unavailable' && (
        <div className="flex items-center gap-1.5 font-medium">
          <XCircle className="h-3 w-3" /> Métrica indisponível no momento.
        </div>
      )}
      {meta.method === 'estimated' && (
        <div className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="h-3 w-3" /> Valor estimado — não medido diretamente.
        </div>
      )}
      {meta.method === 'fallback' && (
        <div className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="h-3 w-3" /> Fonte alternativa em uso.
        </div>
      )}
      {stale && (
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="h-3 w-3" /> Dados {meta.freshness.status === 'missing' ? 'ausentes' : 'desatualizados'}.
        </div>
      )}
      {meta.warnings.map((w, i) => (
        <div key={i}>⚠ {w}</div>
      ))}
    </div>
  );
}

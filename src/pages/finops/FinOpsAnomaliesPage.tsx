import { useMemo, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { useFinOpsAnomalies } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/finops/RiskBadge';
import { acknowledge, getAcknowledged, unacknowledge } from '@/lib/finops/acknowledgedAnomalies';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Check, RotateCcw, ExternalLink } from 'lucide-react';
import { dateBR } from '@/lib/finops/format';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { FinOpsAnomaly } from '@/types/finops';

export default function FinOpsAnomaliesPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading, refetch } = useFinOpsAnomalies(filters);
  const [filter, setFilter] = useState<'open' | 'ack' | 'all'>('open');
  const [selected, setSelected] = useState<FinOpsAnomaly | null>(null);
  const [, force] = useState(0);
  const ack = getAcknowledged();

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    if (filter === 'open') return all.filter((a) => !ack[a.id]);
    if (filter === 'ack') return all.filter((a) => ack[a.id]);
    return all;
  }, [data, filter, ack]);

  return (
    <FinOpsShell title="Anomalias & Alertas" description="Inbox de anomalias econômicas detectadas. Marque como reconhecida quando investigado.">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-3">
        <Card className="p-3 space-y-2">
          <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as 'open' | 'ack' | 'all')} className="w-full grid grid-cols-3">
            <ToggleGroupItem value="open" className="h-8 text-xs">Abertas</ToggleGroupItem>
            <ToggleGroupItem value="ack" className="h-8 text-xs">Reconhecidas</ToggleGroupItem>
            <ToggleGroupItem value="all" className="h-8 text-xs">Todas</ToggleGroupItem>
          </ToggleGroup>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {isLoading && <p className="text-xs text-muted-foreground p-2">Carregando…</p>}
            {!isLoading && rows.length === 0 && <p className="text-xs text-muted-foreground p-2">Nada por aqui.</p>}
            {rows.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg border transition-colors',
                  selected?.id === a.id ? 'bg-primary/10 border-primary/40' : 'hover:bg-muted border-border',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <RiskBadge level={a.severity} />
                  <span className="text-[10px] text-muted-foreground">{dateBR(a.created_at)}</span>
                </div>
                <div className="mt-1.5 text-sm font-medium truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground truncate">{a.description}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          {!selected && <p className="text-sm text-muted-foreground">Selecione uma anomalia para ver detalhes.</p>}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={selected.severity} />
                    <span className="text-[10px] uppercase text-muted-foreground">{selected.type}</span>
                  </div>
                  <h2 className="text-lg font-bold mt-1">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                </div>
                <div className="flex gap-2">
                  {ack[selected.id] ? (
                    <Button size="sm" variant="outline" onClick={() => { unacknowledge(selected.id); force((n) => n + 1); refetch(); }} className="gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => { acknowledge(selected.id); force((n) => n + 1); refetch(); }} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Reconhecer
                    </Button>
                  )}
                </div>
              </div>

              {selected.entity && (
                <Card className="p-3 bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground">Entidade afetada</div>
                  <div className="text-sm font-mono">{selected.entity.type}: {selected.entity.name || selected.entity.id}</div>
                </Card>
              )}

              {(selected.observed_value != null || selected.expected_value != null) && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Observado</div>
                    <div className="text-lg font-bold tabular-nums">{String(selected.observed_value ?? '—')}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Esperado</div>
                    <div className="text-lg font-bold tabular-nums">{String(selected.expected_value ?? '—')}</div>
                  </Card>
                </div>
              )}

              {selected.recommendation && (
                <Card className="p-3 border-primary/30 bg-primary/5">
                  <div className="text-[10px] uppercase text-primary font-semibold">Recomendação</div>
                  <p className="text-sm mt-1">{selected.recommendation}</p>
                </Card>
              )}

              {selected.related_link && (
                <Link to={selected.related_link} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  Ir para tela relacionada <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </FinOpsShell>
  );
}

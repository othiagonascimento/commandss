import { Card } from '@/components/ui/card';
import { ConfidenceBadge } from './ConfidenceBadge';
import { dateBR, num } from '@/lib/finops/format';
import type { FinOpsOverview } from '@/types/finops';
import { AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface Props {
  health?: FinOpsOverview['data_health'];
}

export function HealthFooter({ health }: Props) {
  if (!health) return null;
  const empty = health.api_usage_logs_empty;

  return (
    <Card className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-muted/30">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{num(health.logs_count)}</span> logs analisados
          </span>
        </div>
        <span className="text-muted-foreground/50">•</span>
        <div className="flex items-center gap-1.5">
          {empty ? (
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          )}
          <span className="text-muted-foreground">
            última ingestão: <span className="text-foreground">{dateBR(health.last_ingest_at)}</span>
          </span>
        </div>
        <span className="text-muted-foreground/50">•</span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">confiança média:</span>
          <ConfidenceBadge level={health.avg_confidence} />
        </div>
      </div>
      {health.notes && health.notes.length > 0 && (
        <div className="text-muted-foreground italic">{health.notes.join(' · ')}</div>
      )}
    </Card>
  );
}

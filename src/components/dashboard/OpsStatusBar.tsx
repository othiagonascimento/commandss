import { useNavigate } from 'react-router-dom';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { cn } from '@/lib/utils';
import { Activity, Radio, Cpu, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusIndicator {
  label: string;
  icon: React.ElementType;
  status: 'green' | 'yellow' | 'red' | 'unknown';
  detail: string;
}

export function OpsStatusBar() {
  const navigate = useNavigate();
  const { snapshot, alertCount, isLoading } = useOpsHealth();

  const snapshotData = (snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;

  const getIndicators = (): StatusIndicator[] => {
    if (!snapshotData) {
      return [
        { label: 'Filas', icon: Activity, status: 'unknown', detail: 'Sem dados' },
        { label: 'Canais', icon: Radio, status: 'unknown', detail: 'Sem dados' },
        { label: 'Cron', icon: Cpu, status: 'unknown', detail: 'Sem dados' },
        { label: 'IA', icon: Shield, status: 'unknown', detail: 'Sem dados' },
      ];
    }

    const eq = snapshotData.event_queue as Record<string, number> | undefined;
    const mq = snapshotData.message_queue as Record<string, number> | undefined;
    const channels = snapshotData.channels as Record<string, unknown[]> | undefined;
    const ai = snapshotData.ai_performance as Record<string, number> | undefined;
    const cron = snapshotData.cron_health as { jobs?: Array<{ consecutive_failures?: number }> } | undefined;

    const eqPending = eq?.pending ?? 0;
    const mqPending = mq?.pending ?? 0;
    const queueStatus = eqPending > 200 || mqPending > 50 ? 'red' : eqPending > 100 || mqPending > 25 ? 'yellow' : 'green';

    const whatsapp = (channels?.whatsapp ?? []) as Array<{ is_active?: boolean; connection_status?: string }>;
    const disconnected = whatsapp.filter(w => w.is_active && w.connection_status !== 'connected').length;
    const channelStatus = disconnected > 0 ? 'red' : whatsapp.length > 0 ? 'green' : 'unknown';

    const failedJobs = (cron?.jobs ?? []).filter(j => (j.consecutive_failures ?? 0) >= 2).length;
    const cronStatus = failedJobs > 0 ? 'red' : 'green';

    const leaks = ai?.leak_count ?? 0;
    const fallbackRate = ai?.fallback_rate ?? 0;
    const aiStatus = leaks > 0 ? 'red' : fallbackRate > 0.3 ? 'yellow' : 'green';

    return [
      { label: 'Filas', icon: Activity, status: queueStatus as StatusIndicator['status'], detail: `Event: ${eqPending} | Msg: ${mqPending}` },
      { label: 'Canais', icon: Radio, status: channelStatus as StatusIndicator['status'], detail: disconnected > 0 ? `${disconnected} desconectado(s)` : 'Todos conectados' },
      { label: 'Cron', icon: Cpu, status: cronStatus as StatusIndicator['status'], detail: failedJobs > 0 ? `${failedJobs} job(s) falhando` : 'Todos OK' },
      { label: 'IA', icon: Shield, status: aiStatus as StatusIndicator['status'], detail: leaks > 0 ? `${leaks} leak(s)!` : `Fallback: ${(fallbackRate * 100).toFixed(0)}%` },
    ];
  };

  const indicators = getIndicators();

  const statusColor = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    unknown: 'bg-muted-foreground/40',
  };

  if (isLoading) return null;

  return (
    <div
      onClick={() => navigate('/operations')}
      className="flex items-center gap-4 px-4 py-2 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors mb-6"
    >
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Status Operacional</span>
      <div className="flex items-center gap-3">
        {indicators.map((ind) => (
          <Tooltip key={ind.label}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <ind.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <div className={cn('h-2.5 w-2.5 rounded-full', statusColor[ind.status])} />
                <span className="text-xs text-muted-foreground hidden sm:inline">{ind.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{ind.label}</p>
              <p className="text-xs text-muted-foreground">{ind.detail}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {alertCount > 0 && (
        <span className="ml-auto text-xs font-medium bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
          {alertCount} alerta{alertCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

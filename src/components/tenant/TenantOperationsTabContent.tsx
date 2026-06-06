import { useQuery } from '@tanstack/react-query';
import { opsHealthApi, usageApi } from '@/services/masterApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TenantOperationsTab({ tenantId }: { tenantId: string }) {
  const { data: tenantOps, isLoading: opsLoading, isError: opsError } = useQuery({
    queryKey: ['tenant-ops', tenantId],
    queryFn: async () => {
      const res = await opsHealthApi.getTenantOps(tenantId);
      // Trata "endpoint indisponível" (400/404/sem snapshot) como dado vazio,
      // não como erro: a aba renderiza empty state limpo.
      if (res.error) return null;
      return res.data;
    },
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const snapshot = (tenantOps?.snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;
  const hasOpsSnapshot = !!snapshot;

  const { data: usageFallback, isLoading: usageLoading } = useQuery({
    queryKey: ['tenant-usage-ops-fallback', tenantId],
    queryFn: async () => {
      const res = await usageApi.get(tenantId);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled: !hasOpsSnapshot && !opsLoading,
    staleTime: 30_000,
  });

  const isLoading = opsLoading || (!hasOpsSnapshot && usageLoading);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const alerts = (tenantOps?.alerts ?? []) as Array<{ id: string; title: string; severity: string; alert_type: string; created_at: string }>;

  if (hasOpsSnapshot) {
    const eq = snapshot?.event_queue as Record<string, number> | undefined;
    const mq = snapshot?.message_queue as Record<string, number> | undefined;
    const ai = snapshot?.ai_performance as Record<string, number> | undefined;
    const conversations = snapshot?.conversations as Record<string, number> | undefined;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardDescription>Event Queue</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-bold">{eq?.pending ?? '-'}</p><p className="text-xs text-muted-foreground">pending</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Msg Queue</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-bold">{mq?.pending ?? '-'}</p><p className="text-xs text-muted-foreground">pending</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Latência IA</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-bold">{ai?.latency_avg ? `${ai.latency_avg.toFixed(0)}ms` : '-'}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Conversas Ativas</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-bold">{conversations?.active ?? '-'}</p></CardContent></Card>
        </div>

        {alerts.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Alertas deste tenant</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded border border-border">
                    <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{a.severity}</Badge>
                    <span className="text-sm flex-1">{a.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const usageData = usageFallback?.usage as Record<string, number> | undefined;
  const noData = !usageData;

  return (
    <div className="space-y-6">
      {noData && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Sem dados operacionais detalhados.</p>
          </CardContent>
        </Card>
      )}

      {usageData && (
        <>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">
                📊 Dados via consumo (master-usage). Para filas e IA em tempo real, o CRM precisa enviar ops_health_sync.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardDescription>Usuários ativos</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.active_users ?? usageData.users ?? 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Leads</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.leads ?? 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Mensagens (mês)</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.messages ?? 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>WhatsApp instances</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.whatsapp_instances ?? 0}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardDescription>Créditos IA</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.ai_credits ?? 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Tokens IA</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{(usageData.ai_tokens ?? 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Produtos</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.products ?? 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Storage</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{usageData.storage_mb ?? 0} MB</p></CardContent></Card>
          </div>
        </>
      )}

      {alerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Alertas deste tenant</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded border border-border">
                  <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{a.severity}</Badge>
                  <span className="text-sm flex-1">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

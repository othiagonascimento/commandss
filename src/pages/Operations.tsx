import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useAlerts } from '@/hooks/useAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Radio,
  Activity,
  Shield,
  Cpu,
  Wifi,
  WifiOff,
  Brain,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const severityConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'bg-destructive text-destructive-foreground', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: AlertTriangle, label: 'Atenção' },
  info: { color: 'bg-primary/10 text-primary', icon: Activity, label: 'Info' },
};

const alertTypeLabels: Record<string, string> = {
  queue_overload: 'Fila Sobrecarregada',
  channel_down: 'Canal Desconectado',
  ai_leak: 'Vazamento de IA',
  trial_expiring: 'Trial Expirando',
  limit_reached: 'Limite Atingido',
  cron_failure: 'Cron Falhando',
  security_alert: 'Segurança',
  user_inconsistency: 'Inconsistência',
};

function StatCard({ title, value, subtitle, icon: Icon, status }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
}) {
  const statusColors = {
    green: 'text-emerald-500',
    yellow: 'text-amber-500',
    red: 'text-destructive',
    neutral: 'text-primary',
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', statusColors[status || 'neutral'])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Operations() {
  const [activeTab, setActiveTab] = useState('overview');
  const { snapshot, alerts, alertCount, history, isLoading, refetch } = useOpsHealth();
  const { resolve, isResolving } = useAlerts();

  const snapshotData = (snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;
  const snapshotCreatedAt = (snapshot as Record<string, unknown>)?.created_at as string | undefined;

  // Extract metrics from snapshot
  const eq = snapshotData?.event_queue as Record<string, unknown> | undefined;
  const mq = snapshotData?.message_queue as Record<string, unknown> | undefined;
  const channels = snapshotData?.channels as Record<string, unknown[]> | undefined;
  const ai = snapshotData?.ai_performance as Record<string, unknown> | undefined;
  const cron = snapshotData?.cron_health as { jobs?: Array<Record<string, unknown>> } | undefined;
  const security = snapshotData?.security as Record<string, number> | undefined;
  const userConsistency = snapshotData?.user_consistency as Record<string, number> | undefined;

  const eqPending = (eq?.pending as number) ?? 0;
  const eqFailed = (eq?.failed as number) ?? 0;
  const mqPending = (mq?.pending as number) ?? 0;
  const whatsappChannels = (channels?.whatsapp ?? []) as Array<Record<string, unknown>>;
  const metaChannels = (channels?.meta ?? []) as Array<Record<string, unknown>>;
  const connectedChannels = whatsappChannels.filter(w => w.connection_status === 'connected').length + metaChannels.filter(m => m.is_active).length;
  const totalChannels = whatsappChannels.length + metaChannels.length;
  const cronJobs = cron?.jobs ?? [];
  const failedCrons = cronJobs.filter(j => ((j.consecutive_failures as number) ?? 0) >= 2).length;

  const queueStatus = eqPending > 200 || mqPending > 50 ? 'red' : eqPending > 100 ? 'yellow' : 'green';
  const channelStatus = whatsappChannels.some(w => w.is_active && w.connection_status !== 'connected') ? 'red' : totalChannels > 0 ? 'green' : 'neutral';

  // Format history for chart
  const chartData = history.map((h) => {
    const m = h.metrics as Record<string, Record<string, number>>;
    return {
      hour: new Date(h.hour).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      event_pending: m?.event_queue?.pending ?? 0,
      msg_pending: m?.message_queue?.pending ?? 0,
      ai_latency: m?.ai_performance?.latency_avg ?? 0,
    };
  }).reverse();

  const eventTypeBreakdown = Object.entries((eq?.by_type as Record<string, number>) ?? {}).map(([type, count]) => ({
    type,
    count,
  }));

  const noData = !snapshotData;

  return (
    <DashboardLayout>
      <PageHeader
        title="Centro de Operações"
        description={snapshotCreatedAt
          ? `Último snapshot: ${formatDistanceToNow(new Date(snapshotCreatedAt), { addSuffix: true, locale: ptBR })}`
          : 'Aguardando primeiro snapshot do CRM'
        }
        icon={Radio}
        actions={
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Atualizar
          </Button>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Alertas Ativos"
          value={alertCount}
          subtitle={alertCount > 0 ? `${alerts.filter(a => a.severity === 'critical').length} crítico(s)` : 'Tudo operacional'}
          icon={ShieldAlert}
          status={alertCount > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Filas"
          value={noData ? '-' : `${eqPending + mqPending}`}
          subtitle={noData ? 'Sem dados' : `Event: ${eqPending} | Msg: ${mqPending} | Failed: ${eqFailed}`}
          icon={Activity}
          status={noData ? 'neutral' : queueStatus}
        />
        <StatCard
          title="Canais"
          value={noData ? '-' : `${connectedChannels}/${totalChannels}`}
          subtitle={noData ? 'Sem dados' : connectedChannels === totalChannels ? 'Todos conectados' : `${totalChannels - connectedChannels} desconectado(s)`}
          icon={Wifi}
          status={noData ? 'neutral' : channelStatus}
        />
        <StatCard
          title="Cron Jobs"
          value={noData ? '-' : `${cronJobs.length - failedCrons}/${cronJobs.length}`}
          subtitle={noData ? 'Sem dados' : failedCrons > 0 ? `${failedCrons} falhando` : 'Todos OK'}
          icon={Cpu}
          status={noData ? 'neutral' : failedCrons > 0 ? 'red' : 'green'}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="queues">Filas</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Métricas das Últimas 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                      <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="event_pending" name="Event Queue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="msg_pending" name="Msg Queue" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Ativos</CardTitle>
              <CardDescription>{alerts.length === 0 ? 'Nenhum alerta ativo' : `${alerts.length} alerta(s)`}</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                  <p>Tudo operacional</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => {
                    const config = severityConfig[alert.severity] || severityConfig.info;
                    const Icon = config.icon;
                    return (
                      <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <div className={cn('p-1.5 rounded', config.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {alertTypeLabels[alert.alert_type] || alert.alert_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolve(alert.id)}
                          disabled={isResolving}
                        >
                          Resolver
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUEUES TAB */}
        <TabsContent value="queues" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Queue</CardTitle>
                <CardDescription>Fila central de processamento</CardDescription>
              </CardHeader>
              <CardContent>
                {noData ? (
                  <p className="text-muted-foreground text-sm">Aguardando dados do CRM</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-amber-500">{eqPending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{(eq?.processing as number) ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Processing</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-destructive">{eqFailed}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Message Queue</CardTitle>
                <CardDescription>Fila de envio de mensagens</CardDescription>
              </CardHeader>
              <CardContent>
                {noData ? (
                  <p className="text-muted-foreground text-sm">Aguardando dados do CRM</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-amber-500">{mqPending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">{(mq?.sent as number) ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{(mq?.failed as number) ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {eventTypeBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="type" type="category" width={140} className="text-xs fill-muted-foreground" />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CHANNELS TAB */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Instances</CardTitle>
            </CardHeader>
            <CardContent>
              {noData || whatsappChannels.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados de instâncias WhatsApp</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instância</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsappChannels.map((ch, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{(ch.name as string) || `Instância ${i + 1}`}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ch.connection_status === 'connected' ? (
                              <Wifi className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm">{(ch.connection_status as string) || 'unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ch.is_active ? 'default' : 'secondary'}>
                            {ch.is_active ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {metaChannels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Canais Meta (Instagram/Messenger)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metaChannels.map((ch, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{(ch.name as string) || `Canal ${i + 1}`}</TableCell>
                        <TableCell>{(ch.type as string) || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={ch.is_active ? 'default' : 'secondary'}>
                            {ch.is_active ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Latência Média"
              value={noData ? '-' : `${((ai?.latency_avg as number) ?? 0).toFixed(0)}ms`}
              icon={Clock}
              status="neutral"
            />
            <StatCard
              title="Taxa de Fallback"
              value={noData ? '-' : `${(((ai?.fallback_rate as number) ?? 0) * 100).toFixed(1)}%`}
              icon={Brain}
              status={((ai?.fallback_rate as number) ?? 0) > 0.3 ? 'yellow' : 'green'}
            />
            <StatCard
              title="Leaks Detectados"
              value={noData ? '-' : String((ai?.leak_count as number) ?? 0)}
              icon={ShieldAlert}
              status={((ai?.leak_count as number) ?? 0) > 0 ? 'red' : 'green'}
            />
            <StatCard
              title="Taxa de Escalação"
              value={noData ? '-' : `${(((ai?.escalation_rate as number) ?? 0) * 100).toFixed(1)}%`}
              icon={Activity}
              status="neutral"
            />
          </div>

          {ai?.by_layer && (
            <Card>
              <CardHeader>
                <CardTitle>Uso por Layer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ai.by_layer as Record<string, number>).map(([layer, count]) => (
                    <div key={layer} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{layer}</span>
                      <span className="text-sm text-muted-foreground">{count} chamadas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CRON TAB */}
        <TabsContent value="cron">
          <Card>
            <CardHeader>
              <CardTitle>Cron Jobs</CardTitle>
              <CardDescription>Status de execução dos jobs agendados</CardDescription>
            </CardHeader>
            <CardContent>
              {noData || cronJobs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados de cron jobs</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Último Sucesso</TableHead>
                      <TableHead>Lag (s)</TableHead>
                      <TableHead>Falhas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronJobs.map((job, i) => {
                      const failures = (job.consecutive_failures as number) ?? 0;
                      const status = failures >= 2 ? 'red' : failures >= 1 ? 'yellow' : 'green';
                      const statusColor = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-destructive' };
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{(job.name as string) || `Job ${i + 1}`}</TableCell>
                          <TableCell className="text-sm">
                            {job.last_success
                              ? formatDistanceToNow(new Date(job.last_success as string), { addSuffix: true, locale: ptBR })
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>{(job.lag_seconds as number) ?? '-'}</TableCell>
                          <TableCell>{failures}</TableCell>
                          <TableCell>
                            <div className={cn('h-3 w-3 rounded-full', statusColor[status])} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Alertas Abertos"
              value={noData ? '-' : String(security?.open_alerts ?? 0)}
              icon={Shield}
              status={(security?.high_severity_count ?? 0) > 0 ? 'red' : 'green'}
            />
            <StatCard
              title="Alta Severidade"
              value={noData ? '-' : String(security?.high_severity_count ?? 0)}
              icon={ShieldAlert}
              status={(security?.high_severity_count ?? 0) > 0 ? 'red' : 'green'}
            />
            <StatCard
              title="Inconsistências"
              value={noData ? '-' : String((userConsistency?.profiles_without_role ?? 0) + (userConsistency?.users_without_usage ?? 0))}
              subtitle={noData ? '' : `${userConsistency?.profiles_without_role ?? 0} sem role | ${userConsistency?.users_without_usage ?? 0} sem usage`}
              icon={Activity}
              status={(userConsistency?.profiles_without_role ?? 0) > 0 ? 'yellow' : 'green'}
            />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

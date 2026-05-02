import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useAlerts, type AlertRecord } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Building2, DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle,
  Activity, Target, Wifi, WifiOff, ChevronRight, ShieldAlert, Users,
  CreditCard, CheckCircle2, Cpu, Brain, LayoutDashboard, Crown, Zap,
  BarChart3, Clock, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DataQualityBadge, DataQualityNotice } from '@/components/quality/DataQualityBadge';
import { MetricValue } from '@/components/quality/MetricValue';
import { isUntrustedRead, shouldHideMetric } from '@/lib/masterContract';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('pt-BR').format(v);
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return <div className={cn('h-2 w-2 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-destructive animate-pulse')} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const {
    overview, revenue, timeSeries,
    overviewMeta, revenueMeta, timeSeriesMeta,
    overviewSchemaInvalid, revenueSchemaInvalid, timeSeriesSchemaInvalid,
    isLoading, error, refetch,
  } = useMasterDashboard();
  const { snapshot, snapshotMeta, alerts: opsAlerts, alertCount } = useOpsHealth();

  const snap = snapshot?.snapshot_data as Record<string, unknown> | undefined;
  const snapAt = snapshot?.created_at;
  const snapStale = snapshotMeta?.freshness.status === 'stale';
  const snapMissing = snapshotMeta?.freshness.status === 'missing' || !snap;
  const channels = snap?.channels as Record<string, unknown[]> | undefined;
  const whatsappChannels = (channels?.whatsapp ?? []) as Array<Record<string, unknown>>;
  const metaChannels = (channels?.meta ?? []) as Array<Record<string, unknown>>;
  const connectedWA = whatsappChannels.filter(w => w.status === 'connected').length;
  const disconnectedWA = whatsappChannels.filter(w => w.status !== 'connected');
  const cronJobs = ((snap?.cron_health as Record<string, unknown>)?.jobs ?? []) as Array<Record<string, unknown>>;
  const failedCrons = cronJobs.filter(j => ((j.consecutive_failures as number) ?? 0) >= 2);
  const conversations = snap?.conversations as Record<string, unknown> | undefined;

  const chartData = timeSeries?.data || [];
  // CRITICAL: never show "system OK" when snapshot is stale/missing
  const systemOk = !snapStale && !snapMissing
    && alertCount === 0 && disconnectedWA.length === 0 && failedCrons.length === 0;

  // Subscription breakdown
  const subscriptionBreakdown = overview ? [
    { label: 'Ativos', value: overview.tenants.active, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Trial', value: overview.subscriptions.trial, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Cancelados', value: overview.subscriptions.cancelled, color: 'text-destructive' },
  ].filter(s => s.value > 0) : [];

  // Header status text follows snapshot freshness, not generation time
  const headerStatusText = (() => {
    if (!snapAt) return 'Sem snapshot recente';
    if (snapStale) return `Snapshot desatualizado (${formatDistanceToNow(new Date(snapAt), { addSuffix: true, locale: ptBR })})`;
    return `Atualizado ${formatDistanceToNow(new Date(snapAt), { addSuffix: true, locale: ptBR })}`;
  })();

  return (
    <DashboardLayout>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Painel Master</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              'text-sm',
              snapStale || snapMissing ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {headerStatusText}
            </p>
            <DataQualityBadge meta={snapshotMeta} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} /> Atualizar
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="ml-auto" onClick={refetch}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {(overviewSchemaInvalid || revenueSchemaInvalid || timeSeriesSchemaInvalid) && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            <strong>Contrato quebrado:</strong> a resposta do CRM não bate com o esquema esperado.
            Os widgets afetados estão em estado de erro. Veja o console para detalhes.
          </CardContent>
        </Card>
      )}

      {snapshotMeta && (snapStale || snapMissing) && (
        <DataQualityNotice meta={snapshotMeta} className="mb-6" />
      )}


      {/* ─── Hero: Usuários + Mensagens + MRR ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Users - Primary hero */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-12 w-32" /><Skeleton className="h-4 w-48" /></div>
            ) : overviewSchemaInvalid ? (
              <div className="text-sm text-destructive">⚠ Contrato inválido</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Usuários</span>
                  <DataQualityBadge meta={overviewMeta} className="ml-auto" />
                </div>
                <p className="text-5xl font-black tracking-tight text-foreground">
                  <MetricValue meta={overviewMeta}>
                    {overview ? fmtNum(overview.usage.total_users) : '—'}
                  </MetricValue>
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{overview ? `em ${fmtNum(overview.tenants.total)} tenants` : '—'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Messages - Highlighted hero */}
        <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-12 w-32" /><Skeleton className="h-4 w-48" /></div>
            ) : overviewSchemaInvalid ? (
              <div className="text-sm text-destructive">⚠ Contrato inválido</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Mensagens</span>
                  <DataQualityBadge meta={overviewMeta} className="ml-auto" />
                </div>
                <p className="text-5xl font-black tracking-tight text-foreground">
                  <MetricValue meta={overviewMeta}>
                    {overview ? fmtNum(overview.usage.total_messages) : '—'}
                  </MetricValue>
                </p>
                <div className="flex items-center gap-1.5 text-sm mt-3">
                  {snapMissing ? (
                    <span className="text-muted-foreground italic">canais sem leitura recente</span>
                  ) : (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={cn(snapStale ? 'text-destructive' : 'text-muted-foreground')}>
                        {connectedWA > 0 ? `${connectedWA} canal${connectedWA > 1 ? 'is' : ''} online` : 'sem canais'}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* MRR */}
        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-12 w-32" /><Skeleton className="h-4 w-48" /></div>
            ) : revenueSchemaInvalid ? (
              <div className="text-sm text-destructive">⚠ Contrato inválido</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">MRR</span>
                  {revenue?.growth_percentage !== undefined && !isUntrustedRead(revenueMeta) && (
                    <Badge variant="secondary" className={cn('text-[10px] gap-0.5', revenue.growth_percentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                      {revenue.growth_percentage >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {Math.abs(revenue.growth_percentage)}%
                    </Badge>
                  )}
                  <DataQualityBadge meta={revenueMeta} className="ml-auto" />
                </div>
                <p className="text-5xl font-black tracking-tight text-foreground">
                  <MetricValue meta={revenueMeta}>
                    {revenue ? fmtCurrency(revenue.mrr) : '—'}
                  </MetricValue>
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-sm text-muted-foreground">
                    ARR <span className="font-semibold text-foreground">
                      <MetricValue meta={revenueMeta}>{revenue ? fmtCurrency(revenue.arr) : '—'}</MetricValue>
                    </span>
                  </div>
                  {revenue?.breakdown && !shouldHideMetric(revenueMeta) && (
                    <div className="text-sm text-muted-foreground">
                      {revenue.breakdown.paying_tenants} pagante{revenue.breakdown.paying_tenants !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>


      {/* ─── Secondary Metrics Row ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniMetric
          label="Tenants Ativos"
          value={overview ? String(overview.tenants.active) : '—'}
          sub={overview ? `de ${overview.tenants.total} total` : undefined}
          icon={Building2}
          loading={isLoading}
        />
        <MiniMetric
          label="Trials"
          value={overview ? String(overview.subscriptions.trial) : '—'}
          sub="conversão pendente"
          icon={Clock}
          loading={isLoading}
          warn={overview ? overview.subscriptions.trial > 3 : false}
        />
        <MiniMetric
          label="Leads"
          value={overview ? fmtNum(overview.usage.total_leads) : '—'}
          sub={overview?.recent_activity.new_leads_7d ? `+${fmtNum(overview.recent_activity.new_leads_7d)} (7d)` : 'sem dados CRM'}
          icon={Target}
          loading={isLoading}
        />
        <MiniMetric
          label="Novos Tenants (7d)"
          value={overview ? String(overview.recent_activity.new_tenants_7d) : '—'}
          icon={Zap}
          loading={isLoading}
        />
      </div>

      {/* ─── Atenção Necessária ───────────────────────────────────── */}
      {!systemOk && (
        <div className="mb-6 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Requer Atenção
          </h2>

          {opsAlerts.map(alert => (
            <AttentionItem
              key={alert.id}
              icon={ShieldAlert}
              severity={alert.severity as 'critical' | 'warning' | 'info'}
              title={alert.title}
              detail={alert.description}
              action={() => navigate('/operations')}
              actionLabel="Operações"
            />
          ))}

          {disconnectedWA.map((ch, i) => (
            <AttentionItem
              key={`wa-${i}`}
              icon={WifiOff}
              severity="warning"
              title={`WhatsApp offline: ${(ch.tenant_name as string) || 'Sem nome'}`}
              detail={ch.last_heartbeat ? `Último heartbeat ${formatDistanceToNow(new Date(ch.last_heartbeat as string), { addSuffix: true, locale: ptBR })}` : 'Sem heartbeat'}
              action={ch.tenant_id ? () => navigate(`/tenants/${ch.tenant_id}`) : undefined}
              actionLabel="Ver Tenant"
            />
          ))}

          {failedCrons.map((job, i) => (
            <AttentionItem
              key={`cron-${i}`}
              icon={Cpu}
              severity="error"
              title={`Cron falhando: ${job.name as string}`}
              detail={`${(job.consecutive_failures as number)} falhas consecutivas`}
              action={() => navigate('/operations')}
              actionLabel="Operações"
            />
          ))}
        </div>
      )}

      {/* ─── Chart + Revenue Details ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Evolução MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sem dados de série temporal</div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                    <XAxis dataKey="month" className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
                    <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`R$ ${fmtNum(value)}`, 'MRR']}
                    />
                    <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mrrGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Receita</span>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigate('/analytics')}>
                Detalhes <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : revenue ? (
              <>
                {/* Revenue streams */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MRR</span>
                    <span className="font-semibold">{fmtCurrency(revenue.mrr)}</span>
                  </div>
                  {revenue.credits_revenue !== undefined && revenue.credits_revenue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Créditos</span>
                      <span className="font-medium">{fmtCurrency(revenue.credits_revenue)}</span>
                    </div>
                  )}
                  {revenue.implementation_revenue !== undefined && revenue.implementation_revenue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Implantação</span>
                      <span className="font-medium">{fmtCurrency(revenue.implementation_revenue)}</span>
                    </div>
                  )}
                </div>

                {/* Plan distribution */}
                {overview && (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por Plano</p>
                    {[
                      { label: 'Enterprise', count: overview.tenants.enterprise },
                      { label: 'Pro', count: overview.tenants.pro },
                      { label: 'Basic', count: overview.tenants.basic },
                    ].filter(p => p.count > 0).map(p => (
                      <div key={p.label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{p.label}</span>
                        <span className="font-medium">{p.count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subscription breakdown */}
                {subscriptionBreakdown.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Status de Assinatura</p>
                    <div className="flex gap-3">
                      {subscriptionBreakdown.map(s => (
                        <div key={s.label} className="text-center">
                          <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Pulso Operacional ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Canais */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Canais
            </CardTitle>
            <Badge variant={disconnectedWA.length > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
              {connectedWA + metaChannels.filter(m => (m.status as string) === 'active').length}/{whatsappChannels.length + metaChannels.length} online
            </Badge>
          </CardHeader>
          <CardContent>
            {!snap ? (
              <p className="text-sm text-muted-foreground">Aguardando telemetria do CRM</p>
            ) : whatsappChannels.length === 0 && metaChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem canais configurados</p>
            ) : (
              <div className="space-y-1">
                {whatsappChannels.map((ch, i) => (
                  <div key={`wa-${i}`} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot ok={ch.status === 'connected'} />
                      <span className="text-sm truncate">{(ch.tenant_name as string) || 'Sem nome'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ch.status !== 'connected' && ch.last_heartbeat && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(ch.last_heartbeat as string), { locale: ptBR })}
                        </span>
                      )}
                      {ch.tenant_id && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`/tenants/${ch.tenant_id}`)}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {metaChannels.map((ch, i) => (
                  <div key={`meta-${i}`} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot ok={(ch.status as string) === 'active'} />
                      <span className="text-sm truncate">{(ch.tenant_name as string) || 'Sem nome'}</span>
                      <Badge variant="outline" className="text-[9px]">Meta</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pulso */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pulso Operacional
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigate('/operations')}>
              Centro de Ops <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {overview && (
                <>
                  <PulseRow label="Usuários ativos" value={fmtNum(overview.usage.total_users)} icon={Users} />
                  <PulseRow label="Mensagens enviadas" value={fmtNum(overview.usage.total_messages)} icon={Activity} />
                </>
              )}
              {conversations && (
                <>
                  <PulseRow label="Conversas ativas" value={fmtNum((conversations.active as number) ?? 0)} icon={Activity} />
                  <PulseRow label="Sem atendente" value={fmtNum((conversations.unassigned as number) ?? 0)} icon={Users} warn={((conversations.unassigned as number) ?? 0) > 100} />
                </>
              )}
              {cronJobs.length > 0 && (
                <PulseRow
                  label="Cron Jobs"
                  value={`${cronJobs.filter(j => j.last_success).length}/${cronJobs.length} ativos`}
                  icon={Cpu}
                  warn={failedCrons.length > 0}
                />
              )}
              {!snap && !overview && (
                <p className="text-sm text-muted-foreground py-2">Aguardando dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── System Status ───────────────────────────────────────── */}
      {systemOk && (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Sistema operacional — nenhuma ação necessária</span>
          </CardContent>
        </Card>
      )}

      {/* ─── Quick Navigation ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <QuickNav label="Tenants" icon={Building2} onClick={() => navigate('/tenants')} />
        <QuickNav label="Inteligência de Receita" icon={BarChart3} onClick={() => navigate('/analytics')} />
        <QuickNav label="Saúde dos Tenants" icon={Activity} onClick={() => navigate('/tenant-health')} />
        <QuickNav label="Diagnóstico IA" icon={Brain} onClick={() => navigate('/ai-diagnostics')} />
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniMetric({ label, value, sub, icon: Icon, loading, warn }: {
  label: string; value: string; sub?: string; icon: React.ElementType; loading?: boolean; warn?: boolean;
}) {
  if (loading) return <Card><CardContent className="p-3"><Skeleton className="h-3 w-16 mb-1.5" /><Skeleton className="h-6 w-20" /></CardContent></Card>;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className={cn('text-xl font-bold', warn && 'text-amber-600 dark:text-amber-400')}>{value}</p>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  );
}

function AttentionItem({ icon: Icon, severity, title, detail, action, actionLabel }: {
  icon: React.ElementType; severity: 'critical' | 'warning' | 'error' | 'info';
  title: string; detail: string; action?: () => void; actionLabel?: string;
}) {
  const colors = {
    critical: 'border-destructive/50 bg-destructive/5',
    error: 'border-destructive/50 bg-destructive/5',
    warning: 'border-amber-500/40 bg-amber-500/5',
    info: 'border-border bg-muted/30',
  };
  const iconColors = {
    critical: 'text-destructive', error: 'text-destructive',
    warning: 'text-amber-600 dark:text-amber-400', info: 'text-muted-foreground',
  };
  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 rounded-lg border', colors[severity])}>
      <Icon className={cn('h-4 w-4 shrink-0', iconColors[severity])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      {action && (
        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={action}>
          {actionLabel} <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      )}
    </div>
  );
}

function PulseRow({ label, value, icon: Icon, warn }: {
  label: string; value: string | number; icon: React.ElementType; warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-sm font-medium', warn && 'text-amber-600 dark:text-amber-400')}>{value}</span>
    </div>
  );
}

function QuickNav({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-4 flex flex-col items-start gap-1 justify-start text-left"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

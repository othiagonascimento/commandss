import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useAlerts, type AlertRecord } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Building2, DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle,
  Activity, Target, Wifi, WifiOff, ChevronRight, ShieldAlert, Users,
  CreditCard, CheckCircle2, Cpu, Brain, LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { overview, revenue, timeSeries, isLoading, error, refetch } = useMasterDashboard();
  const { snapshot, alerts: opsAlerts, alertCount } = useOpsHealth();

  const snap = (snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;
  const snapAt = (snapshot as Record<string, unknown>)?.created_at as string | undefined;
  const channels = snap?.channels as Record<string, unknown[]> | undefined;
  const whatsappChannels = (channels?.whatsapp ?? []) as Array<Record<string, unknown>>;
  const metaChannels = (channels?.meta ?? []) as Array<Record<string, unknown>>;
  const connectedWA = whatsappChannels.filter(w => w.status === 'connected').length;
  const disconnectedWA = whatsappChannels.filter(w => w.status !== 'connected');
  const cronJobs = ((snap?.cron_health as Record<string, unknown>)?.jobs ?? []) as Array<Record<string, unknown>>;
  const failedCrons = cronJobs.filter(j => ((j.consecutive_failures as number) ?? 0) >= 2);
  const conversations = snap?.conversations as Record<string, unknown> | undefined;

  const chartData = timeSeries?.data || [];
  const systemOk = alertCount === 0 && disconnectedWA.length === 0 && failedCrons.length === 0;

  return (
    <DashboardLayout>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {snapAt ? `Atualizado ${formatDistanceToNow(new Date(snapAt), { addSuffix: true, locale: ptBR })}` : 'Visão geral'}
          </p>
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

      {/* ─── Hero Metrics ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <HeroMetric
          label="MRR"
          value={revenue ? fmtCurrency(revenue.mrr) : '—'}
          trend={revenue?.growth_percentage}
          icon={DollarSign}
          loading={isLoading}
        />
        <HeroMetric
          label="Tenants Ativos"
          value={overview ? fmtNum(overview.tenants.active) : '—'}
          sub={overview ? `${overview.tenants.total} total` : undefined}
          icon={Building2}
          loading={isLoading}
        />
        <HeroMetric
          label="Leads (7d)"
          value={overview ? fmtNum(overview.recent_activity.new_leads_7d) : '—'}
          sub={overview ? `${fmtNum(overview.usage.total_leads)} total` : undefined}
          icon={Target}
          loading={isLoading}
        />
        <HeroMetric
          label="Assinaturas"
          value={overview ? fmtNum(overview.subscriptions.active) : '—'}
          sub={overview?.subscriptions.trial ? `${overview.subscriptions.trial} trial` : undefined}
          icon={CreditCard}
          loading={isLoading}
        />
      </div>

      {/* ─── Atenção Necessária ───────────────────────────────────────── */}
      {!systemOk && (
        <div className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Requer Atenção
          </h2>

          {/* Ops Alerts */}
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

          {/* Disconnected channels */}
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

          {/* Failed crons */}
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

      {/* ─── Receita + Gráfico ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Revenue summary - compact */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Receita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            ) : revenue ? (
              <>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">MRR</p>
                  <p className="text-3xl font-bold text-foreground">{fmtCurrency(revenue.mrr)}</p>
                  {revenue.growth_percentage !== undefined && (
                    <Badge variant="secondary" className={cn('mt-1 gap-1 text-xs', revenue.growth_percentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                      {revenue.growth_percentage >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {revenue.growth_percentage >= 0 ? '+' : ''}{revenue.growth_percentage}%
                    </Badge>
                  )}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ARR</span>
                    <span className="font-medium">{fmtCurrency(revenue.arr)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total acumulado</span>
                    <span className="font-medium">{fmtCurrency(revenue.total)}</span>
                  </div>
                </div>
                {overview && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Planos</p>
                    <div className="space-y-1">
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
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Chart - clean */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Evolução MRR</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
      </div>

      {/* ─── Pulso Operacional ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Canais */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Canais
            </CardTitle>
            <Badge variant={disconnectedWA.length > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
              {connectedWA + metaChannels.filter(m => (m.status as string) === 'active').length}/{whatsappChannels.length + metaChannels.length} online
            </Badge>
          </CardHeader>
          <CardContent>
            {!snap ? (
              <p className="text-sm text-muted-foreground">Aguardando dados</p>
            ) : whatsappChannels.length === 0 && metaChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem canais</p>
            ) : (
              <div className="space-y-1.5">
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

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pulso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview && (
                <>
                  <PulseRow label="Usuários totais" value={fmtNum(overview.usage.total_users)} icon={Users} />
                  <PulseRow label="Mensagens" value={fmtNum(overview.usage.total_messages)} icon={Activity} />
                  <PulseRow label="Novos tenants (7d)" value={fmtNum(overview.recent_activity.new_tenants_7d)} icon={Building2} />
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── System OK ───────────────────────────────────────────────── */}
      {systemOk && (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Sistema operacional — nenhuma ação necessária</span>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroMetric({ label, value, sub, trend, icon: Icon, loading }: {
  label: string; value: string; sub?: string; trend?: number; icon: React.ElementType; loading?: boolean;
}) {
  if (loading) return <Card><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-28" /></CardContent></Card>;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {trend !== undefined && (
            <Badge variant="secondary" className={cn('text-[10px] gap-0.5', trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
              {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {Math.abs(trend)}%
            </Badge>
          )}
          {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
        </div>
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
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border', colors[severity])}>
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

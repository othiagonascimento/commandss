import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowUpRight, Plus, Building2, Activity, BarChart3, Radio, Wifi, WifiOff, Cpu, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Surface, SectionHeader } from '@/components/ds/Surface';
import { MetricCard } from '@/components/ds/MetricCard';
import { AlertRow, StatusDot, TrendDelta, Tag } from '@/components/ds/Atoms';
import { EmptyState } from '@/components/ds/Feedback';
import { DataQualityBadge } from '@/components/quality/DataQualityBadge';
import { MetricValue } from '@/components/quality/MetricValue';
import { HomeBrazilMap } from '@/components/home/HomeBrazilMap';
import { PrivateValue } from '@/components/ds/PrivateValue';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Eye, EyeOff } from 'lucide-react';
import { AnimatedCounter } from '@/components/ds/AnimatedCounter';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

function fmtBRL(v: number, compact = false) {
  if (compact && v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}
function fmtNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR').format(v);
}

export default function Index() {
  const navigate = useNavigate();
  const {
    overview, revenue, timeSeries,
    overviewMeta, revenueMeta, timeSeriesMeta,
    isLoading, refetch,
  } = useMasterDashboard();
  const { snapshot, snapshotMeta, alerts: opsAlerts, alertCount } = useOpsHealth();

  const snap = snapshot?.snapshot_data as Record<string, any> | undefined;
  const snapAt = snapshot?.created_at;
  const stale = snapshotMeta?.freshness.status === 'stale';
  const missing = snapshotMeta?.freshness.status === 'missing' || !snap;
  const channels = snap?.channels as Record<string, any[]> | undefined;
  const wa = (channels?.whatsapp ?? []) as any[];
  const meta = (channels?.meta ?? []) as any[];
  const waOnline = wa.filter(w => w.status === 'connected').length;
  const waOffline = wa.filter(w => w.status !== 'connected');
  const cron = ((snap?.cron_health as any)?.jobs ?? []) as any[];
  const cronFails = cron.filter(j => (j.consecutive_failures ?? 0) >= 2);

  const systemTone: 'success' | 'warning' | 'error' =
    alertCount > 0 || cronFails.length > 0 ? 'error'
    : stale || missing || waOffline.length > 0 ? 'warning'
    : 'success';

  const series = timeSeries?.data || [];

  return (
    <DashboardLayout>
      {/* ─── 01 HERO EXECUTIVO + MAPA SOBERANO ─────────────────────── */}
      <section className="mb-10 sm:mb-14 animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-baseline gap-3">
            <span className="editorial-numeral">01 /</span>
            <span className="editorial-label">Visão Executiva</span>
            <span className="editorial-label text-ink-faint hidden sm:inline">·</span>
            <span className="editorial-label text-ink-faint hidden sm:inline">
              {snapAt ? formatDistanceToNow(new Date(snapAt), { addSuffix: true, locale: ptBR }) : 'sem snapshot'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DataQualityBadge meta={snapshotMeta} />
            <button onClick={refetch} disabled={isLoading} className="btn-ghost">
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} /> atualizar
            </button>
          </div>
        </div>

        {/* Banner único: hero (esquerda) + mapa (direita) no mesmo Surface */}
        <Surface variant="raised" crosshairs className="relative overflow-hidden glow-hover">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20"
            style={{ background: 'var(--brand-gradient)', filter: 'blur(80px)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-0 relative">
            {/* Coluna esquerda — narrativa executiva */}
            <div className="p-6 sm:p-8 flex flex-col justify-between min-w-0 lg:border-r lg:border-hairline">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-4">
                  <StatusDot tone={systemTone} />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
                    {systemTone === 'success' ? 'Operação saudável'
                     : systemTone === 'warning' ? 'Sinais de atenção'
                     : `${alertCount + cronFails.length + waOffline.length} incidentes ativos`}
                  </span>
                </div>
                <div className="editorial-label mb-2">MENSAGENS PROCESSADAS / 30D</div>
                <div className="font-display font-bold leading-[0.85] tracking-tighter text-brand-gradient"
                  style={{ fontSize: 'clamp(2.75rem, 7vw, 6rem)' }}>
                  <MetricValue meta={overviewMeta}>
                    {overview ? (
                      <AnimatedCounter
                        value={overview.usage.total_messages}
                        format={(n) => fmtNum(n)}
                      />
                    ) : '—'}
                  </MetricValue>
                </div>
                {overview && (
                  <div className="mt-4 flex items-center gap-4 flex-wrap font-mono text-xs text-ink-2 tabular">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-plasma" />
                      <span className="text-ink font-semibold">{fmtNum(overview.tenants.total)}</span> tenants
                    </span>
                    <span className="text-ink-faint">/</span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-plasma" />
                      <span className="text-ink font-semibold">{fmtNum(overview.usage.total_users)}</span> usuários
                    </span>
                    <span className="text-ink-faint">/</span>
                    <span className="flex items-center gap-1.5">
                      <Wifi className="h-3 w-3" />
                      <span className="text-ink font-semibold">{waOnline}</span> canais
                    </span>
                  </div>
                )}
              </div>

              {/* Inteligência Financeira — mesmo card, controlada pela privacidade */}
              <FinancialBlock revenue={revenue} revenueMeta={revenueMeta} series={series} trialsCount={overview?.subscriptions.trial ?? 0} />

              <div className="grid grid-cols-3 gap-3 mt-6 relative min-w-0">
                <MiniHero label="Tenants" value={overview ? fmtNum(overview.tenants.total) : '—'} sub={overview ? `${overview.recent_activity.new_tenants_7d} novos /7d` : ''} tone="plasma" big />
                <MiniHero label="Trials" value={overview ? String(overview.subscriptions.trial) : '—'} tone={overview && overview.subscriptions.trial > 3 ? 'ember' : 'default'} />
                <MiniHero label="Leads" value={overview ? fmtNum(overview.usage.total_leads) : '—'} />
              </div>
            </div>

            {/* Coluna direita — mapa integrado, sem card próprio */}
            <div className="relative min-w-0 flex flex-col">
              <div className="flex items-baseline justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-2 flex-wrap gap-2">
                <div className="editorial-label">/ CARTOGRAFIA OPERACIONAL</div>
                <div className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
                  distribuição nacional
                </div>
              </div>
              <div className="flex-1 min-h-[420px] lg:min-h-[520px]">
                <HomeBrazilMap bare />
              </div>
            </div>
          </div>
        </Surface>

      </section>

      {/* ─── 03 PULSO OPERACIONAL ────── */}
      <section className="mb-10 sm:mb-14">
        <div>
          <SectionHeader numeral="03 /" label="Pulso Operacional" title="Métricas-chave do período" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Mensagens" unit="30d"
              value={overview ? <MetricValue meta={overviewMeta}><AnimatedCounter value={overview.usage.total_messages} format={(n) => fmtNum(n)} /></MetricValue> : '—'}
              variant="standard"
              badge={<DataQualityBadge meta={overviewMeta} />}
              loading={isLoading && !overview}
            />
            <MetricCard
              label="Usuários" unit="total"
              value={overview ? <MetricValue meta={overviewMeta}><AnimatedCounter value={overview.usage.total_users} format={(n) => fmtNum(n)} /></MetricValue> : '—'}
              variant="standard"
              loading={isLoading && !overview}
            />
            <MetricCard
              label="Leads" unit="crm"
              value={overview ? fmtNum(overview.usage.total_leads) : '—'}
              sub={overview?.recent_activity.new_leads_7d ? <><span className="text-plasma">+{fmtNum(overview.recent_activity.new_leads_7d)}</span> em 7d</> : undefined}
              loading={isLoading && !overview}
            />
            <MetricCard
              label="Saúde Op." unit="canais"
              value={`${waOnline}/${wa.length + meta.length}`}
              tone={waOffline.length > 0 ? 'ember' : 'jade'}
              sub={waOffline.length > 0 ? `${waOffline.length} offline` : 'todos online'}
              loading={isLoading && !snap}
            />
          </div>

          {/* Radar de atenção compacto */}
          <div className="mt-5">
            <SectionHeader numeral="04 /" label="Radar de Atenção" title="Requer ação"
              actions={<button onClick={() => navigate('/operations')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1 transition-colors">centro de ops <ArrowUpRight className="h-3 w-3" /></button>}
            />
            <div className="space-y-2">
              {opsAlerts.length === 0 && waOffline.length === 0 && cronFails.length === 0 ? (
                <EmptyState numeral="00" title="Tudo em ordem"
                  description="Nenhum sinal crítico no momento." />
              ) : (
                <>
                  {opsAlerts.slice(0, 3).map(a => (
                    <AlertRow key={a.id} severity={(a.severity as any) || 'warning'}
                      title={a.title} detail={a.description} onClick={() => navigate('/operations')} />
                  ))}
                  {waOffline.slice(0, 2).map((c, i) => (
                    <AlertRow key={`wa-${i}`} severity="warning"
                      title={`WhatsApp offline: ${c.tenant_name || 'Sem nome'}`}
                      detail={c.last_heartbeat ? `Heartbeat ${formatDistanceToNow(new Date(c.last_heartbeat), { addSuffix: true, locale: ptBR })}` : 'sem heartbeat'}
                      meta={<Tag tone="ember">WA</Tag>}
                      onClick={c.tenant_id ? () => navigate(`/tenants/${c.tenant_id}`) : undefined} />
                  ))}
                  {cronFails.slice(0, 2).map((j, i) => (
                    <AlertRow key={`c-${i}`} severity="critical"
                      title={`Cron falhando: ${j.name}`}
                      detail={`${j.consecutive_failures} falhas consecutivas`}
                      meta={<Tag tone="coral">CRON</Tag>}
                      onClick={() => navigate('/operations')} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* (Receita removida — agora integrada no banner executivo) */}
      {/* ─── 06 + 07 IA + SAÚDE ────────────────────────────────────── */}
      <section className="mb-10 sm:mb-14 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <SectionHeader numeral="06 /" label="Motor de IA" title="Consumo & operação"
            actions={<button onClick={() => navigate('/ai-diagnostics')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1 transition-colors">diagnóstico <ArrowUpRight className="h-3 w-3" /></button>} />
          <Surface className="p-5">
            <div className="grid grid-cols-2 gap-5">
              <Stat label="Mensagens 30d" value={overview ? fmtNum(overview.usage.total_messages) : '—'} highlight />
              <Stat label="Média / tenant" value={overview && overview.tenants.total > 0 ? fmtNum(Math.round(overview.usage.total_messages / overview.tenants.total)) : '—'} />
            </div>
            <div className="hairline-t mt-4 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              fonte: master-analytics · {overviewMeta?.method ?? '—'}
            </div>
          </Surface>
        </div>
        <div>
          <SectionHeader numeral="07 /" label="Saúde da Operação" title="Canais & jobs"
            actions={<button onClick={() => navigate('/operations')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1 transition-colors">monitorar <ArrowUpRight className="h-3 w-3" /></button>} />
          <Surface className="p-5">
            <div className="space-y-2.5">
              <PulseRow icon={Wifi} label="WhatsApp online" value={`${waOnline}/${wa.length}`} tone={waOffline.length > 0 ? 'ember' : 'jade'} />
              <PulseRow icon={WifiOff} label="WhatsApp offline" value={String(waOffline.length)} tone={waOffline.length > 0 ? 'ember' : 'default'} />
              <PulseRow icon={Cpu} label="Cron jobs" value={`${cron.filter(j => j.last_success).length}/${cron.length}`} tone={cronFails.length > 0 ? 'coral' : 'default'} />
              <PulseRow icon={Radio} label="Alertas ativos" value={String(alertCount)} tone={alertCount > 0 ? 'coral' : 'jade'} />
            </div>
          </Surface>
        </div>
      </section>

      {/* ─── 08 AÇÕES RÁPIDAS ──────────────────────────────────────── */}
      <section className="mb-6">
        <SectionHeader numeral="08 /" label="Ações Rápidas" title="Atalhos do operador" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={Plus} label="Novo tenant" onClick={() => navigate('/tenants/new')} />
          <QuickAction icon={Building2} label="Tenants" onClick={() => navigate('/tenants')} />
          <QuickAction icon={Activity} label="Saúde" onClick={() => navigate('/tenant-health')} />
          <QuickAction icon={BarChart3} label="Receita" onClick={() => navigate('/analytics')} />
        </div>
      </section>
    </DashboardLayout>
  );
}

// ── helpers ─────────────────────────────────────────────────────────

function MiniHero({ label, value, sub, tone = 'default', big = false }: { label: string; value: string; sub?: string; tone?: 'default' | 'plasma' | 'ember'; big?: boolean }) {
  const t = tone === 'plasma' ? 'text-brand-gradient' : tone === 'ember' ? 'text-ember' : 'text-ink';
  return (
    <div className="hairline-l pl-3 min-w-0 transition-colors hover:border-brand-magenta/60">
      <div className="editorial-label truncate">{label}</div>
      <div className={cn('font-mono font-semibold tabular mt-1.5 truncate', big ? 'text-3xl' : 'text-2xl', t)}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1 truncate">{sub}</div>}
    </div>
  );
}

function FinancialBlock({ revenue, revenueMeta, series, trialsCount }: { revenue: any; revenueMeta: any; series: any[]; trialsCount: number }) {
  const { hidden, toggle } = usePrivacy();
  return (
    <div className="mt-6 pt-5 hairline-t">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <div className="flex items-baseline gap-2">
          <span className="editorial-label">/ INTELIGÊNCIA FINANCEIRA</span>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma transition-colors inline-flex items-center gap-1.5"
          aria-label={hidden ? 'Mostrar dados financeiros' : 'Ocultar dados financeiros'}
        >
          {hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {hidden ? 'mostrar' : 'ocultar'}
        </button>
      </div>

      {hidden ? (
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <div className="editorial-label mb-1">MRR</div>
            <div className="font-display font-bold tracking-tighter text-ink-3 leading-none select-none" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>••••••</div>
          </div>
          <div>
            <div className="editorial-label mb-1">ARR</div>
            <div className="font-mono font-semibold text-lg tabular text-ink-3 select-none">••••••</div>
          </div>
          <div>
            <div className="editorial-label mb-1">12M</div>
            <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider">série oculta</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-5 items-stretch">
          <div className="space-y-3 min-w-0">
            <div>
              <div className="editorial-label mb-1">MRR ATUAL</div>
              <div className="font-display font-bold tracking-tighter leading-none text-brand-gradient" style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.5rem)' }}>
                {revenue ? <MetricValue meta={revenueMeta}>{fmtBRL(revenue.mrr)}</MetricValue> : '—'}
              </div>
              {revenue?.growth_percentage !== undefined && (
                <div className="mt-1.5 flex items-center gap-2">
                  <TrendDelta value={revenue.growth_percentage} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">vs 30d</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 hairline-t pt-2.5">
              <div>
                <div className="editorial-label">ARR</div>
                <div className="font-mono font-semibold text-sm tabular text-ink mt-0.5 truncate">{revenue ? fmtBRL(revenue.arr, true) : '—'}</div>
              </div>
              <div>
                <div className="editorial-label">Pagantes</div>
                <div className="font-mono font-semibold text-sm tabular text-ink mt-0.5">{revenue?.breakdown?.paying_tenants ?? '—'}</div>
              </div>
              <div>
                <div className="editorial-label">Trials</div>
                <div className="font-mono font-semibold text-sm tabular text-ember mt-0.5">{trialsCount}</div>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="editorial-label">EVOLUÇÃO MRR · 12M</div>
              <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">{series.length}pt</span>
            </div>
            <div className="h-[120px]">
              {series.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-ink-3 font-mono">sem série</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGradHero" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--brand-magenta))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--brand-magenta))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mrrLineHero" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--brand-purple))" />
                        <stop offset="50%" stopColor="hsl(var(--brand-magenta))" />
                        <stop offset="100%" stopColor="hsl(var(--brand-azure))" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--ink-muted))" style={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis hide />
                    <RTooltip contentStyle={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--hairline-strong))', borderRadius: '6px', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      formatter={(v: number) => [fmtBRL(v), 'MRR']} />
                    <Area type="monotone" dataKey="mrr" stroke="url(#mrrLineHero)" strokeWidth={2} fill="url(#mrrGradHero)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="editorial-label">{label}</div>
      <div className={cn('font-mono font-semibold tabular mt-1', highlight ? 'text-3xl text-brand-gradient' : 'text-2xl text-ink')}>{value}</div>
    </div>
  );
}

function PulseRow({ icon: Icon, label, value, tone = 'default' }: { icon: any; label: string; value: string; tone?: 'default' | 'jade' | 'ember' | 'coral' }) {
  const t = tone === 'jade' ? 'text-jade' : tone === 'ember' ? 'text-ember' : tone === 'coral' ? 'text-coral' : 'text-ink';
  return (
    <div className="flex items-center justify-between py-2 hairline-b last:border-0 group transition-colors hover:bg-surface-2 -mx-2 px-2 rounded-sm">
      <div className="flex items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 text-ink-3 group-hover:text-plasma transition-colors" />
        <span className="text-sm text-ink-2">{label}</span>
      </div>
      <span className={cn('font-mono font-semibold tabular text-sm', t)}>{value}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group relative bg-surface-1 hairline border p-4 rounded-md text-left lift-hover overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-brand-gradient-soft" />
      <Icon className="h-4 w-4 text-ink-3 group-hover:text-plasma transition-colors relative" />
      <div className="mt-3 font-display text-sm font-medium text-ink relative">{label}</div>
      <ArrowUpRight className="absolute top-3 right-3 h-3 w-3 text-ink-faint group-hover:text-plasma group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </button>
  );
}

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
      {/* ─── 01 HERO EXECUTIVO ─────────────────────────────────────── */}
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

        {/* Hero principal: MENSAGENS dominantes (impacto visual + social proof) */}
        <Surface variant="raised" crosshairs className="relative overflow-hidden p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12 items-end glow-hover">
          {/* Glow gradient signature */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20"
            style={{ background: 'var(--brand-gradient)', filter: 'blur(80px)' }} />

          <div className="relative">
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
              style={{ fontSize: 'clamp(3.5rem, 11vw, 9rem)' }}>
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
              <div className="mt-4 flex items-center gap-5 flex-wrap font-mono text-xs text-ink-2 tabular">
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
                  <span className="text-ink font-semibold">{waOnline}</span> canais online
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 relative">
            <MiniHero label="Tenants" value={overview ? fmtNum(overview.tenants.total) : '—'} sub={overview ? `${overview.recent_activity.new_tenants_7d} novos /7d` : ''} tone="plasma" big />
            <MiniHero label="Trials" value={overview ? String(overview.subscriptions.trial) : '—'} tone={overview && overview.subscriptions.trial > 3 ? 'ember' : 'default'} />
            <MiniHero label="Leads" value={overview ? fmtNum(overview.usage.total_leads) : '—'} />
          </div>
        </Surface>
      </section>

      {/* ─── 02 PULSO + MAPA (lado a lado, mapa fixo permanente) ────── */}
      <section className="mb-10 sm:mb-14 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        <div>
          <SectionHeader numeral="02 /" label="Distribuição Nacional" title="Cartografia operacional" />
          <HomeBrazilMap />
        </div>
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

      {/* ─── 05 RECEITA (financeiro com olho) ───────────────────────── */}
      <section className="mb-10 sm:mb-14">
        <SectionHeader numeral="05 /" label="Receita & Crescimento" title="Inteligência financeira"
          actions={<button onClick={() => navigate('/analytics')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1 transition-colors">inteligência completa <ArrowUpRight className="h-3 w-3" /></button>}
        />
        <Surface className="p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10"
            style={{ background: 'var(--brand-gradient)', filter: 'blur(60px)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 relative">
            {/* MRR/ARR financeiros — ocultáveis */}
            <div className="space-y-4 lg:border-r lg:border-hairline lg:pr-6">
              <div>
                <div className="editorial-label mb-1.5">MRR ATUAL</div>
                <div className="font-display font-bold tracking-tighter text-ink leading-none" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                  <PrivateValue mask="••••••" showToggle>
                    <span className="text-brand-gradient">
                      {revenue ? <MetricValue meta={revenueMeta}>{fmtBRL(revenue.mrr)}</MetricValue> : '—'}
                    </span>
                  </PrivateValue>
                </div>
                {revenue?.growth_percentage !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <TrendDelta value={revenue.growth_percentage} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">vs 30d</span>
                  </div>
                )}
              </div>
              <div className="hairline-t pt-3">
                <div className="editorial-label mb-1">ARR PROJETADO</div>
                <div className="font-mono font-semibold text-xl tabular text-ink">
                  <PrivateValue mask="••••••">
                    {revenue ? fmtBRL(revenue.arr) : '—'}
                  </PrivateValue>
                </div>
              </div>
              {revenue?.breakdown && (
                <div className="hairline-t pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="editorial-label">Pagantes</div>
                    <div className="font-mono font-semibold text-base tabular text-ink mt-0.5">{revenue.breakdown.paying_tenants}</div>
                  </div>
                  <div>
                    <div className="editorial-label">Trials</div>
                    <div className="font-mono font-semibold text-base tabular text-ember mt-0.5">{overview?.subscriptions.trial ?? 0}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico evolução */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="editorial-label">EVOLUÇÃO MRR · 12 MESES</div>
                <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">{series.length} pontos</span>
              </div>
              <div className="h-[240px]">
                {series.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-ink-3 font-mono">sem série temporal</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--brand-magenta))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--brand-magenta))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mrrLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--brand-purple))" />
                          <stop offset="50%" stopColor="hsl(var(--brand-magenta))" />
                          <stop offset="100%" stopColor="hsl(var(--brand-azure))" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--hairline))" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--ink-muted))" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--ink-muted))" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => fmtBRL(v, true)} />
                      <RTooltip contentStyle={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--hairline-strong))', borderRadius: '6px', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                        formatter={(v: number) => [fmtBRL(v), 'MRR']} />
                      <Area type="monotone" dataKey="mrr" stroke="url(#mrrLine)" strokeWidth={2} fill="url(#mrrGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </Surface>
      </section>

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
    <div className="hairline-l pl-3 transition-all hover:pl-4 hover:border-brand-magenta/50">
      <div className="editorial-label">{label}</div>
      <div className={cn('font-mono font-semibold tabular mt-1.5', big ? 'text-3xl' : 'text-2xl', t)}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1">{sub}</div>}
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

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, ArrowUpRight, Plus, Building2, Activity, Brain, BarChart3, Radio, Wifi, WifiOff, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Surface, SectionHeader } from '@/components/ds/Surface';
import { MetricCard } from '@/components/ds/MetricCard';
import { AlertRow, StatusDot, TrendDelta, Tag } from '@/components/ds/Atoms';
import { EmptyState } from '@/components/ds/Feedback';
import { DataQualityBadge } from '@/components/quality/DataQualityBadge';
import { MetricValue } from '@/components/quality/MetricValue';
import { HomeBrazilMap } from '@/components/home/HomeBrazilMap';
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
      {/* ─── 01 HERO ────────────────────────────────────────────────── */}
      <section className="mb-8 sm:mb-12 animate-rise">
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
            <button onClick={refetch} disabled={isLoading}
              className="h-8 px-3 hairline border bg-surface-1 hover:border-plasma/40 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-2 hover:text-ink rounded-sm">
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} /> atualizar
            </button>
          </div>
        </div>

        <Surface variant="raised" crosshairs className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-end">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <StatusDot tone={systemTone} />
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
                {systemTone === 'success' ? 'Operação saudável'
                 : systemTone === 'warning' ? 'Sinais de atenção'
                 : `${alertCount + cronFails.length + waOffline.length} incidentes ativos`}
              </span>
            </div>
            <div className="editorial-label mb-2">RECEITA RECORRENTE / MRR</div>
            <div className="font-display font-bold text-ink leading-[0.9] tracking-tighter"
              style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}>
              <MetricValue meta={revenueMeta}>
                {revenue ? <span className="text-plasma">{fmtBRL(revenue.mrr, false)}</span> : '—'}
              </MetricValue>
            </div>
            {revenue && (
              <div className="mt-3 flex items-center gap-4 flex-wrap font-mono text-xs text-ink-2 tabular">
                <span>ARR <span className="text-ink">{fmtBRL(revenue.arr)}</span></span>
                {revenue.growth_percentage !== undefined && (
                  <span>30D <TrendDelta value={revenue.growth_percentage} /></span>
                )}
                {revenue.breakdown && (
                  <span>{revenue.breakdown.paying_tenants} pagantes</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniHero label="Tenants ativos" value={overview ? String(overview.tenants.active) : '—'} sub={overview ? `de ${overview.tenants.total}` : ''} />
            <MiniHero label="Trials" value={overview ? String(overview.subscriptions.trial) : '—'} tone={overview && overview.subscriptions.trial > 3 ? 'ember' : 'default'} />
            <MiniHero label="Novos 7d" value={overview ? String(overview.recent_activity.new_tenants_7d) : '—'} tone="plasma" />
          </div>
        </Surface>
      </section>

      {/* ─── 02 PULSO ───────────────────────────────────────────────── */}
      <section className="mb-8 sm:mb-12">
        <SectionHeader numeral="02 /" label="Pulso Operacional" title="Métricas-chave do período" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Usuários" unit="total"
            value={overview ? <MetricValue meta={overviewMeta}>{fmtNum(overview.usage.total_users)}</MetricValue> : '—'}
            badge={<DataQualityBadge meta={overviewMeta} />}
            loading={isLoading && !overview}
          />
          <MetricCard
            label="Mensagens" unit="30d"
            value={overview ? <MetricValue meta={overviewMeta}>{fmtNum(overview.usage.total_messages)}</MetricValue> : '—'}
            sub={missing ? 'sem leitura' : `${waOnline} canal${waOnline !== 1 ? 'is' : ''} online`}
            loading={isLoading && !overview}
          />
          <MetricCard
            label="Leads" unit="crm"
            value={overview ? fmtNum(overview.usage.total_leads) : '—'}
            sub={overview?.recent_activity.new_leads_7d ? `+${fmtNum(overview.recent_activity.new_leads_7d)} (7d)` : undefined}
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
      </section>

      {/* ─── 03 + 04 MAPA + RADAR ──────────────────────────────────── */}
      <section className="mb-8 sm:mb-12 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div>
          <SectionHeader numeral="03 /" label="Distribuição Nacional" title="Onde estão os tenants" />
          <HomeBrazilMap />
        </div>
        <div>
          <SectionHeader numeral="04 /" label="Radar de Atenção"
            title="Requer ação"
            actions={<button onClick={() => navigate('/operations')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1">centro de ops <ArrowUpRight className="h-3 w-3" /></button>}
          />
          <div className="space-y-2">
            {opsAlerts.length === 0 && waOffline.length === 0 && cronFails.length === 0 ? (
              <EmptyState numeral="00" title="Tudo em ordem"
                description="Nenhum sinal crítico no momento. O sistema seguirá monitorando." />
            ) : (
              <>
                {opsAlerts.slice(0, 6).map(a => (
                  <AlertRow key={a.id}
                    severity={(a.severity as any) || 'warning'}
                    title={a.title}
                    detail={a.description}
                    onClick={() => navigate('/operations')} />
                ))}
                {waOffline.slice(0, 3).map((c, i) => (
                  <AlertRow key={`wa-${i}`} severity="warning"
                    title={`WhatsApp offline: ${c.tenant_name || 'Sem nome'}`}
                    detail={c.last_heartbeat ? `Heartbeat ${formatDistanceToNow(new Date(c.last_heartbeat), { addSuffix: true, locale: ptBR })}` : 'sem heartbeat'}
                    meta={<Tag tone="ember">WA</Tag>}
                    onClick={c.tenant_id ? () => navigate(`/tenants/${c.tenant_id}`) : undefined} />
                ))}
                {cronFails.slice(0, 3).map((j, i) => (
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
      </section>

      {/* ─── 05 RECEITA & CRESCIMENTO ──────────────────────────────── */}
      <section className="mb-8 sm:mb-12">
        <SectionHeader numeral="05 /" label="Receita & Crescimento"
          title="Evolução do MRR"
          actions={<button onClick={() => navigate('/analytics')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1">inteligência completa <ArrowUpRight className="h-3 w-3" /></button>}
        />
        <Surface className="p-5">
          <div className="h-[280px]">
            {series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-ink-3 font-mono">sem série temporal</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--plasma))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--plasma))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--hairline))" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--ink-muted))" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--ink-muted))" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => fmtBRL(v, true)} />
                  <RTooltip contentStyle={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--hairline-strong))', borderRadius: '4px', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    formatter={(v: number) => [fmtBRL(v), 'MRR']} />
                  <Area type="monotone" dataKey="mrr" stroke="hsl(var(--plasma))" strokeWidth={1.5} fill="url(#mrrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Surface>
      </section>

      {/* ─── 06 + 07 IA + SAÚDE ────────────────────────────────────── */}
      <section className="mb-8 sm:mb-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <SectionHeader numeral="06 /" label="Motor de IA" title="Consumo & operação"
            actions={<button onClick={() => navigate('/ai-diagnostics')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1">diagnóstico <ArrowUpRight className="h-3 w-3" /></button>} />
          <Surface className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Mensagens" value={overview ? fmtNum(overview.usage.total_messages) : '—'} />
              <Stat label="Tenants ativos" value={overview ? String(overview.tenants.active) : '—'} />
              <Stat label="Trials" value={overview ? String(overview.subscriptions.trial) : '—'} />
              <Stat label="Conversões 7d" value={overview ? String(overview.recent_activity.new_tenants_7d) : '—'} />
            </div>
            <div className="hairline-t mt-4 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              fonte: master-analytics · {overviewMeta?.method ?? '—'}
            </div>
          </Surface>
        </div>
        <div>
          <SectionHeader numeral="07 /" label="Saúde da Operação" title="Canais & jobs"
            actions={<button onClick={() => navigate('/operations')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma inline-flex items-center gap-1">monitorar <ArrowUpRight className="h-3 w-3" /></button>} />
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

function MiniHero({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'plasma' | 'ember' }) {
  const t = tone === 'plasma' ? 'text-plasma' : tone === 'ember' ? 'text-ember' : 'text-ink';
  return (
    <div className="hairline-l pl-3">
      <div className="editorial-label">{label}</div>
      <div className={cn('font-mono font-semibold tabular text-2xl mt-1.5', t)}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1">{sub}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="editorial-label">{label}</div>
      <div className="font-mono font-semibold tabular text-2xl text-ink mt-1">{value}</div>
    </div>
  );
}

function PulseRow({ icon: Icon, label, value, tone = 'default' }: { icon: any; label: string; value: string; tone?: 'default' | 'jade' | 'ember' | 'coral' }) {
  const t = tone === 'jade' ? 'text-jade' : tone === 'ember' ? 'text-ember' : tone === 'coral' ? 'text-coral' : 'text-ink';
  return (
    <div className="flex items-center justify-between py-1.5 hairline-b last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-sm text-ink-2">{label}</span>
      </div>
      <span className={cn('font-mono font-semibold tabular text-sm', t)}>{value}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group relative bg-surface-1 hairline border p-4 rounded-sm text-left lift-hover">
      <Icon className="h-4 w-4 text-ink-3 group-hover:text-plasma transition-colors" />
      <div className="mt-3 font-display text-sm font-medium text-ink">{label}</div>
      <ArrowUpRight className="absolute top-3 right-3 h-3 w-3 text-ink-faint group-hover:text-plasma transition-colors" />
    </button>
  );
}

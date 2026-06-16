import { Card } from '@/components/ui/card';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { KPICard } from '@/components/finops/KPICard';
import { HealthFooter } from '@/components/finops/HealthFooter';
import { EmptyFinOpsState } from '@/components/finops/EmptyFinOpsState';
import { useFinOpsOverview } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { brl, num, pct, compactNum } from '@/lib/finops/format';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/finops/RiskBadge';
import { CostDecompositionCard } from '@/components/finops/CostDecompositionCard';
import { ProfitInsightsCard } from '@/components/finops/ProfitInsightsCard';
import { ProfitProjectionCard } from '@/components/finops/ProfitProjectionCard';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function FinOpsOverviewPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading, error } = useFinOpsOverview(filters);

  return (
    <FinOpsShell
      title="Command Center"
      description="Visão executiva da economia da plataforma. Custo real é privado e nunca exposto a tenants."
    >
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Falha ao carregar telemetria</p>
            <p className="text-muted-foreground">{(error as Error).message}</p>
          </div>
        </Card>
      )}

      {isLoading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {data?.data_health?.api_usage_logs_empty && <EmptyFinOpsState />}

      {data && (
        <>
          {/* Hero KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <KPICard label="Receita estimada" data={data.revenue_brl} format={brl} accent="success" hint="MRR/contratos do período (estimativa)." />
            <KPICard label="Custo total" data={data.cost_total_brl} format={brl} accent="destructive" invertDelta hint="Soma de IA + mídia + infra rateada." />
            <KPICard label="Margem BRL" data={data.margin_brl} format={brl} accent="primary" />
            <KPICard label="Margem %" data={data.margin_pct} format={(v) => pct(v, 1)} accent="primary" />
            <KPICard label="Custo / mensagem" data={data.cost_per_message} format={brl} invertDelta accent="warning" />
            <KPICard label="Custo / usuário ativo" data={data.cost_per_active_user} format={brl} invertDelta accent="warning" />
          </div>

          {/* Mid row: breakdown + timeseries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="p-4 lg:col-span-1">
              <h3 className="text-sm font-semibold mb-3">Decomposição de custo</h3>
              {data.cost_breakdown?.length ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={data.cost_breakdown}
                          dataKey="amount_brl"
                          nameKey="category"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={2}
                        >
                          {data.cost_breakdown.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => brl(v)}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {data.cost_breakdown.map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="capitalize">{c.category}</span>
                        </span>
                        <span className="tabular-nums">
                          {brl(c.amount_brl)} <span className="text-muted-foreground">({pct(c.pct)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de decomposição.</p>
              )}
            </Card>

            <Card className="p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-3">Custo vs Receita ao longo do tempo</h3>
              {data.timeseries?.length ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={data.timeseries}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => compactNum(v)} />
                      <Tooltip
                        formatter={(v: number) => brl(v)}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="revenue" stackId="r" stroke="hsl(var(--success))" fill="url(#rev)" name="Receita" />
                      <Area type="monotone" dataKey="cost_ai" stackId="c" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.5} name="Custo IA" />
                      <Area type="monotone" dataKey="cost_media" stackId="c" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.5} name="Custo Mídia" />
                      <Area type="monotone" dataKey="cost_infra" stackId="c" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.5} name="Infra" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem série temporal disponível.</p>
              )}
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Top tenants deficitários</h3>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                  <Link to="/finops/tenants?filter=loss">Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-2">
                {(data.top_loss_tenants ?? []).slice(0, 5).map((t) => (
                  <Link
                    key={t.tenant_id}
                    to={`/finops/tenants?focus=${t.tenant_id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.tenant_name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Custo: {brl(t.cost_total_brl)} · Receita: {brl(t.revenue_brl)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-destructive font-semibold tabular-nums">{brl(t.margin_brl)}</div>
                      <RiskBadge level={t.risk} />
                    </div>
                  </Link>
                ))}
                {!data.top_loss_tenants?.length && <p className="text-xs text-muted-foreground">Nenhum tenant deficitário identificado.</p>}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Top modelos por custo</h3>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                  <Link to="/finops/ai">Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-2">
                {(data.top_cost_models ?? []).slice(0, 5).map((m, i) => (
                  <div key={`${m.provider}-${m.model}-${i}`} className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium font-mono text-xs">{m.model}</p>
                      <p className="text-xs text-muted-foreground">{m.provider} · {num(m.calls)} chamadas</p>
                    </div>
                    <div className="font-semibold tabular-nums ml-3">{brl(m.cost_brl)}</div>
                  </div>
                ))}
                {!data.top_cost_models?.length && <p className="text-xs text-muted-foreground">Sem dados de modelos.</p>}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Anomalias recentes</h3>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                  <Link to="/finops/anomalies">Inbox <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-2">
                {(data.recent_anomalies ?? []).slice(0, 5).map((a) => (
                  <Link key={a.id} to="/finops/anomalies" className="block p-2 rounded hover:bg-muted text-sm">
                    <div className="flex items-start gap-2">
                      <RiskBadge level={a.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {!data.recent_anomalies?.length && <p className="text-xs text-muted-foreground">Nenhuma anomalia recente.</p>}
              </div>
            </Card>
          </div>

          <HealthFooter health={data.data_health} />
        </>
      )}
    </FinOpsShell>
  );
}

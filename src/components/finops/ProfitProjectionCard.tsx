import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { brl, pct, num } from '@/lib/finops/format';
import { TrendingUp, Users, Calculator } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { FinOpsOverview } from '@/types/finops';

interface Props {
  data: FinOpsOverview;
}

export function ProfitProjectionCard({ data }: Props) {
  const baseline = useMemo(() => deriveBaseline(data), [data]);
  const [mode, setMode] = useState<'pct' | 'abs'>('abs');
  const [growthPct, setGrowthPct] = useState(100);
  const [targetUsers, setTargetUsers] = useState<number>(() => {
    const base = data.cost_per_active_user?.value && data.cost_total_brl?.value
      ? Math.max(1, Math.round((data.cost_total_brl.value / data.cost_per_active_user.value)))
      : 100;
    return Math.max(base * 2, 500);
  });

  if (!baseline) {
    return (
      <Card id="projection" className="p-4">
        <h3 className="text-sm font-semibold mb-1">Projeção de lucro por crescimento</h3>
        <p className="text-xs text-muted-foreground">
          Aguardando dados base (receita, custo e usuários ativos) para projetar cenários.
        </p>
      </Card>
    );
  }

  const { activeUsers, arpu, variablePerUser, fixedCost } = baseline;
  const projUsers = mode === 'pct'
    ? Math.round(activeUsers * (1 + growthPct / 100))
    : Math.max(0, Math.round(targetUsers));
  const effectiveGrowthPct = activeUsers > 0 ? ((projUsers - activeUsers) / activeUsers) * 100 : 0;
  const projRevenue = projUsers * arpu;
  const projVariable = projUsers * variablePerUser;
  const projCost = projVariable + fixedCost;
  const projMargin = projRevenue - projCost;
  const projMarginPct = projRevenue > 0 ? (projMargin / projRevenue) * 100 : 0;

  const breakEvenUsers = arpu > variablePerUser ? Math.ceil(fixedCost / (arpu - variablePerUser)) : null;

  // Build scenarios curve: extend to cover launch-scale projections
  const maxUsers = Math.max(activeUsers * 10, (breakEvenUsers ?? 0) * 1.5, projUsers * 1.2, 1000);
  const steps = 30;
  const curve = Array.from({ length: steps + 1 }, (_, i) => {
    const u = Math.round((maxUsers * i) / steps);
    const rev = u * arpu;
    const cost = u * variablePerUser + fixedCost;
    return {
      users: u,
      revenue: Math.round(rev),
      cost: Math.round(cost),
      margin: Math.round(rev - cost),
    };
  });

  const scenarios = [
    { label: 'Conservador', users: Math.max(activeUsers * 2, 100) },
    { label: 'Lançamento', users: Math.max(activeUsers * 5, 500) },
    { label: 'Escala', users: Math.max(activeUsers * 10, 1000) },
    { label: 'Hipercrescimento', users: Math.max(activeUsers * 25, 5000) },
  ].map((s) => {
    const u = Math.round(s.users);
    const rev = u * arpu;
    const cost = u * variablePerUser + fixedCost;
    const margin = rev - cost;
    const growth = activeUsers > 0 ? ((u - activeUsers) / activeUsers) * 100 : 0;
    return { ...s, users: u, growth, revenue: rev, cost, margin, marginPct: rev > 0 ? (margin / rev) * 100 : 0 };
  });

  return (
    <Card id="projection" className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-md grid place-items-center bg-primary/10 text-primary">
            <Calculator className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Projeção de lucro por crescimento de usuários</h3>
            <p className="text-[11px] text-muted-foreground">
              Base: {num(activeUsers)} usuários · ARPU {brl(arpu)} · custo variável {brl(variablePerUser)}/user · fixo {brl(fixedCost)}/período
            </p>
          </div>
        </div>
        {breakEvenUsers && (
          <Badge variant="outline" className="text-[10px]">
            Break-even: {num(breakEvenUsers)} users
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Simulator */}
        <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Users className="h-3.5 w-3.5 text-primary" />
              Simulador interativo
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode('abs')}
                className={`text-[10px] px-2 py-0.5 rounded border ${mode === 'abs' ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/60 text-muted-foreground hover:bg-muted'}`}
              >
                Nº usuários
              </button>
              <button
                onClick={() => setMode('pct')}
                className={`text-[10px] px-2 py-0.5 rounded border ${mode === 'pct' ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/60 text-muted-foreground hover:bg-muted'}`}
              >
                % crescimento
              </button>
            </div>
          </div>

          {mode === 'pct' ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Crescimento sobre base</span>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                  {growthPct >= 0 ? '+' : ''}{num(growthPct)}%
                </Badge>
              </div>
              <Slider
                value={[growthPct]}
                min={-50}
                max={5000}
                step={10}
                onValueChange={(v) => setGrowthPct(v[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>-50%</span><span>+1.000%</span><span>+5.000%</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Usuários ativos no cenário</span>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] tabular-nums">
                  {num(projUsers)}
                </Badge>
              </div>
              <Slider
                value={[Math.min(targetUsers, Math.max(activeUsers * 50, 10000))]}
                min={0}
                max={Math.max(activeUsers * 50, 10000)}
                step={Math.max(1, Math.round(Math.max(activeUsers * 50, 10000) / 200))}
                onValueChange={(v) => setTargetUsers(v[0])}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex justify-between flex-1 text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>{num(Math.round(Math.max(activeUsers * 50, 10000) / 2))}</span>
                  <span>{num(Math.max(activeUsers * 50, 10000))}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 text-right text-xs px-2 py-1 rounded border border-border/60 bg-background/60 tabular-nums"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <MiniMetric
              label="Usuários projetados"
              value={num(projUsers)}
              delta={`${projUsers - activeUsers >= 0 ? '+' : ''}${num(projUsers - activeUsers)} (${effectiveGrowthPct >= 0 ? '+' : ''}${num(effectiveGrowthPct, 0)}%)`}
            />
            <MiniMetric label="Receita" value={brl(projRevenue)} tone="success" />
            <MiniMetric label="Custo total" value={brl(projCost)} sub={`var ${brl(projVariable)} + fixo ${brl(fixedCost)}`} />
            <MiniMetric
              label="Margem"
              value={brl(projMargin)}
              sub={pct(projMarginPct, 1)}
              tone={projMargin >= 0 ? 'success' : 'destructive'}
            />
          </div>
        </div>

        {/* Scenarios */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Cenários de referência
          </div>
          <div className="space-y-1.5">
            {scenarios.map((s) => (
              <button
                key={s.label}
                onClick={() => { setMode('abs'); setTargetUsers(s.users); }}
                className="w-full flex items-center justify-between rounded-md border border-border/60 hover:border-primary/40 hover:bg-muted/40 p-2 text-left text-xs transition-colors"
              >
                <div>
                  <div className="font-medium">{s.label} <span className="text-muted-foreground">({num(s.users)} users · +{num(s.growth, 0)}%)</span></div>
                  <div className="text-[10px] text-muted-foreground">receita {brl(s.revenue)} · custo {brl(s.cost)}</div>
                </div>
                <div className="text-right tabular-nums">
                  <div className={s.margin >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                    {brl(s.margin)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{pct(s.marginPct, 1)} margem</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Curve */}
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={curve}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="users"
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => num(v)}
              label={{ value: 'Usuários ativos', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => brl(v).replace('R$', '').trim()}
            />
            <Tooltip
              formatter={(v: number, name) => [brl(v), name]}
              labelFormatter={(v) => `${num(v as number)} usuários`}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x={activeUsers} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: 'Hoje', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            {breakEvenUsers && (
              <ReferenceLine x={breakEvenUsers} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: 'Break-even', fontSize: 10, fill: 'hsl(var(--warning))' }} />
            )}
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Receita" />
            <Line type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Custo" />
            <Line type="monotone" dataKey="margin" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Margem" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Modelo linear: assume ARPU e custo variável por usuário constantes, custos fixos invariáveis. Não considera economias de escala em IA, churn ou upsell.
      </p>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  sub,
  delta,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  tone?: 'success' | 'destructive';
}) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'destructive' ? 'text-destructive' : '';
  return (
    <div className="rounded-md bg-background/60 border border-border/60 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {(sub || delta) && (
        <div className="text-[10px] text-muted-foreground">
          {delta && <span className="mr-1">{delta}</span>}
          {sub}
        </div>
      )}
    </div>
  );
}

function deriveBaseline(data: FinOpsOverview) {
  const revenue = data.revenue_brl?.value ?? 0;
  const cost = data.cost_total_brl?.value ?? 0;
  const cpu = data.cost_per_active_user?.value ?? 0;
  const ai = data.cost_ai_brl?.value ?? 0;
  const media = data.cost_media_brl?.value ?? 0;
  const infra = data.cost_infra_brl?.value ?? 0;

  // active users derivable from cost_total / cost_per_active_user
  const activeUsers = cpu > 0 ? Math.round(cost / cpu) : 0;
  if (activeUsers <= 0 || revenue <= 0) return null;

  const arpu = revenue / activeUsers;
  const variableTotal = ai + media;
  const variablePerUser = variableTotal / activeUsers;
  const fixedCost = infra;

  return { activeUsers, arpu, variablePerUser, fixedCost };
}

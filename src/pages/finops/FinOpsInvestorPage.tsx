import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { useFinOpsInvestor } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { brl, num, pct } from '@/lib/finops/format';
import { Printer } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { RiskBadge } from '@/components/finops/RiskBadge';

export default function FinOpsInvestorPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading } = useFinOpsInvestor(filters);

  return (
    <FinOpsShell
      title="Investor View"
      description="Sumário executivo do mês. Pronto para apresentação."
      actions={
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> Exportar PDF
        </Button>
      }
    >
      {isLoading && <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>}

      {data && (
        <div className="space-y-4 print:space-y-3">
          {/* Big KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-5">
              <div className="text-[10px] uppercase text-muted-foreground">Receita</div>
              <div className="text-3xl font-bold tabular-nums text-success">{brl(data.revenue_brl)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-[10px] uppercase text-muted-foreground">Custo total</div>
              <div className="text-3xl font-bold tabular-nums text-destructive">
                {brl((data.variable_cost_brl || 0) + (data.fixed_cost_brl || 0))}
              </div>
              <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                Variável {brl(data.variable_cost_brl)} · Fixo {brl(data.fixed_cost_brl)}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-[10px] uppercase text-muted-foreground">Margem</div>
              <div className={`text-3xl font-bold tabular-nums ${data.margin_brl < 0 ? 'text-destructive' : 'text-success'}`}>
                {brl(data.margin_brl)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{pct(data.margin_pct)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-[10px] uppercase text-muted-foreground">Tenants ativos</div>
              <div className="text-3xl font-bold tabular-nums">{num(data.active_tenants)}</div>
              <div className="text-xs text-muted-foreground mt-1 tabular-nums">{num(data.active_users)} usuários · {num(data.messages)} mensagens</div>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="p-4 lg:col-span-1">
              <div className="text-[10px] uppercase text-muted-foreground">Custo / mensagem</div>
              <div className="text-xl font-bold tabular-nums">{brl(data.cost_per_message, { maximumFractionDigits: 4 })}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">Custo / tenant</div>
              <div className="text-xl font-bold tabular-nums">{brl(data.cost_per_tenant)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">Custo / usuário</div>
              <div className="text-xl font-bold tabular-nums">{brl(data.cost_per_user)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">% IA do custo</div>
              <div className="text-xl font-bold tabular-nums">{pct(data.ai_pct_of_cost)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">% Infra do custo</div>
              <div className="text-xl font-bold tabular-nums">{pct(data.infra_pct_of_cost)}</div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Margem ao longo do tempo</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={data.margin_timeline ?? []}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(v: number, name) => name === 'margin_pct' ? pct(v) : brl(v)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="margin_brl" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Margem BRL" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Cost stack ao longo do tempo</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={data.cost_stack_timeline ?? []}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ai" stackId="c" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="media" stackId="c" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="infra" stackId="c" fill="hsl(var(--chart-4))" />
                    <Bar dataKey="other" stackId="c" fill="hsl(var(--chart-5))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Risks & opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Principais riscos</h3>
              <div className="space-y-2">
                {(data.risks ?? []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded border bg-destructive/5">
                    <RiskBadge level={r.severity} />
                    <div className="text-sm">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                  </div>
                ))}
                {!data.risks?.length && <p className="text-xs text-muted-foreground">Sem riscos críticos identificados.</p>}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Principais oportunidades</h3>
              <div className="space-y-2">
                {(data.opportunities ?? []).map((o, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded border bg-success/5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">$</span>
                    <div className="text-sm">
                      <div className="font-medium">{o.title}</div>
                      <div className="text-xs text-muted-foreground">{o.description}</div>
                      {o.impact_brl && <div className="text-xs text-success mt-0.5 tabular-nums">Impacto: {brl(o.impact_brl)}</div>}
                    </div>
                  </div>
                ))}
                {!data.opportunities?.length && <p className="text-xs text-muted-foreground">Sem oportunidades destacadas.</p>}
              </div>
            </Card>
          </div>

          {/* Investor questions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">Perguntas que este painel responde</h3>
            <ul className="text-sm text-muted-foreground grid grid-cols-1 lg:grid-cols-2 gap-y-1.5 gap-x-4 list-disc pl-5">
              <li>Quanto custa atender um tenant?</li>
              <li>Quanto custa um usuário ativo?</li>
              <li>Quanto custa uma mensagem?</li>
              <li>Quais tenants dão prejuízo?</li>
              <li>Qual modelo de IA pesa mais?</li>
              <li>A margem melhora com escala?</li>
              <li>O Load Balancer é overhead ou investimento?</li>
              <li>Quanto custa vídeo/mídia?</li>
            </ul>
          </Card>
        </div>
      )}
    </FinOpsShell>
  );
}

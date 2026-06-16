import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { brl, pct } from '@/lib/finops/format';
import { Lightbulb, ArrowRight, AlertTriangle, Zap, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FinOpsOverview } from '@/types/finops';

interface Props {
  data: FinOpsOverview;
}

type Insight = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  impact?: string;
  action?: { label: string; to: string };
};

const SEVERITY_STYLES: Record<Insight['severity'], string> = {
  high: 'border-destructive/40 bg-destructive/5',
  medium: 'border-amber-500/40 bg-amber-500/5',
  low: 'border-primary/30 bg-primary/5',
};

const SEVERITY_BADGES: Record<Insight['severity'], string> = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  low: 'bg-primary/15 text-primary border-primary/30',
};

export function ProfitInsightsCard({ data }: Props) {
  const insights = buildInsights(data);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md grid place-items-center bg-primary/10 text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold">Insights para aumentar o lucro</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">{insights.length} sugest{insights.length === 1 ? 'ão' : 'ões'}</Badge>
      </div>

      {insights.length === 0 ? (
        <p className="text-xs text-muted-foreground">Margem saudável e sem outliers relevantes no período. Continue monitorando.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {insights.map((i) => {
            const Icon = i.icon;
            return (
              <div key={i.id} className={`rounded-md border p-3 ${SEVERITY_STYLES[i.severity]}`}>
                <div className="flex items-start gap-2 mb-1.5">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold truncate">{i.title}</span>
                      <Badge className={`h-4 px-1 text-[9px] uppercase ${SEVERITY_BADGES[i.severity]}`}>{i.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{i.description}</p>
                  </div>
                </div>
                {i.impact && (
                  <div className="text-[11px] font-medium tabular-nums mt-1.5 pt-1.5 border-t border-border/60">
                    Impacto: <span className="text-success">{i.impact}</span>
                  </div>
                )}
                {i.action && (
                  <Button asChild size="sm" variant="ghost" className="h-6 px-2 mt-1 text-[11px]">
                    <Link to={i.action.to}>{i.action.label} <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function buildInsights(data: FinOpsOverview): Insight[] {
  const out: Insight[] = [];
  const revenue = data.revenue_brl?.value ?? 0;
  const cost = data.cost_total_brl?.value ?? 0;
  const marginPct = data.margin_pct?.value ?? 0;
  const ai = data.cost_ai_brl?.value ?? 0;
  const infra = data.cost_infra_brl?.value ?? 0;
  const cpu = data.cost_per_active_user?.value ?? 0;
  const topLoss = data.top_loss_tenants ?? [];
  const topModels = data.top_cost_models ?? [];

  // 1. Margem crítica
  if (revenue > 0 && marginPct < 20) {
    out.push({
      id: 'low-margin',
      severity: marginPct < 0 ? 'high' : 'medium',
      icon: AlertTriangle,
      title: marginPct < 0 ? 'Margem negativa' : 'Margem abaixo de 20%',
      description: `Receita ${brl(revenue)} contra custo ${brl(cost)} (margem ${pct(marginPct, 1)}). Revise pricing dos planos ou reduza custo variável.`,
      impact: marginPct < 0 ? `+${brl(Math.abs(revenue - cost))} para zerar` : undefined,
      action: { label: 'Ver tenants', to: '/finops/tenants' },
    });
  }

  // 2. Tenants deficitários
  const losing = topLoss.filter((t) => t.margin_brl < 0);
  if (losing.length > 0) {
    const totalLoss = losing.reduce((a, t) => a + t.margin_brl, 0);
    out.push({
      id: 'loss-tenants',
      severity: 'high',
      icon: Target,
      title: `${losing.length} tenant${losing.length > 1 ? 's' : ''} no prejuízo`,
      description: `Maior perda: ${losing[0].tenant_name} (${brl(losing[0].margin_brl)}). Considere upgrade de plano, throttle de IA ou desativação.`,
      impact: `+${brl(Math.abs(totalLoss))}/mês ao resolver`,
      action: { label: 'Ver detalhes', to: '/finops/tenants?filter=loss' },
    });
  }

  // 3. IA dominando o custo
  if (cost > 0 && ai / cost > 0.6) {
    const top = topModels[0];
    out.push({
      id: 'ai-heavy',
      severity: 'medium',
      icon: Zap,
      title: 'IA representa >60% do custo',
      description: top
        ? `Modelo mais caro: ${top.model} (${brl(top.cost_brl)} em ${top.calls} chamadas). Avalie cache, modelo mais barato em layers não-críticas ou batch.`
        : 'Avalie cache de respostas, downgrade de modelo em layers menos sensíveis ou batch processing.',
      impact: top ? `~${brl(top.cost_brl * 0.3)}/mês com -30% de uso` : undefined,
      action: { label: 'FinOps IA', to: '/finops/ai' },
    });
  }

  // 4. Modelo outlier (custo desproporcional)
  if (topModels.length >= 2) {
    const [first, second] = topModels;
    if (first.cost_brl > second.cost_brl * 3 && first.cost_brl > 50) {
      out.push({
        id: 'model-outlier',
        severity: 'medium',
        icon: Zap,
        title: `${first.model} é 3x+ mais caro`,
        description: `Custa ${brl(first.cost_brl)} vs ${brl(second.cost_brl)} do segundo. Verifique se há fallback configurado e se vale a pena para a layer.`,
        action: { label: 'Comparar modelos', to: '/finops/ai' },
      });
    }
  }

  // 5. Infra peso fixo alto comparado à receita
  if (revenue > 0 && infra / revenue > 0.3) {
    out.push({
      id: 'fixed-heavy',
      severity: 'medium',
      icon: AlertTriangle,
      title: 'Custos fixos >30% da receita',
      description: `${brl(infra)} de SaaS/infra para ${brl(revenue)} de receita. Renegocie tiers ou consolide ferramentas redundantes.`,
      action: { label: 'Custos fixos', to: '/finops/settings/costs' },
    });
  }

  // 6. CPU muito alto = oportunidade de aumentar preço
  if (cpu > 0 && revenue > 0) {
    // ARPU = revenue / active_users; active_users derivable from cost_total / cpu
    const activeUsers = cost > 0 && cpu > 0 ? cost / cpu : 0;
    const arpu = activeUsers > 0 ? revenue / activeUsers : 0;
    if (arpu > 0 && cpu / arpu > 0.5) {
      out.push({
        id: 'cpu-vs-arpu',
        severity: cpu / arpu > 0.8 ? 'high' : 'medium',
        icon: TrendingUp,
        title: 'Custo por usuário consome >50% do ARPU',
        description: `Cada usuário ativo custa ${brl(cpu)} contra ARPU de ${brl(arpu)}. Espaço para repassar custo via plano premium ou cobrança por consumo.`,
        action: { label: 'Planos', to: '/plans' },
      });
    }
  }

  // 7. Oportunidade boa
  if (out.length === 0 && marginPct >= 40) {
    out.push({
      id: 'healthy',
      severity: 'low',
      icon: TrendingUp,
      title: 'Margem saudável para acelerar aquisição',
      description: `Margem de ${pct(marginPct, 1)} sustenta investimento agressivo em CAC. Considere aumentar marketing ou expandir features pagas.`,
      action: { label: 'Simular crescimento', to: '/finops#projection' },
    });
  }

  return out.slice(0, 6);
}

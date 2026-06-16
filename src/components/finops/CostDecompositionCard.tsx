import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { brl, pct } from '@/lib/finops/format';
import { Cpu, Image as ImageIcon, Server, TrendingUp, TrendingDown } from 'lucide-react';
import type { FinOpsOverview } from '@/types/finops';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface Props {
  data: FinOpsOverview;
}

type Row = {
  key: string;
  label: string;
  amount: number;
  prev?: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  hint: string;
  nature: 'variável' | 'fixo' | 'misto';
};

export function CostDecompositionCard({ data }: Props) {
  const ai = data.cost_ai_brl?.value ?? 0;
  const media = data.cost_media_brl?.value ?? 0;
  const infra = data.cost_infra_brl?.value ?? 0;
  const total = ai + media + infra;

  const rows: Row[] = [
    {
      key: 'ai',
      label: 'IA (LLM)',
      amount: ai,
      prev: data.cost_ai_brl?.previous ?? undefined,
      icon: Cpu,
      tone: 'hsl(var(--chart-1))',
      hint: 'Custo dos modelos (OpenAI, Anthropic, Google) via api_usage_logs. Variável por uso.',
      nature: 'variável',
    },
    {
      key: 'media',
      label: 'Mídia & Storage',
      amount: media,
      icon: ImageIcon,
      tone: 'hsl(var(--chart-2))',
      hint: 'GCS/Supabase Storage: upload, retenção e egress. Cresce com volume de áudio/vídeo.',
      nature: 'misto',
    },
    {
      key: 'infra',
      label: 'Infra & SaaS',
      amount: infra,
      icon: Server,
      tone: 'hsl(var(--chart-4))',
      hint: 'Custos fixos rateados: Supabase, Lovable, Cloudflare, Uazapi, GCP infra. Independem de uso.',
      nature: 'fixo',
    },
  ].sort((a, b) => b.amount - a.amount);

  const fixedTotal = infra;
  const variableTotal = ai + media;

  return (
    <Card className="p-4 lg:col-span-1">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold">Decomposição de custo</h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{data.period?.label}</span>
      </div>

      {total <= 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados de custo no período.</p>
      ) : (
        <>
          {/* Fixed vs Variable summary */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-md border border-border/60 bg-muted/30 p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Variável</div>
              <div className="text-sm font-semibold tabular-nums">{brl(variableTotal)}</div>
              <div className="text-[10px] text-muted-foreground">{pct((variableTotal / total) * 100, 0)} · escala c/ uso</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/30 p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Fixo</div>
              <div className="text-sm font-semibold tabular-nums">{brl(fixedTotal)}</div>
              <div className="text-[10px] text-muted-foreground">{pct((fixedTotal / total) * 100, 0)} · independe de uso</div>
            </div>
          </div>

          {/* Stacked bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted mb-3">
            {rows.map((r) => {
              const w = total > 0 ? (r.amount / total) * 100 : 0;
              if (w <= 0) return null;
              return <div key={r.key} style={{ width: `${w}%`, background: r.tone }} title={`${r.label} · ${brl(r.amount)}`} />;
            })}
          </div>

          {/* Detail list */}
          <TooltipProvider delayDuration={150}>
            <div className="space-y-2">
              {rows.map((r) => {
                const share = total > 0 ? (r.amount / total) * 100 : 0;
                const Icon = r.icon;
                const deltaPct = r.prev && r.prev > 0 ? ((r.amount - r.prev) / r.prev) * 100 : null;
                return (
                  <div key={r.key} className="flex items-center gap-2 text-xs">
                    <span className="h-6 w-6 rounded-md grid place-items-center" style={{ background: `${r.tone}1f`, color: r.tone }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{r.label}</span>
                        <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">{r.nature}</Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] text-xs">{r.hint}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-semibold">{brl(r.amount)}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                        <span>{pct(share, 1)}</span>
                        {deltaPct != null && Math.abs(deltaPct) >= 1 && (
                          <span className={`flex items-center ${deltaPct > 0 ? 'text-destructive' : 'text-success'}`}>
                            {deltaPct > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {Math.abs(deltaPct).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TooltipProvider>

          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Custo total</span>
            <span className="font-semibold tabular-nums">{brl(total)}</span>
          </div>
        </>
      )}
    </Card>
  );
}

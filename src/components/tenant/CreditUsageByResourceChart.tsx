import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart as PieIcon } from 'lucide-react';
import { useCreditByResource } from '@/hooks/credits/useCredits';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props { tenantId: string }

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
];

const LABELS: Record<string, string> = {
  layer_1: 'IA Layer 1',
  layer_2: 'IA Layer 2',
  layer_3: 'IA Layer 3',
  transcription: 'Transcrição',
  image_generation: 'Imagens',
  copilot_daily: 'Copilot',
  unknown: 'Outros',
};

export function CreditUsageByResourceChart({ tenantId }: Props) {
  const { data, isLoading } = useCreditByResource(tenantId);

  const totalCredits = data?.reduce((s, r) => s + r.credits, 0) || 0;
  const totalWebhooks = data?.reduce((s, r) => s + r.webhook_calls, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieIcon className="h-4 w-4 text-primary" /> Onde gastei meus créditos
        </CardTitle>
        <CardDescription>
          Distribuição por recurso · {totalWebhooks > 0 && `${totalWebhooks} eventos de robô`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : !data || data.length === 0 || totalCredits === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Sem consumo no ciclo.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="credits"
                nameKey="resource_type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ resource_type, percent }) =>
                  `${LABELS[resource_type] || resource_type} ${((percent || 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, _n, p) => [
                `${v.toLocaleString('pt-BR')} créditos`,
                LABELS[(p?.payload as { resource_type: string }).resource_type] || p?.payload?.resource_type,
              ]} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => LABELS[value] || value}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

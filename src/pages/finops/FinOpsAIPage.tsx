import { useMemo } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsAI } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { brl, num, pct } from '@/lib/finops/format';
import { Sparkline } from '@/components/finops/Sparkline';
import type { FinOpsAIModelRow, FinOpsAILayerRow, FinOpsAIOperationRow, FinOpsFallbackRow } from '@/types/finops';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function FinOpsAIPage() {
  const { filters } = useFinOpsPeriod();

  const models = useFinOpsAI('models', filters);
  const layers = useFinOpsAI('layers', filters);
  const operations = useFinOpsAI('operations', filters);

  const modelCols: FinOpsColumnDef<FinOpsAIModelRow>[] = useMemo(
    () => [
      { accessorKey: 'provider', header: 'Provider', cell: ({ getValue }) => <span className="text-xs font-mono">{getValue() as string}</span> },
      {
        accessorKey: 'model',
        header: 'Modelo',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs truncate">{row.original.model}</span>
            {row.original.has_pricing === false && (
              <span title="Modelo sem pricing ativo">
                <AlertTriangle className="h-3 w-3 text-warning" />
              </span>
            )}
          </div>
        ),
      },
      { accessorKey: 'calls', header: 'Chamadas', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_brl', header: 'Custo', meta: { numeric: true }, cell: ({ getValue }) => <strong>{brl(getValue() as number)}</strong> },
      { accessorKey: 'input_tokens', header: 'Input tok', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'output_tokens', header: 'Output tok', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'output_input_ratio', header: 'O/I', meta: { numeric: true }, cell: ({ getValue }) => (getValue() as number)?.toFixed(2) ?? '—' },
      { accessorKey: 'avg_latency_ms', header: 'Latência ms', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'errors', header: 'Erros', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'fallbacks', header: 'Fallbacks', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_per_call_brl', header: 'R$/chamada', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'cost_per_1k_output_brl', header: 'R$/1k out', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      {
        id: 'spark',
        header: 'Tendência 7d',
        cell: ({ row }) => row.original.spark ? <Sparkline data={row.original.spark} width={70} height={20} stroke="hsl(var(--primary))" /> : <span className="text-xs text-muted-foreground">—</span>,
        enableSorting: false,
      },
      { accessorKey: 'usage_missing_reason_count', header: 'Sem custo', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
    ],
    [],
  );

  const layerCols: FinOpsColumnDef<FinOpsAILayerRow>[] = useMemo(
    () => [
      { accessorKey: 'layer', header: 'Layer', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'calls', header: 'Chamadas', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_brl', header: 'Custo', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'credits_consumed', header: 'Créditos', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'output_tokens', header: 'Output tok', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_per_credit', header: 'R$/crédito', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'cost_per_response', header: 'R$/resposta', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'avg_latency_ms', header: 'Latência ms', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
    ],
    [],
  );

  const opCols: FinOpsColumnDef<FinOpsAIOperationRow>[] = useMemo(
    () => [
      { accessorKey: 'operation', header: 'Operação', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'channel', header: 'Canal', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'mode', header: 'Modo', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'calls', header: 'Chamadas', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_brl', header: 'Custo', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'input_tokens', header: 'Input tok', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'output_tokens', header: 'Output tok', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'avg_latency_ms', header: 'Latência ms', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'error_rate', header: 'Erro %', meta: { numeric: true }, cell: ({ getValue }) => pct((getValue() as number) * 100) },
    ],
    [],
  );

  const fbCols: FinOpsColumnDef<FinOpsFallbackRow>[] = useMemo(
    () => [
      { accessorKey: 'from_provider', header: 'De provider' },
      { accessorKey: 'from_model', header: 'De modelo', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'to_provider', header: 'Para provider' },
      { accessorKey: 'to_model', header: 'Para modelo', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'count', header: 'Ocorrências', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_brl', header: 'Custo gerado', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
    ],
    [],
  );

  return (
    <FinOpsShell title="AI Economics" description="Custo, latência, erros, fallbacks e distribuição de tokens por modelo, layer e operação.">
      <Tabs defaultValue="models" className="space-y-3">
        <TabsList>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="fallbacks">Fallbacks</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <DataTable
            data={models.data?.models ?? []}
            columns={modelCols}
            loading={models.isLoading}
            searchPlaceholder="Buscar provider ou modelo…"
            csvFilename={`finops-ai-models-${filters.month || 'range'}.csv`}
            initialSorting={[{ id: 'cost_brl', desc: true }]}
            rowKey={(r) => `${r.provider}-${r.model}`}
          />
        </TabsContent>

        <TabsContent value="layers">
          <DataTable
            data={layers.data?.layers ?? []}
            columns={layerCols}
            loading={layers.isLoading}
            searchPlaceholder="Buscar layer…"
            csvFilename={`finops-ai-layers-${filters.month || 'range'}.csv`}
            initialSorting={[{ id: 'cost_brl', desc: true }]}
            rowKey={(r) => r.layer}
          />
        </TabsContent>

        <TabsContent value="operations">
          <DataTable
            data={operations.data?.operations ?? []}
            columns={opCols}
            loading={operations.isLoading}
            searchPlaceholder="Buscar operação ou canal…"
            csvFilename={`finops-ai-operations-${filters.month || 'range'}.csv`}
            initialSorting={[{ id: 'cost_brl', desc: true }]}
            rowKey={(r) => `${r.operation}-${r.channel}-${r.mode}`}
          />
        </TabsContent>

        <TabsContent value="fallbacks">
          {models.data?.fallbacks?.length ? (
            <DataTable
              data={models.data.fallbacks}
              columns={fbCols}
              csvFilename={`finops-ai-fallbacks-${filters.month || 'range'}.csv`}
              initialSorting={[{ id: 'count', desc: true }]}
              rowKey={(r) => `${r.from_model}-${r.to_model}`}
            />
          ) : (
            <Card className="p-6 text-sm text-muted-foreground text-center">Sem fallbacks no período.</Card>
          )}
        </TabsContent>

        <TabsContent value="errors">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Erros por modelo (timeline)</h3>
            {models.data?.errors_timeline?.length ? (
              <div className="space-y-1.5">
                {models.data.errors_timeline.map((e) => (
                  <div key={e.date} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{e.date}</span>
                    <div className="flex-1 mx-3 h-1.5 bg-muted rounded">
                      <div className="h-full rounded bg-destructive" style={{ width: `${Math.min(e.error_rate * 100, 100)}%` }} />
                    </div>
                    <span className="tabular-nums">{pct(e.error_rate * 100)} <span className="text-muted-foreground">({num(e.calls)})</span></span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados de erros no período.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </FinOpsShell>
  );
}

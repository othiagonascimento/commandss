import { useMemo, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsPricing } from '@/hooks/finops/useFinOps';
import { brl, dateBR } from '@/lib/finops/format';
import type { FinOpsPricingRow } from '@/types/finops';
import { DrillDownDrawer } from '@/components/finops/DrillDownDrawer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ExternalLink, AlertTriangle } from 'lucide-react';

const PROJECT_REF = 'btoyclznuuwvxbsacemw';

export default function FinOpsPricingSettingsPage() {
  const { data, isLoading, error } = useFinOpsPricing();
  const [selected, setSelected] = useState<FinOpsPricingRow | null>(null);

  const rows = data?.rows ?? [];

  // Group by provider/model: current = most recent effective_from
  const current = useMemo(() => {
    const byKey = new Map<string, FinOpsPricingRow>();
    for (const r of rows) {
      const key = `${r.provider}|${r.model}`;
      const existing = byKey.get(key);
      if (!existing || new Date(r.effective_from) > new Date(existing.effective_from)) {
        byKey.set(key, r);
      }
    }
    return [...byKey.values()];
  }, [rows]);

  const cols: FinOpsColumnDef<FinOpsPricingRow>[] = useMemo(
    () => [
      { accessorKey: 'provider', header: 'Provider' },
      { accessorKey: 'model', header: 'Modelo', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'input_cost_per_1m_tokens_brl', header: 'Input /1M', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'output_cost_per_1m_tokens_brl', header: 'Output /1M', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cached_input_cost_per_1m_tokens_brl', header: 'Cached /1M', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'usd_brl_rate', header: 'USD/BRL', meta: { numeric: true }, cell: ({ getValue }) => (getValue() as number)?.toFixed(4) ?? '—' },
      { accessorKey: 'source', header: 'Fonte', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'effective_from', header: 'Vigente desde', cell: ({ getValue }) => <span className="text-xs font-mono">{dateBR(getValue() as string)}</span> },
    ],
    [],
  );

  return (
    <FinOpsShell
      title="Pricing IA"
      description="Histórico de preços por provider/modelo lido diretamente de ai_model_pricing_history. Edição via API ainda não disponível — configure por SQL no CRM."
      showPeriod={false}
    >
      <Card className="p-3 border-info/40 bg-info/5 flex items-start gap-2 text-sm">
        <Lock className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Modo somente leitura</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            A edge function <code className="font-mono">master-analytics</code> do CRM ainda não expõe os endpoints
            de criação. Para alterar pricing, use o SQL Editor diretamente — o CRM vai ler a versão vigente na próxima chamada.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a
            href={`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            SQL Editor
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </Card>

      <Card className="p-3 border-warning/40 bg-warning/5 flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          Custo histórico não muda quando o pricing muda. Cada <code className="font-mono">api_usage_logs</code> referencia o
          <code className="font-mono"> pricing_snapshot_id</code> vigente no momento da chamada.
        </div>
      </Card>

      {error && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm">
          Erro ao ler pricing: {(error as Error).message}
        </Card>
      )}

      <DataTable
        data={current}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar provider ou modelo…"
        csvFilename="finops-pricing-current.csv"
        onRowClick={(r) => setSelected(r)}
        rowKey={(r) => r.id}
        initialSorting={[{ id: 'provider', desc: false }]}
        emptyMessage="Nenhum pricing cadastrado em ai_model_pricing_history"
      />

      <DrillDownDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.provider} / ${selected.model}` : ''}
        description="Histórico completo de versões"
      >
        {selected && (
          <div className="space-y-2">
            {rows
              .filter((r) => r.provider === selected.provider && r.model === selected.model)
              .sort((a, b) => +new Date(b.effective_from) - +new Date(a.effective_from))
              .map((r) => (
                <Card key={r.id} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{dateBR(r.effective_from)}{r.effective_to ? ` → ${dateBR(r.effective_to)}` : ' → atual'}</span>
                    <span className="text-muted-foreground">{r.source || '—'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>Input /1M: <strong>{brl(r.input_cost_per_1m_tokens_brl)}</strong></div>
                    <div>Output /1M: <strong>{brl(r.output_cost_per_1m_tokens_brl)}</strong></div>
                    <div>Cached /1M: <strong>{brl(r.cached_input_cost_per_1m_tokens_brl)}</strong></div>
                    <div>USD/BRL: <strong>{r.usd_brl_rate?.toFixed(4) ?? '—'}</strong></div>
                  </div>
                  {r.notes && <div className="text-muted-foreground italic">{r.notes}</div>}
                </Card>
              ))}
          </div>
        )}
      </DrillDownDrawer>
    </FinOpsShell>
  );
}

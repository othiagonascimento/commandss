import { useMemo } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsInfra } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { Card } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/finops/ConfidenceBadge';
import { brl } from '@/lib/finops/format';
import type { FinOpsInfraRow } from '@/types/finops';
import { Network, Cloud, HardDrive, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FinOpsInfraPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading } = useFinOpsInfra(filters);

  const cols: FinOpsColumnDef<FinOpsInfraRow>[] = useMemo(
    () => [
      { accessorKey: 'service', header: 'Serviço', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
      { accessorKey: 'sku', header: 'SKU', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'category', header: 'Categoria', cell: ({ getValue }) => <span className="text-xs capitalize">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'amount_brl', header: 'Valor', meta: { numeric: true }, cell: ({ getValue }) => <strong>{brl(getValue() as number)}</strong> },
      { accessorKey: 'allocation_strategy', header: 'Rateio', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'attribution_confidence', header: 'Confiança', cell: ({ getValue }) => <ConfidenceBadge level={getValue() as 'high' | 'medium' | 'low'} /> },
    ],
    [],
  );

  const lb = data?.load_balancer;

  return (
    <FinOpsShell title="Infra & Overhead" description="Custos fixos rateáveis vindos do billing GCP. Decisão estratégica sobre Load Balancer não é automatizada.">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <Card className={cn('p-4 border-2', lb?.classification === 'overhead' ? 'border-destructive/40' : lb?.classification === 'investment' ? 'border-success/40' : '')}>
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Network className="h-3.5 w-3.5" /> Load Balancer</div>
          <div className="text-xl font-bold tabular-nums mt-1">{brl(lb?.amount_brl)}</div>
          <div className="mt-2 inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted">
            {lb?.classification === 'overhead' && '⚠ Overhead'}
            {lb?.classification === 'investment' && '✓ Investimento'}
            {(!lb || lb.classification === 'unknown') && '? A definir'}
          </div>
          {lb?.rationale && <p className="text-xs text-muted-foreground mt-2">{lb.rationale}</p>}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Cloud className="h-3.5 w-3.5" /> Total infra</div>
          <div className="text-xl font-bold tabular-nums mt-1">{brl(data?.total_brl)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Server className="h-3.5 w-3.5" /> Por tenant ativo</div>
          <div className="text-xl font-bold tabular-nums mt-1">{brl(data?.per_tenant_brl)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><HardDrive className="h-3.5 w-3.5" /> Por mensagem</div>
          <div className="text-xl font-bold tabular-nums mt-1">{brl(data?.per_message_brl, { maximumFractionDigits: 4 })}</div>
        </Card>
      </div>

      <DataTable
        data={data?.rows ?? []}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar serviço ou SKU…"
        csvFilename={`finops-infra-${filters.month || 'range'}.csv`}
        initialSorting={[{ id: 'amount_brl', desc: true }]}
        rowKey={(r) => `${r.service}-${r.sku}`}
      />
    </FinOpsShell>
  );
}

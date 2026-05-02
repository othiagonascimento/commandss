import { useMemo, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsBudgets } from '@/hooks/finops/useFinOps';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { FinOpsBudgetRow } from '@/types/finops';
import { useQueryClient } from '@tanstack/react-query';
import { finopsApi } from '@/services/finopsApi';
import { toast } from 'sonner';
import { Clock, AlertTriangle } from 'lucide-react';

export default function FinOpsBudgetSettingsPage() {
  const { data, isLoading } = useFinOpsBudgets();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<FinOpsBudgetRow>>>({});

  const rows = useMemo(() => {
    const base = data?.rows ?? [];
    return base.map((r) => ({ ...r, ...(edits[r.id] || {}) }));
  }, [data, edits]);

  const setField = (id: string, patch: Partial<FinOpsBudgetRow>) => {
    setEdits((p) => ({ ...p, [id]: { ...(p[id] || {}), ...patch } }));
  };

  const save = async (row: FinOpsBudgetRow) => {
    const patch = edits[row.id];
    if (!patch) return;
    const { error } = await finopsApi.budgetsUpdate({ id: row.id, ...patch });
    if (error) return toast.error(error);
    toast.success('Budget atualizado · pode levar ~60s para propagar');
    setEdits((p) => {
      const next = { ...p };
      delete next[row.id];
      return next;
    });
    qc.invalidateQueries({ queryKey: ['finops', 'budgets'] });
  };

  const cols: FinOpsColumnDef<FinOpsBudgetRow>[] = useMemo(
    () => [
      { accessorKey: 'layer', header: 'Layer', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'operation', header: 'Operação', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: 'channel', header: 'Canal', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      {
        accessorKey: 'max_output_tokens',
        header: 'Max output tokens',
        meta: { numeric: true },
        cell: ({ row }) => (
          <Input
            type="number"
            value={row.original.max_output_tokens}
            onChange={(e) => setField(row.original.id, { max_output_tokens: parseInt(e.target.value || '0', 10) })}
            className="h-7 w-24 text-right tabular-nums"
          />
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Ativo',
        cell: ({ row }) => (
          <Switch
            checked={row.original.is_active}
            onCheckedChange={(v) => setField(row.original.id, { is_active: v })}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const dirty = !!edits[row.original.id];
          return (
            <Button size="sm" disabled={!dirty} onClick={() => save(row.original)} className="h-7">
              Salvar
            </Button>
          );
        },
      },
    ],
    [edits],
  );

  return (
    <FinOpsShell
      title="Output Token Budgets"
      description="Limites de saída por layer/operação/canal. Aumentar eleva custo; reduzir pode truncar respostas."
      showPeriod={false}
    >
      <Card className="p-3 bg-muted/30 flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        Alterações podem levar até ~60 segundos para propagar nas Edge Functions.
      </Card>
      <Card className="p-3 border-warning/40 bg-warning/5 flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <strong>Cuidado:</strong> reduzir muito pode truncar respostas; aumentar muito eleva o custo de output proporcionalmente.
        </div>
      </Card>

      <DataTable
        data={rows}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar layer ou operação…"
        csvFilename="finops-budgets.csv"
        rowKey={(r) => r.id}
      />
    </FinOpsShell>
  );
}

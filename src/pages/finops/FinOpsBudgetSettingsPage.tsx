import { useMemo } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsBudgets } from '@/hooks/finops/useFinOps';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FinOpsBudgetRow } from '@/types/finops';
import { Lock, ExternalLink, AlertTriangle, Check, X } from 'lucide-react';

const PROJECT_REF = 'btoyclznuuwvxbsacemw';

export default function FinOpsBudgetSettingsPage() {
  const { data, isLoading, error } = useFinOpsBudgets();

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const cols: FinOpsColumnDef<FinOpsBudgetRow>[] = useMemo(
    () => [
      { accessorKey: 'layer', header: 'Layer', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) ?? '—'}</span> },
      { accessorKey: 'operation', header: 'Operação', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) ?? '—'}</span> },
      { accessorKey: 'channel', header: 'Canal', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) ?? '—'}</span> },
      {
        accessorKey: 'max_output_tokens',
        header: 'Max output tokens',
        meta: { numeric: true },
        cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number)?.toLocaleString('pt-BR')}</span>,
      },
      {
        accessorKey: 'is_active',
        header: 'Ativo',
        cell: ({ getValue }) =>
          getValue() ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          ),
      },
      {
        accessorKey: 'notes',
        header: 'Notas',
        cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{(getValue() as string) ?? '—'}</span>,
      },
    ],
    [],
  );

  return (
    <FinOpsShell
      title="Output Token Budgets"
      description="Limites de saída por layer/operação/canal lidos diretamente de ai_output_token_budgets. Edição via API ainda não disponível."
      showPeriod={false}
    >
      <Card className="p-3 border-info/40 bg-info/5 flex items-start gap-2 text-sm">
        <Lock className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Modo somente leitura</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            A edge function <code className="font-mono">master-analytics</code> do CRM ainda não expõe os endpoints de
            atualização. Edite os limites diretamente via SQL — as Edge Functions do CRM leem o valor vigente em até ~60s.
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
          <strong>Cuidado:</strong> reduzir muito pode truncar respostas; aumentar muito eleva o custo de output proporcionalmente.
        </div>
      </Card>

      {error && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm">
          Erro ao ler budgets: {(error as Error).message}
        </Card>
      )}

      <DataTable
        data={rows}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar layer ou operação…"
        csvFilename="finops-budgets.csv"
        rowKey={(r) => r.id}
        emptyMessage="Nenhum budget cadastrado em ai_output_token_budgets"
      />
    </FinOpsShell>
  );
}

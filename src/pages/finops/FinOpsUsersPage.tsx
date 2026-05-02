import { useMemo } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsUsers } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { brl, num } from '@/lib/finops/format';
import { RiskBadge } from '@/components/finops/RiskBadge';
import type { FinOpsUserRow } from '@/types/finops';

export default function FinOpsUsersPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading } = useFinOpsUsers(filters);

  const rows = data?.rows ?? [];

  const columns: FinOpsColumnDef<FinOpsUserRow>[] = useMemo(
    () => [
      {
        accessorKey: 'user_name',
        header: 'Usuário',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.original.user_name || '—'}</div>
            <div className="text-[10px] text-muted-foreground font-mono truncate">{row.original.user_email}</div>
          </div>
        ),
      },
      { accessorKey: 'tenant_name', header: 'Tenant', cell: ({ getValue }) => <span className="text-xs">{getValue() as string}</span> },
      { accessorKey: 'messages', header: 'Mensagens', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'ai_events', header: 'Eventos IA', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'credits_consumed', header: 'Créditos', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_ai_brl', header: 'Custo IA', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_media_brl', header: 'Custo Mídia', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_total_brl', header: 'Custo total', meta: { numeric: true }, cell: ({ getValue }) => <strong>{brl(getValue() as number)}</strong> },
      { accessorKey: 'cost_per_message', header: 'R$/msg', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'cost_per_ai_event', header: 'R$/evento IA', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'risk', header: 'Risco', cell: ({ getValue }) => <RiskBadge level={getValue() as FinOpsUserRow['risk']} /> },
    ],
    [],
  );

  return (
    <FinOpsShell title="Usuários CRM — Custo por operador" description="Custo de IA atribuído ao usuário do CRM (não confundir com leads/clientes finais).">
      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar usuário ou tenant…"
        defaultHidden={['cost_media_brl']}
        csvFilename={`finops-users-${filters.month || `${filters.start_date}_${filters.end_date}`}.csv`}
        rowKey={(r) => r.user_id}
        initialSorting={[{ id: 'cost_total_brl', desc: true }]}
      />
    </FinOpsShell>
  );
}

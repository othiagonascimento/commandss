import { useMemo, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsTenants } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { brl, num, pct } from '@/lib/finops/format';
import { RiskBadge } from '@/components/finops/RiskBadge';
import { DrillDownDrawer } from '@/components/finops/DrillDownDrawer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { FinOpsTenantRow } from '@/types/finops';
import { Card } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function FinOpsTenantsPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading } = useFinOpsTenants(filters);
  const [params] = useSearchParams();
  const [view, setView] = useState<'all' | 'loss' | 'top'>(params.get('filter') === 'loss' ? 'loss' : 'all');
  const [focused, setFocused] = useState<FinOpsTenantRow | null>(null);

  const rows = useMemo(() => {
    let r = data?.rows ?? [];
    if (view === 'loss') r = r.filter((t) => t.margin_brl < 0);
    if (view === 'top') r = [...r].sort((a, b) => b.cost_total_brl - a.cost_total_brl).slice(0, 20);
    return r;
  }, [data, view]);

  const columns: FinOpsColumnDef<FinOpsTenantRow>[] = useMemo(
    () => [
      {
        accessorKey: 'tenant_name',
        header: 'Tenant',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.original.tenant_name}</div>
            {row.original.subdomain && (
              <div className="text-[10px] text-muted-foreground font-mono truncate">{row.original.subdomain}</div>
            )}
          </div>
        ),
      },
      { accessorKey: 'subscription_status', header: 'Status', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'revenue_brl', header: 'Receita', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_ai_brl', header: 'IA', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_media_brl', header: 'Mídia', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_infra_brl', header: 'Infra', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      { accessorKey: 'cost_total_brl', header: 'Custo total', meta: { numeric: true }, cell: ({ getValue }) => <strong>{brl(getValue() as number)}</strong> },
      { accessorKey: 'credits_consumed', header: 'Créditos', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'messages', header: 'Mensagens', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'active_users', header: 'Usuários', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'cost_per_message', header: 'R$/msg', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number, { maximumFractionDigits: 4 }) },
      { accessorKey: 'cost_per_active_user', header: 'R$/usuário', meta: { numeric: true }, cell: ({ getValue }) => brl(getValue() as number) },
      {
        accessorKey: 'margin_brl',
        header: 'Margem BRL',
        meta: { numeric: true },
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return <span className={v < 0 ? 'text-destructive font-semibold' : 'text-success font-semibold'}>{brl(v)}</span>;
        },
      },
      { accessorKey: 'margin_pct', header: 'Margem %', meta: { numeric: true }, cell: ({ getValue }) => pct(getValue() as number) },
      { accessorKey: 'risk', header: 'Risco', cell: ({ getValue }) => <RiskBadge level={getValue() as FinOpsTenantRow['risk']} /> },
    ],
    [],
  );

  return (
    <FinOpsShell title="Tenants P&L" description="Margem de contribuição por tenant. Use para identificar contas deficitárias e oportunidades de upsell.">
      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar tenant…"
        defaultHidden={['cost_infra_brl']}
        csvFilename={`finops-tenants-${filters.month || `${filters.start_date}_${filters.end_date}`}.csv`}
        onRowClick={(r) => setFocused(r)}
        rowKey={(r) => r.tenant_id}
        toolbar={
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'all' | 'loss' | 'top')} className="h-8">
            <ToggleGroupItem value="all" className="h-8 text-xs">Todos</ToggleGroupItem>
            <ToggleGroupItem value="loss" className="h-8 text-xs">Deficitários</ToggleGroupItem>
            <ToggleGroupItem value="top" className="h-8 text-xs">Top 20 custo</ToggleGroupItem>
          </ToggleGroup>
        }
        initialSorting={[{ id: 'cost_total_brl', desc: true }]}
      />

      <DrillDownDrawer
        open={!!focused}
        onOpenChange={(o) => !o && setFocused(null)}
        title={focused?.tenant_name || ''}
        description={focused?.subdomain || undefined}
      >
        {focused && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Receita</div>
                <div className="text-lg font-bold">{brl(focused.revenue_brl)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Custo total</div>
                <div className="text-lg font-bold text-destructive">{brl(focused.cost_total_brl)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Margem</div>
                <div className={`text-lg font-bold ${focused.margin_brl < 0 ? 'text-destructive' : 'text-success'}`}>
                  {brl(focused.margin_brl)} ({pct(focused.margin_pct)})
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Risco</div>
                <div><RiskBadge level={focused.risk} /></div>
              </Card>
            </div>
            <Card className="p-3 space-y-2 text-sm">
              <h4 className="font-semibold">Decomposição</h4>
              <div className="flex justify-between"><span className="text-muted-foreground">IA</span><span className="tabular-nums">{brl(focused.cost_ai_brl)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mídia</span><span className="tabular-nums">{brl(focused.cost_media_brl)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Infra rateada</span><span className="tabular-nums">{brl(focused.cost_infra_brl)}</span></div>
            </Card>
            <Card className="p-3 space-y-2 text-sm">
              <h4 className="font-semibold">Atividade</h4>
              <div className="flex justify-between"><span className="text-muted-foreground">Mensagens</span><span className="tabular-nums">{num(focused.messages)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Usuários ativos</span><span className="tabular-nums">{num(focused.active_users)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Créditos consumidos</span><span className="tabular-nums">{num(focused.credits_consumed)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Custo / mensagem</span><span className="tabular-nums">{brl(focused.cost_per_message, { maximumFractionDigits: 4 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Custo / usuário</span><span className="tabular-nums">{brl(focused.cost_per_active_user)}</span></div>
            </Card>
            <Link
              to={`/tenants/${focused.tenant_id}`}
              className="text-xs text-primary hover:underline"
            >
              Ver perfil operacional do tenant →
            </Link>
          </div>
        )}
      </DrillDownDrawer>
    </FinOpsShell>
  );
}

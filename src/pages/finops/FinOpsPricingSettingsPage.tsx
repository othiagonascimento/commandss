import { useMemo, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsPricing } from '@/hooks/finops/useFinOps';
import { brl, dateBR } from '@/lib/finops/format';
import type { FinOpsPricingRow } from '@/types/finops';
import { DrillDownDrawer } from '@/components/finops/DrillDownDrawer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { finopsApi } from '@/services/finopsApi';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export default function FinOpsPricingSettingsPage() {
  const { data, isLoading } = useFinOpsPricing();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<FinOpsPricingRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<FinOpsPricingRow>>({});

  const rows = data?.rows ?? [];

  // Group by provider/model: current = effective_to null
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

  const handleCreate = async () => {
    if (!form.provider || !form.model || !form.effective_from) {
      toast.error('Provider, modelo e vigência são obrigatórios');
      return;
    }
    const { error } = await finopsApi.pricingCreate(form);
    if (error) return toast.error(error);
    toast.success('Nova versão de pricing criada');
    setCreating(false);
    setForm({});
    qc.invalidateQueries({ queryKey: ['finops', 'pricing'] });
  };

  return (
    <FinOpsShell
      title="Pricing IA"
      description="Histórico de preços por provider/modelo. Linhas em uso não podem ser editadas — crie nova versão com data futura."
      showPeriod={false}
      actions={<Button size="sm" onClick={() => { setForm({ effective_from: new Date().toISOString().slice(0, 10) }); setCreating(true); }}>+ Nova versão</Button>}
    >
      <Card className="p-3 border-warning/40 bg-warning/5 flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          Custo histórico não muda quando o pricing muda. Cada `api_usage_logs` referencia o `pricing_snapshot_id` vigente no momento da chamada.
        </div>
      </Card>

      <DataTable
        data={current}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar provider ou modelo…"
        csvFilename="finops-pricing-current.csv"
        onRowClick={(r) => setSelected(r)}
        rowKey={(r) => r.id}
        initialSorting={[{ id: 'provider', desc: false }]}
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

      <DrillDownDrawer open={creating} onOpenChange={setCreating} title="Nova versão de pricing" description="Cria nova linha sem alterar histórico.">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Provider</Label>
            <Input value={form.provider || ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="ex: google" />
          </div>
          <div>
            <Label className="text-xs">Model</Label>
            <Input value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="ex: gemini-2.0-flash" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Input BRL / 1M</Label>
              <Input type="number" step="0.0001" value={form.input_cost_per_1m_tokens_brl ?? ''} onChange={(e) => setForm({ ...form, input_cost_per_1m_tokens_brl: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Output BRL / 1M</Label>
              <Input type="number" step="0.0001" value={form.output_cost_per_1m_tokens_brl ?? ''} onChange={(e) => setForm({ ...form, output_cost_per_1m_tokens_brl: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Cached BRL / 1M</Label>
              <Input type="number" step="0.0001" value={form.cached_input_cost_per_1m_tokens_brl ?? ''} onChange={(e) => setForm({ ...form, cached_input_cost_per_1m_tokens_brl: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">USD/BRL</Label>
              <Input type="number" step="0.0001" value={form.usd_brl_rate ?? ''} onChange={(e) => setForm({ ...form, usd_brl_rate: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Vigente a partir de</Label>
            <Input type="date" value={form.effective_from || ''} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Notas</Label>
            <Input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar versão</Button>
          </div>
        </div>
      </DrillDownDrawer>
    </FinOpsShell>
  );
}

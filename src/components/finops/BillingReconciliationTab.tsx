import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { brl } from '@/lib/finops/format';

type ActualRow = {
  id: string;
  billing_month: string; // YYYY-MM-DD
  vendor: string;
  product: string | null;
  amount_brl: number;
  amount_usd: number | null;
  usd_brl_rate: number | null;
  invoice_ref: string | null;
  notes: string | null;
  source: string;
};

type ReconciliationRow = {
  vendor: string;
  estimate_brl: number;
  actual_brl: number;
  delta_brl: number;
  delta_pct: number | null;
  has_actual: boolean;
};

// Apenas custos FIXOS de plataforma. Custos VARIÁVEIS de IA (OpenAI/Anthropic/Google API)
// são acompanhados em /finops/ai — não entram aqui pois são por uso e repassados ao tenant.
const VENDOR_OPTIONS = [
  { value: 'supabase', label: 'Supabase (DB / Storage / Edge)' },
  { value: 'lovable', label: 'Lovable' },
  { value: 'uazapi', label: 'Uazapi (WhatsApp)' },
  { value: 'meta', label: 'Meta WhatsApp BSP (fixo)' },
  { value: 'gcp', label: 'GCP (Cloud Run, LB, Storage)' },
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'openai_team', label: 'OpenAI Team/ChatGPT (assinatura)' },
  { value: 'anthropic_team', label: 'Anthropic Team (assinatura)' },
  { value: 'github_copilot', label: 'GitHub Copilot' },
  { value: 'resend', label: 'Resend' },
  { value: 'other', label: 'Outro' },
];


const currentMonth = () => new Date().toISOString().slice(0, 7);

async function callFn<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('master-finops', {
    method: 'POST',
    body: { action, ...params },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export function BillingReconciliationTab() {
  const qc = useQueryClient();
  const [month, setMonth] = useState<string>(currentMonth());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ActualRow | null>(null);
  const [form, setForm] = useState<Partial<ActualRow>>({});

  const reconciliation = useQuery({
    queryKey: ['finops', 'reconciliation', month],
    queryFn: () => callFn<{ month: string; rows: ReconciliationRow[]; totals: ReconciliationRow }>(
      'finops-actuals-reconciliation',
      { month },
    ),
  });

  const actuals = useQuery({
    queryKey: ['finops', 'actuals', month],
    queryFn: () => callFn<{ rows: ActualRow[] }>('finops-actuals-list', { month, limit: 500 }),
  });

  const upsertMut = useMutation({
    mutationFn: (payload: Partial<ActualRow>) =>
      callFn<{ row: ActualRow }>('finops-actuals-upsert', { payload }),
    onSuccess: () => {
      toast.success(editing ? 'Atualizado' : 'Cadastrado');
      qc.invalidateQueries({ queryKey: ['finops', 'reconciliation'] });
      qc.invalidateQueries({ queryKey: ['finops', 'actuals'] });
      setOpen(false);
      setEditing(null);
      setForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => callFn('finops-actuals-delete', { id }),
    onSuccess: () => {
      toast.success('Removido');
      qc.invalidateQueries({ queryKey: ['finops', 'reconciliation'] });
      qc.invalidateQueries({ queryKey: ['finops', 'actuals'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      billing_month: month,
      vendor: 'supabase',
      amount_brl: 0,
      source: 'manual',
    });
    setOpen(true);
  };

  const openEdit = (r: ActualRow) => {
    setEditing(r);
    setForm({
      ...r,
      billing_month: r.billing_month.slice(0, 7),
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.vendor || !form.billing_month || !form.amount_brl) {
      toast.error('Mês, vendor e valor são obrigatórios');
      return;
    }
    upsertMut.mutate({ ...form, id: editing?.id });
  };

  const months = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d.toISOString().slice(0, 7));
    }
    return list;
  }, []);

  const totals = reconciliation.data?.totals;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Reconciliação de Faturas</h3>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Uma vez por mês, lance o valor real da fatura de cada provider (Supabase, OpenAI, Anthropic, Google, GCP…).
                    O sistema compara com a estimativa automática e mostra o delta — assim você sabe se o FinOps está confiável.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimativa (token×pricing + GCS export + custos fixos) vs valor real da fatura.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openNew} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />Lançar fatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editing ? 'Editar fatura' : 'Lançar fatura real'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Mês de referência</Label>
                        <Input
                          type="month"
                          value={form.billing_month?.slice(0, 7) || ''}
                          onChange={(e) => setForm({ ...form, billing_month: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vendor</Label>
                        <Select
                          value={form.vendor || ''}
                          onValueChange={(v) => setForm({ ...form, vendor: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {VENDOR_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Produto / SKU (opcional)</Label>
                      <Input
                        placeholder="ex: gpt-4o, claude-sonnet-4, vertex-ai..."
                        value={form.product || ''}
                        onChange={(e) => setForm({ ...form, product: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Valor BRL</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={form.amount_brl ?? ''}
                          onChange={(e) => setForm({ ...form, amount_brl: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor USD</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={form.amount_usd ?? ''}
                          onChange={(e) => setForm({ ...form, amount_usd: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Taxa USD/BRL</Label>
                        <Input
                          type="number" step="0.0001" min="0"
                          value={form.usd_brl_rate ?? ''}
                          onChange={(e) => setForm({ ...form, usd_brl_rate: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Nº da fatura (opcional)</Label>
                      <Input
                        value={form.invoice_ref || ''}
                        onChange={(e) => setForm({ ...form, invoice_ref: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Notas</Label>
                      <Textarea
                        rows={2}
                        value={form.notes || ''}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={submit} disabled={upsertMut.isPending}>
                      {upsertMut.isPending ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Reconciliation table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h4 className="text-sm font-semibold">Estimativa vs Fatura — {month}</h4>
            {totals && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">Estim.: <strong className="text-foreground">{brl(totals.estimate_brl)}</strong></span>
                <span className="text-muted-foreground">Real: <strong className="text-foreground">{brl(totals.actual_brl)}</strong></span>
                {totals.delta_pct !== null && (
                  <Badge variant={Math.abs(totals.delta_pct) > 15 ? 'destructive' : 'secondary'} className="gap-1">
                    {totals.delta_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {totals.delta_pct > 0 ? '+' : ''}{totals.delta_pct}%
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Estimativa</TableHead>
                <TableHead className="text-right">Fatura real</TableHead>
                <TableHead className="text-right">Δ R$</TableHead>
                <TableHead className="text-right">Δ %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliation.isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Carregando…</TableCell></TableRow>
              ) : (reconciliation.data?.rows.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Sem dados nesse mês.</TableCell></TableRow>
              ) : reconciliation.data!.rows.map((r) => (
                <TableRow key={r.vendor}>
                  <TableCell className="capitalize font-medium">{r.vendor}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{brl(r.estimate_brl)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {r.has_actual ? <strong>{brl(r.actual_brl)}</strong> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs ${r.delta_brl > 0 ? 'text-destructive' : r.delta_brl < 0 ? 'text-emerald-600' : ''}`}>
                    {r.has_actual ? (r.delta_brl > 0 ? '+' : '') + brl(r.delta_brl) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {r.has_actual && r.delta_pct !== null ? (
                      <Badge variant={Math.abs(r.delta_pct) > 15 ? 'destructive' : 'secondary'} className="font-mono">
                        {r.delta_pct > 0 ? '+' : ''}{r.delta_pct}%
                      </Badge>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Lançamentos do mês */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-semibold">Lançamentos — {month}</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">BRL</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {actuals.isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Carregando…</TableCell></TableRow>
              ) : (actuals.data?.rows.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Nenhuma fatura lançada nesse mês.</TableCell></TableRow>
              ) : actuals.data!.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize">{r.vendor}</TableCell>
                  <TableCell className="font-mono text-xs">{r.product || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{brl(r.amount_brl)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.amount_usd ? `$${r.amount_usd.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="text-xs">{r.invoice_ref || '—'}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate" title={r.notes || ''}>{r.notes || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm(`Remover lançamento ${r.vendor}?`)) deleteMut.mutate(r.id);
                    }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </TooltipProvider>
  );
}

import { useEffect, useState } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, ShieldCheck, Cloud, MessageSquare, Server, RefreshCw, Info } from 'lucide-react';
import { brl } from '@/lib/finops/format';

type AnyRow = Record<string, any>;

function useTable(table: string, orderBy: string, asc = false) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table as never)
      .select('*')
      .order(orderBy, { ascending: asc });
    if (error) toast.error(`Erro ao carregar ${table}: ${error.message}`);
    setRows((data as AnyRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [table]); // eslint-disable-line
  return { rows, loading, reload: load };
}

async function upsert(table: string, payload: AnyRow, id?: string) {
  const client = supabase as any;
  if (id) {
    const { error } = await client.from(table).update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await client.from(table).insert(payload);
    if (error) throw error;
  }
}
async function remove(table: string, id: string) {
  const { error } = await (supabase as any).from(table).delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- Platform Fixed Costs (SaaS / assinaturas) ---------------- */
function FixedCostsTab() {
  const { rows, loading, reload } = useTable('platform_fixed_costs', 'monthly_brl');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState<AnyRow>({});

  const openNew = () => { setEditing(null); setForm({ category: 'saas', billing_cycle: 'monthly', is_active: true, starts_on: new Date().toISOString().slice(0,10) }); setOpen(true); };
  const openEdit = (r: AnyRow) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const submit = async () => {
    try {
      const p: AnyRow = {
        vendor: form.vendor, product: form.product,
        category: form.category || 'saas',
        billing_cycle: form.billing_cycle || 'monthly',
        monthly_usd: Number(form.monthly_usd || 0),
        monthly_brl: Number(form.monthly_brl || 0),
        usd_brl_rate: form.usd_brl_rate ? Number(form.usd_brl_rate) : null,
        starts_on: form.starts_on, ends_on: form.ends_on || null,
        is_active: !!form.is_active, notes: form.notes || null,
      };
      if (!p.vendor || !p.product) { toast.error('vendor e product obrigatórios'); return; }
      await upsert('platform_fixed_costs', p, editing?.id);
      toast.success(editing ? 'Atualizado' : 'Criado');
      setOpen(false); reload();
    } catch (e: any) { toast.error(e.message); }
  };
  const del = async (id: string) => {
    if (!confirm('Excluir custo fixo?')) return;
    try { await remove('platform_fixed_costs', id); toast.success('Excluído'); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const total = rows.filter(r => r.is_active).reduce((a, r) => a + Number(r.monthly_brl || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Assinaturas SaaS (Lovable, Codex, Antigravity, GitHub etc.). Cada item é prorrateado pelo período em <code className="font-mono">/finops/infra</code>.
          <div className="mt-1 text-xs">Total ativo: <strong className="text-foreground">{brl(total)}/mês</strong> · {rows.filter(r => r.is_active).length} ativos</div>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova assinatura</Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Ciclo</TableHead><TableHead className="text-right">USD/mês</TableHead>
              <TableHead className="text-right">BRL/mês</TableHead><TableHead>Início</TableHead>
              <TableHead>Ativo</TableHead><TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Sem assinaturas cadastradas.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.vendor}</TableCell>
                <TableCell>{r.product}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                <TableCell className="text-xs">{r.billing_cycle}</TableCell>
                <TableCell className="text-right tabular-nums">${Number(r.monthly_usd || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.monthly_brl)}</TableCell>
                <TableCell className="text-xs font-mono">{r.starts_on}</TableCell>
                <TableCell>{r.is_active ? <Badge className="bg-success/15 text-success border-success/30">ativo</Badge> : <Badge variant="outline">inativo</Badge>}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} assinatura</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Vendor *</Label><Input value={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Lovable" /></div>
            <div><Label>Produto *</Label><Input value={form.product || ''} onChange={e => setForm({ ...form, product: e.target.value })} placeholder="Pro Plan" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || 'saas'} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">saas</SelectItem><SelectItem value="ai_tool">ai_tool</SelectItem>
                  <SelectItem value="infra">infra</SelectItem><SelectItem value="domain">domain</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciclo</Label>
              <Select value={form.billing_cycle || 'monthly'} onValueChange={v => setForm({ ...form, billing_cycle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">monthly</SelectItem><SelectItem value="yearly">yearly</SelectItem>
                  <SelectItem value="one_time">one_time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>USD / mês</Label><Input type="number" step="0.01" value={form.monthly_usd ?? ''} onChange={e => setForm({ ...form, monthly_usd: e.target.value })} /></div>
            <div><Label>BRL / mês *</Label><Input type="number" step="0.01" value={form.monthly_brl ?? ''} onChange={e => setForm({ ...form, monthly_brl: e.target.value })} /></div>
            <div><Label>Câmbio USD→BRL</Label><Input type="number" step="0.0001" value={form.usd_brl_rate ?? ''} onChange={e => setForm({ ...form, usd_brl_rate: e.target.value })} placeholder="5.20" /></div>
            <div><Label>Início</Label><Input type="date" value={form.starts_on || ''} onChange={e => setForm({ ...form, starts_on: e.target.value })} /></div>
            <div><Label>Fim (opcional)</Label><Input type="date" value={form.ends_on || ''} onChange={e => setForm({ ...form, ends_on: e.target.value })} /></div>
            <div className="flex items-end gap-2"><Switch checked={!!form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label className="mb-1">Ativo</Label></div>
            <div className="col-span-2"><Label>Notas</Label><Textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- WhatsApp Rate Card (Meta / Uazapi por categoria) ---------------- */
function WhatsAppRatesTab() {
  const { rows, loading, reload } = useTable('whatsapp_message_rate_card', 'effective_from');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState<AnyRow>({});

  const openNew = () => { setEditing(null); setForm({ provider: 'meta_cloud', country_code: 'BR', category: 'marketing', effective_from: new Date().toISOString().slice(0,10) }); setOpen(true); };
  const openEdit = (r: AnyRow) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const submit = async () => {
    try {
      const p: AnyRow = {
        provider: form.provider || 'meta_cloud',
        country_code: form.country_code || 'BR',
        category: form.category,
        cost_brl: Number(form.cost_brl || 0),
        cost_usd: form.cost_usd ? Number(form.cost_usd) : null,
        usd_brl_rate: form.usd_brl_rate ? Number(form.usd_brl_rate) : null,
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
        notes: form.notes || null,
      };
      if (!p.category) { toast.error('Categoria obrigatória'); return; }
      await upsert('whatsapp_message_rate_card', p, editing?.id);
      toast.success(editing ? 'Atualizado' : 'Criado');
      setOpen(false); reload();
    } catch (e: any) { toast.error(e.message); }
  };
  const del = async (id: string) => {
    if (!confirm('Excluir tarifa?')) return;
    try { await remove('whatsapp_message_rate_card', id); toast.success('Excluído'); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Tarifa variável por categoria de conversa (marketing, utility, authentication, service). Usada para multiplicar <code className="font-mono">whatsapp_send_jobs.message_category</code>.
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova tarifa</Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead><TableHead>País</TableHead><TableHead>Categoria</TableHead>
              <TableHead className="text-right">USD</TableHead><TableHead className="text-right">BRL</TableHead>
              <TableHead>Vigente desde</TableHead><TableHead>Vigente até</TableHead><TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sem tarifas cadastradas.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline" className="text-xs">{r.provider}</Badge></TableCell>
                <TableCell className="text-xs">{r.country_code}</TableCell>
                <TableCell className="font-medium capitalize">{r.category}</TableCell>
                <TableCell className="text-right tabular-nums">{r.cost_usd ? `$${Number(r.cost_usd).toFixed(4)}` : '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.cost_brl, { maximumFractionDigits: 4 })}</TableCell>
                <TableCell className="text-xs font-mono">{r.effective_from}</TableCell>
                <TableCell className="text-xs font-mono">{r.effective_to || '—'}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} tarifa</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Select value={form.provider || 'meta_cloud'} onValueChange={v => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta_cloud">meta_cloud</SelectItem>
                  <SelectItem value="uazapi">uazapi</SelectItem>
                  <SelectItem value="twilio">twilio</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>País</Label><Input value={form.country_code || 'BR'} onChange={e => setForm({ ...form, country_code: e.target.value.toUpperCase() })} /></div>
            <div>
              <Label>Categoria *</Label>
              <Select value={form.category || ''} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">marketing</SelectItem>
                  <SelectItem value="utility">utility</SelectItem>
                  <SelectItem value="authentication">authentication</SelectItem>
                  <SelectItem value="service">service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Custo USD</Label><Input type="number" step="0.0001" value={form.cost_usd ?? ''} onChange={e => setForm({ ...form, cost_usd: e.target.value })} /></div>
            <div><Label>Custo BRL *</Label><Input type="number" step="0.0001" value={form.cost_brl ?? ''} onChange={e => setForm({ ...form, cost_brl: e.target.value })} /></div>
            <div><Label>Câmbio</Label><Input type="number" step="0.0001" value={form.usd_brl_rate ?? ''} onChange={e => setForm({ ...form, usd_brl_rate: e.target.value })} /></div>
            <div><Label>Vigente desde *</Label><Input type="date" value={form.effective_from || ''} onChange={e => setForm({ ...form, effective_from: e.target.value })} /></div>
            <div><Label>Vigente até</Label><Input type="date" value={form.effective_to || ''} onChange={e => setForm({ ...form, effective_to: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notas</Label><Textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- GCS Billing Daily ---------------- */
function GcsBillingTab() {
  const { rows, loading, reload } = useTable('gcs_billing_daily', 'billing_date');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState<AnyRow>({});

  const openNew = () => { setEditing(null); setForm({ billing_date: new Date().toISOString().slice(0,10), source: 'manual' }); setOpen(true); };
  const openEdit = (r: AnyRow) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const submit = async () => {
    try {
      const cost_storage = Number(form.cost_storage_brl || 0);
      const cost_ops = Number(form.cost_ops_brl || 0);
      const cost_egress = Number(form.cost_egress_brl || 0);
      const p: AnyRow = {
        billing_date: form.billing_date,
        bucket_name: form.bucket_name,
        storage_class: form.storage_class || null,
        region: form.region || null,
        tenant_id: form.tenant_id || null,
        storage_bytes_avg: Number(form.storage_bytes_avg || 0),
        class_a_ops: Number(form.class_a_ops || 0),
        class_b_ops: Number(form.class_b_ops || 0),
        egress_bytes: Number(form.egress_bytes || 0),
        cost_storage_brl: cost_storage,
        cost_ops_brl: cost_ops,
        cost_egress_brl: cost_egress,
        cost_total_brl: cost_storage + cost_ops + cost_egress,
        source: form.source || 'manual',
      };
      if (!p.bucket_name || !p.billing_date) { toast.error('bucket_name e billing_date obrigatórios'); return; }
      await upsert('gcs_billing_daily', p, editing?.id);
      toast.success(editing ? 'Atualizado' : 'Criado');
      setOpen(false); reload();
    } catch (e: any) { toast.error(e.message); }
  };
  const del = async (id: string) => {
    if (!confirm('Excluir linha?')) return;
    try { await remove('gcs_billing_daily', id); toast.success('Excluído'); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const total = rows.reduce((a, r) => a + Number(r.cost_total_brl || 0), 0);

  return (
    <div className="space-y-3">
      <Card className="p-3 border-info/40 bg-info/5 text-sm flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-medium text-foreground">Forma segura recomendada para popular GCS automaticamente:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-0.5 text-muted-foreground">
            <li>No GCP: <strong>Billing → Billing export → BigQuery</strong> (detailed usage). Cria dataset <code className="font-mono">billing_export</code>.</li>
            <li>Service account read-only com role <code className="font-mono">roles/bigquery.dataViewer</code> só no dataset de billing. Chave salva em secret <code className="font-mono">GCP_BILLING_SA_JSON</code>.</li>
            <li>Cron diário (edge function <code className="font-mono">gcs-billing-sync</code>) roda query agrupando por bucket/dia, converte USD→BRL via <code className="font-mono">platform_fixed_costs.usd_brl_rate</code> mais recente e faz upsert aqui.</li>
            <li>Enquanto isso, esta tela permite lançamento manual a partir do PDF da fatura.</li>
          </ol>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total carregado: <strong className="text-foreground">{brl(total)}</strong> · {rows.length} linhas
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo lançamento</Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Bucket</TableHead><TableHead>Classe</TableHead>
              <TableHead className="text-right">Storage</TableHead><TableHead className="text-right">Ops</TableHead>
              <TableHead className="text-right">Egress</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead>Fonte</TableHead><TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Sem dados de billing GCS.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-mono">{r.billing_date}</TableCell>
                <TableCell className="font-medium">{r.bucket_name}</TableCell>
                <TableCell className="text-xs">{r.storage_class || '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.cost_storage_brl)}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.cost_ops_brl)}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.cost_egress_brl)}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{brl(r.cost_total_brl)}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.source}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} lançamento GCS</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Data *</Label><Input type="date" value={form.billing_date || ''} onChange={e => setForm({ ...form, billing_date: e.target.value })} /></div>
            <div className="col-span-2"><Label>Bucket *</Label><Input value={form.bucket_name || ''} onChange={e => setForm({ ...form, bucket_name: e.target.value })} placeholder="uopa-media" /></div>
            <div><Label>Classe</Label><Input value={form.storage_class || ''} onChange={e => setForm({ ...form, storage_class: e.target.value })} placeholder="STANDARD" /></div>
            <div><Label>Região</Label><Input value={form.region || ''} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="southamerica-east1" /></div>
            <div><Label>Tenant (opcional)</Label><Input value={form.tenant_id || ''} onChange={e => setForm({ ...form, tenant_id: e.target.value })} placeholder="UUID" /></div>
            <div><Label>Storage médio (bytes)</Label><Input type="number" value={form.storage_bytes_avg ?? ''} onChange={e => setForm({ ...form, storage_bytes_avg: e.target.value })} /></div>
            <div><Label>Class A ops</Label><Input type="number" value={form.class_a_ops ?? ''} onChange={e => setForm({ ...form, class_a_ops: e.target.value })} /></div>
            <div><Label>Class B ops</Label><Input type="number" value={form.class_b_ops ?? ''} onChange={e => setForm({ ...form, class_b_ops: e.target.value })} /></div>
            <div><Label>Egress (bytes)</Label><Input type="number" value={form.egress_bytes ?? ''} onChange={e => setForm({ ...form, egress_bytes: e.target.value })} /></div>
            <div><Label>Custo storage BRL</Label><Input type="number" step="0.01" value={form.cost_storage_brl ?? ''} onChange={e => setForm({ ...form, cost_storage_brl: e.target.value })} /></div>
            <div><Label>Custo ops BRL</Label><Input type="number" step="0.01" value={form.cost_ops_brl ?? ''} onChange={e => setForm({ ...form, cost_ops_brl: e.target.value })} /></div>
            <div><Label>Custo egress BRL</Label><Input type="number" step="0.01" value={form.cost_egress_brl ?? ''} onChange={e => setForm({ ...form, cost_egress_brl: e.target.value })} /></div>
            <div>
              <Label>Fonte</Label>
              <Select value={form.source || 'manual'} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">manual</SelectItem>
                  <SelectItem value="bigquery_export">bigquery_export</SelectItem>
                  <SelectItem value="invoice_pdf">invoice_pdf</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Uazapi Instances Monthly Cost ---------------- */
function UazapiInstancesTab() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_instances' as never)
      .select('id,tenant_id,instance_name,provider,status,is_active,monthly_cost_brl')
      .order('instance_name', { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as AnyRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    const val = draft[id];
    if (val === undefined) return;
    const { error } = await (supabase as any).from('whatsapp_instances')
      .update({ monthly_cost_brl: Number(val || 0) }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Atualizado');
    setDraft(d => { const n = { ...d }; delete n[id]; return n; });
    load();
  };

  const total = rows.filter(r => r.is_active !== false).reduce((a, r) => a + Number(r.monthly_cost_brl || 0), 0);

  return (
    <div className="space-y-3">
      <Card className="p-3 border-info/40 bg-info/5 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 text-info flex-shrink-0" />
        <div>Custo fixo mensal por instância (uazapi/server dedicado). Multiplicado pelo número de instâncias ativas em <code className="font-mono">/finops/infra</code>.
          Total ativo: <strong className="text-foreground">{brl(total)}/mês</strong></div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instância</TableHead><TableHead>Tenant</TableHead><TableHead>Provider</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">BRL/mês</TableHead><TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem instâncias.</TableCell></TableRow>}
            {rows.map(r => {
              const dirty = draft[r.id] !== undefined && Number(draft[r.id]) !== Number(r.monthly_cost_brl || 0);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.instance_name || r.id.slice(0,8)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{(r.tenant_id || '').slice(0,8)}</TableCell>
                  <TableCell className="text-xs">{r.provider || '—'}</TableCell>
                  <TableCell>{r.is_active === false ? <Badge variant="outline">inativo</Badge> : <Badge className="bg-success/15 text-success border-success/30 text-xs">{r.status || 'ativo'}</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Input type="number" step="0.01" className="w-28 ml-auto text-right"
                      value={draft[r.id] ?? (r.monthly_cost_brl ?? '')}
                      onChange={e => setDraft(d => ({ ...d, [r.id]: e.target.value }))} />
                  </TableCell>
                  <TableCell><Button size="sm" disabled={!dirty} onClick={() => save(r.id)}>Salvar</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function FinOpsCostManagementPage() {
  const [tab, setTab] = useState('fixed');

  return (
    <FinOpsShell
      title="Custos Manuais"
      description="Cadastro de assinaturas SaaS, tarifas WhatsApp por categoria, billing diário do GCS e custo fixo por instância uazapi. Tudo soma direto no /finops/infra e no P&L."
      showPeriod={false}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />Recarregar
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="fixed" className="gap-1.5"><Server className="h-3.5 w-3.5" />SaaS / Fixos</TabsTrigger>
          <TabsTrigger value="wa" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="gcs" className="gap-1.5"><Cloud className="h-3.5 w-3.5" />GCS Billing</TabsTrigger>
          <TabsTrigger value="uazapi" className="gap-1.5"><Server className="h-3.5 w-3.5" />Uazapi</TabsTrigger>
        </TabsList>
        <TabsContent value="fixed" className="mt-4"><FixedCostsTab /></TabsContent>
        <TabsContent value="wa" className="mt-4"><WhatsAppRatesTab /></TabsContent>
        <TabsContent value="gcs" className="mt-4"><GcsBillingTab /></TabsContent>
        <TabsContent value="uazapi" className="mt-4"><UazapiInstancesTab /></TabsContent>
      </Tabs>
    </FinOpsShell>
  );
}

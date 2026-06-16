import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MasterOnlyGuard } from '@/components/finops/MasterOnlyGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Save, AlertTriangle } from 'lucide-react';
import { useCreditRates, useUpdateCreditRateMutation } from '@/hooks/credits/useCredits';
import { toast } from 'sonner';

export default function CreditRates() {
  const { data, isLoading } = useCreditRates();
  const update = useUpdateCreditRateMutation();
  const [drafts, setDrafts] = useState<Record<string, { credits_per_unit?: number; description?: string; is_active?: boolean }>>({});

  const setDraft = (id: string, patch: Record<string, unknown>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const save = async (id: string) => {
    const patch = drafts[id];
    if (!patch) return;
    try {
      await update.mutateAsync({ id, patch });
      toast.success('Tarifa atualizada — vigente em milissegundos');
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <MasterOnlyGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Tarifas de Créditos</h1>
            <Badge variant="outline" className="text-[10px]">Master only</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Tabela <code className="font-mono">credit_rates</code>. Toda alteração é lida em runtime pela função{' '}
            <code className="font-mono">debit_ai_credits</code> — efeito imediato no próximo evento, sem deploy.
          </p>

          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Alterações afetam <b>todos os tenants</b> imediatamente. Use com cautela.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operações tarifadas</CardTitle>
              <CardDescription>Preço em créditos por unidade da operação.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !data || data.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem tarifas cadastradas.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operação</TableHead>
                        <TableHead className="w-[140px]">Créditos / unidade</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px]">Ativo</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((r) => {
                        const d = drafts[r.id] || {};
                        const dirty = Object.keys(d).length > 0;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.operation_type}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                step="0.5"
                                className="h-8 w-28 font-mono"
                                value={d.credits_per_unit ?? r.credits_per_unit}
                                onChange={(e) => setDraft(r.id, { credits_per_unit: Number(e.target.value) })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8"
                                value={d.description ?? r.description ?? ''}
                                onChange={(e) => setDraft(r.id, { description: e.target.value })}
                                placeholder={r.unit_description || '—'}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={d.is_active ?? r.is_active ?? true}
                                onCheckedChange={(v) => setDraft(r.id, { is_active: v })}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={dirty ? 'default' : 'ghost'}
                                disabled={!dirty || update.isPending}
                                onClick={() => save(r.id)}
                                className="gap-1.5"
                              >
                                <Save className="h-3 w-3" />
                                {dirty ? 'Salvar' : 'OK'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </MasterOnlyGuard>
  );
}

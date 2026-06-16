import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, RotateCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useRechargeHistory, useReverseMutation } from '@/hooks/credits/useCredits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface Props { tenantId: string }

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function RechargeHistoryTable({ tenantId }: Props) {
  const { data, isLoading } = useRechargeHistory(tenantId);
  const reverse = useReverseMutation(tenantId);
  const [pending, setPending] = useState<{ id: string; label: string } | null>(null);
  const [reason, setReason] = useState('');

  const confirmReverse = async () => {
    if (!pending) return;
    if (reason.trim().length < 3) { toast.error('Motivo obrigatório'); return; }
    try {
      await reverse.mutateAsync({
        source_ledger_id: pending.id,
        reason: reason.trim(),
        idempotency_key: crypto.randomUUID(),
      });
      toast.success('Estorno realizado');
      setPending(null); setReason('');
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" /> Histórico de recargas
        </CardTitle>
        <CardDescription>Auditoria completa — recargas, ajustes e estornos do tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem recargas registradas.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Aplicado por</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => {
                  const meta = (r.metadata || {}) as Record<string, unknown>;
                  const isReversal = r.entry_type === 'admin_reversal';
                  const isPositive = r.credits_delta > 0;
                  const targetLabel = r.target_user?.full_name || r.target_user?.email || (r.user_id ? r.user_id.slice(0, 8) : '—');
                  const actorLabel = r.actor?.full_name || r.actor?.email || (r.created_by ? r.created_by.slice(0, 8) : '—');
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(r.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isReversal ? 'destructive' : 'secondary'} className="text-[10px]">
                          {r.entry_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                          {isPositive ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                          {' '}{isPositive ? '+' : ''}{fmt(r.credits_delta)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{targetLabel}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{actorLabel}</TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate" title={String(meta.reason ?? '')}>
                        {String(meta.reason ?? '—')}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isReversal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1"
                            onClick={() => setPending({ id: r.id, label: `${isPositive ? '+' : ''}${fmt(r.credits_delta)} para ${targetLabel}` })}
                          >
                            <RotateCcw className="h-3 w-3" /> Estornar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar recarga?</AlertDialogTitle>
            <AlertDialogDescription>
              Será criado um lançamento negativo para neutralizar <b>{pending?.label}</b>.
              Esta ação é registrada no ledger e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo do estorno (obrigatório)"
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReverse} disabled={reverse.isPending}>
              Estornar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

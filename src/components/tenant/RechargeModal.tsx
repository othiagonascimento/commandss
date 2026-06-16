import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Coins, User, Building2, Loader2 } from 'lucide-react';
import { useRechargeMutation } from '@/hooks/credits/useCredits';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  tenantName: string;
  userId?: string;
  userName?: string;
  defaultScope?: 'user' | 'tenant';
}

export function RechargeModal({
  open, onOpenChange, tenantId, tenantName, userId, userName, defaultScope = 'tenant',
}: Props) {
  const [scope, setScope] = useState<'user' | 'tenant'>(userId ? 'user' : defaultScope);
  const [credits, setCredits] = useState('');
  const [reason, setReason] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const recharge = useRechargeMutation(tenantId);

  useEffect(() => {
    if (open) {
      setIdempotencyKey(crypto.randomUUID());
      setCredits('');
      setReason('');
      setScope(userId ? 'user' : defaultScope);
    }
  }, [open, userId, defaultScope]);

  const submit = async () => {
    const n = Number(credits);
    if (!Number.isFinite(n) || n <= 0) { toast.error('Quantidade inválida'); return; }
    if (reason.trim().length < 3) { toast.error('Informe o motivo (mín. 3 caracteres)'); return; }
    if (scope === 'user' && !userId) { toast.error('Selecione um usuário'); return; }

    try {
      const res = await recharge.mutateAsync({
        scope,
        user_id: scope === 'user' ? userId : undefined,
        credits: n,
        reason: reason.trim(),
        idempotency_key: idempotencyKey,
      });
      toast.success(res?.idempotent ? 'Recarga já havia sido aplicada' : `+${n.toLocaleString('pt-BR')} créditos creditados`);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> Recarregar créditos
          </DialogTitle>
          <DialogDescription>
            Lançamento entra no <span className="font-mono">credit_ledger</span> e atualiza o saldo em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Escopo */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Destino</Label>
            <ToggleGroup
              type="single"
              value={scope}
              onValueChange={(v) => v && setScope(v as 'user' | 'tenant')}
              className="grid grid-cols-2"
            >
              <ToggleGroupItem value="tenant" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Tenant inteiro
              </ToggleGroupItem>
              <ToggleGroupItem value="user" disabled={!userId} className="gap-1.5">
                <User className="h-3.5 w-3.5" /> Usuário específico
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-[11px] text-muted-foreground">
              {scope === 'tenant'
                ? <>Crédito atribuído ao admin de <b>{tenantName}</b> (faturado no tenant).</>
                : userId
                  ? <>Crédito vai direto para <b>{userName || 'usuário selecionado'}</b>.</>
                  : 'Selecione um usuário na tabela para habilitar.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credits">Quantidade de créditos</Label>
            <Input
              id="credits"
              type="number"
              min={1}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="ex: 1000"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo da recarga</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ex: Pacote 1k contratado em 16/06, pagamento via Pix"
              rows={2}
            />
            <p className="text-[11px] text-muted-foreground">
              Forma de pagamento e valor em R$ são definidos pelo usuário do tenant (igual ao fluxo de plano).
            </p>
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
            idempotency_key: {idempotencyKey}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={recharge.isPending} className="gap-1.5">
            {recharge.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar recarga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

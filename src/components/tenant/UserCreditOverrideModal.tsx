import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings2, Trash2 } from 'lucide-react';
import { useSetUserOverrideMutation, useClearUserOverrideMutation } from '@/hooks/credits/useCredits';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  userId: string;
  userName: string;
  currentBase: number; // base efetiva atual (já considerando override existente)
  tenantBase: number;  // base do tenant (credits_per_user)
  hasOverride?: boolean;
}

export function UserCreditOverrideModal({
  open, onOpenChange, tenantId, userId, userName, currentBase, tenantBase, hasOverride,
}: Props) {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const setOverride = useSetUserOverrideMutation(tenantId);
  const clearOverride = useClearUserOverrideMutation(tenantId);

  useEffect(() => {
    if (open) {
      setValue(String(currentBase ?? tenantBase));
      setNotes('');
    }
  }, [open, currentBase, tenantBase]);

  const save = async () => {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) { toast.error('Valor inválido'); return; }
    try {
      await setOverride.mutateAsync({
        user_id: userId,
        monthly_credits_base: v,
        notes: notes.trim() || undefined,
      });
      toast.success('Override aplicado');
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const clear = async () => {
    try {
      await clearOverride.mutateAsync(userId);
      toast.success(`${userName} volta a usar a base do tenant (${tenantBase.toLocaleString('pt-BR')})`);
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Override de base mensal
          </DialogTitle>
          <DialogDescription>
            Define quantos créditos <b>{userName}</b> recebe por mês, sobrescrevendo a base do tenant
            (<span className="font-mono">{tenantBase.toLocaleString('pt-BR')}</span>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="base">Base mensal (créditos)</Label>
            <Input
              id="base"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Vale a partir do ciclo atual. O motor lê este valor em <span className="font-mono">get_user_effective_credit_base</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: usuário VIP — combinado em reunião 16/06"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          {hasOverride ? (
            <Button variant="outline" onClick={clear} disabled={clearOverride.isPending} className="gap-1.5">
              {clearOverride.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remover override
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={setOverride.isPending}>
              {setOverride.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

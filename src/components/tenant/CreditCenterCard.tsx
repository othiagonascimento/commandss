import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Zap, Plus, Settings, AlertTriangle, TrendingDown, Wallet, RefreshCw } from 'lucide-react';
import { useTenantCreditsFull, useTenantUsageRealtime, useSetTenantBaseMutation } from '@/hooks/credits/useCredits';
import { RechargeModal } from './RechargeModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  tenantId: string;
  tenantName: string;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function CreditCenterCard({ tenantId, tenantName }: Props) {
  useTenantUsageRealtime(tenantId);
  const { data, isLoading, refetch, isFetching } = useTenantCreditsFull(tenantId);
  const setBase = useSetTenantBaseMutation(tenantId);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [editingBase, setEditingBase] = useState(false);
  const [baseDraft, setBaseDraft] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem dados de créditos</CardTitle>
          <CardDescription>Ainda não há ciclo de billing ativo para este tenant.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pct = data.total_available > 0
    ? Math.min(100, (data.used / data.total_available) * 100)
    : 0;
  const isCritical = data.total_available > 0 && data.remaining / data.total_available < 0.05;
  const isWarning = !isCritical && data.total_available > 0 && data.remaining / data.total_available < 0.20;

  const startEditBase = () => {
    setBaseDraft(String(data.per_user_base));
    setEditingBase(true);
  };
  const saveBase = async () => {
    const v = Number(baseDraft);
    if (!Number.isFinite(v) || v < 0) { toast.error('Valor inválido'); return; }
    try {
      await setBase.mutateAsync(v);
      toast.success('Base por usuário atualizada');
      setEditingBase(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <>
      <Card className={cn(
        'overflow-hidden',
        isCritical && 'border-destructive/40',
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-primary" />
                Centro de Créditos
              </CardTitle>
              <CardDescription className="font-mono text-[11px]">
                Ciclo {data.cycle_start} → {data.cycle_end} · {data.days_remaining} dias restantes
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching} title="Atualizar">
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>
              <Button size="sm" onClick={() => setRechargeOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Recarregar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Saldo grande */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">{fmt(data.remaining)}</span>
                <span className="text-xs text-muted-foreground">de {fmt(data.total_available)} disponíveis</span>
              </div>
              <Badge variant={isCritical ? 'destructive' : isWarning ? 'outline' : 'secondary'} className="font-mono">
                {pct.toFixed(0)}% usado
              </Badge>
            </div>
            <Progress value={pct} className={cn('h-2', isCritical && '[&>div]:bg-destructive')} />
            <p className="mt-1 text-[11px] text-muted-foreground font-mono">
              Consumido: {fmt(data.used)} · Burn: {fmt(Math.round(data.burn_per_day))}/dia
              {data.projected_days_left !== null && (
                <> · Projeção: termina em {data.projected_days_left}d</>
              )}
            </p>
          </div>

          {/* Composição */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Coins className="h-3 w-3" /> Base mensal
              </div>
              <div className="font-mono font-semibold text-sm tabular-nums">{fmt(data.total_base)}</div>
              <div className="text-[10px] text-muted-foreground">
                {data.active_users} usuário{data.active_users !== 1 && 's'} × {fmt(data.per_user_base)}
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <RefreshCw className="h-3 w-3" /> Rollover
              </div>
              <div className="font-mono font-semibold text-sm tabular-nums">+{fmt(data.rollover_in)}</div>
              <div className="text-[10px] text-muted-foreground">Trazido do mês anterior</div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Zap className="h-3 w-3" /> Recargas
              </div>
              <div className="font-mono font-semibold text-sm tabular-nums">
                +{fmt(data.extras_recharges)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.extras_reversal !== 0 && <>Estornos: {fmt(data.extras_reversal)}</>}
                {data.extras_reversal === 0 && 'Pacotes comprados'}
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <TrendingDown className="h-3 w-3" /> Consumido
              </div>
              <div className="font-mono font-semibold text-sm tabular-nums">−{fmt(data.used)}</div>
              <div className="text-[10px] text-muted-foreground">no ciclo</div>
            </div>
          </div>

          {/* Base por usuário (editor inline) */}
          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border p-3">
            <div className="text-xs">
              <div className="text-muted-foreground">Base mensal por usuário ativo</div>
              {!editingBase && (
                <div className="font-mono text-sm font-semibold mt-0.5">{fmt(data.per_user_base)} créditos</div>
              )}
              {editingBase && (
                <div className="flex items-center gap-2 mt-1">
                  <Label className="sr-only" htmlFor="base">Base</Label>
                  <Input
                    id="base"
                    type="number"
                    min={0}
                    value={baseDraft}
                    onChange={(e) => setBaseDraft(e.target.value)}
                    className="h-8 w-28 font-mono"
                  />
                  <Button size="sm" onClick={saveBase} disabled={setBase.isPending}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingBase(false)}>Cancelar</Button>
                </div>
              )}
            </div>
            {!editingBase && (
              <Button variant="outline" size="sm" onClick={startEditBase} className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Alterar
              </Button>
            )}
          </div>

          {/* Banner crítico */}
          {isCritical && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-destructive">Saldo crítico</p>
                <p className="text-muted-foreground">
                  {tenantName} está com menos de 5% do saldo do ciclo. Recomende uma recarga.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RechargeModal
        open={rechargeOpen}
        onOpenChange={setRechargeOpen}
        tenantId={tenantId}
        tenantName={tenantName}
        defaultScope="tenant"
      />
    </>
  );
}

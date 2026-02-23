import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts, type AlertRecord } from '@/hooks/useAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityConfig = {
  critical: { color: 'bg-destructive text-destructive-foreground', borderColor: 'border-destructive/50', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'bg-amber-500/10 text-amber-600', borderColor: 'border-amber-500/40', icon: AlertTriangle, label: 'Atenção' },
  info: { color: 'bg-primary/10 text-primary', borderColor: 'border-border', icon: Activity, label: 'Info' },
};

const alertTypeLabels: Record<string, string> = {
  queue_overload: 'Fila Sobrecarregada',
  channel_down: 'Canal Desconectado',
  ai_leak: 'Vazamento de IA',
  trial_expiring: 'Trial Expirando',
  limit_reached: 'Limite Atingido',
  cron_failure: 'Cron Falhando',
  security_alert: 'Segurança',
  user_inconsistency: 'Inconsistência',
};

const reasonLabels: Record<string, string> = {
  manual_fix: 'Corrigido manualmente',
  false_positive: 'Falso positivo',
  auto_resolved: 'Resolvido automaticamente',
  escalated: 'Escalado',
};

export function OpsAlertsWidget() {
  const navigate = useNavigate();
  const { alerts, isLoading, resolve, isResolving } = useAlerts();
  const [alertToResolve, setAlertToResolve] = useState<AlertRecord | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveReason, setResolveReason] = useState('');

  const topAlerts = alerts.slice(0, 5);

  const handleResolve = () => {
    if (!alertToResolve || !resolveNotes.trim() || !resolveReason) return;
    resolve(
      { alertId: alertToResolve.id, notes: resolveNotes.trim(), reason: resolveReason },
      {
        onSuccess: () => {
          setAlertToResolve(null);
          setResolveNotes('');
          setResolveReason('');
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Alertas Operacionais</CardTitle>
            <CardDescription>
              {alerts.length === 0 ? 'Tudo operacional' : `${alerts.length} alerta(s) ativo(s)`}
            </CardDescription>
          </div>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alerts.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : topAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm">Nenhum alerta ativo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topAlerts.map((alert) => {
                const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
                const Icon = config.icon;
                const tenantName = (alert.metadata?.tenant_name as string) || null;
                return (
                  <div
                    key={alert.id}
                    className={cn('flex items-start gap-3 p-3 rounded-lg border-2 hover:bg-accent/30 transition-colors', config.borderColor)}
                  >
                    <div className={cn('p-1 rounded mt-0.5', config.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {alertTypeLabels[alert.alert_type] || alert.alert_type}
                        </Badge>
                      </div>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {tenantName && (
                          <span><span className="font-medium text-foreground">Tenant:</span> {tenantName}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-7 text-xs"
                      onClick={() => {
                        setAlertToResolve(alert);
                        setResolveNotes('');
                        setResolveReason('');
                      }}
                      disabled={isResolving}
                    >
                      Resolver
                    </Button>
                  </div>
                );
              })}
              {alerts.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/operations')}
                >
                  Ver todos ({alerts.length}) <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!alertToResolve} onOpenChange={(open) => { if (!open) setAlertToResolve(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Descreva a ação tomada. Isso ficará registrado no histórico.
            </DialogDescription>
          </DialogHeader>
          {alertToResolve && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted space-y-1.5 text-sm">
                <div><span className="font-medium">Tipo:</span> {alertTypeLabels[alertToResolve.alert_type] || alertToResolve.alert_type}</div>
                <div><span className="font-medium">Título:</span> {alertToResolve.title}</div>
                {alertToResolve.description && (
                  <div><span className="font-medium">Descrição:</span> {alertToResolve.description}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Motivo da resolução *</Label>
                <Select value={resolveReason} onValueChange={setResolveReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reasonLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>O que foi feito? *</Label>
                <Textarea
                  placeholder='Ex: "Atribuído role agent aos 6 usuários via SQL"'
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertToResolve(null)}>Cancelar</Button>
            <Button onClick={handleResolve} disabled={!resolveNotes.trim() || !resolveReason || isResolving}>
              {isResolving ? 'Resolvendo...' : 'Confirmar Resolução'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

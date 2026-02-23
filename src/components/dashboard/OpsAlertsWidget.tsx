import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '@/hooks/useAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityConfig = {
  critical: { color: 'bg-destructive text-destructive-foreground', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'bg-amber-500/10 text-amber-600', icon: AlertTriangle, label: 'Atenção' },
  info: { color: 'bg-primary/10 text-primary', icon: AlertTriangle, label: 'Info' },
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

type Alert = {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  tenant_id: string | null;
  user_id: string | null;
  created_at: string;
};

export function OpsAlertsWidget() {
  const navigate = useNavigate();
  const { alerts, isLoading, resolve, isResolving } = useAlerts();
  const [alertToResolve, setAlertToResolve] = useState<Alert | null>(null);

  const topAlerts = alerts.slice(0, 5);

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
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
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
                      onClick={() => setAlertToResolve(alert)}
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

      {/* Resolve Confirmation Dialog */}
      <AlertDialog open={!!alertToResolve} onOpenChange={(open) => !open && setAlertToResolve(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolver alerta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirme que deseja marcar este alerta como resolvido:</p>
                {alertToResolve && (
                  <div className="p-3 rounded-lg bg-muted space-y-2 text-sm">
                    <div><span className="font-medium">Tipo:</span> {alertTypeLabels[alertToResolve.alert_type] || alertToResolve.alert_type}</div>
                    <div><span className="font-medium">Título:</span> {alertToResolve.title}</div>
                    {alertToResolve.description && (
                      <div><span className="font-medium">Descrição:</span> {alertToResolve.description}</div>
                    )}
                    {(alertToResolve.metadata as Record<string, unknown>)?.tenant_name && (
                      <div><span className="font-medium">Tenant:</span> {(alertToResolve.metadata as Record<string, unknown>).tenant_name as string}</div>
                    )}
                    {alertToResolve.tenant_id && !(alertToResolve.metadata as Record<string, unknown>)?.tenant_name && (
                      <div><span className="font-medium">Tenant ID:</span> {alertToResolve.tenant_id}</div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (alertToResolve) {
                  resolve(alertToResolve.id);
                  setAlertToResolve(null);
                }
              }}
            >
              Confirmar Resolução
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

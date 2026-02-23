import { useNavigate } from 'react-router-dom';
import { useAlerts } from '@/hooks/useAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityConfig = {
  critical: { color: 'bg-destructive text-destructive-foreground', icon: ShieldAlert },
  warning: { color: 'bg-amber-500/10 text-amber-600', icon: AlertTriangle },
  info: { color: 'bg-primary/10 text-primary', icon: AlertTriangle },
};

export function OpsAlertsWidget() {
  const navigate = useNavigate();
  const { alerts, isLoading, resolve, isResolving } = useAlerts();

  const topAlerts = alerts.slice(0, 5);

  return (
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
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                >
                  <div className={cn('p-1 rounded', config.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 text-xs"
                    onClick={() => resolve(alert.id)}
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
  );
}

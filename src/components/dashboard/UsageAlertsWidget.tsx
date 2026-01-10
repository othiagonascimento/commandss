import { useQuery } from '@tanstack/react-query';
import { usageApi, UsageAlertsResponse } from '@/services/masterApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  TrendingUp, 
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function UsageAlertsWidget() {
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage-alerts'],
    queryFn: async () => {
      const result = await usageApi.getAlerts();
      return result.data as UsageAlertsResponse | null;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const alerts = data?.data || [];
  const totalWithAlerts = alerts.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count critical (more than 3 alerts) vs warning
  const criticalTenants = alerts.filter(a => a.alerts.length >= 3);
  const warningTenants = alerts.filter(a => a.alerts.length < 3 && a.alerts.length > 0);

  return (
    <Card className={cn(
      criticalTenants.length > 0 && 'border-destructive/50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              criticalTenants.length > 0 ? "text-destructive" : "text-warning"
            )} />
            <CardTitle className="text-base">Alertas de Uso</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {totalWithAlerts > 0 && (
              <Badge variant={criticalTenants.length > 0 ? 'destructive' : 'secondary'}>
                {totalWithAlerts} {totalWithAlerts === 1 ? 'tenant' : 'tenants'}
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Tenants próximos ou acima dos limites
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalWithAlerts === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Todos os tenants dentro dos limites</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Critical tenants first */}
            {criticalTenants.slice(0, 3).map((tenant) => (
              <AlertTenantItem 
                key={tenant.id} 
                tenant={tenant} 
                isCritical 
                navigate={navigate} 
              />
            ))}
            
            {/* Then warning tenants */}
            {warningTenants.slice(0, 3 - criticalTenants.length).map((tenant) => (
              <AlertTenantItem 
                key={tenant.id} 
                tenant={tenant} 
                isCritical={false}
                navigate={navigate} 
              />
            ))}

            {/* Show more link if many alerts */}
            {totalWithAlerts > 3 && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => navigate('/tenant-health')}
              >
                Ver todos os {totalWithAlerts} tenants com alertas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertTenantItem({ 
  tenant,
  isCritical,
  navigate 
}: { 
  tenant: { id: string; name: string; subdomain: string; alerts: string[] };
  isCritical: boolean;
  navigate: (path: string) => void;
}) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        "hover:bg-muted/50",
        isCritical ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
      )}
      onClick={() => navigate(`/tenants/${tenant.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{tenant.name}</span>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs",
            isCritical ? "border-destructive text-destructive" : "border-warning text-warning"
          )}
        >
          {tenant.alerts.length} {tenant.alerts.length === 1 ? 'alerta' : 'alertas'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {tenant.subdomain}.uopa.com.br
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {tenant.alerts.slice(0, 3).map((alert, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {alert}
          </Badge>
        ))}
        {tenant.alerts.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{tenant.alerts.length - 3}
          </Badge>
        )}
      </div>
    </div>
  );
}

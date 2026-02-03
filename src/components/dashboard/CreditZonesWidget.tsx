import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantCreditStatus {
  tenant_id: string;
  tenant_name: string;
  credits_used: number;
  credits_limit: number;
  usage_percent: number;
  zone: 'green' | 'yellow' | 'red';
  is_degraded: boolean;
}

interface ZoneSummary {
  green: number;
  yellow: number;
  red: number;
  degradedTenants: TenantCreditStatus[];
}

export function CreditZonesWidget() {
  const { data: zoneSummary, isLoading, error } = useQuery({
    queryKey: ['credit-zones-summary'],
    queryFn: async (): Promise<ZoneSummary> => {
      // Get all tenant usage for current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const { data: tenantUsages, error: usageError } = await supabase
        .from('tenant_usage')
        .select(`
          tenant_id,
          ai_credits_used,
          tenants:tenant_id (
            id,
            name,
            limit_ai_credits_monthly
          )
        `)
        .eq('period_start', periodStart);

      if (usageError) throw usageError;

      // Calculate zones
      let green = 0;
      let yellow = 0;
      let red = 0;
      const degradedTenants: TenantCreditStatus[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tenantUsages || []).forEach((usage: any) => {
        const tenant = usage.tenants;
        if (!tenant) return;

        const creditsUsed = usage.ai_credits_used || 0;
        const creditsLimit = tenant.limit_ai_credits_monthly || 500;
        const usagePercent = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;
        
        let zone: 'green' | 'yellow' | 'red' = 'green';
        let isDegraded = false;

        if (usagePercent <= 100) {
          zone = 'green';
          green++;
        } else if (usagePercent <= 115) {
          zone = 'yellow';
          yellow++;
        } else {
          zone = 'red';
          red++;
          isDegraded = true;
          degradedTenants.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name || 'Sem nome',
            credits_used: creditsUsed,
            credits_limit: creditsLimit,
            usage_percent: usagePercent,
            zone,
            is_degraded: isDegraded,
          });
        }
      });

      // Sort degraded tenants by usage percent (highest first)
      degradedTenants.sort((a, b) => b.usage_percent - a.usage_percent);

      return { green, yellow, red, degradedTenants };
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-4">
            <Skeleton className="h-20 w-24" />
            <Skeleton className="h-20 w-24" />
            <Skeleton className="h-20 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar zonas de crédito</p>
        </CardContent>
      </Card>
    );
  }

  const totalTenants = (zoneSummary?.green || 0) + (zoneSummary?.yellow || 0) + (zoneSummary?.red || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Saúde dos Créditos
            </CardTitle>
            <CardDescription>Status de consumo dos tenants</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {totalTenants} tenants
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Green Zone */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1" />
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {zoneSummary?.green || 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verde</span>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-500">0-100%</span>
          </div>

          {/* Yellow Zone */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1" />
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {zoneSummary?.yellow || 0}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Amarelo</span>
            <span className="text-[10px] text-amber-500 dark:text-amber-500">100-115%</span>
          </div>

          {/* Red Zone */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
            <span className="text-2xl font-bold text-red-700 dark:text-red-300">
              {zoneSummary?.red || 0}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Vermelho</span>
            <span className="text-[10px] text-red-500 dark:text-red-500">&gt;115%</span>
          </div>
        </div>

        {/* Degraded Tenants List */}
        {zoneSummary?.degradedTenants && zoneSummary.degradedTenants.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                Tenants em modo degradado ({zoneSummary.degradedTenants.length})
              </span>
            </div>
            <ScrollArea className="h-[100px]">
              <div className="space-y-2">
                {zoneSummary.degradedTenants.slice(0, 5).map((tenant) => (
                  <div 
                    key={tenant.tenant_id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-red-50 dark:bg-red-950/20"
                  >
                    <span className="text-foreground truncate max-w-[150px]">
                      {tenant.tenant_name}
                    </span>
                    <Badge 
                      variant="destructive" 
                      className="font-mono text-xs"
                    >
                      {tenant.usage_percent.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* All Good State */}
        {(!zoneSummary?.degradedTenants || zoneSummary.degradedTenants.length === 0) && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Nenhum tenant em modo degradado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

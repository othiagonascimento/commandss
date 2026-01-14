import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UsageSummary {
  logs: Array<{
    tenant_id: string;
    user_id: string;
    provider: string;
    total_tokens: number;
    cost_brl: string;
  }>;
  summary: {
    totalLogs: number;
    totalTokens: number;
    totalCostUsd: number;
    totalCostBrl: number;
    byProvider: Record<string, { count: number; tokens: number; costBrl: number }>;
  };
}

export function APICostsWidget() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['api-costs-widget'],
    queryFn: async () => {
      // Get current month usage
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data, error } = await supabase.functions.invoke<UsageSummary>('log-api-usage', {
        method: 'GET',
        body: null,
      });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Get tenant names for top consumers
  const { data: tenants } = useQuery({
    queryKey: ['tenants-for-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {
    totalLogs: 0,
    totalTokens: 0,
    totalCostBrl: 0,
    byProvider: {},
  };

  // Calculate top tenants by cost
  const tenantCosts = data?.logs?.reduce((acc, log) => {
    if (!acc[log.tenant_id]) {
      acc[log.tenant_id] = { tokens: 0, cost: 0 };
    }
    acc[log.tenant_id].tokens += log.total_tokens || 0;
    acc[log.tenant_id].cost += parseFloat(log.cost_brl || '0');
    return acc;
  }, {} as Record<string, { tokens: number; cost: number }>) || {};

  const topTenants = Object.entries(tenantCosts)
    .map(([id, stats]) => ({
      id,
      name: tenants?.find(t => t.id === id)?.name || 'Desconhecido',
      ...stats,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const hasData = summary.totalLogs > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Consumo de Créditos
          </CardTitle>
          <CardDescription>Créditos consumidos no mês</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/ai-diagnostics')}>
          Diagnóstico
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground">
            <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum consumo registrado este mês</p>
            <p className="text-xs mt-1">Os custos aparecerão conforme as APIs forem usadas</p>
          </div>
        ) : (
          <>
            {/* Summary Stats - Credits First */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(Math.round(summary.totalCostBrl * 100))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Custo (R$)</p>
                <p className="text-lg font-bold">R$ {summary.totalCostBrl.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chamadas</p>
                <p className="text-lg font-bold">{summary.totalLogs}</p>
              </div>
            </div>

            {/* Provider Breakdown */}
            {Object.keys(summary.byProvider).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Por Provedor</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(summary.byProvider)
                    .sort(([, a], [, b]) => b.costBrl - a.costBrl)
                    .map(([provider, stats]) => (
                      <div
                        key={provider}
                        className="p-2 rounded-lg bg-muted text-center"
                      >
                        <Badge variant="outline" className="capitalize mb-1">
                          {provider}
                        </Badge>
                        <p className="text-sm font-medium">{formatNumber(Math.round(stats.costBrl * 100))} cr</p>
                        <p className="text-xs text-muted-foreground">R$ {stats.costBrl.toFixed(2)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Tenants */}
            {topTenants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Top Consumidores</p>
                <div className="space-y-1">
                  {topTenants.slice(0, 3).map((tenant, index) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {tenant.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(Math.round(tenant.cost * 100))} créditos</p>
                        <p className="text-xs text-muted-foreground">R$ {tenant.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

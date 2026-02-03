import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins,
  Cpu,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalCreditsSummary {
  total_credits_consumed: number;
  total_cost_brl: number;
  total_api_calls: number;
  total_tenants_with_usage: number;
}

interface TopConsumer {
  tenant_id: string;
  tenant_name: string;
  credits_consumed: number;
  cost_brl: number;
  api_calls: number;
}

export function APICostsWidget() {
  const navigate = useNavigate();

  // Fetch global credits summary via RPC (external Supabase functions not in types)
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['global-credits-summary'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_global_credits_summary');
      if (error) throw error;
      const result = data as unknown as GlobalCreditsSummary[];
      return result?.[0] || null;
    },
    refetchInterval: 60000,
    retry: 1,
  });

  // Fetch top consumers via RPC
  const { 
    data: topConsumers, 
    isLoading: consumersLoading,
    error: consumersError,
    refetch: refetchConsumers
  } = useQuery({
    queryKey: ['top-credit-consumers'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_top_credit_consumers', { 
        limit_count: 5 
      });
      if (error) throw error;
      return (data as unknown as TopConsumer[]) || [];
    },
    refetchInterval: 60000,
    retry: 1,
  });

  const isLoading = summaryLoading || consumersLoading;
  const hasError = summaryError || consumersError;
  const errorMessage = (summaryError as Error)?.message || (consumersError as Error)?.message;
  
  const handleRetry = () => {
    refetchSummary();
    refetchConsumers();
  };

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

  // Error state - show explicit error message
  if (hasError) {
    const isRPCError = errorMessage?.includes('42702') || errorMessage?.includes('ambiguous');
    return (
      <Card className="border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Erro ao carregar consumo
            </CardTitle>
            <CardDescription className="text-destructive">
              Falha na RPC do Supabase externo
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-xs">
            RPC Error
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-mono break-all">
              {errorMessage || 'Erro desconhecido'}
            </p>
          </div>
          {isRPCError && (
            <p className="text-xs text-muted-foreground">
              💡 Dica: Execute o SQL corrigido em <code className="bg-muted px-1 rounded">docs/sql/credits_rpc_functions.sql</code> no Supabase Dashboard
            </p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const hasData = summary && summary.total_credits_consumed > 0;

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
                  {formatNumber(summary.total_credits_consumed)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Custo (R$)</p>
                <p className="text-lg font-bold">R$ {summary.total_cost_brl.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chamadas</p>
                <p className="text-lg font-bold">{formatNumber(summary.total_api_calls)}</p>
              </div>
            </div>

            {/* Tenants with usage */}
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Tenants com consumo</p>
              <p className="text-lg font-bold">{summary.total_tenants_with_usage}</p>
            </div>

            {/* Top Tenants */}
            {topConsumers && topConsumers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Top Consumidores</p>
                <div className="space-y-1">
                  {topConsumers.slice(0, 3).map((tenant, index) => (
                    <div
                      key={tenant.tenant_id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate(`/tenants/${tenant.tenant_id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {tenant.tenant_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(tenant.credits_consumed)} créditos</p>
                        <p className="text-xs text-muted-foreground">R$ {tenant.cost_brl.toFixed(2)}</p>
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

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Coins,
  Cpu,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiAdvancedApi } from '@/services/masterApi';

export function APICostsWidget() {
  const navigate = useNavigate();

  const { 
    data: aiData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['ai-advanced-widget'],
    queryFn: async () => {
      const result = await aiAdvancedApi.get(30);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 120000,
    retry: false,
    meta: { suppressError: true },
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

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Erro ao carregar consumo
            </CardTitle>
            <CardDescription className="text-destructive">
              Falha ao buscar dados de IA do CRM
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-mono break-all">
              {(error as Error)?.message || 'Erro desconhecido'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
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

  const summary = aiData?.summary;
  const tenants = aiData?.tenants;
  const hasData = summary && summary.total_credits > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Consumo de Créditos
          </CardTitle>
          <CardDescription>Créditos consumidos nos últimos 30 dias</CardDescription>
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
            <p className="text-sm">Nenhum consumo registrado</p>
            <p className="text-xs mt-1">Os custos aparecerão conforme as APIs forem usadas</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(summary.total_credits)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mensagens</p>
                <p className="text-lg font-bold">{formatNumber(summary.total_messages)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Latência</p>
                <p className="text-lg font-bold">{summary.avg_latency_ms}ms</p>
              </div>
            </div>

            {/* Feedback & Fallbacks */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Fallbacks</p>
                <p className="text-lg font-bold">{summary.fallbacks}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Bloqueios</p>
                <p className="text-lg font-bold">{summary.blocks}</p>
              </div>
            </div>

            {/* Top Tenants */}
            {tenants && tenants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Top Consumidores</p>
                <div className="space-y-1">
                  {tenants.slice(0, 3).map((tenant, index) => (
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
                        <p className="text-sm font-medium">{formatNumber(tenant.credits)} créditos</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(tenant.messages)} msgs</p>
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

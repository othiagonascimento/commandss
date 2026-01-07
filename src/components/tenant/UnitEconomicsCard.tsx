import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Cpu,
  HardDrive,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitEconomicsCardProps {
  tenantId: string;
}

export function UnitEconomicsCard({ tenantId }: UnitEconomicsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['unit-economics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('unit-economics', {
        method: 'GET',
      });
      if (error) throw error;
      
      // Find this tenant's economics
      const tenantEconomics = data.economics?.find(
        (e: { tenant: { id: string } }) => e.tenant.id === tenantId
      );
      return tenantEconomics;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Unit Economics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dados de uso não disponíveis para este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { revenue, costs, usage, margin } = data;

  return (
    <Card className={cn(margin.isNegative && 'border-destructive')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Unit Economics
          </CardTitle>
          {margin.isNegative && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Margem Negativa
            </Badge>
          )}
        </div>
        <CardDescription>Receita vs. Custos do mês</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue & Margin */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-lg font-bold text-success">
              R$ {revenue.total.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Custos</p>
            <p className="text-lg font-bold text-destructive">
              R$ {costs.total.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Margem</p>
            <div className="flex items-center gap-1">
              {margin.value >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <p className={cn(
                'text-lg font-bold',
                margin.value >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {margin.percent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Detalhamento de Custos</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Cpu className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">IA:</span>
              <span className="font-medium ml-auto">R$ {costs.ai.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <HardDrive className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Storage:</span>
              <span className="font-medium ml-auto">R$ {costs.storage.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <MessageSquare className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Msgs:</span>
              <span className="font-medium ml-auto">R$ {costs.messages.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <DollarSign className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Base:</span>
              <span className="font-medium ml-auto">R$ {costs.infra.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Consumo</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">
              {(usage.aiTokens / 1000).toFixed(0)}K tokens IA
            </Badge>
            <Badge variant="outline">
              {(usage.storageMb / 1024).toFixed(2)} GB storage
            </Badge>
            <Badge variant="outline">
              {usage.messagesSent} mensagens
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

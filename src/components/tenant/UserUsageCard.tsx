import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Coins, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserUsageCardProps {
  userId: string;
  tenantId: string;
  userName?: string;
  limits?: {
    ai_tokens_monthly?: number | null;
    messages_monthly?: number | null;
  } | null;
}

interface ApiUsageLog {
  user_id: string;
  tenant_id: string;
  provider: string;
  model: string;
  total_tokens: number;
  cost_brl: string;
  created_at: string;
}

interface UsageSummary {
  logs: ApiUsageLog[];
  summary: {
    totalLogs: number;
    totalTokens: number;
    totalCostUsd: number;
    totalCostBrl: number;
    byProvider: Record<string, { count: number; tokens: number; costBrl: number }>;
  };
}

export function UserUsageCard({ userId, tenantId, userName, limits }: UserUsageCardProps) {
  // Get current month
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['user-api-usage', userId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<UsageSummary>('log-api-usage', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Parse response - the invoke returns the full response
      if (error) throw error;
      
      // Filter by user if we have logs
      if (data?.logs) {
        const userLogs = data.logs.filter((log: { user_id?: string }) => 
          log.user_id === userId
        );
        
        const totalCostBrl = userLogs.reduce((sum: number, log: { cost_brl?: string }) => 
          sum + parseFloat(log.cost_brl || '0'), 0
        );
        const totalTokens = userLogs.reduce((sum: number, log: { total_tokens?: number }) => 
          sum + (log.total_tokens || 0), 0
        );

        // Group by provider
        const byProvider = userLogs.reduce((acc: Record<string, { count: number; tokens: number; costBrl: number }>, log: { provider: string; total_tokens?: number; cost_brl?: string }) => {
          if (!acc[log.provider]) {
            acc[log.provider] = { count: 0, tokens: 0, costBrl: 0 };
          }
          acc[log.provider].count++;
          acc[log.provider].tokens += log.total_tokens || 0;
          acc[log.provider].costBrl += parseFloat(log.cost_brl || '0');
          return acc;
        }, {});

        return {
          logs: userLogs,
          summary: {
            totalLogs: userLogs.length,
            totalTokens,
            totalCostBrl,
            totalCostUsd: 0,
            byProvider,
          },
        };
      }
      
      return data;
    },
  });

  // Also get user_usage for cached totals
  const { data: userUsage } = useQuery({
    queryKey: ['user-usage-record', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
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

  // Calculate credits (1 credit = R$ 0.01)
  const creditsConsumed = Math.round(summary.totalCostBrl * 100);

  // Use user_usage if available (more accurate), otherwise use logs summary
  const tokensUsed = userUsage?.ai_tokens_month || summary.totalTokens;
  const apiCalls = userUsage?.api_calls_month || summary.totalLogs;
  const creditsUsed = userUsage?.credits_consumed_month || creditsConsumed;

  // Calculate percentages if limits exist - now based on credits
  const creditLimit = (limits?.ai_tokens_monthly || 100000) / 10; // Convert token limit to credit equivalent
  const creditPercent = Math.min((creditsUsed / creditLimit) * 100, 100);
  const isNearLimit = creditPercent > 80;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Card className={cn(isNearLimit && 'border-warning')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Uso de API
          </CardTitle>
          {isNearLimit && (
            <Badge variant="outline" className="text-warning border-warning">
              Próximo do limite
            </Badge>
          )}
        </div>
        {userName && (
          <CardDescription>{userName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats - Credits First */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Coins className="h-3 w-3" />
              Créditos
            </div>
            <p className="text-lg font-bold text-primary">{formatNumber(creditsUsed)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Chamadas
            </div>
            <p className="text-lg font-bold">{apiCalls}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Tokens
            </div>
            <p className="text-lg font-bold">
              {formatNumber(tokensUsed)}
            </p>
          </div>
        </div>

        {/* Credit Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Uso de créditos</span>
            <span className={cn(isNearLimit && 'text-warning')}>
              {formatNumber(creditsUsed)} / {formatNumber(creditLimit)}
            </span>
          </div>
          <Progress 
            value={creditPercent} 
            className={cn(
              "h-2",
              isNearLimit && "[&>div]:bg-warning"
            )}
          />
        </div>

        {/* Provider Breakdown */}
        {Object.keys(summary.byProvider).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Por Provedor
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byProvider).map(([provider, stats]) => (
                <Badge key={provider} variant="secondary" className="capitalize">
                  {provider}: {formatNumber(stats.tokens)} ({stats.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

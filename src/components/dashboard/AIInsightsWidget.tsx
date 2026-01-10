import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Target,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Clock } from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
}

interface AIInsightsResponse {
  success: boolean;
  type: string;
  data: {
    insights: Insight[];
    summary?: string;
  };
  generatedAt: string;
}

const insightIcons: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  action: Target,
};

const insightColors: Record<string, string> = {
  success: 'text-success border-success/30 bg-success/5',
  warning: 'text-warning border-warning/30 bg-warning/5',
  info: 'text-primary border-primary/30 bg-primary/5',
  action: 'text-accent-foreground border-accent bg-accent/5',
};

export function AIInsightsWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights', 'dashboard_summary'],
    queryFn: async (): Promise<AIInsightsResponse | null> => {
      const { data, error } = await supabase.functions.invoke('master-ai-insights', {
        body: { type: 'dashboard_summary' },
      });

      console.log('[AIInsights] Response:', { data, error });

      // Handle error from invoke (Supabase puts error details here for non-2xx)
      if (error) {
        console.error('[AIInsights] Invoke error:', error);
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('402') || errorMsg.includes('PAYMENT_REQUIRED') || errorMsg.includes('Payment required')) {
          setErrorCode('PAYMENT_REQUIRED');
        } else if (errorMsg.includes('429') || errorMsg.includes('RATE_LIMITED')) {
          setErrorCode('RATE_LIMITED');
        } else {
          setErrorCode('GENERIC');
        }
        throw new Error(errorMsg);
      }

      // Check for specific error codes in response body
      if (data?.code === 'PAYMENT_REQUIRED') {
        setErrorCode('PAYMENT_REQUIRED');
        throw new Error(data.error || 'Créditos insuficientes');
      }
      if (data?.code === 'RATE_LIMITED') {
        setErrorCode('RATE_LIMITED');
        throw new Error(data.error || 'Limite de requisições excedido');
      }
      if (data?.error && !data?.success) {
        setErrorCode('GENERIC');
        throw new Error(data.error);
      }

      setErrorCode(null);
      return data as AIInsightsResponse;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    // Critical: Don't throw errors to React, handle them in the component
    throwOnError: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Insights atualizados!');
    } catch (err) {
      toast.error('Erro ao atualizar insights');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isPaymentError = errorCode === 'PAYMENT_REQUIRED';
    const isRateLimitError = errorCode === 'RATE_LIMITED';
    
    return (
      <Card className={cn(
        "col-span-2",
        isPaymentError ? "border-warning/30 bg-warning/5" : "border-muted"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className={cn("h-5 w-5", isPaymentError ? "text-warning" : "text-muted-foreground")} />
            AI Insights
            {isPaymentError && <Badge variant="outline" className="text-warning border-warning/30">Créditos</Badge>}
            {isRateLimitError && <Badge variant="outline" className="text-muted-foreground">Limite</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            {isPaymentError ? (
              <>
                <CreditCard className="h-10 w-10 text-warning mx-auto mb-3" />
                <p className="font-medium mb-1">Créditos de IA Insuficientes</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione créditos ao seu workspace Lovable para usar os insights de IA.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://lovable.dev/settings/workspace" target="_blank" rel="noopener noreferrer">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Adicionar Créditos
                  </a>
                </Button>
              </>
            ) : isRateLimitError ? (
              <>
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">Limite de Requisições</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.
                </p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Não foi possível carregar insights. Tente novamente mais tarde.
                </p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const insights = data?.data?.insights || [];
  const summary = data?.data?.summary;

  return (
    <Card className="col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Análise inteligente dos seus dados
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium">{summary}</p>
          </div>
        )}
        
        {insights.length === 0 ? (
          <div className="text-center py-6">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum insight disponível no momento.
            </p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const Icon = insightIcons[insight.type] || Info;
            const colorClass = insightColors[insight.type] || insightColors.info;
            
            return (
              <div 
                key={index}
                className={cn("p-3 rounded-lg border", colorClass)}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {data?.generatedAt && (
          <p className="text-xs text-muted-foreground text-right pt-2">
            Gerado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

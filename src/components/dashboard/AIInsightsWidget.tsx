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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights', 'dashboard_summary'],
    queryFn: async (): Promise<AIInsightsResponse | null> => {
      const { data, error } = await supabase.functions.invoke('master-ai-insights', {
        body: { type: 'dashboard_summary' },
      });

      if (error) {
        console.error('[AIInsights] Error:', error);
        throw error;
      }

      return data as AIInsightsResponse;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
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
    return (
      <Card className="col-span-2 border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-destructive" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Erro ao carregar insights. Tente novamente.
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
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

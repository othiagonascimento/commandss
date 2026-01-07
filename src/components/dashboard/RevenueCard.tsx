import { DollarSign, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { InfoCard } from './InfoCard';
import type { RevenueMetrics } from '@/types/dashboard';

interface RevenueCardProps {
  data: RevenueMetrics;
  delay?: number;
}

export function RevenueCard({ data, delay = 0 }: RevenueCardProps) {
  const isGrowing = data.mrrTrend > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <InfoCard
      title="Receita Mensal (MRR)"
      description="Quanto você está faturando por mês"
      helpText="MRR significa 'Monthly Recurring Revenue' ou Receita Recorrente Mensal. É o dinheiro que você recebe todo mês das assinaturas dos seus clientes. Este é o número mais importante para um SaaS! Se está subindo, seu negócio está crescendo."
      icon={<DollarSign className="w-5 h-5" />}
      delay={delay}
    >
      <div className="flex items-end justify-between">
        <div>
          <span className="font-mono text-3xl font-bold text-foreground">
            {formatCurrency(data.mrr)}
          </span>
          <div className="flex items-center gap-2 mt-2">
            {isGrowing ? (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{data.mrrTrend.toFixed(1)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">{data.mrrTrend.toFixed(1)}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">este mês</span>
          </div>
        </div>
        
        {/* Mini Chart */}
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history.slice(-14)}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(142, 71%, 45%)" 
                strokeWidth={2} 
                fill="url(#revenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Conversions */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.conversionsToday}</span> vendas hoje
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Taxa de conversão: <span className="font-medium text-foreground">{data.conversionRate}%</span>
        </span>
      </div>
    </InfoCard>
  );
}

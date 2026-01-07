import { DollarSign } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import { TrendIndicator } from './TrendIndicator';
import type { RevenueMetrics } from '@/types/dashboard';

interface RevenueCardProps {
  data: RevenueMetrics;
  delay?: number;
}

export function RevenueCard({ data, delay = 0 }: RevenueCardProps) {
  return (
    <GlassCard delay={delay} glowColor="primary">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-neon-green" />
        <h3 className="text-sm font-medium text-muted-foreground">MRR</h3>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <AnimatedNumber value={data.mrr} format="currency" className="text-3xl font-bold text-neon-green" />
          <div className="flex items-center gap-2 mt-1">
            <TrendIndicator value={data.mrrTrend} />
          </div>
        </div>
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history.slice(-14)}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 100%, 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" stroke="hsl(160, 100%, 50%)" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{data.conversionsToday} conversões hoje • {data.conversionRate}% taxa</p>
    </GlassCard>
  );
}

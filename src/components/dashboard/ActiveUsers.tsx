import { Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import { TrendIndicator } from './TrendIndicator';
import type { ActiveUsersData } from '@/types/dashboard';

interface ActiveUsersProps {
  data: ActiveUsersData;
  delay?: number;
}

export function ActiveUsers({ data, delay = 0 }: ActiveUsersProps) {
  return (
    <GlassCard delay={delay} glowColor="accent">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <AnimatedNumber value={data.current} className="text-3xl font-bold text-neon-cyan" />
          <div className="flex items-center gap-2 mt-1">
            <TrendIndicator value={data.trend} />
          </div>
        </div>
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history.slice(-12)}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke="hsl(190, 100%, 50%)" strokeWidth={2} fill="url(#usersGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Peak: {data.peak.toLocaleString()} at {data.peakTime.toLocaleTimeString()}</p>
    </GlassCard>
  );
}

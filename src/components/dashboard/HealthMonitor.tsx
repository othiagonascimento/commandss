import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import type { LatencyDataPoint } from '@/types/dashboard';

interface HealthMonitorProps {
  data: LatencyDataPoint[];
  delay?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 text-sm">
        <p className="font-mono text-neon-cyan">{data.value}ms</p>
        <p className="text-muted-foreground text-xs">
          {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    );
  }
  return null;
};

export function HealthMonitor({ data, delay = 0 }: HealthMonitorProps) {
  const currentLatency = data[data.length - 1]?.value ?? 0;
  const status = data[data.length - 1]?.status ?? 'healthy';
  
  const chartData = useMemo(() => 
    data.map((d, i) => ({
      ...d,
      index: i,
      timestamp: d.timestamp.getTime(),
    })),
    [data]
  );

  const getGradientColor = () => {
    switch (status) {
      case 'healthy':
        return { start: 'hsl(160, 100%, 50%)', end: 'hsl(160, 100%, 30%)' };
      case 'warning':
        return { start: 'hsl(45, 100%, 50%)', end: 'hsl(45, 100%, 30%)' };
      case 'critical':
        return { start: 'hsl(330, 100%, 50%)', end: 'hsl(330, 100%, 30%)' };
    }
  };

  const colors = getGradientColor();
  const strokeColor = status === 'healthy' 
    ? 'hsl(160, 100%, 50%)' 
    : status === 'warning' 
      ? 'hsl(45, 100%, 50%)' 
      : 'hsl(330, 100%, 50%)';

  return (
    <GlassCard 
      span={2} 
      rowSpan={2} 
      delay={delay}
      glowColor={status === 'healthy' ? 'primary' : status === 'warning' ? 'warning' : 'destructive'}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity 
            className="w-5 h-5 animate-heartbeat"
            style={{ color: strokeColor }}
          />
          <h3 className="font-semibold">Health Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Latency</span>
          <AnimatedNumber 
            value={currentLatency} 
            className={`text-2xl font-bold ${
              status === 'healthy' ? 'text-neon-green' : 
              status === 'warning' ? 'text-neon-yellow' : 'text-neon-magenta'
            }`}
            suffix="ms"
          />
        </div>
      </div>

      <div className="h-[200px] lg:h-[250px] -mx-4 -mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.start} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colors.end} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="index" 
              hide 
            />
            <YAxis 
              hide 
              domain={['dataMin - 20', 'dataMax + 20']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#latencyGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Threshold Lines */}
      <div className="absolute right-4 top-1/2 flex flex-col gap-1 text-xs font-mono">
        <span className="text-neon-magenta opacity-60">150ms</span>
        <span className="text-neon-yellow opacity-60">80ms</span>
      </div>
    </GlassCard>
  );
}

import { Cpu, HardDrive, Wifi, Zap } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import { cn } from '@/lib/utils';
import type { SystemMetrics } from '@/types/dashboard';

interface SystemStatsProps {
  data: SystemMetrics;
  delay?: number;
}

export function SystemStats({ data, delay = 0 }: SystemStatsProps) {
  const stats = [
    { icon: Cpu, label: 'CPU', value: data.cpu, suffix: '%', threshold: [60, 85] },
    { icon: HardDrive, label: 'Memory', value: data.memory, suffix: '%', threshold: [70, 90] },
    { icon: Wifi, label: 'Connections', value: data.connections, suffix: '', threshold: [3000, 5000] },
    { icon: Zap, label: 'RPS', value: data.requestsPerSecond, suffix: '', threshold: [5000, 8000] },
  ];

  return (
    <GlassCard span={2} delay={delay} glowColor="accent">
      <h3 className="font-semibold mb-4">System Resources</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const status = stat.value < stat.threshold[0] ? 'good' : stat.value < stat.threshold[1] ? 'warning' : 'critical';
          return (
            <div key={stat.label} className="text-center">
              <stat.icon className={cn(
                'w-6 h-6 mx-auto mb-2',
                status === 'good' && 'text-neon-green',
                status === 'warning' && 'text-neon-yellow',
                status === 'critical' && 'text-neon-magenta'
              )} />
              <AnimatedNumber 
                value={stat.value} 
                suffix={stat.suffix}
                className={cn(
                  'text-xl font-bold',
                  status === 'good' && 'text-neon-green',
                  status === 'warning' && 'text-neon-yellow',
                  status === 'critical' && 'text-neon-magenta'
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

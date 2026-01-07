import { Mail } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import { cn } from '@/lib/utils';
import type { QueueMetrics } from '@/types/dashboard';

interface QueueStatusProps {
  queues: QueueMetrics[];
  delay?: number;
}

export function QueueStatus({ queues, delay = 0 }: QueueStatusProps) {
  return (
    <GlassCard span={2} delay={delay} glowColor="accent">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-neon-cyan" />
        <h3 className="font-semibold">Message Queues</h3>
      </div>
      <div className="space-y-3">
        {queues.map((queue) => {
          const health = queue.pending < 500 ? 'good' : queue.pending < 2000 ? 'warning' : 'critical';
          return (
            <div key={queue.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-20">{queue.name}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    health === 'good' && 'bg-neon-green',
                    health === 'warning' && 'bg-neon-yellow',
                    health === 'critical' && 'bg-neon-magenta animate-pulse'
                  )}
                  style={{ width: `${Math.min(100, (queue.pending / 3000) * 100)}%` }}
                />
              </div>
              <AnimatedNumber value={queue.pending} className="font-mono text-sm w-16 text-right" />
              <span className="text-xs text-muted-foreground w-20">{queue.processingRate}/min</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

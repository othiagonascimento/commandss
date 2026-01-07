import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import type { ErrorZone } from '@/types/dashboard';

interface ErrorHeatmapProps {
  errors: ErrorZone[];
  delay?: number;
}

const severityColors = {
  low: 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan',
  medium: 'bg-neon-yellow/20 border-neon-yellow/40 text-neon-yellow',
  high: 'bg-neon-magenta/20 border-neon-magenta/40 text-neon-magenta',
  critical: 'bg-neon-magenta/40 border-neon-magenta/60 text-neon-magenta animate-pulse',
};

const severityGlow = {
  low: 'hover:shadow-[0_0_20px_hsl(190_100%_50%/0.3)]',
  medium: 'hover:shadow-[0_0_20px_hsl(45_100%_50%/0.3)]',
  high: 'hover:shadow-[0_0_20px_hsl(330_100%_50%/0.3)]',
  critical: 'shadow-[0_0_20px_hsl(330_100%_50%/0.4)]',
};

export function ErrorHeatmap({ errors, delay = 0 }: ErrorHeatmapProps) {
  const sortedErrors = [...errors].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <GlassCard span={2} delay={delay} glowColor="destructive">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-neon-magenta" />
        <h3 className="font-semibold">Error Heat Map</h3>
        <span className="ml-auto text-xs text-muted-foreground">Danger Zones</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedErrors.map((error) => (
          <div
            key={error.id}
            className={cn(
              'p-3 rounded-lg border transition-all duration-300 cursor-pointer',
              severityColors[error.severity],
              severityGlow[error.severity]
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{error.name}</span>
              <span className="font-mono text-lg font-bold">{error.errorCount}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              {error.trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-neon-magenta" />
              ) : (
                <TrendingDown className="w-3 h-3 text-neon-green" />
              )}
              <span className={cn(
                'font-mono',
                error.trend > 0 ? 'text-neon-magenta' : 'text-neon-green'
              )}>
                {error.trend > 0 && '+'}{error.trend}%
              </span>
              <span className="text-muted-foreground">last 10min</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

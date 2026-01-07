import { Server } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { StatusLED } from './StatusLED';
import { cn } from '@/lib/utils';
import type { ServiceHealth } from '@/types/dashboard';

interface ServiceStatusProps {
  services: ServiceHealth[];
  delay?: number;
}

export function ServiceStatus({ services, delay = 0 }: ServiceStatusProps) {
  const allOnline = services.every(s => s.status === 'online');
  const hasErrors = services.some(s => s.status === 'error');

  return (
    <GlassCard 
      span={2} 
      delay={delay}
      glowColor={allOnline ? 'primary' : hasErrors ? 'destructive' : 'warning'}
    >
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-neon-cyan" />
        <h3 className="font-semibold">Service Status</h3>
        <span className={cn(
          'ml-auto text-xs font-mono px-2 py-0.5 rounded',
          allOnline ? 'bg-neon-green/20 text-neon-green' : 
          hasErrors ? 'bg-neon-magenta/20 text-neon-magenta' :
          'bg-neon-yellow/20 text-neon-yellow'
        )}>
          {allOnline ? 'ALL SYSTEMS GO' : hasErrors ? 'ISSUES DETECTED' : 'DEGRADED'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'bg-muted/30 border border-border/50',
              'hover:border-primary/30 transition-all duration-200',
              'cursor-pointer group'
            )}
          >
            <StatusLED status={service.status} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-neon-cyan transition-colors">
                {service.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {service.uptime.toFixed(2)}% uptime
              </p>
            </div>
            {service.latency && (
              <span className={cn(
                'text-xs font-mono',
                service.latency < 50 ? 'text-neon-green' :
                service.latency < 100 ? 'text-neon-cyan' :
                service.latency < 200 ? 'text-neon-yellow' :
                'text-neon-magenta'
              )}>
                {service.latency}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

import { cn } from '@/lib/utils';
import type { ServiceStatus } from '@/types/dashboard';

interface StatusLEDProps {
  status: ServiceStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const statusClasses: Record<ServiceStatus, string> = {
  online: 'status-led-online',
  warning: 'status-led-warning',
  error: 'status-led-error',
  offline: 'status-led-offline',
};

export function StatusLED({ status, size = 'md', pulse = true }: StatusLEDProps) {
  return (
    <span
      className={cn(
        'status-led rounded-full inline-block',
        sizeClasses[size],
        statusClasses[status],
        !pulse && 'animation-none'
      )}
    />
  );
}

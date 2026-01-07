import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  className?: string;
  showValue?: boolean;
  inverted?: boolean; // For metrics where down is good (like errors)
}

export function TrendIndicator({ value, className, showValue = true, inverted = false }: TrendIndicatorProps) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;
  const isNeutral = value === 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        isPositive && 'text-neon-green',
        isNegative && 'text-neon-magenta',
        isNeutral && 'text-muted-foreground',
        className
      )}
    >
      {isPositive && <TrendingUp className="w-4 h-4" />}
      {isNegative && <TrendingDown className="w-4 h-4" />}
      {isNeutral && <Minus className="w-4 h-4" />}
      {showValue && (
        <span className="font-mono">
          {value > 0 && '+'}
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

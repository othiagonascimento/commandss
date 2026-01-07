import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber({
  value,
  className,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => {
    let formatted: string;
    
    switch (format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(current);
        break;
      case 'percentage':
        formatted = `${current.toFixed(decimals)}%`;
        break;
      default:
        formatted = current.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
    }
    
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={cn('font-mono tabular-nums', className)}>
      {display}
    </motion.span>
  );
}

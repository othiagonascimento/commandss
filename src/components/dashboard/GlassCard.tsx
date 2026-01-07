import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'accent' | 'destructive' | 'warning' | 'none';
  delay?: number;
  span?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}

const glowClasses = {
  primary: 'hover:shadow-[0_0_30px_hsl(160_100%_50%/0.2)]',
  accent: 'hover:shadow-[0_0_30px_hsl(190_100%_50%/0.2)]',
  destructive: 'hover:shadow-[0_0_30px_hsl(330_100%_50%/0.2)]',
  warning: 'hover:shadow-[0_0_30px_hsl(45_100%_50%/0.2)]',
  none: '',
};

const spanClasses = {
  1: '',
  2: 'md:col-span-2',
  3: 'md:col-span-2 lg:col-span-3',
  4: 'md:col-span-2 lg:col-span-4',
};

const rowSpanClasses = {
  1: '',
  2: 'md:row-span-2',
};

export function GlassCard({
  children,
  className,
  glowColor = 'primary',
  delay = 0,
  span = 1,
  rowSpan = 1,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={cn(
        'glass-card p-4 lg:p-5',
        'transition-all duration-300',
        'hover:border-primary/40',
        glowClasses[glowColor],
        spanClasses[span],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

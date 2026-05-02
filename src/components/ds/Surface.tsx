import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const surfaceVariants = cva('relative', {
  variants: {
    variant: {
      panel:   'bg-surface-1 border border-hairline',
      raised:  'bg-surface-2 border border-hairline',
      overlay: 'bg-surface-3 border border-hairline',
      flat:    'bg-canvas border border-hairline',
      ghost:   'bg-transparent border border-hairline',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
    },
    interactive: {
      true: 'lift-hover cursor-pointer',
      false: '',
    },
  },
  defaultVariants: { variant: 'panel', radius: 'md', interactive: false },
});

export interface SurfaceProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  crosshairs?: boolean;
  blueprint?: boolean;
}

export function Surface({ className, variant, radius, interactive, crosshairs, blueprint, children, ...props }: SurfaceProps) {
  return (
    <div className={cn(surfaceVariants({ variant, radius, interactive }), blueprint && 'grid-blueprint', className)} {...props}>
      {crosshairs && (
        <>
          <span className="ch ch-tl" /><span className="ch ch-tr" />
          <span className="ch ch-bl" /><span className="ch ch-br" />
        </>
      )}
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  numeral?: string;
  label?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ numeral, label, title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          {numeral && <span className="editorial-numeral">{numeral}</span>}
          {label && <span className="editorial-label">{label}</span>}
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink truncate">{title}</h2>
        {description && <p className="text-sm text-ink-2 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

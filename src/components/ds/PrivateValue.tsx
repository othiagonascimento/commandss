import { ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  mask?: string;
  showToggle?: boolean;
  className?: string;
}

export function PrivateValue({ children, mask = '••••••', showToggle = false, className }: Props) {
  const { hidden, toggle } = usePrivacy();
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn(hidden && 'select-none tracking-wider text-ink-3')}>
        {hidden ? mask : children}
      </span>
      {showToggle && (
        <button
          type="button"
          onClick={toggle}
          className="text-ink-3 hover:text-plasma transition-colors p-1 -m-1"
          aria-label={hidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
        >
          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  );
}

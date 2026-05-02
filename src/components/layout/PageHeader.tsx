import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backPath?: string;
  actions?: React.ReactNode;
  /** Optional editorial numeral, e.g. "01 /". Auto-generated if not provided. */
  numeral?: string;
  /** Editorial label override (defaults to icon name or "Página"). */
  label?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  backPath,
  actions,
  numeral = '01 /',
  label = 'Painel',
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn('mb-6 sm:mb-8 animate-fade-in', className)}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          {backPath && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backPath)}
              className="shrink-0 h-7 w-7 -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="editorial-numeral shrink-0">{numeral}</span>
          <span className="editorial-label truncate">{label}</span>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display font-bold tracking-tighter leading-[0.95] text-foreground flex items-center gap-3"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
            {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-plasma shrink-0" />}
            <span className="truncate">{title}</span>
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      <div className="hairline-t mt-5" />
    </header>
  );
}

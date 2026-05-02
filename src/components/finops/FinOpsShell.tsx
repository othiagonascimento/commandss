import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PeriodFilterAdvanced } from './PeriodFilterAdvanced';
import { MasterOnlyGuard } from './MasterOnlyGuard';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFinOpsAnomaliesCount } from '@/hooks/finops/useFinOps';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  showPeriod?: boolean;
  children: ReactNode;
}

const tabs = [
  { to: '/finops', label: 'Visão Geral', exact: true },
  { to: '/finops/tenants', label: 'Tenants' },
  { to: '/finops/users', label: 'Usuários' },
  { to: '/finops/ai', label: 'IA' },
  { to: '/finops/media', label: 'Mídia' },
  { to: '/finops/infra', label: 'Infra' },
  { to: '/finops/investor', label: 'Investidor' },
  { to: '/finops/anomalies', label: 'Anomalias', anomalies: true },
];

export function FinOpsShell({ title, description, actions, showPeriod = true, children }: Props) {
  const qc = useQueryClient();
  const loc = useLocation();
  const { data: anomCount } = useFinOpsAnomaliesCount();

  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(`${to}/`);

  return (
    <MasterOnlyGuard>
      <DashboardLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">FinOps</span>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30">
                  Master only · Privado
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && <p className="text-sm text-muted-foreground max-w-3xl">{description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {showPeriod && <PeriodFilterAdvanced />}
              {actions}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => qc.invalidateQueries({ queryKey: ['finops'] })}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Sub-nav */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border -mx-1 px-1">
            {tabs.map((t) => {
              const active = isActive(t.to, t.exact);
              const showBadge = t.anomalies && (anomCount?.critical ?? 0) > 0;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                  {showBadge && (
                    <span className="ml-1.5 inline-flex items-center justify-center text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground">
                      {anomCount?.critical}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            <div className="ml-auto flex items-center gap-1 border-l border-border pl-1">
              <Link
                to="/finops/settings/pricing"
                className={cn(
                  'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive('/finops/settings/pricing')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Pricing IA
              </Link>
              <Link
                to="/finops/settings/budgets"
                className={cn(
                  'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive('/finops/settings/budgets')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Budgets IA
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">{children}</div>
        </div>
      </DashboardLayout>
    </MasterOnlyGuard>
  );
}

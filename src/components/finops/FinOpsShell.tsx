import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CloudOff, ExternalLink } from 'lucide-react';
import { PeriodFilterAdvanced } from './PeriodFilterAdvanced';
import { MasterOnlyGuard } from './MasterOnlyGuard';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFinOpsAnomaliesCount, useFinOpsOverview } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';

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

const PROJECT_REF = 'btoyclznuuwvxbsacemw';

function DataConfidenceBanners() {
  const { filters } = useFinOpsPeriod();
  // This hook now shares its cache across all FinOps pages thanks to the
  // period-only query key, so no extra request is fired.
  const { data } = useFinOpsOverview(filters);

  if (!data) return null;

  const apiLogs = data.data_health?.logs_count ?? 0;
  const aiBilling = data.cost_ai_brl?.value ?? 0;
  const infra = data.cost_infra_brl?.value ?? 0;
  const media = data.cost_media_brl?.value ?? 0;
  const noBilling = aiBilling === 0 && infra === 0 && media === 0;
  const lowTelemetry = apiLogs < 10;

  if (!noBilling && !lowTelemetry) return null;

  return (
    <div className="space-y-2">
      {noBilling && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
          <CloudOff className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-foreground">
              Faturas de cloud do período ainda não importadas
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              A tabela <code className="font-mono">platform_cost_allocations</code> está vazia para este período.
              Custos de infra, mídia e billing oficial de IA aparecerão como R$ 0 até a próxima ingestão mensal de faturas GCP.
              O custo logado por chamada (<code className="font-mono">api_usage_logs.cost_brl</code>) continua sendo computado normalmente.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
            <a
              href={`https://supabase.com/dashboard/project/${PROJECT_REF}/editor`}
              target="_blank"
              rel="noopener noreferrer"
            >
              SQL Editor
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      )}
      {lowTelemetry && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-foreground">
              Telemetria de IA com volume muito baixo ({apiLogs} {apiLogs === 1 ? 'chamada' : 'chamadas'} no período)
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Esperado para uma plataforma em operação seria centenas a milhares por dia. Verifique se{' '}
              <code className="font-mono">_shared/ai-telemetry.ts</code> no CRM está sendo invocado em todas as chamadas e se{' '}
              <code className="font-mono">api_usage_logs.cost_brl</code> está sendo populado.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
            <a
              href={`https://supabase.com/dashboard/project/${PROJECT_REF}/functions/master-analytics/logs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Logs
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

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

          {/* Honest data-confidence banners (only for analytics pages, not settings) */}
          {showPeriod && <DataConfidenceBanners />}

          {/* Content */}
          <div className="space-y-4">{children}</div>
        </div>
      </DashboardLayout>
    </MasterOnlyGuard>
  );
}

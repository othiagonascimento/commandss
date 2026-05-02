import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, ExternalLink, MapPin, Building2, Crown, Handshake, Gift,
  AlertTriangle, RefreshCw, Power, Calendar,
} from 'lucide-react';
import { ImpersonateButton } from '@/components/tenant/ImpersonateButton';
import { useNavigate } from 'react-router-dom';

interface TenantHeroProps {
  tenant: any;
  tenantId: string;
  alerts?: Array<{ id: string; severity: 'critical' | 'warning' | 'info'; label: string; hint?: string }>;
  onRecalculateUsage?: () => void;
  onToggleStatus?: () => void;
  recalculating?: boolean;
}

const planAura: Record<string, string> = {
  basic: 'from-muted-foreground/30 to-muted-foreground/10',
  pro: 'from-primary/40 to-primary/10',
  enterprise: 'from-amber-400/40 to-amber-400/10',
};

const planChip: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/15 text-primary',
  enterprise: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

function StatusBadge({ status }: { status?: string }) {
  if (status === 'active') return <Badge className="bg-success text-success-foreground">Ativa</Badge>;
  if (status === 'lifetime') return <Badge className="bg-amber-500 text-white"><Crown className="w-3 h-3 mr-1" />Vitalício</Badge>;
  if (status === 'partnership') return <Badge className="bg-green-600 text-white"><Handshake className="w-3 h-3 mr-1" />Parceria</Badge>;
  if (status === 'trialing') return <Badge variant="secondary" className="bg-primary/10 text-primary"><Gift className="w-3 h-3 mr-1" />Trial</Badge>;
  if (status === 'past_due') return <Badge variant="destructive">Atrasado</Badge>;
  return <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>;
}

export function TenantHero({ tenant, tenantId, alerts = [], onRecalculateUsage, onToggleStatus, recalculating }: TenantHeroProps) {
  const navigate = useNavigate();
  const logo = tenant?.branding?.logo_url || tenant?.logo_url;
  const initials = (tenant?.name || '?').slice(0, 2).toUpperCase();
  const geo = [tenant?.city, tenant?.state].filter(Boolean).join(' / ');
  const created = tenant?.created_at ? format(new Date(tenant.created_at), "dd 'de' MMM yyyy", { locale: ptBR }) : null;

  const crmUrl = tenant?.slug ? `https://${tenant.slug}.uopa.com.br` : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Aura gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none', planAura[tenant?.plan_type] || planAura.basic)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_60%)] pointer-events-none" />

      <div className="relative p-5 sm:p-7">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')} className="shrink-0 -ml-2 hidden sm:flex">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shadow-sm">
            {logo ? (
              <img src={logo} alt={tenant.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-lg sm:text-xl text-muted-foreground">{initials}</span>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate tracking-tight">{tenant?.name}</h1>
              <Badge className={cn('shrink-0 capitalize', planChip[tenant?.plan_type] || planChip.basic)}>
                {tenant?.plan_type}
              </Badge>
              <StatusBadge status={tenant?.subscription_status} />
              {!tenant?.is_active && (
                <Badge variant="outline" className="border-destructive/40 text-destructive">Inativo</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono text-xs">{tenant?.slug}</span>
              {geo && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{geo}
                </span>
              )}
              {created && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />Desde {created}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {crmUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={crmUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1.5" />CRM
                </a>
              </Button>
            )}
            {onRecalculateUsage && (
              <Button variant="outline" size="sm" onClick={onRecalculateUsage} disabled={recalculating}>
                <RefreshCw className={cn('w-4 h-4 mr-1.5', recalculating && 'animate-spin')} />
                Recalcular
              </Button>
            )}
            {onToggleStatus && (
              <Button variant="outline" size="sm" onClick={onToggleStatus}>
                <Power className={cn('w-4 h-4 mr-1.5', tenant?.is_active ? 'text-success' : 'text-muted-foreground')} />
                {tenant?.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            )}
            <ImpersonateButton tenantId={tenantId} tenantName={tenant?.name || ''} />
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden flex-wrap gap-2 mb-4">
          <ImpersonateButton tenantId={tenantId} tenantName={tenant?.name || ''} />
          {crmUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={crmUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" />CRM
              </a>
            </Button>
          )}
          {onRecalculateUsage && (
            <Button variant="outline" size="sm" onClick={onRecalculateUsage} disabled={recalculating}>
              <RefreshCw className={cn('w-4 h-4 mr-1.5', recalculating && 'animate-spin')} />
              Recalcular
            </Button>
          )}
        </div>

        {/* Alerts inline */}
        {alerts.length > 0 && (
          <div className="mt-2 space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm border',
                  a.severity === 'critical' && 'bg-destructive/10 border-destructive/30 text-destructive',
                  a.severity === 'warning' && 'bg-warning/10 border-warning/30 text-warning',
                  a.severity === 'info' && 'bg-primary/5 border-primary/20 text-foreground',
                )}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{a.label}</p>
                  {a.hint && <p className="text-xs opacity-80 mt-0.5">{a.hint}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

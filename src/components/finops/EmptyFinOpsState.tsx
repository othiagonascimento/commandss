import { Card } from '@/components/ui/card';
import { Database, AlertTriangle, CloudOff, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const PROJECT_REF = 'btoyclznuuwvxbsacemw';

type Variant = 'no-telemetry' | 'no-billing' | 'error' | 'generic';

interface Props {
  title?: string;
  description?: string;
  variant?: Variant;
  cta?: { label: string; href: string };
}

const variantConfig: Record<Variant, { icon: typeof Database; title: string; desc: string; href?: string; ctaLabel?: string }> = {
  'no-telemetry': {
    icon: ServerCrash,
    title: 'Sem telemetria de IA no período',
    desc: 'Nenhuma chamada foi registrada em api_usage_logs. Verifique se _shared/ai-telemetry.ts no CRM está logando o cost_brl em cada chamada.',
    href: `https://supabase.com/dashboard/project/${PROJECT_REF}/editor`,
    ctaLabel: 'Inspecionar api_usage_logs',
  },
  'no-billing': {
    icon: CloudOff,
    title: 'Faturas de cloud não importadas',
    desc: 'A tabela platform_cost_allocations está vazia para o período. Custos GCP/infra/mídia/billing aparecerão como zero até a próxima ingestão mensal.',
    href: `https://supabase.com/dashboard/project/${PROJECT_REF}/editor`,
    ctaLabel: 'Abrir SQL Editor',
  },
  error: {
    icon: AlertTriangle,
    title: 'Erro ao carregar dados',
    desc: 'Falha temporária no backend. Tente atualizar; se persistir, verifique os logs da edge function master-analytics.',
    href: `https://supabase.com/dashboard/project/${PROJECT_REF}/functions/master-analytics/logs`,
    ctaLabel: 'Ver logs da edge function',
  },
  generic: {
    icon: Database,
    title: 'Sem logs econômicos ainda',
    desc: 'Pode ser que o deploy das functions de telemetria não tenha sido feito ou ainda não houve chamadas IA neste período.',
  },
};

export function EmptyFinOpsState({ title, description, variant = 'generic', cta }: Props) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;
  const finalTitle = title ?? cfg.title;
  const finalDesc = description ?? cfg.desc;
  const finalCta = cta ?? (cfg.href ? { label: cfg.ctaLabel ?? 'Abrir', href: cfg.href } : undefined);

  return (
    <Card className="p-10 flex flex-col items-center text-center gap-3 border-dashed">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{finalTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{finalDesc}</p>
      {finalCta && (
        <Button asChild variant="outline" size="sm" className="gap-2 mt-2">
          <a href={finalCta.href} target="_blank" rel="noopener noreferrer">
            {finalCta.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      )}
    </Card>
  );
}

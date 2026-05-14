import { useParams, Navigate, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Cpu } from 'lucide-react';
import { fetchCommandMeta, LAYERS, type LayerSlug } from '@/lib/command/meta';

const LAYER_TABS: Partial<Record<LayerSlug, Array<{ to: string; label: string }>>> = {
  canais: [
    { to: '/command/inbox', label: 'Inbox' },
    { to: '/command/campaigns', label: 'Campanhas' },
  ],
  inteligencia: [
    { to: '/command/content', label: 'Conteúdo' },
    { to: '/command/brand', label: 'Brand Intel' },
  ],
  operacao: [
    { to: '/command/automations', label: 'Automações' },
    { to: '/command/calendar', label: 'Calendário' },
  ],
  monetizacao: [{ to: '/command/commercial', label: 'Comercial' }],
};

export default function CommandLayer() {
  const { slug } = useParams<{ slug: string }>();
  const layer = LAYERS.find((l) => l.slug === slug);
  if (!layer) return <Navigate to="/command" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['command-meta'],
    queryFn: fetchCommandMeta,
    staleTime: 60_000,
  });

  const division = data?.divisions.find((d) => d.layer === slug);
  const tools = (data?.tools ?? []).filter((t) => t.domain === slug);
  const tabs = LAYER_TABS[slug as LayerSlug] ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-1">
          Camada UÔPA
        </div>
        <h2 className="text-[24px] font-display tracking-tight text-[hsl(var(--ink-primary))]">
          {layer.name}
        </h2>
        <p className="text-[13px] text-[hsl(var(--ink-secondary))] mt-1">{layer.desc}</p>
      </header>

      {/* Health placeholder — integra com command-layer-snapshot na próxima onda */}
      <section className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-2">
          Health agora
        </div>
        <div className="text-[12.5px] text-[hsl(var(--ink-muted))]">
          Snapshot ao vivo desta camada será exibido aqui (ground truth filtrado por domínio).
        </div>
      </section>

      {/* Divisão responsável */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--brand-magenta))]" />
        </div>
      ) : division ? (
        <section className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-1">
                Divisão responsável
              </div>
              <div className="text-[15px] font-medium text-[hsl(var(--ink-primary))]">{division.name}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[hsl(var(--ink-muted))]">
              <Cpu className="w-3 h-3" />
              {division.default_model?.split('/').pop()}
            </div>
          </div>
          {division.manual && (
            <p className="text-[12.5px] leading-relaxed text-[hsl(var(--ink-secondary))]">
              {division.manual}
            </p>
          )}
        </section>
      ) : null}

      {/* Ferramentas da camada */}
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-2">
          Ferramentas desta camada · {tools.length}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tools.map((t) => (
            <div
              key={t.id}
              className="rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[12px] text-[hsl(var(--ink-primary))]">{t.tool_name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase text-[hsl(var(--ink-muted))] bg-[hsl(var(--surface-3))]">
                  {t.risk_level}
                </span>
              </div>
              {t.description && (
                <div className="text-[11.5px] text-[hsl(var(--ink-secondary))] mt-1">{t.description}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Áreas legadas relacionadas */}
      {tabs.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-2">
            Áreas relacionadas
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className="px-3 py-1.5 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] text-[12px] text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink-primary))] hover:bg-[hsl(var(--surface-2))] transition-colors"
              >
                {t.label} →
              </NavLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

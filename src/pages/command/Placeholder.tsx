import { useParams } from 'react-router-dom';

const META: Record<string, { title: string; tagline: string; wave: number }> = {
  agents: { title: 'Agentes', tagline: 'Catálogo dos 8 agentes operacionais. Página individual com timeline de raciocínio em ativação.', wave: 3 },
  missions: { title: 'Missões', tagline: 'Você dá o objetivo, o sistema constrói uma constelação executável e os agentes pegam seus pedaços.', wave: 4 },
  content: { title: 'Studio de Conteúdo', tagline: 'Mockup do feed real do Instagram. Drag-and-drop de briefings em slots vazios. Brand lock automático.', wave: 5 },
  calendar: { title: 'Calendário Editorial', tagline: 'Visão mês/semana/dia. Janela ótima calculada pelo Analyst em cima do histórico real.', wave: 8 },
  campaigns: { title: 'Campanhas', tagline: 'Lançamento, monitoramento e replay narrativo das campanhas, slide a slide.', wave: 8 },
  brand: { title: 'Brand Books', tagline: 'Voz, tom, do/dont, paleta e referências. Tudo que sai dos agentes respeita.', wave: 5 },
  commercial: { title: 'Comercial', tagline: 'Pipeline, leads e propostas operados pelo Closer com aprovação sua.', wave: 8 },
  automations: { title: 'Automações', tagline: 'Triggers, workflows internos e jobs agendados.', wave: 8 },
  intel: { title: 'Intel', tagline: 'Tendências, concorrência e insights que o Curator e o Analyst alimentam.', wave: 8 },
  inbox: { title: 'Inbox de Decisão', tagline: 'Tudo que precisa de você cai aqui. Aprovar · Ajustar · Rejeitar. Atalhos A/E/R.', wave: 6 },
};

export default function CommandPlaceholder() {
  const { module } = useParams<{ module: string }>();
  const meta = (module && META[module]) ?? { title: module ?? 'Módulo', tagline: '', wave: 0 };

  return (
    <div className="px-8 lg:px-14 py-12 max-w-[1100px] mx-auto">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-8">
        Onda {meta.wave} · em ativação
      </div>
      <h1 className="font-display text-[44px] sm:text-[56px] leading-[0.95] tracking-tight">
        {meta.title}.
      </h1>
      <p className="mt-6 text-[18px] text-[hsl(var(--ink-secondary))] max-w-[680px] leading-relaxed">
        {meta.tagline}
      </p>

      <div className="mt-16 relative rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-12 overflow-hidden">
        <div
          className="absolute -top-px left-0 h-px w-32"
          style={{ background: 'linear-gradient(90deg, hsl(var(--brand-magenta)), transparent)' }}
        />
        <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
          Próxima onda
        </div>
        <div className="text-[15px] text-[hsl(var(--ink-secondary))] leading-relaxed max-w-[560px]">
          A fundação está pronta — schema, agentes, RLS, realtime, shell visual. Esta área entra em
          operação na próxima onda do Command AI. A estrutura de dados já está no ar e pronta para
          receber a UI completa.
        </div>
        <div className="mt-8 flex items-center gap-3 font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-magenta))] animate-pulse" />
          schema command_ai · ativo no supabase externo
        </div>
      </div>
    </div>
  );
}

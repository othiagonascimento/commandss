import { useQuery } from '@tanstack/react-query';
import { fetchCommandMeta, type Division } from '@/lib/command/meta';
import { Loader2, Cpu } from 'lucide-react';

const LAYER_BADGE: Record<string, string> = {
  chief: 'bg-[hsl(var(--brand-magenta)/0.15)] text-[hsl(var(--brand-magenta))]',
  reporter: 'bg-[hsl(var(--brand-purple)/0.15)] text-[hsl(var(--brand-purple))]',
  qa: 'bg-[hsl(var(--ember)/0.15)] text-[hsl(var(--ember))]',
};

function DivisionCard({ d }: { d: Division }) {
  const badge =
    LAYER_BADGE[d.layer] ?? 'bg-[hsl(var(--surface-3))] text-[hsl(var(--ink-secondary))]';
  return (
    <div className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-medium text-[hsl(var(--ink-primary))]">{d.name}</div>
          <div className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${badge}`}>
            {d.layer}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[hsl(var(--ink-muted))]">
          <Cpu className="w-3 h-3" />
          {d.default_model?.split('/').pop() ?? '—'}
        </div>
      </div>
      {d.manual && (
        <p className="text-[12px] leading-relaxed text-[hsl(var(--ink-secondary))] line-clamp-4">
          {d.manual}
        </p>
      )}
      <div className="flex items-center justify-between text-[10.5px] font-mono text-[hsl(var(--ink-faint))]">
        <span>{d.slug}</span>
        <span className={d.enabled ? 'text-[hsl(var(--jade))]' : 'text-[hsl(var(--coral))]'}>
          {d.enabled ? '● ativa' : '○ desligada'}
        </span>
      </div>
    </div>
  );
}

export default function CommandDivisions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['command-meta'],
    queryFn: fetchCommandMeta,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--brand-magenta))]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-[hsl(var(--coral))] text-[13px]">
        Erro ao carregar divisões: {String((error as Error).message)}
      </div>
    );
  }

  const divisions = data?.divisions ?? [];
  const chief = divisions.filter((d) => d.layer === 'chief' || d.layer === 'reporter' || d.layer === 'qa');
  const layers = divisions.filter((d) => !['chief', 'reporter', 'qa'].includes(d.layer));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-[20px] font-display tracking-tight text-[hsl(var(--ink-primary))]">
          Divisões cognitivas
        </h2>
        <p className="text-[13px] text-[hsl(var(--ink-secondary))] mt-1">
          As 9 divisões que operam o Command. Cada divisão tem um manual (system prompt),
          modelo padrão e um conjunto de ferramentas autorizadas.
        </p>
      </header>

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-3">
          Coordenação
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {chief.map((d) => <DivisionCard key={d.id} d={d} />)}
        </div>
      </section>

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] mb-3">
          Camadas UÔPA
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {layers.map((d) => <DivisionCard key={d.id} d={d} />)}
        </div>
      </section>
    </div>
  );
}

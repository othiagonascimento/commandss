import { Lock } from 'lucide-react';

const LAYERS = [
  { label: 'Núcleo', detail: 'Operação cognitiva contínua', difficulty: 'Quase impossível de copiar' },
  { label: 'Memória', detail: 'Contexto comercial vivo do cliente', difficulty: 'Anos de dados acumulados' },
  { label: 'Inteligência', detail: 'Decisões automáticas em tempo real', difficulty: 'Modelo treinado na operação' },
  { label: 'Distribuição', detail: 'Governança multi-tenant', difficulty: 'Infraestrutura crítica' },
  { label: 'Categoria', detail: 'Camada da jornada comercial', difficulty: 'Padrão de mercado' },
];

export function MoatLayers() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-2">Moat · 5 camadas de defesa</div>
      <p className="text-sm text-ink-2 mb-6 max-w-2xl">
        Cada camada protege a anterior. Quanto mais fundo um concorrente tenta chegar, mais difícil fica replicar.
      </p>

      {/* Indicador lateral de profundidade */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-plasma/20 via-plasma/60 to-plasma"
        />
        <div className="absolute -left-1 top-2 text-[10px] font-mono uppercase tracking-wider text-ink-3 -rotate-90 origin-left translate-y-8 whitespace-nowrap">
          superfície
        </div>
        <div className="absolute -left-1 bottom-2 text-[10px] font-mono uppercase tracking-wider text-plasma -rotate-90 origin-left whitespace-nowrap">
          profundo
        </div>

        <ol className="space-y-2 pl-10">
          {LAYERS.slice().reverse().map((l, idx) => {
            // idx 0 = mais superficial (Categoria), último = mais profundo (Núcleo)
            const depth = idx; // 0..4
            const isCore = depth === LAYERS.length - 1;
            const intensity = 0.05 + depth * 0.06;
            return (
              <li
                key={l.label}
                className="relative rounded-md border border-hairline overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--plasma) / ${intensity}) 0%, transparent 70%)`,
                  borderColor: isCore ? 'hsl(var(--plasma) / 0.5)' : undefined,
                }}
              >
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex items-center gap-2 shrink-0">
                    {Array.from({ length: depth + 1 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-1 rounded-sm bg-plasma"
                        style={{ opacity: 0.35 + (i / (depth + 1)) * 0.65 }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-1">{l.label}</span>
                      {isCore && <Lock className="h-3 w-3 text-plasma" />}
                    </div>
                    <div className="text-[11px] text-ink-2 leading-snug">{l.detail}</div>
                  </div>
                  <div className="hidden md:block text-[10px] font-mono uppercase tracking-wider text-ink-3 text-right shrink-0 max-w-[160px]">
                    {l.difficulty}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-md border border-dashed border-plasma/40 bg-plasma/5 px-4 py-3">
        <Lock className="h-4 w-4 shrink-0 text-plasma" />
        <p className="text-xs md:text-sm text-ink-2 leading-snug">
          <span className="font-semibold text-ink-1">Para chegar ao núcleo</span>, um concorrente precisa
          replicar todas as 5 camadas — não só a tecnologia, mas anos de dados e relação.
        </p>
      </div>
    </figure>
  );
}

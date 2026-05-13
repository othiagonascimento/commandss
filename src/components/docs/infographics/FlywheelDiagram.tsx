const STAGES = [
  { title: 'Mais dados', desc: 'Cada conversa, venda e atendimento vira sinal.' },
  { title: 'Mais contexto', desc: 'O sistema entende melhor cliente, produto e operação.' },
  { title: 'Mais inteligência', desc: 'Decisões e respostas ficam mais precisas.' },
  { title: 'Mais monetização', desc: 'Conversão sobe, ticket sobe, custo cai.' },
  { title: 'Mais retenção', desc: 'Cliente fica, operação depende do sistema.' },
];

export function FlywheelDiagram() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-2">Flywheel · vantagem composta</div>
      <p className="text-sm text-ink-2 mb-6 max-w-2xl">
        Cada etapa alimenta a próxima. Quanto mais o ciclo gira, mais difícil fica para um concorrente alcançar.
      </p>

      {/* Cadeia horizontal — leitura imediata da esquerda para a direita */}
      <ol className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {STAGES.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-lg border border-hairline bg-surface-2/60 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-ink-3">
                ETAPA {String(i + 1).padStart(2, '0')}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-plasma" />
            </div>
            <div className="font-semibold text-ink-1 text-sm leading-tight">{s.title}</div>
            <div className="text-xs text-ink-2 leading-snug">{s.desc}</div>
            {/* seta entre cards (desktop) */}
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 items-center justify-center rounded-full bg-plasma text-[10px] font-bold text-white shadow"
              >
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Loop fechado — mostra que o final realimenta o início */}
      <div className="flex items-center gap-3 rounded-md border border-dashed border-plasma/40 bg-plasma/5 px-4 py-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 text-plasma">
          <path
            d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-xs md:text-sm text-ink-2 leading-snug">
          <span className="font-semibold text-ink-1">O ciclo se fecha:</span> mais retenção gera mais uso,
          que gera mais dados — e o flywheel acelera de novo, com mais força.
        </p>
      </div>
    </figure>
  );
}

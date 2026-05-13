const STAGES = [
  { label: 'Descoberta', hint: 'Cliente chega' },
  { label: 'Captura', hint: 'Sinais invisíveis' },
  { label: 'Conversa', hint: 'Continuidade' },
  { label: 'Inteligência', hint: 'Próximo passo' },
  { label: 'Monetização', hint: 'Pagamento contextual' },
  { label: 'Aprendizado', hint: 'Tempo real' },
  { label: 'Recompra', hint: 'Relação viva' },
];

export function LoopDiagram() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-2">Loop operacional · 7 etapas</div>
      <p className="text-sm text-ink-2 mb-6 max-w-2xl">
        A operação flui da descoberta à recompra — e a recompra realimenta a descoberta. Nada começa do zero.
      </p>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAGES.map((s, i) => (
          <li
            key={s.label}
            className="relative rounded-lg border border-hairline bg-surface-2/60 p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-ink-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-plasma" />
            </div>
            <div className="font-semibold text-ink-1 text-sm leading-tight">{s.label}</div>
            <div className="text-xs text-ink-2 leading-snug">{s.hint}</div>
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 items-center justify-center rounded-full bg-plasma text-[10px] font-bold text-white shadow"
              >
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

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
          <span className="font-semibold text-ink-1">Recompra alimenta a descoberta:</span> o ciclo nunca para,
          cada volta deixa o sistema mais inteligente sobre o cliente.
        </p>
      </div>
    </figure>
  );
}

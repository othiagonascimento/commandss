const PHASES = ['Descoberta', 'Engajamento', 'Decisão', 'Pagamento', 'Pós-venda', 'Recompra'];

export function JourneyTimeline() {
  return (
    <figure className="not-prose my-6">
      <div className="doc-eyebrow mb-3">Jornada · da descoberta à recompra</div>
      <div className="relative rounded-lg border border-hairline bg-surface-1/60 p-5 overflow-hidden">
        <div className="absolute left-5 right-5 top-1/2 h-px bg-gradient-to-r from-plasma/10 via-plasma/60 to-plasma/10" />
        <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-3">
          {PHASES.map((p, i) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
              <div className="h-2.5 w-2.5 rounded-full bg-plasma shadow-[0_0_12px_hsl(var(--plasma))]" />
              <span className="text-[11px] text-ink-2 text-center font-medium">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

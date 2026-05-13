const STAGES = [
  { year: 'Hoje', title: 'Infraestrutura nascente', mark: '●' },
  { year: '1–2 anos', title: 'Operação cognitiva consolidada', mark: '●' },
  { year: '3–5 anos', title: 'Categoria estabelecida', mark: '●' },
  { year: '5–10 anos', title: 'Camada da jornada comercial', mark: '◉' },
];

export function VisaoLongoPrazo() {
  return (
    <figure className="not-prose my-8">
      <div className="doc-eyebrow mb-3">Trajetória · horizonte estratégico</div>
      <div className="relative pl-6 border-l-2 border-plasma/40 space-y-5">
        {STAGES.map((s, i) => (
          <div key={s.year} className="relative">
            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-plasma bg-canvas flex items-center justify-center">
              <span className="text-[8px] text-plasma">{s.mark}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-plasma">{s.year}</div>
            <div className="text-sm font-semibold text-ink mt-0.5">{s.title}</div>
            {i === STAGES.length - 1 && (
              <div className="text-[11px] text-ink-muted mt-1 italic">→ infraestrutura inevitável</div>
            )}
          </div>
        ))}
      </div>
    </figure>
  );
}

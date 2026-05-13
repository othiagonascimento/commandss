const LAYERS = [
  { label: 'Núcleo', detail: 'Operação cognitiva contínua' },
  { label: 'Memória', detail: 'Contexto comercial vivo' },
  { label: 'Inteligência', detail: 'Decisões em tempo real' },
  { label: 'Distribuição', detail: 'Tenant governance' },
  { label: 'Categoria', detail: 'Infraestrutura da jornada' },
];

export function MoatLayers() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-3">Moat · camadas estruturais</div>
      <div className="flex flex-col gap-1.5">
        {LAYERS.map((l, i) => (
          <div
            key={l.label}
            className="relative rounded-md border border-hairline overflow-hidden"
            style={{
              marginLeft: `${i * 14}px`,
              marginRight: `${i * 14}px`,
              background: `linear-gradient(90deg, hsl(var(--plasma) / ${0.04 + i * 0.04}) 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-plasma tabular">L{i + 1}</span>
                <span className="text-sm font-semibold text-ink">{l.label}</span>
              </div>
              <span className="text-[11px] text-ink-muted hidden sm:inline">{l.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-[11px] text-ink-faint font-mono uppercase tracking-wider">
        Cada camada profundiza dependência
      </div>
    </figure>
  );
}

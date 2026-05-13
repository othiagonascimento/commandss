// Quadrante de posicionamento competitivo
const QUADRANTS = [
  { x: 0, y: 0, label: 'CRMs tradicionais', sub: 'Estoque de dados', tone: 'text-ink-muted' },
  { x: 1, y: 0, label: 'Chatbots / Automação', sub: 'Resposta isolada', tone: 'text-ink-muted' },
  { x: 0, y: 1, label: 'Plataformas de IA', sub: 'Inteligência sem operação', tone: 'text-ink-muted' },
  { x: 1, y: 1, label: 'UÔPA', sub: 'Operação cognitiva contínua', tone: 'text-plasma font-semibold' },
];

export function PosicionamentoQuad() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-4">Posicionamento · mapa competitivo</div>
      <div className="relative aspect-[4/3] max-w-xl mx-auto">
        {/* Eixos */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-hairline rounded-md overflow-hidden">
          {QUADRANTS.map((q) => {
            const isUopa = q.label === 'UÔPA';
            return (
              <div
                key={q.label}
                className={`relative p-4 flex flex-col justify-center items-center text-center ${isUopa ? 'bg-plasma/10' : 'bg-surface-1'}`}
              >
                <div className={`text-sm ${q.tone}`}>{q.label}</div>
                <div className="text-[10px] text-ink-faint mt-1 font-mono uppercase tracking-wider">{q.sub}</div>
                {isUopa && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-plasma shadow-[0_0_10px_hsl(var(--plasma))]" />
                )}
              </div>
            );
          })}
        </div>
        {/* Eixo labels */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] font-mono uppercase tracking-wider text-ink-faint">
          ← isolado · contínuo →
        </div>
        <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider text-ink-faint">
          ← reativo · cognitivo →
        </div>
      </div>
    </figure>
  );
}

// Loop operacional do UÔPA — diagrama circular SVG inline.
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
  const cx = 200;
  const cy = 200;
  const r = 140;
  const n = STAGES.length;

  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-3">Diagrama · loop operacional</div>
      <div className="flex justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-[420px]">
          <defs>
            <radialGradient id="loop-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--plasma) / 0.35)" />
              <stop offset="100%" stopColor="hsl(var(--plasma) / 0)" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r + 30} fill="url(#loop-core)" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--hairline))"
            strokeDasharray="2 4"
          />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="hsl(var(--plasma))"
            letterSpacing="2"
          >
            UÔPA
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontFamily="Manrope, sans-serif"
            fontSize="11"
            fill="hsl(var(--ink-2))"
          >
            loop contínuo
          </text>
          {STAGES.map((s, idx) => {
            const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            return (
              <g key={s.label}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="hsl(var(--canvas))"
                  stroke="hsl(var(--plasma))"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={y - 14}
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="hsl(var(--ink-primary))"
                >
                  {s.label}
                </text>
                <text
                  x={x}
                  y={y + 20}
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                  fontSize="9"
                  fill="hsl(var(--ink-muted))"
                >
                  {s.hint}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-ink-faint font-mono uppercase tracking-wider">
        Da descoberta à recompra · operação contínua
      </figcaption>
    </figure>
  );
}

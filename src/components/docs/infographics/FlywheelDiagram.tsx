const STAGES = [
  'Mais contexto',
  'Mais inteligência',
  'Mais monetização',
  'Mais retenção',
  'Mais dados',
];

export function FlywheelDiagram() {
  const cx = 180;
  const cy = 180;
  const r = 110;
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-3">Flywheel · vantagem composta</div>
      <div className="flex justify-center">
        <svg viewBox="0 0 360 360" className="w-full max-w-[380px]">
          <defs>
            <linearGradient id="fw-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand-purple))" />
              <stop offset="100%" stopColor="hsl(var(--plasma))" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r + 28} fill="none" stroke="hsl(var(--hairline))" strokeDasharray="2 5" />
          <circle cx={cx} cy={cy} r={36} fill="url(#fw-grad)" opacity="0.85" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="700" fill="white">
            FLYWHEEL
          </text>
          {STAGES.map((s, i) => {
            const a = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            const a2 = ((i + 1) / STAGES.length) * Math.PI * 2 - Math.PI / 2;
            const x2 = cx + Math.cos(a2) * r;
            const y2 = cy + Math.sin(a2) * r;
            return (
              <g key={s}>
                <line x1={x} y1={y} x2={x2} y2={y2} stroke="hsl(var(--plasma))" strokeWidth="1" opacity="0.5" />
                <circle cx={x} cy={y} r="20" fill="hsl(var(--surface-2))" stroke="hsl(var(--plasma))" />
                <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontWeight="600" fontFamily="Manrope" fill="hsl(var(--ink-primary))">
                  {String(i + 1).padStart(2, '0')}
                </text>
                <text x={x} y={y - 30} textAnchor="middle" fontSize="11" fontFamily="Manrope" fill="hsl(var(--ink-2))">
                  {s}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

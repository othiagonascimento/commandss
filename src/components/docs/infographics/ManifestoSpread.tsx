export function ManifestoSpread() {
  return (
    <figure className="not-prose relative my-10 overflow-hidden rounded-xl border border-plasma/30 bg-gradient-to-br from-brand-navy via-surface-1 to-canvas p-8 sm:p-12">
      <div
        className="absolute -top-24 -left-20 h-72 w-72 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(closest-side, hsl(var(--plasma) / 0.6), transparent)' }}
      />
      <div
        className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(closest-side, hsl(var(--brand-purple) / 0.5), transparent)' }}
      />
      <div className="relative">
        <div className="doc-eyebrow text-plasma mb-4">Manifesto · uôpa</div>
        <div className="font-display text-2xl sm:text-4xl font-semibold leading-[1.15] tracking-tight text-ink-primary max-w-3xl">
          O futuro não pertence apenas a agentes.
          <br />
          <span className="text-plasma">Pertence a operações cognitivas contínuas.</span>
        </div>
        <div className="mt-6 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          <span className="h-px w-10 bg-plasma" />
          Tese estratégica oficial
        </div>
      </div>
    </figure>
  );
}

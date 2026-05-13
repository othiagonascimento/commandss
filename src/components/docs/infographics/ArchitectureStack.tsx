const LAYERS = [
  { label: 'Tenant Governance', sub: 'Soberania, isolamento, RLS' },
  { label: 'Cognitive Orchestration', sub: 'Inferência + contexto + decisão' },
  { label: 'Event Intelligence Runtime', sub: 'Comportamento em eventos' },
  { label: 'Conversational OS', sub: 'Camada operacional viva' },
  { label: 'Edge Functions / Proxy', sub: 'Master ↔ CRM cross-project' },
  { label: 'Supabase Core', sub: 'Postgres + Auth + Storage' },
];

export function ArchitectureStack() {
  return (
    <figure className="not-prose my-8 rounded-lg border border-hairline bg-surface-1/60 p-6">
      <div className="doc-eyebrow mb-3">Stack · plano de controle cognitivo</div>
      <div className="space-y-1.5">
        {LAYERS.map((l, i) => (
          <div
            key={l.label}
            className="flex items-center justify-between rounded-md border border-hairline px-4 py-3 bg-surface-2/40 hover:bg-surface-2/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-[10px] text-plasma tabular shrink-0">
                {String(LAYERS.length - i).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{l.label}</div>
                <div className="text-[11px] text-ink-muted truncate">{l.sub}</div>
              </div>
            </div>
            <div className="hidden sm:flex h-6 w-1 rounded-full bg-gradient-to-b from-plasma to-brand-purple opacity-60" />
          </div>
        ))}
      </div>
    </figure>
  );
}

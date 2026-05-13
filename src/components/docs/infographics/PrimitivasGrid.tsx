import { Brain, Zap, Cpu, ShoppingBag, CreditCard, Database, Shield } from 'lucide-react';

const PRIMS = [
  { code: '5.1', name: 'Conversational OS', icon: Brain, hint: 'Camada operacional viva' },
  { code: '5.2', name: 'Event Intelligence Runtime', icon: Zap, hint: 'Comportamento em eventos' },
  { code: '5.3', name: 'Cognitive Orchestration', icon: Cpu, hint: 'Inferência e contexto' },
  { code: '5.4', name: 'Conversational Commerce', icon: ShoppingBag, hint: 'Comércio conversacional' },
  { code: '5.5', name: 'Payment Orchestration', icon: CreditCard, hint: 'Financeiro contextual' },
  { code: '5.6', name: 'Commercial Memory', icon: Database, hint: 'Memória viva' },
  { code: '5.7', name: 'Tenant Governance', icon: Shield, hint: 'Soberania operacional' },
];

export function PrimitivasGrid() {
  return (
    <figure className="not-prose my-8">
      <div className="doc-eyebrow mb-3">Mapa · 7 primitivas fundamentais</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {PRIMS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.code}
              className="group rounded-lg border border-hairline bg-surface-1/60 p-3.5 hover:border-plasma/40 hover:bg-surface-2/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-plasma" />
                <span className="font-mono text-[10px] text-ink-faint">{p.code}</span>
              </div>
              <div className="text-[12px] font-semibold text-ink leading-tight">{p.name}</div>
              <div className="text-[10px] text-ink-muted mt-1 leading-snug">{p.hint}</div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

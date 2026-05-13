import { TrendingDown, Clock, Zap, Wallet, Brain } from 'lucide-react';

const PERDAS = [
  { num: '01', label: 'Perda de intenção', detail: 'O mercado reage tarde demais', icon: Clock, tone: 'from-coral/20' },
  { num: '02', label: 'Perda de contexto', detail: 'Cada atendimento recomeça do zero', icon: Brain, tone: 'from-ember/20' },
  { num: '03', label: 'Perda de velocidade', detail: 'Vendas perdidas em atrasos', icon: Zap, tone: 'from-plasma/20' },
  { num: '04', label: 'Perda de monetização', detail: 'Cobrança quebra continuidade', icon: Wallet, tone: 'from-brand-purple/20' },
  { num: '05', label: 'Perda de aprendizado', detail: 'Erros se repetem', icon: TrendingDown, tone: 'from-cobalt/20' },
];

export function PerdasInvisiveis() {
  return (
    <figure className="not-prose my-8">
      <div className="doc-eyebrow mb-3">5 perdas invisíveis · diagnóstico</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {PERDAS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.num}
              className={`relative rounded-lg border border-hairline bg-gradient-to-br ${p.tone} to-transparent p-4 overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[26px] font-light text-plasma/40 tabular leading-none">
                  {p.num}
                </span>
                <Icon className="h-4 w-4 text-plasma" />
              </div>
              <div className="text-[13px] font-semibold text-ink leading-tight mb-1">{p.label}</div>
              <div className="text-[11px] text-ink-muted leading-snug">{p.detail}</div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

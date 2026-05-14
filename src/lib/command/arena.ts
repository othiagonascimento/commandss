/**
 * UÔPA ARENA — modelo de dados e mock engine (Onda A).
 *
 * Cada divisão é representada por um esporte. O estado é um vocabulário
 * fixo de 7 valores. Na Onda A o estado é gerado por um mock determinístico
 * que respeita as regras do plano (ex: "no máximo 3 arenas acima de ativa").
 *
 * Onda B troca o mock por subscription Realtime nas tabelas
 * command_ai.{missions, agent_runs, qa_runs, decisions, command_log}.
 */

export type ArenaState =
  | 'standby'
  | 'active'
  | 'high'
  | 'attention'
  | 'critical'
  | 'recovery'
  | 'queue';

export type SportSlug =
  | 'tennis'
  | 'boxing'
  | 'f1'
  | 'surf'
  | 'volley'
  | 'rowing'
  | 'fencing'
  | 'chess'
  | 'hockey';

export interface Arena {
  slug: string;
  division: string;
  sport: SportSlug;
  sportLabel: string;
  rationale: string;
}

export const ARENAS: Arena[] = [
  { slug: 'dev',       division: 'Engenharia',      sport: 'tennis',  sportLabel: 'Tênis',         rationale: 'Rali ponto-a-ponto = commits/PRs' },
  { slug: 'qa',        division: 'QA / Tester',     sport: 'boxing',  sportLabel: 'Boxe',          rationale: 'Round = playbook · soco = bug encaixado' },
  { slug: 'sales',     division: 'Comercial',       sport: 'f1',      sportLabel: 'Fórmula 1',     rationale: 'Pit stop = call · volta rápida = deal' },
  { slug: 'cs',        division: 'Customer Success',sport: 'volley',  sportLabel: 'Vôlei',         rationale: 'Recepção/levantada/ataque = ticket' },
  { slug: 'mkt',       division: 'Marketing',       sport: 'surf',    sportLabel: 'Surf',          rationale: 'Onda = trend · manobra = post' },
  { slug: 'ops',       division: 'Operações',       sport: 'rowing',  sportLabel: 'Remo 8+',       rationale: 'Sincronia coletiva' },
  { slug: 'fin',       division: 'Financeiro',      sport: 'fencing', sportLabel: 'Esgrima',       rationale: 'Precisão · golpe decisivo' },
  { slug: 'product',   division: 'Produto',         sport: 'chess',   sportLabel: 'Xadrez bullet', rationale: 'Decisão sob relógio' },
  { slug: 'observ',    division: 'Observabilidade', sport: 'hockey',  sportLabel: 'Hóquei (goleiro)', rationale: 'Defesa 24/7 contra alertas' },
];

export interface ArenaSnapshot {
  state: ArenaState;
  intensity: number;          // 0..1
  scoreToday: number;         // pontos do dia (missões concluídas)
  scoreOpponent: number;      // falhas/incidentes do dia
  currentMission: string | null;
  lastEvent: string | null;
  streak: number;             // dias consecutivos sem crítico
}

export const STATE_TONE: Record<ArenaState, { border: string; glow: string; label: string }> = {
  standby:   { border: 'hsl(var(--hairline-strong))',         glow: 'transparent',                       label: 'standby' },
  active:    { border: 'hsl(var(--ink-secondary))',           glow: 'hsl(var(--ink-secondary)/0.18)',    label: 'ativa' },
  high:      { border: 'hsl(var(--jade))',                    glow: 'hsl(var(--jade)/0.32)',             label: 'alto desempenho' },
  attention: { border: '#F2A93B',                             glow: '#F2A93B40',                         label: 'atenção' },
  critical:  { border: 'hsl(var(--brand-magenta))',           glow: 'hsl(var(--brand-magenta)/0.45)',    label: 'crítico' },
  recovery:  { border: 'hsl(var(--jade))',                    glow: 'hsl(var(--jade)/0.25)',             label: 'recuperação' },
  queue:     { border: '#F2A93B',                             glow: '#F2A93B30',                         label: 'fila' },
};

export const STATE_PRIORITY: Record<ArenaState, number> = {
  critical: 100,
  attention: 70,
  queue: 60,
  high: 50,
  recovery: 45,
  active: 30,
  standby: 0,
};

export interface ArenaEvent {
  id: string;
  ts: number;
  arena: string;       // arena slug
  sport: SportSlug;
  text: string;        // curto, estilo "Tênis · ponto · deploy v2.4"
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

/* ────────────────────────── MOCK ENGINE ────────────────────────── */

const SAMPLE_EVENTS: Array<Omit<ArenaEvent, 'id' | 'ts'>> = [
  { arena: 'dev',     sport: 'tennis',  text: 'Tênis · ponto · PR #482 mergeado',                    tone: 'good' },
  { arena: 'qa',      sport: 'boxing',  text: 'Boxe · jab · playbook login passou',                  tone: 'good' },
  { arena: 'qa',      sport: 'boxing',  text: 'Boxe · soco encaixado · checkout falhou no step 8',   tone: 'bad' },
  { arena: 'sales',   sport: 'f1',      text: 'F1 · volta rápida · deal Magnata fechado · R$ 2.4k',  tone: 'good' },
  { arena: 'sales',   sport: 'f1',      text: 'F1 · pit stop · call agendada com Paróquia',          tone: 'neutral' },
  { arena: 'cs',      sport: 'volley',  text: 'Vôlei · ataque · ticket #1240 resolvido em 4min',     tone: 'good' },
  { arena: 'mkt',     sport: 'surf',    text: 'Surf · drop · carrossel diagnóstico publicado',       tone: 'good' },
  { arena: 'ops',     sport: 'rowing',  text: 'Remo · sincronia 8/8 · scheduler tickou',             tone: 'neutral' },
  { arena: 'fin',     sport: 'fencing', text: 'Esgrima · estocada · MRR atualizado · R$ 18.2k',      tone: 'good' },
  { arena: 'product', sport: 'chess',   text: 'Xadrez · jogada · decisão pendente sobre Onda 4',     tone: 'warn' },
  { arena: 'observ',  sport: 'hockey',  text: 'Hóquei · defesa · alerta DB resolvido em 12s',        tone: 'good' },
  { arena: 'observ',  sport: 'hockey',  text: 'Hóquei · gol sofrido · edge fn timeout 504',          tone: 'bad' },
  { arena: 'dev',     sport: 'tennis',  text: 'Tênis · ace · build #1284 verde em 2:14',             tone: 'good' },
  { arena: 'cs',      sport: 'volley',  text: 'Vôlei · saque · 2 tickets recém-recebidos',           tone: 'neutral' },
];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Gerador de snapshot determinístico-ish que honra a regra dos 3 focos. */
export function generateMockSnapshot(now: number): {
  arenas: Record<string, ArenaSnapshot>;
  events: ArenaEvent[];
} {
  // Seed por janela de 8s — todo mundo muda junto, sensação coreografada.
  const window = Math.floor(now / 8000);
  let seed = window;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Escolhe 1-3 arenas para serem "focos" (acima de ativa).
  const focusCount = 1 + Math.floor(rng() * 3);
  const shuffled = [...ARENAS].sort(() => rng() - 0.5);
  const focusArenas = new Set(shuffled.slice(0, focusCount).map((a) => a.slug));

  const heatedStates: ArenaState[] = ['high', 'attention', 'critical', 'recovery', 'queue'];
  const calmStates: ArenaState[] = ['standby', 'standby', 'standby', 'active'];

  const arenas: Record<string, ArenaSnapshot> = {};
  for (const arena of ARENAS) {
    const isFocus = focusArenas.has(arena.slug);
    const state = isFocus ? pick(heatedStates, rng) : pick(calmStates, rng);
    arenas[arena.slug] = {
      state,
      intensity: isFocus ? 0.55 + rng() * 0.45 : 0.05 + rng() * 0.25,
      scoreToday: Math.floor(rng() * 14),
      scoreOpponent: Math.floor(rng() * (state === 'critical' ? 5 : 2)),
      currentMission: isFocus
        ? pick(['Retenção Q2', 'Série editorial', 'Onboarding fix', 'Checkout patch', 'Coaching Paróquia'], rng)
        : null,
      lastEvent: null,
      streak: 1 + Math.floor(rng() * 30),
    };
  }

  // Eventos: 6-8 últimos, ordem decrescente.
  const eventCount = 6 + Math.floor(rng() * 3);
  const events: ArenaEvent[] = [];
  for (let i = 0; i < eventCount; i++) {
    const sample = pick(SAMPLE_EVENTS, rng);
    events.push({
      id: `${window}-${i}`,
      ts: now - i * (3000 + Math.floor(rng() * 4000)),
      ...sample,
    });
  }

  return { arenas, events };
}

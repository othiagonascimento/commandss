/**
 * Command AI — Agents Catalog.
 * Grade dos 8 agentes globais com métricas reais (runs, sucesso, tokens, último uso).
 * Click → drawer com bio, capacidades, prompt-base e atalho para briefar.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  listAgents,
  getAgentsStats,
  getAgentRecentRuns,
  type Agent,
  type AgentStats,
} from '@/lib/command/agents';
import { useCommandStore } from '@/lib/command/store';
import { Activity, CheckCircle2, AlertTriangle, Zap, Clock, Sparkles, X } from 'lucide-react';

export default function CommandAgents() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const openBriefing = useCommandStore((s) => s.openBriefing);
  const [selected, setSelected] = useState<Agent | null>(null);

  const { data: agents } = useQuery({
    queryKey: ['command', 'agents', 'catalog'],
    queryFn: listAgents,
    staleTime: 5 * 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['command', 'agents', 'stats', wsId],
    queryFn: () => getAgentsStats(wsId),
    refetchInterval: 15_000,
  });

  return (
    <div className="px-8 py-10 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-2">
          Catálogo de agentes
        </div>
        <h1 className="font-display text-[34px] font-bold tracking-tight text-[hsl(var(--ink-primary))] leading-none">
          Sua tropa de execução.
        </h1>
        <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-3 max-w-[640px] leading-relaxed">
          Oito agentes especializados, sempre prontos. Cada um com domínio,
          memória e modelo próprios. Clique para inspecionar — ⌘K para
          comandar.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents?.map((a, i) => {
          const s = stats?.get(a.id);
          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => setSelected(a)}
              className="group relative text-left rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-2))] transition-all p-5 overflow-hidden"
            >
              {/* color accent */}
              <div
                className="absolute inset-x-0 top-0 h-px opacity-60"
                style={{ background: `linear-gradient(90deg, ${a.color_hex}, transparent)` }}
              />
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-[20px] shrink-0 ring-1 ring-inset"
                  style={{
                    background: `${a.color_hex}1a`,
                    color: a.color_hex,
                    // @ts-expect-error css var
                    '--tw-ring-color': `${a.color_hex}40`,
                  }}
                >
                  {a.avatar_emoji ?? a.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-medium text-[hsl(var(--ink-primary))]">
                    {a.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mt-0.5 truncate">
                    {a.role}
                  </div>
                </div>
                {s && s.in_flight > 0 && (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full mt-2"
                    style={{ background: a.color_hex }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
              </div>

              {a.description && (
                <p className="text-[12.5px] text-[hsl(var(--ink-muted))] leading-relaxed line-clamp-2 mb-4 min-h-[36px]">
                  {a.description}
                </p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[hsl(var(--hairline))]">
                <Stat icon={Activity} label="Runs" value={s?.total_runs ?? 0} />
                <Stat
                  icon={CheckCircle2}
                  label="Sucesso"
                  value={s && s.total_runs ? `${Math.round((s.completed / s.total_runs) * 100)}%` : '—'}
                />
                <Stat
                  icon={Clock}
                  label="Médio"
                  value={s?.avg_duration_ms ? `${(s.avg_duration_ms / 1000).toFixed(1)}s` : '—'}
                />
              </div>

              {/* Last activity */}
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                <span>{s?.last_run_at ? `último · ${timeAgo(s.last_run_at)}` : 'nunca usado'}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--brand-magenta))]">
                  inspecionar →
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[520px] p-0 bg-[hsl(var(--surface-1))] border-l border-[hsl(var(--hairline-strong))]"
        >
          {selected && (
            <AgentDetail
              agent={selected}
              stats={stats?.get(selected.id)}
              onClose={() => setSelected(null)}
              onBrief={() => {
                openBriefing({ agentSlug: selected.slug });
                setSelected(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-[14px] font-semibold text-[hsl(var(--ink-primary))] tabular-nums">
        {value}
      </div>
    </div>
  );
}

function AgentDetail({
  agent,
  stats,
  onClose,
  onBrief,
}: {
  agent: Agent;
  stats: AgentStats | undefined;
  onClose: () => void;
  onBrief: () => void;
}) {
  const { data: runs } = useQuery({
    queryKey: ['command', 'agent', agent.id, 'recent'],
    queryFn: () => getAgentRecentRuns(agent.id, 10),
    refetchInterval: 15_000,
  });
  const openRun = useCommandStore((s) => s.openRun);

  const caps = Array.isArray(agent.capabilities)
    ? (agent.capabilities as string[])
    : agent.capabilities && typeof agent.capabilities === 'object'
      ? Object.keys(agent.capabilities as Record<string, unknown>)
      : [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-6 pt-7 pb-6 border-b border-[hsl(var(--hairline))]"
        style={{
          background: `linear-gradient(180deg, ${agent.color_hex}10, transparent)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-[26px] shrink-0 ring-1 ring-inset"
            style={{
              background: `${agent.color_hex}22`,
              color: agent.color_hex,
              // @ts-expect-error css var
              '--tw-ring-color': `${agent.color_hex}55`,
            }}
          >
            {agent.avatar_emoji ?? agent.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
              {agent.role}
            </div>
            <h2 className="text-[22px] font-display font-bold text-[hsl(var(--ink-primary))] leading-tight mt-0.5">
              {agent.name}
            </h2>
            {agent.model && (
              <div className="font-mono text-[10.5px] text-[hsl(var(--ink-muted))] mt-1">
                {agent.model}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-primary))] hover:bg-[hsl(var(--surface-3))]"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {agent.description && (
          <p className="text-[13.5px] text-[hsl(var(--ink-secondary))] leading-relaxed mt-4">
            {agent.description}
          </p>
        )}

        <button
          onClick={onBrief}
          className="mt-5 w-full flex items-center justify-center gap-2 h-10 rounded-md text-[13px] font-medium text-white transition-all shadow-sm hover:shadow"
          style={{
            background: `linear-gradient(135deg, ${agent.color_hex}, ${agent.color_hex}dd)`,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Briefar {agent.name}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats */}
        <Section title="Telemetria">
          <div className="grid grid-cols-2 gap-3">
            <BigStat label="Runs totais" value={stats?.total_runs ?? 0} />
            <BigStat
              label="Taxa de sucesso"
              value={
                stats && stats.total_runs
                  ? `${Math.round((stats.completed / stats.total_runs) * 100)}%`
                  : '—'
              }
            />
            <BigStat
              label="Duração média"
              value={
                stats?.avg_duration_ms
                  ? `${(stats.avg_duration_ms / 1000).toFixed(1)}s`
                  : '—'
              }
            />
            <BigStat
              label="Tokens consumidos"
              value={stats?.total_tokens ? compact(stats.total_tokens) : '—'}
            />
            <BigStat
              label="Custo acumulado"
              value={
                stats?.total_cost_usd
                  ? `$${stats.total_cost_usd.toFixed(3)}`
                  : '—'
              }
            />
            <BigStat
              label="Em execução"
              value={stats?.in_flight ?? 0}
              accent={(stats?.in_flight ?? 0) > 0 ? agent.color_hex : undefined}
            />
          </div>
        </Section>

        {caps.length > 0 && (
          <Section title="Capacidades">
            <div className="flex flex-wrap gap-1.5">
              {caps.map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 rounded text-[11px] font-mono lowercase border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] text-[hsl(var(--ink-secondary))]"
                >
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}

        {agent.system_prompt && (
          <Section title="Prompt base">
            <div className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] p-3 max-h-[200px] overflow-y-auto">
              <pre className="text-[11.5px] font-mono text-[hsl(var(--ink-secondary))] whitespace-pre-wrap leading-relaxed">
                {agent.system_prompt}
              </pre>
            </div>
          </Section>
        )}

        <Section title="Execuções recentes">
          {!runs || runs.length === 0 ? (
            <div className="text-[12.5px] text-[hsl(var(--ink-muted))] py-4 text-center">
              Sem execuções ainda. Seja o primeiro a brifear.
            </div>
          ) : (
            <div className="space-y-1">
              {runs.map((r) => {
                const live = r.status === 'thinking' || r.status === 'acting';
                const failed = r.status === 'failed';
                return (
                  <button
                    key={r.id}
                    onClick={() => openRun(r.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-3))] transition-all flex items-start gap-2.5"
                  >
                    <div className="mt-0.5 shrink-0">
                      {live ? (
                        <Zap className="w-3.5 h-3.5 text-[hsl(var(--brand-magenta))]" />
                      ) : failed ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--brand-magenta))]" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--jade))]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-[hsl(var(--ink-primary))] line-clamp-2">
                        {r.input}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mt-1">
                        {r.status} ·{' '}
                        {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : timeAgo(r.started_at)}
                        {(r.tokens_in || r.tokens_out) ? ` · ${(r.tokens_in ?? 0) + (r.tokens_out ?? 0)} tk` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-[hsl(var(--hairline))] last:border-b-0">
      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] px-3 py-2.5">
      <div className="font-mono text-[9.5px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
        {label}
      </div>
      <div
        className="text-[18px] font-display font-semibold tabular-nums mt-0.5"
        style={{ color: accent ?? 'hsl(var(--ink-primary))' }}
      >
        {value}
      </div>
    </div>
  );
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// Suppress unused
void AnimatePresence;

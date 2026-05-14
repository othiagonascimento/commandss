/**
 * Command AI — Reasoning Timeline.
 * Feed cronológico unificado de runs, decisões e logs do sistema.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { listAgents, type Agent } from '@/lib/command/agents';
import { fetchTimeline, type TimelineEvent, type TimelineKind } from '@/lib/command/timeline';
import { useCommandStore } from '@/lib/command/store';
import {
  Activity,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  Radio,
} from 'lucide-react';

type SourceFilter = 'all' | 'run' | 'decision' | 'log';

export default function CommandTimeline() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const openRun = useCommandStore((s) => s.openRun);
  const [source, setSource] = useState<SourceFilter>('all');
  const [agentId, setAgentId] = useState<string | null>(null);

  const { data: agents } = useQuery({
    queryKey: ['command', 'agents', 'lite-timeline'],
    queryFn: listAgents,
    staleTime: 5 * 60_000,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['command', 'timeline', wsId, source, agentId],
    queryFn: () =>
      fetchTimeline({
        workspaceId: wsId,
        agentId,
        source,
        limit: 120,
      }),
    refetchInterval: 12_000,
  });

  const agentMap = useMemo(
    () => new Map<string, Agent>((agents ?? []).map((a) => [a.id, a])),
    [agents],
  );

  const groups = useMemo(() => groupByDay(events ?? []), [events]);

  return (
    <div className="px-8 py-10 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-2">
          Memória operacional
        </div>
        <h1 className="font-display text-[34px] font-bold tracking-tight text-[hsl(var(--ink-primary))] leading-none">
          Linha de raciocínio.
        </h1>
        <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-3 max-w-[600px] leading-relaxed">
          Cada pensamento, decisão e movimento dos agentes — em ordem.
          Auditoria viva da sua operação.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-[hsl(var(--hairline))]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mr-1">
          fonte
        </span>
        {(['all', 'run', 'decision', 'log'] as SourceFilter[]).map((s) => (
          <FilterChip key={s} active={source === s} onClick={() => setSource(s)}>
            {SOURCE_LABEL[s]}
          </FilterChip>
        ))}
        <div className="w-px h-5 bg-[hsl(var(--hairline))] mx-2" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mr-1">
          agente
        </span>
        <FilterChip active={!agentId} onClick={() => setAgentId(null)}>
          Todos
        </FilterChip>
        {agents?.map((a) => (
          <FilterChip
            key={a.id}
            active={agentId === a.id}
            onClick={() => setAgentId(a.id)}
            color={a.color_hex}
          >
            <span style={{ color: a.color_hex }} className="mr-1">
              {a.avatar_emoji ?? '•'}
            </span>
            {a.name}
          </FilterChip>
        ))}
      </div>

      {/* Feed */}
      {isLoading && (
        <div className="text-center py-16 text-[12.5px] text-[hsl(var(--ink-muted))] font-mono uppercase tracking-widest">
          carregando memória…
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <div className="text-center py-16">
          <Radio className="w-6 h-6 mx-auto text-[hsl(var(--ink-faint))] mb-3" />
          <div className="text-[13.5px] text-[hsl(var(--ink-muted))]">
            Sem eventos no recorte atual.
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mt-1">
            ⌘K para acordar a tropa.
          </div>
        </div>
      )}

      {groups.map(([day, items]) => (
        <div key={day} className="mb-8">
          <div className="sticky top-12 z-10 bg-[hsl(var(--canvas)/0.92)] backdrop-blur py-2 mb-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
              {day}
            </div>
          </div>
          <div className="relative pl-7">
            {/* spine */}
            <div className="absolute left-[10px] top-1 bottom-1 w-px bg-[hsl(var(--hairline))]" />
            {items.map((ev, i) => {
              const a = ev.agent_id ? agentMap.get(ev.agent_id) : undefined;
              const meta = META[ev.kind];
              const accent = a?.color_hex ?? meta.color;
              const clickable = ev.source === 'run' || (ev.source === 'decision' && (ev.meta as Record<string, unknown>).run_id);
              const onClick = clickable
                ? () => {
                    if (ev.source === 'run') openRun(ev.ref_id);
                    else if (ev.source === 'decision') {
                      const rid = (ev.meta as Record<string, unknown>).run_id;
                      if (typeof rid === 'string') openRun(rid);
                    }
                  }
                : undefined;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                  className="relative mb-3 group"
                >
                  {/* node */}
                  <div
                    className="absolute -left-[19px] top-2 w-[14px] h-[14px] rounded-full flex items-center justify-center ring-2 ring-[hsl(var(--canvas))]"
                    style={{ background: `${accent}22`, color: accent }}
                  >
                    <meta.Icon className="w-2.5 h-2.5" />
                  </div>

                  <button
                    type="button"
                    onClick={onClick}
                    disabled={!clickable}
                    className={`block w-full text-left rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] px-4 py-3 transition-all ${
                      clickable
                        ? 'hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-2))] cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="font-mono text-[9.5px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: `${accent}1f`, color: accent }}
                      >
                        {meta.label}
                      </span>
                      {a && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-muted))]">
                          {a.name}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] text-[hsl(var(--ink-faint))]">
                        {timeOnly(ev.at)}
                      </span>
                    </div>
                    <div className="text-[13.5px] text-[hsl(var(--ink-primary))] leading-snug line-clamp-2">
                      {ev.title}
                    </div>
                    {ev.detail && (
                      <div className="text-[12px] text-[hsl(var(--ink-muted))] leading-relaxed mt-1.5 line-clamp-2">
                        {ev.detail}
                      </div>
                    )}
                    {(ev.meta as Record<string, unknown>).duration_ms != null && (
                      <div className="font-mono text-[10px] text-[hsl(var(--ink-faint))] mt-2 uppercase tracking-widest flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {(((ev.meta as Record<string, number>).duration_ms ?? 0) / 1000).toFixed(1)}s
                        </span>
                        {Boolean((ev.meta as Record<string, number>).tokens) && (
                          <span>{(ev.meta as Record<string, number>).tokens} tk</span>
                        )}
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-2.5 h-7 rounded-md text-[11.5px] whitespace-nowrap transition-colors border ${
        active
          ? 'bg-[hsl(var(--surface-3))] text-[hsl(var(--ink-primary))] border-[hsl(var(--hairline-strong))]'
          : 'border-transparent text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface-2))]'
      }`}
      style={active && color ? { borderColor: color + '60' } : undefined}
    >
      {children}
    </button>
  );
}

const SOURCE_LABEL: Record<SourceFilter, string> = {
  all: 'Tudo',
  run: 'Runs',
  decision: 'Decisões',
  log: 'Sistema',
};

const META: Record<TimelineKind, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  'run.started': { label: 'Iniciou', color: 'hsl(var(--ink-muted))', Icon: Brain },
  'run.completed': { label: 'Concluiu', color: 'hsl(var(--jade))', Icon: CheckCircle2 },
  'run.failed': { label: 'Falhou', color: 'hsl(var(--brand-magenta))', Icon: AlertTriangle },
  'run.waiting': { label: 'Aguardando', color: '#f59e0b', Icon: Clock },
  'decision.created': { label: 'Decisão', color: '#a855f7', Icon: Gavel },
  'decision.approved': { label: 'Aprovada', color: 'hsl(var(--jade))', Icon: ThumbsUp },
  'decision.rejected': { label: 'Rejeitada', color: 'hsl(var(--brand-magenta))', Icon: ThumbsDown },
  log: { label: 'Sistema', color: 'hsl(var(--ink-muted))', Icon: Activity },
};

function groupByDay(events: TimelineEvent[]): Array<[string, TimelineEvent[]]> {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const day = dayLabel(e.at);
    const arr = map.get(day) ?? [];
    arr.push(e);
    map.set(day, arr);
  }
  return Array.from(map.entries());
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return 'Hoje';
  if (same(d, yest)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * RunTheater — modal cinemático mostrando o agente "pensando" em tempo real.
 * Subscreve via Supabase Realtime no schema command_ai.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';
import { commandDb } from '@/lib/command/db';
import { X, Brain, Wrench, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface RunStep {
  t: number;
  kind: 'thought' | 'tool_call' | 'tool_result' | 'final' | 'error';
  label?: string;
  content?: string;
}

interface RunRow {
  id: string;
  status: string;
  input: string;
  output: string | null;
  steps: RunStep[] | null;
  duration_ms: number | null;
  error: string | null;
  agent_id: string;
  started_at: string;
  tokens_in: number | null;
  tokens_out: number | null;
}

interface AgentMeta {
  name: string;
  role: string;
  color_hex: string;
  avatar_emoji: string | null;
}

export function RunTheater() {
  const runId = useCommandStore((s) => s.activeRunId);
  const close = useCommandStore((s) => s.closeRun);
  const [run, setRun] = useState<RunRow | null>(null);
  const [agent, setAgent] = useState<AgentMeta | null>(null);

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setAgent(null);
      return;
    }

    let cancelled = false;

    const fetchRun = async () => {
      const { data } = await commandDb
        .from('agent_runs')
        .select('id,status,input,output,steps,duration_ms,error,agent_id,started_at,tokens_in,tokens_out')
        .eq('id', runId)
        .maybeSingle();
      if (!cancelled && data) {
        setRun(data as RunRow);
        if (!agent || data.agent_id !== run?.agent_id) {
          const { data: ag } = await commandDb
            .from('agents')
            .select('name,role,color_hex,avatar_emoji')
            .eq('id', data.agent_id)
            .maybeSingle();
          if (!cancelled && ag) setAgent(ag as AgentMeta);
        }
      }
    };

    fetchRun();

    const channel = commandDb
      .channel(`run-${runId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'command_ai', table: 'agent_runs', filter: `id=eq.${runId}` },
        (payload) => {
          if (!cancelled) setRun(payload.new as RunRow);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      commandDb.removeChannel(channel);
    };
  }, [runId, agent, run?.agent_id]);

  // ESC fecha
  useEffect(() => {
    if (!runId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runId, close]);

  return (
    <AnimatePresence>
      {runId && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-[hsl(var(--canvas)/0.78)] backdrop-blur-2xl" />
          <motion.div
            initial={{ y: 20, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-[min(820px,94vw)] max-h-[82vh] flex flex-col rounded-2xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2)/0.94)] backdrop-blur-2xl shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 h-14 border-b border-[hsl(var(--hairline))] shrink-0">
              {agent && (
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[15px]"
                  style={{ background: `${agent.color_hex}20`, color: agent.color_hex }}
                >
                  {agent.avatar_emoji ?? agent.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-[hsl(var(--ink-primary))] truncate">
                  {agent?.name ?? 'Agente'}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] truncate">
                  {run ? statusLine(run) : 'conectando…'}
                </div>
              </div>
              {run?.status === 'thinking' || run?.status === 'acting' ? (
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: agent?.color_hex ?? 'hsl(var(--brand-magenta))' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              ) : null}
              <button
                onClick={close}
                className="ml-2 p-1.5 rounded hover:bg-[hsl(var(--surface-3))] text-[hsl(var(--ink-muted))]"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Briefing */}
            <div className="px-6 py-4 border-b border-[hsl(var(--hairline))] shrink-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-1.5">
                Briefing
              </div>
              <div className="text-[13.5px] text-[hsl(var(--ink-secondary))] leading-relaxed">
                {run?.input ?? '…'}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {(run?.steps ?? []).map((s, i) => (
                <StepLine key={i} step={s} agentColor={agent?.color_hex} />
              ))}
              {run && ['thinking', 'acting'].includes(run.status) && (
                <motion.div
                  className="flex items-center gap-2 pl-7 text-[12px] text-[hsl(var(--ink-muted))]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-[hsl(var(--ink-muted))]"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest">processando</span>
                </motion.div>
              )}
            </div>

            {/* Output */}
            {run?.output && (
              <div className="border-t border-[hsl(var(--hairline))] px-6 py-5 max-h-[34vh] overflow-y-auto bg-[hsl(var(--surface-1))] shrink-0">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-2">
                  <Sparkles className="w-3 h-3" />
                  Entregável
                </div>
                <div className="text-[13.5px] leading-relaxed text-[hsl(var(--ink-primary))] whitespace-pre-wrap">
                  {run.output}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[hsl(var(--hairline))] px-6 py-2.5 flex items-center justify-between font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest shrink-0">
              <span>
                {run?.tokens_in || run?.tokens_out
                  ? `${(run.tokens_in ?? 0) + (run.tokens_out ?? 0)} tokens`
                  : '—'}
              </span>
              <span>
                {run?.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : 'em curso'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function statusLine(r: RunRow) {
  switch (r.status) {
    case 'thinking':
      return 'pensando…';
    case 'acting':
      return 'executando…';
    case 'waiting_approval':
      return 'aguardando aprovação';
    case 'completed':
      return 'concluído';
    case 'failed':
      return r.error ? `falha · ${r.error.slice(0, 60)}` : 'falha';
    default:
      return r.status;
  }
}

function StepLine({ step, agentColor }: { step: RunStep; agentColor?: string }) {
  const Icon = iconFor(step.kind);
  const color =
    step.kind === 'error'
      ? 'hsl(var(--brand-magenta))'
      : step.kind === 'final'
        ? 'hsl(var(--jade))'
        : (agentColor ?? 'hsl(var(--ink-muted))');

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3"
    >
      <div
        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        {step.label && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
            {step.label}
          </div>
        )}
        {step.content && (
          <div className="text-[13px] text-[hsl(var(--ink-primary))] leading-snug">{step.content}</div>
        )}
      </div>
    </motion.div>
  );
}

function iconFor(k: RunStep['kind']) {
  switch (k) {
    case 'thought':
      return Brain;
    case 'tool_call':
    case 'tool_result':
      return Wrench;
    case 'final':
      return CheckCircle2;
    case 'error':
      return AlertTriangle;
    default:
      return Brain;
  }
}

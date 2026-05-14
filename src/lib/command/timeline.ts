/**
 * Command AI — Reasoning Timeline.
 * Unifica agent_runs, decisions e command_log num feed cronológico único.
 */
import { commandDb } from './db';

export type TimelineKind =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'run.waiting'
  | 'decision.created'
  | 'decision.approved'
  | 'decision.rejected'
  | 'log';

export interface TimelineEvent {
  id: string;
  at: string;
  kind: TimelineKind;
  agent_id: string | null;
  workspace_id: string | null;
  title: string;
  detail: string | null;
  meta: Record<string, unknown>;
  source: 'run' | 'decision' | 'log';
  ref_id: string;
}

interface RunRow {
  id: string;
  agent_id: string;
  workspace_id: string;
  status: string;
  input: string;
  output: string | null;
  error: string | null;
  duration_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  started_at: string;
  finished_at: string | null;
}

interface DecisionRow {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  run_id: string | null;
  kind: string;
  title: string;
  summary: string | null;
  status: string;
  confidence: number | null;
  decided_at: string | null;
  created_at: string;
}

interface LogRow {
  id: string;
  workspace_id: string | null;
  kind: string;
  actor: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface TimelineFilter {
  workspaceId?: string | null;
  agentId?: string | null;
  source?: 'all' | 'run' | 'decision' | 'log';
  limit?: number;
}

export async function fetchTimeline(filter: TimelineFilter = {}): Promise<TimelineEvent[]> {
  const limit = filter.limit ?? 80;
  const want = filter.source ?? 'all';

  const promises: Array<PromiseLike<TimelineEvent[]>> = [];

  if (want === 'all' || want === 'run') {
    let qr = commandDb
      .from('agent_runs')
      .select(
        'id,agent_id,workspace_id,status,input,output,error,duration_ms,tokens_in,tokens_out,started_at,finished_at',
      )
      .order('started_at', { ascending: false })
      .limit(limit);
    if (filter.workspaceId) qr = qr.eq('workspace_id', filter.workspaceId);
    if (filter.agentId) qr = qr.eq('agent_id', filter.agentId);
    promises.push(
      qr.then(({ data }) => {
        const out: TimelineEvent[] = [];
        for (const r of ((data ?? []) as RunRow[])) {
          // started event
          out.push({
            id: `run-start-${r.id}`,
            at: r.started_at,
            kind: 'run.started',
            agent_id: r.agent_id,
            workspace_id: r.workspace_id,
            title: r.input,
            detail: null,
            meta: { tokens: (r.tokens_in ?? 0) + (r.tokens_out ?? 0) },
            source: 'run',
            ref_id: r.id,
          });
          if (r.finished_at) {
            const kind: TimelineKind =
              r.status === 'completed'
                ? 'run.completed'
                : r.status === 'failed'
                  ? 'run.failed'
                  : 'run.waiting';
            out.push({
              id: `run-end-${r.id}`,
              at: r.finished_at,
              kind,
              agent_id: r.agent_id,
              workspace_id: r.workspace_id,
              title: r.input,
              detail:
                kind === 'run.failed'
                  ? r.error
                  : (r.output ? r.output.slice(0, 240) : null),
              meta: {
                duration_ms: r.duration_ms,
                tokens: (r.tokens_in ?? 0) + (r.tokens_out ?? 0),
              },
              source: 'run',
              ref_id: r.id,
            });
          }
        }
        return out;
      }),
    );
  }

  if (want === 'all' || want === 'decision') {
    let qd = commandDb
      .from('decisions')
      .select(
        'id,agent_id,workspace_id,run_id,kind,title,summary,status,confidence,decided_at,created_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (filter.workspaceId) qd = qd.eq('workspace_id', filter.workspaceId);
    if (filter.agentId) qd = qd.eq('agent_id', filter.agentId);
    promises.push(
      qd.then(({ data }) => {
        const out: TimelineEvent[] = [];
        for (const d of ((data ?? []) as DecisionRow[])) {
          out.push({
            id: `dec-create-${d.id}`,
            at: d.created_at,
            kind: 'decision.created',
            agent_id: d.agent_id,
            workspace_id: d.workspace_id,
            title: d.title,
            detail: d.summary,
            meta: {
              kind: d.kind,
              confidence: d.confidence,
              run_id: d.run_id,
            },
            source: 'decision',
            ref_id: d.id,
          });
          if (d.decided_at && (d.status === 'approved' || d.status === 'rejected')) {
            out.push({
              id: `dec-${d.status}-${d.id}`,
              at: d.decided_at,
              kind: d.status === 'approved' ? 'decision.approved' : 'decision.rejected',
              agent_id: d.agent_id,
              workspace_id: d.workspace_id,
              title: d.title,
              detail: null,
              meta: { run_id: d.run_id },
              source: 'decision',
              ref_id: d.id,
            });
          }
        }
        return out;
      }),
    );
  }

  if (want === 'all' || want === 'log') {
    let ql = commandDb
      .from('command_log')
      .select('id,workspace_id,kind,actor,payload,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (filter.workspaceId) ql = ql.eq('workspace_id', filter.workspaceId);
    promises.push(
      ql.then(({ data }) => {
        const out: TimelineEvent[] = [];
        for (const l of ((data ?? []) as LogRow[])) {
          out.push({
            id: `log-${l.id}`,
            at: l.created_at,
            kind: 'log',
            agent_id: null,
            workspace_id: l.workspace_id,
            title: l.kind,
            detail: l.actor,
            meta: l.payload ?? {},
            source: 'log',
            ref_id: l.id,
          });
        }
        return out;
      }),
    );
  }

  const all = (await Promise.all(promises)).flat();
  all.sort((a, b) => (a.at < b.at ? 1 : -1));
  return all.slice(0, limit);
}

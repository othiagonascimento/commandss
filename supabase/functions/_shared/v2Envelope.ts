/**
 * Master Read Contract v2 — server-side helper.
 *
 * Wraps any payload with standard meta envelope:
 *   { data, meta: { schema_version, generated_at, source_project_id, method, confidence, freshness, warnings } }
 *
 * Use this in every CRM edge function consumed by Master Panel critical widgets.
 */

const SOURCE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID')
  ?? Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\./)?.[1]
  ?? 'unknown';

export type V2Method =
  | 'live' | 'cached' | 'snapshot' | 'wrapped'
  | 'fallback' | 'estimated' | 'unavailable' | 'unknown';

export type V2Confidence = 'high' | 'medium' | 'low' | 'unknown';
export type V2FreshnessStatus = 'fresh' | 'stale' | 'missing' | 'unknown';

export interface V2Freshness {
  status: V2FreshnessStatus;
  observed_at: string | null;
  age_seconds: number | null;
  stale_after_seconds: number | null;
}

export interface V2Meta {
  schema_version: 'v2';
  generated_at: string;
  source_project_id: string;
  method: V2Method;
  confidence: V2Confidence;
  freshness: V2Freshness;
  warnings: string[];
}

export interface V2Envelope<T> {
  data: T;
  meta: V2Meta;
}

export interface MakeEnvelopeArgs {
  method: V2Method;
  confidence?: V2Confidence;
  /** ISO timestamp when the underlying data was actually observed/captured. */
  observedAt?: string | Date | null;
  /** After how many seconds the value is considered stale. Default 600 (10min). */
  staleAfterSeconds?: number;
  warnings?: string[];
}

export function computeFreshness(args: {
  observedAt?: string | Date | null;
  staleAfterSeconds?: number;
}): V2Freshness {
  const stale = args.staleAfterSeconds ?? 600;
  if (!args.observedAt) {
    return { status: 'missing', observed_at: null, age_seconds: null, stale_after_seconds: stale };
  }
  const obs = typeof args.observedAt === 'string' ? new Date(args.observedAt) : args.observedAt;
  if (Number.isNaN(obs.getTime())) {
    return { status: 'unknown', observed_at: null, age_seconds: null, stale_after_seconds: stale };
  }
  const ageSec = Math.floor((Date.now() - obs.getTime()) / 1000);
  return {
    status: ageSec > stale ? 'stale' : 'fresh',
    observed_at: obs.toISOString(),
    age_seconds: Math.max(0, ageSec),
    stale_after_seconds: stale,
  };
}

export function makeV2Envelope<T>(data: T, args: MakeEnvelopeArgs): V2Envelope<T> {
  const freshness = computeFreshness({
    observedAt: args.observedAt,
    staleAfterSeconds: args.staleAfterSeconds,
  });

  // Confidence auto-degrade rules
  let confidence: V2Confidence = args.confidence ?? 'high';
  if (args.method === 'estimated' || args.method === 'fallback') {
    confidence = confidence === 'high' ? 'medium' : confidence;
  }
  if (args.method === 'unavailable') confidence = 'unknown';
  if (freshness.status === 'stale') confidence = confidence === 'high' ? 'medium' : confidence;
  if (freshness.status === 'missing') confidence = 'unknown';

  return {
    data,
    meta: {
      schema_version: 'v2',
      generated_at: new Date().toISOString(),
      source_project_id: SOURCE_PROJECT_ID,
      method: args.method,
      confidence,
      freshness,
      warnings: args.warnings ?? [],
    },
  };
}

/** Builds an empty/unavailable envelope (use when data source has no rows). */
export function makeUnavailableEnvelope<T>(emptyValue: T, reason: string): V2Envelope<T> {
  return makeV2Envelope(emptyValue, {
    method: 'unavailable',
    confidence: 'unknown',
    observedAt: null,
    warnings: [reason],
  });
}

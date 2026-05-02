/**
 * Master Read Contract v2
 *
 * Standard envelope for all critical Master Panel reads from CRM Supabase.
 *
 * Shape:
 *   { data: T, meta: MasterReadMeta }
 *
 * Backward compatibility:
 *   - If response has no `meta` key, it's treated as legacy v1 and wrapped
 *     with meta.schema_version='v1' + meta.method='unknown'.
 *   - UIs MUST display a "contrato legado" badge when v1.
 */

import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const ConfidenceLevels = ['high', 'medium', 'low', 'unknown'] as const;
export type Confidence = (typeof ConfidenceLevels)[number];

export const FreshnessStatuses = ['fresh', 'stale', 'missing', 'unknown'] as const;
export type FreshnessStatus = (typeof FreshnessStatuses)[number];

export const ReadMethods = [
  'live',          // direct query to source of truth
  'cached',        // valid cache hit
  'snapshot',      // periodic snapshot (e.g. ops_health_snapshots)
  'wrapped',       // frontend wrapper around legacy v1 endpoint
  'fallback',      // best-effort using secondary source
  'estimated',     // computed/inferred (NOT measured)
  'unavailable',   // no usable data
  'unknown',
] as const;
export type ReadMethod = (typeof ReadMethods)[number];

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const FreshnessSchema = z.object({
  status: z.enum(FreshnessStatuses),
  observed_at: z.string().datetime().nullable().optional(),
  age_seconds: z.number().nonnegative().nullable().optional(),
  stale_after_seconds: z.number().positive().nullable().optional(),
});

export const MasterReadMetaSchema = z.object({
  schema_version: z.enum(['v1', 'v2']),
  generated_at: z.string().datetime(),
  source_project_id: z.string().min(1),
  method: z.enum(ReadMethods),
  confidence: z.enum(ConfidenceLevels),
  freshness: FreshnessSchema,
  warnings: z.array(z.string()).default([]),
});

export type MasterReadMeta = z.infer<typeof MasterReadMetaSchema>;
export type Freshness = z.infer<typeof FreshnessSchema>;

export interface MasterReadEnvelope<T> {
  data: T;
  meta: MasterReadMeta;
}

// ─── Detector ────────────────────────────────────────────────────────────────

function looksLikeV2(value: unknown): value is { data: unknown; meta: unknown } {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (!('data' in r) || !('meta' in r)) return false;
  const meta = r.meta;
  if (!meta || typeof meta !== 'object') return false;
  const m = meta as Record<string, unknown>;
  return typeof m.schema_version === 'string' && typeof m.generated_at === 'string';
}

// ─── Legacy v1 wrapper ───────────────────────────────────────────────────────

export function wrapLegacyV1<T>(
  raw: T,
  opts: { sourceProjectId: string; widget: string }
): MasterReadEnvelope<T> {
  return {
    data: raw,
    meta: {
      schema_version: 'v1',
      generated_at: new Date().toISOString(),
      source_project_id: opts.sourceProjectId,
      method: 'wrapped',
      confidence: 'unknown',
      freshness: { status: 'unknown', observed_at: null, age_seconds: null, stale_after_seconds: null },
      warnings: [`Resposta v1 (sem contrato) — widget '${opts.widget}' rodando em modo de compatibilidade.`],
    },
  };
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export interface ParseResult<T> {
  ok: boolean;
  envelope: MasterReadEnvelope<T> | null;
  schemaError: z.ZodError | null;
  legacy: boolean; // true when input was v1
}

export interface ParseOptions<T> {
  /** Zod schema for the inner `data` payload. */
  dataSchema: z.ZodType<T>;
  /** Identifier for the widget consuming this — used in legacy warnings. */
  widget: string;
  /** CRM project id for legacy fallback meta. */
  sourceProjectId: string;
}

/**
 * parseMasterRead<T>()
 *
 * Validates the v2 envelope. Accepts legacy v1 responses (raw data, no meta)
 * and auto-wraps them so the UI never breaks.
 *
 * On schema mismatch (v2 envelope present but invalid), returns ok=false with
 * the ZodError so the caller can surface a clear message.
 */
export function parseMasterRead<T>(
  raw: unknown,
  opts: ParseOptions<T>
): ParseResult<T> {
  // Treat null/undefined as missing data
  if (raw == null) {
    return {
      ok: true,
      legacy: false,
      schemaError: null,
      envelope: {
        data: null as unknown as T,
        meta: {
          schema_version: 'v2',
          generated_at: new Date().toISOString(),
          source_project_id: opts.sourceProjectId,
          method: 'unavailable',
          confidence: 'unknown',
          freshness: { status: 'missing', observed_at: null, age_seconds: null, stale_after_seconds: null },
          warnings: [`Sem resposta da fonte (widget '${opts.widget}').`],
        },
      },
    };
  }

  if (looksLikeV2(raw)) {
    const envelopeSchema = z.object({
      data: opts.dataSchema,
      meta: MasterReadMetaSchema,
    });
    const result = envelopeSchema.safeParse(raw);
    if (!result.success) {
      return { ok: false, envelope: null, schemaError: result.error, legacy: false };
    }
    return { ok: true, envelope: result.data as MasterReadEnvelope<T>, schemaError: null, legacy: false };
  }

  // Legacy v1: validate inner shape only, then wrap
  const innerResult = opts.dataSchema.safeParse(raw);
  if (!innerResult.success) {
    return { ok: false, envelope: null, schemaError: innerResult.error, legacy: true };
  }
  return {
    ok: true,
    envelope: wrapLegacyV1(innerResult.data, { sourceProjectId: opts.sourceProjectId, widget: opts.widget }),
    schemaError: null,
    legacy: true,
  };
}

// ─── Helpers for UI ──────────────────────────────────────────────────────────

/**
 * Returns true when meta indicates the value should NOT be shown as a real
 * metric (should be hidden, greyed out, or clearly flagged).
 */
export function isUntrustedRead(meta: MasterReadMeta | undefined | null): boolean {
  if (!meta) return true;
  if (meta.method === 'fallback' || meta.method === 'estimated' || meta.method === 'unavailable') return true;
  if (meta.freshness.status === 'stale' || meta.freshness.status === 'missing') return true;
  return false;
}

/**
 * Returns true when the metric should be completely hidden (not even greyed).
 */
export function shouldHideMetric(meta: MasterReadMeta | undefined | null): boolean {
  return !meta || meta.method === 'unavailable' || meta.freshness.status === 'missing';
}

/**
 * Computes a "best display age" string from meta. Prefer freshness.observed_at,
 * then meta.generated_at.
 */
export function getDisplayAgeMs(meta: MasterReadMeta | undefined | null): number | null {
  if (!meta) return null;
  const ts = meta.freshness.observed_at ?? meta.generated_at;
  if (!ts) return null;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return null;
  return Date.now() - t;
}

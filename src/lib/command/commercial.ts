/**
 * Command AI — Comercial: integra com o funil real do uopa.
 * Lê onboarding_submissions + tenants (master, schema public via supabase client)
 * e cruza com command_ai.tenant_pipeline (anotações comerciais).
 */
import { supabase } from "@/integrations/supabase/client";
import { commandDb } from "./db";

export type PipelineStage = "lead" | "qualifying" | "trial" | "active" | "lost" | "churned";

export const STAGES: { id: PipelineStage; title: string; tone: string }[] = [
  { id: "lead",       title: "Lead",        tone: "border-l-sky-400" },
  { id: "qualifying", title: "Qualificação", tone: "border-l-amber-400" },
  { id: "trial",      title: "Trial",       tone: "border-l-violet-400" },
  { id: "active",     title: "Ativo",       tone: "border-l-emerald-400" },
  { id: "lost",       title: "Perdido",     tone: "border-l-rose-400" },
  { id: "churned",    title: "Churn",       tone: "border-l-muted-foreground/40" },
];

export interface PipelineAnnotation {
  id?: string;
  tenant_id: string | null;
  onboarding_id: string | null;
  stage: PipelineStage;
  owner_id: string | null;
  next_step: string | null;
  expected_mrr_cents: number;
  lost_reason: string | null;
  last_touch_at: string | null;
  notes: string | null;
}

export interface PipelineEntry {
  key: string;                  // tenant:<id> ou onboarding:<id>
  source: "tenant" | "onboarding";
  tenant_id: string | null;
  onboarding_id: string | null;
  display_name: string;
  contact_email: string | null;
  origin_status: string | null; // status cru de onboarding/tenant
  plan_type: string | null;
  trial_ends_at: string | null;
  blocked: boolean;
  created_at: string;
  annotation: PipelineAnnotation | null;
}

const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

function deriveStage(
  source: "tenant" | "onboarding",
  status: string | null,
  blocked: boolean,
): PipelineStage {
  if (source === "onboarding") {
    if (status === "rejected") return "lost";
    if (status === "approved") return "qualifying";
    return "lead";
  }
  // tenant
  if (blocked || status === "cancelled" || status === "inactive") return "churned";
  if (status === "trial" || status === "trialing") return "trial";
  if (status === "active") return "active";
  return "qualifying";
}

export async function loadPipeline(): Promise<PipelineEntry[]> {
  const [onb, ten, ann] = await Promise.all([
    supabase
      .from("onboarding_submissions")
      .select("id, company_name, form_data, status, created_at, tenant_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("id, name, contact_email, plan_type, status, is_blocked, created_at")
      .order("created_at", { ascending: false }),
    commandDb.from("tenant_pipeline").select("*"),
  ]);

  if (onb.error) throw onb.error;
  if (ten.error) throw ten.error;
  if (ann.error) throw ann.error;

  // index annotations
  const byTenant = new Map<string, PipelineAnnotation>();
  const byOnb = new Map<string, PipelineAnnotation>();
  for (const a of arr(ann.data) as PipelineAnnotation[]) {
    if (a.tenant_id) byTenant.set(a.tenant_id, a);
    if (a.onboarding_id) byOnb.set(a.onboarding_id, a);
  }

  const entries: PipelineEntry[] = [];
  const linkedOnbIds = new Set<string>();

  // Tenants primeiro (têm prioridade — onboarding ligado a tenant é absorvido)
  for (const t of arr(ten.data) as Array<Record<string, unknown>>) {
    const tenantId = String(t.id);
    entries.push({
      key: `tenant:${tenantId}`,
      source: "tenant",
      tenant_id: tenantId,
      onboarding_id: null,
      display_name: String(t.name ?? "—"),
      contact_email: (t.contact_email as string) ?? null,
      origin_status: (t.status as string) ?? null,
      plan_type: (t.plan_type as string) ?? null,
      trial_ends_at: null,
      blocked: Boolean(t.is_blocked),
      created_at: String(t.created_at),
      annotation: byTenant.get(tenantId) ?? null,
    });
  }

  for (const o of arr(onb.data) as Array<Record<string, unknown>>) {
    const onbId = String(o.id);
    if (o.tenant_id) {
      linkedOnbIds.add(onbId);
      continue; // já representado pelo tenant
    }
    const form = (o.form_data ?? {}) as Record<string, unknown>;
    entries.push({
      key: `onboarding:${onbId}`,
      source: "onboarding",
      tenant_id: null,
      onboarding_id: onbId,
      display_name: String(o.company_name ?? form.name ?? "—"),
      contact_email: (form.email as string) ?? (form.contact_email as string) ?? null,
      origin_status: (o.status as string) ?? "pending",
      plan_type: null,
      trial_ends_at: null,
      blocked: false,
      created_at: String(o.created_at),
      annotation: byOnb.get(onbId) ?? null,
    });
  }

  return entries;
}

export function entryStage(e: PipelineEntry): PipelineStage {
  return e.annotation?.stage ?? deriveStage(e.source, e.origin_status, e.blocked);
}

export async function setStage(e: PipelineEntry, stage: PipelineStage, patch: Partial<PipelineAnnotation> = {}) {
  const base: PipelineAnnotation = {
    tenant_id: e.tenant_id,
    onboarding_id: e.onboarding_id,
    stage,
    owner_id: e.annotation?.owner_id ?? null,
    next_step: e.annotation?.next_step ?? null,
    expected_mrr_cents: e.annotation?.expected_mrr_cents ?? 0,
    lost_reason: e.annotation?.lost_reason ?? null,
    last_touch_at: new Date().toISOString(),
    notes: e.annotation?.notes ?? null,
    ...patch,
  };

  // upsert por target (tenant_id ou onboarding_id)
  const conflict = e.tenant_id ? "tenant_id" : "onboarding_id";
  const { error } = await commandDb.from("tenant_pipeline").upsert(base, { onConflict: conflict });
  if (error) throw error;
}

export async function updateAnnotation(e: PipelineEntry, patch: Partial<PipelineAnnotation>) {
  return setStage(e, entryStage(e), patch);
}

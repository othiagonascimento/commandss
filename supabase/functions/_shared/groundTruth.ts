// Command v3 — Ground Truth Collector.
// Roda determinístico ANTES de qualquer LLM. Coleta o estado real do tenant
// em paralelo. Reduz custo (LLM não precisa "perguntar") e elimina alucinação.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface GroundTruth {
  tenant_id: string | null;
  collected_at: string;
  tenant?: Record<string, unknown> | null;
  whatsapp?: { instances: number; connected: number; last_seen?: string | null } | null;
  ai?: { runs_24h: number; cost_cents_24h: number; error_rate: number } | null;
  leads?: { total: number; created_24h: number } | null;
  billing?: { subscription_status: string | null; period_end: string | null } | null;
  errors?: { recent_count: number } | null;
  notes: string[];
}

export async function collectGroundTruth(
  pub: SupabaseClient,
  tenantId: string | null,
): Promise<GroundTruth> {
  const gt: GroundTruth = {
    tenant_id: tenantId,
    collected_at: new Date().toISOString(),
    notes: [],
  };
  if (!tenantId) {
    gt.notes.push("sem tenant_id — ground truth limitada ao escopo global");
    return gt;
  }

  const since = new Date(Date.now() - 86400_000).toISOString();

  const tasks = await Promise.allSettled([
    pub.from("tenants").select("id,name,subdomain,status,plan_id,created_at").eq("id", tenantId).maybeSingle(),
    pub.from("whatsapp_instances").select("status,last_seen_at").eq("tenant_id", tenantId),
    pub.from("ai_runs").select("cost_cents,status").eq("tenant_id", tenantId).gte("created_at", since),
    pub.from("leads").select("id,created_at", { count: "exact" }).eq("tenant_id", tenantId).is("deleted_at", null),
    pub.from("subscriptions").select("status,current_period_end").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const settled = <T,>(i: number): T | null =>
    tasks[i].status === "fulfilled" ? ((tasks[i] as PromiseFulfilledResult<{ data: T }>).value.data ?? null) : null;

  gt.tenant = settled<Record<string, unknown>>(0);

  const wa = settled<Array<{ status: string; last_seen_at: string | null }>>(1) ?? [];
  gt.whatsapp = {
    instances: wa.length,
    connected: wa.filter((w) => w.status === "connected" || w.status === "open").length,
    last_seen: wa[0]?.last_seen_at ?? null,
  };

  const ai = settled<Array<{ cost_cents: number; status: string }>>(2) ?? [];
  gt.ai = {
    runs_24h: ai.length,
    cost_cents_24h: ai.reduce((s, r) => s + (r.cost_cents ?? 0), 0),
    error_rate: ai.length ? ai.filter((r) => r.status === "error").length / ai.length : 0,
  };

  const leadsRes = tasks[3].status === "fulfilled" ? (tasks[3] as any).value : null;
  const leadsList = (leadsRes?.data ?? []) as Array<{ created_at: string }>;
  gt.leads = {
    total: leadsRes?.count ?? leadsList.length ?? 0,
    created_24h: leadsList.filter((l) => l.created_at >= since).length,
  };

  const sub = settled<{ status: string; current_period_end: string }>(4);
  gt.billing = {
    subscription_status: sub?.status ?? null,
    period_end: sub?.current_period_end ?? null,
  };

  // Erros recentes (placeholder — wire em log_api_usage se houver)
  gt.errors = { recent_count: 0 };

  // Avisos heurísticos
  if (gt.whatsapp.instances > 0 && gt.whatsapp.connected === 0)
    gt.notes.push("ALERTA: nenhuma instância WhatsApp conectada");
  if (gt.ai.error_rate > 0.1)
    gt.notes.push(`ALERTA: taxa de erro IA ${(gt.ai.error_rate * 100).toFixed(1)}%`);
  if (gt.billing.subscription_status && gt.billing.subscription_status !== "active")
    gt.notes.push(`ALERTA: subscription ${gt.billing.subscription_status}`);

  return gt;
}

// Command v3 — Catálogo expandido de ferramentas (~40 tools).
// Cada tool declara: domain (divisão), risk_level, scopes requeridos, executor.
// Read tools chamam edge functions existentes ou queries diretas. Write tools
// só executam pós-aprovação via command-decisions (ver executeRealTool).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type RiskLevel = "read" | "write_low" | "write_high" | "destructive";
export type Domain = "canais" | "inteligencia" | "operacao" | "dados" | "monetizacao" | "infra" | "qa";

export interface ToolDef {
  name: string;
  domain: Domain;
  risk: RiskLevel;
  scopes: string[];
  description: string;
  schema: Record<string, string>;
}

// Compat com v1 (alguns callers ainda usam ToolKind/scope/kind)
export type ToolKind = "read" | "write_low" | "write_high";

export const TOOLS: ToolDef[] = [
  // ===== CANAIS (8) =====
  { name: "whatsapp.status", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Status das instâncias WhatsApp do tenant.", schema: {} },
  { name: "whatsapp.last_messages", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Últimas N mensagens (in/out) do tenant.", schema: { limit: "number?" } },
  { name: "whatsapp.send_test", domain: "canais", risk: "write_high", scopes: ["channels:write"], description: "Envia mensagem teste por WhatsApp.", schema: { phone: "string", text: "string" } },
  { name: "instagram.status", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Status da conta Instagram conectada.", schema: {} },
  { name: "webhook.recent_events", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Webhooks recebidos nas últimas 24h.", schema: { limit: "number?" } },
  { name: "webhook.replay", domain: "canais", risk: "write_low", scopes: ["channels:write"], description: "Reenvia um webhook específico.", schema: { event_id: "uuid" } },
  { name: "email.deliverability", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Métricas de entregabilidade e bounce.", schema: {} },
  { name: "channel.error_rate", domain: "canais", risk: "read", scopes: ["channels:read"], description: "Taxa de erro consolidada por canal.", schema: { window_hours: "number?" } },

  // ===== INTELIGÊNCIA (10) =====
  { name: "ai.last_runs", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Últimas execuções de IA com modelo, custo, latência.", schema: { limit: "number?" } },
  { name: "ai.cost_breakdown", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Custo de IA por modelo nas últimas 24h.", schema: {} },
  { name: "ai.model_health", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Saúde dos modelos ativos (erro, latência p95).", schema: {} },
  { name: "rag.query_test", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Roda query de teste no RAG do tenant.", schema: { query: "string" } },
  { name: "rag.recall_score", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Score de recall do RAG nas últimas queries.", schema: {} },
  { name: "rag.docs_index_status", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Status de indexação dos documentos.", schema: {} },
  { name: "prompt.diff_vs_global", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Diff dos prompts do tenant vs template global.", schema: {} },
  { name: "prompt.simulate", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Simula prompt sem persistir.", schema: { input: "string" } },
  { name: "copilot.replay_session", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Re-executa sessão do copilot.", schema: { session_id: "string" } },
  { name: "agent.config_audit", domain: "inteligencia", risk: "read", scopes: ["ai:read"], description: "Audita configurações dos agentes ativos.", schema: {} },

  // ===== OPERAÇÃO (9) =====
  { name: "lead.timeline", domain: "operacao", risk: "read", scopes: ["leads:read"], description: "Linha do tempo completa de um lead.", schema: { lead_id: "uuid" } },
  { name: "funnel.conversion_drill", domain: "operacao", risk: "read", scopes: ["leads:read"], description: "Drill-down de conversão por estágio.", schema: {} },
  { name: "automation.last_executions", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Execuções recentes de automações.", schema: { limit: "number?" } },
  { name: "automation.test_dry_run", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Roda automação em modo seco.", schema: { automation_id: "uuid" } },
  { name: "sla.breaches", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "SLAs estourados nas últimas 24h.", schema: {} },
  { name: "playbook.coverage", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Cobertura dos playbooks vs estágios.", schema: {} },
  { name: "task.queue_depth", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Profundidade das filas internas.", schema: {} },
  { name: "notification.history", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Histórico de notificações enviadas.", schema: { limit: "number?" } },
  { name: "user.activity_trace", domain: "operacao", risk: "read", scopes: ["ops:read"], description: "Trace de atividade de um usuário operador.", schema: { user_id: "uuid" } },

  // ===== DADOS (8) =====
  { name: "schema.diff_vs_canonical", domain: "dados", risk: "read", scopes: ["data:read"], description: "Diff do schema do tenant vs canonical.", schema: {} },
  { name: "tenant.snapshot", domain: "dados", risk: "read", scopes: ["data:read"], description: "Snapshot completo do estado do tenant.", schema: {} },
  { name: "lead.duplicates_scan", domain: "dados", risk: "read", scopes: ["data:read"], description: "Detecta leads duplicados.", schema: {} },
  { name: "profile.completeness", domain: "dados", risk: "read", scopes: ["data:read"], description: "Completude dos perfis de usuário.", schema: {} },
  { name: "data.drift_report", domain: "dados", risk: "read", scopes: ["data:read"], description: "Relatório de drift de dados.", schema: {} },
  { name: "query.explain", domain: "dados", risk: "read", scopes: ["data:read"], description: "EXPLAIN ANALYZE de uma query do tenant.", schema: { query: "string" } },
  { name: "index.usage", domain: "dados", risk: "read", scopes: ["data:read"], description: "Uso de índices do banco do tenant.", schema: {} },
  { name: "rls.coverage_check", domain: "dados", risk: "read", scopes: ["data:read"], description: "Confere cobertura de RLS por tabela.", schema: {} },

  // ===== MONETIZAÇÃO (9) =====
  { name: "billing.tenant_health", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Saúde de cobrança do tenant.", schema: {} },
  { name: "mrr.attribution", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Atribuição de MRR.", schema: {} },
  { name: "quota.usage_vs_limit", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Consumo vs limite por recurso.", schema: {} },
  { name: "credit.consumption_drill", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Drill de consumo de créditos.", schema: {} },
  { name: "stripe.subscription_diag", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Diagnóstico da assinatura Stripe.", schema: {} },
  { name: "payment.failed_recent", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Pagamentos falhos recentes.", schema: { limit: "number?" } },
  { name: "plan.feature_access", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Confere acesso a features do plano.", schema: {} },
  { name: "pix.transaction_trace", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Trace de transação Pix.", schema: { tx_id: "string" } },
  { name: "uopa_pay.flow_check", domain: "monetizacao", risk: "read", scopes: ["billing:read"], description: "Confere fluxo do UÔPA Pay end-to-end.", schema: {} },

  // ===== INFRA (10) =====
  { name: "edge_function.invoke_log", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Logs de invocação de edge function.", schema: { function_name: "string", limit: "number?" } },
  { name: "edge_function.error_recent", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Erros recentes de edge functions.", schema: { window_hours: "number?" } },
  { name: "db.slow_queries", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Queries lentas via pg_stat_statements.", schema: {} },
  { name: "db.lock_check", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Locks ativos no banco.", schema: {} },
  { name: "migration.status", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Status das migrations.", schema: {} },
  { name: "storage.bucket_health", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Saúde dos buckets de storage.", schema: {} },
  { name: "cron.last_runs", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Últimas execuções dos crons.", schema: {} },
  { name: "secret.rotation_status", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Status de rotação de secrets.", schema: {} },
  { name: "cache.hit_rate", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Hit rate de cache.", schema: {} },
  { name: "realtime.subscription_count", domain: "infra", risk: "read", scopes: ["infra:read"], description: "Contagem de subs realtime.", schema: {} },

  // ===== QA / TESTER (6) =====
  { name: "browser.run_playbook", domain: "qa", risk: "write_low", scopes: ["qa:browser"], description: "Roda um playbook QA no browser real.", schema: { playbook_slug: "string", target_tenant_id: "uuid?" } },
  { name: "browser.free_navigate", domain: "qa", risk: "write_low", scopes: ["qa:browser"], description: "Navega livre num path e captura evidências.", schema: { path: "string", target_tenant_id: "uuid?" } },
  { name: "browser.collect_evidence", domain: "qa", risk: "read", scopes: ["qa:browser"], description: "Re-coleta evidências de uma sessão.", schema: { session_id: "string" } },
  { name: "smoke.run_suite", domain: "qa", risk: "write_low", scopes: ["qa:browser"], description: "Roda suite completa de smoke-tests.", schema: { target_tenant_id: "uuid?" } },
  { name: "regression.compare_baseline", domain: "qa", risk: "read", scopes: ["qa:browser"], description: "Compara última run com baseline.", schema: { playbook_slug: "string" } },
  { name: "accessibility.audit", domain: "qa", risk: "read", scopes: ["qa:browser"], description: "Audit de acessibilidade da página.", schema: { path: "string?" } },

  // ===== Tools v1 mantidas (compat) =====
  { name: "tenant.leads.list", domain: "operacao", risk: "read", scopes: ["leads:read"], description: "Lista leads do tenant.", schema: { stage: "string?", temperature: "string?", limit: "number?" } },
  { name: "tenant.leads.message", domain: "canais", risk: "write_high", scopes: ["leads:message"], description: "Envia mensagem WhatsApp para um lead.", schema: { lead_id: "uuid", text: "string" } },
  { name: "tenant.products.update_price", domain: "monetizacao", risk: "write_high", scopes: ["products:write"], description: "Atualiza preço de um produto.", schema: { product_id: "uuid", new_price: "number" } },
  { name: "tenant.campaigns.create", domain: "operacao", risk: "write_low", scopes: ["campaigns:write"], description: "Cria campanha (rascunho).", schema: { name: "string", channel: "string", payload: "object?" } },
];

export const findTool = (name: string) => TOOLS.find((t) => t.name === name);

// Compat: mapeia risk_level para ToolKind antigo
export const riskToKind = (r: RiskLevel): ToolKind =>
  r === "destructive" ? "write_high" : (r as ToolKind);

export function makeRemoteClients() {
  const url = Deno.env.get("REMOTE_SUPABASE_URL")!;
  const service = Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!;
  const cmd = createClient(url, service, {
    db: { schema: "command_ai" as never },
    auth: { persistSession: false },
  });
  const pub = createClient(url, service, { auth: { persistSession: false } });
  return { cmd, pub };
}

export async function loadGrant(cmd: SupabaseClient, targetTenant: string) {
  const { data } = await cmd
    .from("tenant_grants")
    .select("scopes, expires_at, revoked_at, purpose")
    .eq("target_tenant_id", targetTenant)
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return { scopes: [] as string[], purpose: null as string | null };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { scopes: [], purpose: null };
  return { scopes: (data.scopes ?? []) as string[], purpose: data.purpose ?? null };
}

export async function recordExec(cmd: SupabaseClient, row: Record<string, unknown>) {
  const { data } = await cmd.from("tool_executions").insert(row).select("id").single();
  return data?.id as string | undefined;
}

/**
 * Executor de tools "read" — chamado dentro do loop do agente.
 * Tools write_high precisam passar por command-decisions (nunca aqui).
 * Implementação atual usa wrappers DB diretos. Stubs retornam estrutura vazia
 * marcada com `stub: true` — divisão deve degradar de forma elegante.
 */
export async function runReadTool(
  pub: SupabaseClient,
  cmd: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
  tenantId: string | null,
): Promise<unknown> {
  // ---------- CANAIS ----------
  if (name === "whatsapp.status" && tenantId) {
    const { data } = await pub.from("whatsapp_instances").select("id,name,status,phone,last_seen_at")
      .eq("tenant_id", tenantId);
    return { instances: data ?? [] };
  }
  if (name === "whatsapp.last_messages" && tenantId) {
    const limit = Number(args.limit ?? 20);
    const { data } = await pub.from("whatsapp_messages")
      .select("id,direction,body,created_at,status")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(limit);
    return { messages: data ?? [] };
  }
  if (name === "channel.error_rate" && tenantId) {
    const hours = Number(args.window_hours ?? 24);
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data } = await pub.from("whatsapp_messages")
      .select("status")
      .eq("tenant_id", tenantId).gte("created_at", since);
    const total = data?.length ?? 0;
    const failed = (data ?? []).filter((m: any) => m.status === "failed").length;
    return { total, failed, error_rate: total ? failed / total : 0 };
  }

  // ---------- OPERAÇÃO ----------
  if (name === "tenant.leads.list" && tenantId) {
    let q = pub.from("leads").select("id,name,phone,stage,temperature,value,created_at")
      .eq("tenant_id", tenantId).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(Number(args.limit ?? 25));
    if (args.stage) q = q.eq("stage", String(args.stage));
    if (args.temperature) q = q.eq("temperature", String(args.temperature));
    const { data } = await q;
    return { count: data?.length ?? 0, leads: data ?? [] };
  }
  if (name === "lead.timeline" && tenantId) {
    const { data } = await pub.from("lead_events").select("*")
      .eq("lead_id", String(args.lead_id)).order("created_at", { ascending: false }).limit(50);
    return { events: data ?? [] };
  }
  if (name === "funnel.conversion_drill" && tenantId) {
    const { data } = await pub.from("leads").select("stage")
      .eq("tenant_id", tenantId).is("deleted_at", null);
    const byStage = (data ?? []).reduce((acc: Record<string, number>, l: any) => {
      acc[l.stage ?? "unknown"] = (acc[l.stage ?? "unknown"] ?? 0) + 1; return acc;
    }, {});
    return { by_stage: byStage };
  }
  if (name === "automation.last_executions" && tenantId) {
    const { data } = await pub.from("automation_runs").select("*")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(Number(args.limit ?? 20));
    return { runs: data ?? [] };
  }

  // ---------- DADOS ----------
  if (name === "tenant.snapshot" && tenantId) {
    const { data: t } = await pub.from("tenants").select("*").eq("id", tenantId).maybeSingle();
    const { count: leadsCount } = await pub.from("leads").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).is("deleted_at", null);
    const { count: usersCount } = await pub.from("tenant_users").select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    return { tenant: t, leads_count: leadsCount ?? 0, users_count: usersCount ?? 0 };
  }
  if (name === "lead.duplicates_scan" && tenantId) {
    const { data } = await pub.rpc("find_lead_duplicates", { p_tenant_id: tenantId }).single();
    return data ?? { stub: true, duplicates: [] };
  }

  // ---------- MONETIZAÇÃO ----------
  if (name === "billing.tenant_health" && tenantId) {
    const { data } = await pub.from("subscriptions").select("status,current_period_end,plan_id")
      .eq("tenant_id", tenantId).maybeSingle();
    return { subscription: data };
  }
  if (name === "quota.usage_vs_limit" && tenantId) {
    const { data: limits } = await pub.from("tenant_resources").select("*").eq("tenant_id", tenantId).maybeSingle();
    return { resources: limits };
  }
  if (name === "payment.failed_recent" && tenantId) {
    const { data } = await pub.from("payment_events").select("*")
      .eq("tenant_id", tenantId).eq("status", "failed").order("created_at", { ascending: false }).limit(Number(args.limit ?? 10));
    return { failed: data ?? [] };
  }

  // ---------- INTELIGÊNCIA ----------
  if (name === "ai.last_runs" && tenantId) {
    const { data } = await pub.from("ai_runs").select("model,cost_cents,latency_ms,status,created_at")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(Number(args.limit ?? 20));
    return { runs: data ?? [] };
  }
  if (name === "ai.cost_breakdown" && tenantId) {
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { data } = await pub.from("ai_runs").select("model,cost_cents")
      .eq("tenant_id", tenantId).gte("created_at", since);
    const byModel = (data ?? []).reduce((acc: Record<string, number>, r: any) => {
      acc[r.model] = (acc[r.model] ?? 0) + (r.cost_cents ?? 0); return acc;
    }, {});
    return { by_model_cents: byModel };
  }

  // ---------- INFRA ----------
  if (name === "edge_function.error_recent") {
    // stub — Supabase Analytics API requer token específico, retornamos vazio com nota
    return { stub: true, note: "use supabase analytics api / log_api_usage table" };
  }
  if (name === "cron.last_runs") {
    const { data } = await pub.from("cron_runs").select("*").order("started_at", { ascending: false }).limit(20);
    return { runs: data ?? [] };
  }

  // Default — stub silencioso para tools ainda não wireadas
  return { stub: true, tool: name, note: "tool não implementada — usar fallback ou registrar como TODO" };
}

/** Executor de write tools — usado pós-aprovação por command-decisions. */
export async function executeRealTool(
  pub: SupabaseClient,
  cmd: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
  tenantId: string,
): Promise<unknown> {
  if (name === "tenant.campaigns.create") {
    const { data, error } = await cmd.from("campaigns").insert({
      workspace_id: null, name: String(args.name ?? "Sem nome"), status: "draft",
      channel: String(args.channel ?? "whatsapp"),
      payload: (args.payload as Record<string, unknown>) ?? { proposed_for_tenant: tenantId },
    }).select("id").single();
    if (error) throw error;
    return { campaign_id: data.id };
  }
  if (name === "tenant.products.update_price") {
    const { data, error } = await pub.from("products").update({ price: Number(args.new_price) })
      .eq("id", String(args.product_id)).eq("tenant_id", tenantId).select("id, price").maybeSingle();
    if (error) throw error;
    return { updated: !!data, product: data };
  }
  if (name === "tenant.leads.message") {
    const { data, error } = await cmd.from("command_log").insert({
      workspace_id: null, kind: "tenant_outbound_message", actor: "command_ai",
      payload: { target_tenant_id: tenantId, lead_id: String(args.lead_id), text: String(args.text ?? ""), dispatched: false },
    }).select("id").single();
    if (error) throw error;
    return { queued_log_id: data.id };
  }
  if (name === "whatsapp.send_test") {
    const { data, error } = await cmd.from("command_log").insert({
      workspace_id: null, kind: "qa_whatsapp_test", actor: "command_ai",
      payload: { target_tenant_id: tenantId, phone: String(args.phone), text: String(args.text) },
    }).select("id").single();
    if (error) throw error;
    return { queued_log_id: data.id };
  }
  // Falls through to runReadTool for read tools called from decisions path
  return await runReadTool(pub, cmd, name, args, tenantId);
}

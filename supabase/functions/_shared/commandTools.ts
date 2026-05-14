// Command AI — Catálogo e executor de ferramentas multi-tenant.
// Compartilhado entre command-mission-execute (loop) e command-decisions
// (executor pós-aprovação).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ToolKind = "read" | "write_low" | "write_high";

export interface ToolDef {
  name: string;
  scope: string;
  kind: ToolKind;
  description: string;
  schema: Record<string, string>;
}

export const TOOLS: ToolDef[] = [
  {
    name: "tenant.leads.list",
    scope: "leads:read",
    kind: "read",
    description: "Lista leads do tenant (filtros opcionais por stage/temperature).",
    schema: { stage: "string?", temperature: "string?", limit: "number?" },
  },
  {
    name: "tenant.leads.message",
    scope: "leads:message",
    kind: "write_high",
    description: "Envia mensagem WhatsApp para um lead (registra payload p/ entrega via instâncias).",
    schema: { lead_id: "uuid", text: "string" },
  },
  {
    name: "tenant.products.update_price",
    scope: "products:write",
    kind: "write_high",
    description: "Atualiza preço de um produto.",
    schema: { product_id: "uuid", new_price: "number" },
  },
  {
    name: "tenant.campaigns.create",
    scope: "campaigns:write",
    kind: "write_low",
    description: "Cria uma campanha (rascunho) no tenant.",
    schema: { name: "string", channel: "string", payload: "object?" },
  },
];

export const findTool = (name: string) => TOOLS.find((t) => t.name === name);

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
    .select("scopes, expires_at, revoked_at")
    .eq("target_tenant_id", targetTenant)
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return { scopes: [] as string[] };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { scopes: [] };
  return { scopes: (data.scopes ?? []) as string[] };
}

export async function recordExec(cmd: SupabaseClient, row: Record<string, unknown>) {
  const { data } = await cmd.from("tool_executions").insert(row).select("id").single();
  return data?.id as string | undefined;
}

/** Executa uma tool de fato (ignora gating high-impact — usado pós-aprovação). */
export async function executeRealTool(
  pub: SupabaseClient,
  cmd: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
  tenantId: string,
): Promise<unknown> {
  if (name === "tenant.leads.list") {
    let q = pub
      .from("leads")
      .select("id,name,phone,stage,temperature,value,created_at")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(Number(args.limit ?? 25));
    if (args.stage) q = q.eq("stage", String(args.stage));
    if (args.temperature) q = q.eq("temperature", String(args.temperature));
    const { data, error } = await q;
    if (error) throw error;
    return { count: data?.length ?? 0, leads: data ?? [] };
  }

  if (name === "tenant.campaigns.create") {
    const { data, error } = await cmd
      .from("campaigns")
      .insert({
        workspace_id: null,
        name: String(args.name ?? "Sem nome"),
        status: "draft",
        channel: String(args.channel ?? "whatsapp"),
        payload: (args.payload as Record<string, unknown>) ?? { proposed_for_tenant: tenantId },
      })
      .select("id")
      .single();
    if (error) throw error;
    return { campaign_id: data.id };
  }

  if (name === "tenant.products.update_price") {
    const { data, error } = await pub
      .from("products")
      .update({ price: Number(args.new_price) })
      .eq("id", String(args.product_id))
      .eq("tenant_id", tenantId)
      .select("id, price")
      .maybeSingle();
    if (error) throw error;
    return { updated: !!data, product: data };
  }

  if (name === "tenant.leads.message") {
    // Não temos tabela de outbox dedicada — registramos em command_log como dispatch
    // pendente; uma worker externa pega e despacha pela instância WhatsApp do tenant.
    const { data, error } = await cmd
      .from("command_log")
      .insert({
        workspace_id: null,
        kind: "tenant_outbound_message",
        actor: "command_ai",
        payload: {
          target_tenant_id: tenantId,
          lead_id: String(args.lead_id),
          text: String(args.text ?? ""),
          dispatched: false,
        },
      })
      .select("id")
      .single();
    if (error) throw error;
    return { queued_log_id: data.id };
  }

  throw new Error(`unknown_tool:${name}`);
}

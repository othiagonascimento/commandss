// Master Copilot — orquestrador multi-layer com tool-calling e streaming SSE
// Lê master_settings.ai_layer_X_* (mesma fonte da AI Engine do CRM)
// Executa via secrets já existentes (GEMINI/OPENAI/ANTHROPIC/DEEPSEEK_API_KEY)
// Persiste em copilot_conversations / copilot_messages (RLS por user_id)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// ============== Layer routing ==============
type LayerKey = "layer_1" | "layer_2" | "layer_3";

function pickLayer(text: string, hasMedia: boolean): LayerKey {
  if (hasMedia) return "layer_1"; // Gemini multimodal
  const t = text.toLowerCase();
  const eliteKw = /\b(analise|análise|compare|comparar|por que|porque|estrat|projet|preveja|prever|recomende|otimize|diagn|root cause|investig|relat[óo]rio|profundo|complex)/;
  if (eliteKw.test(t) || text.length > 600) return "layer_3";
  const stdKw = /\b(liste|listar|mostre|qual|quais|quanto|status|veja|busque|procure|encontre|sugira)/;
  if (stdKw.test(t) || text.length > 80) return "layer_2";
  return "layer_1";
}

// ============== Provider adapters (OpenAI-compatible request shape) ==============
interface ChatMsg { role: string; content: any; tool_call_id?: string; tool_calls?: any; name?: string }

async function callProvider(opts: {
  provider: string;
  model: string;
  messages: ChatMsg[];
  tools?: any[];
  stream: boolean;
  temperature?: number;
}): Promise<Response> {
  const { provider, model, messages, tools, stream, temperature = 0.4 } = opts;
  const supportsTools = tools && tools.length > 0;

  if (provider === "google") {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY missing");
    // Use OpenAI-compatible Gemini endpoint
    return fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, tools: supportsTools ? tools : undefined, stream, temperature }),
    });
  }
  if (provider === "openai") {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) throw new Error("OPENAI_API_KEY missing");
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, tools: supportsTools ? tools : undefined, stream, temperature }),
    });
  }
  if (provider === "anthropic") {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY missing");
    // Translate to Anthropic schema
    const sys = messages.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n\n");
    const msgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }));
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 4096, system: sys, messages: msgs, stream }),
    });
  }
  if (provider === "deepseek") {
    const key = Deno.env.get("DEEPSEEK_API_KEY");
    if (!key) throw new Error("DEEPSEEK_API_KEY missing");
    return fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, tools: supportsTools ? tools : undefined, stream, temperature }),
    });
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

// ============== Tools ==============
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_tenant_overview",
      description: "Retorna visão geral de um tenant: nome, status, plano, MRR, users, consumo de IA, créditos. Use quando o usuário perguntar sobre um tenant específico (por nome ou id).",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Nome, subdomain ou UUID do tenant" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tenants",
      description: "Lista tenants com filtros. Use para 'tenants em risco', 'churn', 'top consumidores', etc.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "trialing", "past_due", "canceled", "any"] },
          order_by: { type: "string", enum: ["mrr_desc", "credits_used_desc", "created_at_desc", "name_asc"] },
          limit: { type: "number", description: "1-50, default 10" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_mrr_breakdown",
      description: "Retorna MRR atual total, por plano, e variação vs mês anterior. Use para perguntas sobre receita.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_api_costs",
      description: "Retorna custos de API (Gemini/OpenAI/Anthropic) nos últimos N dias, agregados por provedor.",
      parameters: {
        type: "object",
        properties: { days: { type: "number", description: "1-90, default 30" } },
      },
    },
  },
];

async function execTool(admin: any, name: string, args: any): Promise<any> {
  try {
    if (name === "get_tenant_overview") {
      const q = String(args?.query || "").trim();
      let { data } = await admin
        .from("tenants")
        .select("id, name, subdomain, status, plan_id, created_at")
        .or(`name.ilike.%${q}%,subdomain.ilike.%${q}%${q.match(/^[0-9a-f-]{36}$/i) ? `,id.eq.${q}` : ""}`)
        .limit(1)
        .maybeSingle();
      if (!data) return { error: "Tenant não encontrado" };
      const tenantId = data.id;
      const [{ count: users }, { data: usage }, { data: plan }] = await Promise.all([
        admin.from("user_profiles").select("user_id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        admin.from("v_tenant_ai_consumption").select("*").eq("tenant_id", tenantId).maybeSingle(),
        data.plan_id ? admin.from("plans").select("name, monthly_price").eq("id", data.plan_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return {
        id: tenantId, name: data.name, subdomain: data.subdomain, status: data.status,
        plan: plan?.data?.name || "—", mrr: plan?.data?.monthly_price || 0,
        users_count: users || 0, ai_credits_used_month: usage?.credits_consumed || 0,
        created_at: data.created_at,
      };
    }
    if (name === "list_tenants") {
      const limit = Math.min(50, Math.max(1, args?.limit || 10));
      let q = admin.from("tenants").select("id, name, subdomain, status, plan_id, created_at");
      if (args?.status && args.status !== "any") q = q.eq("status", args.status);
      const order = args?.order_by || "created_at_desc";
      const [col, dir] = order.replace("_desc", "|desc").replace("_asc", "|asc").split("|");
      q = q.order(col === "mrr" || col === "credits_used" ? "created_at" : col, { ascending: dir === "asc" });
      const { data } = await q.limit(limit);
      return { tenants: data || [], count: data?.length || 0 };
    }
    if (name === "get_mrr_breakdown") {
      const { data: tenants } = await admin.from("tenants").select("plan_id, status").eq("status", "active");
      const { data: plans } = await admin.from("plans").select("id, name, monthly_price");
      const planMap = new Map((plans || []).map((p: any) => [p.id, p]));
      let total = 0;
      const byPlan: Record<string, { count: number; mrr: number }> = {};
      for (const t of tenants || []) {
        const p: any = planMap.get(t.plan_id);
        if (!p) continue;
        total += Number(p.monthly_price) || 0;
        const k = p.name || "—";
        byPlan[k] = byPlan[k] || { count: 0, mrr: 0 };
        byPlan[k].count++;
        byPlan[k].mrr += Number(p.monthly_price) || 0;
      }
      return { mrr_total: total, active_tenants: tenants?.length || 0, by_plan: byPlan };
    }
    if (name === "get_api_costs") {
      const days = Math.min(90, Math.max(1, args?.days || 30));
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const { data } = await admin
        .from("api_usage_logs")
        .select("provider, cost_usd, created_at")
        .gte("created_at", since);
      const byProvider: Record<string, number> = {};
      let total = 0;
      for (const r of data || []) {
        const p = r.provider || "unknown";
        const c = Number(r.cost_usd) || 0;
        byProvider[p] = (byProvider[p] || 0) + c;
        total += c;
      }
      return { days, total_cost_usd: total, by_provider_usd: byProvider };
    }
    return { error: `Unknown tool: ${name}` };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}

// ============== SSE helpers ==============
function sseChunk(payload: any) {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ============== Main ==============
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get("authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json();
    const { messages: history = [], conversation_id, route_context = null, force_layer = null } = body;

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const firstUserMsg = (history.find((m: any) => m.role === "user")?.content || "").toString().slice(0, 80);
      const { data: conv } = await admin.from("copilot_conversations").insert({
        user_id: user.id, title: firstUserMsg || "Nova conversa", route_context,
      }).select("id").single();
      convId = conv?.id;
    }

    // Persist last user message (assume client sent the new message at end of history)
    const lastMsg = history[history.length - 1];
    if (lastMsg?.role === "user") {
      await admin.from("copilot_messages").insert({
        conversation_id: convId, user_id: user.id, role: "user",
        content: typeof lastMsg.content === "string" ? lastMsg.content : null,
        parts: typeof lastMsg.content !== "string" ? lastMsg.content : null,
      });
    }

    // Load layer config
    const { data: settings } = await admin.from("master_settings").select(
      "ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions"
    ).limit(1).maybeSingle();

    const userText = typeof lastMsg?.content === "string" ? lastMsg.content : JSON.stringify(lastMsg?.content || "");
    const hasMedia = Array.isArray(lastMsg?.content) && lastMsg.content.some((p: any) => p.type === "image_url" || p.type === "input_audio");
    const layer: LayerKey = (force_layer as LayerKey) || pickLayer(userText, hasMedia);

    const modelMap: Record<LayerKey, string> = {
      layer_1: settings?.ai_layer_1_model || "gemini-1.5-flash",
      layer_2: settings?.ai_layer_2_model || "gemini-2.5-flash",
      layer_3: settings?.ai_layer_3_model || "gpt-4.1",
    };
    const instrMap: Record<LayerKey, string> = {
      layer_1: settings?.ai_layer_1_instructions || "",
      layer_2: settings?.ai_layer_2_instructions || "",
      layer_3: settings?.ai_layer_3_instructions || "",
    };

    let chosenModel = modelMap[layer];
    // Resolve provider + tool support
    const { data: catalog } = await admin.from("ai_available_models").select("provider, model_id, supports_tools, supports_vision").eq("is_active", true);
    let modelInfo = (catalog || []).find((m: any) => m.model_id === chosenModel);
    if (!modelInfo) modelInfo = (catalog || []).find((m: any) => m.model_id === "gemini-1.5-flash") || { provider: "google", model_id: "gemini-1.5-flash", supports_tools: true };

    // If chosen model doesn't support tools, fall back to a tool-capable model in the same category for tool execution
    let provider = modelInfo.provider;
    if (!modelInfo.supports_tools) {
      const fallback = (catalog || []).find((m: any) => m.supports_tools && m.layer_category === (layer === "layer_3" ? "elite" : layer === "layer_2" ? "standard" : "basic"));
      if (fallback) { chosenModel = fallback.model_id; provider = fallback.provider; }
    }

    const systemBase = `Você é o Copiloto Master do UopaCRM. Você ajuda o admin master a entender o sistema, tenants, receita, custos e operação. Use as ferramentas disponíveis sempre que precisar de dados reais. Responda em português, com markdown, conciso e objetivo. Cite números exatos quando vierem de ferramentas.\n\nContexto da rota atual: ${route_context || "—"}`;
    const systemLayer = instrMap[layer] ? `\n\n[Instruções da ${layer}]\n${instrMap[layer]}` : "";

    const start = Date.now();

    // ===== Streaming response =====
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(sseChunk({ type: "meta", layer, model: chosenModel, provider, conversation_id: convId }));

          // Tool-calling loop (max 3 rounds)
          let workingMsgs: ChatMsg[] = [
            { role: "system", content: systemBase + systemLayer },
            ...history.map((m: any) => ({ role: m.role, content: m.content })),
          ];
          let assistantText = "";
          const toolCallsRecord: any[] = [];

          for (let round = 0; round < 3; round++) {
            // Non-streamed first to detect tool_calls reliably
            const probe = await callProvider({ provider, model: chosenModel, messages: workingMsgs, tools: TOOLS, stream: false });
            if (!probe.ok) {
              const t = await probe.text();
              throw new Error(`LLM ${probe.status}: ${t.slice(0, 300)}`);
            }
            const j = await probe.json();
            const choice = j.choices?.[0];
            const msg = choice?.message;
            const calls = msg?.tool_calls || [];
            if (calls.length > 0) {
              workingMsgs.push({ role: "assistant", content: msg.content || "", tool_calls: calls } as any);
              for (const c of calls) {
                const argParsed = (() => { try { return JSON.parse(c.function.arguments || "{}"); } catch { return {}; } })();
                controller.enqueue(sseChunk({ type: "tool_call", name: c.function.name, args: argParsed }));
                const result = await execTool(admin, c.function.name, argParsed);
                controller.enqueue(sseChunk({ type: "tool_result", name: c.function.name, ok: !result?.error }));
                toolCallsRecord.push({ name: c.function.name, args: argParsed, result });
                workingMsgs.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify(result).slice(0, 8000) } as any);
              }
              continue;
            }
            // Final answer — stream it for nicer UX
            assistantText = msg?.content || "";
            // Emit the final text in chunks for typewriter effect
            const chunkSize = 24;
            for (let i = 0; i < assistantText.length; i += chunkSize) {
              controller.enqueue(sseChunk({ type: "delta", text: assistantText.slice(i, i + chunkSize) }));
            }
            break;
          }

          const latency = Date.now() - start;
          await admin.from("copilot_messages").insert({
            conversation_id: convId, user_id: user.id, role: "assistant",
            content: assistantText, tool_calls: toolCallsRecord.length ? toolCallsRecord : null,
            layer_used: layer, model_used: chosenModel, latency_ms: latency,
          });
          await admin.from("copilot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);

          controller.enqueue(sseChunk({ type: "done", latency_ms: latency }));
          controller.close();
        } catch (e: any) {
          controller.enqueue(sseChunk({ type: "error", message: String(e?.message || e) }));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

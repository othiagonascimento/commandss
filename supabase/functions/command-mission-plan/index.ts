// Command AI — Mission Planner
// Recebe um objetivo, usa Strategos via Lovable AI Gateway para gerar um plano
// estruturado em nodes (sequenciais com dependências), persiste em command_ai.missions
// e command_ai.mission_nodes. Acesso restrito ao master.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { runNativeChat } from "../_shared/commandAiNative.ts";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (s: string, d?: unknown) =>
  console.log(`[command-mission-plan] ${s}${d ? ` ${JSON.stringify(d)}` : ""}`);

const REMOTE_URL = Deno.env.get("REMOTE_SUPABASE_URL")!;
const REMOTE_SERVICE = Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!;

const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const remoteDb = createClient(REMOTE_URL, REMOTE_SERVICE, {
  db: { schema: "command_ai" as never },
  auth: { persistSession: false },
});

const PLANNER_SYSTEM = `Você é Strategos, o agente-chefe de operações do Uôpa.
Sua tarefa é decompor um OBJETIVO em uma constelação executável de tarefas (nodes),
cada uma atribuída a um agente especialista da equipe disponível.

Regras:
- Gere entre 3 e 8 nodes (objetivo simples => 3, complexo => até 8).
- Cada node tem: title (curto, verbo no imperativo, 3-7 palavras), description (1-2 frases concretas), agent_slug (escolha um da lista), kind (research|content|design|publish|outreach|analysis|review).
- Dependências expressas via "depends_on" — array de índices anteriores (zero-indexed). Pode ser vazio.
- Nada de generalidades. Cada node precisa parecer uma tarefa real, com entregável claro.
- Responda APENAS com JSON válido (sem markdown, sem comentários) no formato:
{"summary":"<resumo executivo do plano em 1 frase>","nodes":[{"title":"...","description":"...","agent_slug":"...","kind":"...","depends_on":[]}]}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("missing auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: u, error: uErr } = await localAuth.auth.getUser(token);
    if (uErr || !u.user) throw new Error("invalid token");
    if (u.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspace_id, objective, context, due_at } = await req.json();
    if (!workspace_id || !objective) {
      return new Response(JSON.stringify({ error: "workspace_id + objective required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega agentes disponíveis
    const { data: agents } = await remoteDb
      .from("agents")
      .select("id, slug, name, role")
      .eq("is_active", true)
      .order("sort_order");

    const agentList = (agents ?? [])
      .map((a) => `- ${a.slug}: ${a.name} (${a.role})`)
      .join("\n");

    // Cria mission em planning
    const { data: mission, error: mErr } = await remoteDb
      .from("missions")
      .insert({
        workspace_id,
        objective,
        context: context ?? null,
        status: "planning",
        due_at: due_at ?? null,
      })
      .select("id")
      .single();
    if (mErr) throw mErr;
    const missionId = mission.id as string;
    log("mission_created", { missionId });

    // Chama planner
    const userPrompt = `OBJETIVO: ${objective}${context ? `\n\nCONTEXTO: ${context}` : ""}\n\nAGENTES DISPONÍVEIS:\n${agentList}\n\nGere o plano em JSON.`;

    const aiJson = await runNativeChat({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: PLANNER_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      responseFormat: "json_object",
    });

    const raw = aiJson.content || "{}";
    let parsed: { summary?: string; nodes?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { nodes: [] };
    }

    const agentBySlug = new Map((agents ?? []).map((a) => [a.slug, a.id]));
    const planNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];

    // Insere nodes em ordem, capturando ids para depends_on
    const insertedIds: string[] = [];
    for (let i = 0; i < planNodes.length; i++) {
      const n = planNodes[i] as {
        title?: string;
        description?: string;
        agent_slug?: string;
        kind?: string;
        depends_on?: number[];
      };
      const agentId = n.agent_slug ? agentBySlug.get(n.agent_slug) ?? null : null;
      const depends = (n.depends_on ?? [])
        .map((idx) => insertedIds[idx])
        .filter(Boolean);

      const { data: node, error: nErr } = await remoteDb
        .from("mission_nodes")
        .insert({
          mission_id: missionId,
          agent_id: agentId,
          parent_id: depends[0] ?? null, // simple parent: primeiro depends
          title: n.title ?? `Tarefa ${i + 1}`,
          description: n.description ?? null,
          kind: n.kind ?? "content",
          status: "pending",
          sort_order: i,
          payload: { depends_on: depends },
          position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 160 },
        })
        .select("id")
        .single();
      if (nErr) throw nErr;
      insertedIds.push(node.id as string);
    }

    await remoteDb
      .from("missions")
      .update({
        status: "approved",
        plan: { summary: parsed.summary ?? null, node_count: insertedIds.length },
      })
      .eq("id", missionId);

    log("mission_planned", { missionId, nodes: insertedIds.length });

    return new Response(
      JSON.stringify({
        mission_id: missionId,
        nodes: insertedIds.length,
        summary: parsed.summary ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    log("error", { err: String(e) });
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

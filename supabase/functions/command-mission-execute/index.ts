// Command AI — Mission Executor (Onda 1+2)
// Executa missões multi-tenant: agente raciocina com runNativeChat e propõe ações
// como tool-calls. Tools read-only executam direto; tools high-impact viram
// decisions aguardando aprovação. Toda execução é registrada em tool_executions.
//
// Acesso restrito ao master UUID. Valida scopes em tenant_grants antes de tocar
// qualquer dado do cliente.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { runNativeChat } from "../_shared/commandAiNative.ts";
import {
  TOOLS,
  findTool,
  loadGrant,
  recordExec,
  executeRealTool,
  makeRemoteClients,
} from "../_shared/commandTools.ts";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[command-mission-execute] ${step}${d}`);
};

const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const { cmd: remoteCmd, pub: remotePub } = makeRemoteClients();

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

async function executeTool(opts: {
  call: ToolCall;
  workspaceId: string;
  runId: string;
  agentId: string;
  missionId: string;
  targetTenant: string;
}): Promise<{ status: string; result?: unknown; decisionId?: string; error?: string }> {
  const tool = findTool(opts.call.name);
  if (!tool) return { status: "error", error: "unknown_tool" };
  const start = Date.now();
  const baseRow = {
    workspace_id: opts.workspaceId,
    run_id: opts.runId,
    agent_id: opts.agentId,
    mission_id: opts.missionId,
    target_tenant_id: opts.targetTenant,
    tool_name: tool.name,
    args: opts.call.args,
  };

  const { scopes } = await loadGrant(remoteCmd, opts.targetTenant);
  if (!scopes.includes(tool.scope)) {
    await recordExec(remoteCmd, {
      ...baseRow,
      status: "denied",
      error: `missing_scope:${tool.scope}`,
      duration_ms: Date.now() - start,
    });
    return { status: "denied", error: `missing_scope:${tool.scope}` };
  }

  if (tool.kind === "read" || tool.kind === "write_low") {
    try {
      const result = await executeRealTool(remotePub, remoteCmd, tool.name, opts.call.args, opts.targetTenant);
      await recordExec(remoteCmd, { ...baseRow, status: "ok", result, duration_ms: Date.now() - start });
      return { status: "ok", result };
    } catch (e) {
      await recordExec(remoteCmd, {
        ...baseRow,
        status: "error",
        error: String((e as Error).message ?? e),
        duration_ms: Date.now() - start,
      });
      return { status: "error", error: String((e as Error).message ?? e) };
    }
  }

  // write_high → vira decisão
  const { data: dec } = await remoteCmd
    .from("decisions")
    .insert({
      workspace_id: opts.workspaceId,
      agent_id: opts.agentId,
      run_id: opts.runId,
      kind: "tool_call",
      title: `${tool.name} no tenant ${opts.targetTenant.slice(0, 8)}`,
      summary: tool.description,
      reasoning: `Argumentos propostos: ${JSON.stringify(opts.call.args)}`,
      preview: { tool: tool.name, args: opts.call.args, target_tenant_id: opts.targetTenant },
      options: [
        { id: "approve", label: "Aprovar e executar" },
        { id: "reject", label: "Rejeitar" },
      ],
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    })
    .select("id")
    .single();

  await recordExec(remoteCmd, {
    ...baseRow,
    status: "queued_for_decision",
    decision_id: dec?.id ?? null,
    duration_ms: Date.now() - start,
  });
  return { status: "queued_for_decision", decisionId: dec?.id };
}

function toolsManifest() {
  return TOOLS.map(
    (t) => `- ${t.name} (${t.kind}, scope=${t.scope}): ${t.description}\n  args: ${JSON.stringify(t.schema)}`,
  ).join("\n");
}

const SYSTEM_PROMPT = `Você é o Mission Executor do Command AI. Você opera como agente autônomo
multi-tenant para o uopa CRM. Seu trabalho: ler a missão, escolher ferramentas
da lista abaixo, e devolver UMA resposta JSON em cada turno com a forma:

{ "thought": "...", "tool_calls": [{"name":"...","args":{...}}], "final": null }

ou, quando concluir:

{ "thought": "...", "tool_calls": [], "final": "resumo do que fez/propôs" }

Regras:
- Use exclusivamente as ferramentas listadas. Argumentos devem casar com o schema.
- Tools "write_high" NÃO executam: viram decisões aguardando aprovação humana.
- Tools "read" são seguras. Use-as antes de propor escritas.
- Você nunca acessa dados fora do target_tenant_id da missão.
- Limite-se a no máximo 4 tool_calls por turno. Termine com "final" quando tudo
  estiver proposto/coletado.

Ferramentas disponíveis:
${toolsManifest()}`;

interface Turn {
  thought?: string;
  tool_calls?: ToolCall[];
  final?: string | null;
}

function parseTurn(raw: string): Turn {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as Turn) : { final: raw };
  } catch {
    return { final: raw };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("missing auth header");

    const { data: userData, error: userErr } = await localAuth.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) throw new Error("invalid token");
    if (userData.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      mission_id,
      agent_slug,
      workspace_id,
      target_tenant_id,
      max_steps = 5,
    } = body as {
      mission_id: string;
      agent_slug: string;
      workspace_id: string;
      target_tenant_id: string;
      max_steps?: number;
    };

    if (!mission_id || !agent_slug || !workspace_id || !target_tenant_id) {
      return new Response(
        JSON.stringify({ error: "mission_id, agent_slug, workspace_id, target_tenant_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: mission, error: mErr } = await remoteCmd
      .from("missions")
      .select("id, objective, context, status")
      .eq("id", mission_id)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!mission) throw new Error("mission_not_found");

    const { data: agent, error: aErr } = await remoteCmd
      .from("agents")
      .select("id, slug, name, role, system_prompt, model, provider, model_id")
      .eq("slug", agent_slug)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!agent) throw new Error("agent_not_found");

    const composed =
      agent.provider && agent.model_id ? `${agent.provider}/${agent.model_id}` : agent.model;
    const model = composed || "openai/gpt-4.1-mini";

    const startedAt = new Date().toISOString();
    const steps: Array<Record<string, unknown>> = [
      { t: Date.now(), kind: "thought", content: `Mission Executor inicializado em ${target_tenant_id}` },
    ];

    const { data: run } = await remoteCmd
      .from("agent_runs")
      .insert({
        agent_id: agent.id,
        workspace_id,
        mission_id,
        status: "thinking",
        trigger: "mission",
        input: mission.objective,
        steps,
        started_at: startedAt,
      })
      .select("id")
      .single();
    const runId = run!.id as string;
    log("run_created", { runId, agent: agent_slug, model, target_tenant_id });

    const work = (async () => {
      try {
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Missão (id=${mission.id}, target_tenant=${target_tenant_id}):
${mission.objective}

Contexto:
${mission.context ?? "(sem contexto adicional)"}`,
          },
        ];

        let totalIn = 0;
        let totalOut = 0;

        for (let step = 0; step < max_steps; step++) {
          const ai = await runNativeChat({ model, messages, responseFormat: "json_object" });
          totalIn += ai.usage.input_tokens;
          totalOut += ai.usage.output_tokens;

          const turn = parseTurn(ai.content);
          steps.push({ t: Date.now(), kind: "thought", content: turn.thought ?? ai.content.slice(0, 200) });

          const calls = (turn.tool_calls ?? []).slice(0, 4);
          const observations: string[] = [];

          for (const call of calls) {
            steps.push({ t: Date.now(), kind: "tool_call", data: { name: call.name, args: call.args } });
            const out = await executeTool({
              call,
              workspaceId: workspace_id,
              runId,
              agentId: agent.id,
              missionId: mission_id,
              targetTenant: target_tenant_id,
            });
            steps.push({ t: Date.now(), kind: "tool_result", data: { name: call.name, ...out } });
            observations.push(`${call.name}: ${out.status}${out.error ? " (" + out.error + ")" : ""}`);
            await remoteCmd.from("agent_runs").update({ steps, status: "acting" }).eq("id", runId);
          }

          if (turn.final !== undefined && turn.final !== null) {
            steps.push({ t: Date.now(), kind: "final", content: String(turn.final) });
            break;
          }

          messages.push({ role: "assistant", content: ai.content });
          messages.push({
            role: "user",
            content: `Resultados dos tool_calls:\n${observations.join("\n")}\n\nContinue ou finalize.`,
          });
        }

        // Pricing
        const { data: pricing } = await remotePub
          .from("ai_available_models")
          .select("cost_per_1k_input, cost_per_1k_output")
          .eq("provider", agent.provider ?? model.split("/")[0])
          .eq("model_id", agent.model_id ?? model.split("/")[1])
          .maybeSingle();
        const costUsd =
          (Number(pricing?.cost_per_1k_input ?? 0) * totalIn) / 1000 +
          (Number(pricing?.cost_per_1k_output ?? 0) * totalOut) / 1000;

        await remoteCmd
          .from("agent_runs")
          .update({
            status: "completed",
            steps,
            tokens_in: totalIn,
            tokens_out: totalOut,
            cost_usd: costUsd,
            duration_ms: Date.now() - new Date(startedAt).getTime(),
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);

        await remoteCmd
          .from("missions")
          .update({ status: "completed", finished_at: new Date().toISOString() })
          .eq("id", mission_id);

        log("mission_completed", { runId, mission_id, totalIn, totalOut, costUsd });
      } catch (e) {
        log("mission_failed", { runId, err: String(e) });
        steps.push({ t: Date.now(), kind: "error", content: String((e as Error).message ?? e) });
        await remoteCmd
          .from("agent_runs")
          .update({
            status: "failed",
            steps,
            error: String((e as Error).message ?? e),
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);
      }
    })();

    // @ts-ignore EdgeRuntime exists in Deno Deploy
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);

    return new Response(JSON.stringify({ run_id: runId, mission_id, model }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("error", { err: String(e) });
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

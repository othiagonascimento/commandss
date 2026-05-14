// Command AI — Agent Run executor
// Roda agentes do schema command_ai no Supabase externo (btoyclznuuwvxbsacemw),
// streamando steps (thought + tool_call + tool_result + final) para a tabela agent_runs.
// Acesso restrito ao master UUID hardcoded.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[command-agent-run] ${step}${d}`);
};

interface RunStep {
  t: number; // ts
  kind: "thought" | "tool_call" | "tool_result" | "final" | "error";
  label?: string;
  content?: string;
  data?: unknown;
}

const REMOTE_URL = Deno.env.get("REMOTE_SUPABASE_URL")!;
const REMOTE_SERVICE = Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Cliente para validar o JWT (no Supabase deste projeto)
const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

// Cliente para escrever no Supabase remoto (CRM), schema command_ai
const remoteDb = createClient(REMOTE_URL, REMOTE_SERVICE, {
  db: { schema: "command_ai" as never },
  auth: { persistSession: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("missing auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await localAuth.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("invalid token");
    if (userData.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      agent_slug,
      workspace_id,
      input,
      mission_id,
      trigger,
      model: modelOverride,
    } = body as {
      agent_slug: string;
      workspace_id: string;
      input: string;
      mission_id?: string;
      trigger?: string;
      model?: string;
    };

    if (!agent_slug || !workspace_id || !input) {
      return new Response(JSON.stringify({ error: "agent_slug, workspace_id, input required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega agent
    const { data: agent, error: agErr } = await remoteDb
      .from("agents")
      .select("id, slug, name, role, system_prompt, model, color_hex")
      .eq("slug", agent_slug)
      .maybeSingle();
    if (agErr) throw agErr;
    if (!agent) throw new Error(`agent not found: ${agent_slug}`);

    const model = modelOverride || agent.model || "google/gemini-2.5-flash";

    // Cria run
    const startedAt = new Date().toISOString();
    const initialSteps: RunStep[] = [
      { t: Date.now(), kind: "thought", label: "iniciando", content: `${agent.name} recebeu o briefing.` },
    ];
    const { data: run, error: runErr } = await remoteDb
      .from("agent_runs")
      .insert({
        agent_id: agent.id,
        workspace_id,
        mission_id: mission_id ?? null,
        status: "thinking",
        trigger: trigger ?? "manual",
        input,
        steps: initialSteps,
        started_at: startedAt,
      })
      .select("id")
      .single();
    if (runErr) throw runErr;
    const runId = run.id as string;
    log("run_created", { runId, agent: agent_slug, model });

    // Helpers para apendar steps incrementalmente
    const steps: RunStep[] = [...initialSteps];
    const pushStep = async (s: RunStep, status?: string) => {
      steps.push(s);
      const patch: Record<string, unknown> = { steps };
      if (status) patch.status = status;
      await remoteDb.from("agent_runs").update(patch).eq("id", runId);
    };

    // Dispara processamento async (não esperamos terminar pra responder)
    const work = (async () => {
      try {
        await pushStep({
          t: Date.now(),
          kind: "thought",
          label: "analisando contexto",
          content: "Lendo brand book, métricas e objetivo da missão.",
        });

        await pushStep(
          {
            t: Date.now(),
            kind: "thought",
            label: "raciocinando",
            content: "Estruturando entregável conforme tom da marca.",
          },
          "acting",
        );

        // Chama Lovable AI Gateway
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: agent.system_prompt || `Você é ${agent.name}, ${agent.role}.` },
              { role: "user", content: input },
            ],
          }),
        });

        if (aiRes.status === 429) throw new Error("rate_limited");
        if (aiRes.status === 402) throw new Error("payment_required");
        if (!aiRes.ok) {
          const errTxt = await aiRes.text();
          throw new Error(`ai_gateway_${aiRes.status}: ${errTxt.slice(0, 200)}`);
        }

        const aiJson = await aiRes.json();
        const output = aiJson.choices?.[0]?.message?.content ?? "";
        const usage = aiJson.usage ?? {};
        const tokensIn = usage.prompt_tokens ?? 0;
        const tokensOut = usage.completion_tokens ?? 0;

        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - new Date(startedAt).getTime();

        steps.push({
          t: Date.now(),
          kind: "final",
          label: "entregável pronto",
          content: output.slice(0, 240),
        });

        await remoteDb
          .from("agent_runs")
          .update({
            status: "completed",
            output,
            steps,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            duration_ms: durationMs,
            finished_at: finishedAt,
          })
          .eq("id", runId);

        log("run_completed", { runId, durationMs });
      } catch (e) {
        log("run_failed", { runId, err: String(e) });
        steps.push({
          t: Date.now(),
          kind: "error",
          label: "falha",
          content: String((e as Error).message ?? e),
        });
        await remoteDb
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

    // EdgeRuntime.waitUntil para não cortar a execução
    // @ts-ignore - EdgeRuntime existe no Deno Deploy
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);

    return new Response(JSON.stringify({ run_id: runId, agent: agent.slug, model }), {
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

// Command AI — Scheduler tick
// Disparado por pg_cron a cada minuto. Seleciona scheduled_jobs prontos
// (status='pending', run_at <= now) e executa de acordo com o `kind`.
// Também expira decisões com expires_at vencido.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REMOTE_URL = Deno.env.get("REMOTE_SUPABASE_URL")!;
const REMOTE_SERVICE = Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!;
const SCHEDULER_SECRET = Deno.env.get("COMMAND_SCHEDULER_SECRET") ?? "";

const db = createClient(REMOTE_URL, REMOTE_SERVICE, {
  db: { schema: "command_ai" as never },
  auth: { persistSession: false },
});

const log = (m: string, d?: unknown) =>
  console.log(`[command-scheduler] ${m}${d ? " " + JSON.stringify(d) : ""}`);

interface Job {
  id: string;
  workspace_id: string;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
}

async function runJob(job: Job): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  try {
    log("running_job", { id: job.id, kind: job.kind });

    if (job.kind === "agent_run") {
      // payload: { agent_slug, input, mission_id?, model? }
      const { agent_slug, input, mission_id, model } = job.payload as {
        agent_slug: string; input: string; mission_id?: string; model?: string;
      };
      // Cria run direto via insert (sem chamar a edge fn pra evitar JWT chain)
      const { data: agent } = await db.from("agents")
        .select("id, system_prompt, name, role, model")
        .eq("slug", agent_slug).maybeSingle();
      if (!agent) throw new Error(`agent ${agent_slug} not found`);

      const startedAt = new Date().toISOString();
      const { data: run, error: runErr } = await db.from("agent_runs").insert({
        agent_id: agent.id, workspace_id: job.workspace_id,
        mission_id: mission_id ?? null, status: "thinking",
        trigger: "scheduled", input,
        steps: [{ t: Date.now(), kind: "thought", label: "agendado", content: `Job ${job.id} disparou ${agent.name}.` }],
        started_at: startedAt,
      }).select("id").single();
      if (runErr) throw runErr;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || agent.model || "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: agent.system_prompt || `Você é ${agent.name}, ${agent.role}.` },
            { role: "user", content: input },
          ],
        }),
      });
      if (!aiRes.ok) throw new Error(`gateway_${aiRes.status}`);
      const aiJson = await aiRes.json();
      const output = aiJson.choices?.[0]?.message?.content ?? "";
      const usage = aiJson.usage ?? {};

      await db.from("agent_runs").update({
        status: "completed", output,
        steps: [
          { t: Date.now(), kind: "thought", label: "agendado", content: "Disparado por scheduler." },
          { t: Date.now(), kind: "final", label: "entregue", content: output.slice(0, 240) },
        ],
        tokens_in: usage.prompt_tokens ?? 0,
        tokens_out: usage.completion_tokens ?? 0,
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);

      return { ok: true, result: { run_id: run.id } };
    }

    if (job.kind === "content_publish") {
      // payload: { content_id }
      const { content_id } = job.payload as { content_id: string };
      const { data: item } = await db.from("content_items")
        .select("id, channel, status").eq("id", content_id).maybeSingle();
      if (!item) throw new Error("content not found");
      // Publicação real virá na Onda 7 (Meta). Por ora marcamos como "publish_pending".
      await db.from("content_items").update({
        status: "publish_pending", published_at: new Date().toISOString(),
      }).eq("id", content_id);
      return { ok: true, result: { content_id, channel: item.channel } };
    }

    if (job.kind === "noop") {
      return { ok: true, result: { tick: new Date().toISOString() } };
    }

    throw new Error(`unknown kind: ${job.kind}`);
  } catch (e) {
    return { ok: false, error: String((e as Error).message ?? e) };
  }
}

async function expireDecisions() {
  const { data, error } = await db.from("decisions")
    .update({ status: "expired" })
    .lt("expires_at", new Date().toISOString())
    .eq("status", "pending")
    .select("id");
  if (error) log("expire_decisions_error", { err: error.message });
  else if (data?.length) log("decisions_expired", { count: data.length });
}

async function tick() {
  // 1. Expirar decisões
  await expireDecisions();

  // 2. Pegar até 20 jobs prontos
  const { data: jobs, error } = await db.from("scheduled_jobs")
    .select("id, workspace_id, kind, payload, attempts")
    .eq("status", "pending")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(20);
  if (error) throw error;
  if (!jobs || jobs.length === 0) return { processed: 0 };

  let ok = 0, fail = 0;
  for (const j of jobs as Job[]) {
    // Marca como running pra evitar pegar 2x
    await db.from("scheduled_jobs").update({ status: "running" }).eq("id", j.id);
    const r = await runJob(j);
    if (r.ok) {
      ok++;
      await db.from("scheduled_jobs").update({
        status: "done", result: r.result ?? null, last_error: null,
      }).eq("id", j.id);
    } else {
      fail++;
      const attempts = (j.attempts ?? 0) + 1;
      const giveUp = attempts >= 3;
      await db.from("scheduled_jobs").update({
        status: giveUp ? "failed" : "pending",
        attempts, last_error: r.error,
        run_at: giveUp ? null : new Date(Date.now() + 60_000 * attempts).toISOString(),
      }).eq("id", j.id);
    }
  }
  return { processed: jobs.length, ok, fail };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: aceita secret de cron OU JWT do master
  const authOk = req.headers.get("x-scheduler-secret") === SCHEDULER_SECRET && SCHEDULER_SECRET.length > 0;
  if (!authOk) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const r = await tick();
    return new Response(JSON.stringify({ ok: true, ...r }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("tick_error", { err: String(e) });
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

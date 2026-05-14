// Command AI — Decision resolve / schedule helpers
// Recebe ações do Inbox: approve / reject / snooze, agenda jobs e executa
// tool_calls aprovados (preview.tool + preview.args + preview.target_tenant_id).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { executeRealTool, recordExec, makeRemoteClients, findTool } from "../_shared/commandTools.ts";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const { cmd: db, pub } = makeRemoteClients();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("missing auth");
    const { data: u, error: uErr } = await localAuth.auth.getUser(auth.replace("Bearer ", ""));
    if (uErr || !u.user) throw new Error("invalid token");
    if (u.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "decide") {
      // { decision_id, status: 'approved'|'rejected'|'snoozed', payload?, snooze_minutes? }
      const { decision_id, status, payload, snooze_minutes } = body;
      if (!decision_id || !status) throw new Error("decision_id, status required");

      if (status === "snoozed") {
        const next = new Date(Date.now() + (snooze_minutes ?? 60) * 60_000).toISOString();
        await db.from("decisions").update({
          expires_at: next, status: "pending",
        }).eq("id", decision_id);
        return new Response(JSON.stringify({ ok: true, snoozed_until: next }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await db.from("decisions").update({
        status, decided_at: new Date().toISOString(),
        decided_payload: payload ?? null,
      }).eq("id", decision_id).select("*").single();
      if (error) throw error;

      let toolResult: unknown = null;
      let toolStatus: string | null = null;

      // Se aprovou e a decision tem `options.execute_job`, agendamos pra agora
      if (status === "approved" && data.options?.execute_job) {
        await db.from("scheduled_jobs").insert({
          workspace_id: data.workspace_id,
          kind: data.options.execute_job.kind,
          payload: data.options.execute_job.payload ?? {},
          run_at: new Date().toISOString(),
          status: "pending",
        });
      }

      // Se aprovou e o preview tem tool/args/target_tenant_id, executa de verdade
      if (status === "approved" && data.preview?.tool && data.preview?.target_tenant_id) {
        const toolName = String(data.preview.tool);
        const tool = findTool(toolName);
        const targetTenant = String(data.preview.target_tenant_id);
        const args = (data.preview.args ?? {}) as Record<string, unknown>;
        const start = Date.now();
        try {
          if (!tool) throw new Error(`unknown_tool:${toolName}`);
          toolResult = await executeRealTool(pub, db, tool.name, args, targetTenant);
          toolStatus = "ok";
          await recordExec(db, {
            workspace_id: data.workspace_id,
            run_id: data.run_id,
            agent_id: data.agent_id,
            decision_id: data.id,
            target_tenant_id: targetTenant,
            tool_name: tool.name,
            args,
            result: toolResult,
            status: "ok",
            duration_ms: Date.now() - start,
          });
        } catch (e) {
          toolStatus = "error";
          await recordExec(db, {
            workspace_id: data.workspace_id,
            run_id: data.run_id,
            agent_id: data.agent_id,
            decision_id: data.id,
            target_tenant_id: targetTenant,
            tool_name: toolName,
            args,
            status: "error",
            error: String((e as Error).message ?? e),
            duration_ms: Date.now() - start,
          });
        }
      }

      await db.from("command_log").insert({
        workspace_id: data.workspace_id,
        kind: "decision_resolved",
        actor: "master",
        payload: { decision_id, status, tool_status: toolStatus },
      });

      return new Response(JSON.stringify({ ok: true, decision: data, tool_status: toolStatus, tool_result: toolResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "schedule_job") {
      // { workspace_id, kind, payload, run_at }
      const { workspace_id, kind, payload, run_at } = body;
      if (!workspace_id || !kind || !run_at) throw new Error("workspace_id, kind, run_at required");
      const { data, error } = await db.from("scheduled_jobs").insert({
        workspace_id, kind, payload: payload ?? {}, run_at, status: "pending",
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, job: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel_job") {
      const { job_id } = body;
      const { error } = await db.from("scheduled_jobs").update({ status: "cancelled" }).eq("id", job_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_decision") {
      // Helper pra testes — cria uma decisão de exemplo
      const { workspace_id, title, summary, kind, options } = body;
      const { data, error } = await db.from("decisions").insert({
        workspace_id, kind: kind ?? "approval",
        title, summary, status: "pending",
        options: options ?? {},
        expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, decision: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`unknown action: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

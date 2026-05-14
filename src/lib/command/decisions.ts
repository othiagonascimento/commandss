/**
 * Command AI — Decisions & Scheduled Jobs helpers
 */
import { commandDb } from "./db";
import { supabase } from "@/integrations/supabase/client";

export interface Decision {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  run_id: string | null;
  kind: string;
  title: string;
  summary: string | null;
  reasoning: string | null;
  confidence: number | null;
  preview: Record<string, unknown> | null;
  options: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected" | "snoozed" | "expired";
  decided_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ScheduledJob {
  id: string;
  workspace_id: string;
  kind: string;
  payload: Record<string, unknown>;
  run_at: string | null;
  status: "pending" | "running" | "done" | "failed" | "cancelled";
  attempts: number;
  last_error: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
}

export async function listDecisions(workspaceId: string, status: Decision["status"] | "all" = "pending") {
  let q = commandDb.from("decisions").select("*").eq("workspace_id", workspaceId);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as Decision[];
}

export async function listJobs(workspaceId: string, status: ScheduledJob["status"] | "all" = "all") {
  let q = commandDb.from("scheduled_jobs").select("*").eq("workspace_id", workspaceId);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q.order("run_at", { ascending: false, nullsFirst: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as ScheduledJob[];
}

async function callDecisionsFn(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `https://btoyclznuuwvxbsacemw.supabase.co/functions/v1/command-decisions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "decision_fn_error");
  return json;
}

export const decideDecision = (decision_id: string, status: "approved" | "rejected", payload?: unknown) =>
  callDecisionsFn({ action: "decide", decision_id, status, payload });

export const snoozeDecision = (decision_id: string, snooze_minutes = 60) =>
  callDecisionsFn({ action: "decide", decision_id, status: "snoozed", snooze_minutes });

export const scheduleJob = (workspace_id: string, kind: string, payload: unknown, run_at: string) =>
  callDecisionsFn({ action: "schedule_job", workspace_id, kind, payload, run_at });

export const cancelJob = (job_id: string) =>
  callDecisionsFn({ action: "cancel_job", job_id });

export const seedDecision = (workspace_id: string, title: string, summary: string, options?: unknown) =>
  callDecisionsFn({ action: "create_decision", workspace_id, title, summary, options });

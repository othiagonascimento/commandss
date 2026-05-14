// command-mission-orchestrator
// State machine: RECEIVED → TRIAGE → GROUND_TRUTH → DISPATCH (divisões em paralelo)
// → SYNTHESIZE (Reporter) → DECIDE (decisions.pending) → EXECUTE.
// Emite mission_events a cada transição.
//
// Body: { mission_id: string, target_tenant_id?: string, problem: string }
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { DIVISIONS, type DivisionDef } from "../_shared/divisions.ts";
import { TOOLS, makeRemoteClients, runReadTool } from "../_shared/commandTools.ts";
import { collectGroundTruth } from "../_shared/groundTruth.ts";
import { runNativeChat } from "../_shared/commandAiNative.ts";

const Body = z.object({
  mission_id: z.string().uuid(),
  target_tenant_id: z.string().uuid().nullish(),
  problem: z.string().min(3),
  enabled_divisions: z.array(z.string()).optional(),
});

async function killSwitchOn(cmd: any): Promise<boolean> {
  const { data } = await cmd.from("system_settings").select("value").eq("key", "autonomy_paused").maybeSingle();
  return data?.value === true || data?.value === "true";
}

async function emitEvent(cmd: any, mission_id: string, kind: string, payload: unknown) {
  await cmd.from("mission_events").insert({ mission_id, kind, payload }).select("id").single().catch(() => null);
}

async function runDivision(
  cmd: any, pub: any, division: DivisionDef, mission_id: string,
  problem: string, ground_truth: unknown, target_tenant_id: string | null,
): Promise<{ division: string; findings: string; tools_used: string[]; raw: string }> {
  const tools = TOOLS.filter((t) => division.domain_tools.some((p) => t.name.startsWith(p)) && t.risk === "read");
  const toolMenu = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");

  const sys = `${division.manual}\nFerramentas disponíveis (read-only):\n${toolMenu}\n\nGround truth do tenant:\n${JSON.stringify(ground_truth)}`;
  const user = `Problema relatado: ${problem}\n\nInvestigue. Cite tools que rodaria e o que conclui. Saída: { tools_used: string[], findings: string (markdown curto, 4-8 bullets) }.`;

  await emitEvent(cmd, mission_id, "division_start", { division: division.slug });

  // Loop curto: 1 chamada LLM, executa as tools que ele citar, segunda chamada para sintetizar.
  let toolsUsed: string[] = [];
  let raw = "";
  try {
    const first = await runNativeChat({
      model: division.default_model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `${user}\n\nResponda em JSON: {"plan_tools": ["nome.da.tool", ...]}` },
      ],
    });
    const planMatch = first.content.match(/\{[\s\S]*\}/);
    const plan = planMatch ? JSON.parse(planMatch[0]) : { plan_tools: [] };
    const planned: string[] = Array.isArray(plan.plan_tools) ? plan.plan_tools.slice(0, 4) : [];

    const results: Record<string, unknown> = {};
    for (const tn of planned) {
      const t = tools.find((x) => x.name === tn);
      if (!t) continue;
      try {
        const r = await runReadTool(pub, cmd, tn, {}, target_tenant_id);
        results[tn] = r;
        toolsUsed.push(tn);
      } catch (e) { results[tn] = { error: String(e) }; }
    }

    const second = await runNativeChat({
      model: division.default_model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
        { role: "assistant", content: `Resultados das tools:\n${JSON.stringify(results)}` },
        { role: "user", content: `Agora gere findings finais em markdown curto.` },
      ],
    });
    raw = second.content;
  } catch (e) {
    raw = `Erro na divisão ${division.slug}: ${String(e)}`;
  }

  await emitEvent(cmd, mission_id, "division_done", { division: division.slug, tools_used: toolsUsed });
  return { division: division.slug, findings: raw, tools_used: toolsUsed, raw };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    const { mission_id, target_tenant_id, problem, enabled_divisions } = parsed.data;

    const { cmd, pub } = makeRemoteClients();

    if (await killSwitchOn(cmd)) {
      return new Response(JSON.stringify({ error: "autonomy_paused" }), { status: 423, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    await cmd.from("missions").update({ status: "running", started_at: new Date().toISOString() }).eq("id", mission_id);
    await emitEvent(cmd, mission_id, "received", { problem });

    // GROUND TRUTH
    const gt = await collectGroundTruth(pub, target_tenant_id ?? null);
    await emitEvent(cmd, mission_id, "ground_truth", gt);

    // DISPATCH — divisões investigadoras (paralelo)
    const investigators = DIVISIONS.filter((d) =>
      ["canais", "inteligencia", "operacao", "dados", "monetizacao", "infra"].includes(d.slug) &&
      (!enabled_divisions || enabled_divisions.includes(d.slug)),
    );

    const contributions = await Promise.all(
      investigators.map((d) => runDivision(cmd, pub, d, mission_id, problem, gt, target_tenant_id ?? null)),
    );

    // SYNTHESIZE — Reporter consolida
    const reporter = DIVISIONS.find((d) => d.slug === "reporter")!;
    const reportPrompt = `${reporter.manual}\n\nProblema: ${problem}\nGround Truth: ${JSON.stringify(gt)}\n\nContribuições das divisões:\n${contributions.map((c) => `### ${c.division}\nTools: ${c.tools_used.join(", ")}\n${c.findings}`).join("\n\n")}\n\nGere o diagnostic_report em JSON estrito.`;

    const reportRes = await runNativeChat({
      model: reporter.default_model,
      messages: [
        { role: "system", content: reporter.manual },
        { role: "user", content: reportPrompt },
      ],
    });

    let reportJson: any = {
      problem_summary: problem, hypotheses: [], evidence: [],
      conclusion: reportRes.content.slice(0, 500), recommended_action: "Revisar achados manualmente.",
      severity: "medium", confidence: 0.5,
    };
    try {
      const m = reportRes.content.match(/\{[\s\S]*\}/);
      if (m) reportJson = { ...reportJson, ...JSON.parse(m[0]) };
    } catch { /* keep defaults */ }

    const { data: report } = await cmd.from("diagnostic_reports").insert({
      mission_id, target_tenant_id: target_tenant_id ?? null,
      problem_summary: reportJson.problem_summary ?? problem,
      hypotheses: reportJson.hypotheses ?? [],
      evidence: reportJson.evidence ?? [],
      division_contributions: Object.fromEntries(contributions.map((c) => [c.division, { tools_used: c.tools_used, findings: c.findings.slice(0, 2000) }])),
      conclusion: reportJson.conclusion ?? null,
      recommended_action: reportJson.recommended_action ?? null,
      severity: reportJson.severity ?? "medium",
      confidence: typeof reportJson.confidence === "number" ? reportJson.confidence : 0.5,
    }).select("id").single();

    await emitEvent(cmd, mission_id, "report_created", { report_id: report?.id });

    // Memória — indexa por tenant+tema
    if (target_tenant_id) {
      const theme = problem.split(/\s+/).slice(0, 3).join("_").toLowerCase();
      const symptom_hash = btoa(unescape(encodeURIComponent(problem))).slice(0, 32);
      await cmd.from("mission_memory").insert({
        tenant_id: target_tenant_id, theme, symptom_hash, symptom_text: problem.slice(0, 500),
        mission_id, diagnostic_report_id: report?.id, severity: reportJson.severity ?? "medium",
      }).catch(() => null);
    }

    await cmd.from("missions").update({
      status: "awaiting_review", finished_at: new Date().toISOString(),
      summary: reportJson.conclusion?.slice(0, 500) ?? null,
    }).eq("id", mission_id);

    return new Response(JSON.stringify({ ok: true, mission_id, report_id: report?.id, divisions: contributions.map((c) => c.division) }),
      { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});

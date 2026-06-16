// master-finops — Real FinOps & telemetry endpoints backed by:
//   api_usage_logs, ai_model_pricing_history, ai_output_token_budgets,
//   platform_cost_allocations, media_usage_events, video_send_jobs,
//   credit_ledger, tenants, profiles, plans
// All responses match the shapes in src/types/finops.ts.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-path-suffix",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- helpers ----------
function periodFromFilters(f: { month?: string; start_date?: string; end_date?: string }) {
  let from: Date, to: Date;
  if (f.start_date && f.end_date) {
    from = new Date(`${f.start_date}T00:00:00Z`);
    to = new Date(`${f.end_date}T23:59:59.999Z`);
  } else if (f.month) {
    const [y, m] = f.month.split("-").map(Number);
    from = new Date(Date.UTC(y, m - 1, 1));
    to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  } else {
    // default = current month
    const now = new Date();
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }
  const prevDur = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - prevDur - 1);
  const prevTo = new Date(from.getTime() - 1);
  return { from, to, prevFrom, prevTo };
}

function fmtDay(d: Date) { return d.toISOString().slice(0, 10); }
function pct(a: number, b: number) { return b > 0 ? +((a / b) * 100).toFixed(2) : 0; }
function delta(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return +(((curr - prev) / prev) * 100).toFixed(2);
}

async function fetchAll<T>(builder: any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await builder.range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
    if (from > 100_000) break;
  }
  return out;
}

// Safe wrapper: if a new optional table doesn't exist yet (42P01),
// return [] instead of breaking the whole FinOps payload.
async function safeSelect<T = any>(
  promise: Promise<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  try {
    const { data, error } = await promise;
    if (error) {
      const code = (error as any).code || "";
      if (code === "42P01" || /does not exist/i.test(error.message || "")) return [];
      console.warn("[finops] safeSelect soft-fail:", error.message);
      return [];
    }
    return (data || []) as T[];
  } catch (e) {
    console.warn("[finops] safeSelect threw:", (e as Error).message);
    return [];
  }
}

// Prorate a monthly value to the actual period (in days).
function prorate(monthly: number, periodDays: number): number {
  return (Number(monthly) || 0) * (Math.max(1, periodDays) / 30);
}



// ---------- main handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);
    const { data: mu } = await supabase
      .from("master_users").select("id, is_active")
      .eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!mu) return json({ error: "Access denied — not master" }, 403);

    // route
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const action: string =
      body.action ||
      url.searchParams.get("action") ||
      req.headers.get("x-path-suffix") ||
      "";
    const filters = body as any;
    const period = periodFromFilters(filters);
    const fromISO = period.from.toISOString();
    const toISO = period.to.toISOString();
    const prevFromISO = period.prevFrom.toISOString();
    const prevToISO = period.prevTo.toISOString();

    console.log(`[finops] ${action} ${fromISO}..${toISO}`);

    switch (action) {
      case "finops-overview": return json(await overview());
      case "finops-tenants": return json(await tenants());
      case "finops-users": return json(await users(filters.tenant_id));
      case "finops-ai-models": return json(await aiBreakdown("model"));
      case "finops-ai-layers": return json(await aiBreakdown("layer"));
      case "finops-ai-operations": return json(await aiBreakdown("operation"));
      case "finops-media": return json(await media());
      case "finops-infra": return json(await infra());
      case "finops-investor-summary": return json(await investor());
      case "finops-anomalies": return json(await anomalies());
      case "finops-actuals-list": return json(await actualsList(filters));
      case "finops-actuals-upsert": return json(await actualsUpsert(filters.payload || {}, user.id));
      case "finops-actuals-delete": return json(await actualsDelete(filters.id));
      case "finops-actuals-reconciliation": return json(await actualsReconciliation(filters.month));
      default:
        return json({ error: `Unknown endpoint: ${action}` }, 400);
    }

    // ---------------- billing actuals (reconciliation) ----------------
    async function actualsList(f: any) {
      const limit = Math.min(Number(f.limit) || 200, 1000);
      let q = supabase.from("platform_billing_actuals").select("*")
        .order("billing_month", { ascending: false })
        .order("vendor", { ascending: true })
        .limit(limit);
      if (f.month) q = q.eq("billing_month", f.month + "-01");
      if (f.vendor) q = q.eq("vendor", f.vendor);
      const { data, error } = await q;
      if (error) return { rows: [], error: error.message };
      return { rows: data || [] };
    }

    async function actualsUpsert(p: any, userId: string) {
      if (!p.billing_month || !p.vendor) return { error: "billing_month and vendor required" };
      const month = /^\d{4}-\d{2}$/.test(p.billing_month) ? p.billing_month + "-01" : p.billing_month;
      const row: any = {
        billing_month: month,
        vendor: String(p.vendor).toLowerCase().trim(),
        product: p.product?.trim() || null,
        amount_brl: Number(p.amount_brl || 0),
        amount_usd: p.amount_usd != null ? Number(p.amount_usd) : null,
        usd_brl_rate: p.usd_brl_rate != null ? Number(p.usd_brl_rate) : null,
        invoice_ref: p.invoice_ref?.trim() || null,
        notes: p.notes?.trim() || null,
        source: p.source || "manual",
        metadata: p.metadata || {},
      };
      if (p.id) {
        const { data, error } = await supabase.from("platform_billing_actuals")
          .update(row).eq("id", p.id).select().single();
        if (error) return { error: error.message };
        return { row: data };
      }
      row.created_by = userId;
      const { data, error } = await supabase.from("platform_billing_actuals")
        .upsert(row, { onConflict: "billing_month,vendor,product" })
        .select().single();
      if (error) return { error: error.message };
      return { row: data };
    }

    async function actualsDelete(id: string) {
      if (!id) return { error: "id required" };
      const { error } = await supabase.from("platform_billing_actuals").delete().eq("id", id);
      if (error) return { error: error.message };
      return { ok: true };
    }

    // Reconciliação SOMENTE de custos FIXOS de plataforma
    // (Supabase, Lovable, Uazapi, Cloudflare, GCP infra, etc.).
    // Custos VARIÁVEIS de IA por uso (OpenAI/Anthropic/Google API) NÃO entram aqui —
    // são acompanhados em /finops/ai pois são repassados via consumo do usuário.
    async function actualsReconciliation(monthStr?: string) {
      const m = monthStr || new Date().toISOString().slice(0, 7);
      const monthDate = m + "-01";
      const [y, mo] = m.split("-").map(Number);
      const to = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999)).toISOString();

      const estByVendor: Record<string, number> = {};

      // GCP infra (Cloud Run, LB, Storage…) — usa export do BigQuery
      const gcp = await safeSelect<any>(
        supabase.from("gcp_billing_daily").select("cost_brl,usage_date")
          .gte("usage_date", m + "-01").lte("usage_date", to.slice(0, 10)),
      );
      if (gcp.length) {
        estByVendor.gcp = (estByVendor.gcp || 0) +
          gcp.reduce((s, r) => s + Number(r.cost_brl || 0), 0);
      }

      // Custos fixos cadastrados manualmente (Supabase, Lovable, Uazapi, Cloudflare…)
      const fixed = await safeSelect<any>(
        supabase.from("platform_fixed_costs").select("vendor,monthly_brl,is_active,starts_on,ends_on")
          .eq("is_active", true),
      );
      fixed.forEach((r) => {
        const v = String(r.vendor || "").toLowerCase();
        if (!v) return;
        estByVendor[v] = (estByVendor[v] || 0) + Number(r.monthly_brl || 0);
      });


      // actuals
      const { data: actualsRows } = await supabase.from("platform_billing_actuals")
        .select("vendor,amount_brl").eq("billing_month", monthDate);
      const actByVendor: Record<string, number> = {};
      (actualsRows || []).forEach((r: any) => {
        const v = String(r.vendor).toLowerCase();
        actByVendor[v] = (actByVendor[v] || 0) + Number(r.amount_brl || 0);
      });

      const vendors = Array.from(new Set([...Object.keys(estByVendor), ...Object.keys(actByVendor)])).sort();
      const rows = vendors.map((v) => {
        const est = estByVendor[v] || 0;
        const act = actByVendor[v] || 0;
        return {
          vendor: v,
          estimate_brl: +est.toFixed(2),
          actual_brl: +act.toFixed(2),
          delta_brl: +(act - est).toFixed(2),
          delta_pct: est > 0 ? +(((act - est) / est) * 100).toFixed(1) : null,
          has_actual: act > 0,
        };
      });

      const totals = rows.reduce(
        (s, r) => ({
          estimate_brl: s.estimate_brl + r.estimate_brl,
          actual_brl: s.actual_brl + r.actual_brl,
        }),
        { estimate_brl: 0, actual_brl: 0 },
      );

      return {
        month: m,
        rows,
        totals: {
          estimate_brl: +totals.estimate_brl.toFixed(2),
          actual_brl: +totals.actual_brl.toFixed(2),
          delta_brl: +(totals.actual_brl - totals.estimate_brl).toFixed(2),
          delta_pct: totals.estimate_brl > 0
            ? +(((totals.actual_brl - totals.estimate_brl) / totals.estimate_brl) * 100).toFixed(1)
            : null,
        },
      };
    }

    // ---------------- queries ----------------
    async function loadApiLogs(from: string, to: string) {
      const q = supabase.from("api_usage_logs").select(
        "id,tenant_id,user_id,provider,model,operation,channel,mode,layer,input_tokens,output_tokens,total_tokens,credits_consumed,cost_brl,cost_usd,latency_ms,success,error_message,fallback_from_provider,fallback_from_model,fallback_to_provider,fallback_to_model,usage_missing_reason,pricing_snapshot_id,created_at",
      ).gte("created_at", from).lte("created_at", to).order("created_at", { ascending: false });
      return await fetchAll<any>(q, 1000);
    }

    async function loadMedia(from: string, to: string) {
      const q = supabase.from("media_usage_events").select(
        "id,tenant_id,user_id,event_type,folder,strategy,visibility,bytes_uploaded,bytes_deleted,current_storage_bytes,status,video_job_id,created_at",
      ).gte("created_at", from).lte("created_at", to);
      return await fetchAll<any>(q, 1000);
    }

    async function loadInfra(from: string, to: string) {
      const fromMonth = from.slice(0, 7) + "-01";
      const toMonth = to.slice(0, 7) + "-01";
      const periodDays = Math.max(
        1,
        (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 3600 * 24),
      );
      const rows: any[] = [];

      // 1) Manual allocations (Cloud Run / LB / etc.)
      const alloc = await safeSelect(
        supabase.from("platform_cost_allocations").select("*")
          .gte("billing_month", fromMonth).lte("billing_month", toMonth),
      );
      alloc.forEach((r: any) => rows.push({
        service: r.service || r.sku || "—",
        sku: r.sku,
        amount_brl: Number(r.amount_brl || 0),
        allocation_strategy: r.allocation_strategy,
        attribution_confidence: r.attribution_confidence || "medium",
        category: r.category || "infra",
        metadata: r.metadata,
      }));

      // 2) SaaS subscriptions paid by the Master (Lovable, OpenAI Teams,
      //    Antigravity, Codex, GitHub Copilot, Cloudflare, Resend, …).
      //    Prorate monthly_brl by the active days inside the period.
      const fixed = await safeSelect(
        supabase.from("platform_fixed_costs").select("*").eq("is_active", true),
      );
      fixed.forEach((r: any) => {
        const starts = r.starts_on ? new Date(r.starts_on).getTime() : 0;
        const ends = r.ends_on ? new Date(r.ends_on).getTime() : Infinity;
        const pFrom = new Date(from).getTime();
        const pTo = new Date(to).getTime();
        const overlapFrom = Math.max(starts, pFrom);
        const overlapTo = Math.min(ends, pTo);
        if (overlapTo <= overlapFrom) return;
        const overlapDays = (overlapTo - overlapFrom) / (1000 * 3600 * 24);
        const amount = prorate(Number(r.monthly_brl || 0), overlapDays);
        if (amount <= 0) return;
        rows.push({
          service: `${r.vendor} — ${r.product}`,
          sku: r.vendor,
          amount_brl: amount,
          allocation_strategy: "overhead",
          attribution_confidence: "high",
          category: r.category || "saas",
          metadata: { monthly_brl: r.monthly_brl, monthly_usd: r.monthly_usd, ...r.metadata },
        });
      });

      // 3) GCS billing (storage + ops + egress) — preferred over the
      //    R$/GB estimate when daily rows are present.
      const gcs = await safeSelect(
        supabase.from("gcs_billing_daily").select("*")
          .gte("billing_date", from.slice(0, 10)).lte("billing_date", to.slice(0, 10)),
      );
      if (gcs.length > 0) {
        const gcsAgg: Record<string, any> = {};
        gcs.forEach((r: any) => {
          const k = `${r.bucket_name}|${r.storage_class || "standard"}`;
          gcsAgg[k] = gcsAgg[k] || {
            bucket: r.bucket_name,
            storage_class: r.storage_class || "standard",
            cost_storage: 0, cost_ops: 0, cost_egress: 0, cost_total: 0,
            egress_bytes: 0,
          };
          gcsAgg[k].cost_storage += Number(r.cost_storage_brl || 0);
          gcsAgg[k].cost_ops += Number(r.cost_ops_brl || 0);
          gcsAgg[k].cost_egress += Number(r.cost_egress_brl || 0);
          gcsAgg[k].cost_total += Number(r.cost_total_brl || 0);
          gcsAgg[k].egress_bytes += Number(r.egress_bytes || 0);
        });
        Object.values(gcsAgg).forEach((g: any) => {
          rows.push({
            service: `GCS ${g.bucket}`,
            sku: g.storage_class,
            amount_brl: g.cost_total,
            allocation_strategy: "usage_proportional",
            attribution_confidence: "high",
            category: "storage",
            metadata: {
              cost_storage_brl: g.cost_storage,
              cost_ops_brl: g.cost_ops,
              cost_egress_brl: g.cost_egress,
              egress_bytes: g.egress_bytes,
            },
          });
        });
      }

      // 4) WhatsApp infra (uazapi / Meta) — fixed per active instance + variable per send.
      const waInstances = await safeSelect(
        supabase.from("whatsapp_instances")
          .select("id,tenant_id,monthly_cost_brl,is_active,status,provider"),
      );
      const waFixedTotal = waInstances
        .filter((i: any) => i.is_active !== false && Number(i.monthly_cost_brl || 0) > 0)
        .reduce((a: number, i: any) => a + prorate(Number(i.monthly_cost_brl || 0), periodDays), 0);
      if (waFixedTotal > 0) {
        rows.push({
          service: "WhatsApp — instâncias (uazapi/Meta)",
          sku: "wa_instance_fixed",
          amount_brl: waFixedTotal,
          allocation_strategy: "per_instance",
          attribution_confidence: "high",
          category: "whatsapp",
          metadata: { active_instances: waInstances.filter((i: any) => i.is_active !== false).length },
        });
      }
      const waJobs = await safeSelect(
        supabase.from("whatsapp_send_jobs").select("cost_brl,message_category,created_at")
          .gte("created_at", from).lte("created_at", to),
      );
      const waVarTotal = waJobs.reduce((a: number, j: any) => a + Number(j.cost_brl || 0), 0);
      if (waVarTotal > 0) {
        rows.push({
          service: "WhatsApp — mensagens (Meta Cloud)",
          sku: "wa_message_variable",
          amount_brl: waVarTotal,
          allocation_strategy: "per_message",
          attribution_confidence: "high",
          category: "whatsapp",
          metadata: { jobs: waJobs.length },
        });
      }

      return rows;
    }

    // Real GCS variable cost for the period (sum of cost_total_brl) — used
    // by overview/tenants/media to replace the R$/GB estimate when present.
    async function loadGcsRealCost(from: string, to: string): Promise<number> {
      const rows = await safeSelect(
        supabase.from("gcs_billing_daily").select("cost_total_brl,billing_date")
          .gte("billing_date", from.slice(0, 10)).lte("billing_date", to.slice(0, 10)),
      );
      return rows.reduce((a: number, r: any) => a + Number(r.cost_total_brl || 0), 0);
    }


    async function tenantMap() {
      const { data } = await supabase.from("tenants").select(
        "id,name,subdomain,plan_type,plan_id,subscription_status,is_blocked,has_monthly_fee,price_per_user,contracted_users,channel_price,extra_channels,discount_type,discount_value",
      );
      const m = new Map<string, any>();
      (data || []).forEach((t: any) => m.set(t.id, t));
      return m;
    }

    function mrrOf(t: any) {
      if (!t) return 0;
      if (t.is_blocked || t.has_monthly_fee === false) return 0;
      const bad = ["trialing", "pending", "lifetime", "partnership", "canceled"];
      if (bad.includes(t.subscription_status)) return 0;
      let rev = (t.price_per_user || 0) * (t.contracted_users || 1) +
                (t.channel_price || 0) * (t.extra_channels || 0);
      if (t.discount_type === "percent" && t.discount_value) rev *= (1 - t.discount_value / 100);
      else if (t.discount_type === "fixed" && t.discount_value) rev = Math.max(0, rev - t.discount_value);
      return rev;
    }

    // ---------------- overview ----------------
    async function overview() {
      const [logs, prevLogs, mediaRows, infraRows, tMap, gcsRealCost] = await Promise.all([
        loadApiLogs(fromISO, toISO),
        loadApiLogs(prevFromISO, prevToISO),
        loadMedia(fromISO, toISO),
        loadInfra(fromISO, toISO),
        tenantMap(),
        loadGcsRealCost(fromISO, toISO),
      ]);

      const sumCost = (rows: any[]) => rows.reduce((a, r) => a + Number(r.cost_brl || 0), 0);
      const cost_ai = sumCost(logs);
      const prev_ai = sumCost(prevLogs);

      // Prefer real GCS billing when available; fall back to R$/GB estimate.
      const MEDIA_PER_GB_BRL = 0.12;
      const totalBytes = mediaRows.reduce((a: number, r: any) => a + Number(r.bytes_uploaded || 0), 0);
      const cost_media_est = (totalBytes / 1024 / 1024 / 1024) * MEDIA_PER_GB_BRL;
      const cost_media = gcsRealCost > 0 ? gcsRealCost : cost_media_est;

      // Avoid double-counting: infraRows already contains the GCS lines
      // when gcs_billing_daily has data, so subtract them from "infra"
      // and route them into cost_media instead.
      const gcsInInfra = infraRows
        .filter((r: any) => r.category === "storage")
        .reduce((a: number, r: any) => a + Number(r.amount_brl || 0), 0);
      const cost_infra =
        infraRows.reduce((a: number, r: any) => a + Number(r.amount_brl || 0), 0) - gcsInInfra;
      const cost_total = cost_ai + cost_media + cost_infra;


      // Revenue
      let revenue = 0;
      tMap.forEach((t) => (revenue += mrrOf(t)));
      // pro-rate to period length (assume MRR full month)
      const days = (period.to.getTime() - period.from.getTime()) / (1000 * 3600 * 24);
      const revenuePeriod = revenue * (days / 30);

      const credits_consumed = logs.reduce((a, r) => a + Number(r.credits_consumed || 0), 0);
      const messages = logs.filter((l) => l.operation === "chat" || l.channel).length || logs.length;
      const active_users = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;
      const active_tenants = new Set(logs.map((l) => l.tenant_id).filter(Boolean)).size;

      // timeseries by day
      const tsMap: Record<string, any> = {};
      const days_list: string[] = [];
      for (let d = new Date(period.from); d <= period.to; d.setUTCDate(d.getUTCDate() + 1)) {
        const k = fmtDay(d);
        tsMap[k] = { date: k, cost_ai: 0, cost_media: 0, cost_infra: 0, revenue: 0 };
        days_list.push(k);
      }
      logs.forEach((r) => {
        const k = fmtDay(new Date(r.created_at));
        if (tsMap[k]) tsMap[k].cost_ai += Number(r.cost_brl || 0);
      });
      mediaRows.forEach((r: any) => {
        const k = fmtDay(new Date(r.created_at));
        if (tsMap[k]) tsMap[k].cost_media += (Number(r.bytes_uploaded || 0) / 1024 / 1024 / 1024) * MEDIA_PER_GB_BRL;
      });
      const dailyRev = revenuePeriod / Math.max(1, days_list.length);
      days_list.forEach((k) => (tsMap[k].revenue = dailyRev));
      // infra distributed evenly across period
      const dailyInfra = cost_infra / Math.max(1, days_list.length);
      days_list.forEach((k) => (tsMap[k].cost_infra = dailyInfra));

      // top loss tenants
      const tenantAgg: Record<string, { cost: number; rev: number }> = {};
      logs.forEach((r) => {
        if (!r.tenant_id) return;
        tenantAgg[r.tenant_id] = tenantAgg[r.tenant_id] || { cost: 0, rev: 0 };
        tenantAgg[r.tenant_id].cost += Number(r.cost_brl || 0);
      });
      const top_loss = Object.entries(tenantAgg).map(([id, v]) => {
        const t = tMap.get(id);
        const r = mrrOf(t) * (days / 30);
        return {
          tenant_id: id,
          tenant_name: t?.name || id.slice(0, 8),
          subdomain: t?.subdomain,
          subscription_status: t?.subscription_status,
          plan: t?.plan_type,
          revenue_brl: r,
          cost_ai_brl: v.cost,
          cost_media_brl: 0,
          cost_infra_brl: 0,
          cost_total_brl: v.cost,
          credits_consumed: 0,
          messages: 0,
          active_users: 0,
          cost_per_message: 0,
          cost_per_active_user: 0,
          margin_brl: r - v.cost,
          margin_pct: pct(r - v.cost, r),
        };
      }).sort((a, b) => a.margin_brl - b.margin_brl).slice(0, 5);

      // top cost models
      const modelAgg: Record<string, { cost: number; calls: number; provider: string; model: string }> = {};
      logs.forEach((r) => {
        const k = `${r.provider}|${r.model}`;
        modelAgg[k] = modelAgg[k] || { cost: 0, calls: 0, provider: r.provider, model: r.model };
        modelAgg[k].cost += Number(r.cost_brl || 0);
        modelAgg[k].calls += 1;
      });
      const top_cost_models = Object.values(modelAgg)
        .sort((a, b) => b.cost - a.cost).slice(0, 5)
        .map((m) => ({ provider: m.provider, model: m.model, cost_brl: m.cost, calls: m.calls }));

      const last_ingest = logs[0]?.created_at ?? null;

      return {
        period: { from: fromISO, to: toISO, label: filters.month || `${fromISO.slice(0, 10)}..${toISO.slice(0, 10)}` },
        revenue_brl: { value: revenuePeriod, previous: revenuePeriod, delta_pct: 0, confidence: "high" },
        cost_total_brl: { value: cost_total, previous: prev_ai, delta_pct: delta(cost_total, prev_ai), confidence: "high" },
        cost_ai_brl: { value: cost_ai, previous: prev_ai, delta_pct: delta(cost_ai, prev_ai), confidence: "high" },
        cost_media_brl: { value: cost_media, confidence: cost_media > 0 ? "medium" : "low" },
        cost_infra_brl: { value: cost_infra, confidence: cost_infra > 0 ? "high" : "low" },
        margin_brl: { value: revenuePeriod - cost_total, confidence: "medium" },
        margin_pct: { value: pct(revenuePeriod - cost_total, revenuePeriod), confidence: "medium" },
        cost_per_message: { value: messages ? cost_total / messages : 0, confidence: "medium" },
        cost_per_active_user: { value: active_users ? cost_total / active_users : 0, confidence: "high" },
        cost_per_active_tenant: { value: active_tenants ? cost_total / active_tenants : 0, confidence: "high" },
        credits_consumed: { value: credits_consumed, confidence: "high" },
        cost_breakdown: [
          { category: "IA (LLM)", amount_brl: cost_ai, pct: pct(cost_ai, cost_total) },
          { category: "Mídia", amount_brl: cost_media, pct: pct(cost_media, cost_total) },
          { category: "Infra", amount_brl: cost_infra, pct: pct(cost_infra, cost_total) },
        ],
        timeseries: days_list.map((k) => tsMap[k]),
        top_loss_tenants: top_loss,
        top_cost_models,
        recent_anomalies: [],
        data_health: {
          logs_count: logs.length,
          last_ingest_at: last_ingest,
          avg_confidence: logs.length > 100 ? "high" : logs.length > 10 ? "medium" : "low",
          api_usage_logs_empty: logs.length === 0,
          notes: [
            ...(cost_infra === 0 ? ["Sem custos de infra/SaaS no período (platform_cost_allocations + platform_fixed_costs)"] : []),
            ...(gcsRealCost === 0 ? ["GCS billing real ausente — usando estimativa R$/GB. Popule public.gcs_billing_daily para precisão."] : []),
          ],

        },
      };
    }

    // ---------------- tenants ----------------
    async function tenants() {
      const [logs, mediaRows, tMap] = await Promise.all([
        loadApiLogs(fromISO, toISO),
        loadMedia(fromISO, toISO),
        tenantMap(),
      ]);
      const days = (period.to.getTime() - period.from.getTime()) / (1000 * 3600 * 24);
      const MEDIA_PER_GB_BRL = 0.12;

      const agg: Record<string, any> = {};
      logs.forEach((r) => {
        const id = r.tenant_id; if (!id) return;
        agg[id] = agg[id] || { messages: 0, cost_ai: 0, cost_media: 0, credits: 0, users: new Set() };
        agg[id].cost_ai += Number(r.cost_brl || 0);
        agg[id].credits += Number(r.credits_consumed || 0);
        agg[id].messages += 1;
        if (r.user_id) agg[id].users.add(r.user_id);
      });
      mediaRows.forEach((m: any) => {
        const id = m.tenant_id; if (!id) return;
        agg[id] = agg[id] || { messages: 0, cost_ai: 0, cost_media: 0, credits: 0, users: new Set() };
        agg[id].cost_media += (Number(m.bytes_uploaded || 0) / 1024 / 1024 / 1024) * MEDIA_PER_GB_BRL;
      });

      const rows = Object.entries(agg).map(([id, v]: [string, any]) => {
        const t = tMap.get(id);
        const rev = mrrOf(t) * (days / 30);
        const cost_total = v.cost_ai + v.cost_media;
        const margin = rev - cost_total;
        const margin_pct_v = pct(margin, rev);
        let risk: "low" | "medium" | "high" | "critical" = "low";
        if (margin < 0) risk = "critical";
        else if (margin_pct_v < 20) risk = "high";
        else if (margin_pct_v < 40) risk = "medium";
        return {
          tenant_id: id,
          tenant_name: t?.name || id.slice(0, 8),
          subdomain: t?.subdomain,
          subscription_status: t?.subscription_status,
          plan: t?.plan_type,
          revenue_brl: rev,
          cost_ai_brl: v.cost_ai,
          cost_media_brl: v.cost_media,
          cost_infra_brl: 0,
          cost_total_brl: cost_total,
          credits_consumed: v.credits,
          messages: v.messages,
          active_users: v.users.size,
          cost_per_message: v.messages ? cost_total / v.messages : 0,
          cost_per_active_user: v.users.size ? cost_total / v.users.size : 0,
          margin_brl: margin,
          margin_pct: margin_pct_v,
          risk,
          confidence: v.messages > 50 ? "high" : v.messages > 5 ? "medium" : "low",
        };
      }).sort((a, b) => b.cost_total_brl - a.cost_total_brl);

      return { rows };
    }

    // ---------------- users ----------------
    async function users(tenant_id?: string) {
      let q = supabase.from("api_usage_logs").select(
        "tenant_id,user_id,operation,cost_brl,credits_consumed,created_at",
      ).gte("created_at", fromISO).lte("created_at", toISO);
      if (tenant_id) q = q.eq("tenant_id", tenant_id);
      const logs = await fetchAll<any>(q, 1000);

      const tMap = await tenantMap();
      const { data: profs } = await supabase.from("profiles").select("id,full_name,email,tenant_id");
      const pMap = new Map<string, any>();
      (profs || []).forEach((p: any) => pMap.set(p.id, p));

      const agg: Record<string, any> = {};
      logs.forEach((r) => {
        const k = `${r.tenant_id}|${r.user_id || "anon"}`;
        agg[k] = agg[k] || {
          user_id: r.user_id || "anon",
          tenant_id: r.tenant_id,
          messages: 0, ai_events: 0, credits: 0, cost_ai: 0,
        };
        agg[k].ai_events += 1;
        agg[k].messages += 1;
        agg[k].cost_ai += Number(r.cost_brl || 0);
        agg[k].credits += Number(r.credits_consumed || 0);
      });
      const rows = Object.values(agg).map((v: any) => {
        const t = tMap.get(v.tenant_id);
        const p = pMap.get(v.user_id);
        const cost_total = v.cost_ai;
        let risk: "low" | "medium" | "high" | "critical" = "low";
        if (cost_total > 100) risk = "critical";
        else if (cost_total > 50) risk = "high";
        else if (cost_total > 20) risk = "medium";
        return {
          user_id: v.user_id,
          user_name: p?.full_name ?? null,
          user_email: p?.email ?? null,
          tenant_id: v.tenant_id,
          tenant_name: t?.name || v.tenant_id?.slice(0, 8) || "—",
          messages: v.messages,
          ai_events: v.ai_events,
          credits_consumed: v.credits,
          cost_ai_brl: v.cost_ai,
          cost_media_brl: 0,
          cost_total_brl: cost_total,
          cost_per_message: v.messages ? cost_total / v.messages : 0,
          cost_per_ai_event: v.ai_events ? cost_total / v.ai_events : 0,
          risk,
        };
      }).sort((a: any, b: any) => b.cost_total_brl - a.cost_total_brl);
      return { rows };
    }

    // ---------------- ai breakdown ----------------
    async function aiBreakdown(scope: "model" | "layer" | "operation") {
      const logs = await loadApiLogs(fromISO, toISO);
      const { data: pricing } = await supabase
        .from("ai_model_pricing_history")
        .select("provider,model,effective_from,effective_to");
      const pricedKeys = new Set((pricing || []).map((p: any) => `${p.provider}|${p.model}`));

      const modelAgg: Record<string, any> = {};
      const layerAgg: Record<string, any> = {};
      const opAgg: Record<string, any> = {};
      const fallbackAgg: Record<string, any> = {};

      logs.forEach((r) => {
        const mk = `${r.provider}|${r.model}`;
        modelAgg[mk] = modelAgg[mk] || {
          provider: r.provider, model: r.model, calls: 0, cost_brl: 0,
          input_tokens: 0, output_tokens: 0, latency_sum: 0, errors: 0,
          fallbacks: 0, usage_missing: 0,
        };
        const m = modelAgg[mk];
        m.calls += 1; m.cost_brl += Number(r.cost_brl || 0);
        m.input_tokens += Number(r.input_tokens || 0);
        m.output_tokens += Number(r.output_tokens || 0);
        m.latency_sum += Number(r.latency_ms || 0);
        if (!r.success) m.errors += 1;
        if (r.fallback_from_provider) m.fallbacks += 1;
        if (r.usage_missing_reason) m.usage_missing += 1;

        const lk = String(r.layer ?? "n/a");
        layerAgg[lk] = layerAgg[lk] || { layer: lk, calls: 0, cost_brl: 0, credits: 0, output: 0, latency_sum: 0 };
        layerAgg[lk].calls += 1;
        layerAgg[lk].cost_brl += Number(r.cost_brl || 0);
        layerAgg[lk].credits += Number(r.credits_consumed || 0);
        layerAgg[lk].output += Number(r.output_tokens || 0);
        layerAgg[lk].latency_sum += Number(r.latency_ms || 0);

        const ok = `${r.operation || "?"}|${r.channel || ""}|${r.mode || ""}`;
        opAgg[ok] = opAgg[ok] || {
          operation: r.operation || "?", channel: r.channel, mode: r.mode,
          calls: 0, cost_brl: 0, input_tokens: 0, output_tokens: 0,
          latency_sum: 0, errors: 0,
        };
        opAgg[ok].calls += 1;
        opAgg[ok].cost_brl += Number(r.cost_brl || 0);
        opAgg[ok].input_tokens += Number(r.input_tokens || 0);
        opAgg[ok].output_tokens += Number(r.output_tokens || 0);
        opAgg[ok].latency_sum += Number(r.latency_ms || 0);
        if (!r.success) opAgg[ok].errors += 1;

        if (r.fallback_from_provider) {
          const fk = `${r.fallback_from_provider}|${r.fallback_from_model}|${r.fallback_to_provider || r.provider}|${r.fallback_to_model || r.model}`;
          fallbackAgg[fk] = fallbackAgg[fk] || {
            from_provider: r.fallback_from_provider, from_model: r.fallback_from_model,
            to_provider: r.fallback_to_provider || r.provider, to_model: r.fallback_to_model || r.model,
            count: 0, cost_brl: 0,
          };
          fallbackAgg[fk].count += 1;
          fallbackAgg[fk].cost_brl += Number(r.cost_brl || 0);
        }
      });

      const models = Object.values(modelAgg).map((m: any) => ({
        provider: m.provider, model: m.model, calls: m.calls,
        cost_brl: m.cost_brl, input_tokens: m.input_tokens, output_tokens: m.output_tokens,
        output_input_ratio: m.input_tokens ? +(m.output_tokens / m.input_tokens).toFixed(2) : 0,
        avg_latency_ms: m.calls ? Math.round(m.latency_sum / m.calls) : 0,
        errors: m.errors, fallbacks: m.fallbacks,
        cost_per_call_brl: m.calls ? m.cost_brl / m.calls : 0,
        cost_per_1k_output_brl: m.output_tokens ? (m.cost_brl / m.output_tokens) * 1000 : 0,
        usage_missing_reason_count: m.usage_missing,
        has_pricing: pricedKeys.has(`${m.provider}|${m.model}`),
      })).sort((a, b) => b.cost_brl - a.cost_brl);

      const layers = Object.values(layerAgg).map((l: any) => ({
        layer: l.layer, calls: l.calls, cost_brl: l.cost_brl, credits_consumed: l.credits,
        output_tokens: l.output, cost_per_credit: l.credits ? l.cost_brl / l.credits : 0,
        cost_per_response: l.calls ? l.cost_brl / l.calls : 0,
        avg_latency_ms: l.calls ? Math.round(l.latency_sum / l.calls) : 0,
      })).sort((a, b) => b.cost_brl - a.cost_brl);

      const operations = Object.values(opAgg).map((o: any) => ({
        operation: o.operation, channel: o.channel, mode: o.mode,
        calls: o.calls, cost_brl: o.cost_brl,
        input_tokens: o.input_tokens, output_tokens: o.output_tokens,
        avg_latency_ms: o.calls ? Math.round(o.latency_sum / o.calls) : 0,
        error_rate: o.calls ? +(o.errors / o.calls).toFixed(4) : 0,
      })).sort((a, b) => b.cost_brl - a.cost_brl);

      const fallbacks = Object.values(fallbackAgg).sort((a: any, b: any) => b.count - a.count);

      // errors timeline by day
      const errorsByDay: Record<string, { calls: number; errors: number }> = {};
      logs.forEach((r) => {
        const d = fmtDay(new Date(r.created_at));
        errorsByDay[d] = errorsByDay[d] || { calls: 0, errors: 0 };
        errorsByDay[d].calls += 1;
        if (!r.success) errorsByDay[d].errors += 1;
      });
      const errors_timeline = Object.entries(errorsByDay).sort().map(([date, v]) => ({
        date, calls: v.calls, error_rate: v.calls ? +(v.errors / v.calls).toFixed(4) : 0,
      }));

      // token distribution buckets
      const buckets = { "<500": 0, "500-2k": 0, "2k-8k": 0, "8k-32k": 0, ">32k": 0 };
      logs.forEach((r) => {
        const t = Number(r.total_tokens || 0);
        if (t < 500) buckets["<500"]++;
        else if (t < 2000) buckets["500-2k"]++;
        else if (t < 8000) buckets["2k-8k"]++;
        else if (t < 32000) buckets["8k-32k"]++;
        else buckets[">32k"]++;
      });
      const token_distribution = Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));

      return { models, layers, operations, fallbacks, token_distribution, errors_timeline };
    }

    // ---------------- media ----------------
    async function media() {
      const rows = await loadMedia(fromISO, toISO);
      const tMap = await tenantMap();
      const MEDIA_PER_GB_BRL = 0.12;
      const totals = {
        bytes_uploaded: rows.reduce((a: number, r: any) => a + Number(r.bytes_uploaded || 0), 0),
        bytes_deleted: rows.reduce((a: number, r: any) => a + Number(r.bytes_deleted || 0), 0),
        current_storage_bytes: rows.reduce((a: number, r: any) => Math.max(a, Number(r.current_storage_bytes || 0)), 0),
        cost_estimated_brl: 0,
      };
      totals.cost_estimated_brl = (totals.bytes_uploaded / 1024 / 1024 / 1024) * MEDIA_PER_GB_BRL;

      const byFolder: Record<string, { bytes: number; events: number }> = {};
      const byStrategy: Record<string, { bytes: number; events: number }> = {};
      let pub = 0, prv = 0;
      const byTenant: Record<string, any> = {};
      rows.forEach((r: any) => {
        const f = r.folder || "—";
        byFolder[f] = byFolder[f] || { bytes: 0, events: 0 };
        byFolder[f].bytes += Number(r.bytes_uploaded || 0);
        byFolder[f].events += 1;
        const s = r.strategy || "—";
        byStrategy[s] = byStrategy[s] || { bytes: 0, events: 0 };
        byStrategy[s].bytes += Number(r.bytes_uploaded || 0);
        byStrategy[s].events += 1;
        if (r.visibility === "public") pub += Number(r.bytes_uploaded || 0);
        else prv += Number(r.bytes_uploaded || 0);
        const id = r.tenant_id || "—";
        byTenant[id] = byTenant[id] || {
          tenant_id: id, bytes_uploaded: 0, bytes_deleted: 0,
          current_storage_bytes: 0, video_jobs: 0, failed_jobs: 0, uploading_jobs: 0,
          folder: r.folder, strategy: r.strategy, last_event_at: r.created_at,
        };
        byTenant[id].bytes_uploaded += Number(r.bytes_uploaded || 0);
        byTenant[id].bytes_deleted += Number(r.bytes_deleted || 0);
        byTenant[id].current_storage_bytes = Math.max(byTenant[id].current_storage_bytes, Number(r.current_storage_bytes || 0));
        if (r.video_job_id) byTenant[id].video_jobs += 1;
        if (r.status === "failed") byTenant[id].failed_jobs += 1;
        if (r.status === "uploading") byTenant[id].uploading_jobs += 1;
        if (!byTenant[id].last_event_at || r.created_at > byTenant[id].last_event_at) {
          byTenant[id].last_event_at = r.created_at;
        }
      });

      const { data: jobs } = await supabase.from("video_send_jobs")
        .select("id,tenant_id,status,phase,created_at,updated_at")
        .gte("created_at", fromISO).lte("created_at", toISO);
      const pipeline = { uploading: 0, processing: 0, completed: 0, failed_recoverable: 0 };
      const stuck: any[] = [];
      const now = Date.now();
      (jobs || []).forEach((j: any) => {
        const s = j.status;
        if (s === "uploading") pipeline.uploading++;
        else if (s === "processing" || s === "queued") pipeline.processing++;
        else if (s === "completed" || s === "sent") pipeline.completed++;
        else if (s === "failed") pipeline.failed_recoverable++;
        if (s !== "completed" && s !== "sent" && s !== "failed") {
          const upd = new Date(j.updated_at || j.created_at).getTime();
          const mins = (now - upd) / 60000;
          if (mins > 30) stuck.push({ id: j.id, tenant_id: j.tenant_id, status: s, phase: j.phase, minutes_stuck: Math.round(mins) });
        }
      });

      const rowsOut = Object.values(byTenant).map((v: any) => ({
        ...v,
        tenant_name: tMap.get(v.tenant_id)?.name || v.tenant_id.slice(0, 8),
      })).sort((a: any, b: any) => b.bytes_uploaded - a.bytes_uploaded);

      return {
        totals,
        by_folder: Object.entries(byFolder).map(([folder, v]) => ({ folder, ...v })),
        by_strategy: Object.entries(byStrategy).map(([strategy, v]) => ({ strategy, ...v })),
        visibility: { public_bytes: pub, private_bytes: prv },
        rows: rowsOut,
        video_pipeline: pipeline,
        stuck_jobs: stuck.slice(0, 20),
      };
    }

    // ---------------- infra ----------------
    async function infra() {
      const rows = await loadInfra(fromISO, toISO);
      const total = rows.reduce((a: number, r: any) => a + Number(r.amount_brl || 0), 0);
      const lb = rows.find((r: any) => /load.?balanc/i.test(r.service || r.sku || ""));
      const tMap = await tenantMap();
      const tenantCount = tMap.size || 1;

      // active users in period
      const logs = await loadApiLogs(fromISO, toISO);
      const activeUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size || 1;
      const messages = logs.length || 1;

      return {
        rows: rows.map((r: any) => ({
          service: r.service || r.sku || "—",
          sku: r.sku,
          amount_brl: Number(r.amount_brl || 0),
          allocation_strategy: r.allocation_strategy,
          attribution_confidence: r.attribution_confidence || "medium",
          category: r.category,
          metadata: r.metadata,
        })),
        total_brl: total,
        load_balancer: lb ? {
          amount_brl: Number(lb.amount_brl || 0),
          classification: "overhead",
          rationale: "Custo fixo de balanceamento alocado proporcionalmente",
        } : { amount_brl: 0, classification: "unknown", rationale: "Sem registro de LB no período" },
        per_tenant_brl: total / tenantCount,
        per_user_brl: total / activeUsers,
        per_message_brl: total / messages,
      };
    }

    // ---------------- investor ----------------
    async function investor() {
      const ov = await overview();
      return {
        period: { from: fromISO, to: toISO },
        revenue_brl: ov.revenue_brl.value,
        variable_cost_brl: ov.cost_ai_brl.value + ov.cost_media_brl.value,
        fixed_cost_brl: ov.cost_infra_brl.value,
        margin_brl: ov.margin_brl.value,
        margin_pct: ov.margin_pct.value,
        active_tenants: ov.cost_per_active_tenant.value > 0 ? Math.round(ov.cost_total_brl.value / ov.cost_per_active_tenant.value) : 0,
        active_users: ov.cost_per_active_user.value > 0 ? Math.round(ov.cost_total_brl.value / ov.cost_per_active_user.value) : 0,
        messages: ov.cost_per_message.value > 0 ? Math.round(ov.cost_total_brl.value / ov.cost_per_message.value) : 0,
        cost_per_message: ov.cost_per_message.value,
        cost_per_tenant: ov.cost_per_active_tenant.value,
        cost_per_user: ov.cost_per_active_user.value,
        ai_pct_of_cost: pct(ov.cost_ai_brl.value, ov.cost_total_brl.value),
        infra_pct_of_cost: pct(ov.cost_infra_brl.value, ov.cost_total_brl.value),
        margin_timeline: (ov.timeseries || []).map((t: any) => {
          const cost = t.cost_ai + t.cost_media + t.cost_infra;
          return {
            date: t.date,
            margin_brl: t.revenue - cost,
            margin_pct: pct(t.revenue - cost, t.revenue),
          };
        }),
        cost_stack_timeline: (ov.timeseries || []).map((t: any) => ({
          date: t.date, ai: t.cost_ai, media: t.cost_media, infra: t.cost_infra, other: 0,
        })),
        risks: ov.margin_pct.value < 30 ? [{
          title: "Margem abaixo de 30%",
          severity: "high",
          description: `Margem atual: ${ov.margin_pct.value}%`,
        }] : [],
        opportunities: (ov.top_cost_models || []).slice(0, 3).map((m: any) => ({
          title: `Otimizar modelo ${m.provider}/${m.model}`,
          description: `Representa R$ ${m.cost_brl.toFixed(2)} (${m.calls} chamadas) no período`,
          impact_brl: m.cost_brl * 0.2,
        })),
      };
    }

    // ---------------- anomalies ----------------
    async function anomalies() {
      const logs = await loadApiLogs(fromISO, toISO);
      const tMap = await tenantMap();
      const out: any[] = [];

      // 1. tenants negative margin
      const tAgg: Record<string, number> = {};
      logs.forEach((r) => {
        if (!r.tenant_id) return;
        tAgg[r.tenant_id] = (tAgg[r.tenant_id] || 0) + Number(r.cost_brl || 0);
      });
      const days = (period.to.getTime() - period.from.getTime()) / (1000 * 3600 * 24);
      Object.entries(tAgg).forEach(([id, cost]) => {
        const t = tMap.get(id);
        const rev = mrrOf(t) * (days / 30);
        if (rev > 0 && cost > rev) {
          out.push({
            id: `neg-${id}`, type: "negative_margin", severity: "critical",
            title: `${t?.name || id.slice(0, 8)} consumiu mais do que paga`,
            description: `Receita R$ ${rev.toFixed(2)} vs custo IA R$ ${cost.toFixed(2)}`,
            entity: { type: "tenant", id, name: t?.name },
            observed_value: cost, expected_value: rev,
            recommendation: "Revisar plano ou aplicar limite",
            created_at: new Date().toISOString(),
          });
        } else if (rev > 0 && cost > rev * 0.7) {
          out.push({
            id: `risk-${id}`, type: "high_cost_ratio", severity: "high",
            title: `${t?.name || id.slice(0, 8)} usa >70% da receita em IA`,
            description: `${pct(cost, rev)}% da receita`,
            entity: { type: "tenant", id, name: t?.name },
            observed_value: cost, expected_value: rev * 0.5,
            created_at: new Date().toISOString(),
          });
        }
      });

      // 2. high error rate models
      const mErr: Record<string, { calls: number; errors: number; provider: string; model: string }> = {};
      logs.forEach((r) => {
        const k = `${r.provider}|${r.model}`;
        mErr[k] = mErr[k] || { calls: 0, errors: 0, provider: r.provider, model: r.model };
        mErr[k].calls += 1;
        if (!r.success) mErr[k].errors += 1;
      });
      Object.values(mErr).forEach((m) => {
        if (m.calls > 20 && m.errors / m.calls > 0.1) {
          out.push({
            id: `err-${m.provider}-${m.model}`, type: "high_error_rate", severity: "high",
            title: `${m.provider}/${m.model} com ${pct(m.errors, m.calls)}% de erros`,
            description: `${m.errors}/${m.calls} chamadas falhas`,
            observed_value: pct(m.errors, m.calls), expected_value: 5,
            recommendation: "Verificar fallback e quota do provider",
            created_at: new Date().toISOString(),
          });
        }
      });

      // 3. usage_missing_reason flood
      const missing = logs.filter((l) => l.usage_missing_reason).length;
      if (missing > 50) {
        out.push({
          id: "missing-usage", type: "telemetry_gap", severity: "medium",
          title: `${missing} chamadas sem token usage reportado`,
          description: "Provider/SDK não retornou métricas de uso — custo subestimado",
          observed_value: missing, expected_value: 0,
          recommendation: "Atualizar SDK do provider ou habilitar usage stream",
          created_at: new Date().toISOString(),
        });
      }

      const counts: Record<string, number> = {};
      out.forEach((a) => (counts[a.severity] = (counts[a.severity] || 0) + 1));
      return { rows: out, counts };
    }
  } catch (e) {
    console.error("[finops] fatal", e);
    return json({ error: (e as Error).message }, 500);
  }
});

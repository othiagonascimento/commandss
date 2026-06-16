// Edge function: gcs-billing-sync
// Reads daily cost rows from BigQuery Billing Export and upserts into
// public.gcs_billing_daily. Gemini / Vertex AI rows are written separately
// into platform_cost_allocations (category='ai_infrastructure') to avoid
// double-counting with the AI pipeline.
//
// Secrets required (set in external Supabase dashboard):
//   GCP_SERVICE_ACCOUNT_JSON  - full service account JSON
//   BQ_PROJECT_ID             - e.g. "uopa-crm-ai"
//   BQ_DATASET                - e.g. "gcp_billing"
//   BQ_TABLE                  - e.g. "gcp_billing_export_v1_XXXXXX_XXXXXX_XXXXXX"
// Optional:
//   USD_BRL_RATE              - fallback FX (default 5.0)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SA_JSON = Deno.env.get('GCP_SERVICE_ACCOUNT_JSON');
const BQ_PROJECT_ID = Deno.env.get('BQ_PROJECT_ID');
const BQ_DATASET = Deno.env.get('BQ_DATASET');
const BQ_TABLE = Deno.env.get('BQ_TABLE');
const USD_BRL_FALLBACK = parseFloat(Deno.env.get('USD_BRL_RATE') ?? '5.0');

// ---------- Google JWT → access token ----------
async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import PKCS#8 private key
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const jwt = `${unsigned}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!resp.ok) throw new Error(`google_oauth_failed: ${resp.status} ${await resp.text()}`);
  const j = await resp.json();
  return j.access_token as string;
}

// ---------- BigQuery query ----------
async function runBQ(token: string, sql: string): Promise<{ rows: any[]; bytesBilled: number }> {
  const resp = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${BQ_PROJECT_ID}/queries`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        useLegacySql: false,
        maximumBytesBilled: '5368709120', // 5 GB hard cap
        timeoutMs: 60000,
      }),
    },
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`bq_query_failed: ${resp.status} ${text}`);
  const j = JSON.parse(text);

  const fields = (j.schema?.fields ?? []) as { name: string }[];
  const rows = (j.rows ?? []).map((r: any) => {
    const o: Record<string, unknown> = {};
    r.f.forEach((cell: any, i: number) => {
      o[fields[i].name] = cell.v;
    });
    return o;
  });
  return { rows, bytesBilled: Number(j.totalBytesBilled ?? 0) };
}

// ---------- main ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const logIns = await sb
    .from('gcs_billing_sync_log')
    .insert({ status: 'running' })
    .select('id')
    .single();
  const logId = logIns.data?.id;

  const finish = async (patch: Record<string, unknown>) => {
    if (logId) {
      await sb
        .from('gcs_billing_sync_log')
        .update({ ...patch, finished_at: new Date().toISOString() })
        .eq('id', logId);
    }
  };

  try {
    if (!SA_JSON || !BQ_PROJECT_ID || !BQ_DATASET || !BQ_TABLE) {
      throw new Error('missing_secrets: GCP_SERVICE_ACCOUNT_JSON / BQ_PROJECT_ID / BQ_DATASET / BQ_TABLE');
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* noop */ }
    const mode = (body.mode as string) ?? 'daily'; // daily | backfill
    const days = mode === 'backfill' ? Math.min(Number(body.days ?? 30), 90) : 3;

    const sa = JSON.parse(SA_JSON);
    const token = await getAccessToken(sa);

    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const fqtn = `\`${BQ_PROJECT_ID}.${BQ_DATASET}.${BQ_TABLE}\``;
    const sql = `
      SELECT
        DATE(usage_start_time) AS usage_date,
        service.description    AS service,
        sku.id                 AS sku_id,
        sku.description        AS sku_description,
        project.id             AS project_id,
        location.location      AS location,
        SUM(usage.amount)      AS usage_amount,
        ANY_VALUE(usage.unit)  AS usage_unit,
        SUM(cost)              AS cost_usd,
        SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS credits_usd,
        ANY_VALUE(currency)    AS currency,
        TO_JSON_STRING(ANY_VALUE(labels)) AS labels_json
      FROM ${fqtn}
      WHERE DATE(_PARTITIONTIME) BETWEEN DATE('${from}') AND DATE('${today}')
        AND DATE(usage_start_time) BETWEEN DATE('${from}') AND DATE('${today}')
      GROUP BY usage_date, service, sku_id, sku_description, project_id, location
    `;

    const { rows, bytesBilled } = await runBQ(token, sql);

    const usdBrl = USD_BRL_FALLBACK;
    const gcsRows: any[] = [];
    const aiRows: any[] = [];

    for (const r of rows) {
      const cost_usd = Number(r.cost_usd ?? 0);
      const credits_usd = Number(r.credits_usd ?? 0);
      const net_usd = cost_usd + credits_usd; // credits are negative
      const cost_brl = net_usd * usdBrl;
      const service = String(r.service ?? '');
      let labels: Record<string, unknown> = {};
      try { labels = r.labels_json ? JSON.parse(r.labels_json) : {}; } catch { /* noop */ }

      const isAI = /Vertex AI|Generative Language|Gemini/i.test(service);

      if (isAI) {
        aiRows.push({
          period_month: String(r.usage_date).slice(0, 7) + '-01',
          category: 'ai_infrastructure',
          provider: 'gcp',
          service,
          sku: r.sku_description,
          amount_brl: cost_brl,
          amount_usd: net_usd,
          allocation_strategy: 'gcp_billing_export',
          attribution_confidence: 'high',
          metadata: { project_id: r.project_id, location: r.location, sku_id: r.sku_id, labels, usage_date: r.usage_date },
        });
      } else {
        gcsRows.push({
          usage_date: r.usage_date,
          service,
          sku_id: r.sku_id,
          sku_description: r.sku_description,
          project_id: r.project_id,
          location: r.location,
          usage_amount: Number(r.usage_amount ?? 0),
          usage_unit: r.usage_unit,
          cost_usd: net_usd,
          cost_brl,
          currency: r.currency ?? 'USD',
          usd_brl_rate: usdBrl,
          credits_usd,
          labels,
          raw: r,
        });
      }
    }

    let upserted = 0;
    // Chunked upsert (Supabase limit ~1000/req)
    const chunk = <T,>(arr: T[], n: number) =>
      Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

    for (const batch of chunk(gcsRows, 500)) {
      const { error } = await sb
        .from('gcp_billing_daily')
        .upsert(batch, { onConflict: 'usage_date,service,sku_id,project_id,location' });
      if (error) throw new Error(`upsert_gcp_failed: ${error.message}`);
      upserted += batch.length;
    }

    // platform_cost_allocations is best-effort (may not exist with this schema in every env)
    if (aiRows.length) {
      try {
        for (const batch of chunk(aiRows, 500)) {
          await sb.from('platform_cost_allocations').insert(batch);
        }
      } catch (e) {
        console.warn('[gcs-billing-sync] platform_cost_allocations insert skipped:', e);
      }
    }

    await finish({
      status: 'success',
      rows_upserted: upserted,
      date_from: from,
      date_to: today,
      bq_bytes_billed: bytesBilled,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        mode,
        date_from: from,
        date_to: today,
        gcs_rows: gcsRows.length,
        ai_rows: aiRows.length,
        bq_bytes_billed: bytesBilled,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[gcs-billing-sync] error', msg);
    await finish({ status: 'error', error: msg });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// v2026-06-16.1 — Centro de Controle de Créditos do Master
// Actions:
//   POST { action: 'recharge', ... }
//   POST { action: 'reverse', ... }
//   POST { action: 'set-user-override', ... }
//   POST { action: 'clear-user-override', ... }
//   POST { action: 'set-tenant-base', ... }
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function currentCycleRef(): string {
  // Primeiro dia do mês corrente (YYYY-MM-01) — bate com `cycle_reference` do CRM
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---- Auth ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No authorization header' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // Master gate
    const { data: masterUser } = await supabase
      .from('master_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!masterUser) return json({ error: 'Access denied — not a master user' }, 403);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);
    const action = (body as { action?: string }).action;

    console.log('[master-credits-admin]', action, 'by', user.id);

    // ============================================================
    // RECHARGE — insere crédito extra no ledger (user ou tenant)
    // ============================================================
    if (action === 'recharge') {
      const {
        tenant_id, user_id, credits, reason,
        scope = 'user', // 'user' | 'tenant'
        payment_method, amount_brl,
        idempotency_key, valid_until,
      } = body as Record<string, unknown>;

      if (!isUuid(tenant_id)) return json({ error: 'tenant_id inválido' }, 400);
      if (!isUuid(idempotency_key)) return json({ error: 'idempotency_key obrigatório (uuid)' }, 400);
      const amount = Number(credits);
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'credits deve ser > 0' }, 400);
      if (typeof reason !== 'string' || reason.trim().length < 3) {
        return json({ error: 'reason obrigatório (mín. 3 chars)' }, 400);
      }

      // Quando scope='tenant', resolve admin do tenant; quando 'user', exige user_id
      let targetUserId: string | null = null;
      if (scope === 'user') {
        if (!isUuid(user_id)) return json({ error: 'user_id inválido' }, 400);
        targetUserId = user_id as string;
      } else if (scope === 'tenant') {
        const { data: admin } = await supabase
          .from('profiles')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('role', 'admin')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!admin?.id) return json({ error: 'Tenant sem admin para receber recarga' }, 400);
        targetUserId = admin.id;
      } else {
        return json({ error: 'scope inválido (use user|tenant)' }, 400);
      }

      const entryType = scope === 'tenant' ? 'tenant_recharge' : 'user_recharge';
      const cycle = currentCycleRef();

      const { data: inserted, error: insertError } = await supabase
        .from('credit_ledger')
        .insert({
          tenant_id: tenant_id as string,
          user_id: targetUserId,
          credits_delta: amount,
          entry_type: entryType,
          source_type: 'master_admin',
          classification: 'extra',
          cycle_reference: cycle,
          idempotency_key: idempotency_key as string,
          created_by: user.id,
          metadata: {
            reason,
            payment_method: payment_method ?? null,
            amount_brl: amount_brl ?? null,
            valid_until: valid_until ?? null,
            scope,
            actor: user.id,
            actor_master_user_id: masterUser.id,
          },
        })
        .select('*')
        .single();

      if (insertError) {
        // Conflito de idempotency → 200 com flag (cliente entende como sucesso já aplicado)
        if (insertError.code === '23505') {
          const { data: existing } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('idempotency_key', idempotency_key as string)
            .maybeSingle();
          return json({ success: true, idempotent: true, ledger: existing });
        }
        console.error('[master-credits-admin] recharge insert error:', insertError);
        return json({ error: insertError.message }, 500);
      }

      return json({ success: true, ledger: inserted });
    }

    // ============================================================
    // REVERSE — estorno de uma recarga (cria entry negativa)
    // ============================================================
    if (action === 'reverse') {
      const { source_ledger_id, reason, idempotency_key } = body as Record<string, unknown>;
      if (!isUuid(source_ledger_id)) return json({ error: 'source_ledger_id inválido' }, 400);
      if (!isUuid(idempotency_key)) return json({ error: 'idempotency_key obrigatório' }, 400);
      if (typeof reason !== 'string' || reason.trim().length < 3) {
        return json({ error: 'reason obrigatório' }, 400);
      }

      const { data: orig, error: origErr } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('id', source_ledger_id as string)
        .maybeSingle();
      if (origErr || !orig) return json({ error: 'Lançamento original não encontrado' }, 404);

      const { data: reversed, error: revErr } = await supabase
        .from('credit_ledger')
        .insert({
          tenant_id: orig.tenant_id,
          user_id: orig.user_id,
          credits_delta: -Math.abs(Number(orig.credits_delta)),
          entry_type: 'admin_reversal',
          source_type: 'master_admin',
          classification: 'reversal',
          cycle_reference: orig.cycle_reference,
          idempotency_key: idempotency_key as string,
          source_id: orig.id,
          created_by: user.id,
          metadata: { reason, actor: user.id, reversed_entry_type: orig.entry_type },
        })
        .select('*')
        .single();

      if (revErr) {
        if (revErr.code === '23505') return json({ success: true, idempotent: true });
        console.error('[master-credits-admin] reverse error:', revErr);
        return json({ error: revErr.message }, 500);
      }
      return json({ success: true, ledger: reversed });
    }

    // ============================================================
    // SET-USER-OVERRIDE — define base mensal do usuário (override)
    // ============================================================
    if (action === 'set-user-override') {
      const { tenant_id, user_id, monthly_credits_base, notes, effective_from } = body as Record<string, unknown>;
      if (!isUuid(tenant_id)) return json({ error: 'tenant_id inválido' }, 400);
      if (!isUuid(user_id)) return json({ error: 'user_id inválido' }, 400);
      const base = Number(monthly_credits_base);
      if (!Number.isFinite(base) || base < 0) return json({ error: 'monthly_credits_base inválido' }, 400);

      // Expira override anterior ativo
      const nowIso = new Date().toISOString();
      await supabase
        .from('user_credit_settings')
        .update({ effective_to: nowIso })
        .eq('tenant_id', tenant_id as string)
        .eq('user_id', user_id as string)
        .is('effective_to', null);

      const { data: inserted, error: insErr } = await supabase
        .from('user_credit_settings')
        .insert({
          tenant_id: tenant_id as string,
          user_id: user_id as string,
          monthly_credits_base: base,
          notes: typeof notes === 'string' ? notes : null,
          effective_from: typeof effective_from === 'string' ? effective_from : nowIso,
          origin: 'master_manual',
          created_by: user.id,
          metadata: { actor: user.id },
        })
        .select('*')
        .single();

      if (insErr) {
        console.error('[master-credits-admin] override error:', insErr);
        return json({ error: insErr.message }, 500);
      }
      return json({ success: true, override: inserted });
    }

    // ============================================================
    // CLEAR-USER-OVERRIDE — encerra override ativo
    // ============================================================
    if (action === 'clear-user-override') {
      const { tenant_id, user_id } = body as Record<string, unknown>;
      if (!isUuid(tenant_id) || !isUuid(user_id)) return json({ error: 'ids inválidos' }, 400);

      const { error: updErr } = await supabase
        .from('user_credit_settings')
        .update({ effective_to: new Date().toISOString() })
        .eq('tenant_id', tenant_id as string)
        .eq('user_id', user_id as string)
        .is('effective_to', null);

      if (updErr) return json({ error: updErr.message }, 500);
      return json({ success: true });
    }

    // ============================================================
    // SET-TENANT-BASE — credits_per_user do tenant
    // ============================================================
    if (action === 'set-tenant-base') {
      const { tenant_id, credits_per_user } = body as Record<string, unknown>;
      if (!isUuid(tenant_id)) return json({ error: 'tenant_id inválido' }, 400);
      const base = Number(credits_per_user);
      if (!Number.isFinite(base) || base < 0) return json({ error: 'credits_per_user inválido' }, 400);

      const { data: updated, error: updErr } = await supabase
        .from('tenant_features')
        .update({
          credits_per_user: base,
          limit_ai_tokens_monthly: base, // espelho p/ compat
        })
        .eq('tenant_id', tenant_id as string)
        .select('tenant_id, credits_per_user, limit_ai_tokens_monthly')
        .single();

      if (updErr) {
        console.error('[master-credits-admin] set-tenant-base error:', updErr);
        return json({ error: updErr.message }, 500);
      }
      return json({ success: true, features: updated });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (e) {
    console.error('[master-credits-admin] exception:', e);
    return json({ error: (e as Error).message }, 500);
  }
});

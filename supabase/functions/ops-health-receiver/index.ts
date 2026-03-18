import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateWebhookSignature } from '../_shared/webhookSignature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-action, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AlertCondition {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  check: (data: Record<string, unknown>) => { triggered: boolean; metadata: Record<string, unknown> };
}

const ALERT_CONDITIONS: AlertCondition[] = [
  {
    type: 'queue_overload',
    severity: 'critical',
    title: 'Fila de eventos sobrecarregada',
    description: 'A fila de eventos ultrapassou o limite seguro de operação',
    check: (data) => {
      const eq = data.event_queue as Record<string, number> | undefined;
      const mq = data.message_queue as Record<string, number> | undefined;
      const eqPending = eq?.pending ?? 0;
      const mqPending = mq?.pending ?? 0;
      return {
        triggered: eqPending > 200 || mqPending > 50,
        metadata: { event_queue_pending: eqPending, message_queue_pending: mqPending },
      };
    },
  },
  {
    type: 'ai_leak',
    severity: 'critical',
    title: 'Vazamento de prompt detectado',
    description: 'O sistema detectou vazamento de instruções internas na resposta da IA',
    check: (data) => {
      const ai = data.ai_performance as Record<string, number> | undefined;
      const leakCount = ai?.leak_count ?? 0;
      return {
        triggered: leakCount > 0,
        metadata: { leak_count: leakCount },
      };
    },
  },
  {
    type: 'channel_down',
    severity: 'warning',
    title: 'Canal de comunicação desconectado',
    description: 'Um ou mais canais de comunicação estão offline',
    check: (data) => {
      const channels = data.channels as Record<string, unknown[]> | undefined;
      const whatsapp = channels?.whatsapp as Array<{ is_active?: boolean; connection_status?: string }> ?? [];
      const disconnected = whatsapp.filter(w => w.is_active && w.connection_status !== 'connected');
      return {
        triggered: disconnected.length > 0,
        metadata: { disconnected_count: disconnected.length },
      };
    },
  },
  {
    type: 'cron_failure',
    severity: 'warning',
    title: 'Cron job com falha',
    description: 'Um job agendado não executou no intervalo esperado',
    check: (data) => {
      const cron = data.cron_health as { jobs?: Array<{ name: string; consecutive_failures?: number }> } | undefined;
      const failedJobs = (cron?.jobs ?? []).filter(j => (j.consecutive_failures ?? 0) >= 2);
      return {
        triggered: failedJobs.length > 0,
        metadata: { failed_jobs: failedJobs.map(j => j.name) },
      };
    },
  },
  {
    type: 'security_alert',
    severity: 'critical',
    title: 'Alerta de segurança de alta severidade',
    description: 'O CRM reportou um alerta de segurança de severidade alta',
    check: (data) => {
      const sec = data.security as Record<string, number> | undefined;
      const highCount = sec?.high_severity_count ?? 0;
      return {
        triggered: highCount > 0,
        metadata: { high_severity_count: highCount },
      };
    },
  },
  {
    type: 'user_inconsistency',
    severity: 'info',
    title: 'Inconsistência de usuários detectada',
    description: 'Existem perfis sem role ou sem registros de uso',
    check: (data) => {
      const uc = data.user_consistency as Record<string, number> | undefined;
      const noRole = uc?.profiles_without_role ?? 0;
      const noUsage = uc?.users_without_usage ?? 0;
      return {
        triggered: noRole > 0 || noUsage > 0,
        metadata: { profiles_without_role: noRole, users_without_usage: noUsage },
      };
    },
  },
  {
    type: 'trial_expiring',
    severity: 'warning',
    title: 'Trials expirando em breve',
    description: 'Tenants com trial prestes a expirar sem conversão',
    check: (data) => {
      const billing = data.billing as Record<string, number> | undefined;
      const expiring = billing?.trials_expiring ?? 0;
      return {
        triggered: expiring > 0,
        metadata: { trials_expiring: expiring },
      };
    },
  },
  {
    type: 'limit_reached',
    severity: 'warning',
    title: 'Limite de uso atingido',
    description: 'Um ou mais tenants estão próximos do limite de uso',
    check: (data) => {
      const billing = data.billing as Record<string, number> | undefined;
      const nearLimit = billing?.tenants_near_limit ?? 0;
      return {
        triggered: nearLimit > 0,
        metadata: { tenants_near_limit: nearLimit },
      };
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const secret = Deno.env.get('MASTER_WEBHOOK_SECRET');

    if (!secret) {
      console.error('[OPS-HEALTH-RECEIVER] MASTER_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bodyText = await req.text();

    if (!signature || !validateWebhookSignature(secret, bodyText, signature)) {
      console.warn('[OPS-HEALTH-RECEIVER] Invalid signature');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(bodyText);
    const snapshotData = payload.data || payload;
    const tenantId = snapshotData.tenant_id || null;
    const snapshotType = tenantId ? 'tenant' : 'global';

    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert snapshot
    const { error: snapError } = await supabase
      .from('ops_health_snapshots')
      .insert({
        tenant_id: tenantId,
        snapshot_type: snapshotType,
        snapshot_data: snapshotData,
      });

    if (snapError) {
      console.error('[OPS-HEALTH-RECEIVER] Insert snapshot error:', snapError);
    }

    // 2. Aggregate into hourly history
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    const { data: existing } = await supabase
      .from('ops_health_history')
      .select('id, metrics')
      .eq('hour', currentHour.toISOString())
      .is('tenant_id', tenantId || null)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('ops_health_history')
        .update({ metrics: snapshotData })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('ops_health_history')
        .insert({
          tenant_id: tenantId,
          hour: currentHour.toISOString(),
          metrics: snapshotData,
        });
    }

    // 3. Run alert detection
    const alertsToCreate: Array<{
      alert_type: string;
      severity: string;
      title: string;
      description: string;
      metadata: Record<string, unknown>;
      tenant_id: string | null;
    }> = [];

    for (const condition of ALERT_CONDITIONS) {
      const { triggered, metadata } = condition.check(snapshotData);

      if (triggered) {
        // Check if there's already an active alert of this type
        const { data: existingAlert } = await supabase
          .from('master_alerts')
          .select('id')
          .eq('alert_type', condition.type)
          .eq('is_resolved', false)
          .maybeSingle();

        if (!existingAlert) {
          alertsToCreate.push({
            alert_type: condition.type,
            severity: condition.severity,
            title: condition.title,
            description: condition.description,
            metadata,
            tenant_id: tenantId,
          });
        }
      } else {
        // Auto-resolve if condition normalized
        await supabase
          .from('master_alerts')
          .update({ is_resolved: true, resolved_at: new Date().toISOString() })
          .eq('alert_type', condition.type)
          .eq('is_resolved', false);
      }
    }

    if (alertsToCreate.length > 0) {
      const { error: alertError } = await supabase
        .from('master_alerts')
        .insert(alertsToCreate);

      if (alertError) {
        console.error('[OPS-HEALTH-RECEIVER] Insert alerts error:', alertError);
      }
    }

    console.log('[OPS-HEALTH-RECEIVER] Processed snapshot', {
      type: snapshotType,
      alerts_created: alertsToCreate.length,
    });

    return new Response(JSON.stringify({
      success: true,
      alerts_created: alertsToCreate.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[OPS-HEALTH-RECEIVER] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

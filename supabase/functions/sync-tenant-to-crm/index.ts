import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTenantProvisionWebhook } from "../_shared/webhookSignature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Remote CRM Supabase (where tenants operate)
const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL') || '';
const REMOTE_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY') || '';

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-TENANT-TO-CRM] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Local Master Supabase client
  const masterSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  // Remote CRM Supabase client with Service Role (write access)
  const crmSupabase = createClient(
    REMOTE_SUPABASE_URL,
    REMOTE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await masterSupabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    // Check master user access
    const { data: masterUser } = await masterSupabase
      .from('master_users')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('is_active', true)
      .single();

    if (!masterUser) throw new Error('Access denied: not a master user');

    const body = await req.json();
    const { action, tenant_id, data } = body;

    logStep('Request received', { action, tenant_id });

    if (!action || !tenant_id) {
      throw new Error('Missing action or tenant_id');
    }

    // Get tenant from Master
    const { data: masterTenant, error: tenantError } = await masterSupabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !masterTenant) {
      throw new Error('Tenant not found in Master');
    }

    logStep('Master tenant found', { name: masterTenant.name, subdomain: masterTenant.subdomain });

    let crmTenantId: string | null = null;
    let apiUrl: string | null = null;

    if (action === 'create' || action === 'sync') {
      // Check if tenant already exists in CRM by subdomain
      const { data: existingTenant } = await crmSupabase
        .from('tenants')
        .select('id')
        .eq('subdomain', masterTenant.subdomain)
        .maybeSingle();

      if (existingTenant) {
        logStep('Tenant already exists in CRM, updating', { crmId: existingTenant.id });
        crmTenantId = existingTenant.id;

        // Update existing tenant
        const { error: updateError } = await crmSupabase
          .from('tenants')
          .update({
            name: masterTenant.name,
            contact_email: masterTenant.contact_email,
            document: masterTenant.document,
            plan_type: masterTenant.plan_type,
            plan_id: masterTenant.plan_id,
            is_blocked: masterTenant.is_blocked,
            status: masterTenant.status,
            subscription_status: masterTenant.subscription_status,
            trial_enabled: masterTenant.trial_enabled,
            trial_days: masterTenant.trial_days,
            current_period_end: masterTenant.current_period_end,
            price_per_user: masterTenant.price_per_user,
            contracted_users: masterTenant.contracted_users,
            config: masterTenant.config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTenant.id);

        if (updateError) {
          logStep('CRM tenant update failed', { error: updateError.message });
          throw updateError;
        }
      } else {
        logStep('Creating new tenant in CRM');

        // Create tenant in CRM
        const { data: newCrmTenant, error: createError } = await crmSupabase
          .from('tenants')
          .insert({
            id: masterTenant.id, // FORÇAR MESMO ID DO MASTER
            name: masterTenant.name,
            subdomain: masterTenant.subdomain,
            contact_email: masterTenant.contact_email,
            document: masterTenant.document,
            plan_type: masterTenant.plan_type,
            plan_id: masterTenant.plan_id,
            is_blocked: masterTenant.is_blocked,
            status: masterTenant.status || 'active',
            subscription_status: masterTenant.subscription_status,
            trial_enabled: masterTenant.trial_enabled,
            trial_days: masterTenant.trial_days,
            current_period_end: masterTenant.current_period_end,
            price_per_user: masterTenant.price_per_user,
            contracted_users: masterTenant.contracted_users,
            config: masterTenant.config,
          })
          .select()
          .single();

        if (createError) {
          logStep('CRM tenant creation failed', { error: createError.message });
          throw createError;
        }

        // Usar masterTenant.id para garantir consistência (mesmo ID em ambos sistemas)
        crmTenantId = masterTenant.id;
        logStep('CRM tenant created with Master ID', { crmId: crmTenantId });

        // CRITICAL: Enviar webhook assinado para o CRM (tenant.provision)
        // Este é o protocolo oficial de sincronização Master → CRM
        // Serve como backup caso os triggers do CRM precisem ser executados
        sendTenantProvisionWebhook({
          id: masterTenant.id,
          name: masterTenant.name,
          subdomain: masterTenant.subdomain,
          subdomain_slug: masterTenant.subdomain,
          plan_type: masterTenant.plan_type || 'trial',
          owner_email: masterTenant.contact_email,
        })
          .then(result => {
            if (result.success) {
              logStep('CRM webhook tenant.provision sent successfully');
            } else {
              logStep('CRM webhook tenant.provision failed', { error: result.error });
            }
          })
          .catch(err => {
            logStep('CRM webhook tenant.provision error', { error: err.message });
          });

        // Create related records in CRM
        // 1. tenant_branding
        const { data: masterBranding } = await masterSupabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenant_id)
          .maybeSingle();

        if (masterBranding) {
          await crmSupabase
            .from('tenant_branding')
            .upsert({
              tenant_id: masterTenant.id, // Usar ID do Master diretamente
              company_name: masterBranding.company_name,
              primary_color: masterBranding.primary_color,
              logo_url: masterBranding.logo_url,
              logo_white_url: masterBranding.logo_white_url,
              icon_url: masterBranding.icon_url,
              favicon_url: masterBranding.favicon_url,
            }, { onConflict: 'tenant_id' });
          logStep('CRM branding created');
        }

        // 2. tenant_features
        const { data: masterFeatures } = await masterSupabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenant_id)
          .maybeSingle();

        if (masterFeatures) {
          await crmSupabase
            .from('tenant_features')
            .upsert({
              tenant_id: masterTenant.id, // Usar ID do Master diretamente
              module_ai_agent: masterFeatures.module_ai_agent,
              module_ai_transcription: masterFeatures.module_ai_transcription,
              module_automation_flows: masterFeatures.module_automation_flows,
              module_campaigns: masterFeatures.module_campaigns,
              module_ecommerce: masterFeatures.module_ecommerce,
              module_erp_integration: masterFeatures.module_erp_integration,
              module_api_access: masterFeatures.module_api_access,
              module_whitelabel: masterFeatures.module_whitelabel,
              module_multi_whatsapp: masterFeatures.module_multi_whatsapp,
              limit_users: masterFeatures.limit_users,
              limit_leads: masterFeatures.limit_leads,
              limit_products: masterFeatures.limit_products,
              limit_whatsapp_instances: masterFeatures.limit_whatsapp_instances,
              limit_ai_tokens_monthly: masterFeatures.limit_ai_tokens_monthly,
              limit_storage_mb: masterFeatures.limit_storage_mb,
              ai_use_global_config: masterFeatures.ai_use_global_config,
              overrides: masterFeatures.overrides,
            }, { onConflict: 'tenant_id' });
          logStep('CRM features created');
        }

        // 3. ai_agent_config (from master_settings if using global)
        if (masterFeatures?.ai_use_global_config) {
          const { data: globalSettings } = await masterSupabase
            .from('master_settings')
            .select('ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions')
            .eq('key', 'ai_global_engine')
            .maybeSingle();
          
          await crmSupabase
            .from('ai_agent_config')
            .upsert({
              tenant_id: masterTenant.id, // Usar ID do Master diretamente
              is_enabled: true,
              layer_1_model: globalSettings?.ai_layer_1_model || 'gemini-2.0-flash',
              layer_2_model: globalSettings?.ai_layer_2_model || 'gpt-4o-mini',
              layer_3_model: globalSettings?.ai_layer_3_model || 'claude-3-5-sonnet-20241022',
            }, { onConflict: 'tenant_id' });
          logStep('CRM AI config created from global settings', { 
            layer_1: globalSettings?.ai_layer_1_model,
            layer_2: globalSettings?.ai_layer_2_model,
            layer_3: globalSettings?.ai_layer_3_model
          });
        }

        // 4. tenant_usage
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        await crmSupabase
          .from('tenant_usage')
          .upsert({
            tenant_id: masterTenant.id, // Usar ID do Master diretamente
            period_start: periodStart,
            period_end: periodEnd,
            active_users: 0,
            users_count: 0,
            leads_count: 0,
            messages_sent: 0,
            storage_used_mb: 0,
            ai_tokens_used: 0,
            api_calls: 0,
            estimated_cost_brl: 0,
          }, { onConflict: 'tenant_id' });
        logStep('CRM usage record created');
      }

      // Set the API URL to the CRM
      apiUrl = REMOTE_SUPABASE_URL;

      // Update Master with api_url
      await masterSupabase
        .from('tenants')
        .update({ api_url: apiUrl })
        .eq('id', tenant_id);

      logStep('Master tenant updated with api_url', { apiUrl });

      // Update or create sync record
      await masterSupabase
        .from('tenant_crm_sync')
        .upsert({
          master_tenant_id: tenant_id,
          crm_tenant_id: crmTenantId,
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
          sync_error: null,
        }, { onConflict: 'master_tenant_id' });

      logStep('Sync record updated');
    }

    if (action === 'delete') {
      // Get CRM tenant ID from sync record
      const { data: syncRecord } = await masterSupabase
        .from('tenant_crm_sync')
        .select('crm_tenant_id')
        .eq('master_tenant_id', tenant_id)
        .maybeSingle();

      if (syncRecord?.crm_tenant_id) {
        // Soft delete in CRM (set is_blocked = true)
        await crmSupabase
          .from('tenants')
          .update({ is_blocked: true, status: 'deleted' })
          .eq('id', syncRecord.crm_tenant_id);

        logStep('CRM tenant soft deleted');

        // Update sync record
        await masterSupabase
          .from('tenant_crm_sync')
          .update({ sync_status: 'synced', last_synced_at: new Date().toISOString() })
          .eq('master_tenant_id', tenant_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        master_tenant_id: tenant_id,
        crm_tenant_id: crmTenantId,
        api_url: apiUrl,
        action,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logStep('Error', { error: errorMessage });

    // Update sync record with error
    if (req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.tenant_id) {
          await masterSupabase
            .from('tenant_crm_sync')
            .upsert({
              master_tenant_id: body.tenant_id,
              sync_status: 'error',
              sync_error: errorMessage,
            }, { onConflict: 'master_tenant_id' });
        }
      } catch { /* ignore */ }
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

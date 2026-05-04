import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { sendSettingsUpdatedWebhook } from "../_shared/webhookSignature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-SETTINGS] ${step}${detailsStr}`);
};

interface Tenant {
  id: string;
  name: string;
  api_url: string | null;
}

interface AISettings {
  ai_layer_1_model?: string | null;
  ai_layer_2_model?: string | null;
  ai_layer_3_model?: string | null;
  ai_layer_1_instructions?: string | null;
  ai_layer_2_instructions?: string | null;
  ai_layer_3_instructions?: string | null;
}

// Função para notificar tenants sobre mudanças nas settings de IA
async function notifyTenantsAISettingsUpdated(
  supabase: SupabaseClient,
  settings: AISettings
) {
  try {
    // Buscar todos os tenants ativos com api_url configurado
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, api_url')
      .eq('status', 'active')
      .not('api_url', 'is', null);

    if (error) {
      logStep('Error fetching tenants for webhook', { error: error.message });
      return;
    }

    const tenantsList = tenants as Tenant[] | null;

    if (!tenantsList || tenantsList.length === 0) {
      logStep('No tenants with api_url to notify');
      return;
    }

    logStep('Notifying tenants about AI settings update', { count: tenantsList.length });

    // Para cada tenant com endpoint configurado, enviar webhook
    const notifications = tenantsList.map(async (tenant) => {
      try {
        if (!tenant.api_url) return;
        
        const webhookUrl = `${tenant.api_url}/functions/v1/sync-master-settings`;
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Master-Webhook': 'true',
          },
          body: JSON.stringify({
            event_type: 'settings.ai_updated',
            timestamp: new Date().toISOString(),
            data: {
              ai_layer_1_model: settings.ai_layer_1_model,
              ai_layer_2_model: settings.ai_layer_2_model,
              ai_layer_3_model: settings.ai_layer_3_model,
              ai_layer_1_instructions: settings.ai_layer_1_instructions,
              ai_layer_2_instructions: settings.ai_layer_2_instructions,
              ai_layer_3_instructions: settings.ai_layer_3_instructions,
            }
          })
        });

        logStep(`Webhook sent to tenant ${tenant.name}`, { 
          status: response.status,
          ok: response.ok 
        });
      } catch (webhookError) {
        logStep(`Webhook failed for tenant ${tenant.name}`, { 
          error: webhookError instanceof Error ? webhookError.message : 'Unknown error' 
        });
      }
    });

    // Executar webhooks em paralelo, mas não bloquear a resposta
    await Promise.allSettled(notifications);
    
  } catch (err) {
    logStep('Error in notifyTenantsAISettingsUpdated', { 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

serve(async (req) => {
  logStep('Request received', { method: req.method, url: req.url, origin: req.headers.get('origin') });

  if (req.method === 'OPTIONS') {
    logStep('CORS preflight handled');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;
    logStep('User authenticated', { userId });

    const url = new URL(req.url);
    const method = req.method;
    const category = url.searchParams.get('category');

    logStep(`${method} request`, { category });

    // GET /master-settings - Get all settings
    if (method === 'GET') {
      let query = supabaseAdmin
        .from('master_settings')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data: settings, error } = await query.order('category').order('key');

      if (error) throw error;

      // Transform to key-value object grouped by category
      const grouped: Record<string, Record<string, unknown>> = {};
      for (const setting of settings || []) {
        if (!grouped[setting.category]) {
          grouped[setting.category] = {};
        }
        grouped[setting.category][setting.key] = setting.value;
      }

      return new Response(
        JSON.stringify({ data: grouped, raw: settings }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-settings - Actions (sync-to-crm, etc)
    if (method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'sync-to-crm') {
        logStep('Starting sync-to-crm action');
        
        // 1. Get local AI settings
        const { data: localSettings, error: fetchError } = await supabaseAdmin
          .from('master_settings')
          .select('*')
          .eq('key', 'ai_global_engine')
          .single();
        
        if (fetchError || !localSettings) {
          logStep('Failed to fetch local AI settings', { error: fetchError?.message });
          return new Response(
            JSON.stringify({ success: false, error: 'AI settings not found locally' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        logStep('Local AI settings fetched', {
          hasLayer1: !!localSettings.ai_layer_1_model,
          hasLayer2: !!localSettings.ai_layer_2_model,
          hasLayer3: !!localSettings.ai_layer_3_model,
        });
        
        // 2. Connect to CRM (external Supabase)
        const crmUrl = Deno.env.get('REMOTE_SUPABASE_URL');
        const crmKey = Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY');
        
        if (!crmUrl || !crmKey) {
          logStep('CRM credentials not configured');
          return new Response(
            JSON.stringify({ success: false, error: 'CRM credentials not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const crmSupabase = createClient(crmUrl, crmKey, {
          auth: { persistSession: false }
        });
        
        // 3. Upsert to CRM with Master Tenant ID
        const MASTER_TENANT_ID = '00000000-0000-0000-0000-000000000001';
        
        const upsertData = {
          key: 'ai_global_engine',
          tenant_id: MASTER_TENANT_ID,
          category: 'ai',
          value: {},
          ai_layer_1_model: localSettings.ai_layer_1_model || null,
          ai_layer_1_instructions: localSettings.ai_layer_1_instructions || null,
          ai_layer_2_model: localSettings.ai_layer_2_model || null,
          ai_layer_2_instructions: localSettings.ai_layer_2_instructions || null,
          ai_layer_3_model: localSettings.ai_layer_3_model || null,
          ai_layer_3_instructions: localSettings.ai_layer_3_instructions || null,
          ai_layer_1_cost: localSettings.ai_layer_1_cost || 0,
          ai_layer_2_cost: localSettings.ai_layer_2_cost || 0,
          ai_layer_3_cost: localSettings.ai_layer_3_cost || 0,
          updated_at: new Date().toISOString(),
        };
        
        logStep('Upserting to CRM', { 
          tenantId: MASTER_TENANT_ID,
          l1InstructionsLength: upsertData.ai_layer_1_instructions?.length || 0,
          l2InstructionsLength: upsertData.ai_layer_2_instructions?.length || 0,
          l3InstructionsLength: upsertData.ai_layer_3_instructions?.length || 0,
        });
        
        const { data: crmResult, error: crmError } = await crmSupabase
          .from('master_settings')
          .upsert(upsertData, { onConflict: 'key,tenant_id' })
          .select()
          .single();
        
        if (crmError) {
          logStep('CRM upsert failed', { error: crmError.message, code: crmError.code });
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `CRM sync failed: ${crmError.message}`,
              details: crmError
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        logStep('CRM sync successful', { crmRecordId: crmResult?.id });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'AI settings synchronized to CRM',
            data: {
              layers_synced: 3,
              crm_record_id: crmResult?.id,
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Unknown POST action
      return new Response(
        JSON.stringify({ error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /master-settings - Update settings (bulk)
    if (method === 'PUT') {
      const body = await req.json();
      
      // Body should be { key: value, key2: value2 }
      const updates = Object.entries(body);
      
      for (const [key, value] of updates) {
        const { error } = await supabaseAdmin
          .from('master_settings')
          .update({ 
            value: value as unknown,
            updated_at: new Date().toISOString(),
            updated_by: userId,
          })
          .eq('key', key);

        if (error) {
          logStep('Update failed for key', { key, error: error.message });
        }
      }

      logStep('Settings updated', { count: updates.length });

      return new Response(
        JSON.stringify({ success: true, updated: updates.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-settings - Update single setting (AI Engine uses this)
    if (method === 'PATCH') {
      const body = await req.json();
      logStep('PATCH body received', { 
        key: body.key,
        hasLayer1Model: !!body.ai_layer_1_model,
        hasLayer2Model: !!body.ai_layer_2_model,
        hasLayer3Model: !!body.ai_layer_3_model,
      });
      
      const { key, value, ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions } = body;

      if (!key) {
        logStep('Key missing in PATCH request');
        return new Response(
          JSON.stringify({ error: 'Key is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para AI Engine settings, usar as colunas separadas (não o JSONB 'value')
      // A tabela master_settings tem colunas: ai_layer_X_model, ai_layer_X_instructions
      
      if (key === 'ai_global_engine') {
        // Usar colunas separadas para AI settings
        const updateData = {
          ai_layer_1_model: ai_layer_1_model || null,
          ai_layer_2_model: ai_layer_2_model || null,
          ai_layer_3_model: ai_layer_3_model || null,
          ai_layer_1_instructions: ai_layer_1_instructions || null,
          ai_layer_2_instructions: ai_layer_2_instructions || null,
          ai_layer_3_instructions: ai_layer_3_instructions || null,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        };

        logStep('Updating AI Engine settings', { key });

        const { data, error } = await supabaseAdmin
          .from('master_settings')
          .update(updateData)
          .eq('key', key)
          .select()
          .single();

        if (error) {
          logStep('Update failed', { error: error.message, code: error.code, details: error.details });
          throw error;
        }

        logStep('AI Engine settings updated', { key });

        // Notificar os tenants sobre a mudança (webhook individual para cada tenant)
        const aiSettings: AISettings = {
          ai_layer_1_model,
          ai_layer_2_model,
          ai_layer_3_model,
          ai_layer_1_instructions,
          ai_layer_2_instructions,
          ai_layer_3_instructions,
        };
        
        notifyTenantsAISettingsUpdated(supabaseAdmin, aiSettings);

        // CRITICAL: Enviar webhook assinado para o CRM (master-core/webhooks)
        // Este é o protocolo oficial de sincronização Master → CRM
        sendSettingsUpdatedWebhook(aiSettings)
          .then(result => {
            if (result.success) {
              logStep('CRM webhook settings.updated sent successfully');
            } else {
              logStep('CRM webhook settings.updated failed', { error: result.error });
            }
          })
          .catch(err => {
            logStep('CRM webhook settings.updated error', { error: err.message });
          });

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para outras settings, usar o campo JSONB 'value'
      const updateData = {
        value: value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      // Atualizar registro existente para outras settings
      const { data, error } = await supabaseAdmin
        .from('master_settings')
        .update(updateData)
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      logStep('Setting updated', { key });

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

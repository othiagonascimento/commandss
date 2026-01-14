import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // PATCH /master-settings - Update single setting
    if (method === 'PATCH') {
      const body = await req.json();
      const { key, value, ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions } = body;

      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Key is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Construir objeto de atualização
      const updateData: Record<string, unknown> = {
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      // Adicionar campos de AI se fornecidos
      if (ai_layer_1_model !== undefined) updateData.ai_layer_1_model = ai_layer_1_model;
      if (ai_layer_2_model !== undefined) updateData.ai_layer_2_model = ai_layer_2_model;
      if (ai_layer_3_model !== undefined) updateData.ai_layer_3_model = ai_layer_3_model;
      if (ai_layer_1_instructions !== undefined) updateData.ai_layer_1_instructions = ai_layer_1_instructions;
      if (ai_layer_2_instructions !== undefined) updateData.ai_layer_2_instructions = ai_layer_2_instructions;
      if (ai_layer_3_instructions !== undefined) updateData.ai_layer_3_instructions = ai_layer_3_instructions;

      const { data, error } = await supabaseAdmin
        .from('master_settings')
        .update(updateData)
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      logStep('Setting updated', { key });

      // Se for uma atualização de settings de IA, notificar os tenants
      if (key === 'ai_global_engine') {
        logStep('AI settings updated, notifying tenants...');
        
        // Executar notificação em background (não bloquear resposta)
        const settingsData = data as AISettings;
        notifyTenantsAISettingsUpdated(supabaseAdmin, {
          ai_layer_1_model: settingsData.ai_layer_1_model,
          ai_layer_2_model: settingsData.ai_layer_2_model,
          ai_layer_3_model: settingsData.ai_layer_3_model,
          ai_layer_1_instructions: settingsData.ai_layer_1_instructions,
          ai_layer_2_instructions: settingsData.ai_layer_2_instructions,
          ai_layer_3_instructions: settingsData.ai_layer_3_instructions,
        });
      }

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

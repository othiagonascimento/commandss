import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse parameters
    const url = new URL(req.url);
    const pathSuffix = req.headers.get('x-path-suffix') || '';
    const params = new URLSearchParams(pathSuffix.startsWith('?') ? pathSuffix : '');
    
    const days = params.get('days') || url.searchParams.get('days') || '30';
    const tenantId = params.get('tenant_id') || url.searchParams.get('tenant_id') || '';

    // Build CRM URL
    const remoteUrl = Deno.env.get('REMOTE_SUPABASE_URL');
    const remoteAnonKey = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');

    if (!remoteUrl || !remoteAnonKey) {
      return new Response(JSON.stringify({ error: 'Remote Supabase not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const crmParams = new URLSearchParams({ action: 'ai_advanced', days });
    if (tenantId) crmParams.set('tenant_id', tenantId);

    const crmUrl = `${remoteUrl}/functions/v1/master-core?${crmParams.toString()}`;
    console.log(`[master-ai-advanced] Fetching from CRM: ${crmUrl}`);

    const crmResponse = await fetch(crmUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${remoteAnonKey}`,
        'apikey': remoteAnonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text();
      console.error(`[master-ai-advanced] CRM error: ${crmResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        error: `CRM returned ${crmResponse.status}`,
        details: errorText 
      }), {
        status: crmResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const crmData = await crmResponse.json();
    console.log(`[master-ai-advanced] CRM data received`, {
      hasLayers: !!crmData?.layers,
      hasModels: !!crmData?.models,
      hasProviders: !!crmData?.providers,
      hasTenants: !!crmData?.tenants,
      hasTimeline: !!crmData?.timeline,
      hasSummary: !!crmData?.summary,
    });

    return new Response(JSON.stringify(crmData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-ai-advanced] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

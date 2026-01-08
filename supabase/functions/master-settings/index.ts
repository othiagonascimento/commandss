import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-SETTINGS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      const { key, value } = body;

      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Key is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseAdmin
        .from('master_settings')
        .update({ 
          value,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
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

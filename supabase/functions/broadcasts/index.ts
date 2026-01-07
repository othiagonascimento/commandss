import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BROADCASTS] ${step}${detailsStr}`);
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
    logStep('Function started', { method: req.method });

    const url = new URL(req.url);

    // Public endpoint: get active broadcasts for a tenant
    if (req.method === 'GET' && url.searchParams.get('active')) {
      const tenantId = url.searchParams.get('tenantId');
      const niche = url.searchParams.get('niche');
      const now = new Date().toISOString();

      let query = supabaseAdmin
        .from('broadcasts')
        .select('*')
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`);

      const { data, error } = await query.order('starts_at', { ascending: false });

      if (error) throw error;

      // Filter by tenant or niche
      const filtered = data?.filter(broadcast => {
        // If no target specified, it's for everyone
        if (!broadcast.target_tenant_ids && !broadcast.target_niche) return true;
        
        // Check tenant match
        if (broadcast.target_tenant_ids && tenantId) {
          if (broadcast.target_tenant_ids.includes(tenantId)) return true;
        }
        
        // Check niche match
        if (broadcast.target_niche && niche) {
          if (broadcast.target_niche === niche) return true;
        }

        return false;
      });

      return new Response(JSON.stringify({ broadcasts: filtered }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin endpoints require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;

    // Verify super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single();

    if (!roleData) throw new Error('Only super admins can manage broadcasts');

    // GET: List all broadcasts (admin)
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ broadcasts: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Create, end, or delete broadcasts
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { action } = body;

      if (!action) {
        throw new Error('Missing action. Allowed: create, end, delete');
      }

      if (action === 'create') {
        const {
          title,
          message,
          type = 'info',
          targetTenantIds,
          targetNiche,
          isBanner = true,
          isPush = false,
          startsAt,
          endsAt,
        } = body;

        if (!title || !message) throw new Error('title and message are required');

        const { data, error } = await supabaseAdmin
          .from('broadcasts')
          .insert({
            title,
            message,
            type,
            target_tenant_ids: targetTenantIds || null,
            target_niche: targetNiche || null,
            is_banner: isBanner,
            is_push: isPush,
            starts_at: startsAt || new Date().toISOString(),
            ends_at: endsAt || null,
            created_by: userId,
          })
          .select()
          .single();

        if (error) throw error;

        logStep('Broadcast created', { title, type });

        return new Response(JSON.stringify({ success: true, broadcast: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'end') {
        const { broadcastId } = body;
        if (!broadcastId) throw new Error('broadcastId is required');

        const { error } = await supabaseAdmin
          .from('broadcasts')
          .update({ ends_at: new Date().toISOString() })
          .eq('id', broadcastId);

        if (error) throw error;

        logStep('Broadcast ended', { broadcastId });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        const { broadcastId } = body;
        if (!broadcastId) throw new Error('broadcastId is required');

        const { error } = await supabaseAdmin
          .from('broadcasts')
          .delete()
          .eq('id', broadcastId);

        if (error) throw error;

        logStep('Broadcast deleted', { broadcastId });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unknown action: ${action}. Allowed: create, end, delete`);
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed', allowed: ['GET', 'POST'] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

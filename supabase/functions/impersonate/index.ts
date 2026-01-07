import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[IMPERSONATE] ${step}${detailsStr}`);
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
    logStep('Function started');

    // Verify admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const adminUserId = userData.user.id;
    logStep('Admin authenticated', { adminUserId });

    // Check if user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Only super admins can impersonate');
    }
    logStep('Super admin verified');

    const { action, tenantId, sessionToken } = await req.json();

    if (action === 'create') {
      // Create impersonate session
      if (!tenantId) throw new Error('tenantId is required');

      // Get tenant info
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('id, name, subdomain')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) throw new Error('Tenant not found');

      // Generate secure token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const impersonateToken = Array.from(tokenBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Token expires in 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Save session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('impersonate_sessions')
        .insert({
          admin_user_id: adminUserId,
          target_tenant_id: tenantId,
          token: impersonateToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
        })
        .select()
        .single();

      if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);

      // Log audit
      await supabaseAdmin.rpc('log_audit', {
        _user_id: adminUserId,
        _tenant_id: tenantId,
        _action: 'impersonate_started',
        _entity_type: 'tenant',
        _entity_id: tenantId,
        _new_values: { session_id: session.id },
      });

      logStep('Session created', { sessionId: session.id, expiresAt });

      // Generate the URL to access the tenant
      const accessUrl = `https://${tenant.subdomain}.uopa.app?impersonate=${impersonateToken}`;

      return new Response(JSON.stringify({
        success: true,
        token: impersonateToken,
        expiresAt: expiresAt.toISOString(),
        accessUrl,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'validate') {
      // Validate and use impersonate token
      if (!sessionToken) throw new Error('sessionToken is required');

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('impersonate_sessions')
        .select(`
          *,
          tenant:tenants(id, name, subdomain, config)
        `)
        .eq('token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or expired session token');
      }

      // Mark as used
      await supabaseAdmin
        .from('impersonate_sessions')
        .update({ used_at: new Date().toISOString() })
        .eq('id', session.id);

      logStep('Session validated', { sessionId: session.id });

      return new Response(JSON.stringify({
        success: true,
        tenant: session.tenant,
        adminUserId: session.admin_user_id,
        expiresAt: session.expires_at,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
      // Revoke all active sessions for a tenant
      if (!tenantId) throw new Error('tenantId is required');

      const { data, error } = await supabaseAdmin
        .from('impersonate_sessions')
        .update({ expires_at: new Date().toISOString() })
        .eq('target_tenant_id', tenantId)
        .gt('expires_at', new Date().toISOString());

      logStep('Sessions revoked', { tenantId });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use: create, validate, or revoke');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

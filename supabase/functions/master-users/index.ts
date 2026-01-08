import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-USERS] ${step}${detailsStr}`);
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
    const pathParts = url.pathname.split('/').filter(Boolean);
    const tenantId = pathParts[1];
    const targetUserId = pathParts[2];
    const method = req.method;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`${method} request`, { tenantId, targetUserId });

    // GET /master-users/:tenantId - List users of a tenant
    if (method === 'GET' && !targetUserId) {
      // Get profiles for this tenant
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Get user roles for these profiles
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      // Get auth users for email and metadata
      const users = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          const authUser = authData?.user;
          const userRole = roles?.find(r => r.user_id === profile.id);
          
          return {
            id: profile.id,
            email: authUser?.email || '',
            name: profile.full_name || '',
            full_name: profile.full_name || '',
            role: userRole?.role || profile.role || 'user',
            status: 'active',
            is_active: true,
            created_at: profile.created_at,
            last_login: authUser?.last_sign_in_at || null,
          };
        })
      );

      return new Response(
        JSON.stringify({ data: users, total: users.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-users/:tenantId/:userId - Get single user
    if (method === 'GET' && targetUserId) {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      if (!profile) throw new Error('User not found');

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      const authUser = authData?.user;
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();

      const user = {
        id: profile.id,
        email: authUser?.email || '',
        name: profile.full_name || '',
        full_name: profile.full_name || '',
        role: userRole?.role || profile.role || 'user',
        status: 'active',
        is_active: true,
        created_at: profile.created_at,
        last_login: authUser?.last_sign_in_at || null,
      };

      return new Response(
        JSON.stringify(user),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-users/:tenantId - Create user for tenant
    if (method === 'POST') {
      const body = await req.json();

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name || body.name,
        },
      });

      if (authError) throw authError;
      const authUser = authData.user;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.id,
          tenant_id: tenantId,
          full_name: body.full_name || body.name,
          role: body.role || 'seller',
        });

      if (profileError) throw profileError;

      // Create user role
      await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          tenant_id: tenantId,
          role: body.role === 'admin' ? 'admin' : 'viewer',
        });

      logStep('User created', { newUserId: authUser.id, tenantId });

      return new Response(
        JSON.stringify({
          id: authUser.id,
          email: authUser.email,
          name: body.full_name || body.name,
          full_name: body.full_name || body.name,
          role: body.role || 'user',
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: null,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-users/:tenantId/:userId - Update user
    if (method === 'PATCH' && targetUserId) {
      const body = await req.json();

      // Update profile
      if (body.full_name || body.name || body.role) {
        const updateData: Record<string, unknown> = {};
        if (body.full_name || body.name) updateData.full_name = body.full_name || body.name;
        if (body.role) updateData.role = body.role;

        await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', targetUserId)
          .eq('tenant_id', tenantId);
      }

      // Update user role if changed
      if (body.role) {
        const roleValue = body.role === 'admin' ? 'admin' : 'viewer';
        
        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('tenant_id', tenantId)
          .single();

        if (existingRole) {
          await supabaseAdmin
            .from('user_roles')
            .update({ role: roleValue })
            .eq('user_id', targetUserId)
            .eq('tenant_id', tenantId);
        } else {
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: targetUserId,
              tenant_id: tenantId,
              role: roleValue,
            });
        }
      }

      logStep('User updated', { targetUserId, tenantId });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-users/:tenantId/:userId - Deactivate user
    if (method === 'DELETE' && targetUserId) {
      // Ban the user in auth
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876000h', // ~100 years
      });

      logStep('User deactivated', { targetUserId, tenantId });

      return new Response(
        JSON.stringify({ success: true, message: 'User deactivated' }),
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

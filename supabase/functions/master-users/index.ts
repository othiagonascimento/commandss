import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-USERS] ${step}${detailsStr}`);
};

// Valid app_role enum values
const VALID_ROLES = ['admin', 'manager', 'viewer'] as const;
type AppRole = typeof VALID_ROLES[number];

function mapToValidRole(role: string | undefined): AppRole {
  if (role && VALID_ROLES.includes(role as AppRole)) {
    return role as AppRole;
  }
  // Map legacy roles
  if (role === 'user' || role === 'seller') return 'viewer';
  if (role === 'super_admin') return 'admin';
  return 'viewer';
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
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Support both URL path and x-path-suffix header
    const pathSuffix = req.headers.get('x-path-suffix');
    let tenantId: string | undefined;
    let targetUserId: string | undefined;
    
    if (pathSuffix) {
      const suffixParts = pathSuffix.split('/').filter(Boolean);
      tenantId = suffixParts[0];
      targetUserId = suffixParts[1];
    } else {
      tenantId = pathParts[1];
      targetUserId = pathParts[2];
    }
    const method = req.method;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`${method} request`, { tenantId, targetUserId, pathSuffix });

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
          
          // Check if user is banned by looking at user_metadata or ban_duration
          const isBanned = authUser?.user_metadata?.banned === true || 
                          (authUser as unknown as { banned_at?: string })?.banned_at != null;
          
          return {
            id: profile.id,
            email: authUser?.email || '',
            name: profile.full_name || '',
            full_name: profile.full_name || '',
            role: userRole?.role || 'viewer',
            status: isBanned ? 'inactive' : 'active',
            is_active: !isBanned,
            created_at: profile.created_at,
            last_login: authUser?.last_sign_in_at || null,
          };
        })
      );

      logStep('Users fetched', { count: users.length });

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

      // Check if user is banned
      const isBanned = authUser?.user_metadata?.banned === true || 
                      (authUser as unknown as { banned_at?: string })?.banned_at != null;

      const user = {
        id: profile.id,
        email: authUser?.email || '',
        name: profile.full_name || '',
        full_name: profile.full_name || '',
        role: userRole?.role || 'viewer',
        status: isBanned ? 'inactive' : 'active',
        is_active: !isBanned,
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
      logStep('Creating user', { email: body.email, role: body.role });

      // Validate required fields
      if (!body.email || !body.password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name || body.name,
        },
      });

      if (authError) {
        logStep('Auth user creation failed', { error: authError.message });
        throw authError;
      }
      const authUser = authData.user;
      logStep('Auth user created', { authUserId: authUser.id });

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.id,
          tenant_id: tenantId,
          full_name: body.full_name || body.name,
          role: null, // Role is stored in user_roles table, not here
        });

      if (profileError) {
        logStep('Profile creation failed', { error: profileError.message });
        // Cleanup: delete auth user if profile fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        throw profileError;
      }
      logStep('Profile created');

      // Create user role with valid enum value
      const appRole = mapToValidRole(body.role);
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          tenant_id: tenantId,
          role: appRole,
        });

      if (roleError) {
        logStep('User role creation failed', { error: roleError.message });
        // Continue anyway, role can be set later
      } else {
        logStep('User role created', { role: appRole });
      }

      return new Response(
        JSON.stringify({
          id: authUser.id,
          email: authUser.email,
          name: body.full_name || body.name,
          full_name: body.full_name || body.name,
          role: appRole,
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
      logStep('Updating user', { targetUserId, updates: Object.keys(body) });

      // Update profile
      if (body.full_name || body.name) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name: body.full_name || body.name })
          .eq('id', targetUserId)
          .eq('tenant_id', tenantId);

        if (profileError) {
          logStep('Profile update failed', { error: profileError.message });
        }
      }

      // Update user role if changed
      if (body.role) {
        const appRole = mapToValidRole(body.role);
        logStep('Updating role', { from: body.role, to: appRole });
        
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
            .update({ role: appRole })
            .eq('user_id', targetUserId)
            .eq('tenant_id', tenantId);
        } else {
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: targetUserId,
              tenant_id: tenantId,
              role: appRole,
            });
        }
      }

      // Update password if provided
      if (body.password) {
        logStep('Updating password for user', { targetUserId });
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { password: body.password }
        );
        
        if (passwordError) {
          logStep('Password update failed', { error: passwordError.message });
          return new Response(
            JSON.stringify({ error: 'Failed to update password: ' + passwordError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        logStep('Password updated successfully');
      }

      logStep('User updated', { targetUserId, tenantId });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-users/:tenantId/:userId - Deactivate user
    if (method === 'DELETE' && targetUserId) {
      logStep('Deactivating user', { targetUserId });
      
      // Ban the user in auth
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876000h', // ~100 years
      });

      if (banError) {
        logStep('User ban failed', { error: banError.message });
        throw banError;
      }

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

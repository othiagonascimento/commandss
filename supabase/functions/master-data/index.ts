import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    // Get the resource type from path suffix
    const pathSuffix = req.headers.get('x-path-suffix') || '';
    const resource = pathSuffix.split('/')[0];
    
    logStep('Resource requested', { resource, pathSuffix });

    let result;

    switch (resource) {
      case 'plans':
        const { data: plans, error: plansError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (plansError) throw plansError;
        result = { data: plans };
        break;

      case 'niche-templates':
        const { data: templates, error: templatesError } = await supabaseAdmin
          .from('niche_templates')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (templatesError) throw templatesError;
        result = { data: templates };
        break;

      case 'master-user':
        // Check if current user is a master user
        const { data: masterUser, error: masterError } = await supabaseAdmin
          .from('master_users')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (masterError) throw masterError;
        result = { data: masterUser, isMasterUser: !!masterUser };
        break;

      // NEW: Consolidated endpoint - returns user + roles + permissions in ONE call
      case 'master-user-full':
        logStep('Fetching consolidated user data');
        
        // Step 1: Get master user
        const { data: fullUser, error: fullUserError } = await supabaseAdmin
          .from('master_users')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (fullUserError) throw fullUserError;
        
        if (!fullUser) {
          result = { data: null, roles: [], permissions: [], isMasterUser: false };
          break;
        }

        // Step 2: Get user's roles
        const { data: fullUserRoles, error: fullUserRolesError } = await supabaseAdmin
          .from('master_user_roles')
          .select('role_id')
          .eq('master_user_id', fullUser.id);

        if (fullUserRolesError) throw fullUserRolesError;

        const fullRoleIds = fullUserRoles?.map(ur => ur.role_id) || [];
        let fullRoles: unknown[] = [];
        let fullPermissions: unknown[] = [];

        if (fullRoleIds.length > 0) {
          // Step 3: Get role details
          const { data: rolesData, error: rolesDataError } = await supabaseAdmin
            .from('master_roles')
            .select('*')
            .in('id', fullRoleIds)
            .eq('is_active', true);

          if (rolesDataError) throw rolesDataError;
          fullRoles = rolesData || [];

          // Step 4: Get permissions for all roles
          const { data: rolePermsData, error: rolePermsDataError } = await supabaseAdmin
            .from('master_role_permissions')
            .select('permission_id')
            .in('role_id', fullRoleIds);

          if (rolePermsDataError) throw rolePermsDataError;

          const fullPermissionIds = [...new Set((rolePermsData || []).map(rp => rp.permission_id))];
          
          if (fullPermissionIds.length > 0) {
            const { data: permsData, error: permsDataError } = await supabaseAdmin
              .from('master_permissions')
              .select('*')
              .in('id', fullPermissionIds);

            if (permsDataError) throw permsDataError;
            fullPermissions = permsData || [];
          }
        }

        logStep('Consolidated data fetched', { 
          userId: fullUser.id, 
          rolesCount: fullRoles.length, 
          permissionsCount: fullPermissions.length 
        });

        result = { 
          data: fullUser, 
          roles: fullRoles, 
          permissions: fullPermissions, 
          isMasterUser: true 
        };
        break;

      case 'master-roles':
        // Get user's master roles
        const masterUserId = pathSuffix.split('/')[1];
        if (!masterUserId) throw new Error('Master user ID required');

        const { data: userRoles, error: userRolesError } = await supabaseAdmin
          .from('master_user_roles')
          .select('role_id')
          .eq('master_user_id', masterUserId);

        if (userRolesError) throw userRolesError;

        const roleIds = userRoles.map(ur => ur.role_id);
        if (roleIds.length === 0) {
          result = { data: [] };
          break;
        }

        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('master_roles')
          .select('*')
          .in('id', roleIds)
          .eq('is_active', true);

        if (rolesError) throw rolesError;
        result = { data: roles };
        break;

      case 'master-permissions':
        // Get permissions for given role IDs (comma-separated in path)
        const roleIdsParam = pathSuffix.split('/')[1];
        if (!roleIdsParam) {
          result = { data: [] };
          break;
        }

        const roleIdList = roleIdsParam.split(',').filter(Boolean);
        if (roleIdList.length === 0) {
          result = { data: [] };
          break;
        }

        const { data: rolePerms, error: rolePermsError } = await supabaseAdmin
          .from('master_role_permissions')
          .select('permission_id')
          .in('role_id', roleIdList);

        if (rolePermsError) throw rolePermsError;

        const permissionIds = [...new Set(rolePerms.map(rp => rp.permission_id))];
        if (permissionIds.length === 0) {
          result = { data: [] };
          break;
        }

        const { data: permissions, error: permsError } = await supabaseAdmin
          .from('master_permissions')
          .select('*')
          .in('id', permissionIds);

        if (permsError) throw permsError;
        result = { data: permissions };
        break;

      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    logStep('Request completed', { resource, count: result.data?.length });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MasterRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

interface MasterPermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

interface MasterUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
}

export function usePermissions() {
  const { user } = useAuth();

  // Fetch current user's master user record via edge function to bypass RLS issues
  const { data: masterUser, isLoading: masterUserLoading } = useQuery({
    queryKey: ['master-user-current', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Try to fetch via edge function first (bypasses RLS)
        const { data: fnData, error: fnError } = await supabase.functions.invoke('master-users', {
          method: 'GET',
          headers: { 'x-path-suffix': `check/${user.id}` }
        });
        
        if (!fnError && fnData?.user) {
          return fnData.user as MasterUser;
        }
        
        // Fallback to direct query (may fail due to RLS)
        const { data, error } = await supabase
          .from('master_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          // If RLS error, log it but don't throw - treat user as non-master user
          console.warn('[usePermissions] RLS error on master_users, treating as non-master user:', error.code);
          return null;
        }
        
        return data as MasterUser | null;
      } catch (err) {
        console.warn('[usePermissions] Error fetching master user:', err);
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on RLS errors
  });

  // Fetch user's roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['master-user-roles', masterUser?.id],
    queryFn: async () => {
      if (!masterUser?.id) return [];
      
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('master_user_roles')
        .select('role_id')
        .eq('master_user_id', masterUser.id);
      
      if (userRolesError) {
        console.error('[usePermissions] Error fetching user roles:', userRolesError);
        return [];
      }

      const roleIds = userRolesData.map(ur => ur.role_id);
      if (roleIds.length === 0) return [];

      const { data: roles, error: rolesError } = await supabase
        .from('master_roles')
        .select('*')
        .in('id', roleIds)
        .eq('is_active', true);

      if (rolesError) {
        console.error('[usePermissions] Error fetching roles:', rolesError);
        return [];
      }

      return roles as MasterRole[];
    },
    enabled: !!masterUser?.id,
  });

  // Fetch permissions for user's roles
  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['master-user-permissions', userRoles.map(r => r.id).join(',')],
    queryFn: async () => {
      if (userRoles.length === 0) return [];

      const roleIds = userRoles.map(r => r.id);

      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('master_role_permissions')
        .select('permission_id')
        .in('role_id', roleIds);

      if (rolePermsError) {
        console.error('[usePermissions] Error fetching role permissions:', rolePermsError);
        return [];
      }

      const permissionIds = [...new Set(rolePerms.map(rp => rp.permission_id))];
      if (permissionIds.length === 0) return [];

      const { data: permissions, error: permsError } = await supabase
        .from('master_permissions')
        .select('*')
        .in('id', permissionIds);

      if (permsError) {
        console.error('[usePermissions] Error fetching permissions:', permsError);
        return [];
      }

      return permissions as MasterPermission[];
    },
    enabled: userRoles.length > 0,
  });

  // Check if user has a specific permission by code
  const hasPermission = (permissionCode: string): boolean => {
    // Super admin has all permissions
    if (userRoles.some(r => r.name === 'super_admin')) {
      return true;
    }
    return userPermissions.some(p => p.code === permissionCode);
  };

  // Check if user has a specific role by name
  const hasRole = (roleName: string): boolean => {
    return userRoles.some(r => r.name === roleName);
  };

  // Check if user is super admin
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (isSuperAdmin()) return true;
    return permissionCodes.some(code => hasPermission(code));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (isSuperAdmin()) return true;
    return permissionCodes.every(code => hasPermission(code));
  };

  // Permission codes for menu items
  const canViewDashboard = () => hasAnyPermission(['dashboard.view', 'analytics.view']);
  const canViewTemplates = () => hasAnyPermission(['templates.view', 'templates.manage']);
  const canViewTenants = () => hasAnyPermission(['tenants.view', 'tenants.manage']);
  const canViewUsers = () => hasAnyPermission(['users.view', 'users.manage']);
  const canViewSubscriptions = () => hasAnyPermission(['subscriptions.view', 'subscriptions.manage']);
  const canViewInviteLinks = () => hasAnyPermission(['invite_links.view', 'invite_links.manage']);
  const canViewBroadcasts = () => hasAnyPermission(['broadcasts.view', 'broadcasts.manage']);
  const canViewMasterUsers = () => hasAnyPermission(['master_users.view', 'master_users.manage']);
  const canViewFeatureFlags = () => hasAnyPermission(['feature_flags.view', 'feature_flags.manage']);
  const canViewSettings = () => hasAnyPermission(['settings.view', 'settings.manage']);

  return {
    masterUser,
    userRoles,
    userPermissions,
    isLoading: masterUserLoading || rolesLoading || permissionsLoading,
    hasPermission,
    hasRole,
    isSuperAdmin,
    hasAnyPermission,
    hasAllPermissions,
    // Menu visibility helpers
    canViewDashboard,
    canViewTemplates,
    canViewTenants,
    canViewUsers,
    canViewSubscriptions,
    canViewInviteLinks,
    canViewBroadcasts,
    canViewMasterUsers,
    canViewFeatureFlags,
    canViewSettings,
  };
}

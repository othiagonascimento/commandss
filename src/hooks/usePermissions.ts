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
        const { data, error } = await supabase.functions.invoke('master-data', {
          headers: { 'x-path-suffix': 'master-user' }
        });
        
        if (error) {
          console.warn('[usePermissions] Error fetching master user:', error);
          return null;
        }
        
        return data?.data as MasterUser | null;
      } catch (err) {
        console.warn('[usePermissions] Error fetching master user:', err);
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Fetch user's roles via edge function
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['master-user-roles', masterUser?.id],
    queryFn: async () => {
      if (!masterUser?.id) return [];
      
      try {
        const { data, error } = await supabase.functions.invoke('master-data', {
          headers: { 'x-path-suffix': `master-roles/${masterUser.id}` }
        });
        
        if (error) {
          console.error('[usePermissions] Error fetching user roles:', error);
          return [];
        }

        return (data?.data || []) as MasterRole[];
      } catch (err) {
        console.error('[usePermissions] Error fetching user roles:', err);
        return [];
      }
    },
    enabled: !!masterUser?.id,
  });

  // Fetch permissions for user's roles via edge function
  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['master-user-permissions', userRoles.map(r => r.id).join(',')],
    queryFn: async () => {
      if (userRoles.length === 0) return [];

      const roleIds = userRoles.map(r => r.id).join(',');

      try {
        const { data, error } = await supabase.functions.invoke('master-data', {
          headers: { 'x-path-suffix': `master-permissions/${roleIds}` }
        });

        if (error) {
          console.error('[usePermissions] Error fetching permissions:', error);
          return [];
        }

        return (data?.data || []) as MasterPermission[];
      } catch (err) {
        console.error('[usePermissions] Error fetching permissions:', err);
        return [];
      }
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

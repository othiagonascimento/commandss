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

interface ConsolidatedUserData {
  data: MasterUser | null;
  roles: MasterRole[];
  permissions: MasterPermission[];
  isMasterUser: boolean;
}

export function usePermissions() {
  const { user } = useAuth();

  const fetchConsolidatedUserDataFallback = async (): Promise<ConsolidatedUserData> => {
    // 1) master-user
    const { data: masterUserResp, error: masterUserErr } = await supabase.functions.invoke('master-data', {
      headers: { 'x-path-suffix': 'master-user' },
    });

    if (masterUserErr) {
      console.warn('[usePermissions] Error fetching master-user:', masterUserErr);
      return { data: null, roles: [], permissions: [], isMasterUser: false };
    }

    const masterUser = (masterUserResp?.data as MasterUser | null) ?? null;
    const isMasterUser = !!masterUserResp?.isMasterUser && !!masterUser;

    if (!masterUser) {
      return { data: null, roles: [], permissions: [], isMasterUser: false };
    }

    // 2) master-roles/<masterUserId>
    const { data: rolesResp, error: rolesErr } = await supabase.functions.invoke('master-data', {
      headers: { 'x-path-suffix': `master-roles/${masterUser.id}` },
    });

    if (rolesErr) {
      console.warn('[usePermissions] Error fetching master-roles:', rolesErr);
      return { data: masterUser, roles: [], permissions: [], isMasterUser };
    }

    const roles = ((rolesResp?.data as MasterRole[]) ?? []).filter(Boolean);

    // 3) master-permissions/<roleIds>
    const roleIds = roles.map((r) => r.id).filter(Boolean);
    if (roleIds.length === 0) {
      return { data: masterUser, roles, permissions: [], isMasterUser };
    }

    const { data: permsResp, error: permsErr } = await supabase.functions.invoke('master-data', {
      headers: { 'x-path-suffix': `master-permissions/${roleIds.join(',')}` },
    });

    if (permsErr) {
      console.warn('[usePermissions] Error fetching master-permissions:', permsErr);
      return { data: masterUser, roles, permissions: [], isMasterUser };
    }

    const permissions = ((permsResp?.data as MasterPermission[]) ?? []).filter(Boolean);

    return { data: masterUser, roles, permissions, isMasterUser };
  };

  // SINGLE consolidated query - eliminates waterfall of 3 sequential queries
  const { data: consolidatedData, isLoading } = useQuery({
    queryKey: ['master-user-full', user?.id],
    queryFn: async (): Promise<ConsolidatedUserData> => {
      if (!user?.id) {
        return { data: null, roles: [], permissions: [], isMasterUser: false };
      }
      
      const { data, error } = await supabase.functions.invoke('master-data', {
        headers: { 'x-path-suffix': 'master-user-full' },
      });

      // Check if response contains error (500 returns error in body, not in error object)
      const responseError = (data as Record<string, unknown>)?.error as string | undefined;
      const errorMsg = (error as { message?: string })?.message || responseError || '';

      // Fallback for older deployed versions without master-user-full
      if (errorMsg.includes('Unknown resource') || responseError) {
        console.log('[usePermissions] master-user-full not available, using fallback');
        return await fetchConsolidatedUserDataFallback();
      }

      if (error) {
        console.warn('[usePermissions] Error fetching consolidated user data:', error);
        return { data: null, roles: [], permissions: [], isMasterUser: false };
      }

      // Success case
      return {
        data: (data?.data as MasterUser | null) ?? null,
        roles: ((data?.roles || []) as MasterRole[]) ?? [],
        permissions: ((data?.permissions || []) as MasterPermission[]) ?? [],
        isMasterUser: !!data?.isMasterUser,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute - prevents refetch on every navigation
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: false,
  });

  const masterUser = consolidatedData?.data || null;
  const userRoles = consolidatedData?.roles || [];
  const userPermissions = consolidatedData?.permissions || [];

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
    isLoading,
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

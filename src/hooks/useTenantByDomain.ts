import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainsApi } from '@/services/masterApi';

interface TenantBranding {
  company_name: string | null;
  logo_url: string | null;
  logo_white_url: string | null;
  symbol_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface TenantByDomain {
  tenant_id: string;
  subdomain: string;
  name: string;
  branding: TenantBranding | null;
  config?: Record<string, unknown>;
}

/**
 * Hook to detect and resolve the current tenant based on the hostname.
 * Used for public-facing sites that need to load tenant-specific branding and data.
 * 
 * @example
 * ```tsx
 * const { tenant, branding, isLoading, error } = useTenantByDomain();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <TenantNotFound />;
 * 
 * return <PublicSite branding={branding} tenant={tenant} />;
 * ```
 */
export function useTenantByDomain() {
  const [hostname, setHostname] = useState<string>('');
  
  useEffect(() => {
    // Get the current hostname
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-by-domain', hostname],
    queryFn: async () => {
      if (!hostname) return null;
      
      // Skip resolution for known non-tenant domains
      const skipDomains = ['localhost', '127.0.0.1', 'lovable.app', 'lovable.dev'];
      if (skipDomains.some(d => hostname.includes(d))) {
        return null;
      }
      
      const result = await domainsApi.resolveTenantByDomain(hostname);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    enabled: !!hostname,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
  
  return {
    tenant: data as TenantByDomain | null,
    branding: data?.branding || null,
    tenantId: data?.tenant_id || null,
    isLoading,
    error: error as Error | null,
    hostname,
    refetch,
  };
}

/**
 * Check if a subdomain is available for use.
 * Used in tenant creation forms.
 * 
 * @example
 * ```tsx
 * const { checkAvailability, isChecking, result } = useSubdomainCheck();
 * 
 * const handleSlugChange = (slug: string) => {
 *   checkAvailability(slug);
 * };
 * ```
 */
export function useSubdomainCheck() {
  const [subdomain, setSubdomain] = useState<string>('');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subdomain-availability', subdomain],
    queryFn: async () => {
      if (!subdomain || subdomain.length < 2) return null;
      
      const result = await domainsApi.checkSubdomainAvailability(subdomain);
      return result.data;
    },
    enabled: subdomain.length >= 2,
    staleTime: 1000 * 30, // Cache for 30 seconds
  });
  
  const checkAvailability = (slug: string) => {
    setSubdomain(slug);
  };
  
  return {
    checkAvailability,
    isChecking: isLoading,
    result: data,
    available: data?.available ?? null,
    suggestion: data?.suggestion,
  };
}

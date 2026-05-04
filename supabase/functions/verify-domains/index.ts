import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface DomainRecord {
  id: string;
  tenant_id: string;
  domain: string;
  status: string;
  verification_token: string | null;
  dns_configured: boolean;
  ssl_provisioned: boolean;
}

interface TenantBranding {
  company_name: string | null;
  logo_url: string | null;
  logo_white_url: string | null;
  symbol_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface ResolveResponse {
  tenant_id: string;
  subdomain: string;
  name: string;
  branding: TenantBranding | null;
  config?: Record<string, unknown>;
}

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[verify-domains] ${step}${detailsStr}`);
}

// Simple DNS verification using DNS-over-HTTPS
async function verifyDNS(domain: string, expectedToken: string): Promise<{ configured: boolean; error?: string }> {
  try {
    logStep("Checking DNS", { domain, expectedToken });
    
    // Check TXT record using Google's DNS-over-HTTPS
    const txtResponse = await fetch(
      `https://dns.google/resolve?name=_lovable.${domain}&type=TXT`,
      { headers: { "Accept": "application/dns-json" } }
    );
    
    if (!txtResponse.ok) {
      return { configured: false, error: "Failed to query DNS" };
    }
    
    const txtData = await txtResponse.json();
    logStep("TXT DNS response", { data: txtData });
    
    // Check if any TXT record contains our verification token
    const txtRecords = txtData.Answer || [];
    const hasVerificationToken = txtRecords.some((record: { data: string }) => {
      const data = record.data?.replace(/"/g, "") || "";
      return data.includes(expectedToken);
    });
    
    if (!hasVerificationToken) {
      return { configured: false, error: "Verification token not found in TXT records" };
    }
    
    // Check A record
    const aResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      { headers: { "Accept": "application/dns-json" } }
    );
    
    if (!aResponse.ok) {
      return { configured: false, error: "Failed to query A record" };
    }
    
    const aData = await aResponse.json();
    logStep("A DNS response", { data: aData });
    
    const aRecords = aData.Answer || [];
    const hasCorrectIP = aRecords.some((record: { data: string }) => 
      record.data === "185.158.133.1"
    );
    
    if (!hasCorrectIP) {
      return { configured: false, error: "A record not pointing to 185.158.133.1" };
    }
    
    return { configured: true };
  } catch (error) {
    logStep("DNS verification error", { error: String(error) });
    return { configured: false, error: String(error) };
  }
}

// Resolve tenant by domain (for public site detection)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveTenantByDomain(
  supabase: any,
  domain: string
): Promise<ResolveResponse | null> {
  logStep("Resolving tenant by domain", { domain });
  
  // First, try to find in tenant_domains (custom domains)
  const { data: domainRecord, error: domainError } = await supabase
    .from("tenant_domains")
    .select("tenant_id, domain, status")
    .eq("domain", domain)
    .eq("status", "verified")
    .single();
  
  let tenantId: string | null = null;
  
  if (domainRecord && !domainError) {
    tenantId = (domainRecord as { tenant_id: string }).tenant_id;
    logStep("Found tenant via custom domain", { tenantId, domain });
  } else {
    // Try to match as subdomain pattern (e.g., "clientex.uopacrm.com")
    const subdomainMatch = domain.match(/^([a-z0-9-]+)\.(uopacrm\.com|app\.uopacrm\.com)$/i);
    
    if (subdomainMatch) {
      const subdomain = subdomainMatch[1];
      logStep("Trying subdomain match", { subdomain });
      
      const { data: tenantBySubdomain, error: subError } = await supabase
        .from("tenants")
        .select("id, subdomain")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single();
      
      if (tenantBySubdomain && !subError) {
        tenantId = (tenantBySubdomain as { id: string }).id;
        logStep("Found tenant via subdomain", { tenantId, subdomain });
      }
    }
  }
  
  if (!tenantId) {
    logStep("No tenant found for domain", { domain });
    return null;
  }
  
  // Fetch tenant details with branding
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, subdomain, config")
    .eq("id", tenantId)
    .eq("is_active", true)
    .single();
  
  if (tenantError || !tenant) {
    logStep("Tenant not found or inactive", { tenantId, error: tenantError?.message });
    return null;
  }
  
  const tenantData = tenant as { id: string; name: string; subdomain: string; config: Record<string, unknown> | null };
  
  // Fetch branding
  const { data: branding } = await supabase
    .from("tenant_branding")
    .select("company_name, logo_url, logo_white_url, symbol_url, favicon_url, primary_color, secondary_color")
    .eq("tenant_id", tenantId)
    .single();
  
  return {
    tenant_id: tenantData.id,
    subdomain: tenantData.subdomain,
    name: tenantData.name,
    branding: branding || null,
    config: tenantData.config || {},
  };
}

// Check subdomain availability
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkSubdomainAvailability(
  supabase: any,
  subdomain: string
): Promise<{ available: boolean; suggestion?: string }> {
  const normalizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
  
  logStep("Checking subdomain availability", { subdomain: normalizedSubdomain });
  
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("subdomain", normalizedSubdomain)
    .single();
  
  const available = !data && error?.code === "PGRST116"; // No rows found
  
  if (!available) {
    // Generate suggestion
    const suggestion = `${normalizedSubdomain}-${Math.floor(Math.random() * 1000)}`;
    return { available: false, suggestion };
  }
  
  return { available: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    
    // ==========================================
    // ACTION: resolve - Resolve tenant by domain
    // ==========================================
    if (action === "resolve") {
      const domain = url.searchParams.get("domain");
      
      if (!domain) {
        return new Response(
          JSON.stringify({ error: "Domain parameter is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const result = await resolveTenantByDomain(supabase, domain);
      
      if (!result) {
        return new Response(
          JSON.stringify({ error: "Tenant not found for this domain" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ==========================================
    // ACTION: check-subdomain - Check availability
    // ==========================================
    if (action === "check-subdomain") {
      const subdomain = url.searchParams.get("subdomain");
      
      if (!subdomain) {
        return new Response(
          JSON.stringify({ error: "Subdomain parameter is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const result = await checkSubdomainAvailability(supabase, subdomain);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ==========================================
    // DEFAULT: Verify domains (original behavior)
    // ==========================================
    const domainId = url.searchParams.get("domain_id");
    logStep("Starting domain verification", { domainId });

    // Get domains to verify
    let query = supabase
      .from("tenant_domains")
      .select("*")
      .in("status", ["pending", "verifying", "failed"]);
    
    if (domainId) {
      query = query.eq("id", domainId);
    }

    const { data: domains, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch domains: ${fetchError.message}`);
    }

    if (!domains || domains.length === 0) {
      logStep("No domains to verify");
      return new Response(
        JSON.stringify({ message: "No domains to verify", verified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Found domains to verify", { count: domains.length });

    const results: { domain: string; status: string; error?: string }[] = [];

    for (const domain of domains as DomainRecord[]) {
      logStep("Verifying domain", { domain: domain.domain });

      if (!domain.verification_token) {
        logStep("No verification token, skipping");
        results.push({ domain: domain.domain, status: "skipped", error: "No verification token" });
        continue;
      }

      const dnsResult = await verifyDNS(domain.domain, domain.verification_token);

      if (dnsResult.configured) {
        // DNS is configured, update status
        const { error: updateError } = await supabase
          .from("tenant_domains")
          .update({
            status: "verified",
            dns_configured: true,
            verified_at: new Date().toISOString(),
            last_check_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", domain.id);

        if (updateError) {
          logStep("Failed to update domain", { error: updateError.message });
          results.push({ domain: domain.domain, status: "error", error: updateError.message });
        } else {
          logStep("Domain verified successfully", { domain: domain.domain });
          results.push({ domain: domain.domain, status: "verified" });
        }
      } else {
        // DNS not configured yet
        const { error: updateError } = await supabase
          .from("tenant_domains")
          .update({
            status: domain.status === "pending" ? "verifying" : domain.status,
            last_check_at: new Date().toISOString(),
            last_error: dnsResult.error,
          })
          .eq("id", domain.id);

        if (updateError) {
          logStep("Failed to update domain", { error: updateError.message });
        }

        results.push({ 
          domain: domain.domain, 
          status: "pending", 
          error: dnsResult.error 
        });
      }
    }

    const verifiedCount = results.filter(r => r.status === "verified").length;
    logStep("Verification complete", { total: domains.length, verified: verifiedCount });

    return new Response(
      JSON.stringify({ 
        message: "Domain verification complete",
        total: domains.length,
        verified: verifiedCount,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error", { error: String(error) });
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
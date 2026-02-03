import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Remote Supabase credentials (where actual tenant data lives)
    const remoteUrl = Deno.env.get('REMOTE_SUPABASE_URL');
    const remoteKey = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');
    const remoteSupabase = remoteUrl && remoteKey 
      ? createClient(remoteUrl, remoteKey)
      : null;

    // Get auth token and verify master user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify master user
    const { data: masterUser, error: masterError } = await supabase
      .from('master_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (masterError || !masterUser) {
      return new Response(JSON.stringify({ error: 'Access denied - not a master user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionIndex = pathParts.indexOf('master-usage');
    // Support both URL path and x-path-suffix header
    const pathSuffix = req.headers.get('x-path-suffix');
    let tenantId: string | undefined;
    let subPath: string | undefined;
    
    if (pathSuffix) {
      const suffixParts = pathSuffix.split('/').filter(Boolean);
      tenantId = suffixParts[0];
      subPath = suffixParts[1];
    } else {
      tenantId = pathParts[functionIndex + 1];
      subPath = pathParts[functionIndex + 2];
    }

    console.log(`[master-usage] ${req.method} tenantId=${tenantId} subPath=${subPath} pathSuffix=${pathSuffix}`);

    // GET /master-usage/zones - Get credit zones summary for all tenants (DASHBOARD)
    if (req.method === 'GET' && tenantId === 'zones') {
      console.log('[master-usage] Fetching credit zones summary...');
      
      // Get current period dates
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // 1. Fetch all active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true);
      
      if (tenantsError) {
        console.error('[master-usage] Error fetching tenants:', tenantsError);
        return new Response(JSON.stringify({ error: tenantsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tenantIds = (tenants || []).map(t => t.id);
      console.log('[master-usage] Found tenants:', tenantIds.length);

      if (tenantIds.length === 0) {
        return new Response(JSON.stringify({ 
          zones: { green: 0, yellow: 0, red: 0 }, 
          degradedTenants: [],
          totalTenants: 0 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Fetch tenant_usage for current period
      const { data: usages } = await supabase
        .from('tenant_usage')
        .select('tenant_id, ai_credits_used, credits_consumed')
        .in('tenant_id', tenantIds)
        .lte('period_start', now.toISOString())
        .gte('period_end', now.toISOString());
      
      console.log('[master-usage] Found usages:', usages?.length || 0);

      // 3. Fetch tenant_features separately
      const { data: features } = await supabase
        .from('tenant_features')
        .select('tenant_id, credits_per_user')
        .in('tenant_id', tenantIds);

      const featuresMap = (features || []).reduce((acc, f) => {
        if (f.tenant_id) acc[f.tenant_id] = f;
        return acc;
      }, {} as Record<string, { credits_per_user: number | null }>);
      
      console.log('[master-usage] Found features:', features?.length || 0);

      // 4. Count users per tenant
      const { data: profiles } = await supabase
        .from('profiles')
        .select('tenant_id')
        .in('tenant_id', tenantIds);

      const usersPerTenant = (profiles || []).reduce((acc, p) => {
        if (p.tenant_id) acc[p.tenant_id] = (acc[p.tenant_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('[master-usage] Users per tenant map entries:', Object.keys(usersPerTenant).length);

      // Create maps for quick lookup
      const tenantsMap = (tenants || []).reduce((acc, t) => {
        acc[t.id] = t;
        return acc;
      }, {} as Record<string, { id: string; name: string }>);

      const usagesMap = (usages || []).reduce((acc, u) => {
        if (u.tenant_id) acc[u.tenant_id] = u;
        return acc;
      }, {} as Record<string, { ai_credits_used: number | null; credits_consumed: number | null }>);

      // 5. Calculate zones
      let green = 0;
      let yellow = 0;
      let red = 0;
      const degradedTenants: Array<{
        tenant_id: string;
        tenant_name: string;
        credits_used: number;
        credits_limit: number;
        usage_percent: number;
        zone: string;
        is_degraded: boolean;
      }> = [];

      tenantIds.forEach((tenantId) => {
        const tenant = tenantsMap[tenantId];
        const usage = usagesMap[tenantId];
        const feature = featuresMap[tenantId];

        const creditsUsed = usage?.ai_credits_used || usage?.credits_consumed || 0;
        const creditsPerUser = feature?.credits_per_user || 500;
        const usersCount = usersPerTenant[tenantId] || 1;
        const creditsLimit = creditsPerUser * Math.max(usersCount, 1);
        const usagePercent = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;

        if (usagePercent <= 100) {
          green++;
        } else if (usagePercent <= 115) {
          yellow++;
        } else {
          red++;
          degradedTenants.push({
            tenant_id: tenantId,
            tenant_name: tenant?.name || 'Sem nome',
            credits_used: creditsUsed,
            credits_limit: creditsLimit,
            usage_percent: usagePercent,
            zone: 'red',
            is_degraded: true,
          });
        }
      });

      // Sort degraded by usage percent
      degradedTenants.sort((a, b) => b.usage_percent - a.usage_percent);

      console.log('[master-usage] Zones calculated:', { green, yellow, red, degraded: degradedTenants.length });

      return new Response(JSON.stringify({
        zones: { green, yellow, red },
        degradedTenants,
        totalTenants: tenantIds.length,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/global-summary - Get global credits summary (DASHBOARD)
    if (req.method === 'GET' && tenantId === 'global-summary') {
      console.log('[master-usage] Fetching global credits summary...');
      
      const urlParams = new URL(req.url).searchParams;
      const periodStart = urlParams.get('periodStart');
      const periodEnd = urlParams.get('periodEnd');

      // Default to current month if no period specified
      const now = new Date();
      const startDate = periodStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Sum credits from tenant_usage for the period
      const { data: usages, error: usagesError } = await supabase
        .from('tenant_usage')
        .select('tenant_id, ai_credits_used, credits_consumed')
        .gte('period_start', startDate.split('T')[0])
        .lte('period_end', endDate.split('T')[0]);

      if (usagesError) {
        console.error('[master-usage] Error fetching usages:', usagesError);
        return new Response(JSON.stringify({ error: usagesError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Aggregate totals
      let totalCredits = 0;
      let totalCost = 0;
      const uniqueTenants = new Set<string>();

      (usages || []).forEach(u => {
        const credits = u.ai_credits_used || u.credits_consumed || 0;
        totalCredits += credits;
        // Estimate cost at R$0.02 per credit (can be adjusted)
        totalCost += credits * 0.02;
        if (u.tenant_id) uniqueTenants.add(u.tenant_id);
      });

      // Count API calls from api_usage_logs if available
      const { count: apiCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const result = {
        total_credits_consumed: totalCredits,
        total_cost_brl: totalCost,
        total_api_calls: apiCalls || 0,
        total_tenants_with_usage: uniqueTenants.size,
        period_start: startDate,
        period_end: endDate,
      };

      console.log('[master-usage] Global summary:', result);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/:tenantId - Get tenant usage with limits comparison
    if (req.method === 'GET' && tenantId && !subPath) {
      // Get tenant features (limits) from local database
      const { data: features, error: featuresError } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (featuresError) {
        console.log('[master-usage] Features not found, using defaults:', featuresError.message);
      }

      // Get user count from local profiles (this is the Master database)
      const { count: localUserCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get local tenant_usage for any stored data
      const { data: localUsage } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // Get tenant config for WhatsApp count
      const { data: tenantConfig } = await supabase
        .from('tenants')
        .select('extra_channels, config')
        .eq('id', tenantId)
        .single();

      // Count leads from local conversations
      const { count: localLeadsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('lead_id', 'is', null);

      // Count products from local knowledge_base
      const { count: localProductsCount } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('category', 'product');

      // Sum AI tokens and credits from user_usage
      const { data: localUserUsageData } = await supabase
        .from('user_usage')
        .select('ai_tokens_month, credits_consumed, storage_bytes')
        .eq('tenant_id', tenantId);

      let localAiTokens = 0;
      let localAiCredits = 0;
      let localStorageMb = 0;
      if (localUserUsageData && localUserUsageData.length > 0) {
        localAiTokens = localUserUsageData.reduce((sum, u) => sum + (u.ai_tokens_month || 0), 0);
        localAiCredits = localUserUsageData.reduce((sum, u) => sum + (u.credits_consumed || 0), 0);
        const totalBytes = localUserUsageData.reduce((sum, u) => sum + (u.storage_bytes || 0), 0);
        localStorageMb = Math.round(totalBytes / 1048576);
      }

      // Try to get additional data from remote Supabase if configured
      let remoteUserCount = 0;
      let remoteLeadsCount = 0;
      let remoteProductsCount = 0;
      let remoteWhatsappCount = 0;
      let remoteStorageMb = 0;
      let remoteAiTokens = 0;
      let remoteAiCredits = 0;
      let remoteMessagesSent = 0;
      let useRemoteData = false;

      if (remoteSupabase) {
        console.log('[master-usage] Fetching real data from remote Supabase...');
        
        try {
          // Count users from remote profiles
          const { count: usersCount, error: usersError } = await remoteSupabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
          
          if (!usersError) {
            remoteUserCount = usersCount || 0;
            useRemoteData = true;
          } else {
            console.log('[master-usage] Remote users error:', usersError.message);
          }

          // Count leads from remote leads table (or conversations with lead_id)
          const { count: leadsCount } = await remoteSupabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .not('lead_id', 'is', null);
          remoteLeadsCount = leadsCount || 0;

          // Count products from remote knowledge_base
          const { count: productsCount } = await remoteSupabase
            .from('knowledge_base')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('category', 'product');
          remoteProductsCount = productsCount || 0;

          // Count WhatsApp instances from whatsapp_instances table
          const { count: whatsappInstancesCount } = await remoteSupabase
            .from('whatsapp_instances')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
          remoteWhatsappCount = whatsappInstancesCount || 0;

          // Sum AI tokens and credits from user_usage
          const { data: userUsageData } = await remoteSupabase
            .from('user_usage')
            .select('ai_tokens_month, credits_consumed, storage_bytes')
            .eq('tenant_id', tenantId);

          if (userUsageData && userUsageData.length > 0) {
            remoteAiTokens = userUsageData.reduce((sum, u) => sum + (u.ai_tokens_month || 0), 0);
            remoteAiCredits = userUsageData.reduce((sum, u) => sum + (u.credits_consumed || 0), 0);
            const totalBytes = userUsageData.reduce((sum, u) => sum + (u.storage_bytes || 0), 0);
            remoteStorageMb = Math.round(totalBytes / 1048576);
          }

          // Count messages from api_usage_logs
          const periodStart = new Date();
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);

          const { count: messagesCount } = await remoteSupabase
            .from('api_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', periodStart.toISOString());
          remoteMessagesSent = messagesCount || 0;

          console.log('[master-usage] Remote data fetched:', {
            users: remoteUserCount,
            leads: remoteLeadsCount,
            products: remoteProductsCount,
            whatsapp: remoteWhatsappCount,
            ai_tokens: remoteAiTokens,
            ai_credits: remoteAiCredits,
            storage_mb: remoteStorageMb,
            messages: remoteMessagesSent,
          });
        } catch (remoteError) {
          console.error('[master-usage] Error fetching remote data:', remoteError);
          useRemoteData = false;
        }
      }

      // Count local WhatsApp instances
      const { count: localWhatsappCount } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      console.log('[master-usage] Local data:', {
        users: localUserCount,
        leads: localLeadsCount,
        products: localProductsCount,
        whatsapp: localWhatsappCount || 0,
        ai_tokens: localAiTokens,
        ai_credits: localAiCredits,
        storage_mb: localStorageMb,
      });

      // Build response with usage vs limits
      const defaultLimits = {
        limit_users: 5,
        limit_leads: 1000,
        limit_products: 100,
        limit_whatsapp_instances: 1,
        limit_ai_tokens_monthly: 100000,
        limit_storage_mb: 500,
      };

      const limits = features || defaultLimits;
      
      // Use remote data if available AND it has more data, otherwise use local
      // Priority: use the source that has actual data (non-zero values)
      
      const currentUsage = {
        users_count: Math.max(
          useRemoteData ? remoteUserCount : 0,
          localUserCount || 0,
          localUsage?.users_count || 0
        ),
        leads_count: Math.max(
          useRemoteData ? remoteLeadsCount : 0,
          localLeadsCount || 0,
          localUsage?.leads_count || 0
        ),
        products_count: Math.max(
          useRemoteData ? remoteProductsCount : 0,
          localProductsCount || 0,
          localUsage?.products_count || 0
        ),
        whatsapp_instances_count: Math.max(
          useRemoteData ? remoteWhatsappCount : 0,
          localWhatsappCount || 0,
          localUsage?.whatsapp_instances_count || 0
        ),
        ai_tokens_used: Math.max(
          useRemoteData ? remoteAiTokens : 0,
          localAiTokens,
          localUsage?.ai_tokens_used || 0
        ),
        ai_credits_used: Math.max(
          useRemoteData ? remoteAiCredits : 0,
          localAiCredits,
          localUsage?.ai_credits_used || localUsage?.credits_consumed || 0
        ),
        storage_used_mb: Math.max(
          useRemoteData ? remoteStorageMb : 0,
          localStorageMb,
          localUsage?.storage_used_mb || 0
        ),
        messages_sent: Math.max(
          useRemoteData ? remoteMessagesSent : 0,
          localUsage?.messages_sent || 0
        ),
        active_users: Math.max(
          useRemoteData ? remoteUserCount : 0,
          localUserCount || 0,
          localUsage?.active_users || 0
        ),
      };

      console.log('[master-usage] Final usage:', currentUsage);

      // Apply overrides to limits if they exist
      const effectiveLimits = { ...limits };
      if (features?.overrides) {
        Object.entries(features.overrides).forEach(([key, value]) => {
          if (key in effectiveLimits) {
            (effectiveLimits as Record<string, unknown>)[key] = value;
          }
        });
      }

      // Calculate total credits limit based on credits_per_user × active users
      const creditsPerUser = features?.credits_per_user || 500;
      const totalCreditsLimit = creditsPerUser * Math.max(currentUsage.users_count, 1);

      const response = {
        usage: {
          users: currentUsage.users_count,
          leads: currentUsage.leads_count,
          products: currentUsage.products_count,
          whatsapp_instances: currentUsage.whatsapp_instances_count,
          ai_credits: currentUsage.ai_credits_used,  // Primary metric
          ai_tokens: currentUsage.ai_tokens_used,    // Secondary/internal metric
          storage_mb: currentUsage.storage_used_mb,
          messages: currentUsage.messages_sent,
          active_users: currentUsage.active_users,
        },
        limits: {
          users: effectiveLimits.limit_users,
          leads: effectiveLimits.limit_leads,
          products: effectiveLimits.limit_products,
          whatsapp_instances: effectiveLimits.limit_whatsapp_instances,
          ai_credits: totalCreditsLimit,                    // Calculated from credits_per_user × users
          ai_tokens: effectiveLimits.limit_ai_tokens_monthly, // Legacy/internal
          storage_mb: effectiveLimits.limit_storage_mb,
          credits_per_user: creditsPerUser,                 // For display purposes
        },
        percentages: {
          users: calculatePercentage(currentUsage.users_count, effectiveLimits.limit_users),
          leads: calculatePercentage(currentUsage.leads_count, effectiveLimits.limit_leads),
          products: calculatePercentage(currentUsage.products_count, effectiveLimits.limit_products),
          whatsapp_instances: calculatePercentage(currentUsage.whatsapp_instances_count, effectiveLimits.limit_whatsapp_instances),
          ai_credits: calculatePercentage(currentUsage.ai_credits_used, totalCreditsLimit),
          ai_tokens: calculatePercentage(currentUsage.ai_tokens_used, effectiveLimits.limit_ai_tokens_monthly),
          storage_mb: calculatePercentage(currentUsage.storage_used_mb, effectiveLimits.limit_storage_mb),
        },
        alerts: getAlerts(currentUsage, effectiveLimits),
        last_calculated_at: new Date().toISOString(),
        data_source: remoteSupabase ? 'remote' : 'local',
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/:tenantId/users - Get per-user usage
    if (req.method === 'GET' && tenantId && subPath === 'users') {
      // Try remote first if available
      const targetSupabase = remoteSupabase || supabase;
      
      const { data: userUsage, error } = await targetSupabase
        .from('user_usage')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            role
          ),
          user_limits:user_id (
            ai_tokens_monthly,
            storage_mb,
            messages_monthly,
            can_use_ai,
            can_transcribe
          )
        `)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[master-usage] Error fetching user usage:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: userUsage, total: userUsage?.length || 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/alerts - Get all tenants with usage alerts
    if (req.method === 'GET' && tenantId === 'alerts') {
      const threshold = parseInt(url.searchParams.get('threshold') || '80');

      // Get all tenants with their usage and features
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          subdomain,
          tenant_usage (*),
          tenant_features (*)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('[master-usage] Error fetching tenants:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Filter tenants with usage above threshold
      const alertTenants = tenants?.filter(tenant => {
        const usage = tenant.tenant_usage?.[0];
        const features = tenant.tenant_features?.[0] || {
          limit_users: 5,
          limit_leads: 1000,
          limit_ai_tokens_monthly: 100000,
          limit_storage_mb: 500,
        };

        if (!usage) return false;

        const percentages = {
          leads: calculatePercentage(usage.leads_count || 0, features.limit_leads),
          ai_tokens: calculatePercentage(usage.ai_tokens_used || 0, features.limit_ai_tokens_monthly),
          storage: calculatePercentage(usage.storage_used_mb || 0, features.limit_storage_mb),
        };

        return percentages.leads >= threshold || 
               percentages.ai_tokens >= threshold || 
               percentages.storage >= threshold;
      }).map(tenant => {
        const usage = tenant.tenant_usage?.[0];
        const features = tenant.tenant_features?.[0];
        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          alerts: getAlerts(usage || {}, features || {}),
        };
      });

      return new Response(JSON.stringify({ data: alertTenants, total: alertTenants?.length || 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /master-usage/:tenantId/recalculate - Recalculate tenant usage
    if (req.method === 'POST' && tenantId && subPath === 'recalculate') {
      // If remote is configured, fetch fresh data from remote
      if (remoteSupabase) {
        console.log('[master-usage] Recalculating from remote Supabase...');
        
        try {
          // Count users
          const { count: usersCount } = await remoteSupabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          // Count leads
          const { count: leadsCount } = await remoteSupabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .not('lead_id', 'is', null);

          // Count products
          const { count: productsCount } = await remoteSupabase
            .from('knowledge_base')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('category', 'product');

          // Count WhatsApp instances from whatsapp_instances table
          const { count: whatsappCount } = await remoteSupabase
            .from('whatsapp_instances')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          // Sum AI tokens and storage from user_usage
          const { data: userUsageData } = await remoteSupabase
            .from('user_usage')
            .select('ai_tokens_month, storage_bytes')
            .eq('tenant_id', tenantId);

          let aiTokens = 0;
          let storageMb = 0;
          if (userUsageData && userUsageData.length > 0) {
            aiTokens = userUsageData.reduce((sum, u) => sum + (u.ai_tokens_month || 0), 0);
            const totalBytes = userUsageData.reduce((sum, u) => sum + (u.storage_bytes || 0), 0);
            storageMb = Math.round(totalBytes / 1048576);
          }

          // Count messages
          const periodStart = new Date();
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);

          const { count: messagesCount } = await remoteSupabase
            .from('api_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', periodStart.toISOString());

          // Update local tenant_usage with fresh data
          const { error: upsertError } = await supabase
            .from('tenant_usage')
            .upsert({
              tenant_id: tenantId,
              period_start: periodStart.toISOString(),
              period_end: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1).toISOString(),
              users_count: usersCount || 0,
              leads_count: leadsCount || 0,
              products_count: productsCount || 0,
              whatsapp_instances_count: whatsappCount || 0,
              ai_tokens_used: aiTokens,
              storage_used_mb: storageMb,
              messages_sent: messagesCount || 0,
              active_users: usersCount || 0,
              last_calculated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'tenant_id,period_start',
            });

          if (upsertError) {
            console.error('[master-usage] Error upserting usage:', upsertError);
          }

          console.log('[master-usage] Usage recalculated from remote for tenant:', tenantId);
          
          return new Response(JSON.stringify({ 
            success: true, 
            source: 'remote',
            usage: {
              users_count: usersCount || 0,
              leads_count: leadsCount || 0,
              products_count: productsCount || 0,
              whatsapp_instances_count: whatsappCount || 0,
              ai_tokens_used: aiTokens,
              storage_used_mb: storageMb,
              messages_sent: messagesCount || 0,
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (remoteError) {
          console.error('[master-usage] Error recalculating from remote:', remoteError);
          // Fall back to local calculation
        }
      }

      // Fall back to local database function
      const { error } = await supabase.rpc('calculate_tenant_usage', {
        _tenant_id: tenantId,
      });

      if (error) {
        console.error('[master-usage] Error recalculating usage:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch the updated usage
      const { data: usage } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      console.log('[master-usage] Usage recalculated for tenant:', tenantId);
      return new Response(JSON.stringify({ success: true, source: 'local', usage }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-usage] Exception:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculatePercentage(used: number, limit: number): number {
  if (limit <= 0 || limit === -1) return 0; // -1 = unlimited
  return Math.round((used / limit) * 100);
}

function getAlerts(usage: Record<string, unknown>, limits: Record<string, unknown>): string[] {
  const alerts: string[] = [];
  
  const checks = [
    { name: 'users', used: usage.users_count as number, limit: limits.limit_users as number },
    { name: 'leads', used: usage.leads_count as number, limit: limits.limit_leads as number },
    { name: 'products', used: usage.products_count as number, limit: limits.limit_products as number },
    { name: 'ai_tokens', used: usage.ai_tokens_used as number, limit: limits.limit_ai_tokens_monthly as number },
    { name: 'storage', used: usage.storage_used_mb as number, limit: limits.limit_storage_mb as number },
  ];

  checks.forEach(({ name, used, limit }) => {
    if (!limit || limit === -1) return; // Unlimited
    const percentage = calculatePercentage(used || 0, limit);
    if (percentage >= 100) {
      alerts.push(`${name}_limit_exceeded`);
    } else if (percentage >= 90) {
      alerts.push(`${name}_90_percent`);
    } else if (percentage >= 80) {
      alerts.push(`${name}_80_percent`);
    }
  });

  return alerts;
}

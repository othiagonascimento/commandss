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
  console.log(`[MASTER-TENANTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep('Request received', { method: req.method, url: req.url, origin: req.headers.get('origin') });

  if (req.method === 'OPTIONS') {
    logStep('CORS preflight handled');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Create admin client for data operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Verify auth - compatible with Lovable Cloud ES256 tokens
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logStep('ERROR', { message: 'Missing authorization header' });
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    logStep('Token received', { tokenLength: token.length, tokenPrefix: token.substring(0, 20) + '...' });
    
    // Use admin client to validate token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    logStep('Auth validation result', { 
      hasUser: !!userData?.user, 
      errorMessage: userError?.message,
      errorStatus: userError?.status 
    });
    
    if (userError || !userData?.user) {
      logStep('ERROR', { message: 'Invalid token', details: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    logStep('User authenticated', { userId });

    // Check if user has master access
    const { data: masterUser } = await supabaseAdmin
      .from('master_users')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!masterUser) {
      throw new Error('Access denied: not a master user');
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Support both URL path and x-path-suffix header for tenant ID
    const pathSuffix = req.headers.get('x-path-suffix');
    // Filter out query params from pathSuffix - only use valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let tenantId: string | null = null;
    if (pathSuffix && uuidRegex.test(pathSuffix)) {
      tenantId = pathSuffix;
    } else if (pathParts[1] && uuidRegex.test(pathParts[1])) {
      tenantId = pathParts[1];
    }
    const method = req.method;

    logStep(`${method} request`, { tenantId: tenantId || 'list', pathSuffix });

    // GET /master-tenants - List all tenants
    if (method === 'GET' && !tenantId) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search');
      const planType = url.searchParams.get('plan_type');
      const isActive = url.searchParams.get('is_active');

      let query = supabaseAdmin
        .from('tenants')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%`);
      }
      if (planType) {
        query = query.eq('plan_type', planType);
      }
      if (isActive !== null && isActive !== undefined) {
        query = query.eq('is_blocked', isActive === 'false');
      }

      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1).order('created_at', { ascending: false });

      const { data: tenants, error, count } = await query;

      if (error) throw error;

      // Map is_blocked to is_active for frontend compatibility
      const mappedTenants = (tenants || []).map(t => ({
        ...t,
        is_active: !t.is_blocked,
        slug: t.subdomain,
      }));

      return new Response(
        JSON.stringify({
          data: mappedTenants,
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-tenants/:id - Get single tenant with related data
    if (method === 'GET' && tenantId) {
      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select(`
          *,
          tenant_branding (*),
          tenant_onboarding (*),
          tenant_usage (*)
        `)
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      if (!tenant) throw new Error('Tenant not found');

      // Get user count
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const response = {
        ...tenant,
        is_active: !tenant.is_blocked,
        slug: tenant.subdomain,
        user_count: userCount || 0,
        branding: tenant.tenant_branding?.[0] || null,
        onboarding: tenant.tenant_onboarding?.[0] || null,
        usage: tenant.tenant_usage?.[0] ? {
          leads: tenant.tenant_usage[0].messages_sent || 0,
          users: tenant.tenant_usage[0].active_users || 0,
          messages: tenant.tenant_usage[0].messages_sent || 0,
          storage_used: tenant.tenant_usage[0].storage_used_mb || 0,
        } : { leads: 0, users: 0, messages: 0, storage_used: 0 },
        subscription: {
          tenant_id: tenantId,
          plan: tenant.plan_type,
          status: tenant.subscription_status || 'active',
          started_at: tenant.created_at,
          expires_at: tenant.current_period_end,
          billing_cycle: 'monthly',
          amount: (tenant.price_per_user || 0) * (tenant.contracted_users || 1),
          currency: 'BRL',
          features: [],
        },
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-tenants - Create tenant
    if (method === 'POST') {
      const body = await req.json();
      logStep('Creating tenant', { name: body.name, subdomain: body.subdomain || body.slug });
      
      // Handle promotional access (trial, partnership, lifetime)
      const promoEnabled = body.promo_enabled === true;
      const promoType = body.promo_type || 'trial';
      const promoDays = body.promo_days || 14;
      
      // For lifetime: no expiration. For others: calculate end date
      const isLifetime = promoEnabled && promoType === 'lifetime';
      const currentPeriodEnd = promoEnabled && !isLifetime
        ? new Date(Date.now() + promoDays * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      // Determine subscription status
      let subscriptionStatus = 'pending';
      if (promoEnabled) {
        if (isLifetime) {
          subscriptionStatus = 'lifetime';
        } else if (promoType === 'partnership') {
          subscriptionStatus = 'partnership';
        } else {
          subscriptionStatus = 'trialing';
        }
      }
      
      // Store promo info in config JSON
      const config = promoEnabled ? {
        promo: {
          type: promoType,
          days: isLifetime ? null : promoDays,
          reason: body.promo_reason || null,
          granted_at: new Date().toISOString(),
        }
      } : null;
      
      const { data: newTenant, error } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: body.name,
          subdomain: body.subdomain || body.slug,
          plan_type: body.plan_type || 'starter',
          plan_id: body.plan_id || null,
          contact_email: body.contact_email,
          document: body.document,
          price_per_user: body.price_per_user || 69,
          contracted_users: body.contracted_users || 1,
          city: body.city || null,
          state: body.state || null,
          country: body.country || 'BR',
          status: 'active',
          is_blocked: false,
          trial_enabled: promoEnabled,
          trial_days: isLifetime ? -1 : (promoEnabled ? promoDays : null),
          subscription_status: subscriptionStatus,
          current_period_end: currentPeriodEnd,
          config: config,
        })
        .select()
        .single();

      if (error) {
        logStep('Tenant creation failed', { error: error.message });
        throw error;
      }

      logStep('Tenant created', { tenantId: newTenant.id });

      // Create default branding
      const brandingData = {
        tenant_id: newTenant.id,
        company_name: body.branding?.company_name || body.name,
        primary_color: body.branding?.primary_color || '#6366f1',
        logo_url: body.branding?.logo_url || null,
      };
      
      const { error: brandingError } = await supabaseAdmin
        .from('tenant_branding')
        .insert(brandingData);

      if (brandingError) {
        logStep('Branding creation failed (non-critical)', { error: brandingError.message });
      } else {
        logStep('Branding created');
      }

      // Create onboarding record
      const { error: onboardingError } = await supabaseAdmin
        .from('tenant_onboarding')
        .insert({
          tenant_id: newTenant.id,
          status: 'pending',
        });

      if (onboardingError) {
        logStep('Onboarding creation failed (non-critical)', { error: onboardingError.message });
      } else {
        logStep('Onboarding record created');
      }

      // Create tenant_features with default values
      const { error: featuresError } = await supabaseAdmin
        .from('tenant_features')
        .insert({
          tenant_id: newTenant.id,
          module_ai_agent: true,
          module_ai_transcription: true,
          module_automation_flows: true,
          module_campaigns: true,
          module_ecommerce: false,
          module_erp_integration: false,
          module_api_access: false,
          module_whitelabel: false,
          module_multi_whatsapp: false,
          limit_users: 5,
          limit_leads: 1000,
          limit_products: 100,
          limit_whatsapp_instances: 1,
          limit_ai_tokens_monthly: 100000,
          limit_storage_mb: 1024,
          ai_use_global_config: true,
          overrides: {},
        });

      if (featuresError) {
        logStep('Features creation failed (non-critical)', { error: featuresError.message });
      } else {
        logStep('Tenant features created');
      }

      // Create tenant_usage with zero values
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const { error: usageError } = await supabaseAdmin
        .from('tenant_usage')
        .insert({
          tenant_id: newTenant.id,
          period_start: periodStart,
          period_end: periodEnd,
          active_users: 0,
          users_count: 0,
          leads_count: 0,
          products_count: 0,
          whatsapp_instances_count: 0,
          messages_sent: 0,
          storage_used_mb: 0,
          ai_tokens_used: 0,
          ai_credits_used: 0,
          credits_consumed: 0,
          api_calls: 0,
          estimated_cost_brl: 0,
        });

      if (usageError) {
        logStep('Usage creation failed (non-critical)', { error: usageError.message });
      } else {
        logStep('Tenant usage record created');
      }

      // Create admin user if credentials provided
      if (body.admin_email && body.admin_password) {
        logStep('Creating admin user', { email: body.admin_email });
        
        try {
          // Create auth user with tenant_id and role in user_metadata
          // This is required for handle_new_user trigger in CRM to work correctly
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: body.admin_email,
            password: body.admin_password,
            email_confirm: true,
            user_metadata: {
              full_name: body.admin_name || body.admin_email.split('@')[0],
              tenant_id: newTenant.id,
              role: 'admin',
            },
          });

          if (authError) {
            logStep('Admin auth user creation failed', { error: authError.message });
          } else if (authData.user) {
            logStep('Admin auth user created', { userId: authData.user.id });

            // Create profile
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: authData.user.id,
                tenant_id: newTenant.id,
                full_name: body.admin_name || body.admin_email.split('@')[0],
                role: null, // Role stored in user_roles
              });

            if (profileError) {
              logStep('Admin profile creation failed', { error: profileError.message });
            } else {
              logStep('Admin profile created');
            }

            // Create user_role with admin role
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .insert({
                user_id: authData.user.id,
                tenant_id: newTenant.id,
                role: 'admin',
              });

            if (roleError) {
              logStep('Admin role creation failed', { error: roleError.message });
            } else {
              logStep('Admin role assigned');
            }
          }
        } catch (adminError) {
          logStep('Admin user creation exception', { error: (adminError as Error).message });
          // Don't fail tenant creation if admin user fails
        }
      }

      logStep('Tenant creation complete in Master', { tenantId: newTenant.id });

      // Sync tenant to CRM
      let crmSyncResult = null;
      try {
        logStep('Syncing tenant to CRM...');
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-tenant-to-crm`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'create',
              tenant_id: newTenant.id,
            }),
          }
        );

        if (syncResponse.ok) {
          crmSyncResult = await syncResponse.json();
          logStep('CRM sync successful', { crmTenantId: crmSyncResult?.crm_tenant_id, apiUrl: crmSyncResult?.api_url });
        } else {
          const errorText = await syncResponse.text();
          logStep('CRM sync failed (non-critical)', { status: syncResponse.status, error: errorText });
        }
      } catch (syncError) {
        logStep('CRM sync exception (non-critical)', { error: (syncError as Error).message });
      }

      return new Response(
        JSON.stringify({ 
          ...newTenant, 
          is_active: true, 
          slug: newTenant.subdomain,
          crm_sync: crmSyncResult,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-tenants/:id - Update tenant
    if (method === 'PATCH' && tenantId) {
      const body = await req.json();
      logStep('Updating tenant', { tenantId, updates: Object.keys(body) });
      
      // Map is_active to is_blocked
      const updateData: Record<string, unknown> = { ...body };
      if ('is_active' in updateData) {
        updateData.is_blocked = !updateData.is_active;
        delete updateData.is_active;
      }
      if ('slug' in updateData) {
        updateData.subdomain = updateData.slug;
        delete updateData.slug;
      }

      const { data: updatedTenant, error } = await supabaseAdmin
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;

      logStep('Tenant updated', { tenantId });

      // Sync changes to CRM
      try {
        logStep('Syncing tenant changes to CRM...');
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-tenant-to-crm`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'sync',
              tenant_id: tenantId,
            }),
          }
        );

        if (syncResponse.ok) {
          const crmSyncResult = await syncResponse.json();
          logStep('CRM sync after update successful', { crmTenantId: crmSyncResult?.crm_tenant_id });
        } else {
          logStep('CRM sync after update failed (non-critical)', { status: syncResponse.status });
        }
      } catch (syncError) {
        logStep('CRM sync after update exception (non-critical)', { error: (syncError as Error).message });
      }

      return new Response(
        JSON.stringify({ ...updatedTenant, is_active: !updatedTenant.is_blocked, slug: updatedTenant.subdomain }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-tenants/:id - Deactivate (soft) or Delete (permanent)
    if (method === 'DELETE' && tenantId) {
      const permanent = url.searchParams.get('permanent') === 'true';

      if (permanent) {
        logStep('Permanent delete requested', { tenantId });

        // Check for associated users
        const { count: userCount } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);

        if (userCount && userCount > 0) {
          // Delete user_limits first
          await supabaseAdmin
            .from('user_limits')
            .delete()
            .eq('tenant_id', tenantId);

          // Delete user_roles
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('tenant_id', tenantId);

          // Delete profiles
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('tenant_id', tenantId);
        }

        // Delete related records
        await supabaseAdmin.from('tenant_branding').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_onboarding').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_usage').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_features').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_domains').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('billing_subscriptions').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('ai_agent_config').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('knowledge_base').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('objection_handlers').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('audit_logs').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('api_usage_logs').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('conversations').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('credit_transactions').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('payment_failures').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('impersonate_sessions').delete().eq('target_tenant_id', tenantId);
        await supabaseAdmin.from('ai_orchestration_logs').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('lead_memory').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_template_overrides').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('tenant_template_subscriptions').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('user_education_progress').delete().eq('tenant_id', tenantId);

        // Finally delete the tenant
        const { error } = await supabaseAdmin
          .from('tenants')
          .delete()
          .eq('id', tenantId);

        if (error) throw error;

        logStep('Tenant permanently deleted', { tenantId });

        return new Response(
          JSON.stringify({ success: true, message: 'Tenant permanently deleted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Soft delete (deactivate)
        const { error } = await supabaseAdmin
          .from('tenants')
          .update({ 
            is_blocked: true, 
            blocked_at: new Date().toISOString(),
            blocked_reason: 'Desativado via painel master'
          })
          .eq('id', tenantId);

        if (error) throw error;

        logStep('Tenant deactivated', { tenantId });

        return new Response(
          JSON.stringify({ success: true, message: 'Tenant deactivated' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

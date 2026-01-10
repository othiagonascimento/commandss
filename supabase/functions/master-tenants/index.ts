import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-TENANTS] ${step}${detailsStr}`);
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
    const tenantId = pathParts[1];
    const method = req.method;

    logStep(`${method} request`, { tenantId: tenantId || 'list' });

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

      if (error) throw error;

      // Create default branding
      if (body.branding) {
        await supabaseAdmin
          .from('tenant_branding')
          .insert({
            tenant_id: newTenant.id,
            company_name: body.branding.company_name || body.name,
            primary_color: body.branding.primary_color || '#6366f1',
            logo_url: body.branding.logo_url,
          });
      }

      // Create onboarding record
      await supabaseAdmin
        .from('tenant_onboarding')
        .insert({
          tenant_id: newTenant.id,
          status: 'pending',
        });

      logStep('Tenant created', { tenantId: newTenant.id });

      return new Response(
        JSON.stringify({ ...newTenant, is_active: true, slug: newTenant.subdomain }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-tenants/:id - Update tenant
    if (method === 'PATCH' && tenantId) {
      const body = await req.json();
      
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

          // Delete user_usage
          await supabaseAdmin
            .from('user_usage')
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
        await supabaseAdmin.from('vendedor_cloning_profiles').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('ai_orchestration_logs').delete().eq('tenant_id', tenantId);
        await supabaseAdmin.from('lead_memory').delete().eq('tenant_id', tenantId);

        // Delete webhooks and their logs
        const { data: webhooks } = await supabaseAdmin
          .from('webhooks')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (webhooks && webhooks.length > 0) {
          const webhookIds = webhooks.map(w => w.id);
          await supabaseAdmin
            .from('webhook_logs')
            .delete()
            .in('webhook_id', webhookIds);
          await supabaseAdmin
            .from('webhooks')
            .delete()
            .eq('tenant_id', tenantId);
        }

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

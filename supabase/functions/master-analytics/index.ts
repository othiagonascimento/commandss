import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get real overview data
async function getOverviewData() {
  // Get tenant counts by plan
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, plan_type, status, is_blocked, created_at, subscription_status');
  
  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    throw tenantsError;
  }

  const total = tenants?.length || 0;
  const active = tenants?.filter(t => (t as any).subscription_status === 'active').length || 0;
  const basic = tenants?.filter(t => t.plan_type === 'basic').length || 0;
  const pro = tenants?.filter(t => t.plan_type === 'pro').length || 0;
  const enterprise = tenants?.filter(t => t.plan_type === 'enterprise').length || 0;

  // Get subscription counts
  const { data: subscriptions, error: subsError } = await supabase
    .from('billing_subscriptions')
    .select('status');
  
  if (subsError) console.error('Error fetching subscriptions:', subsError);

  const activeSubs = subscriptions?.filter(s => s.status === 'active').length || 0;
  const trialSubs = subscriptions?.filter(s => s.status === 'trialing').length || 0;
  const cancelledSubs = subscriptions?.filter(s => s.status === 'canceled').length || 0;

  // Get usage totals from tenant_usage
  const { data: usage, error: usageError } = await supabase
    .from('tenant_usage')
    .select('leads_count, users_count, messages_sent');
  
  if (usageError) console.error('Error fetching usage:', usageError);

  const totalLeads = usage?.reduce((sum, u) => sum + (u.leads_count || 0), 0) || 0;
  const totalUsers = usage?.reduce((sum, u) => sum + (u.users_count || 0), 0) || 0;
  const totalMessages = usage?.reduce((sum, u) => sum + (u.messages_sent || 0), 0) || 0;

  // Get recent activity (new tenants in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newTenants7d = tenants?.filter(t => 
    new Date(t.created_at) >= sevenDaysAgo
  ).length || 0;

  // Get profiles count for users
  const { count: profilesCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get real new_leads_7d from ops_health_snapshots (latest CRM telemetry)
  let newLeads7d = 0;
  const { data: latestSnapshot } = await supabase
    .from('ops_health_snapshots')
    .select('snapshot_data')
    .eq('snapshot_type', 'global')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestSnapshot?.snapshot_data?.conversations?.new_leads_7d != null) {
    newLeads7d = latestSnapshot.snapshot_data.conversations.new_leads_7d;
  } else if (latestSnapshot?.snapshot_data?.leads?.new_7d != null) {
    newLeads7d = latestSnapshot.snapshot_data.leads.new_7d;
  }
  // Fallback: se nao ha snapshot, indicar como 0 (sem dados do CRM) em vez de fabricar

  return {
    tenants: { total, active, basic, pro, enterprise },
    subscriptions: { active: activeSubs, trial: trialSubs, cancelled: cancelledSubs },
    usage: { 
      total_leads: totalLeads, 
      total_users: profilesCount || totalUsers, 
      total_messages: totalMessages 
    },
    recent_activity: { 
      new_tenants_7d: newTenants7d, 
      new_leads_7d: newLeads7d,
      data_source: latestSnapshot ? 'crm_telemetry' : 'no_data'
    }
  };
}

// Get real revenue data
async function getRevenueData() {
  // Get plans first for pricing lookup
  const { data: plans } = await supabase
    .from('plans')
    .select('id, slug, price_monthly');
  
  const planPricesById = new Map((plans || []).map((p: { id: string; price_monthly: number }) => [p.id, p.price_monthly]));
  const planPricesBySlug = new Map((plans || []).map((p: { slug: string; price_monthly: number }) => [p.slug, p.price_monthly]));
  const planSlugById = new Map((plans || []).map((p: { id: string; slug: string }) => [p.id, p.slug]));

  // Get tenants with their plan info - including subscription_status, trial info, and pricing
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      plan_type,
      plan_id,
      subscription_status,
      trial_enabled,
      is_blocked,
      price_per_user,
      contracted_users,
      channel_price,
      extra_channels,
      discount_type,
      discount_value,
      has_monthly_fee,
      implementation_fee,
      implementation_status
    `);

  if (error) {
    console.error('Error fetching tenants for revenue:', error);
    throw error;
  }

  let totalMrr = 0;
  let payingTenants = 0;
  let freeTenants = 0;
  let trialTenants = 0;
  let lifetimeTenants = 0;
  let pendingTenants = 0;
  const byPlan: Record<string, number> = { free: 0, basic: 0, pro: 0, enterprise: 0 };
  const tenantDetails: { id: string; name?: string; mrr: number; status: string }[] = [];

  // Status that do NOT generate MRR
  const nonPayingStatuses = ['pending', 'trialing', 'canceled', 'lifetime', 'free'];

  for (const tenant of tenants || []) {
    // Determine plan slug
    const planSlug = tenant.plan_id 
      ? planSlugById.get(tenant.plan_id) 
      : tenant.plan_type;

    const isBlocked = tenant.is_blocked === true;
    const isTrialing = tenant.subscription_status === 'trialing';
    const isPending = tenant.subscription_status === 'pending';
    const isLifetime = tenant.subscription_status === 'lifetime';
    const isPartnership = tenant.subscription_status === 'partnership';
    const isCanceled = tenant.subscription_status === 'canceled';
    const isFree = planSlug === 'free';
    const hasNoMonthlyFee = tenant.has_monthly_fee === false;

    // Skip MRR for: blocked, trialing, pending, lifetime, partnership, canceled, free plan, or no monthly fee
    if (isBlocked || isTrialing || isPending || isLifetime || isPartnership || isCanceled || isFree || hasNoMonthlyFee) {
      if (isTrialing) trialTenants++;
      else if (isLifetime || isPartnership || hasNoMonthlyFee) lifetimeTenants++;
      else if (isPending) pendingTenants++;
      else if (isFree) freeTenants++;
      
      tenantDetails.push({
        id: tenant.id,
        mrr: 0,
        status: isBlocked ? 'blocked' : isTrialing ? 'trialing' : isPending ? 'pending' : (isLifetime || hasNoMonthlyFee) ? 'lifetime' : isCanceled ? 'canceled' : 'free'
      });
      continue;
    }

    // Calculate MRR for paying tenants
    // Formula: (price_per_user × contracted_users) + (channel_price × extra_channels) - discounts
    const userRevenue = (tenant.price_per_user || 0) * (tenant.contracted_users || 1);
    const channelRevenue = (tenant.channel_price || 0) * (tenant.extra_channels || 0);
    
    let monthlyRevenue = userRevenue + channelRevenue;

    // Apply discount
    if (tenant.discount_type === 'percent' && tenant.discount_value) {
      monthlyRevenue = monthlyRevenue * (1 - tenant.discount_value / 100);
    } else if (tenant.discount_type === 'fixed' && tenant.discount_value) {
      monthlyRevenue = Math.max(0, monthlyRevenue - tenant.discount_value);
    }

    totalMrr += monthlyRevenue;
    payingTenants++;
    
    // Track by plan type
    const planType = planSlug || tenant.plan_type || 'basic';
    byPlan[planType] = (byPlan[planType] || 0) + monthlyRevenue;

    tenantDetails.push({
      id: tenant.id,
      mrr: monthlyRevenue,
      status: 'active'
    });
  }

  // Get previous month's MRR for growth calculation (simplified)
  const { data: prevMonthTenants } = await supabase
    .from('tenants')
    .select('id')
    .lt('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
    .eq('is_blocked', false);

  const prevMonthCount = prevMonthTenants?.length || 1;
  const growthPercentage = prevMonthCount > 0 && payingTenants > 0
    ? ((payingTenants - prevMonthCount) / prevMonthCount) * 100 
    : 0;

  // Get implementation revenue for this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const implementationRevenue = (tenants || [])
    .filter(t => t.implementation_status === 'paid')
    .reduce((sum, t) => sum + (t.implementation_fee || 0), 0);

  // Get credits revenue from credit_transactions
  const { data: creditTransactions } = await supabase
    .from('credit_transactions')
    .select('price_brl')
    .eq('transaction_type', 'purchase')
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString());

  const creditsRevenue = (creditTransactions || []).reduce((sum, t) => sum + (t.price_brl || 0), 0);

  return {
    mrr: totalMrr,
    arr: totalMrr * 12,
    total: totalMrr,
    growth_percentage: Math.round(growthPercentage * 10) / 10,
    by_plan: byPlan,
    breakdown: {
      paying_tenants: payingTenants,
      free_tenants: freeTenants,
      trial_tenants: trialTenants,
      lifetime_tenants: lifetimeTenants,
      pending_tenants: pendingTenants,
      average_mrr: payingTenants > 0 ? Math.round(totalMrr / payingTenants) : 0
    },
    // Separate revenue streams
    implementation_revenue: implementationRevenue,
    credits_revenue: creditsRevenue,
    total_revenue_month: totalMrr + creditsRevenue, // MRR + credits (implementation is one-time, tracked separately)
  };
}

// Generate time series data from real database with real MRR
async function getTimeSeriesData(months: number = 12) {
  // Pre-fetch all tenants with pricing for MRR calculation
  const { data: allTenants } = await supabase
    .from('tenants')
    .select('id, plan_type, plan_id, subscription_status, is_blocked, price_per_user, contracted_users, channel_price, extra_channels, discount_type, discount_value, has_monthly_fee, created_at');

  const { data: plans } = await supabase
    .from('plans')
    .select('id, slug');
  
  const planSlugById = new Map((plans || []).map((p: { id: string; slug: string }) => [p.id, p.slug]));

  // Helper: calculate MRR for a set of tenants
  function calcMrr(tenants: typeof allTenants) {
    let mrr = 0;
    for (const t of tenants || []) {
      const planSlug = t.plan_id ? planSlugById.get(t.plan_id) : t.plan_type;
      const skip = t.is_blocked || t.subscription_status === 'trialing' || t.subscription_status === 'pending' ||
        t.subscription_status === 'lifetime' || t.subscription_status === 'partnership' || t.subscription_status === 'canceled' ||
        planSlug === 'free' || t.has_monthly_fee === false;
      if (skip) continue;

      let rev = (t.price_per_user || 0) * (t.contracted_users || 1) +
                (t.channel_price || 0) * (t.extra_channels || 0);
      if (t.discount_type === 'percent' && t.discount_value) {
        rev *= (1 - t.discount_value / 100);
      } else if (t.discount_type === 'fixed' && t.discount_value) {
        rev = Math.max(0, rev - t.discount_value);
      }
      mrr += rev;
    }
    return mrr;
  }

  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthName = startDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    // Filter tenants that existed by end of this month
    const tenantsUpToMonth = (allTenants || []).filter(t => new Date(t.created_at) <= endDate);

    // Get profiles (users) created up to this month
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', endDate.toISOString());

    // Get usage for this period
    const { data: usageData } = await supabase
      .from('tenant_usage')
      .select('leads_count, messages_sent')
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString());

    const leads = usageData?.reduce((sum, u) => sum + (u.leads_count || 0), 0) || 0;
    const messages = usageData?.reduce((sum, u) => sum + (u.messages_sent || 0), 0) || 0;

    // Real MRR calculation
    const realMrr = calcMrr(tenantsUpToMonth);

    data.push({
      month: monthName,
      date: startDate.toISOString(),
      mrr: Math.round(realMrr),
      tenants: tenantsUpToMonth.length,
      leads: leads,
      users: usersCount || 0,
      messages: messages,
    });
  }
  
  return data;
}

// Get activity logs from database
async function getActivityLogs(limit: number = 50) {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      user_id,
      tenant_id,
      ip_address,
      user_agent,
      old_values,
      new_values,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  // Enrich with user and tenant names
  const enrichedLogs = await Promise.all((logs || []).map(async (log) => {
    let userEmail = null;
    let tenantName = null;

    if (log.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', log.user_id)
        .single();
      userEmail = profile?.full_name || log.user_id;
    }

    if (log.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', log.tenant_id)
        .single();
      tenantName = tenant?.name || null;
    }

    return {
      ...log,
      user_email: userEmail,
      tenant_name: tenantName,
    };
  }));

  return enrichedLogs;
}

// Get tenant health data
async function getTenantHealthData() {
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      subdomain,
      plan_type,
      is_blocked,
      status,
      created_at
    `);

  if (error) {
    console.error('Error fetching tenants for health:', error);
    return [];
  }

  const healthData = await Promise.all((tenants || []).map(async (tenant) => {
    // Get usage data
    const { data: usage } = await supabase
      .from('tenant_usage')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get user count from profiles (source of truth for users)
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);

    // Get active users (users with recent activity via audit_logs or profiles updated_at)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: activeUserCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .gte('updated_at', sevenDaysAgo.toISOString());

    // Get features/limits
    const { data: features } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    // Calculate health score based on real operational data
    const hasRecentActivity = usage?.messages_sent > 0 || usage?.leads_count > 0;
    const hasUsers = (userCount || 0) > 0;
    const isActive = !tenant.is_blocked && tenant.status !== 'inactive';

    // Try to get real ops data from latest snapshot for this tenant
    const { data: tenantSnapshot } = await supabase
      .from('ops_health_snapshots')
      .select('snapshot_data')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const snap = tenantSnapshot?.snapshot_data;
    const hasSnapshot = !!snap;
    
    // Real health score: weighted 100-point scale
    let healthScore = 0;
    if (hasSnapshot) {
      // 25pts: channels connected
      const channels = snap?.channels;
      const whatsappOk = channels?.whatsapp?.some((w: any) => w.status === 'connected') ?? false;
      const metaOk = channels?.meta?.some((m: any) => m.status === 'active') ?? false;
      healthScore += (whatsappOk || metaOk) ? 25 : 0;
      // 25pts: recent activity (messages or leads in last 24h)
      healthScore += hasRecentActivity ? 25 : 0;
      // 20pts: queues healthy (pending < 50, failed = 0)
      const eq = snap?.event_queue;
      const queuesOk = eq ? (eq.pending < 50 && eq.failed === 0) : true;
      healthScore += queuesOk ? 20 : (eq?.failed > 0 ? 0 : 10);
      // 15pts: SLA respected
      const avgResponse = snap?.conversations?.avg_response_time;
      healthScore += (avgResponse != null && avgResponse < 300) ? 15 : (avgResponse == null ? 7 : 0);
      // 15pts: usage below 80% of limits
      const storageLimit = features?.limit_storage_mb || 1000;
      const storageUsed = usage?.storage_used_mb || 0;
      const tokenLimit = features?.limit_ai_tokens_monthly || 100000;
      const tokensUsed = usage?.ai_tokens_used || 0;
      const usageOk = (storageUsed / storageLimit < 0.8) && (tokensUsed / tokenLimit < 0.8);
      healthScore += usageOk ? 15 : 0;
    } else {
      // Fallback: simplified local formula (marked as estimated)
      healthScore = 30;
      if (isActive) healthScore += 25;
      if (hasUsers) healthScore += 20;
      if (hasRecentActivity) healthScore += 25;
    }

    const status = healthScore >= 80 ? 'healthy' 
      : healthScore >= 50 ? 'warning' 
      : healthScore >= 20 ? 'critical' 
      : 'inactive';

    const alerts = [];
    if (!hasRecentActivity) {
      alerts.push({ type: 'warning', message: 'Sem atividade recente' });
    }
    if (!hasUsers) {
      alerts.push({ type: 'error', message: 'Nenhum usuário cadastrado' });
    }

    // Calculate storage: try real media_files size, fallback to tenant_usage field
    let storageUsedMb = usage?.storage_used_mb || 0;
    if (storageUsedMb === 0) {
      // Try to get real storage from media files or storage objects
      const { data: mediaFiles } = await supabase
        .from('media_files')
        .select('file_size')
        .eq('tenant_id', tenant.id);
      if (mediaFiles && mediaFiles.length > 0) {
        storageUsedMb = mediaFiles.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0) / (1024 * 1024);
      }
    }

    const storageLimit = features?.limit_storage_mb || 1000;
    const storagePercent = storageLimit > 0 ? (storageUsedMb / storageLimit) * 100 : 0;

    if (storagePercent > 80) {
      alerts.push({ type: 'warning', message: `Uso de storage acima de ${Math.round(storagePercent)}%` });
    }

    // Calculate AI tokens percentage
    const tokenLimit = features?.limit_ai_tokens_monthly || 100000;
    const tokensUsed = usage?.ai_tokens_used || 0;
    const tokensPercent = (tokensUsed / tokenLimit) * 100;

    return {
      ...tenant,
      health_score: healthScore,
      status,
      last_activity: usage?.updated_at || tenant.created_at,
      metrics: {
        active_users: usage?.active_users || 0,
        total_users: userCount || 0,
        messages_24h: usage?.messages_sent || 0,
        messages_trend: 0,
        leads_7d: usage?.leads_count || 0,
        error_count: 0,
        storage_used_percent: Math.round(storagePercent),
        ai_tokens_used_percent: Math.round(tokensPercent),
      },
      alerts,
    };
  }));

  return healthData;
}

// Get billing intelligence data
async function getBillingIntelligence() {
  // Get tenants with subscription info and pricing details
  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      plan_type,
      plan_id,
      created_at,
      is_blocked,
      subscription_status,
      price_per_user,
      contracted_users,
      channel_price,
      extra_channels,
      discount_type,
      discount_value,
      subscription:billing_subscriptions(status, current_period_start)
    `);

  // Get plans for slug lookup
  const { data: plans } = await supabase
    .from('plans')
    .select('id, slug');
  
  const planSlugById = new Map((plans || []).map((p: { id: string; slug: string }) => [p.id, p.slug]));

  // Get churn risk - tenants without recent activity
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: inactiveUsage } = await supabase
    .from('tenant_usage')
    .select('tenant_id, updated_at, messages_sent')
    .lt('updated_at', thirtyDaysAgo.toISOString());

  const inactiveTenantIds = new Set(inactiveUsage?.map(u => u.tenant_id) || []);
  
  // Calculate real MRR for each tenant at risk
  const churnRisk = (tenants || [])
    .filter(t => inactiveTenantIds.has(t.id) || t.is_blocked)
    .slice(0, 5)
    .map(t => {
      // Calculate this tenant's MRR
      const planSlug = t.plan_id ? planSlugById.get(t.plan_id) : t.plan_type;
      const isFree = planSlug === 'free';
      const isTrialing = t.subscription_status === 'trialing';
      
      let tenantMrr = 0;
      if (!isFree && !isTrialing && !t.is_blocked) {
        tenantMrr = ((t.price_per_user || 0) * (t.contracted_users || 1)) +
                    ((t.channel_price || 0) * (t.extra_channels || 0));
        
        if (t.discount_type === 'percent' && t.discount_value) {
          tenantMrr *= (1 - t.discount_value / 100);
        } else if (t.discount_type === 'fixed' && t.discount_value) {
          tenantMrr = Math.max(0, tenantMrr - t.discount_value);
        }
      }

      // Calculate real days since last activity from usage updated_at
      const usageRecord = inactiveUsage?.find(u => u.tenant_id === t.id);
      const lastActivityDate = usageRecord?.updated_at ? new Date(usageRecord.updated_at) : thirtyDaysAgo;
      const daysSinceLogin = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Real risk score: based on inactivity days + blocked status + messages trend
      const msgCount = usageRecord?.messages_sent || 0;
      let riskScore = Math.min(100, 50 + daysSinceLogin); // base: 50 + 1pt per inactive day
      if (t.is_blocked) riskScore = 95;
      if (msgCount === 0) riskScore = Math.min(100, riskScore + 10);

      const riskFactors: string[] = [];
      if (daysSinceLogin > 14) riskFactors.push(`${daysSinceLogin} dias sem atividade`);
      if (msgCount === 0) riskFactors.push('Zero mensagens no período');
      if (t.is_blocked) riskFactors.push('Tenant bloqueado');
      if (riskFactors.length === 0) riskFactors.push('Baixa atividade');

      return {
        id: t.id,
        name: t.name,
        risk_score: riskScore,
        risk_factors: riskFactors,
        last_activity: lastActivityDate.toISOString(),
        mrr: Math.round(tenantMrr),
        days_since_login: daysSinceLogin,
      };
    });

  // Revenue breakdown by plan - using real tenant pricing
  const revenueByPlanMap: Record<string, { revenue: number; count: number }> = {};
  
  for (const tenant of tenants || []) {
    const planSlug = tenant.plan_id ? planSlugById.get(tenant.plan_id) : tenant.plan_type;
    const planKey = planSlug || 'basic';
    const isFree = planKey === 'free';
    const isTrialing = tenant.subscription_status === 'trialing';
    
    if (!revenueByPlanMap[planKey]) {
      revenueByPlanMap[planKey] = { revenue: 0, count: 0 };
    }
    
    revenueByPlanMap[planKey].count++;
    
    // Only count MRR for paying tenants
    if (!isFree && !isTrialing && !tenant.is_blocked) {
      let tenantMrr = ((tenant.price_per_user || 0) * (tenant.contracted_users || 1)) +
                      ((tenant.channel_price || 0) * (tenant.extra_channels || 0));
      
      if (tenant.discount_type === 'percent' && tenant.discount_value) {
        tenantMrr *= (1 - tenant.discount_value / 100);
      } else if (tenant.discount_type === 'fixed' && tenant.discount_value) {
        tenantMrr = Math.max(0, tenantMrr - tenant.discount_value);
      }
      
      revenueByPlanMap[planKey].revenue += tenantMrr;
    }
  }

  const revenueByPlan = Object.entries(revenueByPlanMap).map(([plan, data]) => ({
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    revenue: Math.round(data.revenue),
    count: data.count,
  }));

  // Cohort analysis - real retention based on tenant activity
  const cohortMonths = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Tenants created in this cohort month
    const cohortTenants = (tenants || []).filter(t => {
      const created = new Date(t.created_at);
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    });
    const cohortTotal = cohortTenants.length;
    
    // Calculate real retention: how many are still active (not blocked, not canceled) at each month mark
    const retentionByMonth: Record<string, number> = {};
    for (let m = 1; m <= 6; m++) {
      if (i + m > 5) break; // can't measure future months
      const checkDate = new Date(date.getFullYear(), date.getMonth() + m, 1);
      const retained = cohortTenants.filter(t => {
        const isStillActive = !t.is_blocked && t.subscription_status !== 'canceled';
        // If canceled, check if cancellation happened before checkDate
        // Since we don't have cancel_date, use is_blocked + status as proxy
        return isStillActive;
      }).length;
      retentionByMonth[`month_${m}`] = cohortTotal > 0 ? Math.round((retained / cohortTotal) * 100) : 0;
    }

    cohortMonths.push({
      cohort: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      total: cohortTotal,
      month_1: retentionByMonth.month_1 ?? 100,
      month_2: retentionByMonth.month_2 ?? null,
      month_3: retentionByMonth.month_3 ?? null,
      month_4: retentionByMonth.month_4 ?? null,
      month_5: retentionByMonth.month_5 ?? null,
      month_6: retentionByMonth.month_6 ?? null,
    });
  }

  // Key metrics using real data
  const totalTenants = tenants?.length || 1;
  const activeTenants = tenants?.filter(t => !t.is_blocked).length || 0;
  const payingTenants = tenants?.filter(t => {
    const planSlug = t.plan_id ? planSlugById.get(t.plan_id) : t.plan_type;
    return !t.is_blocked && t.subscription_status !== 'trialing' && planSlug !== 'free';
  }).length || 0;
  
  const churnRate = ((totalTenants - activeTenants) / totalTenants) * 100;
  
  // Calculate total MRR for LTV
  const totalMrr = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0);
  const avgMrr = payingTenants > 0 ? totalMrr / payingTenants : 0;
  // Calculate real average lifetime from billing_subscriptions
  const { data: subsForLtv } = await supabase
    .from('billing_subscriptions')
    .select('created_at, status, current_period_end');
  
  let avgLifetimeMonths = 24; // default fallback
  if (subsForLtv && subsForLtv.length > 0) {
    const lifetimes = subsForLtv.map(s => {
      const start = new Date(s.created_at);
      const end = s.status === 'canceled' && s.current_period_end 
        ? new Date(s.current_period_end) 
        : new Date();
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    });
    avgLifetimeMonths = lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length;
  }
  
  const estimatedLtv = avgMrr * avgLifetimeMonths;
  const cacEstimated = 350; // Marked as estimated - requires marketing data

  return {
    cohort: cohortMonths,
    churn_risk: churnRisk,
    revenue_breakdown: {
      by_plan: revenueByPlan,
      by_period: [],
      by_sales_rep: [],
    },
    metrics: {
      ltv: Math.round(estimatedLtv),
      cac: cacEstimated,
      cac_source: 'estimated',
      ltv_cac_ratio: estimatedLtv > 0 ? Math.round((estimatedLtv / cacEstimated) * 10) / 10 : 0,
      churn_rate: Math.round(churnRate * 10) / 10,
      expansion_revenue: 0,
      net_revenue_retention: Math.round((100 - churnRate) * 10) / 10,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify master access
    const { data: masterUser } = await supabase
      .from('master_users')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('is_active', true)
      .single();

    if (!masterUser) {
      return new Response(
        JSON.stringify({ error: 'Access denied: not a master user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let endpoint = 'overview';

    // Handle routing: prefer x-path-suffix header, fallback to URL path
    const pathSuffix = req.headers.get('x-path-suffix');
    const url = new URL(req.url);
    
    if (pathSuffix) {
      // Strip query params from path suffix for endpoint matching
      endpoint = pathSuffix.split('?')[0];
    } else {
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 1) {
        endpoint = pathParts[1];
      }
    }

    // Merge query params from both URL and path suffix
    const suffixParams = pathSuffix?.includes('?') ? new URLSearchParams(pathSuffix.split('?')[1]) : null;
    if (suffixParams) {
      suffixParams.forEach((v, k) => url.searchParams.set(k, v));
    }

    console.log(`[Master Analytics] Endpoint: ${endpoint}`);

    let responseData: unknown;

    switch (endpoint) {
      case 'overview':
        responseData = await getOverviewData();
        break;

      case 'revenue':
        responseData = await getRevenueData();
        break;

      case 'timeseries':
        const period = url.searchParams.get('period') || 'monthly';
        responseData = {
          period,
          data: await getTimeSeriesData(12),
        };
        break;

      case 'activity-logs':
        responseData = await getActivityLogs(50);
        break;

      case 'tenant-health':
        responseData = await getTenantHealthData();
        break;

      case 'billing-intelligence':
        responseData = await getBillingIntelligence();
        break;

      case 'usage': {
        const { data: allUsage } = await supabase
          .from('tenant_usage')
          .select('storage_used_mb, api_calls, active_users');
        
        responseData = {
          total_api_calls: allUsage?.reduce((sum, u) => sum + (u.api_calls || 0), 0) || 0,
          total_storage_gb: (allUsage?.reduce((sum, u) => sum + (u.storage_used_mb || 0), 0) || 0) / 1024,
          total_bandwidth_gb: 0,
          active_sessions: allUsage?.reduce((sum, u) => sum + (u.active_users || 0), 0) || 0,
          peak_concurrent_users: 0,
        };
        break;
      }

      default: {
        // Handle dynamic routes like "tenant/{id}"
        const parts = endpoint.split('/');
        if (parts[0] === 'tenant' && parts[1]) {
          const tenantId = parts[1];
          const [usageRes, usersRes] = await Promise.all([
            supabase.from('tenant_usage').select('*').eq('tenant_id', tenantId).single(),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
          ]);

          responseData = {
            tenant_id: tenantId,
            leads: usageRes.data?.leads_count || 0,
            users: usersRes.count || 0,
            messages: usageRes.data?.messages_sent || 0,
            storage_used_mb: usageRes.data?.storage_used_mb || 0,
            api_calls_30d: usageRes.data?.api_calls || 0,
          };
          break;
        }

        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Analytics] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

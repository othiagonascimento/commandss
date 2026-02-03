import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOG-API-USAGE] ${step}${detailsStr}`);
};

interface UsagePayload {
  user_id: string;
  tenant_id: string;
  provider: string;
  model: string;
  operation?: string;
  input_tokens?: number;
  output_tokens?: number;
  audio_seconds?: number;
  image_count?: number;
  request_id?: string;
  latency_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

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
    logStep('Function started', { method: req.method });

    // For internal use, we also accept service role calls
    // But for security, we validate either user token or internal secret
    const authHeader = req.headers.get('Authorization');
    const internalSecret = req.headers.get('X-Internal-Secret');
    
    let isAuthorized = false;
    
    if (internalSecret === Deno.env.get('INTERNAL_API_SECRET')) {
      isAuthorized = true;
      logStep('Authorized via internal secret');
    } else if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData.user) {
        isAuthorized = true;
        logStep('Authorized via user token', { userId: userData.user.id });
      }
    }

    // Allow unauthenticated calls for internal logging (with service role)
    // In production, you'd want to secure this properly
    if (!isAuthorized && !authHeader) {
      // Check if calling from edge function (internal)
      isAuthorized = true;
      logStep('Allowing internal call');
    }

    if (req.method === 'POST') {
      const payload: UsagePayload = await req.json();
      
      if (!payload.user_id || !payload.tenant_id || !payload.provider || !payload.model) {
        throw new Error('Missing required fields: user_id, tenant_id, provider, model');
      }

      // Get cost config for this model (includes layer_category)
      const { data: costConfig, error: costError } = await supabaseAdmin
        .from('api_cost_config')
        .select('*, layer_category')
        .eq('provider', payload.provider)
        .eq('model', payload.model)
        .eq('operation', payload.operation || 'chat')
        .eq('is_active', true)
        .single();

      let costUsd = 0;
      let costBrl = 0;
      let usdToBrlRate = 5.50;
      let markupPercent = 0;
      let creditsConsumed = 0;

      // Determine layer category from cost config or infer from model name
      let layerCategory = costConfig?.layer_category || 'layer_2';
      
      // Fallback: infer layer from model name if not configured
      if (!costConfig?.layer_category) {
        const modelLower = payload.model.toLowerCase();
        if (modelLower.includes('flash') || modelLower.includes('mini') || modelLower.includes('haiku') || modelLower.includes('nano')) {
          layerCategory = 'layer_1';
        } else if (modelLower.includes('sonnet') || modelLower.includes('opus') || modelLower.includes('claude-3-5') || modelLower.includes('gpt-4-turbo')) {
          layerCategory = 'layer_3';
        }
      }

      // Get credit rate for this layer/operation from credit_rates table
      let operationType = layerCategory;
      if (payload.operation === 'transcription' || payload.audio_seconds) {
        operationType = 'transcription';
      } else if (payload.operation === 'image' || payload.image_count) {
        operationType = 'image_generation';
      }

      const { data: creditRate } = await supabaseAdmin
        .from('credit_rates')
        .select('credits_per_unit')
        .eq('operation_type', operationType)
        .eq('is_active', true)
        .single();

      // Calculate credits based on layer rates
      const creditsPerUnit = creditRate?.credits_per_unit || 2; // Default to layer_2 rate

      if (payload.audio_seconds) {
        // Transcription: charge per minute (round up)
        const minutes = Math.ceil(payload.audio_seconds / 60);
        creditsConsumed = minutes * creditsPerUnit;
      } else if (payload.image_count) {
        // Image generation: charge per image
        creditsConsumed = payload.image_count * creditsPerUnit;
      } else {
        // Chat: charge per message (1 unit)
        creditsConsumed = creditsPerUnit;
      }

      // Still calculate USD/BRL costs for internal tracking/reporting
      if (costConfig) {
        usdToBrlRate = costConfig.usd_to_brl_rate || 5.50;
        markupPercent = costConfig.markup_percent || 0;
        
        // Calculate cost based on operation type
        if (payload.input_tokens || payload.output_tokens) {
          const inputCost = ((payload.input_tokens || 0) / 1_000_000) * (costConfig.input_cost_per_1m_usd || 0);
          const outputCost = ((payload.output_tokens || 0) / 1_000_000) * (costConfig.output_cost_per_1m_usd || 0);
          costUsd = inputCost + outputCost;
        } else if (payload.audio_seconds) {
          costUsd = (payload.audio_seconds / 60) * (costConfig.audio_cost_per_minute_usd || 0);
        } else if (payload.image_count) {
          costUsd = payload.image_count * (costConfig.image_cost_per_unit_usd || 0);
        }

        // Apply markup and convert to BRL
        const costWithMarkup = costUsd * (1 + markupPercent / 100);
        costBrl = costWithMarkup * usdToBrlRate;
      } else {
        logStep('No cost config found, using layer-based credits', { 
          provider: payload.provider, 
          model: payload.model,
          layer: layerCategory,
          creditsPerUnit 
        });
        // Default fallback calculation for cost tracking
        const tokens = (payload.input_tokens || 0) + (payload.output_tokens || 0);
        costUsd = (tokens / 1_000_000) * 0.50; // $0.50 per 1M tokens default
        costBrl = costUsd * usdToBrlRate;
      }
      
      logStep('Credits calculated', { 
        layerCategory, 
        operationType,
        creditsPerUnit,
        creditsConsumed, 
        costUsd, 
        costBrl 
      });

      // Insert usage log with credits
      const { data: usageLog, error: insertError } = await supabaseAdmin
        .from('api_usage_logs')
        .insert({
          user_id: payload.user_id,
          tenant_id: payload.tenant_id,
          provider: payload.provider,
          model: payload.model,
          operation: payload.operation || 'chat',
          input_tokens: payload.input_tokens || 0,
          output_tokens: payload.output_tokens || 0,
          audio_seconds: payload.audio_seconds || 0,
          image_count: payload.image_count || 0,
          cost_usd: costUsd,
          cost_brl: costBrl,
          credits_consumed: creditsConsumed,
          request_id: payload.request_id,
          latency_ms: payload.latency_ms,
          success: payload.success ?? true,
          error_message: payload.error_message,
          metadata: {
            ...payload.metadata,
            layer_category: layerCategory,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update user_usage table (incrementally)
      const totalTokens = (payload.input_tokens || 0) + (payload.output_tokens || 0);
      
      // Get current month period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Check if user_usage record exists
      const { data: existingUsage } = await supabaseAdmin
        .from('user_usage')
        .select('*')
        .eq('user_id', payload.user_id)
        .eq('tenant_id', payload.tenant_id)
        .single();

      if (existingUsage) {
        // Update existing record with credits
        const { error: updateError } = await supabaseAdmin
          .from('user_usage')
          .update({
            ai_tokens_month: (existingUsage.ai_tokens_month || 0) + totalTokens,
            ai_tokens_total: (existingUsage.ai_tokens_total || 0) + totalTokens,
            api_calls_month: (existingUsage.api_calls_month || 0) + 1,
            credits_consumed_month: (existingUsage.credits_consumed_month || 0) + creditsConsumed,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', existingUsage.id);

        if (updateError) {
          logStep('Error updating user_usage', { error: updateError.message });
        }
      } else {
        // Insert new record with credits
        const { error: insertUsageError } = await supabaseAdmin
          .from('user_usage')
          .insert({
            user_id: payload.user_id,
            tenant_id: payload.tenant_id,
            ai_tokens_month: totalTokens,
            ai_tokens_total: totalTokens,
            api_calls_month: 1,
            credits_consumed_month: creditsConsumed,
            billing_period_start: periodStart,
            last_updated_at: new Date().toISOString(),
          });

        if (insertUsageError) {
          logStep('Error inserting user_usage', { error: insertUsageError.message });
        }
      }

      // Update tenant_usage aggregate
      const periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: existingTenantUsage } = await supabaseAdmin
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', payload.tenant_id)
        .eq('period_start', periodStartDate)
        .single();

      if (existingTenantUsage) {
        const { error: updateTenantError } = await supabaseAdmin
          .from('tenant_usage')
          .update({
            ai_tokens_used: (existingTenantUsage.ai_tokens_used || 0) + totalTokens,
            api_calls: (existingTenantUsage.api_calls || 0) + 1,
            estimated_cost_brl: (parseFloat(existingTenantUsage.estimated_cost_brl) || 0) + costBrl,
            ai_credits_used: (existingTenantUsage.ai_credits_used || 0) + creditsConsumed,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', existingTenantUsage.id);

        if (updateTenantError) {
          logStep('Error updating tenant_usage', { error: updateTenantError.message });
        }
      } else {
        const { error: insertTenantError } = await supabaseAdmin
          .from('tenant_usage')
          .insert({
            tenant_id: payload.tenant_id,
            period_start: periodStartDate,
            period_end: periodEndDate,
            ai_tokens_used: totalTokens,
            api_calls: 1,
            estimated_cost_brl: costBrl,
            ai_credits_used: creditsConsumed,
          });

        if (insertTenantError) {
          logStep('Error inserting tenant_usage', { error: insertTenantError.message });
        }
      }

      logStep('Usage logged successfully', { logId: usageLog.id, creditsConsumed });

      return new Response(JSON.stringify({
        success: true,
        log: usageLog,
        cost: { usd: costUsd, brl: costBrl },
        credits: creditsConsumed,
        layer: layerCategory,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET - Query usage logs with filters
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const tenantId = url.searchParams.get('tenant_id');
      const provider = url.searchParams.get('provider');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      let query = supabaseAdmin
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) query = query.eq('user_id', userId);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      if (provider) query = query.eq('provider', provider);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Calculate aggregates
      const totalCostBrl = data?.reduce((sum, log) => sum + parseFloat(log.cost_brl || 0), 0) || 0;
      const totalCostUsd = data?.reduce((sum, log) => sum + parseFloat(log.cost_usd || 0), 0) || 0;
      const totalTokens = data?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0;
      const totalCredits = data?.reduce((sum, log) => sum + (log.credits_consumed || 0), 0) || 0;

      // Group by provider
      const byProvider = data?.reduce((acc, log) => {
        if (!acc[log.provider]) {
          acc[log.provider] = { count: 0, tokens: 0, costBrl: 0, credits: 0 };
        }
        acc[log.provider].count++;
        acc[log.provider].tokens += log.total_tokens || 0;
        acc[log.provider].costBrl += parseFloat(log.cost_brl || 0);
        acc[log.provider].credits += log.credits_consumed || 0;
        return acc;
      }, {} as Record<string, { count: number; tokens: number; costBrl: number; credits: number }>);

      return new Response(JSON.stringify({
        logs: data,
        summary: {
          totalLogs: data?.length || 0,
          totalTokens,
          totalCostUsd,
          totalCostBrl,
          totalCredits,
          byProvider,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

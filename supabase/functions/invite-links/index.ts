import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INVITE-LINKS] ${step}${detailsStr}`);
};

// Generate a readable invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;
    logStep('User authenticated', { userId });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1] || 'list';

    // GET requests - no body parsing
    if (req.method === 'GET') {
      if (action === 'list' || action === 'invite-links') {
        // List user's invite links
        const { data: links, error } = await supabaseAdmin
          .from('invite_links')
          .select('*')
          .eq('sales_rep_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ links }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate invite code (public)
      const code = url.searchParams.get('code');
      if (code) {
        const { data: link, error } = await supabaseAdmin
          .from('invite_links')
          .select('*')
          .eq('code', code.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error || !link) {
          return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired code' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if expired
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          return new Response(JSON.stringify({ valid: false, error: 'Link expired' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check max uses
        if (link.max_uses && link.used_count >= link.max_uses) {
          return new Response(JSON.stringify({ valid: false, error: 'Link usage limit reached' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          valid: true,
          planType: link.plan_type,
          trialDays: link.trial_days,
          discountPercent: link.discount_percent,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Default: list links
      const { data: links, error } = await supabaseAdmin
        .from('invite_links')
        .select('*')
        .eq('sales_rep_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ links }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST requests - parse body safely
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      if (body.action === 'create') {
        // Create new invite link
        const {
          planType = 'starter',
          trialDays = 30,
          discountPercent = 0,
          maxUses,
          expiresInDays,
        } = body;

        let expiresAt = null;
        if (expiresInDays) {
          expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
        }

        const code = generateInviteCode();

        const { data: link, error } = await supabaseAdmin
          .from('invite_links')
          .insert({
            code,
            sales_rep_id: userId,
            plan_type: planType,
            trial_days: trialDays,
            discount_percent: discountPercent,
            max_uses: maxUses || null,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) throw error;

        logStep('Link created', { code, planType });

        const origin = req.headers.get('origin') || 'https://uopa.app';
        const inviteUrl = `${origin}/signup?ref=${code}`;

        return new Response(JSON.stringify({
          success: true,
          link,
          inviteUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'toggle') {
        const { linkId, isActive } = body;
        if (!linkId) throw new Error('linkId is required');

        const { error } = await supabaseAdmin
          .from('invite_links')
          .update({ is_active: isActive })
          .eq('id', linkId)
          .eq('sales_rep_id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'use') {
        // Mark link as used (increment counter)
        const { code } = body;
        if (!code) throw new Error('code is required');

        const { error } = await supabaseAdmin.rpc('increment_invite_link_usage', {
          _code: code.toUpperCase(),
        });

        // If RPC doesn't exist, do manual update
        if (error) {
          await supabaseAdmin
            .from('invite_links')
            .update({ used_count: supabaseAdmin.rpc('increment', { x: 1 }) })
            .eq('code', code.toUpperCase());
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'deactivate') {
        const { linkId } = body;
        if (!linkId) throw new Error('linkId is required');

        const { error } = await supabaseAdmin
          .from('invite_links')
          .update({ is_active: false })
          .eq('id', linkId)
          .eq('sales_rep_id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'extend_trial') {
        // Extend trial for a tenant (sales rep only)
        const { tenantId, extraDays } = body;
        if (!tenantId || !extraDays) throw new Error('tenantId and extraDays are required');

        // Verify the tenant belongs to this sales rep
        const { data: tenant, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('id, sales_rep_id, trial_days, current_period_end')
          .eq('id', tenantId)
          .single();

        if (tenantError || !tenant) throw new Error('Tenant not found');
        if (tenant.sales_rep_id !== userId) throw new Error('Not authorized for this tenant');

        // Update trial
        const newTrialDays = (tenant.trial_days || 0) + extraDays;
        let newPeriodEnd = tenant.current_period_end
          ? new Date(tenant.current_period_end)
          : new Date();
        newPeriodEnd.setDate(newPeriodEnd.getDate() + extraDays);

        const { error: updateError } = await supabaseAdmin
          .from('tenants')
          .update({
            trial_days: newTrialDays,
            current_period_end: newPeriodEnd.toISOString(),
          })
          .eq('id', tenantId);

        if (updateError) throw updateError;

        logStep('Trial extended', { tenantId, extraDays, newTrialDays });

        return new Response(JSON.stringify({
          success: true,
          newTrialDays,
          newPeriodEnd: newPeriodEnd.toISOString(),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Missing or invalid action. Allowed: create, toggle, use, deactivate, extend_trial`);
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed', allowed: ['GET', 'POST'] }), {
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

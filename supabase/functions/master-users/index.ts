import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

// Remote CRM Supabase (where tenants operate)
const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL') || '';
const REMOTE_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-USERS] ${step}${detailsStr}`);
};

// Valid app_role enum values
const VALID_ROLES = ['admin', 'manager', 'seller'] as const;
type AppRole = typeof VALID_ROLES[number];

function mapToValidRole(role: string | undefined): AppRole {
  if (role && VALID_ROLES.includes(role as AppRole)) {
    return role as AppRole;
  }
  // Map legacy roles
  if (role === 'user' || role === 'viewer') return 'seller';
  if (role === 'super_admin') return 'admin';
  return 'seller';
}

// Send welcome email directly via Resend API (no dependency on separate function)
async function sendWelcomeEmailDirect(email: string, name: string, tenantId: string, tempPassword: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    logStep('RESEND_API_KEY not configured, skipping welcome email');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const firstName = (name || '').split(' ')[0] || 'usuário';
  logStep('Sending welcome email via Resend', { email, name, tenantId });

  const logoUrl = 'https://btoyclznuuwvxbsacemw.supabase.co/storage/v1/object/public/branding/uopa-logo-color.png';

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f5;padding:48px 16px;">
    <tr>
      <td align="center">
        <!-- Logo above card -->
        <table width="580" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${logoUrl}" alt="Uôpa CRM" width="160" style="display:block;max-width:160px;height:auto;" />
            </td>
          </tr>
        </table>
        <!-- Main card -->
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(99,102,241,0.12);">
          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);padding:40px 48px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:800;letter-spacing:-0.5px;">Bem-vindo ao Uôpa! 🎉</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;font-weight:400;">Sua jornada no Uôpa CRM começa agora</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 48px 32px;">
              <p style="font-size:17px;color:#18181b;line-height:1.7;margin:0 0 20px;">
                Olá <strong>${firstName}</strong>,
              </p>
              <p style="font-size:16px;color:#3f3f46;line-height:1.7;margin:0 0 20px;">
                Sua conta no <strong>Uôpa CRM</strong> foi criada com sucesso! Use os dados abaixo para fazer seu primeiro acesso:
              </p>
              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#f5f3ff;border:1px solid #e9e5ff;border-radius:12px;padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px;">
                          <span style="font-size:15px;color:#18181b;font-weight:600;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #e9e5ff;padding:12px 0 4px;">
                          <span style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Senha temporária</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size:18px;color:#6366f1;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">${tempPassword}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;color:#71717a;line-height:1.6;margin:0 0 28px;">
                ⚠️ Recomendamos que você altere sua senha no primeiro acesso para maior segurança.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://uopacrm.com" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                      Acessar o Uôpa CRM →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:28px 48px;background-color:#fafafa;border-top:1px solid #f0f0f5;text-align:center;">
              <p style="font-size:13px;color:#a1a1aa;margin:0 0 8px;font-weight:500;">
                Uôpa CRM — Transformando vendas em resultados
              </p>
              <p style="font-size:12px;color:#d4d4d8;margin:0;">
                Este email foi enviado automaticamente. Se você não solicitou esta conta, ignore este email.<br/>
                © ${new Date().getFullYear()} Uôpa CRM. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Uopa CRM <boasvindas@uopacrm.com>',
        to: [email],
        subject: `Bem-vindo ao Uôpa CRM, ${firstName}! 🎉`,
        html: htmlContent,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      logStep('Resend API error', { status: res.status, error: JSON.stringify(result) });
      return { ok: false, error: result };
    }
    logStep('Welcome email sent successfully', { email, id: result.id });
    return { ok: true, id: result.id };
  } catch (error) {
    logStep('Welcome email error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  logStep('Request received', { method: req.method, url: req.url, origin: req.headers.get('origin') });

  if (req.method === 'OPTIONS') {
    logStep('CORS preflight handled');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  // Remote CRM client (for dual-write)
  const crmSupabase = REMOTE_SUPABASE_URL && REMOTE_SUPABASE_SERVICE_ROLE_KEY
    ? createClient(REMOTE_SUPABASE_URL, REMOTE_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const currentUserId = userData.user.id;
    logStep('User authenticated', { userId: currentUserId });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Support both URL path and x-path-suffix header
    const pathSuffix = req.headers.get('x-path-suffix');
    let tenantId: string | undefined;
    let targetUserId: string | undefined;
    let isCheckRoute = false;
    let action: string | undefined;
    
    if (pathSuffix) {
      const suffixParts = pathSuffix.split('/').filter(Boolean);
      // Check for special "check/{userId}" route for master user verification
      if (suffixParts[0] === 'check') {
        isCheckRoute = true;
        targetUserId = suffixParts[1];
      } else {
        tenantId = suffixParts[0];
        targetUserId = suffixParts[1];
        action = suffixParts[2]; // e.g. "resend-welcome"
      }
    } else {
      if (pathParts[1] === 'check') {
        isCheckRoute = true;
        targetUserId = pathParts[2];
      } else {
        tenantId = pathParts[1];
        targetUserId = pathParts[2];
        action = pathParts[3];
      }
    }
    const method = req.method;

    // Handle check route: GET /master-users/check/{userId}
    // This verifies if a user is a master_user (bypasses RLS)
    if (isCheckRoute && method === 'GET' && targetUserId) {
      logStep('Checking master user status', { targetUserId });
      
      const { data: masterUser, error: masterError } = await supabaseAdmin
        .from('master_users')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (masterError) {
        logStep('Master user check failed', { error: masterError.message });
        return new Response(
          JSON.stringify({ user: null, isMasterUser: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logStep('Master user check result', { found: !!masterUser });
      
      return new Response(
        JSON.stringify({ 
          user: masterUser, 
          isMasterUser: !!masterUser 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`${method} request`, { tenantId, targetUserId, action, pathSuffix });

    // POST /master-users/:tenantId/:userId/resend-welcome - Resend welcome email
    if (method === 'POST' && targetUserId && action === 'resend-welcome') {
      logStep('Resending welcome email', { targetUserId, tenantId });

      // Get user info
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (authErr || !authData.user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userEmail = authData.user.email || '';
      const userName = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '';

      // Generate a new temporary password and update the user
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let newTempPassword = '';
      for (let i = 0; i < 12; i++) {
        newTempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newTempPassword,
      });

      if (updateErr) {
        logStep('Failed to reset password for resend', { error: updateErr.message });
        return new Response(
          JSON.stringify({ error: 'Falha ao gerar nova senha temporária' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send email directly via Resend API
      const emailResult = await sendWelcomeEmailDirect(userEmail, userName, tenantId, newTempPassword);

      if (!emailResult.ok) {
        logStep('Resend welcome email failed', { error: emailResult.error });
        return new Response(
          JSON.stringify({ error: 'Falha ao reenviar email de boas-vindas', details: emailResult.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logStep('Welcome email resent successfully', { email: userEmail });
      return new Response(
        JSON.stringify({ success: true, message: 'Email de boas-vindas reenviado', temp_password: newTempPassword }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-users/:tenantId - List users of a tenant
    if (method === 'GET' && !targetUserId) {
      // Get profiles for this tenant
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Get user roles for these profiles
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      // Get auth users for email and metadata
      const users = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          const authUser = authData?.user;
          const userRole = roles?.find(r => r.user_id === profile.id);
          
          // Check if user is banned by looking at user_metadata or ban_duration
          const isBanned = authUser?.user_metadata?.banned === true || 
                          (authUser as unknown as { banned_at?: string })?.banned_at != null;
          
          return {
            id: profile.id,
            email: authUser?.email || '',
            name: profile.full_name || '',
            full_name: profile.full_name || '',
            role: userRole?.role || 'viewer',
            status: isBanned ? 'inactive' : 'active',
            is_active: !isBanned,
            created_at: profile.created_at,
            last_login: authUser?.last_sign_in_at || null,
          };
        })
      );

      logStep('Users fetched', { count: users.length });

      return new Response(
        JSON.stringify({ data: users, total: users.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-users/:tenantId/:userId - Get single user
    if (method === 'GET' && targetUserId) {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      if (!profile) throw new Error('User not found');

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      const authUser = authData?.user;
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();

      // Check if user is banned
      const isBanned = authUser?.user_metadata?.banned === true || 
                      (authUser as unknown as { banned_at?: string })?.banned_at != null;

      const user = {
        id: profile.id,
        email: authUser?.email || '',
        name: profile.full_name || '',
        full_name: profile.full_name || '',
        role: userRole?.role || 'viewer',
        status: isBanned ? 'inactive' : 'active',
        is_active: !isBanned,
        created_at: profile.created_at,
        last_login: authUser?.last_sign_in_at || null,
      };

      return new Response(
        JSON.stringify(user),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guard: if POST has a specific action but it wasn't handled above, return 404
    if (method === 'POST' && targetUserId && action) {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${action}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-users/:tenantId - Create user for tenant
    if (method === 'POST') {
      const body = await req.json();
      logStep('Creating user', { email: body.email, role: body.role, tenantId });

      const fullName = String(body.full_name || body.name || '').trim();

      // Validate required fields
      if (!body.email || !body.password || !fullName) {
        return new Response(
          JSON.stringify({ error: 'Email, nome e senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user with this email already exists (filtered lookup)
      const { data: { users: matchedUsers } } = await supabaseAdmin.auth.admin.listUsers({
        filter: body.email,
      });
      const existingUser = matchedUsers?.find(u => u.email === body.email);
      if (existingUser) {
        logStep('User already exists', { email: body.email, existingUserId: existingUser.id });
        return new Response(
          JSON.stringify({ error: 'Um usuário com este email já existe' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create auth user with tenant_id and role in metadata (required by handle_new_user trigger)
      const appRole = mapToValidRole(body.role);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          tenant_id: tenantId,
          role: appRole,
        },
      });

      if (authError) {
        const authErrorInfo = {
          message: authError.message,
          code: (authError as unknown as { code?: string }).code,
          status: (authError as unknown as { status?: number }).status,
        };

        logStep('Auth user creation failed', {
          ...authErrorInfo,
          details: JSON.stringify(authError),
        });

        return new Response(
          JSON.stringify({
            error: `Erro ao criar usuário (${authErrorInfo.code || 'unknown'}): ${authErrorInfo.message}`,
            auth: authErrorInfo,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const authUser = authData.user;
      logStep('Auth user created', { authUserId: authUser.id });

      // Upsert profile (trigger may have already created it)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.id,
          tenant_id: tenantId,
          full_name: fullName,
          name: fullName,
          is_active: true,
        }, { onConflict: 'id' });

      if (profileError) {
        logStep('Profile upsert failed', { error: profileError.message });
        // Don't fail - trigger may have created it successfully
      } else {
        logStep('Profile upserted');
      }

      // Assign user role with fallback strategy (appRole already computed above)
      try {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authUser.id,
            tenant_id: tenantId,
            role: appRole,
          }, { onConflict: 'user_id,tenant_id' });
        if (roleError) throw roleError;
        logStep('User role upserted', { role: appRole });
      } catch (roleErr) {
        logStep('Upsert failed, trying delete+insert fallback', { error: roleErr instanceof Error ? roleErr.message : roleErr });
        // Fallback: delete existing + insert new
        await supabaseAdmin.from('user_roles')
          .delete().eq('user_id', authUser.id).eq('tenant_id', tenantId);
        const { error: insertRoleError } = await supabaseAdmin.from('user_roles')
          .insert({ user_id: authUser.id, tenant_id: tenantId, role: appRole });
        if (insertRoleError) {
          logStep('Role insert fallback also failed', { error: insertRoleError.message });
        } else {
          logStep('User role inserted via fallback', { role: appRole });
        }
      }

      // ===== DUAL-WRITE: Create user in CRM =====
      if (crmSupabase) {
        try {
          logStep('Creating user in CRM (dual-write)', { email: body.email, tenantId });

          // Create auth user in CRM with same metadata
          const { data: crmAuthData, error: crmAuthError } = await crmSupabase.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              name: fullName,
              tenant_id: tenantId,
              role: appRole,
            },
          });

          if (crmAuthError) {
            logStep('CRM user creation failed (non-blocking)', { error: crmAuthError.message });
          } else {
            logStep('CRM user created successfully', { crmUserId: crmAuthData.user?.id });

            // Upsert profile in CRM (trigger may handle it, but ensure consistency)
            if (crmAuthData.user) {
              await crmSupabase.from('profiles').upsert({
                id: crmAuthData.user.id,
                tenant_id: tenantId,
                full_name: fullName,
                name: fullName,
                email: body.email,
                is_active: true,
              }, { onConflict: 'id' });

              // Upsert role in CRM
              await crmSupabase.from('user_roles').upsert({
                user_id: crmAuthData.user.id,
                tenant_id: tenantId,
                role: appRole,
              }, { onConflict: 'user_id,tenant_id' });

              logStep('CRM profile and role synced');
            }
          }
        } catch (crmErr) {
          logStep('CRM dual-write error (non-blocking)', { error: crmErr instanceof Error ? crmErr.message : crmErr });
        }
      }

      // Send welcome email in background (non-blocking)
      EdgeRuntime.waitUntil(sendWelcomeEmailDirect(
        body.email,
        body.full_name || body.name || '',
        tenantId,
        body.password || ''
      ));

      return new Response(
        JSON.stringify({
          id: authUser.id,
          email: authUser.email,
          name: body.full_name || body.name,
          full_name: body.full_name || body.name,
          role: appRole,
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: null,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-users/:tenantId/:userId - Update user
    if (method === 'PATCH' && targetUserId) {
      const body = await req.json();
      logStep('Updating user', { targetUserId, updates: Object.keys(body) });

      // Update profile
      if (body.full_name || body.name) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name: body.full_name || body.name })
          .eq('id', targetUserId)
          .eq('tenant_id', tenantId);

        if (profileError) {
          logStep('Profile update failed', { error: profileError.message });
        }
      }

      // Update user role if changed
      if (body.role) {
        const appRole = mapToValidRole(body.role);
        logStep('Updating role', { from: body.role, to: appRole });
        
        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('tenant_id', tenantId)
          .single();

        if (existingRole) {
          await supabaseAdmin
            .from('user_roles')
            .update({ role: appRole })
            .eq('user_id', targetUserId)
            .eq('tenant_id', tenantId);
        } else {
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: targetUserId,
              tenant_id: tenantId,
              role: appRole,
            });
        }
      }

      // Update password if provided
      if (body.password) {
        logStep('Updating password for user', { targetUserId });
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { password: body.password }
        );
        
        if (passwordError) {
          logStep('Password update failed', { error: passwordError.message });
          return new Response(
            JSON.stringify({ error: 'Failed to update password: ' + passwordError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        logStep('Password updated successfully');
      }

      // ===== DUAL-WRITE: Sync edits to CRM =====
      if (crmSupabase) {
        try {
          logStep('Syncing user edits to CRM', { targetUserId, tenantId });

          // Find CRM user by email
          const { data: masterAuth } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
          const userEmail = masterAuth?.user?.email;

          if (userEmail) {
            const { data: { users: crmUsers } } = await crmSupabase.auth.admin.listUsers({ filter: userEmail });
            const crmUser = crmUsers?.find(u => u.email === userEmail);

            if (crmUser) {
              // Sync profile
              if (body.full_name || body.name) {
                const nameVal = body.full_name || body.name;
                await crmSupabase.from('profiles')
                  .update({ full_name: nameVal, name: nameVal })
                  .eq('id', crmUser.id)
                  .eq('tenant_id', tenantId);
              }

              // Sync role
              if (body.role) {
                const appRoleSync = mapToValidRole(body.role);
                await crmSupabase.from('user_roles')
                  .upsert({ user_id: crmUser.id, tenant_id: tenantId, role: appRoleSync }, { onConflict: 'user_id,tenant_id' });
              }

              // Sync password
              if (body.password) {
                await crmSupabase.auth.admin.updateUserById(crmUser.id, { password: body.password });
              }

              logStep('CRM user synced', { crmUserId: crmUser.id });
            } else {
              logStep('CRM user not found for sync (will be created on next login)', { email: userEmail });
            }
          }
        } catch (crmErr) {
          logStep('CRM sync error (non-blocking)', { error: crmErr instanceof Error ? crmErr.message : crmErr });
        }
      }

      logStep('User updated', { targetUserId, tenantId });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-users/:tenantId/:userId - Deactivate user
    if (method === 'DELETE' && targetUserId) {
      logStep('Deactivating user', { targetUserId });
      
      // Ban the user in auth
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876000h', // ~100 years
      });

      if (banError) {
        logStep('User ban failed', { error: banError.message });
        throw banError;
      }

      logStep('User deactivated', { targetUserId, tenantId });

      return new Response(
        JSON.stringify({ success: true, message: 'User deactivated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

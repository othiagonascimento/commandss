import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
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

function normalizeAuthError(error: unknown) {
  const err = error as { message?: string; code?: string; status?: number } | null;
  return {
    message: err?.message || 'Unknown auth error',
    code: err?.code,
    status: err?.status,
  };
}

function isDatabaseCreateUserError(error: unknown): boolean {
  const normalized = normalizeAuthError(error);
  const message = (normalized.message || '').toLowerCase();
  return normalized.code === 'unexpected_failure' || message.includes('database error creating new user');
}

async function createUserWithMetadataFallback(
  client: ReturnType<typeof createClient>,
  params: {
    email: string;
    password: string;
    fullName: string;
    tenantId: string;
    appRole: AppRole;
    logContext: string;
  }
) {
  const { email, password, fullName, tenantId, appRole, logContext } = params;

  const firstAttempt = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
      tenant_id: tenantId,
      role: appRole,
    },
  });

  if (!firstAttempt.error && firstAttempt.data.user) {
    logStep(`${logContext} createUser succeeded`, { strategy: 'with_metadata', userId: firstAttempt.data.user.id });
    return { user: firstAttempt.data.user, strategy: 'with_metadata' as const, firstAttemptError: null };
  }

  const firstAttemptError = normalizeAuthError(firstAttempt.error);
  logStep(`${logContext} createUser first attempt failed`, { strategy: 'with_metadata', ...firstAttemptError });

  if (!isDatabaseCreateUserError(firstAttempt.error)) {
    return { user: null, strategy: 'with_metadata' as const, firstAttemptError };
  }

  const fallbackAttempt = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });

  if (!fallbackAttempt.error && fallbackAttempt.data.user) {
    logStep(`${logContext} createUser succeeded`, { strategy: 'without_metadata', userId: fallbackAttempt.data.user.id });
    return { user: fallbackAttempt.data.user, strategy: 'without_metadata' as const, firstAttemptError };
  }

  const fallbackAttemptError = normalizeAuthError(fallbackAttempt.error);
  logStep(`${logContext} createUser fallback failed`, { strategy: 'without_metadata', ...fallbackAttemptError });
  return {
    user: null,
    strategy: 'without_metadata' as const,
    firstAttemptError,
    fallbackAttemptError,
  };
}

// Fetch logo and convert to base64 data URI for inline embedding (uses Deno std base64)
async function getLogoBase64(): Promise<string> {
  try {
    // Try multiple logo sources for reliability
    const logoUrls = [
      'https://btoyclznuuwvxbsacemw.supabase.co/storage/v1/object/public/branding/uopa-logo-color.png',
      'https://commandss.lovable.app/images/uopa-logo-email.png',
    ];
    let res: Response | null = null;
    for (const url of logoUrls) {
      try {
        const r = await fetch(url);
        if (r.ok) { res = r; logStep('Logo fetched from', { url }); break; }
      } catch (_) { /* try next */ }
    }
    if (!res) throw new Error('All logo URLs failed');
    const buf = await res.arrayBuffer();
    const b64 = base64Encode(new Uint8Array(buf));
    logStep('Logo base64 conversion success', { size: buf.byteLength });
    return `data:image/png;base64,${b64}`;
  } catch (e) {
    logStep('Logo base64 conversion failed', { error: e instanceof Error ? e.message : 'unknown' });
    return '';
  }
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

  const logoDataUri = await getLogoBase64();
  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Uôpa CRM" width="140" style="display:block;max-width:140px;height:auto;" />`
    : `<span style="font-size:28px;font-weight:800;color:#2d2b55;letter-spacing:-1px;">UÔPA <span style="color:#a1a1aa;font-weight:400;font-size:16px;">CRM</span></span>`;

  const year = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f2ee;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ee;padding:40px 16px;">
    <tr><td align="center">

      <!-- Logo -->
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding:0 0 32px;">${logoHtml}</td></tr>
      </table>

      <!-- Main Card -->
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;">

        <!-- Avatar + Headline Block -->
        <tr>
          <td style="padding:48px 44px 0;">
            <h1 style="margin:0;font-size:32px;font-weight:800;color:#1a1a2e;line-height:1.2;letter-spacing:-0.5px;">
              Que bom ter você aqui, ${firstName}! 🎉
            </h1>
            <p style="margin:16px 0 0;font-size:17px;color:#4a4a68;line-height:1.7;">
              A gente preparou tudo pra você. Seu espaço no Uôpa CRM já está pronto — e a gente tá muito feliz com isso.
            </p>
          </td>
        </tr>

        <!-- Highlight Band (Will Bank style) -->
        <tr>
          <td style="padding:28px 44px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a78bfa 100%);border-radius:16px;">
              <tr>
                <td style="padding:28px 32px;">
                  <p style="margin:0;font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:0.3px;">
                    PRA COMEÇAR
                  </p>
                  <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                    Separamos seus dados de acesso 👇
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Credentials Box -->
        <tr>
          <td style="padding:24px 44px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #ededf5;border-radius:14px;overflow:hidden;">
              <!-- Email row -->
              <tr>
                <td style="padding:20px 24px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="32" valign="top" style="padding-right:12px;">
                        <span style="font-size:20px;">✉️</span>
                      </td>
                      <td>
                        <span style="font-size:12px;color:#9191ab;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Seu email</span><br/>
                        <span style="font-size:16px;color:#1a1a2e;font-weight:600;line-height:1.8;">${email}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Divider -->
              <tr><td style="padding:0 24px;"><div style="border-top:1px solid #ededf5;"></div></td></tr>
              <!-- Password row -->
              <tr>
                <td style="padding:16px 24px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="32" valign="top" style="padding-right:12px;">
                        <span style="font-size:20px;">🔑</span>
                      </td>
                      <td>
                        <span style="font-size:12px;color:#9191ab;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Senha temporária</span><br/>
                        <span style="font-size:20px;color:#6366f1;font-weight:800;font-family:'Courier New',Courier,monospace;letter-spacing:2px;line-height:1.8;">${tempPassword}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Security Tip -->
        <tr>
          <td style="padding:20px 44px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;border-radius:12px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#6b6b80;line-height:1.6;">
                    💡 <strong style="color:#4a4a68;">Dica:</strong> troque sua senha no primeiro acesso. Segurança nunca é demais.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:32px 44px 0;" align="center">
            <a href="https://uopacrm.com" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:60px;font-size:17px;font-weight:700;letter-spacing:0.3px;mso-padding-alt:0;">
              Acessar minha conta →
            </a>
          </td>
        </tr>

        <!-- Emotional Closing -->
        <tr>
          <td style="padding:36px 44px 0;">
            <p style="margin:0;font-size:16px;color:#4a4a68;line-height:1.7;">
              Estamos juntos nessa jornada.<br/>Conte com a gente! 💜
            </p>
            <p style="margin:20px 0 0;font-size:15px;color:#9191ab;font-style:italic;">
              Com carinho,<br/>
              <strong style="color:#4a4a68;font-style:normal;">Equipe Uôpa CRM</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:36px 44px 32px;">
            <div style="border-top:1px solid #ededf5;padding-top:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#b5b5c3;">
                © ${year} Uôpa CRM — Transformando vendas em resultados
              </p>
              <p style="margin:0;font-size:11px;color:#d0d0d8;">
                Este email foi enviado automaticamente. Se você não solicitou esta conta, ignore este email.
              </p>
            </div>
          </td>
        </tr>

      </table>

    </td></tr>
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
        subject: `${firstName}, sua conta no Uôpa CRM está pronta!`,
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

      logStep('Welcome email resent successfully', { email: userEmail, resendId: emailResult.id });
      return new Response(
        JSON.stringify({ success: true, message: 'Email de boas-vindas reenviado', temp_password: newTempPassword, resend_id: emailResult.id }),
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

      // Create auth user with robust strategy:
      // 1) preferred path: with tenant metadata (supports trigger-based provisioning)
      // 2) fallback path: without tenant metadata only when DB createUser fails
      const appRole = mapToValidRole(body.role);
      const createResult = await createUserWithMetadataFallback(supabaseAdmin, {
        email: body.email,
        password: body.password,
        fullName,
        tenantId,
        appRole,
        logContext: 'MASTER',
      });

      if (!createResult.user) {
        return new Response(
          JSON.stringify({
            error: `Erro ao criar usuário (${createResult.fallbackAttemptError?.code || createResult.firstAttemptError?.code || 'unknown'}): ${createResult.fallbackAttemptError?.message || createResult.firstAttemptError?.message || 'Unknown auth error'}`,
            auth: {
              first_attempt: createResult.firstAttemptError,
              fallback_attempt: createResult.fallbackAttemptError || null,
            },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const authUser = createResult.user;
      logStep('Auth user created', {
        authUserId: authUser.id,
        strategy: createResult.strategy,
      });

      // Manually provision profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.id,
          tenant_id: tenantId,
          full_name: fullName,
          name: fullName,
          email: body.email,
          is_active: true,
          status: 'online',
        }, { onConflict: 'id' });

      if (profileError) {
        logStep('Profile upsert failed', { error: profileError.message });
      } else {
        logStep('Profile upserted');
      }

      // Assign user role with fallback strategy
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

      // Provision user_usage and user_limits (trigger would normally do this)
      const { error: usageError } = await supabaseAdmin
        .from('user_usage')
        .upsert({
          user_id: authUser.id,
          tenant_id: tenantId,
        }, { onConflict: 'user_id,tenant_id' });
      if (usageError) {
        logStep('user_usage upsert failed (non-blocking)', { error: usageError.message });
      } else {
        logStep('user_usage provisioned');
      }

      const { error: limitsError } = await supabaseAdmin
        .from('user_limits')
        .upsert({
          user_id: authUser.id,
          tenant_id: tenantId,
        }, { onConflict: 'user_id,tenant_id' });
      if (limitsError) {
        logStep('user_limits upsert failed (non-blocking)', { error: limitsError.message });
      } else {
        logStep('user_limits provisioned');
      }

      // Now update user metadata with tenant_id and role (for JWT claims and other systems)
      const { error: metaUpdateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          full_name: fullName,
          name: fullName,
          tenant_id: tenantId,
          role: appRole,
        },
      });
      if (metaUpdateError) {
        logStep('Metadata update failed (non-blocking)', { error: metaUpdateError.message });
      } else {
        logStep('User metadata updated with tenant_id and role');
      }

      // ===== DUAL-WRITE: Create user in CRM =====
      if (crmSupabase) {
        try {
          logStep('Creating user in CRM (dual-write)', { email: body.email, tenantId });

          const crmCreateResult = await createUserWithMetadataFallback(crmSupabase, {
            email: body.email,
            password: body.password,
            fullName,
            tenantId,
            appRole,
            logContext: 'CRM',
          });

          if (!crmCreateResult.user) {
            logStep('CRM user creation failed after fallback (non-blocking)', {
              firstAttempt: crmCreateResult.firstAttemptError,
              fallbackAttempt: crmCreateResult.fallbackAttemptError || null,
            });
          } else {
            const crmAuthUser = crmCreateResult.user;
            logStep('CRM user created successfully', { crmUserId: crmAuthUser.id, strategy: crmCreateResult.strategy });

            // Provision profile in CRM
            await crmSupabase.from('profiles').upsert({
              id: crmAuthUser.id,
              tenant_id: tenantId,
              full_name: fullName,
              name: fullName,
              email: body.email,
              is_active: true,
              status: 'online',
            }, { onConflict: 'id' });

            // Provision role in CRM
            await crmSupabase.from('user_roles').upsert({
              user_id: crmAuthUser.id,
              tenant_id: tenantId,
              role: appRole,
            }, { onConflict: 'user_id,tenant_id' });

            // Provision usage and limits in CRM
            await crmSupabase.from('user_usage').upsert({
              user_id: crmAuthUser.id,
              tenant_id: tenantId,
            }, { onConflict: 'user_id,tenant_id' });

            await crmSupabase.from('user_limits').upsert({
              user_id: crmAuthUser.id,
              tenant_id: tenantId,
            }, { onConflict: 'user_id,tenant_id' });

            // Keep CRM metadata canonical
            await crmSupabase.auth.admin.updateUserById(crmAuthUser.id, {
              user_metadata: {
                full_name: fullName,
                name: fullName,
                tenant_id: tenantId,
                role: appRole,
              },
            });

            logStep('CRM profile, role, usage, limits synced');
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

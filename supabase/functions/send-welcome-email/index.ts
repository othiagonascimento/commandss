import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { email, name, tenant_id } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = (name || '').split(' ')[0] || 'usuário';

    console.log(`[send-welcome-email] Sending to ${email} (tenant: ${tenant_id})`);

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Bem-vindo à Uopa! 🎉</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
                Olá <strong>${firstName}</strong>,
              </p>
              <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
                Sua conta foi criada com sucesso! Você já pode acessar a plataforma usando o email <strong>${email}</strong> e a senha fornecida pelo administrador.
              </p>
              <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
                Recomendamos que você altere sua senha no primeiro acesso para maior segurança.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://uopacrm.com" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="font-size:13px;color:#71717a;margin:0;">
                Este email foi enviado automaticamente pela plataforma Uopa.<br/>
                Se você não solicitou esta conta, por favor ignore este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Uopa <boasvindas@uopacrm.com>',
        to: [email],
        subject: `Bem-vindo à Uopa, ${firstName}! 🎉`,
        html: htmlContent,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('[send-welcome-email] Resend error:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-welcome-email] Email sent:', result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-welcome-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, full_name, role_ids } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Master Invite] Creating user: ${email}`);

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        full_name,
        is_master_user: true,
      },
    });

    if (authError) {
      console.error('[Master Invite] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Master Invite] Auth user created: ${authUser.user.id}`);

    // Create master_users record
    const { data: masterUser, error: masterUserError } = await supabase
      .from('master_users')
      .insert({
        user_id: authUser.user.id,
        email,
        full_name,
        is_active: true,
      })
      .select()
      .single();

    if (masterUserError) {
      console.error('[Master Invite] Master user insert error:', masterUserError);
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: `Erro ao criar registro de usuário: ${masterUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Master Invite] Master user created: ${masterUser.id}`);

    // Assign roles if provided
    if (role_ids && role_ids.length > 0) {
      const roleInserts = role_ids.map((roleId: string) => ({
        master_user_id: masterUser.id,
        role_id: roleId,
      }));

      const { error: rolesError } = await supabase
        .from('master_user_roles')
        .insert(roleInserts);

      if (rolesError) {
        console.error('[Master Invite] Roles insert error:', rolesError);
        // Continue without roles - user can be assigned later
      } else {
        console.log(`[Master Invite] Roles assigned: ${role_ids.join(', ')}`);
      }
    }

    // Return success with temporary password
    // In production, you would send this via email instead
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: masterUser.id,
          email: masterUser.email,
          full_name: masterUser.full_name,
        },
        temp_password: tempPassword, // Only for demo - in production, send via email
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Invite] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

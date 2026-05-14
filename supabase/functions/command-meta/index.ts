// Command AI — Meta endpoint.
// Lê catálogos de command_ai (divisions, tool_catalog) para a UI.
// Acesso restrito ao master.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const remoteDb = createClient(
  Deno.env.get("REMOTE_SUPABASE_URL")!,
  Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!,
  { db: { schema: "command_ai" as never }, auth: { persistSession: false } },
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("missing auth");
    const { data: u, error } = await localAuth.auth.getUser(auth.replace("Bearer ", ""));
    if (error || !u.user) throw new Error("invalid token");
    if (u.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [divs, tools] = await Promise.all([
      remoteDb
        .from("divisions")
        .select("id,slug,name,layer,description,manual,default_model,enabled,metrics,updated_at")
        .order("layer"),
      remoteDb
        .from("tool_catalog")
        .select("id,tool_name,domain,risk_level,required_scopes,description,input_schema,enabled,updated_at")
        .order("domain"),
    ]);

    if (divs.error) throw divs.error;
    if (tools.error) throw tools.error;

    return new Response(
      JSON.stringify({
        divisions: divs.data ?? [],
        tools: tools.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

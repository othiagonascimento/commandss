import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // GET - List all onboarding submissions
    if (req.method === "GET") {
      console.log("[master-onboarding] Fetching all submissions");

      const { data, error } = await supabase
        .from("onboarding_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[master-onboarding] Error fetching:", error);
        throw error;
      }

      console.log(`[master-onboarding] Found ${data?.length || 0} submissions`);

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Update status or other actions
    if (req.method === "POST") {
      const body = await req.json();
      const { action, id, status } = body;

      console.log(`[master-onboarding] Action: ${action}, ID: ${id}`);

      if (action === "update_status") {
        if (!id || !status) {
          return new Response(
            JSON.stringify({ error: "Missing id or status" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const validStatuses = ["pending", "approved", "rejected"];
        if (!validStatuses.includes(status)) {
          return new Response(
            JSON.stringify({ error: "Invalid status value" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("onboarding_submissions")
          .update({ status })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("[master-onboarding] Error updating status:", error);
          throw error;
        }

        console.log(`[master-onboarding] Updated ${id} to status: ${status}`);

        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[master-onboarding] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

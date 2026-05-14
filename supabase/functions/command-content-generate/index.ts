// Command AI — Content Generator
// Pipeline: Scribe escreve copy (3 variantes + hashtags via JSON), Atelier gera imagem
// (Gemini image preview), salva imagem em storage e persiste content_item + 3 variants.
// Master only.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MASTER_UUID = "cdc32c8f-32cd-439e-8103-e034d16eebf2";
const BUCKET = "command_ai_assets";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (s: string, d?: unknown) =>
  console.log(`[command-content-generate] ${s}${d ? ` ${JSON.stringify(d)}` : ""}`);

const REMOTE_URL = Deno.env.get("REMOTE_SUPABASE_URL")!;
const REMOTE_SERVICE = Deno.env.get("REMOTE_SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const localAuth = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const remoteDb = createClient(REMOTE_URL, REMOTE_SERVICE, {
  db: { schema: "command_ai" as never },
  auth: { persistSession: false },
});
// Cliente para storage (schema default)
const remoteStorage = createClient(REMOTE_URL, REMOTE_SERVICE, {
  auth: { persistSession: false },
});

const SCRIBE_SYSTEM = `Você é Scribe, copywriter chefe do Uôpa. Escreve curto, com hook,
sem clichê, voz humana e provocadora. Devolve SEMPRE JSON válido neste formato:
{"variants":[{"label":"variante 1","caption":"<até 200 caracteres>","hashtags":["sem #"]},
{"label":"variante 2","caption":"...","hashtags":[...]},
{"label":"variante 3","caption":"...","hashtags":[...]}]}`;

const ATELIER_SYSTEM = `Você é Atelier, diretor visual. Gere uma única imagem editorial
coerente com o brief. Composição limpa, paleta sólida, sem texto sobreposto.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("missing auth");
    const { data: u } = await localAuth.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user || u.user.id !== MASTER_UUID) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      workspace_id,
      brief,
      channel = "instagram",
      format = "post",
      title,
      with_image = true,
    } = await req.json();

    if (!workspace_id || !brief) {
      return new Response(JSON.stringify({ error: "workspace_id + brief required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Brand book do workspace (opcional)
    const { data: brand } = await remoteDb
      .from("brand_books")
      .select("voice, tone, do_list, dont_list, guidelines")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const brandCtx = brand
      ? `\n\nBRAND BOOK:\nVoz: ${brand.voice ?? "—"}\nTom: ${brand.tone ?? "—"}\nDo: ${(brand.do_list ?? []).join(", ")}\nDon't: ${(brand.dont_list ?? []).join(", ")}\n${brand.guidelines ?? ""}`
      : "";

    // 1) SCRIBE — copy
    log("scribe_start");
    const copyRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SCRIBE_SYSTEM + brandCtx },
          {
            role: "user",
            content: `Canal: ${channel} (${format}).\nBrief: ${brief}\n\nDevolva JSON com 3 variantes diferentes (ângulos distintos).`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!copyRes.ok) {
      const t = await copyRes.text();
      throw new Error(`scribe_${copyRes.status}: ${t.slice(0, 200)}`);
    }
    const copyJson = await copyRes.json();
    const raw = copyJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: { variants?: Array<{ label?: string; caption?: string; hashtags?: string[] }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { variants: [] };
    }
    const variants = (parsed.variants ?? []).slice(0, 3);
    if (variants.length === 0) throw new Error("scribe sem variantes");

    // 2) ATELIER — imagem (opcional)
    let imageUrl: string | null = null;
    let imagePath: string | null = null;
    if (with_image) {
      log("atelier_start");
      const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            { role: "system", content: ATELIER_SYSTEM + brandCtx },
            {
              role: "user",
              content: `Brief visual para ${channel} ${format}: ${brief}\nVariante guia: ${variants[0].caption}`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (imgRes.ok) {
        const j = await imgRes.json();
        const b64 =
          j.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
          j.choices?.[0]?.message?.images?.[0]?.url ??
          null;
        if (b64 && typeof b64 === "string" && b64.startsWith("data:image")) {
          const [meta, data] = b64.split(",");
          const mime = meta.match(/data:(.+);base64/)?.[1] ?? "image/png";
          const ext = mime.split("/")[1] ?? "png";
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          const path = `${workspace_id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
          const { error: upErr } = await remoteStorage.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: mime, upsert: false });
          if (!upErr) {
            imagePath = path;
            // signed URL longo para preview
            const { data: signed } = await remoteStorage.storage
              .from(BUCKET)
              .createSignedUrl(path, 60 * 60 * 24 * 30);
            imageUrl = signed?.signedUrl ?? null;
            log("image_uploaded", { path });
          } else {
            log("image_upload_failed", { err: upErr.message });
          }
        } else {
          log("atelier_no_image_in_response");
        }
      } else {
        log("atelier_failed", { status: imgRes.status });
      }
    }

    // 3) Persiste content_item (variante 1 chosen) + variants
    const chosen = variants[0];
    const mediaUrls = imageUrl ? [{ url: imageUrl, path: imagePath }] : [];

    const { data: item, error: itemErr } = await remoteDb
      .from("content_items")
      .insert({
        workspace_id,
        channel,
        format,
        title: title ?? brief.slice(0, 80),
        brief,
        caption: chosen.caption ?? "",
        hashtags: chosen.hashtags ?? [],
        media_urls: mediaUrls,
        status: "draft",
      })
      .select("id")
      .single();
    if (itemErr) throw itemErr;
    const itemId = item.id as string;

    const variantsToInsert = variants.map((v, i) => ({
      content_item_id: itemId,
      label: v.label ?? `variante ${i + 1}`,
      caption: v.caption ?? "",
      hashtags: v.hashtags ?? [],
      media_urls: i === 0 ? mediaUrls : [],
      is_chosen: i === 0,
    }));
    await remoteDb.from("content_variants").insert(variantsToInsert);

    log("content_created", { itemId, variants: variants.length, hasImage: !!imageUrl });

    return new Response(
      JSON.stringify({
        content_item_id: itemId,
        variants: variants.length,
        has_image: !!imageUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    log("error", { err: String(e) });
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

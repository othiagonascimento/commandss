/**
 * Command AI — Onda 6: Calendar / Campaigns / Brand Intel
 * CRUD direto no schema command_ai via commandDb.
 */
import { commandDb } from "./db";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  channel: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  tags: string[] | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string | null;
  status: "draft" | "active" | "paused" | "done";
  channel: string | null;
  budget_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  kpis: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  name: string;
  asset_type: "logo" | "color" | "font" | "photo" | "voice" | string;
  value: string | null;
  description: string | null;
  meta: Record<string, unknown> | null;
}

export interface BrandVoice {
  id: string;
  scope: string;
  tone: string | null;
  persona: string | null;
  do_list: string[];
  dont_list: string[];
  examples: unknown[];
}

export interface BrandCompetitor {
  id: string;
  name: string;
  site: string | null;
  handles: Record<string, unknown> | null;
  strength: number;
  notes: string | null;
}

const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

// ---------- Calendar ----------
export async function listEvents(from?: string, to?: string) {
  let q = commandDb.from("calendar_events").select("*");
  if (from) q = q.gte("starts_at", from);
  if (to) q = q.lte("starts_at", to);
  const { data, error } = await q.order("starts_at", { ascending: true }).limit(500);
  if (error) throw error;
  return arr(data) as CalendarEvent[];
}

export async function createEvent(input: Partial<CalendarEvent>) {
  const { data, error } = await commandDb.from("calendar_events").insert(input).select().single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateEvent(id: string, patch: Partial<CalendarEvent>) {
  const { error } = await commandDb.from("calendar_events").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await commandDb.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Campaigns ----------
export async function listCampaigns(status?: Campaign["status"] | "all") {
  let q = commandDb.from("campaigns").select("*");
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return arr(data) as Campaign[];
}

export async function createCampaign(input: Partial<Campaign>) {
  const { data, error } = await commandDb.from("campaigns").insert(input).select().single();
  if (error) throw error;
  return data as Campaign;
}

export async function updateCampaign(id: string, patch: Partial<Campaign>) {
  const { error } = await commandDb.from("campaigns").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const { error } = await commandDb.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Brand ----------
export async function listAssets() {
  const { data, error } = await commandDb.from("brand_assets").select("*").order("asset_type");
  if (error) throw error;
  return arr(data) as BrandAsset[];
}

export async function createAsset(input: Partial<BrandAsset>) {
  const { data, error } = await commandDb.from("brand_assets").insert(input).select().single();
  if (error) throw error;
  return data as BrandAsset;
}

export async function deleteAsset(id: string) {
  const { error } = await commandDb.from("brand_assets").delete().eq("id", id);
  if (error) throw error;
}

export async function getVoice(scope = "global") {
  const { data, error } = await commandDb.from("brand_voice").select("*").eq("scope", scope).maybeSingle();
  if (error) throw error;
  return data as BrandVoice | null;
}

export async function upsertVoice(input: Partial<BrandVoice> & { scope: string }) {
  const { error } = await commandDb.from("brand_voice").upsert(input, { onConflict: "scope" });
  if (error) throw error;
}

export async function listCompetitors() {
  const { data, error } = await commandDb
    .from("brand_competitors")
    .select("*")
    .order("strength", { ascending: false });
  if (error) throw error;
  return arr(data) as BrandCompetitor[];
}

export async function createCompetitor(input: Partial<BrandCompetitor>) {
  const { data, error } = await commandDb.from("brand_competitors").insert(input).select().single();
  if (error) throw error;
  return data as BrandCompetitor;
}

export async function deleteCompetitor(id: string) {
  const { error } = await commandDb.from("brand_competitors").delete().eq("id", id);
  if (error) throw error;
}

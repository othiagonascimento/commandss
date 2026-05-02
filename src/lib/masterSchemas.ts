/**
 * Zod schemas for Master Panel v2 reads.
 * Use `.passthrough()` everywhere — we only validate the keys we depend on
 * so backend can add fields freely without breaking the UI.
 */
import { z } from 'zod';

export const AnalyticsOverviewSchema = z.object({
  tenants: z.object({
    total: z.number(),
    active: z.number(),
    basic: z.number(),
    pro: z.number(),
    enterprise: z.number(),
  }).passthrough(),
  subscriptions: z.object({
    active: z.number(),
    trial: z.number(),
    cancelled: z.number(),
  }).passthrough(),
  usage: z.object({
    total_leads: z.number(),
    total_users: z.number(),
    total_messages: z.number(),
  }).passthrough(),
  recent_activity: z.object({
    new_tenants_7d: z.number(),
    new_leads_7d: z.number(),
  }).passthrough(),
}).passthrough();

export const RevenueSchema = z.object({
  mrr: z.number(),
  arr: z.number(),
  total: z.number(),
  growth_percentage: z.number(),
}).passthrough();

export const TimeSeriesPointSchema = z.object({
  month: z.string().optional(),
  date: z.string().optional(),
  revenue: z.number().optional(),
  users: z.number().optional(),
  tenants: z.number().optional(),
}).passthrough();

export const TimeSeriesResponseSchema = z.object({
  period: z.string(),
  data: z.array(TimeSeriesPointSchema),
}).passthrough();

export const OpsSnapshotSchema = z.object({
  id: z.string().optional(),
  created_at: z.string().optional(),
  snapshot_type: z.string().optional(),
  snapshot_data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// AI Advanced — loose schema, only structural keys
export const AIAdvancedDataSchema = z.object({
  summary: z.record(z.string(), z.unknown()).optional(),
  layers: z.array(z.unknown()).optional().default([]),
  models: z.array(z.unknown()).optional().default([]),
  providers: z.array(z.unknown()).optional().default([]),
  tenants: z.array(z.unknown()).optional().default([]),
  timeline: z.array(z.unknown()).optional().default([]),
}).passthrough();

export const TenantHealthListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().optional(),
    health_score: z.number().nullable().optional(),
  }).passthrough()
);

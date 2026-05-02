// FinOps / Unit Economics types — consumed via master-analytics edge function

export type Confidence = 'high' | 'medium' | 'low';

export interface FinOpsFilters {
  month?: string; // YYYY-MM
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  compare?: 'prev' | 'none';
}

export interface FinOpsSparkPoint {
  date: string;
  value: number;
}

export interface FinOpsKPI {
  value: number;
  previous?: number | null;
  delta_pct?: number | null;
  confidence?: Confidence;
  spark?: FinOpsSparkPoint[];
}

export interface FinOpsOverview {
  period: { from: string; to: string; label?: string };
  revenue_brl: FinOpsKPI;
  cost_total_brl: FinOpsKPI;
  cost_ai_brl: FinOpsKPI;
  cost_media_brl: FinOpsKPI;
  cost_infra_brl: FinOpsKPI;
  margin_brl: FinOpsKPI;
  margin_pct: FinOpsKPI;
  cost_per_message: FinOpsKPI;
  cost_per_active_user: FinOpsKPI;
  cost_per_active_tenant: FinOpsKPI;
  credits_consumed: FinOpsKPI;
  cost_breakdown?: { category: string; amount_brl: number; pct: number }[];
  timeseries?: { date: string; cost_ai: number; cost_media: number; cost_infra: number; revenue: number }[];
  top_loss_tenants?: FinOpsTenantRow[];
  top_cost_models?: { provider: string; model: string; cost_brl: number; calls: number }[];
  recent_anomalies?: FinOpsAnomaly[];
  data_health?: {
    logs_count: number;
    last_ingest_at?: string | null;
    avg_confidence: Confidence;
    api_usage_logs_empty?: boolean;
    notes?: string[];
  };
}

export interface FinOpsTenantRow {
  tenant_id: string;
  tenant_name: string;
  subdomain?: string | null;
  subscription_status?: string | null;
  plan?: string | null;
  revenue_brl: number;
  cost_ai_brl: number;
  cost_media_brl: number;
  cost_infra_brl: number;
  cost_total_brl: number;
  credits_consumed: number;
  messages: number;
  active_users: number;
  cost_per_message: number;
  cost_per_active_user: number;
  margin_brl: number;
  margin_pct: number;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  confidence?: Confidence;
}

export interface FinOpsUserRow {
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  tenant_id: string;
  tenant_name: string;
  messages: number;
  ai_events: number;
  credits_consumed: number;
  cost_ai_brl: number;
  cost_media_brl: number;
  cost_total_brl: number;
  cost_per_message: number;
  cost_per_ai_event: number;
  risk?: 'low' | 'medium' | 'high' | 'critical';
}

export interface FinOpsAIModelRow {
  provider: string;
  model: string;
  calls: number;
  cost_brl: number;
  input_tokens: number;
  output_tokens: number;
  output_input_ratio: number;
  avg_latency_ms: number;
  errors: number;
  fallbacks: number;
  cost_per_call_brl: number;
  cost_per_1k_output_brl: number;
  usage_missing_reason_count: number;
  has_pricing?: boolean;
  spark?: FinOpsSparkPoint[];
}

export interface FinOpsAILayerRow {
  layer: string;
  calls: number;
  cost_brl: number;
  credits_consumed: number;
  output_tokens: number;
  cost_per_credit: number;
  cost_per_response: number;
  avg_latency_ms: number;
}

export interface FinOpsAIOperationRow {
  operation: string;
  channel?: string | null;
  mode?: string | null;
  calls: number;
  cost_brl: number;
  input_tokens: number;
  output_tokens: number;
  avg_latency_ms: number;
  error_rate: number;
}

export interface FinOpsFallbackRow {
  from_provider: string;
  from_model: string;
  to_provider: string;
  to_model: string;
  count: number;
  cost_brl: number;
}

export interface FinOpsAIPayload {
  models: FinOpsAIModelRow[];
  layers: FinOpsAILayerRow[];
  operations: FinOpsAIOperationRow[];
  fallbacks?: FinOpsFallbackRow[];
  token_distribution?: { bucket: string; count: number }[];
  errors_timeline?: { date: string; error_rate: number; calls: number }[];
}

export interface FinOpsMediaTenantRow {
  tenant_id: string;
  tenant_name: string;
  folder?: string | null;
  strategy?: string | null;
  bytes_uploaded: number;
  bytes_deleted: number;
  current_storage_bytes: number;
  video_jobs: number;
  failed_jobs: number;
  uploading_jobs: number;
  last_event_at?: string | null;
}

export interface FinOpsMediaPayload {
  totals: {
    bytes_uploaded: number;
    bytes_deleted: number;
    current_storage_bytes: number;
    cost_estimated_brl: number;
  };
  by_folder: { folder: string; bytes: number; events: number }[];
  by_strategy: { strategy: string; bytes: number; events: number }[];
  visibility: { public_bytes: number; private_bytes: number };
  rows: FinOpsMediaTenantRow[];
  video_pipeline: {
    uploading: number;
    processing: number;
    completed: number;
    failed_recoverable: number;
    avg_seconds_per_phase?: Record<string, number>;
  };
  stuck_jobs?: { id: string; tenant_id: string; status: string; phase?: string; minutes_stuck: number }[];
}

export interface FinOpsInfraRow {
  service: string;
  sku?: string | null;
  amount_brl: number;
  allocation_strategy?: string | null;
  attribution_confidence?: Confidence;
  category?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FinOpsInfraPayload {
  rows: FinOpsInfraRow[];
  total_brl: number;
  load_balancer: {
    amount_brl: number;
    classification: 'overhead' | 'investment' | 'unknown';
    rationale: string;
  };
  per_tenant_brl?: number;
  per_user_brl?: number;
  per_message_brl?: number;
}

export interface FinOpsInvestorPayload {
  period: { from: string; to: string };
  revenue_brl: number;
  variable_cost_brl: number;
  fixed_cost_brl: number;
  margin_brl: number;
  margin_pct: number;
  active_tenants: number;
  active_users: number;
  messages: number;
  cost_per_message: number;
  cost_per_tenant: number;
  cost_per_user: number;
  ai_pct_of_cost: number;
  infra_pct_of_cost: number;
  margin_timeline?: { date: string; margin_brl: number; margin_pct: number }[];
  cost_stack_timeline?: { date: string; ai: number; media: number; infra: number; other: number }[];
  risks?: { title: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }[];
  opportunities?: { title: string; description: string; impact_brl?: number }[];
}

export interface FinOpsAnomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity?: { type: string; id: string; name?: string };
  observed_value?: number | string;
  expected_value?: number | string;
  recommendation?: string;
  related_link?: string;
  created_at?: string;
}

export interface FinOpsAnomaliesPayload {
  rows: FinOpsAnomaly[];
  counts: Record<string, number>;
}

export interface FinOpsPricingRow {
  id: string;
  provider: string;
  model: string;
  input_cost_per_1m_tokens_brl: number;
  output_cost_per_1m_tokens_brl: number;
  cached_input_cost_per_1m_tokens_brl?: number | null;
  input_cost_per_1m_tokens_usd?: number | null;
  output_cost_per_1m_tokens_usd?: number | null;
  cached_input_cost_per_1m_tokens_usd?: number | null;
  usd_brl_rate?: number | null;
  audio_cost_brl?: number | null;
  source?: string | null;
  notes?: string | null;
  effective_from: string;
  effective_to?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface FinOpsBudgetRow {
  id: string;
  layer: string;
  operation: string;
  channel: string;
  max_output_tokens: number;
  is_active: boolean;
  notes?: string | null;
  updated_at?: string;
}

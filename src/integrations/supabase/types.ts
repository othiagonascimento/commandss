export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          ab_test_id: string
          assigned_at: string
          conversion_data: Json | null
          converted: boolean
          converted_at: string | null
          id: string
          lead_id: string
          tenant_id: string
          variant: string
        }
        Insert: {
          ab_test_id: string
          assigned_at?: string
          conversion_data?: Json | null
          converted?: boolean
          converted_at?: string | null
          id?: string
          lead_id: string
          tenant_id: string
          variant: string
        }
        Update: {
          ab_test_id?: string
          assigned_at?: string
          conversion_data?: Json | null
          converted?: boolean
          converted_at?: string | null
          id?: string
          lead_id?: string
          tenant_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ab_test_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          auto_apply_winner: boolean
          campaign_id: string | null
          confidence_score: number | null
          conversions_a: number
          conversions_b: number
          created_at: string
          description: string | null
          finished_at: string | null
          flow_id: string | null
          id: string
          leads_variant_a: number
          leads_variant_b: number
          metrics_a: Json | null
          metrics_b: Json | null
          min_leads_per_variant: number
          started_at: string
          status: Database["public"]["Enums"]["ab_test_status"]
          step_id: string
          step_name: string | null
          tenant_id: string
          test_duration: string
          test_name: string
          test_type: Database["public"]["Enums"]["ab_test_type"]
          updated_at: string
          uplift_percent: number | null
          variant_a: string
          variant_b: string
          winner: Database["public"]["Enums"]["ab_test_winner"] | null
          winner_applied_at: string | null
        }
        Insert: {
          auto_apply_winner?: boolean
          campaign_id?: string | null
          confidence_score?: number | null
          conversions_a?: number
          conversions_b?: number
          created_at?: string
          description?: string | null
          finished_at?: string | null
          flow_id?: string | null
          id?: string
          leads_variant_a?: number
          leads_variant_b?: number
          metrics_a?: Json | null
          metrics_b?: Json | null
          min_leads_per_variant?: number
          started_at?: string
          status?: Database["public"]["Enums"]["ab_test_status"]
          step_id: string
          step_name?: string | null
          tenant_id: string
          test_duration?: string
          test_name: string
          test_type?: Database["public"]["Enums"]["ab_test_type"]
          updated_at?: string
          uplift_percent?: number | null
          variant_a: string
          variant_b: string
          winner?: Database["public"]["Enums"]["ab_test_winner"] | null
          winner_applied_at?: string | null
        }
        Update: {
          auto_apply_winner?: boolean
          campaign_id?: string | null
          confidence_score?: number | null
          conversions_a?: number
          conversions_b?: number
          created_at?: string
          description?: string | null
          finished_at?: string | null
          flow_id?: string | null
          id?: string
          leads_variant_a?: number
          leads_variant_b?: number
          metrics_a?: Json | null
          metrics_b?: Json | null
          min_leads_per_variant?: number
          started_at?: string
          status?: Database["public"]["Enums"]["ab_test_status"]
          step_id?: string
          step_name?: string | null
          tenant_id?: string
          test_duration?: string
          test_name?: string
          test_type?: Database["public"]["Enums"]["ab_test_type"]
          updated_at?: string
          uplift_percent?: number | null
          variant_a?: string
          variant_b?: string
          winner?: Database["public"]["Enums"]["ab_test_winner"] | null
          winner_applied_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ab_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      access_profiles: {
        Row: {
          base_role: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: string[] | null
          slug: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_role?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: string[] | null
          slug: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_role?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: string[] | null
          slug?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agent_config: {
        Row: {
          active_mode: string | null
          agent_modes: Json | null
          aggression_level: string | null
          ai_model_provider: string | null
          allowed_modes: string[] | null
          arena_config: Json | null
          auto_activate: boolean | null
          auto_reactivation_enabled: boolean | null
          auto_reactivation_minutes: number | null
          auto_transfer_triggers: string[] | null
          autonomy_profile: string | null
          catalog_access: boolean | null
          created_at: string | null
          custom_layer_1_model: string | null
          custom_layer_2_model: string | null
          custom_layer_3_model: string | null
          custom_prompt_addendum: string | null
          enable_tri_modal: boolean | null
          enable_uopa_agent: boolean | null
          enable_vendedor_cloning: boolean | null
          escalation_cooldown_minutes: number | null
          escalation_rules: Json | null
          flow_fallback_to_rotation: boolean | null
          flow_integration_enabled: boolean | null
          flow_notify_on_fallback: boolean | null
          followup_interval_minutes: number | null
          greeting: string | null
          handoff_message: string | null
          human_delay_enabled: boolean | null
          id: string
          is_active: boolean | null
          is_enabled: boolean | null
          knowledge_base: string[] | null
          layer_1_instructions: string | null
          layer_1_model: string | null
          layer_2_instructions: string | null
          layer_2_model: string | null
          layer_3_instructions: string | null
          layer_3_model: string | null
          max_delay_seconds: number | null
          max_followups: number | null
          max_gpt4o_calls_per_day: number | null
          max_interactions: number | null
          min_delay_seconds: number | null
          minimum_price_triggers: string[] | null
          mode_switch_rules: Json | null
          niche_category: string | null
          orchestration_rules: Json | null
          orchestrator_config: Json | null
          outreach_autopilot_config: Json | null
          outreach_autopilot_enabled: boolean | null
          outreach_cadence: Json | null
          outreach_daily_cap: number | null
          outreach_enabled: boolean | null
          outreach_runs_completed: number | null
          outreach_window: Json | null
          payment_config: Json | null
          personality: string | null
          personality_prompt: string | null
          persuasion_level: number | null
          prohibited_phrases: string[] | null
          scheduling_config: Json | null
          tenant_id: string | null
          tone_voice: string | null
          typing_indicator_enabled: boolean | null
          updated_at: string | null
          use_global_config: boolean | null
          use_minimum_price_in_recovery: boolean | null
          working_hours: Json | null
        }
        Insert: {
          active_mode?: string | null
          agent_modes?: Json | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          allowed_modes?: string[] | null
          arena_config?: Json | null
          auto_activate?: boolean | null
          auto_reactivation_enabled?: boolean | null
          auto_reactivation_minutes?: number | null
          auto_transfer_triggers?: string[] | null
          autonomy_profile?: string | null
          catalog_access?: boolean | null
          created_at?: string | null
          custom_layer_1_model?: string | null
          custom_layer_2_model?: string | null
          custom_layer_3_model?: string | null
          custom_prompt_addendum?: string | null
          enable_tri_modal?: boolean | null
          enable_uopa_agent?: boolean | null
          enable_vendedor_cloning?: boolean | null
          escalation_cooldown_minutes?: number | null
          escalation_rules?: Json | null
          flow_fallback_to_rotation?: boolean | null
          flow_integration_enabled?: boolean | null
          flow_notify_on_fallback?: boolean | null
          followup_interval_minutes?: number | null
          greeting?: string | null
          handoff_message?: string | null
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string[] | null
          layer_1_instructions?: string | null
          layer_1_model?: string | null
          layer_2_instructions?: string | null
          layer_2_model?: string | null
          layer_3_instructions?: string | null
          layer_3_model?: string | null
          max_delay_seconds?: number | null
          max_followups?: number | null
          max_gpt4o_calls_per_day?: number | null
          max_interactions?: number | null
          min_delay_seconds?: number | null
          minimum_price_triggers?: string[] | null
          mode_switch_rules?: Json | null
          niche_category?: string | null
          orchestration_rules?: Json | null
          orchestrator_config?: Json | null
          outreach_autopilot_config?: Json | null
          outreach_autopilot_enabled?: boolean | null
          outreach_cadence?: Json | null
          outreach_daily_cap?: number | null
          outreach_enabled?: boolean | null
          outreach_runs_completed?: number | null
          outreach_window?: Json | null
          payment_config?: Json | null
          personality?: string | null
          personality_prompt?: string | null
          persuasion_level?: number | null
          prohibited_phrases?: string[] | null
          scheduling_config?: Json | null
          tenant_id?: string | null
          tone_voice?: string | null
          typing_indicator_enabled?: boolean | null
          updated_at?: string | null
          use_global_config?: boolean | null
          use_minimum_price_in_recovery?: boolean | null
          working_hours?: Json | null
        }
        Update: {
          active_mode?: string | null
          agent_modes?: Json | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          allowed_modes?: string[] | null
          arena_config?: Json | null
          auto_activate?: boolean | null
          auto_reactivation_enabled?: boolean | null
          auto_reactivation_minutes?: number | null
          auto_transfer_triggers?: string[] | null
          autonomy_profile?: string | null
          catalog_access?: boolean | null
          created_at?: string | null
          custom_layer_1_model?: string | null
          custom_layer_2_model?: string | null
          custom_layer_3_model?: string | null
          custom_prompt_addendum?: string | null
          enable_tri_modal?: boolean | null
          enable_uopa_agent?: boolean | null
          enable_vendedor_cloning?: boolean | null
          escalation_cooldown_minutes?: number | null
          escalation_rules?: Json | null
          flow_fallback_to_rotation?: boolean | null
          flow_integration_enabled?: boolean | null
          flow_notify_on_fallback?: boolean | null
          followup_interval_minutes?: number | null
          greeting?: string | null
          handoff_message?: string | null
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string[] | null
          layer_1_instructions?: string | null
          layer_1_model?: string | null
          layer_2_instructions?: string | null
          layer_2_model?: string | null
          layer_3_instructions?: string | null
          layer_3_model?: string | null
          max_delay_seconds?: number | null
          max_followups?: number | null
          max_gpt4o_calls_per_day?: number | null
          max_interactions?: number | null
          min_delay_seconds?: number | null
          minimum_price_triggers?: string[] | null
          mode_switch_rules?: Json | null
          niche_category?: string | null
          orchestration_rules?: Json | null
          orchestrator_config?: Json | null
          outreach_autopilot_config?: Json | null
          outreach_autopilot_enabled?: boolean | null
          outreach_cadence?: Json | null
          outreach_daily_cap?: number | null
          outreach_enabled?: boolean | null
          outreach_runs_completed?: number | null
          outreach_window?: Json | null
          payment_config?: Json | null
          personality?: string | null
          personality_prompt?: string | null
          persuasion_level?: number | null
          prohibited_phrases?: string[] | null
          scheduling_config?: Json | null
          tenant_id?: string | null
          tone_voice?: string | null
          typing_indicator_enabled?: boolean | null
          updated_at?: string | null
          use_global_config?: boolean | null
          use_minimum_price_in_recovery?: boolean | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_arena_logs: {
        Row: {
          arena_calls_count: number | null
          arena_version: string | null
          budget_total_ms: number | null
          channel: string | null
          channel_formatted: boolean | null
          channel_limit_used: number | null
          confidence_mode: string | null
          conversation_id: string | null
          created_at: string | null
          degraded_reason: string | null
          draft_a_excerpt: string | null
          draft_b_excerpt: string | null
          draft_mode: string | null
          final_score: number | null
          gate_reason: string | null
          id: string
          message_id: string | null
          pipeline_mode: string | null
          polisher_json: Json | null
          quality_validator_json: Json | null
          rewrite_json: Json | null
          safety_validator_json: Json | null
          selector_json: Json | null
          selector_timeout: boolean | null
          skipped_steps: string[] | null
          strategist_json: Json | null
          target_layer: string | null
          temperature: string | null
          tenant_id: string
          total_time_ms: number | null
          used_polisher: boolean | null
          used_safety: boolean | null
          used_selector: boolean | null
          validation_coverage: number | null
        }
        Insert: {
          arena_calls_count?: number | null
          arena_version?: string | null
          budget_total_ms?: number | null
          channel?: string | null
          channel_formatted?: boolean | null
          channel_limit_used?: number | null
          confidence_mode?: string | null
          conversation_id?: string | null
          created_at?: string | null
          degraded_reason?: string | null
          draft_a_excerpt?: string | null
          draft_b_excerpt?: string | null
          draft_mode?: string | null
          final_score?: number | null
          gate_reason?: string | null
          id?: string
          message_id?: string | null
          pipeline_mode?: string | null
          polisher_json?: Json | null
          quality_validator_json?: Json | null
          rewrite_json?: Json | null
          safety_validator_json?: Json | null
          selector_json?: Json | null
          selector_timeout?: boolean | null
          skipped_steps?: string[] | null
          strategist_json?: Json | null
          target_layer?: string | null
          temperature?: string | null
          tenant_id: string
          total_time_ms?: number | null
          used_polisher?: boolean | null
          used_safety?: boolean | null
          used_selector?: boolean | null
          validation_coverage?: number | null
        }
        Update: {
          arena_calls_count?: number | null
          arena_version?: string | null
          budget_total_ms?: number | null
          channel?: string | null
          channel_formatted?: boolean | null
          channel_limit_used?: number | null
          confidence_mode?: string | null
          conversation_id?: string | null
          created_at?: string | null
          degraded_reason?: string | null
          draft_a_excerpt?: string | null
          draft_b_excerpt?: string | null
          draft_mode?: string | null
          final_score?: number | null
          gate_reason?: string | null
          id?: string
          message_id?: string | null
          pipeline_mode?: string | null
          polisher_json?: Json | null
          quality_validator_json?: Json | null
          rewrite_json?: Json | null
          safety_validator_json?: Json | null
          selector_json?: Json | null
          selector_timeout?: boolean | null
          skipped_steps?: string[] | null
          strategist_json?: Json | null
          target_layer?: string | null
          temperature?: string | null
          tenant_id?: string
          total_time_ms?: number | null
          used_polisher?: boolean | null
          used_safety?: boolean | null
          used_selector?: boolean | null
          validation_coverage?: number | null
        }
        Relationships: []
      }
      ai_available_models: {
        Row: {
          auto_disabled_at: string | null
          auto_disabled_reason: string | null
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          cost_per_1k_tokens: number | null
          created_at: string | null
          display_name: string
          failure_count: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_health_check: string | null
          layer_category: string
          max_context_tokens: number | null
          metadata: Json | null
          model_id: string
          priority: number | null
          provider: string
          supports_tools: boolean | null
          supports_vision: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_disabled_at?: string | null
          auto_disabled_reason?: string | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name: string
          failure_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_health_check?: string | null
          layer_category: string
          max_context_tokens?: number | null
          metadata?: Json | null
          model_id: string
          priority?: number | null
          provider: string
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_disabled_at?: string | null
          auto_disabled_reason?: string | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name?: string
          failure_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_health_check?: string | null
          layer_category?: string
          max_context_tokens?: number | null
          metadata?: Json | null
          model_id?: string
          priority?: number | null
          provider?: string
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_corrections: {
        Row: {
          conversation_id: string | null
          corrected_by: string | null
          corrected_response: string | null
          correction_type: string | null
          created_at: string | null
          id: string
          message_id: string | null
          original_response: string | null
          tenant_id: string
          used_in_prompt: boolean | null
        }
        Insert: {
          conversation_id?: string | null
          corrected_by?: string | null
          corrected_response?: string | null
          correction_type?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          original_response?: string | null
          tenant_id: string
          used_in_prompt?: boolean | null
        }
        Update: {
          conversation_id?: string | null
          corrected_by?: string | null
          corrected_response?: string | null
          correction_type?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          original_response?: string | null
          tenant_id?: string
          used_in_prompt?: boolean | null
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          ai_mode: string | null
          autonomy_profile: string | null
          block_reason: string | null
          conversation_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          fallback_category: string | null
          fallback_reason: string | null
          id: string
          latency_ms: number | null
          lead_id: string | null
          tenant_id: string
          was_blocked: boolean | null
          was_fallback: boolean | null
        }
        Insert: {
          ai_mode?: string | null
          autonomy_profile?: string | null
          block_reason?: string | null
          conversation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          fallback_category?: string | null
          fallback_reason?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          tenant_id: string
          was_blocked?: boolean | null
          was_fallback?: boolean | null
        }
        Update: {
          ai_mode?: string | null
          autonomy_profile?: string | null
          block_reason?: string | null
          conversation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          fallback_category?: string | null
          fallback_reason?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          tenant_id?: string
          was_blocked?: boolean | null
          was_fallback?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_import_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          error: string | null
          failed_items: number
          finished_at: string | null
          id: string
          input: Json
          job_type: string
          processed_items: number
          result: Json | null
          source_id: string | null
          started_at: string | null
          status: string
          tenant_id: string
          total_items: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          failed_items?: number
          finished_at?: string | null
          id?: string
          input?: Json
          job_type: string
          processed_items?: number
          result?: Json | null
          source_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          total_items?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          failed_items?: number
          finished_at?: string | null
          id?: string
          input?: Json
          job_type?: string
          processed_items?: number
          result?: Json | null
          source_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_import_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_import_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_import_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_import_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_knowledge_source_items: {
        Row: {
          content_hash: string | null
          created_at: string
          id: string
          item_type: string
          last_error: string | null
          last_seen_at: string
          source_id: string
          source_item_url: string
          status: string
          target_id: string | null
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          id?: string
          item_type: string
          last_error?: string | null
          last_seen_at?: string
          source_id: string
          source_item_url: string
          status?: string
          target_id?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          id?: string
          item_type?: string
          last_error?: string | null
          last_seen_at?: string
          source_id?: string
          source_item_url?: string
          status?: string
          target_id?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_source_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_source_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_source_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_knowledge_source_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_knowledge_sources: {
        Row: {
          auto_sync_enabled: boolean
          created_at: string
          created_by: string | null
          domain: string
          id: string
          items_imported_count: number
          knowledge_imported_count: number
          last_error: string | null
          last_synced_at: string | null
          products_imported_count: number
          source_url: string
          status: string
          sync_frequency: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          items_imported_count?: number
          knowledge_imported_count?: number
          last_error?: string | null
          last_synced_at?: string | null
          products_imported_count?: number
          source_url: string
          status?: string
          sync_frequency?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          items_imported_count?: number
          knowledge_imported_count?: number
          last_error?: string | null
          last_synced_at?: string | null
          products_imported_count?: number
          source_url?: string
          status?: string
          sync_frequency?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_knowledge_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_learning_events: {
        Row: {
          ai_mode: string | null
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          event_type: string
          feedback_data: Json | null
          id: string
          lead_id: string | null
          outcome: string | null
          tenant_id: string
        }
        Insert: {
          ai_mode?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          event_type: string
          feedback_data?: Json | null
          id?: string
          lead_id?: string | null
          outcome?: string | null
          tenant_id?: string
        }
        Update: {
          ai_mode?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          event_type?: string
          feedback_data?: Json | null
          id?: string
          lead_id?: string | null
          outcome?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_learning_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_model_pricing_history: {
        Row: {
          audio_cost_brl: number | null
          cached_input_cost_per_1m_tokens_brl: number | null
          cached_input_cost_per_1m_tokens_usd: number | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          input_cost_per_1m_tokens_brl: number | null
          input_cost_per_1m_tokens_usd: number | null
          model: string
          notes: string | null
          output_cost_per_1m_tokens_brl: number | null
          output_cost_per_1m_tokens_usd: number | null
          provider: string
          source: string
          usd_brl_rate: number | null
        }
        Insert: {
          audio_cost_brl?: number | null
          cached_input_cost_per_1m_tokens_brl?: number | null
          cached_input_cost_per_1m_tokens_usd?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          input_cost_per_1m_tokens_brl?: number | null
          input_cost_per_1m_tokens_usd?: number | null
          model: string
          notes?: string | null
          output_cost_per_1m_tokens_brl?: number | null
          output_cost_per_1m_tokens_usd?: number | null
          provider: string
          source?: string
          usd_brl_rate?: number | null
        }
        Update: {
          audio_cost_brl?: number | null
          cached_input_cost_per_1m_tokens_brl?: number | null
          cached_input_cost_per_1m_tokens_usd?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          input_cost_per_1m_tokens_brl?: number | null
          input_cost_per_1m_tokens_usd?: number | null
          model?: string
          notes?: string | null
          output_cost_per_1m_tokens_brl?: number | null
          output_cost_per_1m_tokens_usd?: number | null
          provider?: string
          source?: string
          usd_brl_rate?: number | null
        }
        Relationships: []
      }
      ai_orchestration_logs: {
        Row: {
          ai_response: string | null
          ai_selected: string
          confidence_score: number | null
          conversation_id: string | null
          conversation_stage: string | null
          cost_usd: number | null
          created_at: string | null
          decision_reason: string | null
          has_objection: boolean | null
          id: string
          lead_temperature: string | null
          message_count: number | null
          message_id: string | null
          objection_complexity: number | null
          response_time_ms: number | null
          tenant_id: string | null
          tokens_used: number | null
          user_message: string | null
          user_satisfaction: number | null
        }
        Insert: {
          ai_response?: string | null
          ai_selected: string
          confidence_score?: number | null
          conversation_id?: string | null
          conversation_stage?: string | null
          cost_usd?: number | null
          created_at?: string | null
          decision_reason?: string | null
          has_objection?: boolean | null
          id?: string
          lead_temperature?: string | null
          message_count?: number | null
          message_id?: string | null
          objection_complexity?: number | null
          response_time_ms?: number | null
          tenant_id?: string | null
          tokens_used?: number | null
          user_message?: string | null
          user_satisfaction?: number | null
        }
        Update: {
          ai_response?: string | null
          ai_selected?: string
          confidence_score?: number | null
          conversation_id?: string | null
          conversation_stage?: string | null
          cost_usd?: number | null
          created_at?: string | null
          decision_reason?: string | null
          has_objection?: boolean | null
          id?: string
          lead_temperature?: string | null
          message_count?: number | null
          message_id?: string | null
          objection_complexity?: number | null
          response_time_ms?: number | null
          tenant_id?: string | null
          tokens_used?: number | null
          user_message?: string | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_orchestration_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_output_token_budgets: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_active: boolean
          layer: number | null
          max_output_tokens: number
          notes: string | null
          operation: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: number | null
          max_output_tokens: number
          notes?: string | null
          operation?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: number | null
          max_output_tokens?: number
          notes?: string | null
          operation?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_response_feedback: {
        Row: {
          ai_mode: string | null
          conversation_id: string | null
          created_at: string | null
          edited_response: string | null
          feedback_by: string | null
          feedback_reason: string | null
          feedback_type: string
          id: string
          knowledge_items_used: string[] | null
          message_id: string | null
          objection_handler_used: string | null
          original_response: string | null
          rating: number | null
          rating_aspects: Json | null
          response_context: Json | null
          tenant_id: string
        }
        Insert: {
          ai_mode?: string | null
          conversation_id?: string | null
          created_at?: string | null
          edited_response?: string | null
          feedback_by?: string | null
          feedback_reason?: string | null
          feedback_type: string
          id?: string
          knowledge_items_used?: string[] | null
          message_id?: string | null
          objection_handler_used?: string | null
          original_response?: string | null
          rating?: number | null
          rating_aspects?: Json | null
          response_context?: Json | null
          tenant_id: string
        }
        Update: {
          ai_mode?: string | null
          conversation_id?: string | null
          created_at?: string | null
          edited_response?: string | null
          feedback_by?: string | null
          feedback_reason?: string | null
          feedback_type?: string
          id?: string
          knowledge_items_used?: string[] | null
          message_id?: string | null
          objection_handler_used?: string | null
          original_response?: string | null
          rating?: number | null
          rating_aspects?: Json | null
          response_context?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_feedback_feedback_by_fkey"
            columns: ["feedback_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_response_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_signal_dismissals: {
        Row: {
          dismissed_at: string
          expires_at: string
          id: string
          kind: string
          lead_id: string
          reason: string | null
          tenant_id: string
        }
        Insert: {
          dismissed_at?: string
          expires_at?: string
          id?: string
          kind?: string
          lead_id: string
          reason?: string | null
          tenant_id: string
        }
        Update: {
          dismissed_at?: string
          expires_at?: string
          id?: string
          kind?: string
          lead_id?: string
          reason?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      ai_summary_quota: {
        Row: {
          count: number
          created_at: string
          date: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_telemetry: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          operation: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      api_cost_config: {
        Row: {
          audio_cost_per_minute_usd: number | null
          created_at: string | null
          display_name: string | null
          id: string
          image_cost_per_unit_usd: number | null
          input_cost_per_1m_usd: number | null
          is_active: boolean | null
          layer_category: string | null
          markup_percent: number | null
          model: string
          operation: string
          output_cost_per_1m_usd: number | null
          provider: string
          updated_at: string | null
          usd_to_brl_rate: number | null
        }
        Insert: {
          audio_cost_per_minute_usd?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          image_cost_per_unit_usd?: number | null
          input_cost_per_1m_usd?: number | null
          is_active?: boolean | null
          layer_category?: string | null
          markup_percent?: number | null
          model: string
          operation?: string
          output_cost_per_1m_usd?: number | null
          provider: string
          updated_at?: string | null
          usd_to_brl_rate?: number | null
        }
        Update: {
          audio_cost_per_minute_usd?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          image_cost_per_unit_usd?: number | null
          input_cost_per_1m_usd?: number | null
          is_active?: boolean | null
          layer_category?: string | null
          markup_percent?: number | null
          model?: string
          operation?: string
          output_cost_per_1m_usd?: number | null
          provider?: string
          updated_at?: string | null
          usd_to_brl_rate?: number | null
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          permissions: Json | null
          tenant_id: string
          token_hash: string
          token_prefix: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          tenant_id: string
          token_hash: string
          token_prefix: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          tenant_id?: string
          token_hash?: string
          token_prefix?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "api_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          audio_seconds: number | null
          channel: string | null
          conversation_id: string | null
          cost_brl: number | null
          cost_usd: number | null
          created_at: string | null
          credits_consumed: number | null
          error_message: string | null
          fallback_from_model: string | null
          fallback_from_provider: string | null
          fallback_to_model: string | null
          fallback_to_provider: string | null
          feature_key: string | null
          id: string
          image_count: number | null
          input_cached_tokens: number | null
          input_tokens: number | null
          latency_ms: number | null
          layer: number | null
          lead_id: string | null
          metadata: Json | null
          mode: string | null
          model: string
          operation: string
          output_reasoning_tokens: number | null
          output_tokens: number | null
          pricing_snapshot_id: string | null
          provider: string
          request_id: string | null
          success: boolean | null
          tenant_id: string
          total_tokens: number | null
          usage_missing_reason: string | null
          user_id: string | null
        }
        Insert: {
          audio_seconds?: number | null
          channel?: string | null
          conversation_id?: string | null
          cost_brl?: number | null
          cost_usd?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          fallback_from_model?: string | null
          fallback_from_provider?: string | null
          fallback_to_model?: string | null
          fallback_to_provider?: string | null
          feature_key?: string | null
          id?: string
          image_count?: number | null
          input_cached_tokens?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          layer?: number | null
          lead_id?: string | null
          metadata?: Json | null
          mode?: string | null
          model: string
          operation?: string
          output_reasoning_tokens?: number | null
          output_tokens?: number | null
          pricing_snapshot_id?: string | null
          provider: string
          request_id?: string | null
          success?: boolean | null
          tenant_id: string
          total_tokens?: number | null
          usage_missing_reason?: string | null
          user_id?: string | null
        }
        Update: {
          audio_seconds?: number | null
          channel?: string | null
          conversation_id?: string | null
          cost_brl?: number | null
          cost_usd?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          fallback_from_model?: string | null
          fallback_from_provider?: string | null
          fallback_to_model?: string | null
          fallback_to_provider?: string | null
          feature_key?: string | null
          id?: string
          image_count?: number | null
          input_cached_tokens?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          layer?: number | null
          lead_id?: string | null
          metadata?: Json | null
          mode?: string | null
          model?: string
          operation?: string
          output_reasoning_tokens?: number | null
          output_tokens?: number | null
          pricing_snapshot_id?: string | null
          provider?: string
          request_id?: string | null
          success?: boolean | null
          tenant_id?: string
          total_tokens?: number | null
          usage_missing_reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_pricing_snapshot_id_fkey"
            columns: ["pricing_snapshot_id"]
            isOneToOne: false
            referencedRelation: "ai_model_pricing_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "api_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          current_step_id: string | null
          error_message: string | null
          flow_id: string
          id: string
          result: Json | null
          started_at: string | null
          status: string
          step_history: Json | null
          tenant_id: string
          trigger_data: Json | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          current_step_id?: string | null
          error_message?: string | null
          flow_id: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          step_history?: Json | null
          tenant_id?: string
          trigger_data?: Json | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          current_step_id?: string | null
          error_message?: string | null
          flow_id?: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          step_history?: Json | null
          tenant_id?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      automation_flows: {
        Row: {
          actions: Json
          active_contacts: number | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          objective: string | null
          run_count: number | null
          status: string | null
          steps: Json | null
          success_count: number | null
          tenant_id: string
          total_contacts: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          active_contacts?: number | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          objective?: string | null
          run_count?: number | null
          status?: string | null
          steps?: Json | null
          success_count?: number | null
          tenant_id: string
          total_contacts?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          active_contacts?: number | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          objective?: string | null
          run_count?: number | null
          status?: string | null
          steps?: Json | null
          success_count?: number | null
          tenant_id?: string
          total_contacts?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "automation_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          due_date: string
          external_invoice_id: string | null
          id: string
          invoice_pdf_url: string | null
          line_items: Json | null
          paid_at: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_date?: string
          external_invoice_id?: string | null
          id?: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_date?: string
          external_invoice_id?: string | null
          id?: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          external_subscription_id: string | null
          id: string
          metadata: Json | null
          plan_type: string | null
          status: string | null
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          plan_type?: string | null
          status?: string | null
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          plan_type?: string | null
          status?: string | null
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      birthday_flow_executions: {
        Row: {
          created_at: string
          executed_at: string
          execution_year: number
          flow_id: string
          id: string
          lead_id: string
          tenant_id: string
          trigger_type: string
        }
        Insert: {
          created_at?: string
          executed_at?: string
          execution_year: number
          flow_id: string
          id?: string
          lead_id: string
          tenant_id?: string
          trigger_type: string
        }
        Update: {
          created_at?: string
          executed_at?: string
          execution_year?: number
          flow_id?: string
          id?: string
          lead_id?: string
          tenant_id?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_flow_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_flow_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "birthday_flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      blocked_contacts: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_blocked: boolean | null
          phone: string
          reason: string | null
          tenant_id: string
          unblocked_at: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_blocked?: boolean | null
          phone: string
          reason?: string | null
          tenant_id: string
          unblocked_at?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_blocked?: boolean | null
          phone?: string
          reason?: string | null
          tenant_id?: string
          unblocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "blocked_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_banner: boolean | null
          is_push: boolean | null
          message: string
          starts_at: string | null
          target_niche: string | null
          target_tenant_ids: string[] | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_banner?: boolean | null
          is_push?: boolean | null
          message: string
          starts_at?: string | null
          target_niche?: string | null
          target_tenant_ids?: string[] | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_banner?: boolean | null
          is_push?: boolean | null
          message?: string
          starts_at?: string | null
          target_niche?: string | null
          target_tenant_ids?: string[] | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      business_config: {
        Row: {
          business_type: string
          created_at: string
          custom_labels: Json | null
          ecommerce_settings: Json | null
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          custom_labels?: Json | null
          ecommerce_settings?: Json | null
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          custom_labels?: Json | null
          ecommerce_settings?: Json | null
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          metadata: Json | null
          phone: string | null
          queue_message_id: string | null
          read_at: string | null
          replied_at: string | null
          resend_at: string | null
          resend_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["recipient_status"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          phone?: string | null
          queue_message_id?: string | null
          read_at?: string | null
          replied_at?: string | null
          resend_at?: string | null
          resend_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          phone?: string | null
          queue_message_id?: string | null
          read_at?: string | null
          replied_at?: string | null
          resend_at?: string | null
          resend_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_queue_message_id_fkey"
            columns: ["queue_message_id"]
            isOneToOne: false
            referencedRelation: "message_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_queue_message_id_fkey"
            columns: ["queue_message_id"]
            isOneToOne: false
            referencedRelation: "message_queue_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_segments: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          lead_count: number
          lead_ids: string[]
          name: string
          segment_type: string
          tenant_id: string
          updated_at: string
          value_score: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          lead_count?: number
          lead_ids?: string[]
          name: string
          segment_type: string
          tenant_id: string
          updated_at?: string
          value_score?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          lead_count?: number
          lead_ids?: string[]
          name?: string
          segment_type?: string
          tenant_id?: string
          updated_at?: string
          value_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_segments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_generated: boolean | null
          audience_count: number | null
          audience_filters: Json | null
          batch_pause_seconds: number | null
          batch_size: number | null
          channel: string
          channel_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          excluded_flow_ids: string[] | null
          failed_count: number | null
          flow_conflict_check: boolean | null
          id: string
          message_content: string | null
          message_template: Json | null
          message_variations: Json | null
          messages: Json | null
          metadata: Json | null
          name: string
          pending_count: number | null
          queued_count: number | null
          read_count: number | null
          replied_count: number | null
          resend_message_content: string | null
          resend_unread_after_hours: number | null
          resend_unread_enabled: boolean | null
          scheduled_at: string | null
          scheduled_for: string | null
          send_rate_per_minute: number | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          total_recipients: number | null
          type: string | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          audience_count?: number | null
          audience_filters?: Json | null
          batch_pause_seconds?: number | null
          batch_size?: number | null
          channel?: string
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          excluded_flow_ids?: string[] | null
          failed_count?: number | null
          flow_conflict_check?: boolean | null
          id?: string
          message_content?: string | null
          message_template?: Json | null
          message_variations?: Json | null
          messages?: Json | null
          metadata?: Json | null
          name: string
          pending_count?: number | null
          queued_count?: number | null
          read_count?: number | null
          replied_count?: number | null
          resend_message_content?: string | null
          resend_unread_after_hours?: number | null
          resend_unread_enabled?: boolean | null
          scheduled_at?: string | null
          scheduled_for?: string | null
          send_rate_per_minute?: number | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          total_recipients?: number | null
          type?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          audience_count?: number | null
          audience_filters?: Json | null
          batch_pause_seconds?: number | null
          batch_size?: number | null
          channel?: string
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          excluded_flow_ids?: string[] | null
          failed_count?: number | null
          flow_conflict_check?: boolean | null
          id?: string
          message_content?: string | null
          message_template?: Json | null
          message_variations?: Json | null
          messages?: Json | null
          metadata?: Json | null
          name?: string
          pending_count?: number | null
          queued_count?: number | null
          read_count?: number | null
          replied_count?: number | null
          resend_message_content?: string | null
          resend_unread_after_hours?: number | null
          resend_unread_enabled?: boolean | null
          scheduled_at?: string | null
          scheduled_for?: string | null
          send_rate_per_minute?: number | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          total_recipients?: number | null
          type?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "campaigns_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_import_history: {
        Row: {
          created_at: string | null
          duplicates: number | null
          error_log: Json | null
          errors: number | null
          file_name: string
          id: string
          imported: number | null
          source: string
          status: string | null
          tenant_id: string
          total_records: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duplicates?: number | null
          error_log?: Json | null
          errors?: number | null
          file_name: string
          id?: string
          imported?: number | null
          source?: string
          status?: string | null
          tenant_id?: string
          total_records?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duplicates?: number | null
          error_log?: Json | null
          errors?: number | null
          file_name?: string
          id?: string
          imported?: number | null
          source?: string
          status?: string | null
          tenant_id?: string
          total_records?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "catalog_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      cci_signals: {
        Row: {
          created_at: string
          id: string
          kind: string
          lead_id: string
          payload: Json
          tenant_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          payload?: Json
          tenant_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          payload?: Json
          tenant_id?: string
          weight?: number
        }
        Relationships: []
      }
      channels: {
        Row: {
          access_token: string | null
          channel_type: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          health_status: Json | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          legacy_instance_id: string | null
          platform_channel_id: string
          rate_limits: Json | null
          refresh_token: string | null
          status: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          channel_type: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          health_status?: Json | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          legacy_instance_id?: string | null
          platform_channel_id: string
          rate_limits?: Json | null
          refresh_token?: string | null
          status?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          health_status?: Json | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          legacy_instance_id?: string | null
          platform_channel_id?: string
          rate_limits?: Json | null
          refresh_token?: string | null
          status?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      checkout_config: {
        Row: {
          button_text_lead_capture: string | null
          button_text_whatsapp: string | null
          checkout_mode: string
          checkout_subtitle: string | null
          checkout_title: string | null
          created_at: string | null
          default_whatsapp_label: string | null
          default_whatsapp_number: string | null
          id: string
          include_product_images: boolean | null
          include_product_links: boolean | null
          lead_capture_back_text: string | null
          lead_capture_delay_seconds: number | null
          lead_capture_enabled: boolean | null
          lead_capture_message: string | null
          lead_capture_name_label: string | null
          lead_capture_name_placeholder: string | null
          lead_capture_phone_label: string | null
          lead_capture_phone_placeholder: string | null
          lead_capture_title: string | null
          message_template: string | null
          online_button_label: string | null
          online_button_loading_label: string | null
          online_payment_enabled: boolean
          recovery_audience: string | null
          recovery_button_text: string | null
          recovery_destination_mode: string | null
          recovery_idle_seconds: number | null
          recovery_name_label: string | null
          recovery_name_placeholder: string | null
          recovery_once_per_session: boolean | null
          recovery_phone_label: string | null
          recovery_phone_placeholder: string | null
          recovery_skip_text: string | null
          recovery_suppress_after_capture: boolean | null
          recovery_trigger_mode: string | null
          seller_selection_message: string | null
          seller_selection_title: string | null
          show_lead_capture_option: boolean | null
          show_whatsapp_option: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          button_text_lead_capture?: string | null
          button_text_whatsapp?: string | null
          checkout_mode?: string
          checkout_subtitle?: string | null
          checkout_title?: string | null
          created_at?: string | null
          default_whatsapp_label?: string | null
          default_whatsapp_number?: string | null
          id?: string
          include_product_images?: boolean | null
          include_product_links?: boolean | null
          lead_capture_back_text?: string | null
          lead_capture_delay_seconds?: number | null
          lead_capture_enabled?: boolean | null
          lead_capture_message?: string | null
          lead_capture_name_label?: string | null
          lead_capture_name_placeholder?: string | null
          lead_capture_phone_label?: string | null
          lead_capture_phone_placeholder?: string | null
          lead_capture_title?: string | null
          message_template?: string | null
          online_button_label?: string | null
          online_button_loading_label?: string | null
          online_payment_enabled?: boolean
          recovery_audience?: string | null
          recovery_button_text?: string | null
          recovery_destination_mode?: string | null
          recovery_idle_seconds?: number | null
          recovery_name_label?: string | null
          recovery_name_placeholder?: string | null
          recovery_once_per_session?: boolean | null
          recovery_phone_label?: string | null
          recovery_phone_placeholder?: string | null
          recovery_skip_text?: string | null
          recovery_suppress_after_capture?: boolean | null
          recovery_trigger_mode?: string | null
          seller_selection_message?: string | null
          seller_selection_title?: string | null
          show_lead_capture_option?: boolean | null
          show_whatsapp_option?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          button_text_lead_capture?: string | null
          button_text_whatsapp?: string | null
          checkout_mode?: string
          checkout_subtitle?: string | null
          checkout_title?: string | null
          created_at?: string | null
          default_whatsapp_label?: string | null
          default_whatsapp_number?: string | null
          id?: string
          include_product_images?: boolean | null
          include_product_links?: boolean | null
          lead_capture_back_text?: string | null
          lead_capture_delay_seconds?: number | null
          lead_capture_enabled?: boolean | null
          lead_capture_message?: string | null
          lead_capture_name_label?: string | null
          lead_capture_name_placeholder?: string | null
          lead_capture_phone_label?: string | null
          lead_capture_phone_placeholder?: string | null
          lead_capture_title?: string | null
          message_template?: string | null
          online_button_label?: string | null
          online_button_loading_label?: string | null
          online_payment_enabled?: boolean
          recovery_audience?: string | null
          recovery_button_text?: string | null
          recovery_destination_mode?: string | null
          recovery_idle_seconds?: number | null
          recovery_name_label?: string | null
          recovery_name_placeholder?: string | null
          recovery_once_per_session?: boolean | null
          recovery_phone_label?: string | null
          recovery_phone_placeholder?: string | null
          recovery_skip_text?: string | null
          recovery_suppress_after_capture?: boolean | null
          recovery_trigger_mode?: string | null
          seller_selection_message?: string | null
          seller_selection_title?: string | null
          show_lead_capture_option?: boolean | null
          show_whatsapp_option?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "checkout_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      checkout_sellers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          custom_message_template: string | null
          description: string | null
          display_name: string
          display_order: number | null
          id: string
          is_active: boolean | null
          seller_id: string
          tenant_id: string
          updated_at: string | null
          whatsapp_label: string | null
          whatsapp_number: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          custom_message_template?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          seller_id: string
          tenant_id: string
          updated_at?: string | null
          whatsapp_label?: string | null
          whatsapp_number: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          custom_message_template?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          seller_id?: string
          tenant_id?: string
          updated_at?: string | null
          whatsapp_label?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sellers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "checkout_sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          amount_cents: number
          cart: Json
          created_at: string
          currency: string
          expires_at: string
          id: string
          payment_id: string | null
          public_customer_id: string | null
          referrer: string | null
          status: string
          tenant_id: string
          user_agent: string | null
          utm: Json
        }
        Insert: {
          amount_cents: number
          cart?: Json
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          public_customer_id?: string | null
          referrer?: string | null
          status?: string
          tenant_id: string
          user_agent?: string | null
          utm?: Json
        }
        Update: {
          amount_cents?: number
          cart?: Json
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          public_customer_id?: string | null
          referrer?: string | null
          status?: string
          tenant_id?: string
          user_agent?: string | null
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "checkout_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      comment_dm_rules: {
        Row: {
          channel_id: string | null
          cooldown_minutes: number | null
          created_at: string
          dm_template: string
          exclude_replies: boolean
          id: string
          is_active: boolean | null
          keywords: string[]
          live_video_id: string | null
          match_mode: string
          name: string
          post_scope: string
          reply_to_comment: string | null
          stats_triggered: number | null
          target_post_caption: string | null
          target_post_id: string | null
          target_post_url: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          cooldown_minutes?: number | null
          created_at?: string
          dm_template: string
          exclude_replies?: boolean
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          live_video_id?: string | null
          match_mode?: string
          name: string
          post_scope?: string
          reply_to_comment?: string | null
          stats_triggered?: number | null
          target_post_caption?: string | null
          target_post_id?: string | null
          target_post_url?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          cooldown_minutes?: number | null
          created_at?: string
          dm_template?: string
          exclude_replies?: boolean
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          live_video_id?: string | null
          match_mode?: string
          name?: string
          post_scope?: string
          reply_to_comment?: string | null
          stats_triggered?: number | null
          target_post_caption?: string | null
          target_post_id?: string | null
          target_post_url?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_dm_rules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_dm_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_dm_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "comment_dm_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      content_posts: {
        Row: {
          caption: string | null
          channel_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          media_url: string | null
          media_urls: string[] | null
          meta_container_id: string | null
          meta_post_id: string | null
          publish_type: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          media_urls?: string[] | null
          meta_container_id?: string | null
          meta_post_id?: string | null
          publish_type: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          media_urls?: string[] | null
          meta_container_id?: string | null
          meta_post_id?: string | null
          publish_type?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "content_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      conversation_conflicts: {
        Row: {
          auto_decision: string | null
          conflict_type: string
          created_at: string | null
          decision_made_at: string | null
          decision_made_by: string | null
          id: string
          lead_id: string
          lead_summary: Json | null
          new_instance_id: string
          original_conversation_id: string
          original_instance_id: string | null
          original_resolution_reason: string | null
          original_user_id: string | null
          pending_user_id: string | null
          reminder_sent_at: string | null
          status: string
          tenant_id: string
          timeout_at: string
        }
        Insert: {
          auto_decision?: string | null
          conflict_type: string
          created_at?: string | null
          decision_made_at?: string | null
          decision_made_by?: string | null
          id?: string
          lead_id: string
          lead_summary?: Json | null
          new_instance_id: string
          original_conversation_id: string
          original_instance_id?: string | null
          original_resolution_reason?: string | null
          original_user_id?: string | null
          pending_user_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          tenant_id: string
          timeout_at: string
        }
        Update: {
          auto_decision?: string | null
          conflict_type?: string
          created_at?: string | null
          decision_made_at?: string | null
          decision_made_by?: string | null
          id?: string
          lead_id?: string
          lead_summary?: Json | null
          new_instance_id?: string
          original_conversation_id?: string
          original_instance_id?: string | null
          original_resolution_reason?: string | null
          original_user_id?: string | null
          pending_user_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          tenant_id?: string
          timeout_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_conflicts_decision_made_by_fkey"
            columns: ["decision_made_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_original_conversation_id_fkey"
            columns: ["original_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_original_user_id_fkey"
            columns: ["original_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_pending_user_id_fkey"
            columns: ["pending_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_conflicts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "conversation_conflicts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      conversation_observers: {
        Row: {
          added_by: string | null
          can_send_messages: boolean | null
          conversation_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          observer_id: string
          reason: string | null
          removed_at: string | null
          removed_by: string | null
          tenant_id: string
        }
        Insert: {
          added_by?: string | null
          can_send_messages?: boolean | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          observer_id: string
          reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          tenant_id: string
        }
        Update: {
          added_by?: string | null
          can_send_messages?: boolean | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          observer_id?: string
          reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_observers_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_observers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_observers_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_observers_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_allowed_modes: Json | null
          ai_collected_data: Json | null
          ai_confirmation_count: number | null
          ai_cooldown_until: string | null
          ai_escalation_reason: string | null
          ai_intent_score: number | null
          ai_interaction_count: number | null
          ai_last_escalated_at: string | null
          ai_manual_activation: Json | null
          ai_mode: string | null
          ai_pause_until: string | null
          ai_preferred_mode: string | null
          ai_qualification_score: number | null
          ai_status: string | null
          ai_tags: Json | null
          assigned_to: string | null
          broadcast_campaign_id: string | null
          channel_id: string | null
          channel_type: string | null
          context_summary: string | null
          conversation_plan: Json | null
          created_at: string | null
          current_flow_execution_id: string | null
          deleted_at: string | null
          first_response_at: string | null
          group_jid: string | null
          handled_by_ai: boolean | null
          id: string
          is_broadcast_reply: boolean | null
          is_group: boolean | null
          is_pinned: boolean | null
          last_lead_message_at: string | null
          last_message: string | null
          last_message_time: string | null
          last_summarized_at: string | null
          lead_id: string | null
          marked_unread: boolean
          message_count_since_summary: number | null
          muted_until: string | null
          orchestrator_state: Json | null
          origin_instance_id: string | null
          previous_assignees: string[] | null
          qualification_data: Json | null
          qualification_status: string | null
          quality_score: number | null
          reassign_count: number | null
          requires_human_attention: boolean | null
          resolution_notes: string | null
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_breached_at: string | null
          status: string | null
          tenant_id: string
          unread_count: number | null
          uopa_agent_activated_at: string | null
          uopa_agent_activated_by: string | null
          uopa_agent_active: boolean | null
          uopa_agent_deactivated_at: string | null
          uopa_agent_duration: string | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          ai_allowed_modes?: Json | null
          ai_collected_data?: Json | null
          ai_confirmation_count?: number | null
          ai_cooldown_until?: string | null
          ai_escalation_reason?: string | null
          ai_intent_score?: number | null
          ai_interaction_count?: number | null
          ai_last_escalated_at?: string | null
          ai_manual_activation?: Json | null
          ai_mode?: string | null
          ai_pause_until?: string | null
          ai_preferred_mode?: string | null
          ai_qualification_score?: number | null
          ai_status?: string | null
          ai_tags?: Json | null
          assigned_to?: string | null
          broadcast_campaign_id?: string | null
          channel_id?: string | null
          channel_type?: string | null
          context_summary?: string | null
          conversation_plan?: Json | null
          created_at?: string | null
          current_flow_execution_id?: string | null
          deleted_at?: string | null
          first_response_at?: string | null
          group_jid?: string | null
          handled_by_ai?: boolean | null
          id?: string
          is_broadcast_reply?: boolean | null
          is_group?: boolean | null
          is_pinned?: boolean | null
          last_lead_message_at?: string | null
          last_message?: string | null
          last_message_time?: string | null
          last_summarized_at?: string | null
          lead_id?: string | null
          marked_unread?: boolean
          message_count_since_summary?: number | null
          muted_until?: string | null
          orchestrator_state?: Json | null
          origin_instance_id?: string | null
          previous_assignees?: string[] | null
          qualification_data?: Json | null
          qualification_status?: string | null
          quality_score?: number | null
          reassign_count?: number | null
          requires_human_attention?: boolean | null
          resolution_notes?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          status?: string | null
          tenant_id: string
          unread_count?: number | null
          uopa_agent_activated_at?: string | null
          uopa_agent_activated_by?: string | null
          uopa_agent_active?: boolean | null
          uopa_agent_deactivated_at?: string | null
          uopa_agent_duration?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          ai_allowed_modes?: Json | null
          ai_collected_data?: Json | null
          ai_confirmation_count?: number | null
          ai_cooldown_until?: string | null
          ai_escalation_reason?: string | null
          ai_intent_score?: number | null
          ai_interaction_count?: number | null
          ai_last_escalated_at?: string | null
          ai_manual_activation?: Json | null
          ai_mode?: string | null
          ai_pause_until?: string | null
          ai_preferred_mode?: string | null
          ai_qualification_score?: number | null
          ai_status?: string | null
          ai_tags?: Json | null
          assigned_to?: string | null
          broadcast_campaign_id?: string | null
          channel_id?: string | null
          channel_type?: string | null
          context_summary?: string | null
          conversation_plan?: Json | null
          created_at?: string | null
          current_flow_execution_id?: string | null
          deleted_at?: string | null
          first_response_at?: string | null
          group_jid?: string | null
          handled_by_ai?: boolean | null
          id?: string
          is_broadcast_reply?: boolean | null
          is_group?: boolean | null
          is_pinned?: boolean | null
          last_lead_message_at?: string | null
          last_message?: string | null
          last_message_time?: string | null
          last_summarized_at?: string | null
          lead_id?: string | null
          marked_unread?: boolean
          message_count_since_summary?: number | null
          muted_until?: string | null
          orchestrator_state?: Json | null
          origin_instance_id?: string | null
          previous_assignees?: string[] | null
          qualification_data?: Json | null
          qualification_status?: string | null
          quality_score?: number | null
          reassign_count?: number | null
          requires_human_attention?: boolean | null
          resolution_notes?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          status?: string | null
          tenant_id?: string
          unread_count?: number | null
          uopa_agent_activated_at?: string | null
          uopa_agent_activated_by?: string | null
          uopa_agent_active?: boolean | null
          uopa_agent_deactivated_at?: string | null
          uopa_agent_duration?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      copilot_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          last_message_at: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          attachments: Json
          content: string | null
          conversation_id: string
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          layer_used: string | null
          model_used: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string
        }
        Insert: {
          attachments?: Json
          content?: string | null
          conversation_id: string
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          layer_used?: string | null
          model_used?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string | null
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          layer_used?: string | null
          model_used?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          channel: string
          checkout_session_id: string | null
          checkout_token: string | null
          coupon_id: string
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          discount_cents: number
          free_shipping: boolean
          id: string
          redeemed_at: string
          tenant_id: string
        }
        Insert: {
          channel?: string
          checkout_session_id?: string | null
          checkout_token?: string | null
          coupon_id: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_cents?: number
          free_shipping?: boolean
          id?: string
          redeemed_at?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          checkout_session_id?: string | null
          checkout_token?: string | null
          coupon_id?: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_cents?: number
          free_shipping?: boolean
          id?: string
          redeemed_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "store_checkout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          applies_to_ids: string[]
          auto_apply: boolean
          channels: string[]
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          exclude_promotional: boolean
          excludes_ids: string[]
          first_purchase_only: boolean
          id: string
          max_discount_cents: number | null
          min_order_cents: number | null
          rules: Json
          stackable: boolean
          starts_at: string | null
          status: string
          tenant_id: string
          type: string
          updated_at: string
          usage_limit: number | null
          usage_per_customer: number | null
          used_count: number
          value: number
        }
        Insert: {
          applies_to?: string
          applies_to_ids?: string[]
          auto_apply?: boolean
          channels?: string[]
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          exclude_promotional?: boolean
          excludes_ids?: string[]
          first_purchase_only?: boolean
          id?: string
          max_discount_cents?: number | null
          min_order_cents?: number | null
          rules?: Json
          stackable?: boolean
          starts_at?: string | null
          status?: string
          tenant_id: string
          type: string
          updated_at?: string
          usage_limit?: number | null
          usage_per_customer?: number | null
          used_count?: number
          value?: number
        }
        Update: {
          applies_to?: string
          applies_to_ids?: string[]
          auto_apply?: boolean
          channels?: string[]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          exclude_promotional?: boolean
          excludes_ids?: string[]
          first_purchase_only?: boolean
          id?: string
          max_discount_cents?: number | null
          min_order_cents?: number | null
          rules?: Json
          stackable?: boolean
          starts_at?: string | null
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          usage_per_customer?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      credit_debit_logs: {
        Row: {
          created_at: string | null
          credits_debited: number
          id: string
          metadata: Json | null
          operation_type: string
          tenant_id: string
          units: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_debited: number
          id?: string
          metadata?: Json | null
          operation_type: string
          tenant_id: string
          units?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_debited?: number
          id?: string
          metadata?: Json | null
          operation_type?: string
          tenant_id?: string
          units?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_debit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_debit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_debit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_debit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          classification: string
          created_at: string
          created_by: string | null
          credits_delta: number
          cycle_reference: string
          entry_type: string
          id: string
          idempotency_key: string | null
          metadata: Json
          source_id: string | null
          source_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          classification?: string
          created_at?: string
          created_by?: string | null
          credits_delta: number
          cycle_reference?: string
          entry_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          source_id?: string | null
          source_type: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          classification?: string
          created_at?: string
          created_by?: string | null
          credits_delta?: number
          cycle_reference?: string
          entry_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          source_id?: string | null
          source_type?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_rates: {
        Row: {
          created_at: string | null
          credits_per_unit: number
          description: string | null
          id: string
          is_active: boolean | null
          operation_type: string
          unit_description: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_per_unit?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          operation_type: string
          unit_description?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_per_unit?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          operation_type?: string
          unit_description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_reset_run_users: {
        Row: {
          base_credits: number
          created_at: string
          extra_credits: number
          id: string
          remaining_after: number
          remaining_before: number
          restored_credits: number
          run_id: string
          tenant_id: string
          usage_debits_voided: number
          used_credits: number
          user_id: string
        }
        Insert: {
          base_credits: number
          created_at?: string
          extra_credits: number
          id?: string
          remaining_after: number
          remaining_before: number
          restored_credits: number
          run_id: string
          tenant_id: string
          usage_debits_voided?: number
          used_credits: number
          user_id: string
        }
        Update: {
          base_credits?: number
          created_at?: string
          extra_credits?: number
          id?: string
          remaining_after?: number
          remaining_before?: number
          restored_credits?: number
          run_id?: string
          tenant_id?: string
          usage_debits_voided?: number
          used_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_reset_run_users_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "credit_reset_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reset_run_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reset_run_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_reset_run_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_reset_run_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_reset_runs: {
        Row: {
          created_at: string
          created_by: string | null
          credits_restored: number
          cycle_reference: string
          id: string
          include_inactive: boolean
          metadata: Json
          reason: string
          usage_debits_voided: number
          users_restored: number
          users_scanned: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credits_restored?: number
          cycle_reference?: string
          id?: string
          include_inactive?: boolean
          metadata?: Json
          reason: string
          usage_debits_voided?: number
          users_restored?: number
          users_scanned?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credits_restored?: number
          cycle_reference?: string
          id?: string
          include_inactive?: boolean
          metadata?: Json
          reason?: string
          usage_debits_voided?: number
          users_restored?: number
          users_scanned?: number
        }
        Relationships: []
      }
      credit_sync_log: {
        Row: {
          credits_at_sync: number
          id: string
          master_acknowledged: boolean | null
          master_response: Json | null
          sync_type: string
          synced_at: string | null
          tenant_id: string
          usage_at_sync: Json | null
        }
        Insert: {
          credits_at_sync: number
          id?: string
          master_acknowledged?: boolean | null
          master_response?: Json | null
          sync_type: string
          synced_at?: string | null
          tenant_id: string
          usage_at_sync?: Json | null
        }
        Update: {
          credits_at_sync?: number
          id?: string
          master_acknowledged?: boolean | null
          master_response?: Json | null
          sync_type?: string
          synced_at?: string | null
          tenant_id?: string
          usage_at_sync?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json
          origin: string
          package_name: string | null
          price_brl: number
          price_cents: number | null
          status: string | null
          tenant_id: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json
          origin?: string
          package_name?: string | null
          price_brl: number
          price_cents?: number | null
          status?: string | null
          tenant_id?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json
          origin?: string
          package_name?: string | null
          price_brl?: number
          price_cents?: number | null
          status?: string | null
          tenant_id?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ecommerce_config: {
        Row: {
          accent_color: string | null
          benefit_delivery_text: string | null
          benefit_installment_text: string | null
          benefit_shipping_text: string | null
          benefit_warranty_text: string | null
          boleto_discount_percent: number | null
          boleto_enabled: boolean | null
          business_address: string | null
          business_hours: Json | null
          button_style: string | null
          cart_capture_block_checkout: boolean | null
          cart_capture_description: string | null
          cart_capture_enabled: boolean | null
          cart_capture_name_label: string | null
          cart_capture_name_placeholder: string | null
          cart_capture_phone_label: string | null
          cart_capture_phone_placeholder: string | null
          cart_capture_privacy_note: string | null
          cart_capture_reprompt_after_hours: number | null
          cart_capture_reprompt_after_items: number | null
          cart_capture_reprompt_after_value: number | null
          cart_capture_reprompt_max_per_session: number | null
          cart_capture_reprompt_preset: string | null
          cart_capture_required: boolean | null
          cart_capture_secure_note_1: string | null
          cart_capture_secure_note_2: string | null
          cart_capture_skip_text: string | null
          cart_capture_step1_subtitle: string | null
          cart_capture_step1_title: string | null
          cart_capture_step2_subtitle: string | null
          cart_capture_step2_title: string | null
          cart_capture_submit_text: string | null
          cart_capture_title: string | null
          cart_gamification_config: Json | null
          catalog_columns_desktop: number | null
          catalog_columns_mobile: number | null
          catalog_default_sort: string | null
          catalog_display_mode: string | null
          coupon_field_collapsed_default: boolean | null
          coupons_enabled: boolean | null
          created_at: string | null
          debit_card_discount_percent: number | null
          debit_card_enabled: boolean | null
          default_faq: Json | null
          enable_catalog_filters: boolean | null
          enable_stock: boolean | null
          enable_variants: boolean | null
          favicon_url: string | null
          financing_enabled: boolean | null
          financing_label: string | null
          financing_max_installments: number | null
          financing_simulator_default_entry_percent: number | null
          financing_simulator_enabled: boolean | null
          financing_simulator_interest_rate: number | null
          financing_simulator_max_entry_percent: number | null
          financing_simulator_min_entry_percent: number | null
          financing_simulator_title: string | null
          font_family: string | null
          footer_city_state: string | null
          footer_cta_enabled: boolean | null
          footer_cta_link: string | null
          footer_cta_text: string | null
          footer_cta_type: string | null
          footer_description: string | null
          footer_links: Json | null
          footer_show_social: boolean | null
          footer_show_trust_badges: boolean | null
          footer_social_facebook: string | null
          footer_social_instagram: string | null
          footer_social_tiktok: string | null
          footer_social_youtube: string | null
          footer_trust_badges: Json | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          id: string
          installment_enabled: boolean | null
          installment_max_without_interest: number | null
          installment_min_value: number | null
          installment_with_interest_enabled: boolean | null
          installment_with_interest_max: number | null
          installment_with_interest_rate: number | null
          is_enabled: boolean | null
          layout_template: string | null
          lead_capture_enabled: boolean | null
          lead_capture_message: string | null
          lead_capture_title: string | null
          logo_size: string | null
          logo_url: string | null
          low_stock_threshold: number | null
          meta_conversions_api_token: string | null
          meta_pixel_id: string | null
          mobile_fixed_cta: boolean | null
          pix_discount_percent: number | null
          pix_enabled: boolean | null
          pix_label: string | null
          policy_faq_content: string | null
          policy_privacy_content: string | null
          policy_returns_content: string | null
          policy_terms_content: string | null
          primary_color: string | null
          product_cta_text: string | null
          product_cta_type: string | null
          product_faq: Json | null
          require_wholesale_approval: boolean | null
          secondary_color: string | null
          share_image_url: string | null
          shipping_default_height_cm: number | null
          shipping_default_length_cm: number | null
          shipping_default_mode: string | null
          shipping_default_weight_grams: number | null
          shipping_default_width_cm: number | null
          shipping_enabled: boolean | null
          shipping_max_options: number | null
          shipping_origin_cep: string | null
          shipping_required_at_checkout: boolean | null
          shipping_required_before_checkout: boolean
          shipping_show_all: boolean | null
          shipping_sort_mode: string | null
          show_benefits_bar: boolean | null
          show_descriptions: boolean | null
          show_prices: boolean | null
          show_product_faq: boolean | null
          show_stock_status: boolean | null
          show_trust_badges: boolean | null
          show_urgency_indicators: boolean | null
          store_name: string | null
          tenant_id: string
          tiktok_pixel_id: string | null
          tracking_pixels_enabled: boolean | null
          trust_badge_exchange_text: string | null
          trust_badge_items: Json | null
          trust_badge_original_text: string | null
          trust_badge_payment_text: string | null
          trust_badge_support_text: string | null
          updated_at: string | null
          urgency_featured_text: string | null
          urgency_low_stock_text: string | null
          video_shopping_enabled: boolean | null
          video_shopping_position: string | null
          video_shopping_title: string | null
          welcome_message: string | null
          whatsapp_number: string | null
          wholesale_price_label: string | null
        }
        Insert: {
          accent_color?: string | null
          benefit_delivery_text?: string | null
          benefit_installment_text?: string | null
          benefit_shipping_text?: string | null
          benefit_warranty_text?: string | null
          boleto_discount_percent?: number | null
          boleto_enabled?: boolean | null
          business_address?: string | null
          business_hours?: Json | null
          button_style?: string | null
          cart_capture_block_checkout?: boolean | null
          cart_capture_description?: string | null
          cart_capture_enabled?: boolean | null
          cart_capture_name_label?: string | null
          cart_capture_name_placeholder?: string | null
          cart_capture_phone_label?: string | null
          cart_capture_phone_placeholder?: string | null
          cart_capture_privacy_note?: string | null
          cart_capture_reprompt_after_hours?: number | null
          cart_capture_reprompt_after_items?: number | null
          cart_capture_reprompt_after_value?: number | null
          cart_capture_reprompt_max_per_session?: number | null
          cart_capture_reprompt_preset?: string | null
          cart_capture_required?: boolean | null
          cart_capture_secure_note_1?: string | null
          cart_capture_secure_note_2?: string | null
          cart_capture_skip_text?: string | null
          cart_capture_step1_subtitle?: string | null
          cart_capture_step1_title?: string | null
          cart_capture_step2_subtitle?: string | null
          cart_capture_step2_title?: string | null
          cart_capture_submit_text?: string | null
          cart_capture_title?: string | null
          cart_gamification_config?: Json | null
          catalog_columns_desktop?: number | null
          catalog_columns_mobile?: number | null
          catalog_default_sort?: string | null
          catalog_display_mode?: string | null
          coupon_field_collapsed_default?: boolean | null
          coupons_enabled?: boolean | null
          created_at?: string | null
          debit_card_discount_percent?: number | null
          debit_card_enabled?: boolean | null
          default_faq?: Json | null
          enable_catalog_filters?: boolean | null
          enable_stock?: boolean | null
          enable_variants?: boolean | null
          favicon_url?: string | null
          financing_enabled?: boolean | null
          financing_label?: string | null
          financing_max_installments?: number | null
          financing_simulator_default_entry_percent?: number | null
          financing_simulator_enabled?: boolean | null
          financing_simulator_interest_rate?: number | null
          financing_simulator_max_entry_percent?: number | null
          financing_simulator_min_entry_percent?: number | null
          financing_simulator_title?: string | null
          font_family?: string | null
          footer_city_state?: string | null
          footer_cta_enabled?: boolean | null
          footer_cta_link?: string | null
          footer_cta_text?: string | null
          footer_cta_type?: string | null
          footer_description?: string | null
          footer_links?: Json | null
          footer_show_social?: boolean | null
          footer_show_trust_badges?: boolean | null
          footer_social_facebook?: string | null
          footer_social_instagram?: string | null
          footer_social_tiktok?: string | null
          footer_social_youtube?: string | null
          footer_trust_badges?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          installment_enabled?: boolean | null
          installment_max_without_interest?: number | null
          installment_min_value?: number | null
          installment_with_interest_enabled?: boolean | null
          installment_with_interest_max?: number | null
          installment_with_interest_rate?: number | null
          is_enabled?: boolean | null
          layout_template?: string | null
          lead_capture_enabled?: boolean | null
          lead_capture_message?: string | null
          lead_capture_title?: string | null
          logo_size?: string | null
          logo_url?: string | null
          low_stock_threshold?: number | null
          meta_conversions_api_token?: string | null
          meta_pixel_id?: string | null
          mobile_fixed_cta?: boolean | null
          pix_discount_percent?: number | null
          pix_enabled?: boolean | null
          pix_label?: string | null
          policy_faq_content?: string | null
          policy_privacy_content?: string | null
          policy_returns_content?: string | null
          policy_terms_content?: string | null
          primary_color?: string | null
          product_cta_text?: string | null
          product_cta_type?: string | null
          product_faq?: Json | null
          require_wholesale_approval?: boolean | null
          secondary_color?: string | null
          share_image_url?: string | null
          shipping_default_height_cm?: number | null
          shipping_default_length_cm?: number | null
          shipping_default_mode?: string | null
          shipping_default_weight_grams?: number | null
          shipping_default_width_cm?: number | null
          shipping_enabled?: boolean | null
          shipping_max_options?: number | null
          shipping_origin_cep?: string | null
          shipping_required_at_checkout?: boolean | null
          shipping_required_before_checkout?: boolean
          shipping_show_all?: boolean | null
          shipping_sort_mode?: string | null
          show_benefits_bar?: boolean | null
          show_descriptions?: boolean | null
          show_prices?: boolean | null
          show_product_faq?: boolean | null
          show_stock_status?: boolean | null
          show_trust_badges?: boolean | null
          show_urgency_indicators?: boolean | null
          store_name?: string | null
          tenant_id: string
          tiktok_pixel_id?: string | null
          tracking_pixels_enabled?: boolean | null
          trust_badge_exchange_text?: string | null
          trust_badge_items?: Json | null
          trust_badge_original_text?: string | null
          trust_badge_payment_text?: string | null
          trust_badge_support_text?: string | null
          updated_at?: string | null
          urgency_featured_text?: string | null
          urgency_low_stock_text?: string | null
          video_shopping_enabled?: boolean | null
          video_shopping_position?: string | null
          video_shopping_title?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
          wholesale_price_label?: string | null
        }
        Update: {
          accent_color?: string | null
          benefit_delivery_text?: string | null
          benefit_installment_text?: string | null
          benefit_shipping_text?: string | null
          benefit_warranty_text?: string | null
          boleto_discount_percent?: number | null
          boleto_enabled?: boolean | null
          business_address?: string | null
          business_hours?: Json | null
          button_style?: string | null
          cart_capture_block_checkout?: boolean | null
          cart_capture_description?: string | null
          cart_capture_enabled?: boolean | null
          cart_capture_name_label?: string | null
          cart_capture_name_placeholder?: string | null
          cart_capture_phone_label?: string | null
          cart_capture_phone_placeholder?: string | null
          cart_capture_privacy_note?: string | null
          cart_capture_reprompt_after_hours?: number | null
          cart_capture_reprompt_after_items?: number | null
          cart_capture_reprompt_after_value?: number | null
          cart_capture_reprompt_max_per_session?: number | null
          cart_capture_reprompt_preset?: string | null
          cart_capture_required?: boolean | null
          cart_capture_secure_note_1?: string | null
          cart_capture_secure_note_2?: string | null
          cart_capture_skip_text?: string | null
          cart_capture_step1_subtitle?: string | null
          cart_capture_step1_title?: string | null
          cart_capture_step2_subtitle?: string | null
          cart_capture_step2_title?: string | null
          cart_capture_submit_text?: string | null
          cart_capture_title?: string | null
          cart_gamification_config?: Json | null
          catalog_columns_desktop?: number | null
          catalog_columns_mobile?: number | null
          catalog_default_sort?: string | null
          catalog_display_mode?: string | null
          coupon_field_collapsed_default?: boolean | null
          coupons_enabled?: boolean | null
          created_at?: string | null
          debit_card_discount_percent?: number | null
          debit_card_enabled?: boolean | null
          default_faq?: Json | null
          enable_catalog_filters?: boolean | null
          enable_stock?: boolean | null
          enable_variants?: boolean | null
          favicon_url?: string | null
          financing_enabled?: boolean | null
          financing_label?: string | null
          financing_max_installments?: number | null
          financing_simulator_default_entry_percent?: number | null
          financing_simulator_enabled?: boolean | null
          financing_simulator_interest_rate?: number | null
          financing_simulator_max_entry_percent?: number | null
          financing_simulator_min_entry_percent?: number | null
          financing_simulator_title?: string | null
          font_family?: string | null
          footer_city_state?: string | null
          footer_cta_enabled?: boolean | null
          footer_cta_link?: string | null
          footer_cta_text?: string | null
          footer_cta_type?: string | null
          footer_description?: string | null
          footer_links?: Json | null
          footer_show_social?: boolean | null
          footer_show_trust_badges?: boolean | null
          footer_social_facebook?: string | null
          footer_social_instagram?: string | null
          footer_social_tiktok?: string | null
          footer_social_youtube?: string | null
          footer_trust_badges?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          installment_enabled?: boolean | null
          installment_max_without_interest?: number | null
          installment_min_value?: number | null
          installment_with_interest_enabled?: boolean | null
          installment_with_interest_max?: number | null
          installment_with_interest_rate?: number | null
          is_enabled?: boolean | null
          layout_template?: string | null
          lead_capture_enabled?: boolean | null
          lead_capture_message?: string | null
          lead_capture_title?: string | null
          logo_size?: string | null
          logo_url?: string | null
          low_stock_threshold?: number | null
          meta_conversions_api_token?: string | null
          meta_pixel_id?: string | null
          mobile_fixed_cta?: boolean | null
          pix_discount_percent?: number | null
          pix_enabled?: boolean | null
          pix_label?: string | null
          policy_faq_content?: string | null
          policy_privacy_content?: string | null
          policy_returns_content?: string | null
          policy_terms_content?: string | null
          primary_color?: string | null
          product_cta_text?: string | null
          product_cta_type?: string | null
          product_faq?: Json | null
          require_wholesale_approval?: boolean | null
          secondary_color?: string | null
          share_image_url?: string | null
          shipping_default_height_cm?: number | null
          shipping_default_length_cm?: number | null
          shipping_default_mode?: string | null
          shipping_default_weight_grams?: number | null
          shipping_default_width_cm?: number | null
          shipping_enabled?: boolean | null
          shipping_max_options?: number | null
          shipping_origin_cep?: string | null
          shipping_required_at_checkout?: boolean | null
          shipping_required_before_checkout?: boolean
          shipping_show_all?: boolean | null
          shipping_sort_mode?: string | null
          show_benefits_bar?: boolean | null
          show_descriptions?: boolean | null
          show_prices?: boolean | null
          show_product_faq?: boolean | null
          show_stock_status?: boolean | null
          show_trust_badges?: boolean | null
          show_urgency_indicators?: boolean | null
          store_name?: string | null
          tenant_id?: string
          tiktok_pixel_id?: string | null
          tracking_pixels_enabled?: boolean | null
          trust_badge_exchange_text?: string | null
          trust_badge_items?: Json | null
          trust_badge_original_text?: string | null
          trust_badge_payment_text?: string | null
          trust_badge_support_text?: string | null
          updated_at?: string | null
          urgency_featured_text?: string | null
          urgency_low_stock_text?: string | null
          video_shopping_enabled?: boolean | null
          video_shopping_position?: string | null
          video_shopping_title?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
          wholesale_price_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      embedding_queue: {
        Row: {
          attempts: number | null
          content_hash: string | null
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          source_id: string
          source_table: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          content_hash?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          source_id: string
          source_table: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          content_hash?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          source_id?: string
          source_table?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embedding_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "embedding_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      event_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          max_retries: number | null
          payload: Json | null
          priority: number
          processed_at: string | null
          result: Json | null
          retry_count: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          max_retries?: number | null
          payload?: Json | null
          priority?: number
          processed_at?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          max_retries?: number | null
          payload?: Json | null
          priority?: number
          processed_at?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "event_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled_tenant_ids: string[] | null
          id: string
          is_enabled_globally: boolean | null
          name: string
          rollout_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled_tenant_ids?: string[] | null
          id?: string
          is_enabled_globally?: boolean | null
          name: string
          rollout_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled_tenant_ids?: string[] | null
          id?: string
          is_enabled_globally?: boolean | null
          name?: string
          rollout_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flow_execution_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          data_received: Json | null
          data_sent: Json | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          flow_id: string
          id: string
          lead_id: string
          status: string
          step_id: string
          step_name: string
          tenant_id: string
          updated_at: string
          whatsapp_instance_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          data_received?: Json | null
          data_sent?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          flow_id: string
          id?: string
          lead_id: string
          status: string
          step_id: string
          step_name: string
          tenant_id: string
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          data_received?: Json | null
          data_sent?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          flow_id?: string
          id?: string
          lead_id?: string
          status?: string
          step_id?: string
          step_name?: string
          tenant_id?: string
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_execution_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_execution_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "flow_execution_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "flow_execution_logs_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_executions: {
        Row: {
          completed_at: string | null
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          current_step_index: number | null
          error_count: number | null
          error_message: string | null
          flow_id: string
          id: string
          lead_id: string | null
          next_step_at: string | null
          started_at: string | null
          status: string | null
          tenant_id: string
          variables: Json | null
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_count?: number | null
          error_message?: string | null
          flow_id: string
          id?: string
          lead_id?: string | null
          next_step_at?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          variables?: Json | null
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_count?: number | null
          error_message?: string | null
          flow_id?: string
          id?: string
          lead_id?: string | null
          next_step_at?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_executions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "flow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      flow_step_metrics: {
        Row: {
          avg_duration_ms: number | null
          conversion_rate: number | null
          flow_id: string
          id: string
          last_updated: string
          step_id: string
          step_name: string
          tenant_id: string
          total_abandoned: number
          total_completes: number
          total_enters: number
          total_failures: number
        }
        Insert: {
          avg_duration_ms?: number | null
          conversion_rate?: number | null
          flow_id: string
          id?: string
          last_updated?: string
          step_id: string
          step_name: string
          tenant_id: string
          total_abandoned?: number
          total_completes?: number
          total_enters?: number
          total_failures?: number
        }
        Update: {
          avg_duration_ms?: number | null
          conversion_rate?: number | null
          flow_id?: string
          id?: string
          last_updated?: string
          step_id?: string
          step_name?: string
          tenant_id?: string
          total_abandoned?: number
          total_completes?: number
          total_enters?: number
          total_failures?: number
        }
        Relationships: [
          {
            foreignKeyName: "flow_step_metrics_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_step_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_step_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "flow_step_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          color: string | null
          created_at: string
          funnel_id: string | null
          id: string
          is_active: boolean | null
          is_lost: boolean | null
          is_system: boolean | null
          is_won: boolean | null
          name: string
          position: number | null
          slug: string | null
          sort_order: number | null
          system_type: string | null
          tenant_id: string | null
          win_probability: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          funnel_id?: string | null
          id?: string
          is_active?: boolean | null
          is_lost?: boolean | null
          is_system?: boolean | null
          is_won?: boolean | null
          name: string
          position?: number | null
          slug?: string | null
          sort_order?: number | null
          system_type?: string | null
          tenant_id?: string | null
          win_probability?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          funnel_id?: string | null
          id?: string
          is_active?: boolean | null
          is_lost?: boolean | null
          is_system?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number | null
          slug?: string | null
          sort_order?: number | null
          system_type?: string | null
          tenant_id?: string | null
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      gcp_billing_daily: {
        Row: {
          cost_brl: number
          cost_usd: number
          created_at: string
          credits_usd: number
          currency: string
          id: string
          labels: Json
          location: string
          project_id: string
          raw: Json | null
          service: string
          sku_description: string | null
          sku_id: string
          updated_at: string
          usage_amount: number
          usage_date: string
          usage_unit: string | null
          usd_brl_rate: number
        }
        Insert: {
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          credits_usd?: number
          currency?: string
          id?: string
          labels?: Json
          location?: string
          project_id?: string
          raw?: Json | null
          service: string
          sku_description?: string | null
          sku_id?: string
          updated_at?: string
          usage_amount?: number
          usage_date: string
          usage_unit?: string | null
          usd_brl_rate?: number
        }
        Update: {
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          credits_usd?: number
          currency?: string
          id?: string
          labels?: Json
          location?: string
          project_id?: string
          raw?: Json | null
          service?: string
          sku_description?: string | null
          sku_id?: string
          updated_at?: string
          usage_amount?: number
          usage_date?: string
          usage_unit?: string | null
          usd_brl_rate?: number
        }
        Relationships: []
      }
      gcs_billing_daily: {
        Row: {
          billing_date: string
          bucket_name: string
          class_a_ops: number
          class_b_ops: number
          cost_egress_brl: number
          cost_ops_brl: number
          cost_storage_brl: number
          cost_total_brl: number | null
          created_at: string
          egress_bytes: number
          id: string
          metadata: Json
          region: string | null
          source: string
          storage_bytes_avg: number
          storage_class: string | null
          tenant_id: string | null
        }
        Insert: {
          billing_date: string
          bucket_name: string
          class_a_ops?: number
          class_b_ops?: number
          cost_egress_brl?: number
          cost_ops_brl?: number
          cost_storage_brl?: number
          cost_total_brl?: number | null
          created_at?: string
          egress_bytes?: number
          id?: string
          metadata?: Json
          region?: string | null
          source?: string
          storage_bytes_avg?: number
          storage_class?: string | null
          tenant_id?: string | null
        }
        Update: {
          billing_date?: string
          bucket_name?: string
          class_a_ops?: number
          class_b_ops?: number
          cost_egress_brl?: number
          cost_ops_brl?: number
          cost_storage_brl?: number
          cost_total_brl?: number | null
          created_at?: string
          egress_bytes?: number
          id?: string
          metadata?: Json
          region?: string | null
          source?: string
          storage_bytes_avg?: number
          storage_class?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      gcs_billing_sync_log: {
        Row: {
          bq_bytes_billed: number | null
          date_from: string | null
          date_to: string | null
          error: string | null
          finished_at: string | null
          id: string
          rows_upserted: number | null
          started_at: string
          status: string
        }
        Insert: {
          bq_bytes_billed?: number | null
          date_from?: string | null
          date_to?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          rows_upserted?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          bq_bytes_billed?: number | null
          date_from?: string | null
          date_to?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          rows_upserted?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      gestao_auto_analyses: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          marketing_insights: Json | null
          metrics: Json | null
          source: string
          tenant_id: string
          title: string
          total_vehicles: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          marketing_insights?: Json | null
          metrics?: Json | null
          source?: string
          tenant_id: string
          title?: string
          total_vehicles?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          marketing_insights?: Json | null
          metrics?: Json | null
          source?: string
          tenant_id?: string
          title?: string
          total_vehicles?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestao_auto_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestao_auto_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "gestao_auto_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      gestao_auto_vehicles: {
        Row: {
          aging_category: string | null
          analysis_id: string
          ano_modelo: string | null
          categoria: string | null
          codigo_fipe: string | null
          created_at: string | null
          custo_oportunidade: number | null
          data_entrada: string | null
          dias_no_patio: number | null
          diferenca_fipe: number | null
          diferenca_fipe_pct: number | null
          extras: Json | null
          fipe_badge: string | null
          fipe_referencia: string | null
          fipe_status: string | null
          fipe_valor: number | null
          id: string
          margem_bruta: number | null
          margem_bruta_pct: number | null
          modelo: string
          placa: string | null
          preco_custo: number
          preco_venda: number
          score_liquidez: number | null
          tenant_id: string
        }
        Insert: {
          aging_category?: string | null
          analysis_id: string
          ano_modelo?: string | null
          categoria?: string | null
          codigo_fipe?: string | null
          created_at?: string | null
          custo_oportunidade?: number | null
          data_entrada?: string | null
          dias_no_patio?: number | null
          diferenca_fipe?: number | null
          diferenca_fipe_pct?: number | null
          extras?: Json | null
          fipe_badge?: string | null
          fipe_referencia?: string | null
          fipe_status?: string | null
          fipe_valor?: number | null
          id?: string
          margem_bruta?: number | null
          margem_bruta_pct?: number | null
          modelo: string
          placa?: string | null
          preco_custo?: number
          preco_venda?: number
          score_liquidez?: number | null
          tenant_id: string
        }
        Update: {
          aging_category?: string | null
          analysis_id?: string
          ano_modelo?: string | null
          categoria?: string | null
          codigo_fipe?: string | null
          created_at?: string | null
          custo_oportunidade?: number | null
          data_entrada?: string | null
          dias_no_patio?: number | null
          diferenca_fipe?: number | null
          diferenca_fipe_pct?: number | null
          extras?: Json | null
          fipe_badge?: string | null
          fipe_referencia?: string | null
          fipe_status?: string | null
          fipe_valor?: number | null
          id?: string
          margem_bruta?: number | null
          margem_bruta_pct?: number | null
          modelo?: string
          placa?: string | null
          preco_custo?: number
          preco_venda?: number
          score_liquidez?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gestao_auto_vehicles_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "gestao_auto_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestao_auto_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestao_auto_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "gestao_auto_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      group_campaign_sends: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          group_jid: string
          id: string
          sent_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          group_jid: string
          id?: string
          sent_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          group_jid?: string
          id?: string
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_campaign_sends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_campaign_sends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "group_campaign_sends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string | null
          created_at: string
          external_message_id: string | null
          group_jid: string
          id: string
          is_from_me: boolean | null
          media_url: string | null
          sender_jid: string | null
          sender_name: string | null
          tenant_id: string
          type: string | null
          updated_at: string
          whatsapp_instance_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          external_message_id?: string | null
          group_jid: string
          id?: string
          is_from_me?: boolean | null
          media_url?: string | null
          sender_jid?: string | null
          sender_name?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          external_message_id?: string | null
          group_jid?: string
          id?: string
          is_from_me?: boolean | null
          media_url?: string | null
          sender_jid?: string | null
          sender_name?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "group_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "group_messages_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonate_sessions: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          target_tenant_id: string
          target_user_id: string | null
          token: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          target_tenant_id: string
          target_user_id?: string | null
          token: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          target_tenant_id?: string
          target_user_id?: string | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonate_sessions_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonate_sessions_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "impersonate_sessions_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      instagram_comments: {
        Row: {
          channel_id: string | null
          comment_id: string
          created_at: string
          dm_sent: boolean | null
          id: string
          is_reply: boolean | null
          parent_id: string | null
          post_id: string | null
          processed: boolean | null
          tenant_id: string
          text: string | null
          username: string | null
        }
        Insert: {
          channel_id?: string | null
          comment_id: string
          created_at?: string
          dm_sent?: boolean | null
          id?: string
          is_reply?: boolean | null
          parent_id?: string | null
          post_id?: string | null
          processed?: boolean | null
          tenant_id: string
          text?: string | null
          username?: string | null
        }
        Update: {
          channel_id?: string | null
          comment_id?: string
          created_at?: string
          dm_sent?: boolean | null
          id?: string
          is_reply?: boolean | null
          parent_id?: string | null
          post_id?: string | null
          processed?: boolean | null
          tenant_id?: string
          text?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_comments_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "instagram_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      instance_health_metrics: {
        Row: {
          avg_delivery_time_ms: number | null
          ban_risk_score: number | null
          created_at: string
          error_count_today: number
          error_rate: number | null
          id: string
          instance_status: string
          last_error: string | null
          last_message_at: string | null
          messages_sent_last_minute: number
          messages_sent_this_hour: number
          messages_sent_today: number
          metric_date: string
          tenant_id: string
          updated_at: string
          whatsapp_instance_id: string
        }
        Insert: {
          avg_delivery_time_ms?: number | null
          ban_risk_score?: number | null
          created_at?: string
          error_count_today?: number
          error_rate?: number | null
          id?: string
          instance_status?: string
          last_error?: string | null
          last_message_at?: string | null
          messages_sent_last_minute?: number
          messages_sent_this_hour?: number
          messages_sent_today?: number
          metric_date?: string
          tenant_id: string
          updated_at?: string
          whatsapp_instance_id: string
        }
        Update: {
          avg_delivery_time_ms?: number | null
          ban_risk_score?: number | null
          created_at?: string
          error_count_today?: number
          error_rate?: number | null
          id?: string
          instance_status?: string
          last_error?: string | null
          last_message_at?: string | null
          messages_sent_last_minute?: number
          messages_sent_this_hour?: number
          messages_sent_today?: number
          metric_date?: string
          tenant_id?: string
          updated_at?: string
          whatsapp_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instance_health_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instance_health_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "instance_health_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "instance_health_metrics_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      instance_warmup_schedule: {
        Row: {
          created_at: string | null
          current_day: number | null
          id: string
          instance_id: string
          max_messages_per_day: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_day?: number | null
          id?: string
          instance_id: string
          max_messages_per_day?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_day?: number | null
          id?: string
          instance_id?: string
          max_messages_per_day?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          direction: string
          error_details: Json | null
          id: string
          integration_type: string
          records_failed: number | null
          records_processed: number | null
          started_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          direction?: string
          error_details?: Json | null
          id?: string
          integration_type: string
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          direction?: string
          error_details?: Json | null
          id?: string
          integration_type?: string
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "integration_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      integration_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          integration_id: string | null
          payload: Json | null
          processed_at: string | null
          provider: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string | null
          created_by: string | null
          credentials: Json | null
          events_received: number | null
          id: string
          last_error: string | null
          last_event_at: string | null
          last_sync_at: string | null
          name: string
          provider: string
          status: string | null
          sync_config: Json | null
          tenant_id: string
          updated_at: string | null
          webhook_token: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          events_received?: number | null
          id?: string
          last_error?: string | null
          last_event_at?: string | null
          last_sync_at?: string | null
          name: string
          provider: string
          status?: string | null
          sync_config?: Json | null
          tenant_id: string
          updated_at?: string | null
          webhook_token?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          events_received?: number | null
          id?: string
          last_error?: string | null
          last_event_at?: string | null
          last_sync_at?: string | null
          name?: string
          provider?: string
          status?: string | null
          sync_config?: Json | null
          tenant_id?: string
          updated_at?: string | null
          webhook_token?: string | null
        }
        Relationships: []
      }
      internal_notes: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "internal_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      invite_links: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          plan_type: string | null
          sales_rep_id: string
          trial_days: number | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type?: string | null
          sales_rep_id: string
          trial_days?: number | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type?: string | null
          sales_rep_id?: string
          trial_days?: number | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          embedding_model: string | null
          id: string
          is_active: boolean | null
          is_from_template: boolean | null
          keywords: string[] | null
          last_used_at: string | null
          priority: number | null
          search_vector: unknown
          tenant_id: string | null
          title: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          is_from_template?: boolean | null
          keywords?: string[] | null
          last_used_at?: string | null
          priority?: number | null
          search_vector?: unknown
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          is_from_template?: boolean | null
          keywords?: string[] | null
          last_used_at?: string | null
          priority?: number | null
          search_vector?: unknown
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "knowledge_base_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ai_suggestions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          confidence: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          status: string | null
          suggestion: Json
          tenant_id: string
          type: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          suggestion: Json
          tenant_id: string
          type: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          suggestion?: Json
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_suggestions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_suggestions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_suggestions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_ai_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_deals: {
        Row: {
          closed_at: string
          closed_by: string | null
          created_at: string
          deal_type: string
          deal_value: number | null
          discount_percent: number | null
          funnel_id: string | null
          id: string
          lead_id: string
          loss_notes: string | null
          loss_reason: string | null
          metadata: Json | null
          original_price: number | null
          previous_stage_id: string | null
          product_id: string | null
          product_name: string | null
          tenant_id: string
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          deal_type: string
          deal_value?: number | null
          discount_percent?: number | null
          funnel_id?: string | null
          id?: string
          lead_id: string
          loss_notes?: string | null
          loss_reason?: string | null
          metadata?: Json | null
          original_price?: number | null
          previous_stage_id?: string | null
          product_id?: string | null
          product_name?: string | null
          tenant_id: string
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          deal_type?: string
          deal_value?: number | null
          discount_percent?: number | null
          funnel_id?: string | null
          id?: string
          lead_id?: string
          loss_notes?: string | null
          loss_reason?: string | null
          metadata?: Json | null
          original_price?: number | null
          previous_stage_id?: string | null
          product_id?: string | null
          product_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_deals_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "admin_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_import_history: {
        Row: {
          assignment_mode: string
          batch_id: string
          created_at: string
          duplicates_count: number
          errors_count: number
          file_name: string | null
          funnel_id: string | null
          funnel_stage_id: string | null
          id: string
          imported_count: number
          metadata: Json | null
          source_type: string
          status: string
          tenant_id: string
          total_records: number
          updated_count: number
          user_id: string
        }
        Insert: {
          assignment_mode?: string
          batch_id: string
          created_at?: string
          duplicates_count?: number
          errors_count?: number
          file_name?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          imported_count?: number
          metadata?: Json | null
          source_type?: string
          status?: string
          tenant_id: string
          total_records?: number
          updated_count?: number
          user_id: string
        }
        Update: {
          assignment_mode?: string
          batch_id?: string
          created_at?: string
          duplicates_count?: number
          errors_count?: number
          file_name?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          imported_count?: number
          metadata?: Json | null
          source_type?: string
          status?: string
          tenant_id?: string
          total_records?: number
          updated_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_interaction_times: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string
          day_of_week: number
          hour_of_day: number
          id: string
          interaction_count: number
          last_interaction_at: string
          lead_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string
          day_of_week: number
          hour_of_day: number
          id?: string
          interaction_count?: number
          last_interaction_at?: string
          lead_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string
          day_of_week?: number
          hour_of_day?: number
          id?: string
          interaction_count?: number
          last_interaction_at?: string
          lead_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interaction_times_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interaction_times_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interaction_times_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_interaction_times_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_memory: {
        Row: {
          anonymized_at: string | null
          budget_info: Json | null
          communication_style: string | null
          competitor_mentions: string[] | null
          conversation_memories: Json | null
          conversation_summary: string | null
          created_at: string | null
          decision_factors: string[] | null
          deleted_at: string | null
          id: string
          interests: string[] | null
          key_quotes: string[] | null
          last_interaction_at: string | null
          lead_id: string
          memory_text: string | null
          metadata: Json | null
          next_steps: string | null
          objections_raised: string[] | null
          objections_resolved: string[] | null
          pain_points: string[] | null
          preferences: Json | null
          qualification_notes: string | null
          tenant_id: string
          total_interactions: number | null
          updated_at: string | null
          urgency_level: string | null
        }
        Insert: {
          anonymized_at?: string | null
          budget_info?: Json | null
          communication_style?: string | null
          competitor_mentions?: string[] | null
          conversation_memories?: Json | null
          conversation_summary?: string | null
          created_at?: string | null
          decision_factors?: string[] | null
          deleted_at?: string | null
          id?: string
          interests?: string[] | null
          key_quotes?: string[] | null
          last_interaction_at?: string | null
          lead_id: string
          memory_text?: string | null
          metadata?: Json | null
          next_steps?: string | null
          objections_raised?: string[] | null
          objections_resolved?: string[] | null
          pain_points?: string[] | null
          preferences?: Json | null
          qualification_notes?: string | null
          tenant_id: string
          total_interactions?: number | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Update: {
          anonymized_at?: string | null
          budget_info?: Json | null
          communication_style?: string | null
          competitor_mentions?: string[] | null
          conversation_memories?: Json | null
          conversation_summary?: string | null
          created_at?: string | null
          decision_factors?: string[] | null
          deleted_at?: string | null
          id?: string
          interests?: string[] | null
          key_quotes?: string[] | null
          last_interaction_at?: string | null
          lead_id?: string
          memory_text?: string | null
          metadata?: Json | null
          next_steps?: string | null
          objections_raised?: string[] | null
          objections_resolved?: string[] | null
          pain_points?: string[] | null
          preferences?: Json | null
          qualification_notes?: string | null
          tenant_id?: string
          total_interactions?: number | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: string
          lead_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_routing_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          match_instance_id: string | null
          match_source: string | null
          match_tags: string[] | null
          name: string
          priority: number
          target_assigned_to: string | null
          target_funnel_id: string | null
          target_stage_id: string | null
          target_tags: string[] | null
          target_temperature: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          match_instance_id?: string | null
          match_source?: string | null
          match_tags?: string[] | null
          name: string
          priority?: number
          target_assigned_to?: string | null
          target_funnel_id?: string | null
          target_stage_id?: string | null
          target_tags?: string[] | null
          target_temperature?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          match_instance_id?: string | null
          match_source?: string | null
          match_tags?: string[] | null
          name?: string
          priority?: number
          target_assigned_to?: string | null
          target_funnel_id?: string | null
          target_stage_id?: string | null
          target_tags?: string[] | null
          target_temperature?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_routing_rules_match_instance_id_fkey"
            columns: ["match_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_routing_rules_target_funnel_id_fkey"
            columns: ["target_funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_routing_rules_target_stage_id_fkey"
            columns: ["target_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_routing_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_routing_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_routing_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lead_transfers: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          from_user_id: string | null
          id: string
          lead_id: string | null
          reason: string | null
          task_id: string | null
          tenant_id: string
          to_user_id: string | null
          transfer_type: string
          transferred_by: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          lead_id?: string | null
          reason?: string | null
          task_id?: string | null
          tenant_id: string
          to_user_id?: string | null
          transfer_type?: string
          transferred_by?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          lead_id?: string | null
          reason?: string | null
          task_id?: string | null
          tenant_id?: string
          to_user_id?: string | null
          transfer_type?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_transfers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          anonymized_at: string | null
          assigned_to: string | null
          avatar: string | null
          birth_date: string | null
          cci_classified_at: string | null
          cci_score: number | null
          cci_temperature: string | null
          cci_zone: string | null
          checkout_token: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string | null
          funnel_id: string | null
          funnel_stage_id: string | null
          id: string
          import_campaign_id: string | null
          import_source: string | null
          last_contact: string | null
          meta_ads_referral: Json | null
          name: string | null
          notes: string[] | null
          phone: string
          product_id: string | null
          product_interest: string | null
          profile_data: Json | null
          sort_position: number | null
          source: string | null
          stage: string | null
          stage_changed_at: string | null
          tags: string[] | null
          temperature: string | null
          tenant_id: string
          updated_at: string | null
          value: number | null
          whatsapp_about: string | null
          whatsapp_is_online: boolean | null
          whatsapp_label_id: string | null
          whatsapp_last_seen: string | null
          whatsapp_profile_picture: string | null
          whatsapp_verified: boolean | null
        }
        Insert: {
          anonymized_at?: string | null
          assigned_to?: string | null
          avatar?: string | null
          birth_date?: string | null
          cci_classified_at?: string | null
          cci_score?: number | null
          cci_temperature?: string | null
          cci_zone?: string | null
          checkout_token?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          import_campaign_id?: string | null
          import_source?: string | null
          last_contact?: string | null
          meta_ads_referral?: Json | null
          name?: string | null
          notes?: string[] | null
          phone: string
          product_id?: string | null
          product_interest?: string | null
          profile_data?: Json | null
          sort_position?: number | null
          source?: string | null
          stage?: string | null
          stage_changed_at?: string | null
          tags?: string[] | null
          temperature?: string | null
          tenant_id: string
          updated_at?: string | null
          value?: number | null
          whatsapp_about?: string | null
          whatsapp_is_online?: boolean | null
          whatsapp_label_id?: string | null
          whatsapp_last_seen?: string | null
          whatsapp_profile_picture?: string | null
          whatsapp_verified?: boolean | null
        }
        Update: {
          anonymized_at?: string | null
          assigned_to?: string | null
          avatar?: string | null
          birth_date?: string | null
          cci_classified_at?: string | null
          cci_score?: number | null
          cci_temperature?: string | null
          cci_zone?: string | null
          checkout_token?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          import_campaign_id?: string | null
          import_source?: string | null
          last_contact?: string | null
          meta_ads_referral?: Json | null
          name?: string | null
          notes?: string[] | null
          phone?: string
          product_id?: string | null
          product_interest?: string | null
          profile_data?: Json | null
          sort_position?: number | null
          source?: string | null
          stage?: string | null
          stage_changed_at?: string | null
          tags?: string[] | null
          temperature?: string | null
          tenant_id?: string
          updated_at?: string | null
          value?: number | null
          whatsapp_about?: string | null
          whatsapp_is_online?: boolean | null
          whatsapp_label_id?: string | null
          whatsapp_last_seen?: string | null
          whatsapp_profile_picture?: string | null
          whatsapp_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_funnel_stage_id_fkey"
            columns: ["funnel_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      live_comments: {
        Row: {
          comment_id: string | null
          created_at: string
          dm_sent: boolean | null
          id: string
          is_purchase_intent: boolean | null
          live_session_id: string | null
          processed: boolean | null
          product_matched: string | null
          tenant_id: string
          text: string | null
          username: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          dm_sent?: boolean | null
          id?: string
          is_purchase_intent?: boolean | null
          live_session_id?: string | null
          processed?: boolean | null
          product_matched?: string | null
          tenant_id: string
          text?: string | null
          username?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          dm_sent?: boolean | null
          id?: string
          is_purchase_intent?: boolean | null
          live_session_id?: string | null
          processed?: boolean | null
          product_matched?: string | null
          tenant_id?: string
          text?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_comments_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_product_matched_fkey"
            columns: ["product_matched"]
            isOneToOne: false
            referencedRelation: "admin_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_product_matched_fkey"
            columns: ["product_matched"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_product_matched_fkey"
            columns: ["product_matched"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "live_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          channel_id: string | null
          comments_count: number | null
          created_at: string
          ended_at: string | null
          id: string
          last_comment_cursor: string | null
          live_video_id: string
          metadata: Json | null
          products_linked: string[] | null
          started_at: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          channel_id?: string | null
          comments_count?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_comment_cursor?: string | null
          live_video_id: string
          metadata?: Json | null
          products_linked?: string[] | null
          started_at?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          channel_id?: string | null
          comments_count?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_comment_cursor?: string | null
          live_video_id?: string
          metadata?: Json | null
          products_linked?: string[] | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "live_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      master_ai_prompts: {
        Row: {
          content: string
          description: string | null
          id: string
          prompt_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          description?: string | null
          id?: string
          prompt_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          description?: string | null
          id?: string
          prompt_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          id: string
          is_resolved: boolean
          metadata: Json | null
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_notes: string | null
          severity: string
          tenant_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_resolved?: boolean
          metadata?: Json | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_notes?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_resolved?: boolean
          metadata?: Json | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_notes?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      master_niche_templates: {
        Row: {
          ai_config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          prompts: Json | null
          slug: string
        }
        Insert: {
          ai_config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prompts?: Json | null
          slug: string
        }
        Update: {
          ai_config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prompts?: Json | null
          slug?: string
        }
        Relationships: []
      }
      master_permissions: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      master_prompts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          niche_template_id: string | null
          prompt_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          niche_template_id?: string | null
          prompt_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          niche_template_id?: string | null
          prompt_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "master_prompts_niche_template_id_fkey"
            columns: ["niche_template_id"]
            isOneToOne: false
            referencedRelation: "niche_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      master_role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "master_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "master_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_settings: {
        Row: {
          ai_layer_1_cost: number | null
          ai_layer_1_instructions: string | null
          ai_layer_1_model: string | null
          ai_layer_2_cost: number | null
          ai_layer_2_instructions: string | null
          ai_layer_2_model: string | null
          ai_layer_3_cost: number | null
          ai_layer_3_instructions: string | null
          ai_layer_3_model: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          ai_layer_1_cost?: number | null
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_cost?: number | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_cost?: number | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          ai_layer_1_cost?: number | null
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_cost?: number | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_cost?: number | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      master_user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          master_user_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          master_user_id: string
          role_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          master_user_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_user_roles_master_user_id_fkey"
            columns: ["master_user_id"]
            isOneToOne: false
            referencedRelation: "master_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "master_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_usage_events: {
        Row: {
          bucket_name: string
          bytes_deleted: number | null
          bytes_uploaded: number | null
          compression_input_bytes: number | null
          compression_output_bytes: number | null
          content_type: string | null
          created_at: string
          current_storage_bytes: number | null
          error_message: string | null
          event_type: string
          folder: string | null
          id: string
          metadata: Json
          object_path: string | null
          status: string | null
          strategy: string | null
          tenant_id: string
          user_id: string | null
          video_job_id: string | null
          visibility: string | null
        }
        Insert: {
          bucket_name?: string
          bytes_deleted?: number | null
          bytes_uploaded?: number | null
          compression_input_bytes?: number | null
          compression_output_bytes?: number | null
          content_type?: string | null
          created_at?: string
          current_storage_bytes?: number | null
          error_message?: string | null
          event_type: string
          folder?: string | null
          id?: string
          metadata?: Json
          object_path?: string | null
          status?: string | null
          strategy?: string | null
          tenant_id: string
          user_id?: string | null
          video_job_id?: string | null
          visibility?: string | null
        }
        Update: {
          bucket_name?: string
          bytes_deleted?: number | null
          bytes_uploaded?: number | null
          compression_input_bytes?: number | null
          compression_output_bytes?: number | null
          content_type?: string | null
          created_at?: string
          current_storage_bytes?: number | null
          error_message?: string | null
          event_type?: string
          folder?: string | null
          id?: string
          metadata?: Json
          object_path?: string | null
          status?: string | null
          strategy?: string | null
          tenant_id?: string
          user_id?: string | null
          video_job_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "media_usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      message_queue: {
        Row: {
          attempt_count: number
          campaign_id: string | null
          campaign_message_key: string | null
          campaign_recipient_id: string | null
          channel_id: string | null
          channel_type: string | null
          conversation_id: string | null
          created_at: string
          delivered_at: string | null
          error_log: Json | null
          external_message_id: string | null
          flow_id: string | null
          id: string
          lead_id: string | null
          max_attempts: number
          media_urls: string[] | null
          message_body: string | null
          message_data: Json | null
          message_type: string
          next_retry_at: string | null
          priority: string
          processing_started_at: string | null
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          sequence_index: number | null
          status: string
          tenant_id: string
          whatsapp_instance_id: string | null
        }
        Insert: {
          attempt_count?: number
          campaign_id?: string | null
          campaign_message_key?: string | null
          campaign_recipient_id?: string | null
          channel_id?: string | null
          channel_type?: string | null
          conversation_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_log?: Json | null
          external_message_id?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          max_attempts?: number
          media_urls?: string[] | null
          message_body?: string | null
          message_data?: Json | null
          message_type: string
          next_retry_at?: string | null
          priority?: string
          processing_started_at?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_index?: number | null
          status?: string
          tenant_id: string
          whatsapp_instance_id?: string | null
        }
        Update: {
          attempt_count?: number
          campaign_id?: string | null
          campaign_message_key?: string | null
          campaign_recipient_id?: string | null
          channel_id?: string | null
          channel_type?: string | null
          conversation_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_log?: Json | null
          external_message_id?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          max_attempts?: number
          media_urls?: string[] | null
          message_body?: string | null
          message_data?: Json | null
          message_type?: string
          next_retry_at?: string | null
          priority?: string
          processing_started_at?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_index?: number | null
          status?: string
          tenant_id?: string
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_campaign_recipient_id_fkey"
            columns: ["campaign_recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "message_queue_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      message_trigger_error_log: {
        Row: {
          conversation_id: string | null
          created_at: string
          error_message: string | null
          external_message_id: string | null
          function_name: string
          id: number
          message_id: string | null
          operation: string | null
          payload: Json
          sqlstate: string | null
          tenant_id: string | null
          trigger_name: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          external_message_id?: string | null
          function_name: string
          id?: number
          message_id?: string | null
          operation?: string | null
          payload?: Json
          sqlstate?: string | null
          tenant_id?: string | null
          trigger_name?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          external_message_id?: string | null
          function_name?: string
          id?: number
          message_id?: string | null
          operation?: string | null
          payload?: Json
          sqlstate?: string | null
          tenant_id?: string | null
          trigger_name?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_confidence: number | null
          ai_metadata: Json | null
          attachments: Json | null
          audio_summary: string | null
          channel_type: string | null
          content: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          delivered_at: string | null
          edited_at: string | null
          external_message_id: string | null
          id: string
          is_from_lead: boolean | null
          metadata: Json | null
          reaction: string | null
          read_at: string | null
          reply_to: Json | null
          reply_to_id: string | null
          sent_by_ai: boolean | null
          sent_by_flow: boolean | null
          status: string | null
          tenant_id: string | null
          transcription: string | null
          transcription_status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          attachments?: Json | null
          audio_summary?: string | null
          channel_type?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          external_message_id?: string | null
          id?: string
          is_from_lead?: boolean | null
          metadata?: Json | null
          reaction?: string | null
          read_at?: string | null
          reply_to?: Json | null
          reply_to_id?: string | null
          sent_by_ai?: boolean | null
          sent_by_flow?: boolean | null
          status?: string | null
          tenant_id?: string | null
          transcription?: string | null
          transcription_status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          attachments?: Json | null
          audio_summary?: string | null
          channel_type?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          external_message_id?: string | null
          id?: string
          is_from_lead?: boolean | null
          metadata?: Json | null
          reaction?: string | null
          read_at?: string | null
          reply_to?: Json | null
          reply_to_id?: string | null
          sent_by_ai?: boolean | null
          sent_by_flow?: boolean | null
          status?: string | null
          tenant_id?: string | null
          transcription?: string | null
          transcription_status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_configs: {
        Row: {
          connected_by: string | null
          created_at: string | null
          id: string
          instagram_account_id: string | null
          instagram_profile_pic: string | null
          instagram_username: string | null
          is_active: boolean | null
          last_error: string | null
          messaging_enabled: boolean | null
          page_access_token: string | null
          page_id: string
          page_name: string | null
          permissions: string[] | null
          publishing_enabled: boolean | null
          status: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_access_token: string | null
        }
        Insert: {
          connected_by?: string | null
          created_at?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_profile_pic?: string | null
          instagram_username?: string | null
          is_active?: boolean | null
          last_error?: string | null
          messaging_enabled?: boolean | null
          page_access_token?: string | null
          page_id: string
          page_name?: string | null
          permissions?: string[] | null
          publishing_enabled?: boolean | null
          status?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_access_token?: string | null
        }
        Update: {
          connected_by?: string | null
          created_at?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_profile_pic?: string | null
          instagram_username?: string | null
          is_active?: boolean | null
          last_error?: string | null
          messaging_enabled?: boolean | null
          page_access_token?: string | null
          page_id?: string
          page_name?: string | null
          permissions?: string[] | null
          publishing_enabled?: boolean | null
          status?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_access_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "meta_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      migration_jobs: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          error_log: Json | null
          id: string
          progress: Json | null
          source_platform: string
          started_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          id?: string
          progress?: Json | null
          source_platform?: string
          started_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          id?: string
          progress?: Json | null
          source_platform?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "migration_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "migration_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "migration_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      niche_templates: {
        Row: {
          created_at: string | null
          description: string | null
          flows: Json | null
          id: string
          is_active: boolean | null
          kanban_tags: Json | null
          name: string
          prompts: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flows?: Json | null
          id?: string
          is_active?: boolean | null
          kanban_tags?: Json | null
          name: string
          prompts?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flows?: Json | null
          id?: string
          is_active?: boolean | null
          kanban_tags?: Json | null
          name?: string
          prompts?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          title: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          title?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objection_handlers: {
        Row: {
          follow_up_questions: string[] | null
          id: string
          is_from_template: boolean | null
          name: string | null
          objection_type: string | null
          priority: number | null
          response_template: string | null
          tenant_id: string | null
          trigger_phrases: string[] | null
        }
        Insert: {
          follow_up_questions?: string[] | null
          id?: string
          is_from_template?: boolean | null
          name?: string | null
          objection_type?: string | null
          priority?: number | null
          response_template?: string | null
          tenant_id?: string | null
          trigger_phrases?: string[] | null
        }
        Update: {
          follow_up_questions?: string[] | null
          id?: string
          is_from_template?: boolean | null
          name?: string | null
          objection_type?: string | null
          priority?: number | null
          response_template?: string | null
          tenant_id?: string | null
          trigger_phrases?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "objection_handlers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objection_handlers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "objection_handlers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      onboarding_submissions: {
        Row: {
          company_name: string | null
          created_at: string | null
          form_data: Json | null
          id: string
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "onboarding_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ops_health_history: {
        Row: {
          created_at: string
          hour: string
          id: string
          metrics: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          hour: string
          id?: string
          metrics?: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          hour?: string
          id?: string
          metrics?: Json
          tenant_id?: string | null
        }
        Relationships: []
      }
      ops_health_snapshots: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          snapshot_data: Json
          snapshot_type: string
          source: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          snapshot_data: Json
          snapshot_type?: string
          source?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          snapshot_data?: Json
          snapshot_type?: string
          source?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      orchestrator_logs: {
        Row: {
          ai_mode: string | null
          assigned_to: string | null
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          decision: string
          decision_reason: string | null
          flow_id: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          processing_time_ms: number | null
          tenant_id: string | null
        }
        Insert: {
          ai_mode?: string | null
          assigned_to?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          decision: string
          decision_reason?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          processing_time_ms?: number | null
          tenant_id?: string | null
        }
        Update: {
          ai_mode?: string | null
          assigned_to?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          decision?: string
          decision_reason?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          processing_time_ms?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orchestrator_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestrator_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestrator_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestrator_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "orchestrator_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      pause_history: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          status_from: string
          status_to: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          status_from: string
          status_to: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          status_from?: string
          status_to?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pause_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          alias: string | null
          created_at: string
          credentials_encrypted: string
          credentials_meta: Json
          id: string
          is_active: boolean
          is_default: boolean
          last_validated_at: string | null
          provider_id: string
          status: string
          tenant_id: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string
          credentials_encrypted: string
          credentials_meta?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_validated_at?: string | null
          provider_id: string
          status?: string
          tenant_id: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string
          credentials_encrypted?: string
          credentials_meta?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_validated_at?: string | null
          provider_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          payment_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          payment_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          payment_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          account_id: string | null
          created_at: string
          dedupe_fingerprint: string | null
          error: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          payload: Json
          payment_id: string | null
          processed: boolean
          processing_status: string
          provider_id: string
          raw_payload: Json
          remote_verified: boolean | null
          signature_valid: boolean | null
          source_ip: string | null
          tenant_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          dedupe_fingerprint?: string | null
          error?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          processing_status?: string
          provider_id: string
          raw_payload?: Json
          remote_verified?: boolean | null
          signature_valid?: boolean | null
          source_ip?: string | null
          tenant_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          dedupe_fingerprint?: string | null
          error?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          processing_status?: string
          provider_id?: string
          raw_payload?: Json
          remote_verified?: boolean | null
          signature_valid?: boolean | null
          source_ip?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_failures: {
        Row: {
          amount_brl: number | null
          attempt_number: number | null
          blocked_at: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          resolved_at: string | null
          stripe_invoice_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_brl?: number | null
          attempt_number?: number | null
          blocked_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          resolved_at?: string | null
          stripe_invoice_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_brl?: number | null
          attempt_number?: number | null
          blocked_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          resolved_at?: string | null
          stripe_invoice_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_failures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_failures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payment_failures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      payment_funnel_rules: {
        Row: {
          add_tags: string[] | null
          auto_send: boolean
          charge_amount_cents: number | null
          charge_description: string | null
          charge_method: string | null
          charge_provider_id: string | null
          created_at: string
          dry_run_enabled: boolean
          id: string
          is_active: boolean
          move_to_stage_id: string | null
          remove_tags: string[] | null
          rule_type: string | null
          send_message_template: string | null
          tenant_id: string
          trigger_stage_id: string | null
          trigger_status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string
        }
        Insert: {
          add_tags?: string[] | null
          auto_send?: boolean
          charge_amount_cents?: number | null
          charge_description?: string | null
          charge_method?: string | null
          charge_provider_id?: string | null
          created_at?: string
          dry_run_enabled?: boolean
          id?: string
          is_active?: boolean
          move_to_stage_id?: string | null
          remove_tags?: string[] | null
          rule_type?: string | null
          send_message_template?: string | null
          tenant_id: string
          trigger_stage_id?: string | null
          trigger_status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Update: {
          add_tags?: string[] | null
          auto_send?: boolean
          charge_amount_cents?: number | null
          charge_description?: string | null
          charge_method?: string | null
          charge_provider_id?: string | null
          created_at?: string
          dry_run_enabled?: boolean
          id?: string
          is_active?: boolean
          move_to_stage_id?: string | null
          remove_tags?: string[] | null
          rule_type?: string | null
          send_message_template?: string | null
          tenant_id?: string
          trigger_stage_id?: string | null
          trigger_status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_funnel_rules_move_to_stage_id_fkey"
            columns: ["move_to_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_funnel_rules_trigger_stage_id_fkey"
            columns: ["trigger_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          capabilities: Json
          created_at: string
          credential_schema: Json
          display_name: string
          docs_url: string | null
          id: string
          is_active: boolean
          is_internal: boolean
          logo_url: string | null
          status: string
          updated_at: string
          webhook_ip_allowlist: string[] | null
          webhook_required: boolean
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          credential_schema?: Json
          display_name: string
          docs_url?: string | null
          id: string
          is_active?: boolean
          is_internal?: boolean
          logo_url?: string | null
          status?: string
          updated_at?: string
          webhook_ip_allowlist?: string[] | null
          webhook_required?: boolean
        }
        Update: {
          capabilities?: Json
          created_at?: string
          credential_schema?: Json
          display_name?: string
          docs_url?: string | null
          id?: string
          is_active?: boolean
          is_internal?: boolean
          logo_url?: string | null
          status?: string
          updated_at?: string
          webhook_ip_allowlist?: string[] | null
          webhook_required?: boolean
        }
        Relationships: []
      }
      payment_tracking: {
        Row: {
          channel: string | null
          checkout_session_id: string | null
          created_at: string
          event: string
          event_type: string | null
          id: string
          lead_id: string | null
          metadata: Json
          payment_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          channel?: string | null
          checkout_session_id?: string | null
          created_at?: string
          event: string
          event_type?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          payment_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          channel?: string | null
          checkout_session_id?: string | null
          created_at?: string
          event?: string
          event_type?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          payment_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_tracking_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_dead_letters: {
        Row: {
          account_id: string | null
          created_at: string
          error: string
          event_id: string | null
          id: string
          next_retry_at: string | null
          provider_id: string | null
          raw_payload: Json
          resolved_at: string | null
          retry_count: number
          tenant_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          error: string
          event_id?: string | null
          id?: string
          next_retry_at?: string | null
          provider_id?: string | null
          raw_payload?: Json
          resolved_at?: string | null
          retry_count?: number
          tenant_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          error?: string
          event_id?: string | null
          id?: string
          next_retry_at?: string | null
          provider_id?: string | null
          raw_payload?: Json
          resolved_at?: string | null
          retry_count?: number
          tenant_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string | null
          amount_cents: number
          boleto_barcode: string | null
          boleto_url: string | null
          checkout_url: string | null
          client_idempotency_key: string | null
          conversation_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          description: string | null
          expires_at: string | null
          external_id: string | null
          external_reference: string | null
          fingerprint: string | null
          gateway_fee_cents: number
          id: string
          installments: number
          internal_status: string | null
          last_reconciled_at: string | null
          lead_id: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"]
          net_amount_cents: number | null
          origin: Database["public"]["Enums"]["payment_origin"]
          paid_at: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          provider_account_snapshot: Json
          provider_id: string
          raw_response: Json | null
          reconciliation_attempts: number
          refunded_amount_cents: number
          refunded_at: string | null
          sent_at: string | null
          sent_via: string | null
          status: Database["public"]["Enums"]["payment_status"]
          status_reason: string | null
          subject_type: Database["public"]["Enums"]["payment_subject_type"]
          tenant_id: string
          updated_at: string
          user_id: string | null
          webhook_received_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount_cents: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          checkout_url?: string | null
          client_idempotency_key?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          external_reference?: string | null
          fingerprint?: string | null
          gateway_fee_cents?: number
          id?: string
          installments?: number
          internal_status?: string | null
          last_reconciled_at?: string | null
          lead_id?: string | null
          metadata?: Json
          method: Database["public"]["Enums"]["payment_method"]
          net_amount_cents?: number | null
          origin: Database["public"]["Enums"]["payment_origin"]
          paid_at?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          provider_account_snapshot?: Json
          provider_id: string
          raw_response?: Json | null
          reconciliation_attempts?: number
          refunded_amount_cents?: number
          refunded_at?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_reason?: string | null
          subject_type: Database["public"]["Enums"]["payment_subject_type"]
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount_cents?: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          checkout_url?: string | null
          client_idempotency_key?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          external_reference?: string | null
          fingerprint?: string | null
          gateway_fee_cents?: number
          id?: string
          installments?: number
          internal_status?: string | null
          last_reconciled_at?: string | null
          lead_id?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          net_amount_cents?: number | null
          origin?: Database["public"]["Enums"]["payment_origin"]
          paid_at?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          provider_account_snapshot?: Json
          provider_id?: string
          raw_response?: Json | null
          reconciliation_attempts?: number
          refunded_amount_cents?: number
          refunded_at?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_reason?: string | null
          subject_type?: Database["public"]["Enums"]["payment_subject_type"]
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          features_enabled: Json
          id: string
          is_active: boolean
          is_default: boolean
          max_ai_tokens: number
          max_automations: number | null
          max_channels: number
          max_leads: number | null
          max_messages_month: number | null
          max_products: number | null
          max_storage_gb: number
          max_users: number
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          features_enabled?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_ai_tokens?: number
          max_automations?: number | null
          max_channels?: number
          max_leads?: number | null
          max_messages_month?: number | null
          max_products?: number | null
          max_storage_gb?: number
          max_users?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          features_enabled?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_ai_tokens?: number
          max_automations?: number | null
          max_channels?: number
          max_leads?: number | null
          max_messages_month?: number | null
          max_products?: number | null
          max_storage_gb?: number
          max_users?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_cost_allocations: {
        Row: {
          allocation_strategy: string
          amount_brl: number
          attribution_confidence: string
          billing_month: string
          category: string
          created_at: string
          id: string
          metadata: Json
          service: string
          sku: string | null
          source: string
        }
        Insert: {
          allocation_strategy?: string
          amount_brl?: number
          attribution_confidence?: string
          billing_month: string
          category: string
          created_at?: string
          id?: string
          metadata?: Json
          service: string
          sku?: string | null
          source?: string
        }
        Update: {
          allocation_strategy?: string
          amount_brl?: number
          attribution_confidence?: string
          billing_month?: string
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          service?: string
          sku?: string | null
          source?: string
        }
        Relationships: []
      }
      platform_fixed_costs: {
        Row: {
          billing_cycle: string
          category: string
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          metadata: Json
          monthly_brl: number
          monthly_usd: number
          notes: string | null
          product: string
          starts_on: string
          updated_at: string
          usd_brl_rate: number | null
          vendor: string
        }
        Insert: {
          billing_cycle?: string
          category?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          monthly_brl?: number
          monthly_usd?: number
          notes?: string | null
          product: string
          starts_on?: string
          updated_at?: string
          usd_brl_rate?: number | null
          vendor: string
        }
        Update: {
          billing_cycle?: string
          category?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          monthly_brl?: number
          monthly_usd?: number
          notes?: string | null
          product?: string
          starts_on?: string
          updated_at?: string
          usd_brl_rate?: number | null
          vendor?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_can_use_minimum_price: boolean | null
          category: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          display_size: string | null
          embedding: string | null
          embedding_generated_at: string | null
          embedding_model: string | null
          height_cm: number | null
          id: string
          image_url: string | null
          images: string[] | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          item_type: string | null
          length_cm: number | null
          low_stock_alert: number | null
          minimum_price: number | null
          name: string
          price: number | null
          price_max: number | null
          pricing_type: string | null
          reserved_by: string | null
          search_vector: unknown
          seller_badge: string | null
          seller_id: string | null
          sku: string | null
          status: string
          stock_quantity: number | null
          tenant_id: string
          track_stock: boolean | null
          updated_at: string | null
          visibility: string | null
          weight_grams: number | null
          wholesale_price: number | null
          width_cm: number | null
        }
        Insert: {
          ai_can_use_minimum_price?: boolean | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          display_size?: string | null
          embedding?: string | null
          embedding_generated_at?: string | null
          embedding_model?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          item_type?: string | null
          length_cm?: number | null
          low_stock_alert?: number | null
          minimum_price?: number | null
          name: string
          price?: number | null
          price_max?: number | null
          pricing_type?: string | null
          reserved_by?: string | null
          search_vector?: unknown
          seller_badge?: string | null
          seller_id?: string | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          tenant_id: string
          track_stock?: boolean | null
          updated_at?: string | null
          visibility?: string | null
          weight_grams?: number | null
          wholesale_price?: number | null
          width_cm?: number | null
        }
        Update: {
          ai_can_use_minimum_price?: boolean | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          display_size?: string | null
          embedding?: string | null
          embedding_generated_at?: string | null
          embedding_model?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          item_type?: string | null
          length_cm?: number | null
          low_stock_alert?: number | null
          minimum_price?: number | null
          name?: string
          price?: number | null
          price_max?: number | null
          pricing_type?: string | null
          reserved_by?: string | null
          search_vector?: unknown
          seller_badge?: string | null
          seller_id?: string | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          tenant_id?: string
          track_stock?: boolean | null
          updated_at?: string | null
          visibility?: string | null
          weight_grams?: number | null
          wholesale_price?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_profile_id: string | null
          active_conversation_id: string | null
          anonymized_at: string | null
          avatar: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          department: string | null
          email: string | null
          first_login_at: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          last_assigned_at: string | null
          name: string | null
          notify_all_new_messages: boolean | null
          onboarding_completed_at: string | null
          onboarding_progress: Json | null
          participates_in_rotation: boolean | null
          pause_reason: string | null
          pause_until: string | null
          paused_at: string | null
          phone: string | null
          role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          access_profile_id?: string | null
          active_conversation_id?: string | null
          anonymized_at?: string | null
          avatar?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          department?: string | null
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_assigned_at?: string | null
          name?: string | null
          notify_all_new_messages?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          participates_in_rotation?: boolean | null
          pause_reason?: string | null
          pause_until?: string | null
          paused_at?: string | null
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          access_profile_id?: string | null
          active_conversation_id?: string | null
          anonymized_at?: string | null
          avatar?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          department?: string | null
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_assigned_at?: string | null
          name?: string | null
          notify_all_new_messages?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          participates_in_rotation?: boolean | null
          pause_reason?: string | null
          pause_until?: string | null
          paused_at?: string | null
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string | null
          updated_at: string | null
          variables: string[] | null
          version: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "prompt_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      public_customers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          is_wholesale_approved: boolean | null
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_wholesale_approved?: boolean | null
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_wholesale_approved?: boolean | null
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_notification_history: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          read_at: string | null
          sent_at: string | null
          status: string
          tenant_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "push_notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "push_notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_reply_tokens: {
        Row: {
          conversation_id: string
          created_at: string | null
          expires_at: string
          id: string
          instance_id: string | null
          lead_phone: string
          tenant_id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          instance_id?: string | null
          lead_phone: string
          tenant_id: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          instance_id?: string | null
          lead_phone?: string
          tenant_id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          device_name: string | null
          device_token: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_push_received_at: string | null
          p256dh_key: string
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          device_name?: string | null
          device_token?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_push_received_at?: string | null
          p256dh_key: string
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          device_name?: string | null
          device_token?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_push_received_at?: string | null
          p256dh_key?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          shortcut: string | null
          tenant_id: string
          title: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          shortcut?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          shortcut?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "quick_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "quick_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_events: {
        Row: {
          auto_tags: Json | null
          channel: string | null
          chunked_results_count: number | null
          conversation_quality_score: number | null
          created_at: string
          fallback_to_general: boolean | null
          fallback_to_keyword: boolean | null
          feedback_type: string | null
          guardrail_violations: string[] | null
          hybrid_rrf_used: boolean | null
          id: string
          injection_detected: boolean | null
          keyword_results_count: number | null
          knowledge_items_used: string[] | null
          latency_llm_ms: number | null
          latency_rag_ms: number | null
          latency_total_ms: number | null
          product_context_used: boolean | null
          prompt_variant: string | null
          query_length: number | null
          reranker_used: boolean | null
          response_confidence: number | null
          tenant_id: string
          top_similarity_score: number | null
          uopa_context_used: boolean | null
          vector_results_count: number | null
          was_reformulated: boolean | null
        }
        Insert: {
          auto_tags?: Json | null
          channel?: string | null
          chunked_results_count?: number | null
          conversation_quality_score?: number | null
          created_at?: string
          fallback_to_general?: boolean | null
          fallback_to_keyword?: boolean | null
          feedback_type?: string | null
          guardrail_violations?: string[] | null
          hybrid_rrf_used?: boolean | null
          id?: string
          injection_detected?: boolean | null
          keyword_results_count?: number | null
          knowledge_items_used?: string[] | null
          latency_llm_ms?: number | null
          latency_rag_ms?: number | null
          latency_total_ms?: number | null
          product_context_used?: boolean | null
          prompt_variant?: string | null
          query_length?: number | null
          reranker_used?: boolean | null
          response_confidence?: number | null
          tenant_id: string
          top_similarity_score?: number | null
          uopa_context_used?: boolean | null
          vector_results_count?: number | null
          was_reformulated?: boolean | null
        }
        Update: {
          auto_tags?: Json | null
          channel?: string | null
          chunked_results_count?: number | null
          conversation_quality_score?: number | null
          created_at?: string
          fallback_to_general?: boolean | null
          fallback_to_keyword?: boolean | null
          feedback_type?: string | null
          guardrail_violations?: string[] | null
          hybrid_rrf_used?: boolean | null
          id?: string
          injection_detected?: boolean | null
          keyword_results_count?: number | null
          knowledge_items_used?: string[] | null
          latency_llm_ms?: number | null
          latency_rag_ms?: number | null
          latency_total_ms?: number | null
          product_context_used?: boolean | null
          prompt_variant?: string | null
          query_length?: number | null
          reranker_used?: boolean | null
          response_confidence?: number | null
          tenant_id?: string
          top_similarity_score?: number | null
          uopa_context_used?: boolean | null
          vector_results_count?: number | null
          was_reformulated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rag_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rag_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rag_quality_daily: {
        Row: {
          avg_confidence: number | null
          avg_cqs: number | null
          avg_latency_llm_ms: number | null
          avg_latency_rag_ms: number | null
          avg_latency_total_ms: number | null
          avg_similarity: number | null
          channel_distribution: Json | null
          chunk_usage_rate: number | null
          date: string
          general_fallback_rate: number | null
          hybrid_usage_rate: number | null
          id: string
          keyword_fallback_rate: number | null
          negative_feedback_rate: number | null
          positive_feedback_rate: number | null
          product_usage_rate: number | null
          prompt_variant_stats: Json | null
          reformulation_rate: number | null
          reranker_usage_rate: number | null
          tenant_id: string
          total_feedback: number | null
          total_queries: number | null
          uopa_usage_rate: number | null
          vector_hit_rate: number | null
        }
        Insert: {
          avg_confidence?: number | null
          avg_cqs?: number | null
          avg_latency_llm_ms?: number | null
          avg_latency_rag_ms?: number | null
          avg_latency_total_ms?: number | null
          avg_similarity?: number | null
          channel_distribution?: Json | null
          chunk_usage_rate?: number | null
          date: string
          general_fallback_rate?: number | null
          hybrid_usage_rate?: number | null
          id?: string
          keyword_fallback_rate?: number | null
          negative_feedback_rate?: number | null
          positive_feedback_rate?: number | null
          product_usage_rate?: number | null
          prompt_variant_stats?: Json | null
          reformulation_rate?: number | null
          reranker_usage_rate?: number | null
          tenant_id: string
          total_feedback?: number | null
          total_queries?: number | null
          uopa_usage_rate?: number | null
          vector_hit_rate?: number | null
        }
        Update: {
          avg_confidence?: number | null
          avg_cqs?: number | null
          avg_latency_llm_ms?: number | null
          avg_latency_rag_ms?: number | null
          avg_latency_total_ms?: number | null
          avg_similarity?: number | null
          channel_distribution?: Json | null
          chunk_usage_rate?: number | null
          date?: string
          general_fallback_rate?: number | null
          hybrid_usage_rate?: number | null
          id?: string
          keyword_fallback_rate?: number | null
          negative_feedback_rate?: number | null
          positive_feedback_rate?: number | null
          product_usage_rate?: number | null
          prompt_variant_stats?: Json | null
          reformulation_rate?: number | null
          reranker_usage_rate?: number | null
          tenant_id?: string
          total_feedback?: number | null
          total_queries?: number | null
          uopa_usage_rate?: number | null
          vector_hit_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_quality_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rag_quality_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rag_quality_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      rate_limits_fast: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      recovery_attempts: {
        Row: {
          attempt_number: number
          channel: string
          converted_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          message: string | null
          metadata: Json
          payment_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          attempt_number?: number
          channel?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json
          payment_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          attempt_number?: number
          channel?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json
          payment_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      rotation_config: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          rotation_type: string
          tenant_id: string
          updated_at: string | null
          user_weights: Json | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rotation_type?: string
          tenant_id: string
          updated_at?: string | null
          user_weights?: Json | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rotation_type?: string
          tenant_id?: string
          updated_at?: string | null
          user_weights?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rotation_config_tenant_id_fkey1"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_config_tenant_id_fkey1"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rotation_config_tenant_id_fkey1"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rotation_members: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_ai_agent: boolean
          max_concurrent_leads: number | null
          priority: number | null
          specialties: string[] | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_agent?: boolean
          max_concurrent_leads?: number | null
          priority?: number | null
          specialties?: string[] | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_agent?: boolean
          max_concurrent_leads?: number | null
          priority?: number | null
          specialties?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rotation_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rotation_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rotation_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rotation_settings: {
        Row: {
          ai_in_rotation: boolean
          conflict_auto_decision: string | null
          conflict_timeout_minutes: number | null
          created_at: string | null
          current_index: number | null
          is_enabled: boolean | null
          max_active_per_seller: number | null
          mode: string | null
          send_conflict_reminders: boolean | null
          skip_offline: boolean | null
          sticky_agent_enabled: boolean | null
          sticky_window_days: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_in_rotation?: boolean
          conflict_auto_decision?: string | null
          conflict_timeout_minutes?: number | null
          created_at?: string | null
          current_index?: number | null
          is_enabled?: boolean | null
          max_active_per_seller?: number | null
          mode?: string | null
          send_conflict_reminders?: boolean | null
          skip_offline?: boolean | null
          sticky_agent_enabled?: boolean | null
          sticky_window_days?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_in_rotation?: boolean
          conflict_auto_decision?: string | null
          conflict_timeout_minutes?: number | null
          created_at?: string | null
          current_index?: number | null
          is_enabled?: boolean | null
          max_active_per_seller?: number | null
          mode?: string | null
          send_conflict_reminders?: boolean | null
          skip_offline?: boolean | null
          sticky_agent_enabled?: boolean | null
          sticky_window_days?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rotation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rotation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      sales_funnels: {
        Row: {
          allowed_roles: string[] | null
          allowed_team_ids: string[] | null
          category_id: string | null
          created_at: string
          default_team_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[] | null
          allowed_team_ids?: string[] | null
          category_id?: string | null
          created_at?: string
          default_team_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[] | null
          allowed_team_ids?: string[] | null
          category_id?: string | null
          created_at?: string
          default_team_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_funnels_default_team_id_fkey"
            columns: ["default_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_count: number | null
          current_value: number | null
          goal_amount: number | null
          goal_count: number | null
          goal_type: string | null
          id: string
          month: number | null
          period_end: string
          period_start: string
          period_type: string
          scope: string | null
          target_category_id: string | null
          target_count: number | null
          target_product_id: string | null
          target_user_id: string | null
          target_value: number
          tenant_id: string
          type: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_count?: number | null
          current_value?: number | null
          goal_amount?: number | null
          goal_count?: number | null
          goal_type?: string | null
          id?: string
          month?: number | null
          period_end: string
          period_start: string
          period_type?: string
          scope?: string | null
          target_category_id?: string | null
          target_count?: number | null
          target_product_id?: string | null
          target_user_id?: string | null
          target_value?: number
          tenant_id: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_count?: number | null
          current_value?: number | null
          goal_amount?: number | null
          goal_count?: number | null
          goal_type?: string | null
          id?: string
          month?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          scope?: string | null
          target_category_id?: string | null
          target_count?: number | null
          target_product_id?: string | null
          target_user_id?: string | null
          target_value?: number
          tenant_id?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "admin_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sales_goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sales_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_push_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          data: Json | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          target_ids: string[] | null
          target_type: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          target_ids?: string[] | null
          target_type?: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          target_ids?: string[] | null
          target_type?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_push_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_push_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_push_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "scheduled_push_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      scheduled_tasks: {
        Row: {
          action_payload: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          error_message: string | null
          id: string
          last_run_at: string | null
          max_runs: number | null
          name: string
          next_run_at: string | null
          repeat_config: Json | null
          repeat_type: string | null
          run_count: number | null
          scheduled_at: string
          status: string
          target_filter: Json | null
          target_ids: string[] | null
          target_type: string
          updated_at: string
        }
        Insert: {
          action_payload?: Json
          action_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          max_runs?: number | null
          name: string
          next_run_at?: string | null
          repeat_config?: Json | null
          repeat_type?: string | null
          run_count?: number | null
          scheduled_at: string
          status?: string
          target_filter?: Json | null
          target_ids?: string[] | null
          target_type: string
          updated_at?: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          max_runs?: number | null
          name?: string
          next_run_at?: string | null
          repeat_config?: Json | null
          repeat_type?: string | null
          run_count?: number | null
          scheduled_at?: string
          status?: string
          target_filter?: Json | null
          target_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: string | null
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          tenant_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          display_name: string
          enabled: boolean
          icon_emoji: string | null
          id: string
          internal_name: string | null
          sort_order: number
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          display_name: string
          enabled?: boolean
          icon_emoji?: string | null
          id?: string
          internal_name?: string | null
          sort_order?: number
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          enabled?: boolean
          icon_emoji?: string | null
          id?: string
          internal_name?: string | null
          sort_order?: number
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rules: {
        Row: {
          cep_end: string | null
          cep_start: string | null
          created_at: string
          delivery_max_days: number | null
          delivery_min_days: number | null
          enabled: boolean
          free_above_cents: number | null
          id: string
          max_total_cents: number | null
          max_weight_grams: number | null
          method_id: string
          min_total_cents: number | null
          price_cents: number
          region_uf: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cep_end?: string | null
          cep_start?: string | null
          created_at?: string
          delivery_max_days?: number | null
          delivery_min_days?: number | null
          enabled?: boolean
          free_above_cents?: number | null
          id?: string
          max_total_cents?: number | null
          max_weight_grams?: number | null
          method_id: string
          min_total_cents?: number | null
          price_cents?: number
          region_uf?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cep_end?: string | null
          cep_start?: string | null
          created_at?: string
          delivery_max_days?: number | null
          delivery_min_days?: number | null
          enabled?: boolean
          free_above_cents?: number | null
          id?: string
          max_total_cents?: number | null
          max_weight_grams?: number | null
          method_id?: string
          min_total_cents?: number | null
          price_cents?: number
          region_uf?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rules_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_config: {
        Row: {
          auto_reassign: boolean | null
          created_at: string | null
          first_response_time_minutes: number | null
          id: string
          is_enabled: boolean | null
          notify_on_sla_breach: boolean | null
          reassign_pool: string[] | null
          tenant_id: string
          timeout_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          auto_reassign?: boolean | null
          created_at?: string | null
          first_response_time_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          notify_on_sla_breach?: boolean | null
          reassign_pool?: string[] | null
          tenant_id: string
          timeout_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_reassign?: boolean | null
          created_at?: string | null
          first_response_time_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          notify_on_sla_breach?: boolean | null
          reassign_pool?: string[] | null
          tenant_id?: string
          timeout_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sla_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      store_banners: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          cta_action: string | null
          cta_target: string | null
          cta_text: string | null
          ends_at: string | null
          headline: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_action: string | null
          link_target: string | null
          mobile_image_url: string | null
          sort_order: number | null
          starts_at: string | null
          subheadline: string | null
          subtitle: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          cta_action?: string | null
          cta_target?: string | null
          cta_text?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_action?: string | null
          link_target?: string | null
          mobile_image_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subheadline?: string | null
          subtitle?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          cta_action?: string | null
          cta_target?: string | null
          cta_text?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_action?: string | null
          link_target?: string | null
          mobile_image_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subheadline?: string | null
          subtitle?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_campaigns: {
        Row: {
          banner_image_url: string | null
          banner_mobile_image_url: string | null
          category_ids: string[] | null
          created_at: string | null
          crm_campaign_id: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          product_ids: string[] | null
          promotional_message: string | null
          slug: string
          starts_at: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          banner_image_url?: string | null
          banner_mobile_image_url?: string | null
          category_ids?: string[] | null
          created_at?: string | null
          crm_campaign_id?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          product_ids?: string[] | null
          promotional_message?: string | null
          slug: string
          starts_at: string
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          banner_image_url?: string | null
          banner_mobile_image_url?: string | null
          category_ids?: string[] | null
          created_at?: string | null
          crm_campaign_id?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          product_ids?: string[] | null
          promotional_message?: string | null
          slug?: string
          starts_at?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_checkout_sessions: {
        Row: {
          abandoned_at: string | null
          ad_referral: Json | null
          assigned_to: string | null
          checkout_token: string
          confirmed_at: string | null
          conversation_id: string | null
          coupon_code: string | null
          coupon_discount_cents: number | null
          coupon_free_shipping: boolean | null
          coupon_id: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_cents: number
          extra_fee_cents: number
          finalization_event_id: string | null
          fulfillment_status: string
          id: string
          identified_at: string | null
          internal_note: string | null
          item_count: number
          items: Json
          last_event_at: string
          lead_id: string | null
          marked_paid_by: string | null
          opened_at: string
          origin: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          seller_id: string | null
          session_id: string | null
          shipping_address: Json | null
          shipping_carrier: string | null
          shipping_cents: number
          shipping_cep: string | null
          shipping_display_name: string | null
          shipping_eta_max_days: number | null
          shipping_eta_min_days: number | null
          shipping_method_id: string | null
          shipping_price_cents: number | null
          shipping_service: string | null
          shipping_tracking_code: string | null
          shipping_tracking_url: string | null
          status: string
          target_phone: string | null
          target_source: string | null
          tenant_id: string
          total_cents: number
          updated_at: string
          utm: Json | null
          visitor_id: string | null
          whatsapp_clicked_at: string | null
        }
        Insert: {
          abandoned_at?: string | null
          ad_referral?: Json | null
          assigned_to?: string | null
          checkout_token: string
          confirmed_at?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          coupon_discount_cents?: number | null
          coupon_free_shipping?: boolean | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          extra_fee_cents?: number
          finalization_event_id?: string | null
          fulfillment_status?: string
          id?: string
          identified_at?: string | null
          internal_note?: string | null
          item_count?: number
          items?: Json
          last_event_at?: string
          lead_id?: string | null
          marked_paid_by?: string | null
          opened_at?: string
          origin?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          seller_id?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_cents?: number
          shipping_cep?: string | null
          shipping_display_name?: string | null
          shipping_eta_max_days?: number | null
          shipping_eta_min_days?: number | null
          shipping_method_id?: string | null
          shipping_price_cents?: number | null
          shipping_service?: string | null
          shipping_tracking_code?: string | null
          shipping_tracking_url?: string | null
          status?: string
          target_phone?: string | null
          target_source?: string | null
          tenant_id: string
          total_cents?: number
          updated_at?: string
          utm?: Json | null
          visitor_id?: string | null
          whatsapp_clicked_at?: string | null
        }
        Update: {
          abandoned_at?: string | null
          ad_referral?: Json | null
          assigned_to?: string | null
          checkout_token?: string
          confirmed_at?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          coupon_discount_cents?: number | null
          coupon_free_shipping?: boolean | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          extra_fee_cents?: number
          finalization_event_id?: string | null
          fulfillment_status?: string
          id?: string
          identified_at?: string | null
          internal_note?: string | null
          item_count?: number
          items?: Json
          last_event_at?: string
          lead_id?: string | null
          marked_paid_by?: string | null
          opened_at?: string
          origin?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          seller_id?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_cents?: number
          shipping_cep?: string | null
          shipping_display_name?: string | null
          shipping_eta_max_days?: number | null
          shipping_eta_min_days?: number | null
          shipping_method_id?: string | null
          shipping_price_cents?: number | null
          shipping_service?: string | null
          shipping_tracking_code?: string | null
          shipping_tracking_url?: string | null
          status?: string
          target_phone?: string | null
          target_source?: string | null
          tenant_id?: string
          total_cents?: number
          updated_at?: string
          utm?: Json | null
          visitor_id?: string | null
          whatsapp_clicked_at?: string | null
        }
        Relationships: []
      }
      store_events: {
        Row: {
          ad_referral: Json | null
          checkout_session_id: string | null
          checkout_token: string | null
          conversation_id: string | null
          country: string | null
          created_at: string
          currency: string | null
          device_type: string | null
          event_type: string
          id: string
          ip_hash: string | null
          is_bot: boolean
          item_count: number | null
          lead_id: string | null
          page_path: string | null
          payload: Json
          product_id: string | null
          referrer: string | null
          seller_id: string | null
          session_id: string | null
          tenant_id: string
          user_agent_short: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value_cents: number | null
          visitor_id: string | null
        }
        Insert: {
          ad_referral?: Json | null
          checkout_session_id?: string | null
          checkout_token?: string | null
          conversation_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean
          item_count?: number | null
          lead_id?: string | null
          page_path?: string | null
          payload?: Json
          product_id?: string | null
          referrer?: string | null
          seller_id?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent_short?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value_cents?: number | null
          visitor_id?: string | null
        }
        Update: {
          ad_referral?: Json | null
          checkout_session_id?: string | null
          checkout_token?: string | null
          conversation_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean
          item_count?: number | null
          lead_id?: string | null
          page_path?: string | null
          payload?: Json
          product_id?: string | null
          referrer?: string | null
          seller_id?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent_short?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value_cents?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_events_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "store_checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_history: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          session_id: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          session_id: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_order_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "store_checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          id: string
          note: string
          session_id: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          note: string
          session_id: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          note?: string
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_order_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "store_checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_product_sections: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          filter_config: Json | null
          id: string
          is_active: boolean | null
          max_products: number | null
          product_ids: string[] | null
          section_type: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          filter_config?: Json | null
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          product_ids?: string[] | null
          section_type?: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          filter_config?: Json | null
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          product_ids?: string[] | null
          section_type?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_product_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_product_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "store_product_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      store_promotional_bar: {
        Row: {
          animation_type: string | null
          background_color: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          link_action: string | null
          link_target: string | null
          starts_at: string | null
          tenant_id: string
          text: string
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          animation_type?: string | null
          background_color?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          link_action?: string | null
          link_target?: string | null
          starts_at?: string | null
          tenant_id?: string
          text: string
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          animation_type?: string | null
          background_color?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          link_action?: string | null
          link_target?: string | null
          starts_at?: string | null
          tenant_id?: string
          text?: string
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_sessions: {
        Row: {
          ended_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          master_admin_id: string
          reason: string | null
          started_at: string | null
          target_tenant_id: string
          ticket_id: string | null
        }
        Insert: {
          ended_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          master_admin_id: string
          reason?: string | null
          started_at?: string | null
          target_tenant_id: string
          ticket_id?: string | null
        }
        Update: {
          ended_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          master_admin_id?: string
          reason?: string | null
          started_at?: string | null
          target_tenant_id?: string
          ticket_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          lead_id: string | null
          priority: string | null
          recurrence: Database["public"]["Enums"]["task_recurrence"] | null
          recurrence_end_date: string | null
          reminder_before_days: number | null
          reminder_before_minutes: number | null
          reminder_sent_at: string | null
          reminder_time_sent_at: string | null
          status: string | null
          subtasks: Json | null
          task_type: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          recurrence?: Database["public"]["Enums"]["task_recurrence"] | null
          recurrence_end_date?: string | null
          reminder_before_days?: number | null
          reminder_before_minutes?: number | null
          reminder_sent_at?: string | null
          reminder_time_sent_at?: string | null
          status?: string | null
          subtasks?: Json | null
          task_type?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          recurrence?: Database["public"]["Enums"]["task_recurrence"] | null
          recurrence_end_date?: string | null
          reminder_before_days?: number | null
          reminder_before_minutes?: number | null
          reminder_sent_at?: string | null
          reminder_time_sent_at?: string | null
          status?: string | null
          subtasks?: Json | null
          task_type?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      team_channel_members: {
        Row: {
          channel_id: string
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          channel_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_channel_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channels: {
        Row: {
          channel_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          name: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          priority: number
          team_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          team_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          team_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          created_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string | null
          tenant_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content: string
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string
          current_round_robin_index: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_round_robin_index?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          current_round_robin_index?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      template_applications: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          config_snapshot: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          result: Json | null
          status: string
          template_id: string | null
          tenant_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          config_snapshot?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          status?: string
          template_id?: string | null
          tenant_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          config_snapshot?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          status?: string
          template_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_applications_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "template_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      template_publish_history: {
        Row: {
          changelog: string | null
          created_at: string | null
          id: string
          published_at: string | null
          published_by: string | null
          snapshot: Json | null
          template_id: string | null
          tenant_id: string | null
          version_major: number | null
          version_minor: number | null
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          snapshot?: Json | null
          template_id?: string | null
          tenant_id?: string | null
          version_major?: number | null
          version_minor?: number | null
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          snapshot?: Json | null
          template_id?: string | null
          tenant_id?: string | null
          version_major?: number | null
          version_minor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_publish_history_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_publish_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_publish_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "template_publish_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      template_sync_history: {
        Row: {
          changes_applied: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          sections_skipped: string[] | null
          sections_synced: string[] | null
          status: string
          subscription_id: string | null
          sync_type: string
          template_id: string | null
          template_version: string | null
          tenant_id: string | null
          triggered_by: string | null
        }
        Insert: {
          changes_applied?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sections_skipped?: string[] | null
          sections_synced?: string[] | null
          status: string
          subscription_id?: string | null
          sync_type: string
          template_id?: string | null
          template_version?: string | null
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Update: {
          changes_applied?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sections_skipped?: string[] | null
          sections_synced?: string[] | null
          status?: string
          subscription_id?: string | null
          sync_type?: string
          template_id?: string | null
          template_version?: string | null
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_sync_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_template_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_sync_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_template_info"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "template_sync_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_sync_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "template_sync_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_color: string | null
          background_color: string | null
          border_radius: string | null
          company_name: string | null
          created_at: string
          custom_css: string | null
          email_header_html: string | null
          favicon_url: string | null
          font_family: string | null
          footer_text: string | null
          id: string
          login_background_url: string | null
          logo_url: string | null
          logo_white_url: string | null
          primary_color: string | null
          secondary_color: string | null
          symbol_url: string | null
          tagline: string | null
          tenant_id: string
          text_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          company_name?: string | null
          created_at?: string
          custom_css?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          font_family?: string | null
          footer_text?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          logo_white_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          symbol_url?: string | null
          tagline?: string | null
          tenant_id: string
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          company_name?: string | null
          created_at?: string
          custom_css?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          font_family?: string | null
          footer_text?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          logo_white_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          symbol_url?: string | null
          tagline?: string | null
          tenant_id?: string
          text_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_crm_sync: {
        Row: {
          created_at: string | null
          crm_tenant_id: string | null
          id: string
          last_synced_at: string | null
          master_tenant_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_tenant_id?: string | null
          id?: string
          last_synced_at?: string | null
          master_tenant_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_tenant_id?: string | null
          id?: string
          last_synced_at?: string | null
          master_tenant_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_crm_sync_master_tenant_id_fkey"
            columns: ["master_tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_crm_sync_master_tenant_id_fkey"
            columns: ["master_tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_crm_sync_master_tenant_id_fkey"
            columns: ["master_tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_custom_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          entity_type: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          entity_type?: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          entity_type?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_domains: {
        Row: {
          created_at: string
          created_by: string | null
          dns_configured: boolean
          domain: string
          domain_type: string
          expires_at: string | null
          id: string
          is_primary: boolean
          last_check_at: string | null
          last_error: string | null
          notes: string | null
          ssl_provisioned: boolean
          status: string
          tenant_id: string
          updated_at: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dns_configured?: boolean
          domain: string
          domain_type?: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean
          last_check_at?: string | null
          last_error?: string | null
          notes?: string | null
          ssl_provisioned?: boolean
          status?: string
          tenant_id: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dns_configured?: boolean
          domain?: string
          domain_type?: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean
          last_check_at?: string | null
          last_error?: string | null
          notes?: string | null
          ssl_provisioned?: boolean
          status?: string
          tenant_id?: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          ai_layer_1_instructions: string | null
          ai_layer_1_model: string | null
          ai_layer_2_instructions: string | null
          ai_layer_2_model: string | null
          ai_layer_3_instructions: string | null
          ai_layer_3_model: string | null
          ai_use_global_config: boolean | null
          created_at: string | null
          credits_per_user: number | null
          extra_credits: number | null
          id: string
          limit_ai_tokens_monthly: number | null
          limit_leads: number | null
          limit_products: number | null
          limit_storage_mb: number | null
          limit_users: number | null
          limit_whatsapp_instances: number | null
          module_ai_agent: boolean | null
          module_ai_transcription: boolean | null
          module_api_access: boolean | null
          module_automation_flows: boolean | null
          module_campaigns: boolean | null
          module_ecommerce: boolean | null
          module_erp_integration: boolean | null
          module_multi_whatsapp: boolean | null
          module_whitelabel: boolean | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          overrides: Json | null
          storage_mb_per_user: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          ai_use_global_config?: boolean | null
          created_at?: string | null
          credits_per_user?: number | null
          extra_credits?: number | null
          id?: string
          limit_ai_tokens_monthly?: number | null
          limit_leads?: number | null
          limit_products?: number | null
          limit_storage_mb?: number | null
          limit_users?: number | null
          limit_whatsapp_instances?: number | null
          module_ai_agent?: boolean | null
          module_ai_transcription?: boolean | null
          module_api_access?: boolean | null
          module_automation_flows?: boolean | null
          module_campaigns?: boolean | null
          module_ecommerce?: boolean | null
          module_erp_integration?: boolean | null
          module_multi_whatsapp?: boolean | null
          module_whitelabel?: boolean | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          overrides?: Json | null
          storage_mb_per_user?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          ai_use_global_config?: boolean | null
          created_at?: string | null
          credits_per_user?: number | null
          extra_credits?: number | null
          id?: string
          limit_ai_tokens_monthly?: number | null
          limit_leads?: number | null
          limit_products?: number | null
          limit_storage_mb?: number | null
          limit_users?: number | null
          limit_whatsapp_instances?: number | null
          module_ai_agent?: boolean | null
          module_ai_transcription?: boolean | null
          module_api_access?: boolean | null
          module_automation_flows?: boolean | null
          module_campaigns?: boolean | null
          module_ecommerce?: boolean | null
          module_erp_integration?: boolean | null
          module_multi_whatsapp?: boolean | null
          module_whitelabel?: boolean | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          overrides?: Json | null
          storage_mb_per_user?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_invites: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          responded_at: string | null
          role: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          responded_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          responded_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_onboarding: {
        Row: {
          assigned_implementer_id: string | null
          checklist: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          niche_template_id: string | null
          notes: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["onboarding_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_implementer_id?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          niche_template_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_implementer_id?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          niche_template_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_niche_template_id_fkey"
            columns: ["niche_template_id"]
            isOneToOne: false
            referencedRelation: "niche_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_onboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_onboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_onboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_sync_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          started_at: string | null
          status: string
          sync_type: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          sync_type: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_template_exclusions: {
        Row: {
          exclusion_type: string | null
          id: string
          item_key: string
          reason: string | null
          template_id: string | null
          tenant_id: string
        }
        Insert: {
          exclusion_type?: string | null
          id?: string
          item_key: string
          reason?: string | null
          template_id?: string | null
          tenant_id: string
        }
        Update: {
          exclusion_type?: string | null
          id?: string
          item_key?: string
          reason?: string | null
          template_id?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      tenant_template_overrides: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          override_key: string
          override_type: string
          override_value: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          override_key: string
          override_type: string
          override_value: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          override_key?: string
          override_type?: string
          override_value?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_template_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_template_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_template_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_template_subscriptions: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          last_synced_version: string | null
          local_overrides: Json | null
          sync_error: string | null
          sync_mode: string | null
          sync_sections: string[] | null
          sync_status: string | null
          template_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          last_synced_version?: string | null
          local_overrides?: Json | null
          sync_error?: string | null
          sync_mode?: string | null
          sync_sections?: string[] | null
          sync_status?: string | null
          template_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          last_synced_version?: string | null
          local_overrides?: Json | null
          sync_error?: string | null
          sync_mode?: string | null
          sync_sections?: string[] | null
          sync_status?: string | null
          template_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_template_subscriptions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "master_niche_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          active_users: number | null
          ai_credits_remaining: number | null
          ai_credits_used: number | null
          ai_tokens_month: number | null
          ai_tokens_used: number | null
          api_calls: number | null
          campaign_messages_month: number | null
          created_at: string | null
          credits_consumed: number | null
          estimated_cost_brl: number | null
          id: string
          last_calculated_at: string | null
          leads_count: number | null
          messages_count: number | null
          messages_sent: number | null
          period_end: string
          period_start: string
          products_count: number | null
          storage_used_mb: number | null
          tenant_id: string
          total_credits_purchased: number | null
          transcription_seconds_month: number | null
          updated_at: string | null
          users_count: number | null
          whatsapp_instances_count: number | null
        }
        Insert: {
          active_users?: number | null
          ai_credits_remaining?: number | null
          ai_credits_used?: number | null
          ai_tokens_month?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          campaign_messages_month?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          estimated_cost_brl?: number | null
          id?: string
          last_calculated_at?: string | null
          leads_count?: number | null
          messages_count?: number | null
          messages_sent?: number | null
          period_end: string
          period_start: string
          products_count?: number | null
          storage_used_mb?: number | null
          tenant_id: string
          total_credits_purchased?: number | null
          transcription_seconds_month?: number | null
          updated_at?: string | null
          users_count?: number | null
          whatsapp_instances_count?: number | null
        }
        Update: {
          active_users?: number | null
          ai_credits_remaining?: number | null
          ai_credits_used?: number | null
          ai_tokens_month?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          campaign_messages_month?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          estimated_cost_brl?: number | null
          id?: string
          last_calculated_at?: string | null
          leads_count?: number | null
          messages_count?: number | null
          messages_sent?: number | null
          period_end?: string
          period_start?: string
          products_count?: number | null
          storage_used_mb?: number | null
          tenant_id?: string
          total_credits_purchased?: number | null
          transcription_seconds_month?: number | null
          updated_at?: string | null
          users_count?: number | null
          whatsapp_instances_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          ai_credits: number | null
          ai_token_limit: number | null
          api_url: string | null
          billing_day: number | null
          blocked_at: string | null
          blocked_reason: string | null
          channel_price: number | null
          city: string | null
          config: Json | null
          contact_email: string | null
          contracted_users: number | null
          country: string | null
          created_at: string | null
          current_period_end: string | null
          custom_domain: string | null
          discount_type: string | null
          discount_value: number | null
          document: string | null
          extra_channels: number | null
          has_monthly_fee: boolean | null
          id: string
          implementation_fee: number | null
          implementation_level: number | null
          implementation_paid_at: string | null
          implementation_paid_externally: boolean | null
          implementation_status: string | null
          invite_link_id: string | null
          is_active: boolean | null
          is_blocked: boolean | null
          is_master: boolean | null
          lead_source: string | null
          limits: Json | null
          limits_override: Json | null
          name: string
          payment_method: string | null
          plan_features: Json | null
          plan_id: string | null
          plan_type: string | null
          price_per_user: number | null
          sales_rep_id: string | null
          settings: Json | null
          state: string | null
          status: string | null
          storage_limit_gb: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subdomain: string
          subdomain_slug: string | null
          subscription_status: string | null
          trial_days: number | null
          trial_enabled: boolean | null
        }
        Insert: {
          ai_credits?: number | null
          ai_token_limit?: number | null
          api_url?: string | null
          billing_day?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          channel_price?: number | null
          city?: string | null
          config?: Json | null
          contact_email?: string | null
          contracted_users?: number | null
          country?: string | null
          created_at?: string | null
          current_period_end?: string | null
          custom_domain?: string | null
          discount_type?: string | null
          discount_value?: number | null
          document?: string | null
          extra_channels?: number | null
          has_monthly_fee?: boolean | null
          id?: string
          implementation_fee?: number | null
          implementation_level?: number | null
          implementation_paid_at?: string | null
          implementation_paid_externally?: boolean | null
          implementation_status?: string | null
          invite_link_id?: string | null
          is_active?: boolean | null
          is_blocked?: boolean | null
          is_master?: boolean | null
          lead_source?: string | null
          limits?: Json | null
          limits_override?: Json | null
          name: string
          payment_method?: string | null
          plan_features?: Json | null
          plan_id?: string | null
          plan_type?: string | null
          price_per_user?: number | null
          sales_rep_id?: string | null
          settings?: Json | null
          state?: string | null
          status?: string | null
          storage_limit_gb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain: string
          subdomain_slug?: string | null
          subscription_status?: string | null
          trial_days?: number | null
          trial_enabled?: boolean | null
        }
        Update: {
          ai_credits?: number | null
          ai_token_limit?: number | null
          api_url?: string | null
          billing_day?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          channel_price?: number | null
          city?: string | null
          config?: Json | null
          contact_email?: string | null
          contracted_users?: number | null
          country?: string | null
          created_at?: string | null
          current_period_end?: string | null
          custom_domain?: string | null
          discount_type?: string | null
          discount_value?: number | null
          document?: string | null
          extra_channels?: number | null
          has_monthly_fee?: boolean | null
          id?: string
          implementation_fee?: number | null
          implementation_level?: number | null
          implementation_paid_at?: string | null
          implementation_paid_externally?: boolean | null
          implementation_status?: string | null
          invite_link_id?: string | null
          is_active?: boolean | null
          is_blocked?: boolean | null
          is_master?: boolean | null
          lead_source?: string | null
          limits?: Json | null
          limits_override?: Json | null
          name?: string
          payment_method?: string | null
          plan_features?: Json | null
          plan_id?: string | null
          plan_type?: string | null
          price_per_user?: number | null
          sales_rep_id?: string | null
          settings?: Json | null
          state?: string | null
          status?: string | null
          storage_limit_gb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string
          subdomain_slug?: string | null
          subscription_status?: string | null
          trial_days?: number | null
          trial_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_invite_link_id_fkey"
            columns: ["invite_link_id"]
            isOneToOne: false
            referencedRelation: "invite_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_executions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          execution_time_ms: number | null
          id: string
          params: Json | null
          result: Json | null
          status: string | null
          tenant_id: string
          tool_name: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          params?: Json | null
          result?: Json | null
          status?: string | null
          tenant_id: string
          tool_name: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          params?: Json | null
          result?: Json | null
          status?: string | null
          tenant_id?: string
          tool_name?: string
        }
        Relationships: []
      }
      uoclub_accounts: {
        Row: {
          balance: number
          created_at: string
          email: string | null
          id: string
          last_activity_at: string | null
          lead_id: string | null
          name: string | null
          phone: string | null
          program_id: string
          public_token: string
          tenant_id: string
          tier_id: string | null
          total_earned: number
          total_redeemed: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lead_id?: string | null
          name?: string | null
          phone?: string | null
          program_id: string
          public_token?: string
          tenant_id: string
          tier_id?: string | null
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lead_id?: string | null
          name?: string | null
          phone?: string | null
          program_id?: string
          public_token?: string
          tenant_id?: string
          tier_id?: string | null
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_accounts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_accounts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_accounts_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "uoclub_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      uoclub_dispatch_requests: {
        Row: {
          account_id: string
          attempts: number
          created_at: string
          event: string
          id: string
          last_error: string | null
          next_retry_at: string | null
          processed_at: string | null
          reference_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          vars: Json
        }
        Insert: {
          account_id: string
          attempts?: number
          created_at?: string
          event: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          processed_at?: string | null
          reference_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vars?: Json
        }
        Update: {
          account_id?: string
          attempts?: number
          created_at?: string
          event?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          processed_at?: string | null
          reference_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vars?: Json
        }
        Relationships: []
      }
      uoclub_ledger_events: {
        Row: {
          account_id: string | null
          amount_brl: number
          created_at: string
          event_type: string
          external_ref: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          points: number
          program_id: string | null
          source: string
          tenant_id: string
        }
        Insert: {
          account_id?: string | null
          amount_brl?: number
          created_at?: string
          event_type: string
          external_ref?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          points?: number
          program_id?: string | null
          source?: string
          tenant_id: string
        }
        Update: {
          account_id?: string | null
          amount_brl?: number
          created_at?: string
          event_type?: string
          external_ref?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          points?: number
          program_id?: string | null
          source?: string
          tenant_id?: string
        }
        Relationships: []
      }
      uoclub_message_log: {
        Row: {
          account_id: string
          body: string | null
          channel: string
          created_at: string
          error: string | null
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id: string
          media_url: string | null
          phone: string | null
          program_id: string | null
          reference_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          vars: Json
        }
        Insert: {
          account_id: string
          body?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          media_url?: string | null
          phone?: string | null
          program_id?: string | null
          reference_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vars?: Json
        }
        Update: {
          account_id?: string
          body?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          event?: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          media_url?: string | null
          phone?: string | null
          program_id?: string | null
          reference_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vars?: Json
        }
        Relationships: []
      }
      uoclub_message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id: string
          is_active: boolean
          media_url: string | null
          program_id: string
          tenant_id: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          is_active?: boolean
          media_url?: string | null
          program_id: string
          tenant_id: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          event?: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          is_active?: boolean
          media_url?: string | null
          program_id?: string
          tenant_id?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_message_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_message_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_nps_surveys: {
        Row: {
          account_id: string
          bonus_credited: number | null
          classification: string | null
          comment: string | null
          created_at: string
          google_review_published: boolean
          google_review_requested: boolean
          id: string
          program_id: string
          responded_at: string | null
          review_at: string | null
          review_bonus_credited: number | null
          sale_id: string | null
          score: number | null
          tenant_id: string
        }
        Insert: {
          account_id: string
          bonus_credited?: number | null
          classification?: string | null
          comment?: string | null
          created_at?: string
          google_review_published?: boolean
          google_review_requested?: boolean
          id?: string
          program_id: string
          responded_at?: string | null
          review_at?: string | null
          review_bonus_credited?: number | null
          sale_id?: string | null
          score?: number | null
          tenant_id: string
        }
        Update: {
          account_id?: string
          bonus_credited?: number | null
          classification?: string | null
          comment?: string | null
          created_at?: string
          google_review_published?: boolean
          google_review_requested?: boolean
          id?: string
          program_id?: string
          responded_at?: string | null
          review_at?: string | null
          review_bonus_credited?: number | null
          sale_id?: string | null
          score?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_nps_surveys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_nps_surveys_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_nps_surveys_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_nps_surveys_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "uoclub_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_programs: {
        Row: {
          billing_enabled: boolean
          conversion_rate: number
          created_at: string
          currency: string
          default_expire_days: number
          default_whatsapp_instance_id: string | null
          id: string
          is_active: boolean
          max_redeem_pct: number
          min_redeem_points: number
          name: string
          points_label: string
          settings: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_enabled?: boolean
          conversion_rate?: number
          created_at?: string
          currency?: string
          default_expire_days?: number
          default_whatsapp_instance_id?: string | null
          id?: string
          is_active?: boolean
          max_redeem_pct?: number
          min_redeem_points?: number
          name?: string
          points_label?: string
          settings?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_enabled?: boolean
          conversion_rate?: number
          created_at?: string
          currency?: string
          default_expire_days?: number
          default_whatsapp_instance_id?: string | null
          id?: string
          is_active?: boolean
          max_redeem_pct?: number
          min_redeem_points?: number
          name?: string
          points_label?: string
          settings?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_programs_default_whatsapp_instance_id_fkey"
            columns: ["default_whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_public_otp_challenges: {
        Row: {
          account_id: string | null
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          metadata: Json
          phone: string
          program_id: string | null
          sent_at: string
          status: string
          tenant_id: string
          updated_at: string
          verified_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          account_id?: string | null
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json
          phone: string
          program_id?: string | null
          sent_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
          verified_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          account_id?: string | null
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json
          phone?: string
          program_id?: string | null
          sent_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          verified_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_public_otp_challenges_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uoclub_public_otp_challenges_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_redemption_codes: {
        Row: {
          account_id: string
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          status: string
          tenant_id: string
          used_at: string | null
          used_sale_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          tenant_id: string
          used_at?: string | null
          used_sale_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          tenant_id?: string
          used_at?: string | null
          used_sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_redemption_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_redemption_codes_used_sale_id_fkey"
            columns: ["used_sale_id"]
            isOneToOne: false
            referencedRelation: "uoclub_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          metadata: Json
          program_id: string
          qualified_at: string | null
          referred_account_id: string | null
          referred_bonus: number | null
          referrer_account_id: string
          referrer_bonus: number | null
          rewarded_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          metadata?: Json
          program_id: string
          qualified_at?: string | null
          referred_account_id?: string | null
          referred_bonus?: number | null
          referrer_account_id: string
          referrer_bonus?: number | null
          rewarded_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          metadata?: Json
          program_id?: string
          qualified_at?: string | null
          referred_account_id?: string | null
          referred_bonus?: number | null
          referrer_account_id?: string
          referrer_bonus?: number | null
          rewarded_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_referrals_referred_account_id_fkey"
            columns: ["referred_account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_referrals_referrer_account_id_fkey"
            columns: ["referrer_account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_reservations: {
        Row: {
          account_id: string
          amount_brl: number
          committed_transaction_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          order_amount_brl: number
          order_ref: string | null
          points: number
          program_id: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_brl?: number
          committed_transaction_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_amount_brl?: number
          order_ref?: string | null
          points?: number
          program_id?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_brl?: number
          committed_transaction_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_amount_brl?: number
          order_ref?: string | null
          points?: number
          program_id?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_reservations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_rules: {
        Row: {
          base_pct: number
          cci_modifier: boolean
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          max_cashback: number | null
          min_ticket: number | null
          name: string
          priority: number
          program_id: string
          scope: string
          scope_value: string | null
          starts_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          base_pct?: number
          cci_modifier?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_cashback?: number | null
          min_ticket?: number | null
          name: string
          priority?: number
          program_id: string
          scope?: string
          scope_value?: string | null
          starts_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          base_pct?: number
          cci_modifier?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_cashback?: number | null
          min_ticket?: number | null
          name?: string
          priority?: number
          program_id?: string
          scope?: string
          scope_value?: string | null
          starts_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_rules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_rules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_sales: {
        Row: {
          account_id: string | null
          amount: number
          cashback_amount: number
          cci_score: number | null
          created_at: string
          currency: string
          external_id: string | null
          id: string
          items: Json
          metadata: Json
          occurred_at: string
          origin: Database["public"]["Enums"]["uoclub_sale_origin"]
          status: string
          tenant_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          cashback_amount?: number
          cci_score?: number | null
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          items?: Json
          metadata?: Json
          occurred_at?: string
          origin: Database["public"]["Enums"]["uoclub_sale_origin"]
          status?: string
          tenant_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          cashback_amount?: number
          cci_score?: number | null
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          items?: Json
          metadata?: Json
          occurred_at?: string
          origin?: Database["public"]["Enums"]["uoclub_sale_origin"]
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_tiers: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          level: number
          min_spent_90d: number
          multiplier: number
          name: string
          perks: Json
          program_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level: number
          min_spent_90d?: number
          multiplier?: number
          name: string
          perks?: Json
          program_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level?: number
          min_spent_90d?: number
          multiplier?: number
          name?: string
          perks?: Json
          program_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_tiers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_tiers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          nps_id: string | null
          referral_id: string | null
          sale_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["uoclub_tx_type"]
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          nps_id?: string | null
          referral_id?: string | null
          sale_id?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["uoclub_tx_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          nps_id?: string | null
          referral_id?: string | null
          sale_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["uoclub_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "uoclub_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_triggers: {
        Row: {
          conditions: Json
          created_at: string
          delay_minutes: number
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id: string
          is_active: boolean
          program_id: string
          tenant_id: string
          updated_at: string
          whatsapp_instance_id: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string
          delay_minutes?: number
          event: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          is_active?: boolean
          program_id: string
          tenant_id: string
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string
          delay_minutes?: number
          event?: Database["public"]["Enums"]["uoclub_trigger_event"]
          id?: string
          is_active?: boolean
          program_id?: string
          tenant_id?: string
          updated_at?: string
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uoclub_triggers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_executive_metrics"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "uoclub_triggers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "uoclub_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoclub_triggers_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      uoclub_usage_counters: {
        Row: {
          active_accounts: number
          cashback_credited: number
          cashback_redeemed: number
          id: string
          period_month: string
          sales_count: number
          tenant_id: string
          tx_count: number
          updated_at: string
        }
        Insert: {
          active_accounts?: number
          cashback_credited?: number
          cashback_redeemed?: number
          id?: string
          period_month: string
          sales_count?: number
          tenant_id: string
          tx_count?: number
          updated_at?: string
        }
        Update: {
          active_accounts?: number
          cashback_credited?: number
          cashback_redeemed?: number
          id?: string
          period_month?: string
          sales_count?: number
          tenant_id?: string
          tx_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      uopa_context: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          tenant_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id: string
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      uopa_outreach_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_message: string | null
          attempts: number
          chosen_angle: string | null
          conversation_id: string | null
          created_at: string
          edited_at: string | null
          edited_by: string | null
          generated_message: string | null
          id: string
          last_error: string | null
          lead_id: string
          max_attempts: number
          message_fingerprint: string | null
          replied_at: string | null
          reply_message_id: string | null
          run_id: string
          scheduled_for: string
          send_job_id: string | null
          skip_reason: string | null
          status: string
          tenant_id: string
          updated_at: string
          whatsapp_instance_id: string | null
          zone_snapshot: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_message?: string | null
          attempts?: number
          chosen_angle?: string | null
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          generated_message?: string | null
          id?: string
          last_error?: string | null
          lead_id: string
          max_attempts?: number
          message_fingerprint?: string | null
          replied_at?: string | null
          reply_message_id?: string | null
          run_id: string
          scheduled_for: string
          send_job_id?: string | null
          skip_reason?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          whatsapp_instance_id?: string | null
          zone_snapshot?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_message?: string | null
          attempts?: number
          chosen_angle?: string | null
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          generated_message?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string
          max_attempts?: number
          message_fingerprint?: string | null
          replied_at?: string | null
          reply_message_id?: string | null
          run_id?: string
          scheduled_for?: string
          send_job_id?: string | null
          skip_reason?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          whatsapp_instance_id?: string | null
          zone_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uopa_outreach_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "uopa_outreach_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      uopa_outreach_runs: {
        Row: {
          activation_template: Json | null
          cadence_snapshot: Json | null
          created_at: string
          id: string
          metrics: Json
          mode: string
          outreach_brief: Json | null
          status: string
          tenant_id: string
          total_leads: number
          trigger_source: string
          triggered_by: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          activation_template?: Json | null
          cadence_snapshot?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          mode?: string
          outreach_brief?: Json | null
          status?: string
          tenant_id: string
          total_leads?: number
          trigger_source: string
          triggered_by?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          activation_template?: Json | null
          cadence_snapshot?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          mode?: string
          outreach_brief?: Json | null
          status?: string
          tenant_id?: string
          total_leads?: number
          trigger_source?: string
          triggered_by?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      uopa_send_audience_snapshot: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          included: boolean
          lead_id: string | null
          priority_score: number | null
          reason_code: string | null
          run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          included?: boolean
          lead_id?: string | null
          priority_score?: number | null
          reason_code?: string | null
          run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          included?: boolean
          lead_id?: string | null
          priority_score?: number | null
          reason_code?: string | null
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uopa_send_audience_snapshot_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_audience_snapshot_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "uopa_send_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_audience_snapshot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_audience_snapshot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uopa_send_audience_snapshot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      uopa_send_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string | null
          payload: Json
          run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id?: string | null
          payload?: Json
          run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          payload?: Json
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uopa_send_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "uopa_send_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uopa_send_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      uopa_send_generated_messages: {
        Row: {
          created_at: string
          estimated_credits: number
          id: string
          lead_id: string | null
          message_text: string
          metadata: Json
          mode: string
          run_id: string
          similarity_score: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_credits?: number
          id?: string
          lead_id?: string | null
          message_text: string
          metadata?: Json
          mode?: string
          run_id: string
          similarity_score?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_credits?: number
          id?: string
          lead_id?: string | null
          message_text?: string
          metadata?: Json
          mode?: string
          run_id?: string
          similarity_score?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uopa_send_generated_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_generated_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "uopa_send_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_generated_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_generated_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uopa_send_generated_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      uopa_send_lead_state: {
        Row: {
          attempt_count: number
          created_at: string
          current_state: string
          handoff_required: boolean
          id: string
          last_inbound_at: string | null
          last_outbound_at: string | null
          lead_id: string
          next_step_at: string | null
          run_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          current_state?: string
          handoff_required?: boolean
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          lead_id: string
          next_step_at?: string | null
          run_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          current_state?: string
          handoff_required?: boolean
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          lead_id?: string
          next_step_at?: string | null
          run_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uopa_send_lead_state_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_lead_state_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "uopa_send_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_lead_state_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_lead_state_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uopa_send_lead_state_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      uopa_send_runs: {
        Row: {
          audience_filters: Json
          audience_summary: Json
          channel: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          estimated_credits: number
          focus_summary: string | null
          governance_config: Json
          id: string
          launched_at: string | null
          message_config: Json
          metrics: Json
          mode: string
          name: string
          objective: string
          paused_at: string | null
          status: string
          strategy_config: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience_filters?: Json
          audience_summary?: Json
          channel?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_credits?: number
          focus_summary?: string | null
          governance_config?: Json
          id?: string
          launched_at?: string | null
          message_config?: Json
          metrics?: Json
          mode?: string
          name: string
          objective: string
          paused_at?: string | null
          status?: string
          strategy_config?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience_filters?: Json
          audience_summary?: Json
          channel?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_credits?: number
          focus_summary?: string | null
          governance_config?: Json
          id?: string
          launched_at?: string | null
          message_config?: Json
          metrics?: Json
          mode?: string
          name?: string
          objective?: string
          paused_at?: string | null
          status?: string
          strategy_config?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uopa_send_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uopa_send_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "uopa_send_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      upload_chunks: {
        Row: {
          chunk_data: string
          chunk_index: number
          created_at: string | null
          upload_id: string
        }
        Insert: {
          chunk_data: string
          chunk_index: number
          created_at?: string | null
          upload_id: string
        }
        Update: {
          chunk_data?: string
          chunk_index?: number
          created_at?: string | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_chunks_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          chunks_received: number | null
          content_type: string
          created_at: string | null
          expires_at: string
          id: string
          path: string
          tenant_id: string
          total_chunks: number
        }
        Insert: {
          chunks_received?: number | null
          content_type?: string
          created_at?: string | null
          expires_at: string
          id: string
          path: string
          tenant_id: string
          total_chunks: number
        }
        Update: {
          chunks_received?: number | null
          content_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          path?: string
          tenant_id?: string
          total_chunks?: number
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          ai_model: string | null
          api_usage_log_id: string | null
          conversation_id: string | null
          created_at: string
          credits_consumed: number | null
          description: string | null
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json | null
          quantity: number | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          api_usage_log_id?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_consumed?: number | null
          description?: string | null
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          quantity?: number | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          api_usage_log_id?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_consumed?: number | null
          description?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          quantity?: number | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_agent_context: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string
          embedding: string | null
          id: number
          metadata: Json | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description: string
          embedding?: string | null
          id?: never
          metadata?: Json | null
          tenant_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string
          embedding?: string | null
          id?: never
          metadata?: Json | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credit_settings: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          metadata: Json
          monthly_credits_base: number
          notes: string | null
          origin: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          metadata?: Json
          monthly_credits_base: number
          notes?: string | null
          origin?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          metadata?: Json
          monthly_credits_base?: number
          notes?: string | null
          origin?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credit_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credit_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_credit_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_credit_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education_progress: {
        Row: {
          ai_activations_count: number | null
          education_dismissed_at: string | null
          education_started_at: string | null
          id: string
          pain_points_triggered: string[] | null
          seen_tips: string[] | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          ai_activations_count?: number | null
          education_dismissed_at?: string | null
          education_started_at?: string | null
          id?: string
          pain_points_triggered?: string[] | null
          seen_tips?: string[] | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          ai_activations_count?: number | null
          education_dismissed_at?: string | null
          education_started_at?: string | null
          id?: string
          pain_points_triggered?: string[] | null
          seen_tips?: string[] | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_education_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_education_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_education_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_limits: {
        Row: {
          ai_tokens_monthly: number | null
          api_calls_monthly: number | null
          can_manage_automations: boolean | null
          can_send_campaigns: boolean | null
          can_transcribe: boolean | null
          can_use_ai: boolean | null
          can_use_api: boolean | null
          configured_at: string | null
          configured_by: string | null
          created_at: string | null
          id: string
          messages_monthly: number | null
          reason: string | null
          storage_mb: number | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_tokens_monthly?: number | null
          api_calls_monthly?: number | null
          can_manage_automations?: boolean | null
          can_send_campaigns?: boolean | null
          can_transcribe?: boolean | null
          can_use_ai?: boolean | null
          can_use_api?: boolean | null
          configured_at?: string | null
          configured_by?: string | null
          created_at?: string | null
          id?: string
          messages_monthly?: number | null
          reason?: string | null
          storage_mb?: number | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_tokens_monthly?: number | null
          api_calls_monthly?: number | null
          can_manage_automations?: boolean | null
          can_send_campaigns?: boolean | null
          can_transcribe?: boolean | null
          can_use_ai?: boolean | null
          can_use_api?: boolean | null
          configured_at?: string | null
          configured_by?: string | null
          created_at?: string | null
          id?: string
          messages_monthly?: number | null
          reason?: string | null
          storage_mb?: number | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      user_usage: {
        Row: {
          ai_tokens_month: number | null
          ai_tokens_total: number | null
          api_calls_month: number | null
          billing_period_start: string | null
          credits_consumed_month: number | null
          extra_credits: number | null
          id: string
          last_updated_at: string | null
          messages_sent_month: number | null
          storage_bytes: number | null
          tenant_id: string
          transcription_seconds_month: number | null
          user_id: string
        }
        Insert: {
          ai_tokens_month?: number | null
          ai_tokens_total?: number | null
          api_calls_month?: number | null
          billing_period_start?: string | null
          credits_consumed_month?: number | null
          extra_credits?: number | null
          id?: string
          last_updated_at?: string | null
          messages_sent_month?: number | null
          storage_bytes?: number | null
          tenant_id: string
          transcription_seconds_month?: number | null
          user_id: string
        }
        Update: {
          ai_tokens_month?: number | null
          ai_tokens_total?: number | null
          api_calls_month?: number | null
          billing_period_start?: string | null
          credits_consumed_month?: number | null
          extra_credits?: number | null
          id?: string
          last_updated_at?: string | null
          messages_sent_month?: number | null
          storage_bytes?: number | null
          tenant_id?: string
          transcription_seconds_month?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedor_cloning_profiles: {
        Row: {
          analyzed_conversations_count: number | null
          avg_message_length: number | null
          confidence_score: number | null
          created_at: string | null
          emoji_usage_frequency: number | null
          example_messages: Json | null
          favorite_emojis: string[] | null
          id: string
          last_analysis_at: string | null
          preferred_techniques: string[] | null
          response_pattern: string | null
          signature_phrases: string[] | null
          tenant_id: string | null
          tone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analyzed_conversations_count?: number | null
          avg_message_length?: number | null
          confidence_score?: number | null
          created_at?: string | null
          emoji_usage_frequency?: number | null
          example_messages?: Json | null
          favorite_emojis?: string[] | null
          id?: string
          last_analysis_at?: string | null
          preferred_techniques?: string[] | null
          response_pattern?: string | null
          signature_phrases?: string[] | null
          tenant_id?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analyzed_conversations_count?: number | null
          avg_message_length?: number | null
          confidence_score?: number | null
          created_at?: string | null
          emoji_usage_frequency?: number | null
          example_messages?: Json | null
          favorite_emojis?: string[] | null
          id?: string
          last_analysis_at?: string | null
          preferred_techniques?: string[] | null
          response_pattern?: string | null
          signature_phrases?: string[] | null
          tenant_id?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendedor_cloning_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendedor_cloning_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "vendedor_cloning_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      video_send_jobs: {
        Row: {
          artifact_size: number | null
          can_resume: boolean
          caption: string | null
          conversation_id: string
          created_at: string
          created_by: string | null
          failure_code: string | null
          failure_message: string | null
          final_media_url: string | null
          gcs_path: string | null
          gcs_public_url: string | null
          gcs_session_uri: string | null
          id: string
          last_heartbeat_at: string | null
          lead_id: string
          media_type: string
          metadata: Json
          mime_type: string
          original_file_name: string
          original_size: number
          phase: string
          processing_started_at: string | null
          progress: number
          provider_message_id: string | null
          recoverable: boolean
          resume_token: string | null
          sent_at: string | null
          status: string
          target_size_mb: number
          tenant_id: string
          transcoder_job_id: string | null
          updated_at: string
          upload_offset: number | null
          upload_strategy: string | null
          uploaded_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          artifact_size?: number | null
          can_resume?: boolean
          caption?: string | null
          conversation_id: string
          created_at?: string
          created_by?: string | null
          failure_code?: string | null
          failure_message?: string | null
          final_media_url?: string | null
          gcs_path?: string | null
          gcs_public_url?: string | null
          gcs_session_uri?: string | null
          id?: string
          last_heartbeat_at?: string | null
          lead_id: string
          media_type?: string
          metadata?: Json
          mime_type: string
          original_file_name: string
          original_size: number
          phase?: string
          processing_started_at?: string | null
          progress?: number
          provider_message_id?: string | null
          recoverable?: boolean
          resume_token?: string | null
          sent_at?: string | null
          status?: string
          target_size_mb?: number
          tenant_id: string
          transcoder_job_id?: string | null
          updated_at?: string
          upload_offset?: number | null
          upload_strategy?: string | null
          uploaded_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          artifact_size?: number | null
          can_resume?: boolean
          caption?: string | null
          conversation_id?: string
          created_at?: string
          created_by?: string | null
          failure_code?: string | null
          failure_message?: string | null
          final_media_url?: string | null
          gcs_path?: string | null
          gcs_public_url?: string | null
          gcs_session_uri?: string | null
          id?: string
          last_heartbeat_at?: string | null
          lead_id?: string
          media_type?: string
          metadata?: Json
          mime_type?: string
          original_file_name?: string
          original_size?: number
          phase?: string
          processing_started_at?: string | null
          progress?: number
          provider_message_id?: string | null
          recoverable?: boolean
          resume_token?: string | null
          sent_at?: string | null
          status?: string
          target_size_mb?: number
          tenant_id?: string
          transcoder_job_id?: string | null
          updated_at?: string
          upload_offset?: number | null
          upload_strategy?: string | null
          uploaded_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_send_jobs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_send_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_send_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_send_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "video_send_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "video_send_jobs_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          allowed_ips: string[] | null
          auto_assign_to: string | null
          created_at: string | null
          debug_mode: boolean | null
          dedupe_strategy: string | null
          default_funnel_id: string | null
          default_source: string | null
          default_stage_id: string | null
          default_tags: string[] | null
          default_temperature: string | null
          error_count: number | null
          field_mapping: Json | null
          id: string
          is_active: boolean | null
          last_submission_at: string | null
          log_retention_days: number | null
          merge_policy: Json | null
          name: string
          platform: string
          platform_version: string | null
          response_mode: string | null
          signature_required: boolean | null
          signing_secret: string | null
          tenant_id: string
          token: string
          token_last_rotated_at: string | null
          total_submissions: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_ips?: string[] | null
          auto_assign_to?: string | null
          created_at?: string | null
          debug_mode?: boolean | null
          dedupe_strategy?: string | null
          default_funnel_id?: string | null
          default_source?: string | null
          default_stage_id?: string | null
          default_tags?: string[] | null
          default_temperature?: string | null
          error_count?: number | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_submission_at?: string | null
          log_retention_days?: number | null
          merge_policy?: Json | null
          name: string
          platform?: string
          platform_version?: string | null
          response_mode?: string | null
          signature_required?: boolean | null
          signing_secret?: string | null
          tenant_id: string
          token?: string
          token_last_rotated_at?: string | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_ips?: string[] | null
          auto_assign_to?: string | null
          created_at?: string | null
          debug_mode?: boolean | null
          dedupe_strategy?: string | null
          default_funnel_id?: string | null
          default_source?: string | null
          default_stage_id?: string | null
          default_tags?: string[] | null
          default_temperature?: string | null
          error_count?: number | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_submission_at?: string | null
          log_retention_days?: number | null
          merge_policy?: Json | null
          name?: string
          platform?: string
          platform_version?: string | null
          response_mode?: string | null
          signature_required?: boolean | null
          signing_secret?: string | null
          tenant_id?: string
          token?: string
          token_last_rotated_at?: string | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhook_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      webhook_events_raw: {
        Row: {
          created_at: string | null
          error_log: string | null
          event_type: string
          exhausted_at: string | null
          external_message_id: string | null
          id: string
          processed_at: string | null
          provider: string | null
          quarantine_reason: string | null
          quarantine_until: string | null
          raw_payload: Json
          replay_attempts: number | null
          replay_source: string | null
          resolution_attempts: number | null
          resolution_signals: Json | null
          status: Database["public"]["Enums"]["webhook_event_status"] | null
          tenant_id: string | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_log?: string | null
          event_type: string
          exhausted_at?: string | null
          external_message_id?: string | null
          id?: string
          processed_at?: string | null
          provider?: string | null
          quarantine_reason?: string | null
          quarantine_until?: string | null
          raw_payload: Json
          replay_attempts?: number | null
          replay_source?: string | null
          resolution_attempts?: number | null
          resolution_signals?: Json | null
          status?: Database["public"]["Enums"]["webhook_event_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_log?: string | null
          event_type?: string
          exhausted_at?: string | null
          external_message_id?: string | null
          id?: string
          processed_at?: string | null
          provider?: string | null
          quarantine_reason?: string | null
          quarantine_until?: string | null
          raw_payload?: Json
          replay_attempts?: number | null
          replay_source?: string | null
          resolution_attempts?: number | null
          resolution_signals?: Json | null
          status?: Database["public"]["Enums"]["webhook_event_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_raw_replay_source_fkey"
            columns: ["replay_source"]
            isOneToOne: false
            referencedRelation: "webhook_events_raw"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_raw_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_raw_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhook_events_raw_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhook_events_raw_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          instance_id: string | null
          payload: Json | null
          processed_at: string | null
          processing_result: string | null
          received_at: string | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          tenant_id: string | null
          webhook_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          instance_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          processing_result?: string | null
          received_at?: string | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          tenant_id?: string | null
          webhook_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          instance_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          processing_result?: string | null
          received_at?: string | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          tenant_id?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_quarantine: {
        Row: {
          created_at: string | null
          id: string
          payload_instance_id: string | null
          raw_payload: Json | null
          reason: string
          token_instance_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload_instance_id?: string | null
          raw_payload?: Json | null
          reason: string
          token_instance_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload_instance_id?: string | null
          raw_payload?: Json | null
          reason?: string
          token_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_quarantine_payload_instance_id_fkey"
            columns: ["payload_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_quarantine_token_instance_id_fkey"
            columns: ["token_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_submissions: {
        Row: {
          connector_version: string | null
          created_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          ip_address: string | null
          lead_id: string | null
          mapped_data: Json | null
          processed_at: string | null
          processing_time_ms: number | null
          raw_payload: Json | null
          redacted_payload: Json | null
          signature_valid: boolean | null
          status: string | null
          tenant_id: string
          user_agent: string | null
          webhook_config_id: string
        }
        Insert: {
          connector_version?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          lead_id?: string | null
          mapped_data?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          raw_payload?: Json | null
          redacted_payload?: Json | null
          signature_valid?: boolean | null
          status?: string | null
          tenant_id: string
          user_agent?: string | null
          webhook_config_id: string
        }
        Update: {
          connector_version?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          lead_id?: string | null
          mapped_data?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          raw_payload?: Json | null
          redacted_payload?: Json | null
          signature_valid?: boolean | null
          status?: string | null
          tenant_id?: string
          user_agent?: string | null
          webhook_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhook_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhook_submissions_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[]
          id: string
          is_active: boolean | null
          name: string
          retry_count: number | null
          secret: string | null
          tenant_id: string
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name: string
          retry_count?: number | null
          secret?: string | null
          tenant_id: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          retry_count?: number | null
          secret?: string | null
          tenant_id?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          details: Json | null
          id: string
          instance_id: string | null
          ip_address: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          instance_id?: string | null
          ip_address?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          instance_id?: string | null
          ip_address?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_calls: {
        Row: {
          answered_at: string | null
          call_type: string
          conversation_id: string | null
          created_at: string | null
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          instance_id: string | null
          lead_id: string | null
          metadata: Json | null
          recording_url: string | null
          started_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          answered_at?: string | null
          call_type?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          metadata?: Json | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          answered_at?: string | null
          call_type?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          metadata?: Json | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_group_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          group_id: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          group_id: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          group_id?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_access_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_group_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_group_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_group_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          announce_only: boolean | null
          created_at: string | null
          creation: number | null
          description: string | null
          id: string
          invite_link: string | null
          is_archived: boolean | null
          is_community: boolean | null
          is_community_announce: boolean | null
          is_favorite: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          jid: string
          last_message_at: string | null
          last_message_preview: string | null
          last_sync_at: string | null
          muted_until: string | null
          owner: string | null
          participants: Json | null
          profile_picture: string | null
          restrict_send: boolean | null
          size: number | null
          subject: string | null
          tenant_id: string
          unread_count: number | null
          updated_at: string | null
          visibility_level: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          announce_only?: boolean | null
          created_at?: string | null
          creation?: number | null
          description?: string | null
          id?: string
          invite_link?: string | null
          is_archived?: boolean | null
          is_community?: boolean | null
          is_community_announce?: boolean | null
          is_favorite?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          jid: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sync_at?: string | null
          muted_until?: string | null
          owner?: string | null
          participants?: Json | null
          profile_picture?: string | null
          restrict_send?: boolean | null
          size?: number | null
          subject?: string | null
          tenant_id: string
          unread_count?: number | null
          updated_at?: string | null
          visibility_level?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          announce_only?: boolean | null
          created_at?: string | null
          creation?: number | null
          description?: string | null
          id?: string
          invite_link?: string | null
          is_archived?: boolean | null
          is_community?: boolean | null
          is_community_announce?: boolean | null
          is_favorite?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          jid?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sync_at?: string | null
          muted_until?: string | null
          owner?: string | null
          participants?: Json | null
          profile_picture?: string | null
          restrict_send?: boolean | null
          size?: number | null
          subject?: string | null
          tenant_id?: string
          unread_count?: number | null
          updated_at?: string | null
          visibility_level?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_groups_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          assigned_seller_id: string | null
          channel_status: string | null
          connection_status: string | null
          created_at: string | null
          daily_message_limit: number | null
          default_funnel_id: string | null
          default_stage_id: string | null
          description: string | null
          display_name: string | null
          fixed_seller_id: string | null
          health_score: number | null
          id: string
          instance_id: string | null
          instance_name: string | null
          instance_token: string
          is_active: boolean | null
          is_primary: boolean | null
          last_connected_at: string | null
          last_connection_error: string | null
          last_health_check: string | null
          main_instance_id: string | null
          messages_sent_today: number | null
          monthly_cost_brl: number
          name: string | null
          phone: string | null
          phone_number: string | null
          provider: string
          qr_code: string | null
          role: string | null
          routing_mode: string | null
          status: string | null
          tenant_id: string
          type: string | null
          uazapi_instance_name: string | null
          updated_at: string | null
          used_for_campaigns: boolean | null
          warning_message: string | null
          webhook_last_verified: string | null
          webhook_status: string | null
          webhook_token: string | null
          webhook_url: string | null
        }
        Insert: {
          assigned_seller_id?: string | null
          channel_status?: string | null
          connection_status?: string | null
          created_at?: string | null
          daily_message_limit?: number | null
          default_funnel_id?: string | null
          default_stage_id?: string | null
          description?: string | null
          display_name?: string | null
          fixed_seller_id?: string | null
          health_score?: number | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_token: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connected_at?: string | null
          last_connection_error?: string | null
          last_health_check?: string | null
          main_instance_id?: string | null
          messages_sent_today?: number | null
          monthly_cost_brl?: number
          name?: string | null
          phone?: string | null
          phone_number?: string | null
          provider?: string
          qr_code?: string | null
          role?: string | null
          routing_mode?: string | null
          status?: string | null
          tenant_id: string
          type?: string | null
          uazapi_instance_name?: string | null
          updated_at?: string | null
          used_for_campaigns?: boolean | null
          warning_message?: string | null
          webhook_last_verified?: string | null
          webhook_status?: string | null
          webhook_token?: string | null
          webhook_url?: string | null
        }
        Update: {
          assigned_seller_id?: string | null
          channel_status?: string | null
          connection_status?: string | null
          created_at?: string | null
          daily_message_limit?: number | null
          default_funnel_id?: string | null
          default_stage_id?: string | null
          description?: string | null
          display_name?: string | null
          fixed_seller_id?: string | null
          health_score?: number | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_token?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connected_at?: string | null
          last_connection_error?: string | null
          last_health_check?: string | null
          main_instance_id?: string | null
          messages_sent_today?: number | null
          monthly_cost_brl?: number
          name?: string | null
          phone?: string | null
          phone_number?: string | null
          provider?: string
          qr_code?: string | null
          role?: string | null
          routing_mode?: string | null
          status?: string | null
          tenant_id?: string
          type?: string | null
          uazapi_instance_name?: string | null
          updated_at?: string | null
          used_for_campaigns?: boolean | null
          warning_message?: string | null
          webhook_last_verified?: string | null
          webhook_status?: string | null
          webhook_token?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_default_funnel_id_fkey"
            columns: ["default_funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instances_default_stage_id_fkey"
            columns: ["default_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_labels: {
        Row: {
          color: number | null
          created_at: string | null
          id: string
          instance_id: string | null
          label_id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: number | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          label_id: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: number | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          label_id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_labels_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_rate_card: {
        Row: {
          category: string
          cost_brl: number
          cost_usd: number | null
          country_code: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          provider: string
          usd_brl_rate: number | null
        }
        Insert: {
          category: string
          cost_brl?: number
          cost_usd?: number | null
          country_code?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          provider?: string
          usd_brl_rate?: number | null
        }
        Update: {
          category?: string
          cost_brl?: number
          cost_usd?: number | null
          country_code?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          provider?: string
          usd_brl_rate?: number | null
        }
        Relationships: []
      }
      whatsapp_send_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          conversation_id: string | null
          cost_brl: number
          created_at: string
          dedupe_key: string | null
          id: string
          instance_id: string
          items: Json
          last_error: string | null
          lead_phone: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          message_category: string | null
          progress: Json
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          conversation_id?: string | null
          cost_brl?: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          instance_id: string
          items: Json
          last_error?: string | null
          lead_phone: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          message_category?: string | null
          progress?: Json
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          conversation_id?: string | null
          cost_brl?: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          instance_id?: string
          items?: Json
          last_error?: string | null
          lead_phone?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          message_category?: string | null
          progress?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_products_view: {
        Row: {
          ai_can_use_minimum_price: boolean | null
          category: string | null
          category_id: string | null
          category_name: string | null
          compare_at_price: number | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          display_size: string | null
          embedding: string | null
          embedding_generated_at: string | null
          embedding_model: string | null
          id: string | null
          image_url: string | null
          images: string[] | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          item_type: string | null
          low_stock_alert: number | null
          minimum_price: number | null
          name: string | null
          price: number | null
          price_max: number | null
          pricing_type: string | null
          reserved_by: string | null
          seller_badge: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          tenant_id: string | null
          track_stock: boolean | null
          updated_at: string | null
          visibility: string | null
          wholesale_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      message_external_id_collisions: {
        Row: {
          channel_type: string | null
          conversation_count: number | null
          duplicate_count: number | null
          external_message_id: string | null
          first_seen_at: string | null
          last_seen_at: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      message_queue_diagnostics: {
        Row: {
          age_seconds: number | null
          attempt_count: number | null
          campaign_id: string | null
          conversation_id: string | null
          created_at: string | null
          id: string | null
          is_processing_stale: boolean | null
          lead_id: string | null
          max_attempts: number | null
          message_type: string | null
          next_retry_at: string | null
          processing_age_seconds: number | null
          processing_reference_at: string | null
          processing_started_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          age_seconds?: never
          attempt_count?: number | null
          campaign_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          is_processing_stale?: never
          lead_id?: string | null
          max_attempts?: number | null
          message_type?: string | null
          next_retry_at?: string | null
          processing_age_seconds?: never
          processing_reference_at?: never
          processing_started_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          age_seconds?: never
          attempt_count?: number | null
          campaign_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          is_processing_stale?: never
          lead_id?: string | null
          max_attempts?: number | null
          message_type?: string | null
          next_retry_at?: string | null
          processing_age_seconds?: never
          processing_reference_at?: never
          processing_started_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "message_queue_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts_safe: {
        Row: {
          alias: string | null
          created_at: string | null
          credentials_meta: Json | null
          id: string | null
          is_active: boolean | null
          is_default: boolean | null
          last_validated_at: string | null
          provider_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          credentials_meta?: Json | null
          id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_validated_at?: string | null
          provider_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          credentials_meta?: Json | null
          id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_validated_at?: string | null
          provider_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      public_catalog_products: {
        Row: {
          category: string | null
          category_id: string | null
          category_name: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          display_size: string | null
          id: string | null
          images: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          name: string | null
          price: number | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          wholesale_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      public_store_display: {
        Row: {
          accent_color: string | null
          benefit_delivery_text: string | null
          benefit_installment_text: string | null
          benefit_shipping_text: string | null
          benefit_warranty_text: string | null
          boleto_discount_percent: number | null
          boleto_enabled: boolean | null
          business_address: string | null
          business_hours: Json | null
          button_style: string | null
          catalog_columns_desktop: number | null
          catalog_columns_mobile: number | null
          catalog_default_sort: string | null
          debit_card_discount_percent: number | null
          debit_card_enabled: boolean | null
          enable_catalog_filters: boolean | null
          favicon_url: string | null
          financing_enabled: boolean | null
          financing_label: string | null
          financing_max_installments: number | null
          financing_simulator_enabled: boolean | null
          financing_simulator_title: string | null
          font_family: string | null
          footer_city_state: string | null
          footer_cta_enabled: boolean | null
          footer_cta_link: string | null
          footer_cta_text: string | null
          footer_cta_type: string | null
          footer_description: string | null
          footer_links: Json | null
          footer_show_social: boolean | null
          footer_show_trust_badges: boolean | null
          footer_social_facebook: string | null
          footer_social_instagram: string | null
          footer_social_tiktok: string | null
          footer_social_youtube: string | null
          footer_trust_badges: Json | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          id: string | null
          installment_enabled: boolean | null
          installment_max_without_interest: number | null
          installment_min_value: number | null
          installment_with_interest_enabled: boolean | null
          installment_with_interest_max: number | null
          installment_with_interest_rate: number | null
          layout_template: string | null
          logo_size: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          mobile_fixed_cta: boolean | null
          pix_discount_percent: number | null
          pix_enabled: boolean | null
          pix_label: string | null
          primary_color: string | null
          product_cta_text: string | null
          product_cta_type: string | null
          product_faq: Json | null
          secondary_color: string | null
          show_benefits_bar: boolean | null
          show_descriptions: boolean | null
          show_prices: boolean | null
          show_product_faq: boolean | null
          show_stock_status: boolean | null
          show_trust_badges: boolean | null
          store_name: string | null
          tenant_id: string | null
          tiktok_pixel_id: string | null
          tracking_pixels_enabled: boolean | null
        }
        Insert: {
          accent_color?: string | null
          benefit_delivery_text?: string | null
          benefit_installment_text?: string | null
          benefit_shipping_text?: string | null
          benefit_warranty_text?: string | null
          boleto_discount_percent?: number | null
          boleto_enabled?: boolean | null
          business_address?: string | null
          business_hours?: Json | null
          button_style?: string | null
          catalog_columns_desktop?: number | null
          catalog_columns_mobile?: number | null
          catalog_default_sort?: string | null
          debit_card_discount_percent?: number | null
          debit_card_enabled?: boolean | null
          enable_catalog_filters?: boolean | null
          favicon_url?: string | null
          financing_enabled?: boolean | null
          financing_label?: string | null
          financing_max_installments?: number | null
          financing_simulator_enabled?: boolean | null
          financing_simulator_title?: string | null
          font_family?: string | null
          footer_city_state?: string | null
          footer_cta_enabled?: boolean | null
          footer_cta_link?: string | null
          footer_cta_text?: string | null
          footer_cta_type?: string | null
          footer_description?: string | null
          footer_links?: Json | null
          footer_show_social?: boolean | null
          footer_show_trust_badges?: boolean | null
          footer_social_facebook?: string | null
          footer_social_instagram?: string | null
          footer_social_tiktok?: string | null
          footer_social_youtube?: string | null
          footer_trust_badges?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string | null
          installment_enabled?: boolean | null
          installment_max_without_interest?: number | null
          installment_min_value?: number | null
          installment_with_interest_enabled?: boolean | null
          installment_with_interest_max?: number | null
          installment_with_interest_rate?: number | null
          layout_template?: string | null
          logo_size?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          mobile_fixed_cta?: boolean | null
          pix_discount_percent?: number | null
          pix_enabled?: boolean | null
          pix_label?: string | null
          primary_color?: string | null
          product_cta_text?: string | null
          product_cta_type?: string | null
          product_faq?: Json | null
          secondary_color?: string | null
          show_benefits_bar?: boolean | null
          show_descriptions?: boolean | null
          show_prices?: boolean | null
          show_product_faq?: boolean | null
          show_stock_status?: boolean | null
          show_trust_badges?: boolean | null
          store_name?: string | null
          tenant_id?: string | null
          tiktok_pixel_id?: string | null
          tracking_pixels_enabled?: boolean | null
        }
        Update: {
          accent_color?: string | null
          benefit_delivery_text?: string | null
          benefit_installment_text?: string | null
          benefit_shipping_text?: string | null
          benefit_warranty_text?: string | null
          boleto_discount_percent?: number | null
          boleto_enabled?: boolean | null
          business_address?: string | null
          business_hours?: Json | null
          button_style?: string | null
          catalog_columns_desktop?: number | null
          catalog_columns_mobile?: number | null
          catalog_default_sort?: string | null
          debit_card_discount_percent?: number | null
          debit_card_enabled?: boolean | null
          enable_catalog_filters?: boolean | null
          favicon_url?: string | null
          financing_enabled?: boolean | null
          financing_label?: string | null
          financing_max_installments?: number | null
          financing_simulator_enabled?: boolean | null
          financing_simulator_title?: string | null
          font_family?: string | null
          footer_city_state?: string | null
          footer_cta_enabled?: boolean | null
          footer_cta_link?: string | null
          footer_cta_text?: string | null
          footer_cta_type?: string | null
          footer_description?: string | null
          footer_links?: Json | null
          footer_show_social?: boolean | null
          footer_show_trust_badges?: boolean | null
          footer_social_facebook?: string | null
          footer_social_instagram?: string | null
          footer_social_tiktok?: string | null
          footer_social_youtube?: string | null
          footer_trust_badges?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string | null
          installment_enabled?: boolean | null
          installment_max_without_interest?: number | null
          installment_min_value?: number | null
          installment_with_interest_enabled?: boolean | null
          installment_with_interest_max?: number | null
          installment_with_interest_rate?: number | null
          layout_template?: string | null
          logo_size?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          mobile_fixed_cta?: boolean | null
          pix_discount_percent?: number | null
          pix_enabled?: boolean | null
          pix_label?: string | null
          primary_color?: string | null
          product_cta_text?: string | null
          product_cta_type?: string | null
          product_faq?: Json | null
          secondary_color?: string | null
          show_benefits_bar?: boolean | null
          show_descriptions?: boolean | null
          show_prices?: boolean | null
          show_product_faq?: boolean | null
          show_stock_status?: boolean | null
          show_trust_badges?: boolean | null
          store_name?: string | null
          tenant_id?: string | null
          tiktok_pixel_id?: string | null
          tracking_pixels_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ecommerce_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      uoclub_executive_metrics: {
        Row: {
          accounts_count: number | null
          cashback_issued_brl: number | null
          cashback_redeemed_brl: number | null
          open_liability_brl: number | null
          program_id: string | null
          redemptions_count: number | null
          reserved_liability_brl: number | null
          tenant_id: string | null
        }
        Relationships: []
      }
      v_ai_diagnostics: {
        Row: {
          avg_confidence: number | null
          avg_latency_ms: number | null
          day: string | null
          escalations_count: number | null
          model: string | null
          objections_count: number | null
          tenant_id: string | null
          total_calls: number | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_orchestration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      v_ai_escalation_rates: {
        Row: {
          day: string | null
          layer_1_calls: number | null
          layer_2_calls: number | null
          layer_2_rate: number | null
          layer_3_calls: number | null
          layer_3_rate: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      v_ai_model_summary: {
        Row: {
          avg_confidence: number | null
          avg_latency_ms: number | null
          first_call: string | null
          last_call: string | null
          model: string | null
          total_calls: number | null
          total_cost_usd: number | null
          total_tokens: number | null
          unique_tenants: number | null
        }
        Relationships: []
      }
      v_effective_ai_config: {
        Row: {
          active_mode: string | null
          agent_modes: Json | null
          aggression_level: string | null
          ai_enabled: boolean | null
          ai_model_provider: string | null
          allowed_modes: string[] | null
          auto_transfer_triggers: string[] | null
          autonomy_profile: string | null
          catalog_access: boolean | null
          custom_layer_1_model: string | null
          custom_layer_2_model: string | null
          custom_layer_3_model: string | null
          escalation_rules: Json | null
          flow_fallback_to_rotation: boolean | null
          flow_integration_enabled: boolean | null
          flow_notify_on_fallback: boolean | null
          followup_interval_minutes: number | null
          greeting: string | null
          human_delay_enabled: boolean | null
          knowledge_base: string[] | null
          max_delay_seconds: number | null
          max_followups: number | null
          max_interactions: number | null
          min_delay_seconds: number | null
          minimum_price_triggers: string[] | null
          mode_switch_rules: Json | null
          orchestrator_config: Json | null
          payment_config: Json | null
          personality: string | null
          scheduling_config: Json | null
          tenant_id: string | null
          tenant_name: string | null
          typing_indicator_enabled: boolean | null
          use_minimum_price_in_recovery: boolean | null
          working_hours: Json | null
        }
        Relationships: []
      }
      v_fallback_analysis: {
        Row: {
          day: string | null
          fallback_category: string | null
          fallback_reason: string | null
          occurrence_count: number | null
        }
        Relationships: []
      }
      v_tenant_ai_consumption: {
        Row: {
          avg_latency_ms: number | null
          credits_consumed: number | null
          last_ai_call: string | null
          tenant_id: string | null
          tenant_name: string | null
          total_ai_calls: number | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      v_tenant_template_info: {
        Row: {
          auto_sync_enabled: boolean | null
          last_synced_at: string | null
          last_synced_version: string | null
          local_overrides: Json | null
          subscribed_at: string | null
          subscription_id: string | null
          sync_mode: string | null
          sync_sections: string[] | null
          sync_status: string | null
          template_id: string | null
          template_name: string | null
          template_slug: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_status: string | null
          tenant_subdomain: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_template_subscriptions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "master_niche_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_template_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
    }
    Functions: {
      _log_order_history: {
        Args: {
          p_action: string
          p_actor_id: string
          p_after: Json
          p_before: Json
          p_session_id: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      _recalc_session_total: { Args: { p_session_id: string }; Returns: number }
      acquire_ai_proactive_lock: {
        Args: { p_conversation_id: string; p_lock_timestamp?: string }
        Returns: Json
      }
      admin_reset_all_user_credit_usage: {
        Args: {
          p_cycle?: string
          p_include_inactive?: boolean
          p_metadata?: Json
          p_reason: string
        }
        Returns: {
          credits_restored: number
          run_id: string
          users_restored: number
          users_scanned: number
        }[]
      }
      aggregate_rag_daily: { Args: never; Returns: undefined }
      anonymize_lead_data: {
        Args: { p_lead_id: string; p_reason?: string }
        Returns: undefined
      }
      apply_payment_transition: {
        Args: {
          p_event_id?: string
          p_next_status: Database["public"]["Enums"]["payment_status"]
          p_payment_id: string
          p_reason?: string
        }
        Returns: {
          account_id: string | null
          amount_cents: number
          boleto_barcode: string | null
          boleto_url: string | null
          checkout_url: string | null
          client_idempotency_key: string | null
          conversation_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          description: string | null
          expires_at: string | null
          external_id: string | null
          external_reference: string | null
          fingerprint: string | null
          gateway_fee_cents: number
          id: string
          installments: number
          internal_status: string | null
          last_reconciled_at: string | null
          lead_id: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"]
          net_amount_cents: number | null
          origin: Database["public"]["Enums"]["payment_origin"]
          paid_at: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          provider_account_snapshot: Json
          provider_id: string
          raw_response: Json | null
          reconciliation_attempts: number
          refunded_amount_cents: number
          refunded_at: string | null
          sent_at: string | null
          sent_via: string | null
          status: Database["public"]["Enums"]["payment_status"]
          status_reason: string | null
          subject_type: Database["public"]["Enums"]["payment_subject_type"]
          tenant_id: string
          updated_at: string
          user_id: string | null
          webhook_received_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_plan_defaults: {
        Args: {
          p_plan_type: Database["public"]["Enums"]["plan_type"]
          p_tenant_id: string
        }
        Returns: undefined
      }
      apply_user_credit_adjustment: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_metadata?: Json
          p_origin?: string
          p_reason: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: {
          credits_limit: number
          credits_remaining: number
          error_message: string
          success: boolean
        }[]
      }
      archive_lead: {
        Args: { p_lead_id: string; p_reason?: string }
        Returns: undefined
      }
      audit_user_credit_usage: {
        Args: { p_cycle?: string; p_user_id: string }
        Returns: {
          ai_model: string
          classification: string
          conversation_id: string
          created_at: string
          credits_consumed: number
          event_id: string
          event_type: string
          lead_id: string
          reason: string
        }[]
      }
      auto_heal_model: {
        Args: { p_model_id: string; p_reason?: string }
        Returns: undefined
      }
      calculate_credits_from_cost: {
        Args: { cost_brl: number }
        Returns: number
      }
      calculate_tenant_usage: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      can_view_wholesale_prices: { Args: never; Returns: boolean }
      capture_cart_lead:
        | {
            Args: {
              p_assigned_to?: string
              p_name: string
              p_phone: string
              p_product_interest: string
              p_source?: string
              p_tenant_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_assigned_to?: string
              p_name: string
              p_phone: string
              p_product_interest?: string
              p_source?: string
              p_tenant_id: string
            }
            Returns: string
          }
      capture_whatsapp_ops_snapshot: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      cci_classify: { Args: { p_lead_id: string }; Returns: undefined }
      cci_emit_signal: {
        Args: {
          p_kind: string
          p_lead_id: string
          p_payload?: Json
          p_tenant_id: string
          p_weight: number
        }
        Returns: undefined
      }
      check_copilot_daily_debit: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: boolean
      }
      check_credit_status: {
        Args: { p_tenant_id: string; p_user_id?: string }
        Returns: {
          can_use_layer1: boolean
          can_use_layer2: boolean
          can_use_layer3: boolean
          is_critical: boolean
          percent_used: number
          remaining: number
          status_message: string
          total_limit: number
          used: number
          zone: string
        }[]
      }
      check_instance_capacity: {
        Args: { p_instance_id: string }
        Returns: Json
      }
      check_rate_limit_fast: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      claim_ai_response_event: {
        Args: { p_message_id: string }
        Returns: string
      }
      claim_whatsapp_send_jobs: {
        Args: {
          p_limit?: number
          p_lock_ttl_seconds?: number
          p_worker_id?: string
        }
        Returns: {
          attempts: number
          conversation_id: string
          id: string
          instance_id: string
          items: Json
          lead_phone: string
          max_attempts: number
          progress: Json
          tenant_id: string
          user_id: string
        }[]
      }
      cleanup_old_data: { Args: never; Returns: Json }
      cleanup_ops_health_data: { Args: never; Returns: undefined }
      cleanup_store_events: { Args: never; Returns: Json }
      create_notification_if_enabled: {
        Args: {
          p_message: string
          p_reference_id?: string
          p_reference_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      current_credit_cycle_date: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      deactivate_ai_agent_completely: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      debit_ai_credits: {
        Args: {
          p_metadata?: Json
          p_operation_type: string
          p_tenant_id: string
          p_units?: number
          p_user_id: string
        }
        Returns: {
          can_transcribe: boolean
          can_use_layer_2: boolean
          can_use_layer_3: boolean
          credits_debited: number
          credits_limit: number
          credits_remaining: number
          error_message: string
          is_degraded: boolean
          success: boolean
          usage_percent: number
        }[]
      }
      debug_jwt_claims: { Args: never; Returns: Json }
      derive_funnel_stage_slug: { Args: { p_name: string }; Returns: string }
      elite_data_hygiene: { Args: never; Returns: undefined }
      enqueue_message: {
        Args: {
          p_campaign_id?: string
          p_conversation_id: string
          p_flow_id?: string
          p_lead_id: string
          p_media_urls?: string[]
          p_message_body: string
          p_message_data?: Json
          p_message_type: string
          p_priority?: string
          p_scheduled_for?: string
          p_tenant_id: string
          p_whatsapp_instance_id?: string
        }
        Returns: string
      }
      fn_cci_classify_single_lead: {
        Args: { p_lead_id: string }
        Returns: {
          score: number
          temperature: string
          zone: string
        }[]
      }
      fn_phone_variants: { Args: { p_phone: string }; Returns: string[] }
      gen_short_token: { Args: { len?: number }; Returns: string }
      get_active_alerts: {
        Args: { p_limit?: number; p_severity?: string; p_tenant_id?: string }
        Returns: Json
      }
      get_ai_performance_summary:
        | {
            Args: {
              p_assigned_to?: string
              p_end_date: string
              p_start_date: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_to?: string
              p_end_date?: string
              p_start_date?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_to?: string
              p_end: string
              p_start: string
              p_tenant_id: string
            }
            Returns: Json
          }
      get_alert_stats: { Args: never; Returns: Json }
      get_auth_tenant_id: { Args: never; Returns: string }
      get_best_send_time: {
        Args: { p_default_hour?: number; p_lead_id: string }
        Returns: Json
      }
      get_checkout_config: { Args: { p_tenant_id: string }; Returns: Json }
      get_effective_tenant_id: { Args: never; Returns: string }
      get_event_queue_stats: {
        Args: never
        Returns: {
          avg_processing_time_ms: number
          count: number
          status: string
        }[]
      }
      get_fallback_model: {
        Args: { p_failed_model: string; p_preferred_tier?: string }
        Returns: {
          display_name: string
          model_id: string
          provider: string
        }[]
      }
      get_global_credits_summary: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          period_end: string
          period_start: string
          total_api_calls: number
          total_cost_brl: number
          total_credits_consumed: number
          total_tenants_with_usage: number
        }[]
      }
      get_instance_token_direct: {
        Args: { p_instance_id: string; p_tenant_id?: string }
        Returns: string
      }
      get_jwt_role: { Args: never; Returns: string }
      get_jwt_tenant_id: { Args: never; Returns: string }
      get_latest_ops_snapshot: { Args: { p_tenant_id?: string }; Returns: Json }
      get_lead_interaction_stats: { Args: { p_lead_id: string }; Returns: Json }
      get_next_team_member: { Args: { p_team_id: string }; Returns: string }
      get_ops_snapshot_history: {
        Args: { p_hours?: number; p_tenant_id?: string }
        Returns: Json
      }
      get_pending_messages: {
        Args: { p_instance_id?: string; p_limit?: number }
        Returns: {
          attempt_count: number
          conversation_id: string
          id: string
          lead_id: string
          media_urls: string[]
          message_body: string
          message_data: Json
          message_type: string
          priority: string
          tenant_id: string
          whatsapp_instance_id: string
        }[]
      }
      get_product_with_wholesale: {
        Args: { p_id: string }
        Returns: {
          id: string
          name: string
          price: number
          wholesale_price: number
        }[]
      }
      get_public_banners: {
        Args: { p_tenant_id: string }
        Returns: {
          campaign_id: string
          cta_action: string
          cta_target: string
          cta_text: string
          headline: string
          id: string
          image_url: string
          mobile_image_url: string
          sort_order: number
          subheadline: string
        }[]
      }
      get_public_campaigns: {
        Args: { p_tenant_id: string }
        Returns: {
          banner_image_url: string
          banner_mobile_image_url: string
          category_ids: string[]
          description: string
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          name: string
          product_ids: string[]
          promotional_message: string
          slug: string
          starts_at: string
        }[]
      }
      get_public_catalog: {
        Args: { p_tenant_id: string }
        Returns: {
          category: string
          category_id: string
          compare_at_price: number
          created_at: string
          custom_fields: Json
          description: string
          display_size: string
          id: string
          images: string[]
          is_featured: boolean
          is_published: boolean
          item_type: string
          low_stock_alert: number
          name: string
          price: number
          price_max: number
          pricing_type: string
          status: string
          stock_quantity: number
          tenant_id: string
          track_stock: boolean
          updated_at: string
          wholesale_price: number
        }[]
      }
      get_public_catalog_v2: {
        Args: {
          p_category_id?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_search?: string
          p_sort?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_public_categories: { Args: { p_tenant_id: string }; Returns: Json }
      get_public_product: {
        Args: { p_product_id: string; p_tenant_id: string }
        Returns: Json
      }
      get_public_product_sections: {
        Args: { p_tenant_id: string }
        Returns: Json[]
      }
      get_public_promotional_bar: {
        Args: { p_tenant_id: string }
        Returns: {
          animation_type: string
          background_color: string
          id: string
          link_action: string
          link_target: string
          text: string
          text_color: string
        }[]
      }
      get_public_store_config: {
        Args: { p_tenant_id: string }
        Returns: Json[]
      }
      get_public_trust_badges: {
        Args: { p_tenant_id: string }
        Returns: {
          trust_badge_exchange_text: string
          trust_badge_original_text: string
          trust_badge_payment_text: string
          trust_badge_support_text: string
        }[]
      }
      get_public_video_products: {
        Args: { p_limit?: number; p_offset?: number; p_tenant_id: string }
        Returns: Json
      }
      get_queue_stats: { Args: { p_tenant_id: string }; Returns: Json }
      get_queue_trend: {
        Args: { p_hours?: number; p_tenant_id: string }
        Returns: {
          failed: number
          hour: string
          pending: number
          processing: number
          sent: number
        }[]
      }
      get_rag_daily_timeline: {
        Args: { p_days?: number; p_tenant_id?: string }
        Returns: Json
      }
      get_rag_quality_by_tenant: { Args: { p_days?: number }; Returns: Json }
      get_rag_quality_summary: {
        Args: { p_days?: number; p_tenant_id?: string }
        Returns: Json
      }
      get_report_period_summary:
        | {
            Args: {
              p_current_end: string
              p_current_start: string
              p_prev_end: string
              p_prev_start: string
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_current_end: string
              p_current_start: string
              p_prev_end: string
              p_prev_start: string
              p_tenant_id: string
            }
            Returns: Json
          }
      get_report_product_rankings:
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              conversion_rate: number
              product_id: string
              product_image: string
              product_name: string
              total_interests: number
              total_value: number
              won_deals: number
            }[]
          }
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              conversion_rate: number
              product_id: string
              product_image: string
              product_name: string
              total_interests: number
              total_value: number
              won_deals: number
            }[]
          }
      get_report_seller_rankings:
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              avg_ticket: number
              conversion_rate: number
              lost_leads: number
              seller_avatar: string
              seller_id: string
              seller_name: string
              total_leads: number
              total_value: number
              won_leads: number
            }[]
          }
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              avg_ticket: number
              conversion_rate: number
              lost_leads: number
              seller_avatar: string
              seller_id: string
              seller_name: string
              total_leads: number
              total_value: number
              won_leads: number
            }[]
          }
      get_report_source_analysis:
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              conversion_rate: number
              lost_leads: number
              percentage: number
              source: string
              total_leads: number
              total_value: number
              won_leads: number
            }[]
          }
        | {
            Args: { p_end: string; p_start: string; p_tenant_id: string }
            Returns: {
              conversion_rate: number
              lost_leads: number
              percentage: number
              source: string
              total_leads: number
              total_value: number
              won_leads: number
            }[]
          }
      get_resolved_alerts: {
        Args: {
          p_alert_type?: string
          p_limit?: number
          p_offset?: number
          p_tenant_id?: string
        }
        Returns: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json
          resolution_reason: string
          resolved_at: string
          resolved_by: string
          resolved_notes: string
          severity: string
          tenant_id: string
          title: string
          user_id: string
        }[]
      }
      get_rotation_sellers: { Args: { p_tenant_id: string }; Returns: string[] }
      get_tenant_credits_summary: {
        Args: { p_end?: string; p_start?: string; p_tenant_id: string }
        Returns: {
          period_end: string
          period_start: string
          total_api_calls: number
          total_cost_brl: number
          total_credits_consumed: number
          users_with_usage: number
        }[]
      }
      get_tenant_smart_timing_stats: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_user_credits: {
        Args: { p_end?: string; p_start?: string; p_tenant_id: string }
        Returns: {
          ai_tokens: number
          api_calls: number
          credits_consumed: number
          transcription_minutes: number
          user_id: string
          user_name: string
          user_role: string
        }[]
      }
      get_top_credit_consumers: {
        Args: { limit_count?: number; p_end?: string; p_start?: string }
        Returns: {
          api_calls: number
          cost_brl: number
          credits_consumed: number
          tenant_id: string
          tenant_name: string
        }[]
      }
      get_user_credits_summary: {
        Args: { user_id_param: string }
        Returns: {
          billing_period_start: string
          total_api_calls: number
          total_credits_consumed: number
          total_tokens: number
        }[]
      }
      get_user_effective_credit_base: {
        Args: { p_cycle?: string; p_user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: { p_user_id: string }; Returns: string }
      has_master_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_permission:
        | {
            Args: {
              _permission: Database["public"]["Enums"]["permission_type"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _permission: string; _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      hybrid_search_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_tenant_id: string
          query_embedding: string
          query_text: string
          rrf_k?: number
        }
        Returns: {
          category: string
          content: string
          id: string
          keyword_rank: number
          rrf_score: number
          similarity: number
          source: string
          title: string
        }[]
      }
      increment_chunks_received: {
        Args: { p_upload_id: string }
        Returns: undefined
      }
      increment_group_unread: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      increment_lead_memory_interactions: {
        Args: { p_lead_id: string }
        Returns: number
      }
      increment_user_ai_tokens: {
        Args: { _tokens: number; _user_id: string }
        Returns: undefined
      }
      increment_user_storage: {
        Args: { _bytes: number; _user_id: string }
        Returns: undefined
      }
      increment_webhook_config_submission: {
        Args: { p_config_id: string }
        Returns: undefined
      }
      is_in_support_session: {
        Args: { target_tenant: string }
        Returns: boolean
      }
      is_jwt_admin: { Args: never; Returns: boolean }
      is_jwt_master: { Args: never; Returns: boolean }
      is_master_tenant: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      list_tenant_user_credit_balances: {
        Args: { p_cycle?: string; p_tenant_id: string }
        Returns: {
          base_credits: number
          email: string
          extra_credits: number
          full_name: string
          is_active: boolean
          remaining_credits: number
          role: string
          suspicious_credits: number
          suspicious_events: number
          used_credits: number
          user_id: string
        }[]
      }
      log_audit: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type: string
          _ip_address?: unknown
          _new_values?: Json
          _old_values?: Json
          _tenant_id: string
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      log_flow_execution: {
        Args: {
          p_conversation_id?: string
          p_data_received?: Json
          p_data_sent?: Json
          p_duration_ms?: number
          p_error_message?: string
          p_event_type: string
          p_flow_id: string
          p_lead_id: string
          p_status: string
          p_step_id: string
          p_step_name: string
          p_tenant_id: string
          p_whatsapp_instance_id?: string
        }
        Returns: string
      }
      log_message_trigger_error: {
        Args: {
          p_conversation_id: string
          p_error_message: string
          p_external_message_id: string
          p_function_name: string
          p_message_id: string
          p_operation: string
          p_payload?: Json
          p_sqlstate: string
          p_tenant_id: string
          p_trigger_name: string
        }
        Returns: undefined
      }
      login_public_customer: {
        Args: { p_email: string; p_tenant_id: string }
        Returns: Json
      }
      match_knowledge: {
        Args: {
          filter_tenant_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      match_knowledge_with_master: {
        Args: {
          filter_tenant_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          source_type: string
          title: string
        }[]
      }
      match_uopa_context: {
        Args: {
          filter_tenant_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          similarity: number
          type: string
        }[]
      }
      purchase_user_credits: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_metadata?: Json
          p_origin?: string
          p_package_name: string
          p_price_cents: number
          p_tenant_id: string
          p_user_id: string
        }
        Returns: {
          credits_added: number
          credits_limit: number
          credits_remaining: number
          error_message: string
          success: boolean
          transaction_id: string
        }[]
      }
      rebuild_all_credit_projections: {
        Args: { p_cycle?: string }
        Returns: undefined
      }
      rebuild_tenant_credit_projection: {
        Args: { p_cycle?: string; p_tenant_id: string }
        Returns: undefined
      }
      rebuild_user_credit_projection: {
        Args: { p_cycle?: string; p_user_id: string }
        Returns: undefined
      }
      recalculate_all_tenant_usage: { Args: never; Returns: undefined }
      recalculate_tenant_usage: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      record_lead_interaction: {
        Args: {
          p_lead_id: string
          p_message_received_at?: string
          p_response_time_ms?: number
          p_tenant_id: string
        }
        Returns: undefined
      }
      record_model_health: {
        Args: {
          p_error_message?: string
          p_is_healthy: boolean
          p_model_id: string
        }
        Returns: undefined
      }
      register_public_customer: {
        Args: {
          p_company_name?: string
          p_email: string
          p_name: string
          p_phone?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      release_ai_proactive_lock: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      replay_quarantine_events_list: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          event_id: string
          event_type: string
          instance_id: string
          quarantine_reason: string
          raw_payload: Json
          resolution_attempts: number
          resolved_by: string
          tenant_id: string
        }[]
      }
      requeue_stuck_processing_events: {
        Args: { p_limit?: number; p_timeout_minutes?: number }
        Returns: {
          created_at: string
          event_type: string
          id: string
          max_retries: number
          recovered_status: string
          retry_count: number
          started_at: string
          tenant_id: string
        }[]
      }
      requeue_stuck_processing_messages: {
        Args: {
          p_limit?: number
          p_tenant_id?: string
          p_timeout_minutes?: number
        }
        Returns: {
          created_at: string
          id: string
          processing_started_at: string
          tenant_id: string
        }[]
      }
      reset_monthly_usage: { Args: never; Returns: undefined }
      resolve_master_alert:
        | { Args: { p_alert_id: string; p_user_id?: string }; Returns: boolean }
        | {
            Args: {
              p_alert_id: string
              p_notes?: string
              p_reason?: string
              p_user_id?: string
            }
            Returns: boolean
          }
      resolve_whatsapp_instance_by_signals: {
        Args: {
          p_instance_name: string
          p_owner: string
          p_persisted_instance_id: string
          p_phone: string
          p_webhook_token: string
        }
        Returns: {
          error_reason: string
          instance_id: string
          is_strong_signal: boolean
          resolved_by: string
          signals_used: Json
          tenant_id: string
        }[]
      }
      respond_to_invite: {
        Args: { p_accept: boolean; p_invite_id: string }
        Returns: undefined
      }
      restore_lead: { Args: { p_lead_id: string }; Returns: undefined }
      retry_failed_messages: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: number
      }
      rollover_credit_cycles: {
        Args: { p_new_cycle: string; p_previous_cycle: string }
        Returns: undefined
      }
      rpc_add_store_order_note: {
        Args: { p_note: string; p_token: string }
        Returns: Json
      }
      rpc_adjust_store_order_totals: {
        Args: {
          p_discount_cents?: number
          p_extra_fee_cents?: number
          p_shipping_cents?: number
          p_token: string
        }
        Returns: Json
      }
      rpc_batch_engagement_scores: {
        Args: { p_lead_ids: string[] }
        Returns: {
          lead_id: string
          level: string
          score: number
        }[]
      }
      rpc_cci_classify: {
        Args: { p_tenant_id: string }
        Returns: {
          ai_closing_attempted: boolean
          ai_objection_handled: boolean
          awaiting_response: boolean
          best_contact_hour: number
          conv_status: string
          deal_won_count: number
          factors: Json
          has_active_checkout: boolean
          has_conversation: boolean
          has_paid_payment: boolean
          has_pending_payment: boolean
          has_pending_task: boolean
          hours_since_lead_msg: number
          human_response_delay_minutes: number
          is_rotation_stagnant: boolean
          last_campaign_replied_at: string
          last_store_visit_at: string
          lead_id: string
          message_count: number
          score: number
          stage_sort_order: number
          temperature: string
          tenant_credits: number
          total_ltv: number
          unread_count: number
          urgency_level: string
          win_probability: number
          zone: string
        }[]
      }
      rpc_get_store_order: {
        Args: { p_tenant_id: string; p_token: string }
        Returns: Json
      }
      rpc_get_store_order_notes_and_history: {
        Args: { p_token: string }
        Returns: Json
      }
      rpc_lead_board: {
        Args: {
          p_birth_month_filter?: string
          p_city_filter?: string
          p_date_from?: string
          p_date_to?: string
          p_funnel_id?: string
          p_limit_per_stage?: number
          p_quick_filter?: string
          p_search?: string
          p_seller_filter?: string
          p_source_filter?: string
          p_stage_filter?: string
          p_tag_filter?: string[]
          p_temperature_filter?: string
          p_tenant_id: string
        }
        Returns: {
          cold_count: number
          hot_count: number
          leads: Json
          on_fire_count: number
          quick_all_count: number
          quick_forgotten_count: number
          stage_id: string
          stage_slug: string
          total_count: number
          total_value: number
          warm_count: number
        }[]
      }
      rpc_lead_stage_page: {
        Args: {
          p_birth_month_filter?: string
          p_city_filter?: string
          p_date_from?: string
          p_date_to?: string
          p_funnel_id?: string
          p_limit?: number
          p_offset?: number
          p_quick_filter?: string
          p_search?: string
          p_seller_filter?: string
          p_source_filter?: string
          p_stage_filter?: string
          p_stage_id: string
          p_tag_filter?: string[]
          p_temperature_filter?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      rpc_list_store_orders: {
        Args: {
          p_assigned_to?: string
          p_end?: string
          p_fulfillments?: string[]
          p_limit?: number
          p_offset?: number
          p_only_identified?: boolean
          p_search?: string
          p_seller_id?: string
          p_start?: string
          p_statuses?: string[]
          p_tenant_id: string
        }
        Returns: Json
      }
      rpc_mark_store_order_paid: {
        Args: {
          p_force_seller?: boolean
          p_method: string
          p_paid_amount_cents?: number
          p_seller_id_override?: string
          p_token: string
        }
        Returns: Json
      }
      rpc_open_store_checkout_session: {
        Args: {
          p_ad_referral?: Json
          p_items?: Json
          p_seller_id?: string
          p_session_id?: string
          p_target_phone?: string
          p_target_source?: string
          p_tenant_id: string
          p_total_cents?: number
          p_utm?: Json
          p_visitor_id: string
        }
        Returns: Json
      }
      rpc_preview_store_order_payment: {
        Args: { p_token: string }
        Returns: Json
      }
      rpc_restore_customer_cart: {
        Args: { p_customer_email: string; p_tenant_id: string }
        Returns: Json
      }
      rpc_track_store_event: {
        Args: {
          p_ad_referral?: Json
          p_checkout_token?: string
          p_country?: string
          p_device_type?: string
          p_event_type: string
          p_ip_hash?: string
          p_is_bot?: boolean
          p_item_count?: number
          p_page_path?: string
          p_payload?: Json
          p_product_id?: string
          p_referrer?: string
          p_seller_id?: string
          p_session_id?: string
          p_tenant_id: string
          p_user_agent_short?: string
          p_utm?: Json
          p_value_cents?: number
          p_visitor_id?: string
        }
        Returns: string
      }
      rpc_unmark_store_order_paid: { Args: { p_token: string }; Returns: Json }
      rpc_update_store_order_fulfillment:
        | {
            Args: {
              p_assigned_to?: string
              p_clear_assignee?: boolean
              p_fulfillment_status?: string
              p_internal_note?: string
              p_tenant_id: string
              p_token: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_to?: string
              p_clear_assignee?: boolean
              p_fulfillment_status?: string
              p_internal_note?: string
              p_shipping_carrier?: string
              p_shipping_tracking_code?: string
              p_shipping_tracking_url?: string
              p_tenant_id: string
              p_token: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_to?: string
              p_cancel?: boolean
              p_clear_assignee?: boolean
              p_fulfillment_status?: string
              p_internal_note?: string
              p_shipping_address?: Json
              p_shipping_carrier?: string
              p_shipping_tracking_code?: string
              p_shipping_tracking_url?: string
              p_tenant_id: string
              p_token: string
            }
            Returns: Json
          }
      rpc_update_store_order_items: {
        Args: { p_items: Json; p_token: string }
        Returns: Json
      }
      rpc_upsert_store_cart:
        | {
            Args: {
              p_ad_referral?: Json
              p_customer_name?: string
              p_customer_phone?: string
              p_existing_token?: string
              p_items?: Json
              p_seller_id?: string
              p_session_id?: string
              p_target_phone?: string
              p_target_source?: string
              p_tenant_id: string
              p_total_cents?: number
              p_utm?: Json
              p_visitor_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ad_referral?: Json
              p_customer_email?: string
              p_customer_name?: string
              p_customer_phone?: string
              p_existing_token?: string
              p_items?: Json
              p_seller_id?: string
              p_session_id?: string
              p_target_phone?: string
              p_target_source?: string
              p_tenant_id: string
              p_total_cents?: number
              p_utm?: Json
              p_visitor_id: string
            }
            Returns: Json
          }
      run_whatsapp_inbound_integrity_monitor: {
        Args: { p_window_minutes?: number }
        Returns: Json
      }
      run_whatsapp_ops_monitor: {
        Args: { p_tenant_id?: string }
        Returns: Json
      }
      search_products_fuzzy: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_query: string
          p_tenant_id: string
        }
        Returns: {
          ai_can_use_minimum_price: boolean
          category: string
          custom_fields: Json
          description: string
          id: string
          images: string[]
          is_published: boolean
          minimum_price: number
          name: string
          price: number
          price_max: number
          pricing_type: string
          similarity_score: number
          status: string
          stock_quantity: number
          track_stock: boolean
          wholesale_price: number
        }[]
      }
      search_vehicles_smart: {
        Args: { p_limit?: number; p_query: string; p_tenant_id: string }
        Returns: {
          ano_modelo: string
          categoria: string
          cor: string
          dias_no_patio: number
          extras: Json
          fipe_badge: string
          fipe_valor: number
          id: string
          km: number
          modelo: string
          placa: string
          preco_custo: number
          preco_venda: number
          similarity_score: number
        }[]
      }
      select_best_instance: {
        Args: { p_strategy?: string; p_tenant_id: string }
        Returns: string
      }
      should_notify: {
        Args: { p_notification_type: string; p_user_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      store_funnel_metrics: {
        Args: { p_end: string; p_start: string; p_tenant_id: string }
        Returns: Json
      }
      store_top_products: {
        Args: {
          p_end: string
          p_limit?: number
          p_start: string
          p_tenant_id: string
        }
        Returns: {
          add_to_cart: number
          checkouts: number
          product_id: string
          product_name: string
          views: number
        }[]
      }
      switch_tenant: { Args: { p_tenant_id: string }; Returns: undefined }
      sync_campaign_from_recipients: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      sync_campaign_recipient_from_queue: {
        Args: { p_recipient_id: string }
        Returns: undefined
      }
      sync_master_alert_state: {
        Args: {
          p_alert_type: string
          p_description: string
          p_metadata: Json
          p_severity: string
          p_tenant_id: string
          p_title: string
          p_triggered: boolean
        }
        Returns: undefined
      }
      transition_ai_conversation_state: {
        Args: {
          p_action: string
          p_activation?: Json
          p_assigned_to?: string
          p_conversation_id: string
          p_reason?: string
          p_summary?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      trigger_process_event_queue: { Args: never; Returns: undefined }
      try_lock_int: { Args: { key: number }; Returns: boolean }
      unaccent: { Args: { "": string }; Returns: string }
      uoclub_available_brl: { Args: { p_account_id: string }; Returns: number }
      uoclub_cancel_reservation: {
        Args: {
          p_metadata?: Json
          p_reason?: string
          p_reservation_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      uoclub_commit_reservation: {
        Args: {
          p_commit_ref?: string
          p_metadata?: Json
          p_reservation_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      uoclub_expire_reservations: { Args: { p_limit?: number }; Returns: Json }
      uoclub_internal_health: { Args: { p_tenant_id: string }; Returns: Json }
      uoclub_redeem_quote: {
        Args: {
          p_account_id: string
          p_order_amount_brl: number
          p_tenant_id: string
        }
        Returns: Json
      }
      uoclub_reserve_cashback: {
        Args: {
          p_account_id: string
          p_idempotency_key: string
          p_metadata?: Json
          p_order_amount_brl: number
          p_order_ref: string
          p_redeem_brl: number
          p_source?: string
          p_tenant_id: string
          p_ttl_minutes?: number
        }
        Returns: Json
      }
      uoclub_seed_defaults: { Args: { p_tenant_id: string }; Returns: string }
      update_message_status: {
        Args: {
          p_error_message?: string
          p_message_id: string
          p_status: string
        }
        Returns: Json
      }
      upsert_user_credit_setting: {
        Args: {
          p_effective_from?: string
          p_effective_to?: string
          p_metadata?: Json
          p_monthly_credits_base: number
          p_notes?: string
          p_origin?: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: string
      }
      user_can_access_group: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      user_can_access_lead_via_conversation: {
        Args: { target_lead_id: string }
        Returns: boolean
      }
      validate_beta_recharge: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: {
          can_recharge: boolean
          reason: string
        }[]
      }
      verify_ai_import_cron_secret: {
        Args: { provided_secret: string }
        Returns: boolean
      }
    }
    Enums: {
      ab_test_status: "running" | "finished" | "archived"
      ab_test_type: "message_body" | "media" | "cta" | "timing"
      ab_test_winner: "a" | "b" | "tie"
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "viewer"
        | "moderator"
        | "seller"
        | "user"
      campaign_channel: "whatsapp" | "email" | "sms"
      campaign_objective:
        | "promotion"
        | "notification"
        | "reactivation"
        | "custom"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "paused"
        | "completed"
        | "cancelled"
      onboarding_status:
        | "pending"
        | "configuring"
        | "whatsapp_connected"
        | "training_done"
        | "go_live"
      payment_method:
        | "pix"
        | "credit_card"
        | "debit_card"
        | "boleto"
        | "link"
        | "wallet"
      payment_origin: "store" | "crm" | "api" | "recovery"
      payment_status:
        | "pending"
        | "processing"
        | "authorized"
        | "paid"
        | "failed"
        | "expired"
        | "refunded"
        | "partially_refunded"
        | "cancelled"
        | "disputed"
      payment_subject_type: "lead" | "customer" | "anonymous"
      permission_type:
        | "manage_team"
        | "manage_products"
        | "manage_leads"
        | "manage_ai_config"
        | "view_reports"
        | "send_messages"
        | "manage_integrations"
        | "manage_store"
        | "add_products"
        | "edit_product_media"
        | "edit_product_status"
        | "edit_product_prices"
        | "delete_products"
        | "view_all_leads"
        | "view_all_conversations"
        | "manage_quick_replies"
        | "manage_campaigns"
        | "manage_flows"
        | "access_admin_panel"
        | "edit_product_details"
        | "view_minimum_price"
        | "move_lead_stage"
        | "move_lead_funnel"
        | "resolve_lead"
        | "delete_leads"
        | "manage_tags"
        | "export_data"
        | "manage_inventory"
        | "adjust_stock"
        | "manage_rotation"
        | "manage_funnels"
        | "manage_channels"
        | "manage_goals"
        | "manage_notifications"
        | "activate_ai_agent"
        | "manage_content"
        | "manage_tasks"
        | "view_tasks"
        | "manage_wholesale"
        | "manage_billing"
        | "manage_branding"
        | "view_audit_logs"
      plan_type: "trial" | "basic" | "pro" | "enterprise"
      recipient_status:
        | "pending"
        | "sent"
        | "delivered"
        | "read"
        | "replied"
        | "failed"
        | "queued"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_recurrence: "none" | "daily" | "weekly" | "monthly"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      uoclub_sale_origin:
        | "storefront"
        | "whatsapp_confirmed"
        | "pdv_api"
        | "csv_import"
        | "manual"
      uoclub_trigger_event:
        | "sale_registered"
        | "points_credited"
        | "points_expiring"
        | "points_expired"
        | "tier_up"
        | "tier_down"
        | "referral_completed"
        | "nps_request"
        | "nps_promoter"
        | "nps_detractor"
        | "review_published"
        | "redemption_done"
        | "welcome"
        | "earn"
        | "redeem"
        | "expire_warning"
      uoclub_tx_type:
        | "earn"
        | "redeem"
        | "expire"
        | "adjust"
        | "referral_bonus"
        | "nps_bonus"
        | "review_bonus"
      user_status: "online" | "away" | "timed_break"
      webhook_event_status:
        | "PENDING"
        | "PROCESSED"
        | "FAILED"
        | "IGNORED"
        | "QUARANTINED"
        | "EXHAUSTED"
        | "PROCESSING"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ab_test_status: ["running", "finished", "archived"],
      ab_test_type: ["message_body", "media", "cta", "timing"],
      ab_test_winner: ["a", "b", "tie"],
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "viewer",
        "moderator",
        "seller",
        "user",
      ],
      campaign_channel: ["whatsapp", "email", "sms"],
      campaign_objective: [
        "promotion",
        "notification",
        "reactivation",
        "custom",
      ],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "paused",
        "completed",
        "cancelled",
      ],
      onboarding_status: [
        "pending",
        "configuring",
        "whatsapp_connected",
        "training_done",
        "go_live",
      ],
      payment_method: [
        "pix",
        "credit_card",
        "debit_card",
        "boleto",
        "link",
        "wallet",
      ],
      payment_origin: ["store", "crm", "api", "recovery"],
      payment_status: [
        "pending",
        "processing",
        "authorized",
        "paid",
        "failed",
        "expired",
        "refunded",
        "partially_refunded",
        "cancelled",
        "disputed",
      ],
      payment_subject_type: ["lead", "customer", "anonymous"],
      permission_type: [
        "manage_team",
        "manage_products",
        "manage_leads",
        "manage_ai_config",
        "view_reports",
        "send_messages",
        "manage_integrations",
        "manage_store",
        "add_products",
        "edit_product_media",
        "edit_product_status",
        "edit_product_prices",
        "delete_products",
        "view_all_leads",
        "view_all_conversations",
        "manage_quick_replies",
        "manage_campaigns",
        "manage_flows",
        "access_admin_panel",
        "edit_product_details",
        "view_minimum_price",
        "move_lead_stage",
        "move_lead_funnel",
        "resolve_lead",
        "delete_leads",
        "manage_tags",
        "export_data",
        "manage_inventory",
        "adjust_stock",
        "manage_rotation",
        "manage_funnels",
        "manage_channels",
        "manage_goals",
        "manage_notifications",
        "activate_ai_agent",
        "manage_content",
        "manage_tasks",
        "view_tasks",
        "manage_wholesale",
        "manage_billing",
        "manage_branding",
        "view_audit_logs",
      ],
      plan_type: ["trial", "basic", "pro", "enterprise"],
      recipient_status: [
        "pending",
        "sent",
        "delivered",
        "read",
        "replied",
        "failed",
        "queued",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_recurrence: ["none", "daily", "weekly", "monthly"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      uoclub_sale_origin: [
        "storefront",
        "whatsapp_confirmed",
        "pdv_api",
        "csv_import",
        "manual",
      ],
      uoclub_trigger_event: [
        "sale_registered",
        "points_credited",
        "points_expiring",
        "points_expired",
        "tier_up",
        "tier_down",
        "referral_completed",
        "nps_request",
        "nps_promoter",
        "nps_detractor",
        "review_published",
        "redemption_done",
        "welcome",
        "earn",
        "redeem",
        "expire_warning",
      ],
      uoclub_tx_type: [
        "earn",
        "redeem",
        "expire",
        "adjust",
        "referral_bonus",
        "nps_bonus",
        "review_bonus",
      ],
      user_status: ["online", "away", "timed_break"],
      webhook_event_status: [
        "PENDING",
        "PROCESSED",
        "FAILED",
        "IGNORED",
        "QUARANTINED",
        "EXHAUSTED",
        "PROCESSING",
      ],
    },
  },
} as const

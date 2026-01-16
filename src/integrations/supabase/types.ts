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
      ai_agent_config: {
        Row: {
          active_mode: string | null
          agent_modes: Json | null
          aggression_level: string | null
          ai_model_provider: string | null
          allowed_modes: string[] | null
          auto_activate: boolean | null
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
          human_delay_enabled: boolean | null
          id: string
          is_active: boolean | null
          is_enabled: boolean | null
          knowledge_base: string[] | null
          layer_1_model: string | null
          layer_2_model: string | null
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
          use_minimum_price_in_recovery: boolean | null
          working_hours: Json | null
        }
        Insert: {
          active_mode?: string | null
          agent_modes?: Json | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          allowed_modes?: string[] | null
          auto_activate?: boolean | null
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
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string[] | null
          layer_1_model?: string | null
          layer_2_model?: string | null
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
          use_minimum_price_in_recovery?: boolean | null
          working_hours?: Json | null
        }
        Update: {
          active_mode?: string | null
          agent_modes?: Json | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          allowed_modes?: string[] | null
          auto_activate?: boolean | null
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
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string[] | null
          layer_1_model?: string | null
          layer_2_model?: string | null
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
          use_minimum_price_in_recovery?: boolean | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_effective_ai_config"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ai_consumption"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      ai_available_models: {
        Row: {
          cost_per_1k_tokens: number | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          layer_category: string
          max_context_tokens: number | null
          model_id: string
          provider: string
        }
        Insert: {
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          layer_category: string
          max_context_tokens?: number | null
          model_id: string
          provider: string
        }
        Update: {
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          layer_category?: string
          max_context_tokens?: number | null
          model_id?: string
          provider?: string
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
      api_cost_config: {
        Row: {
          audio_cost_per_minute_usd: number | null
          created_at: string | null
          display_name: string | null
          id: string
          image_cost_per_unit_usd: number | null
          input_cost_per_1m_usd: number | null
          is_active: boolean | null
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
      api_usage_logs: {
        Row: {
          audio_seconds: number | null
          cost_brl: number | null
          cost_usd: number | null
          created_at: string | null
          credits_consumed: number | null
          error_message: string | null
          id: string
          image_count: number | null
          input_tokens: number | null
          latency_ms: number | null
          metadata: Json | null
          model: string
          operation: string
          output_tokens: number | null
          provider: string
          request_id: string | null
          success: boolean | null
          tenant_id: string
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          audio_seconds?: number | null
          cost_brl?: number | null
          cost_usd?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model: string
          operation?: string
          output_tokens?: number | null
          provider: string
          request_id?: string | null
          success?: boolean | null
          tenant_id: string
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          audio_seconds?: number | null
          cost_brl?: number | null
          cost_usd?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string
          operation?: string
          output_tokens?: number | null
          provider?: string
          request_id?: string | null
          success?: boolean | null
          tenant_id?: string
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
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
      automation_flows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          run_count: number | null
          steps: Json | null
          success_count: number | null
          tenant_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          steps?: Json | null
          success_count?: number | null
          tenant_id: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          steps?: Json | null
          success_count?: number | null
          tenant_id?: string
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
      campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          phone: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone?: string | null
          sent_at?: string | null
          status?: string | null
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
        ]
      }
      campaigns: {
        Row: {
          channel_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          id: string
          messages: Json | null
          metadata: Json | null
          name: string
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          total_recipients: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          total_recipients?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          total_recipients?: number | null
          type?: string | null
          updated_at?: string | null
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
        ]
      }
      conversation_conflicts: {
        Row: {
          conversation_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          original_user_id: string | null
          pending_user_id: string | null
          resolution_reason: string | null
          resolved_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_user_id?: string | null
          pending_user_id?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_user_id?: string | null
          pending_user_id?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_conflicts_conversation_id_fkey"
            columns: ["conversation_id"]
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
      conversations: {
        Row: {
          ai_allowed_modes: Json | null
          ai_collected_data: Json | null
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
          assigned_to: string | null
          broadcast_campaign_id: string | null
          context_summary: string | null
          created_at: string | null
          current_flow_execution_id: string | null
          deleted_at: string | null
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
          message_count_since_summary: number | null
          muted_until: string | null
          orchestrator_state: Json | null
          origin_instance_id: string | null
          previous_assignees: string[] | null
          qualification_data: Json | null
          qualification_status: string | null
          reassign_count: number | null
          resolution_notes: string | null
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_breached_at: string | null
          status: string | null
          tenant_id: string | null
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
          assigned_to?: string | null
          broadcast_campaign_id?: string | null
          context_summary?: string | null
          created_at?: string | null
          current_flow_execution_id?: string | null
          deleted_at?: string | null
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
          message_count_since_summary?: number | null
          muted_until?: string | null
          orchestrator_state?: Json | null
          origin_instance_id?: string | null
          previous_assignees?: string[] | null
          qualification_data?: Json | null
          qualification_status?: string | null
          reassign_count?: number | null
          resolution_notes?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          status?: string | null
          tenant_id?: string | null
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
          assigned_to?: string | null
          broadcast_campaign_id?: string | null
          context_summary?: string | null
          created_at?: string | null
          current_flow_execution_id?: string | null
          deleted_at?: string | null
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
          message_count_since_summary?: number | null
          muted_until?: string | null
          orchestrator_state?: Json | null
          origin_instance_id?: string | null
          previous_assignees?: string[] | null
          qualification_data?: Json | null
          qualification_status?: string | null
          reassign_count?: number | null
          resolution_notes?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          status?: string | null
          tenant_id?: string | null
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
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          price_brl: number
          status: string | null
          tenant_id: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          price_brl: number
          status?: string | null
          tenant_id?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          price_brl?: number
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
          business_address: string | null
          business_hours: Json | null
          created_at: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          store_name: string | null
          tenant_id: string
          updated_at: string | null
          welcome_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string | null
          business_address?: string | null
          business_hours?: Json | null
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          store_name?: string | null
          tenant_id: string
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string | null
          business_address?: string | null
          business_hours?: Json | null
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          store_name?: string | null
          tenant_id?: string
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
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
      event_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          priority: number
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          priority?: number
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          priority?: number
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
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
      flow_executions: {
        Row: {
          completed_at: string | null
          conversation_id: string | null
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
          conversation_id?: string | null
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
          conversation_id?: string | null
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
          id: string
          is_from_template: boolean | null
          keywords: string[] | null
          priority: number | null
          tenant_id: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          id?: string
          is_from_template?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          tenant_id?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          id?: string
          is_from_template?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          tenant_id?: string | null
          title?: string | null
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
      lead_memory: {
        Row: {
          communication_style: string | null
          conversation_summary: string | null
          id: string
          interests: string[] | null
          last_interaction_at: string | null
          lead_id: string
          metadata: Json | null
          pain_points: string[] | null
          tenant_id: string
          urgency_level: string | null
        }
        Insert: {
          communication_style?: string | null
          conversation_summary?: string | null
          id?: string
          interests?: string[] | null
          last_interaction_at?: string | null
          lead_id: string
          metadata?: Json | null
          pain_points?: string[] | null
          tenant_id: string
          urgency_level?: string | null
        }
        Update: {
          communication_style?: string | null
          conversation_summary?: string | null
          id?: string
          interests?: string[] | null
          last_interaction_at?: string | null
          lead_id?: string
          metadata?: Json | null
          pain_points?: string[] | null
          tenant_id?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          avatar: string | null
          birth_date: string | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          email: string | null
          funnel_id: string | null
          funnel_stage_id: string | null
          id: string
          import_campaign_id: string | null
          import_source: string | null
          meta_ads_referral: Json | null
          name: string | null
          phone: string
          product_id: string | null
          product_interest: string | null
          profile_data: Json | null
          source: string | null
          stage: string | null
          tags: string[] | null
          temperature: string | null
          tenant_id: string
          updated_at: string | null
          value: number | null
          whatsapp_about: string | null
          whatsapp_is_online: boolean | null
          whatsapp_last_seen: string | null
          whatsapp_profile_picture: string | null
          whatsapp_verified: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          avatar?: string | null
          birth_date?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          import_campaign_id?: string | null
          import_source?: string | null
          meta_ads_referral?: Json | null
          name?: string | null
          phone: string
          product_id?: string | null
          product_interest?: string | null
          profile_data?: Json | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          temperature?: string | null
          tenant_id: string
          updated_at?: string | null
          value?: number | null
          whatsapp_about?: string | null
          whatsapp_is_online?: boolean | null
          whatsapp_last_seen?: string | null
          whatsapp_profile_picture?: string | null
          whatsapp_verified?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          avatar?: string | null
          birth_date?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          funnel_id?: string | null
          funnel_stage_id?: string | null
          id?: string
          import_campaign_id?: string | null
          import_source?: string | null
          meta_ads_referral?: Json | null
          name?: string | null
          phone?: string
          product_id?: string | null
          product_interest?: string | null
          profile_data?: Json | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          temperature?: string | null
          tenant_id?: string
          updated_at?: string | null
          value?: number | null
          whatsapp_about?: string | null
          whatsapp_is_online?: boolean | null
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
      messages: {
        Row: {
          ai_confidence: number | null
          ai_metadata: Json | null
          attachments: Json | null
          audio_summary: string | null
          content: string | null
          conversation_id: string
          created_at: string | null
          external_message_id: string | null
          id: string
          is_from_lead: boolean | null
          metadata: Json | null
          reaction: string | null
          reply_to_id: string | null
          sent_by_ai: boolean | null
          status: string | null
          transcription: string | null
          transcription_status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          attachments?: Json | null
          audio_summary?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          is_from_lead?: boolean | null
          metadata?: Json | null
          reaction?: string | null
          reply_to_id?: string | null
          sent_by_ai?: boolean | null
          status?: string | null
          transcription?: string | null
          transcription_status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          attachments?: Json | null
          audio_summary?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          is_from_lead?: boolean | null
          metadata?: Json | null
          reaction?: string | null
          reply_to_id?: string | null
          sent_by_ai?: boolean | null
          status?: string | null
          transcription?: string | null
          transcription_status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
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
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read_at: string | null
          tenant_id: string
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          tenant_id: string
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          tenant_id?: string
          title?: string | null
          type?: string
          user_id?: string
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
          id: string
          is_from_template: boolean | null
          objection_type: string | null
          response_template: string | null
          tenant_id: string | null
          trigger_phrases: string[] | null
        }
        Insert: {
          id?: string
          is_from_template?: boolean | null
          objection_type?: string | null
          response_template?: string | null
          tenant_id?: string | null
          trigger_phrases?: string[] | null
        }
        Update: {
          id?: string
          is_from_template?: boolean | null
          objection_type?: string | null
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
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          status?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          status?: string | null
        }
        Relationships: []
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
      products: {
        Row: {
          ai_can_use_minimum_price: boolean | null
          category_id: string | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          display_size: string | null
          id: string
          image_url: string | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          minimum_price: number | null
          name: string
          price: number | null
          reserved_by: string | null
          seller_badge: string | null
          sku: string | null
          tenant_id: string
          updated_at: string | null
          visibility: string | null
          wholesale_price: number | null
        }
        Insert: {
          ai_can_use_minimum_price?: boolean | null
          category_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          display_size?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          minimum_price?: number | null
          name: string
          price?: number | null
          reserved_by?: string | null
          seller_badge?: string | null
          sku?: string | null
          tenant_id: string
          updated_at?: string | null
          visibility?: string | null
          wholesale_price?: number | null
        }
        Update: {
          ai_can_use_minimum_price?: boolean | null
          category_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          display_size?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          minimum_price?: number | null
          name?: string
          price?: number | null
          reserved_by?: string | null
          seller_badge?: string | null
          sku?: string | null
          tenant_id?: string
          updated_at?: string | null
          visibility?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
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
          avatar: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          last_assigned_at: string | null
          name: string | null
          notify_all_new_messages: boolean | null
          onboarding_completed_at: string | null
          participates_in_rotation: boolean | null
          pause_reason: string | null
          paused_at: string | null
          phone: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_profile_id?: string | null
          avatar?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_assigned_at?: string | null
          name?: string | null
          notify_all_new_messages?: boolean | null
          onboarding_completed_at?: string | null
          participates_in_rotation?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_profile_id?: string | null
          avatar?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_assigned_at?: string | null
          name?: string | null
          notify_all_new_messages?: boolean | null
          onboarding_completed_at?: string | null
          participates_in_rotation?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
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
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          device_token: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_push_received_at: string | null
          p256dh_key: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          device_token?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_push_received_at?: string | null
          p256dh_key: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          device_token?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_push_received_at?: string | null
          p256dh_key?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
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
      rotation_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_concurrent_leads: number | null
          priority: number | null
          specialties: string[] | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_leads?: number | null
          priority?: number | null
          specialties?: string[] | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_leads?: number | null
          priority?: number | null
          specialties?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
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
      sales_goals: {
        Row: {
          created_at: string | null
          current_count: number | null
          current_value: number | null
          id: string
          period_end: string
          period_start: string
          period_type: string
          target_count: number | null
          target_value: number
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          current_value?: number | null
          id?: string
          period_end: string
          period_start: string
          period_type?: string
          target_count?: number | null
          target_value?: number
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          current_value?: number | null
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          target_count?: number | null
          target_value?: number
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          lead_id: string | null
          priority: string | null
          reminder_before_days: number | null
          reminder_sent_at: string | null
          reminder_time_sent_at: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          reminder_before_days?: number | null
          reminder_sent_at?: string | null
          reminder_time_sent_at?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          reminder_before_days?: number | null
          reminder_sent_at?: string | null
          reminder_time_sent_at?: string | null
          status?: string | null
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
          ai_tokens_used: number | null
          api_calls: number | null
          campaign_messages_month: number | null
          created_at: string | null
          credits_consumed: number | null
          estimated_cost_brl: number | null
          id: string
          last_calculated_at: string | null
          leads_count: number | null
          messages_sent: number | null
          period_end: string
          period_start: string
          products_count: number | null
          storage_used_mb: number | null
          tenant_id: string
          transcription_seconds_month: number | null
          updated_at: string | null
          users_count: number | null
          whatsapp_instances_count: number | null
        }
        Insert: {
          active_users?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          campaign_messages_month?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          estimated_cost_brl?: number | null
          id?: string
          last_calculated_at?: string | null
          leads_count?: number | null
          messages_sent?: number | null
          period_end: string
          period_start: string
          products_count?: number | null
          storage_used_mb?: number | null
          tenant_id: string
          transcription_seconds_month?: number | null
          updated_at?: string | null
          users_count?: number | null
          whatsapp_instances_count?: number | null
        }
        Update: {
          active_users?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          campaign_messages_month?: number | null
          created_at?: string | null
          credits_consumed?: number | null
          estimated_cost_brl?: number | null
          id?: string
          last_calculated_at?: string | null
          leads_count?: number | null
          messages_sent?: number | null
          period_end?: string
          period_start?: string
          products_count?: number | null
          storage_used_mb?: number | null
          tenant_id?: string
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
          ai_token_limit: number | null
          api_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          channel_price: number | null
          config: Json | null
          contact_email: string | null
          contracted_users: number | null
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
          is_blocked: boolean | null
          lead_source: string | null
          limits_override: Json | null
          name: string
          plan_id: string | null
          plan_type: string | null
          price_per_user: number | null
          sales_rep_id: string | null
          status: string | null
          storage_limit_gb: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subdomain: string
          subscription_status: string | null
          trial_days: number | null
          trial_enabled: boolean | null
        }
        Insert: {
          ai_token_limit?: number | null
          api_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          channel_price?: number | null
          config?: Json | null
          contact_email?: string | null
          contracted_users?: number | null
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
          is_blocked?: boolean | null
          lead_source?: string | null
          limits_override?: Json | null
          name: string
          plan_id?: string | null
          plan_type?: string | null
          price_per_user?: number | null
          sales_rep_id?: string | null
          status?: string | null
          storage_limit_gb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain: string
          subscription_status?: string | null
          trial_days?: number | null
          trial_enabled?: boolean | null
        }
        Update: {
          ai_token_limit?: number | null
          api_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          channel_price?: number | null
          config?: Json | null
          contact_email?: string | null
          contracted_users?: number | null
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
          is_blocked?: boolean | null
          lead_source?: string | null
          limits_override?: Json | null
          name?: string
          plan_id?: string | null
          plan_type?: string | null
          price_per_user?: number | null
          sales_rep_id?: string | null
          status?: string | null
          storage_limit_gb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string
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
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
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
            isOneToOne: false
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
      webhook_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id?: string
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
          is_muted: boolean | null
          is_pinned: boolean | null
          jid: string
          last_sync_at: string | null
          owner: string | null
          participants: Json | null
          profile_picture: string | null
          restrict_send: boolean | null
          size: number | null
          subject: string | null
          tenant_id: string
          updated_at: string | null
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
          is_muted?: boolean | null
          is_pinned?: boolean | null
          jid: string
          last_sync_at?: string | null
          owner?: string | null
          participants?: Json | null
          profile_picture?: string | null
          restrict_send?: boolean | null
          size?: number | null
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
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
          is_muted?: boolean | null
          is_pinned?: boolean | null
          jid?: string
          last_sync_at?: string | null
          owner?: string | null
          participants?: Json | null
          profile_picture?: string | null
          restrict_send?: boolean | null
          size?: number | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
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
        ]
      }
      whatsapp_instances: {
        Row: {
          assigned_seller_id: string | null
          channel_status: string | null
          created_at: string | null
          daily_message_limit: number | null
          description: string | null
          display_name: string | null
          fixed_seller_id: string | null
          health_score: number | null
          id: string
          instance_id: string | null
          instance_token: string
          is_active: boolean | null
          is_primary: boolean | null
          last_connected_at: string | null
          last_health_check: string | null
          main_instance_id: string | null
          messages_sent_today: number | null
          name: string | null
          phone_number: string | null
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
          created_at?: string | null
          daily_message_limit?: number | null
          description?: string | null
          display_name?: string | null
          fixed_seller_id?: string | null
          health_score?: number | null
          id?: string
          instance_id?: string | null
          instance_token: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connected_at?: string | null
          last_health_check?: string | null
          main_instance_id?: string | null
          messages_sent_today?: number | null
          name?: string | null
          phone_number?: string | null
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
          created_at?: string | null
          daily_message_limit?: number | null
          description?: string | null
          display_name?: string | null
          fixed_seller_id?: string | null
          health_score?: number | null
          id?: string
          instance_id?: string | null
          instance_token?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connected_at?: string | null
          last_health_check?: string | null
          main_instance_id?: string | null
          messages_sent_today?: number | null
          name?: string | null
          phone_number?: string | null
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
        Relationships: []
      }
    }
    Views: {
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
          context_variables: Json | null
          effective_layer_1_model: string | null
          effective_layer_2_model: string | null
          effective_layer_3_model: string | null
          effective_system_prompt: string | null
          tenant_id: string | null
          tenant_name: string | null
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
      calculate_credits_from_cost: {
        Args: { cost_brl: number }
        Returns: number
      }
      calculate_tenant_usage: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      get_auth_tenant_id: { Args: never; Returns: string }
      get_instance_token_direct: {
        Args: { p_instance_id: string; p_tenant_id?: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_master_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
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
      increment_user_ai_tokens: {
        Args: { _tokens: number; _user_id: string }
        Returns: undefined
      }
      increment_user_storage: {
        Args: { _bytes: number; _user_id: string }
        Returns: undefined
      }
      is_master_tenant: { Args: never; Returns: boolean }
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
      reset_monthly_usage: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "manager" | "viewer"
      onboarding_status:
        | "pending"
        | "configuring"
        | "whatsapp_connected"
        | "training_done"
        | "go_live"
      permission_type:
        | "manage_team"
        | "manage_products"
        | "manage_leads"
        | "manage_ai_config"
        | "view_reports"
        | "send_messages"
        | "manage_integrations"
        | "manage_store"
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
      app_role: ["super_admin", "admin", "manager", "viewer"],
      onboarding_status: [
        "pending",
        "configuring",
        "whatsapp_connected",
        "training_done",
        "go_live",
      ],
      permission_type: [
        "manage_team",
        "manage_products",
        "manage_leads",
        "manage_ai_config",
        "view_reports",
        "send_messages",
        "manage_integrations",
        "manage_store",
      ],
    },
  },
} as const

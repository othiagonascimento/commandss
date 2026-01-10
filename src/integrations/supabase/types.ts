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
          aggression_level: string | null
          ai_model_provider: string | null
          created_at: string | null
          custom_layer_1_model: string | null
          custom_layer_2_model: string | null
          custom_layer_3_model: string | null
          custom_prompt_addendum: string | null
          enable_tri_modal: boolean | null
          enable_uopa_agent: boolean | null
          enable_vendedor_cloning: boolean | null
          followup_interval_minutes: number | null
          human_delay_enabled: boolean | null
          id: string
          is_active: boolean | null
          layer_1_model: string | null
          layer_2_model: string | null
          layer_3_model: string | null
          max_delay_seconds: number | null
          max_followups: number | null
          max_gpt4o_calls_per_day: number | null
          min_delay_seconds: number | null
          niche_category: string | null
          orchestration_rules: Json | null
          personality_prompt: string | null
          persuasion_level: number | null
          prohibited_phrases: string[] | null
          tenant_id: string | null
          tone_voice: string | null
          updated_at: string | null
        }
        Insert: {
          active_mode?: string | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          created_at?: string | null
          custom_layer_1_model?: string | null
          custom_layer_2_model?: string | null
          custom_layer_3_model?: string | null
          custom_prompt_addendum?: string | null
          enable_tri_modal?: boolean | null
          enable_uopa_agent?: boolean | null
          enable_vendedor_cloning?: boolean | null
          followup_interval_minutes?: number | null
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          layer_1_model?: string | null
          layer_2_model?: string | null
          layer_3_model?: string | null
          max_delay_seconds?: number | null
          max_followups?: number | null
          max_gpt4o_calls_per_day?: number | null
          min_delay_seconds?: number | null
          niche_category?: string | null
          orchestration_rules?: Json | null
          personality_prompt?: string | null
          persuasion_level?: number | null
          prohibited_phrases?: string[] | null
          tenant_id?: string | null
          tone_voice?: string | null
          updated_at?: string | null
        }
        Update: {
          active_mode?: string | null
          aggression_level?: string | null
          ai_model_provider?: string | null
          created_at?: string | null
          custom_layer_1_model?: string | null
          custom_layer_2_model?: string | null
          custom_layer_3_model?: string | null
          custom_prompt_addendum?: string | null
          enable_tri_modal?: boolean | null
          enable_uopa_agent?: boolean | null
          enable_vendedor_cloning?: boolean | null
          followup_interval_minutes?: number | null
          human_delay_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          layer_1_model?: string | null
          layer_2_model?: string | null
          layer_3_model?: string | null
          max_delay_seconds?: number | null
          max_followups?: number | null
          max_gpt4o_calls_per_day?: number | null
          min_delay_seconds?: number | null
          niche_category?: string | null
          orchestration_rules?: Json | null
          personality_prompt?: string | null
          persuasion_level?: number | null
          prohibited_phrases?: string[] | null
          tenant_id?: string | null
          tone_voice?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      conversations: {
        Row: {
          ai_mode: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          status: string | null
          tenant_id: string | null
          uopa_agent_activated_at: string | null
          uopa_agent_activated_by: string | null
          uopa_agent_active: boolean | null
          uopa_agent_deactivated_at: string | null
          uopa_agent_duration: string | null
          updated_at: string | null
        }
        Insert: {
          ai_mode?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          tenant_id?: string | null
          uopa_agent_activated_at?: string | null
          uopa_agent_activated_by?: string | null
          uopa_agent_active?: boolean | null
          uopa_agent_deactivated_at?: string | null
          uopa_agent_duration?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_mode?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          tenant_id?: string | null
          uopa_agent_activated_at?: string | null
          uopa_agent_activated_by?: string | null
          uopa_agent_active?: boolean | null
          uopa_agent_deactivated_at?: string | null
          uopa_agent_duration?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
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
          ai_layer_1_instructions: string | null
          ai_layer_1_model: string | null
          ai_layer_2_instructions: string | null
          ai_layer_2_model: string | null
          ai_layer_3_instructions: string | null
          ai_layer_3_model: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          ai_layer_1_instructions?: string | null
          ai_layer_1_model?: string | null
          ai_layer_2_instructions?: string | null
          ai_layer_2_model?: string | null
          ai_layer_3_instructions?: string | null
          ai_layer_3_model?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
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
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      tenant_usage: {
        Row: {
          active_users: number | null
          ai_tokens_used: number | null
          api_calls: number | null
          campaign_messages_month: number | null
          created_at: string | null
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
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ai_token_limit: number | null
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
            foreignKeyName: "user_limits_user_id_fkey"
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
        ]
      }
      user_usage: {
        Row: {
          ai_tokens_month: number | null
          ai_tokens_total: number | null
          api_calls_month: number | null
          billing_period_start: string | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_tenant_usage: {
        Args: { _tenant_id: string }
        Returns: undefined
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
    },
  },
} as const

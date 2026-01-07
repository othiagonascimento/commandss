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
      tenant_usage: {
        Row: {
          active_users: number | null
          ai_tokens_used: number | null
          api_calls: number | null
          created_at: string | null
          estimated_cost_brl: number | null
          id: string
          messages_sent: number | null
          period_end: string
          period_start: string
          storage_used_mb: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active_users?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          created_at?: string | null
          estimated_cost_brl?: number | null
          id?: string
          messages_sent?: number | null
          period_end: string
          period_start: string
          storage_used_mb?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active_users?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          created_at?: string | null
          estimated_cost_brl?: number | null
          id?: string
          messages_sent?: number | null
          period_end?: string
          period_start?: string
          storage_used_mb?: number | null
          tenant_id?: string
          updated_at?: string | null
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
          id: string
          implementation_fee: number | null
          implementation_level: number | null
          implementation_paid_externally: boolean | null
          invite_link_id: string | null
          is_blocked: boolean | null
          lead_source: string | null
          name: string
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
          id?: string
          implementation_fee?: number | null
          implementation_level?: number | null
          implementation_paid_externally?: boolean | null
          invite_link_id?: string | null
          is_blocked?: boolean | null
          lead_source?: string | null
          name: string
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
          id?: string
          implementation_fee?: number | null
          implementation_level?: number | null
          implementation_paid_externally?: boolean | null
          invite_link_id?: string | null
          is_blocked?: boolean | null
          lead_source?: string | null
          name?: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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

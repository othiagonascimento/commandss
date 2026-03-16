
-- Fix handle_new_user trigger: 
-- 1) Replace non-existent 'slug' column with 'subdomain'
-- 2) Replace invalid 'user' role with 'seller'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_is_new_tenant BOOLEAN := false;
  user_count integer;
  v_profile_id UUID;
BEGIN
  v_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::UUID;
  
  IF v_tenant_id IS NULL THEN
    v_is_new_tenant := true;
    
    INSERT INTO public.tenants (name, subdomain, is_master)
    VALUES (
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Empresa'),
      COALESCE(NEW.raw_user_meta_data ->> 'company_slug', 'tenant-' || SUBSTRING(gen_random_uuid()::text, 1, 8)),
      false
    )
    RETURNING id INTO v_tenant_id;
    
    INSERT INTO public.tenant_usage (tenant_id, leads_count, users_count, products_count, messages_count, whatsapp_instances_count, ai_tokens_month)
    VALUES (v_tenant_id, 0, 1, 0, 0, 0, 0)
    ON CONFLICT (tenant_id) DO NOTHING;
    
    INSERT INTO public.tenant_features (
      tenant_id, limit_users, limit_leads, limit_products,
      limit_whatsapp_instances, limit_ai_tokens_monthly, limit_storage_mb,
      module_ai_agent, module_ai_transcription, module_automation_flows,
      module_campaigns, module_ecommerce, module_erp_integration,
      module_api_access, module_whitelabel, module_multi_whatsapp
    ) VALUES (
      v_tenant_id, 5, 1000, 100, 1, 10000, 500,
      true, true, true, true, true, false, false, false, false
    ) ON CONFLICT (tenant_id) DO NOTHING;
    
    INSERT INTO public.billing_subscriptions (tenant_id, plan_type, status, current_period_start, current_period_end, trial_ends_at)
    VALUES (v_tenant_id, 'trial', 'trial', now(), now() + INTERVAL '14 days', now() + INTERVAL '14 days')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.tenant_branding (tenant_id) VALUES (v_tenant_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.ai_agent_config (tenant_id, is_enabled) VALUES (v_tenant_id, true) ON CONFLICT DO NOTHING;
  END IF;
  
  INSERT INTO public.profiles (id, name, email, tenant_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), NEW.email, v_tenant_id);
  
  SELECT COUNT(*) INTO user_count FROM public.profiles WHERE tenant_id = v_tenant_id AND id != NEW.id;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (NEW.id, 'admin', v_tenant_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (NEW.id, 'seller', v_tenant_id);
  END IF;
  
  INSERT INTO public.user_usage (user_id, tenant_id) VALUES (NEW.id, v_tenant_id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_limits (user_id, tenant_id) VALUES (NEW.id, v_tenant_id) ON CONFLICT (user_id) DO NOTHING;

  -- Vincular access_profile de sistema
  IF user_count = 0 THEN
    SELECT id INTO v_profile_id FROM public.access_profiles WHERE is_system = true AND base_role = 'admin' LIMIT 1;
  ELSE
    SELECT id INTO v_profile_id FROM public.access_profiles WHERE is_system = true AND base_role = 'user' LIMIT 1;
  END IF;

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.profiles SET access_profile_id = v_profile_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

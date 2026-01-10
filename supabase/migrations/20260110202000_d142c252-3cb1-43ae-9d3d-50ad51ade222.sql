-- Drop the old function and recreate with complete calculations
DROP FUNCTION IF EXISTS public.calculate_tenant_usage(uuid);

CREATE OR REPLACE FUNCTION public.calculate_tenant_usage(_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _users_count INTEGER;
  _leads_count INTEGER;
  _products_count INTEGER;
  _whatsapp_instances_count INTEGER;
  _total_ai_tokens INTEGER;
  _total_storage BIGINT;
  _messages_sent INTEGER;
  _active_users INTEGER;
  _api_calls INTEGER;
  _period_start TIMESTAMPTZ;
  _period_end TIMESTAMPTZ;
BEGIN
  -- Define current period
  _period_start := date_trunc('month', now());
  _period_end := date_trunc('month', now()) + interval '1 month';

  -- Count users in tenant
  SELECT COUNT(*) INTO _users_count 
  FROM public.profiles 
  WHERE tenant_id = _tenant_id;
  
  -- Count leads (from conversations table - assuming leads are tracked there)
  SELECT COUNT(DISTINCT lead_id) INTO _leads_count 
  FROM public.conversations 
  WHERE tenant_id = _tenant_id 
    AND lead_id IS NOT NULL;
  
  -- Count products (from knowledge_base, category = 'product')
  SELECT COUNT(*) INTO _products_count 
  FROM public.knowledge_base 
  WHERE tenant_id = _tenant_id 
    AND category = 'product';
  
  -- Count WhatsApp instances (from tenant config or a dedicated count)
  -- For now, count from a config field or default to 1 if tenant has any activity
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.conversations WHERE tenant_id = _tenant_id) 
      THEN 1 
      ELSE 0 
    END INTO _whatsapp_instances_count;
  
  -- Sum AI tokens from user_usage
  SELECT COALESCE(SUM(ai_tokens_month), 0) INTO _total_ai_tokens 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Sum storage from user_usage
  SELECT COALESCE(SUM(storage_bytes), 0) INTO _total_storage 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Count messages sent this month (from api_usage_logs or similar)
  SELECT COALESCE(COUNT(*), 0) INTO _messages_sent 
  FROM public.api_usage_logs 
  WHERE tenant_id = _tenant_id 
    AND created_at >= _period_start 
    AND created_at < _period_end;
  
  -- Count active users (users with recent activity)
  SELECT COUNT(DISTINCT user_id) INTO _active_users 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id 
    AND last_updated_at >= now() - interval '30 days';
  
  -- Count API calls this month
  SELECT COALESCE(COUNT(*), 0) INTO _api_calls 
  FROM public.api_usage_logs 
  WHERE tenant_id = _tenant_id 
    AND created_at >= _period_start 
    AND created_at < _period_end;
  
  -- Upsert tenant_usage with all calculated values
  INSERT INTO public.tenant_usage (
    tenant_id, 
    period_start, 
    period_end, 
    users_count, 
    leads_count,
    products_count,
    whatsapp_instances_count,
    ai_tokens_used, 
    storage_used_mb, 
    messages_sent,
    active_users,
    api_calls,
    last_calculated_at
  )
  VALUES (
    _tenant_id, 
    _period_start,
    _period_end,
    _users_count, 
    _leads_count,
    _products_count,
    _whatsapp_instances_count,
    _total_ai_tokens, 
    _total_storage / 1048576,
    _messages_sent,
    _active_users,
    _api_calls,
    now()
  )
  ON CONFLICT (tenant_id, period_start) 
  DO UPDATE SET 
    users_count = _users_count,
    leads_count = _leads_count,
    products_count = _products_count,
    whatsapp_instances_count = _whatsapp_instances_count,
    ai_tokens_used = _total_ai_tokens,
    storage_used_mb = _total_storage / 1048576,
    messages_sent = _messages_sent,
    active_users = _active_users,
    api_calls = _api_calls,
    last_calculated_at = now(),
    updated_at = now();
END;
$function$;
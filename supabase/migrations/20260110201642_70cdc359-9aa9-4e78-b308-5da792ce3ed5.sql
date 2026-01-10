-- Drop the old function
DROP FUNCTION IF EXISTS public.calculate_tenant_usage(uuid);

-- Recreate with correct ON CONFLICT clause
CREATE OR REPLACE FUNCTION public.calculate_tenant_usage(_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _users_count INTEGER;
  _total_ai_tokens INTEGER;
  _total_storage BIGINT;
  _period_start TIMESTAMPTZ;
  _period_end TIMESTAMPTZ;
BEGIN
  -- Define current period
  _period_start := date_trunc('month', now());
  _period_end := date_trunc('month', now()) + interval '1 month';

  -- Contar usuários do tenant
  SELECT COUNT(*) INTO _users_count 
  FROM public.profiles 
  WHERE tenant_id = _tenant_id;
  
  -- Somar tokens de IA dos usuários
  SELECT COALESCE(SUM(ai_tokens_month), 0) INTO _total_ai_tokens 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Somar storage dos usuários
  SELECT COALESCE(SUM(storage_bytes), 0) INTO _total_storage 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Atualizar ou inserir tenant_usage usando a constraint correta (tenant_id, period_start)
  INSERT INTO public.tenant_usage (tenant_id, period_start, period_end, users_count, ai_tokens_used, storage_used_mb, last_calculated_at)
  VALUES (
    _tenant_id, 
    _period_start,
    _period_end,
    _users_count, 
    _total_ai_tokens, 
    _total_storage / 1048576,
    now()
  )
  ON CONFLICT (tenant_id, period_start) 
  DO UPDATE SET 
    users_count = _users_count,
    ai_tokens_used = _total_ai_tokens,
    storage_used_mb = _total_storage / 1048576,
    last_calculated_at = now(),
    updated_at = now();
END;
$function$;
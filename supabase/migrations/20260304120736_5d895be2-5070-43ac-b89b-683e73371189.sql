CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_role_text TEXT;
  v_role public.app_role;
BEGIN
  -- tenant_id can be absent in fallback auth flows
  BEGIN
    v_tenant_id := NULLIF(NEW.raw_user_meta_data ->> 'tenant_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;

  -- always keep profile in sync, but never block auth creation
  INSERT INTO public.profiles (id, name, email, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    v_tenant_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    tenant_id = COALESCE(public.profiles.tenant_id, EXCLUDED.tenant_id);

  IF v_tenant_id IS NOT NULL THEN
    v_role_text := lower(COALESCE(NEW.raw_user_meta_data ->> 'role', 'seller'));

    -- normalize legacy/invalid roles
    IF v_role_text IN ('user', 'viewer') THEN
      v_role := 'seller'::public.app_role;
    ELSIF v_role_text = 'super_admin' THEN
      v_role := 'admin'::public.app_role;
    ELSIF v_role_text IN ('admin', 'manager', 'moderator', 'seller') THEN
      v_role := v_role_text::public.app_role;
    ELSE
      v_role := 'seller'::public.app_role;
    END IF;

    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, v_role, v_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    INSERT INTO public.user_usage (user_id, tenant_id)
    VALUES (NEW.id, v_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    INSERT INTO public.user_limits (user_id, tenant_id)
    VALUES (NEW.id, v_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
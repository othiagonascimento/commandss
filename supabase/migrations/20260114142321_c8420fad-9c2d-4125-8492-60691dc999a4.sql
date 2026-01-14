-- 1. Criar o Tenant Master
INSERT INTO tenants (
  id,
  name,
  subdomain,
  plan_type,
  status,
  implementation_level,
  is_blocked,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master',
  'master',
  'enterprise',
  'active',
  100,
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar o perfil do administrador Master
INSERT INTO profiles (
  id,
  tenant_id,
  full_name,
  role,
  created_at
) VALUES (
  'cdc32c8f-32cd-439e-8103-e034d16eebf2',
  '00000000-0000-0000-0000-000000000001',
  'Wesley Gion',
  'admin',
  now()
) ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
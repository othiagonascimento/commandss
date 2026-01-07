-- Inserir o Tenant Master
INSERT INTO public.tenants (id, name, subdomain, plan_type, status, implementation_level)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master Admin',
  'master',
  'enterprise',
  'active',
  100
);

-- Inserir o perfil do usuário como Master
INSERT INTO public.profiles (id, tenant_id, full_name, role)
VALUES (
  'cdc32c8f-32cd-439e-8103-e034d16eebf2',
  '00000000-0000-0000-0000-000000000001',
  'Administrador Master',
  'admin'
);
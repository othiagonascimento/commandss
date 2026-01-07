-- Add unique constraint to user_roles table if not exists
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Insert super_admin role for the master admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('cdc32c8f-32cd-439e-8103-e034d16eebf2', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
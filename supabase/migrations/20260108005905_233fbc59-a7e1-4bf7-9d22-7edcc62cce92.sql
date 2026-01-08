-- Adicionar usuário master para wesgiondev@gmail.com
INSERT INTO public.master_users (user_id, email, full_name, is_active)
VALUES (
  'cdc32c8f-32cd-439e-8103-e034d16eebf2',
  'wesgiondev@gmail.com',
  'Wesgion Dev',
  true
)
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
-- Vincular o usuário master existente ao role super_admin
INSERT INTO master_user_roles (master_user_id, role_id)
SELECT 
  '7dec45c5-5a95-4ffb-a334-b93ee434cb36'::uuid,
  'b3991c40-b932-4e44-afcd-91c312942d98'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM master_user_roles 
  WHERE master_user_id = '7dec45c5-5a95-4ffb-a334-b93ee434cb36'
  AND role_id = 'b3991c40-b932-4e44-afcd-91c312942d98'
);

-- Vincular TODAS as permissões ao role super_admin (acesso total)
INSERT INTO master_role_permissions (role_id, permission_id)
SELECT 
  'b3991c40-b932-4e44-afcd-91c312942d98'::uuid,
  mp.id
FROM master_permissions mp
WHERE NOT EXISTS (
  SELECT 1 FROM master_role_permissions mrp 
  WHERE mrp.role_id = 'b3991c40-b932-4e44-afcd-91c312942d98' 
  AND mrp.permission_id = mp.id
);
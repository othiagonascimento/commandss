

# Migration: Trigger `handle_new_user` resiliente

## O que sera feito

Criar uma migration SQL que substitui o trigger `handle_new_user` no banco Master por uma versao que nao bloqueia a criacao de usuarios caso ocorra qualquer erro interno.

## Arquivo a criar

**`supabase/migrations/20260224_fix_handle_new_user_trigger.sql`**

O SQL vai:
1. Recriar a funcao `handle_new_user` com bloco `EXCEPTION WHEN OTHERS` envolvendo todos os INSERTs
2. Usar `ON CONFLICT DO NOTHING` em todas as tabelas (profiles, user_roles, user_usage, user_limits)
3. Normalizar roles legados (viewer/user -> seller, super_admin -> admin)
4. Se `tenant_id` nao estiver no metadata, fazer skip silencioso
5. Recriar o trigger `on_auth_user_created` apontando para a nova funcao
6. Executar `NOTIFY pgrst, 'reload schema'` para atualizar o cache do PostgREST

## Impacto

- **Nenhum codigo frontend ou edge function precisa mudar**
- Se o trigger funcionar: provisiona tudo normalmente
- Se o trigger falhar: loga warning, nao bloqueia, edge function provisiona manualmente
- Nao afeta o projeto CRM (migration roda apenas no Master)


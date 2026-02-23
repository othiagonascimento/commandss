
# Correção: Dados que Não Persistem / Não São Buscados

## Garantia de Segurança

Todas as alterações são **exclusivamente de leitura** (SELECT/count) no CRM remoto. Nenhum INSERT, UPDATE ou DELETE será executado. Se uma tabela não existir, o código trata o erro graciosamente e retorna valores padrão (zero).

---

## Problema 1: Storage sempre 0

**Causa**: O campo `user_usage.storage_bytes` no CRM nunca é preenchido. A Edge Function soma zeros.

**Solução**: Na `master-usage`, após buscar `user_usage`, adicionar uma tentativa de buscar storage real. Tentar query em `storage.objects` filtrado por bucket do tenant (path prefix). Se falhar (tabela inexistente ou sem permissão), manter o valor atual (0).

```typescript
// Após a busca de user_usage no remote, tentar storage real
try {
  const { data: storageFiles } = await remoteSupabase
    .from('storage.objects')  // ou media_files se existir
    .select('metadata')
    .like('name', `${tenantId}/%`);
  // calcular total de bytes se disponível
} catch { /* fallback: manter remoteStorageMb = 0 */ }
```

**Arquivo**: `supabase/functions/master-usage/index.ts` (linhas ~424-434)

---

## Problema 2: Aba Consumo vazia

**Causa**: O hook `useUserCredits` chama `supabase.rpc('get_tenant_user_credits')` direto no Supabase **do Master**. Porém os dados de consumo por usuário estão no Supabase **do CRM**. A RPC local retorna array vazio.

**Solução**: Refatorar `useUserCredits` para buscar via Edge Function `master-usage/:tenantId/users`, que já tem acesso ao remote Supabase.

**Arquivo**: `src/hooks/useUserCredits.ts`

Mudança:
- Remover chamada `supabase.rpc('get_tenant_user_credits')`
- Usar `usageApi` (que chama `master-usage` Edge Function)
- Mapear resposta para o formato `UserCreditData[]`

Mesma lógica para `useTenantCredits.ts`:
- Remover chamada `supabase.rpc('get_tenant_credits_summary')`
- Usar dados do `master-usage` ou do `tenant_usage` local (que já tem `ai_credits_used`)

**Arquivos**: `src/hooks/useUserCredits.ts`, `src/hooks/useTenantCredits.ts`

---

## Problema 3: Aba Operações sem dados

**Causa**: O `ops-health-query?action=tenant-ops` busca snapshots filtrados por `tenant_id`. Porém o CRM envia snapshots **globais** (sem tenant_id específico). A query não encontra nada.

**Solução**: Quando o snapshot tenant-específico não existir, usar dados que **já funcionam** via `master-usage/:tenantId` como fallback. Esses dados já trazem contagens reais (leads, mensagens, usuários, WhatsApp instances, créditos IA).

**Arquivo**: `src/pages/TenantDetail.tsx` (componente `TenantOperationsTab`)

Mudança:
- Adicionar query secundária para `usageApi.get(tenantId)` como fallback
- Quando `snapshot` for null, renderizar cards com dados do usage (usuários ativos, leads, mensagens do mês, instâncias WhatsApp, créditos IA consumidos)
- Manter a mensagem original apenas se ambas as fontes falharem

---

## Resumo de arquivos

| Arquivo | Ação | Impacto no CRM |
|---------|------|----------------|
| `supabase/functions/master-usage/index.ts` | Adicionar tentativa de query storage real | SELECT only, com try/catch |
| `src/hooks/useUserCredits.ts` | Rotear via Edge Function | Nenhum - só muda o caminho da leitura |
| `src/hooks/useTenantCredits.ts` | Usar tenant_usage local ou Edge Function | Nenhum |
| `src/pages/TenantDetail.tsx` | Fallback ops com dados de usage | Nenhum - só frontend |



# Reverter createUser: restaurar tenant_id e role no metadata

## Causa raiz

A ultima correcao removeu `tenant_id` e `role` do `user_metadata` no `createUser` (linhas 550-553 e 672-675). Isso quebrou o trigger `handle_new_user` do banco de dados, que depende desses campos para provisionar perfil, roles e limites. O codigo funcionava perfeitamente antes dessa mudanca.

## Solucao

Reverter as 2 chamadas `createUser` para incluir `tenant_id` e `role` no `user_metadata`, exatamente como estava antes.

## Mudanca unica

**Arquivo**: `supabase/functions/master-users/index.ts`

### Local 1 - Master createUser (linha ~550)

De:
```text
user_metadata: {
  full_name: fullName,
  name: fullName,
}
```

Para:
```text
user_metadata: {
  full_name: fullName,
  name: fullName,
  tenant_id: tenantId,
  role: appRole,
}
```

### Local 2 - CRM dual-write createUser (linha ~672)

Mesma mudanca: adicionar `tenant_id: tenantId` e `role: appRole` ao `user_metadata`.

### O que nao muda

- Os upserts manuais de profiles/roles/usage/limits que foram adicionados permanecem como safety net
- A atualizacao posterior do metadata (linha ~640) fica redundante mas inofensiva
- Todo o resto do arquivo permanece intacto

## Resumo

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/master-users/index.ts` | Adicionar `tenant_id` e `role` de volta ao `user_metadata` em 2 locais |

Isso restaura o comportamento identico ao que funcionava ontem e hoje a tarde.


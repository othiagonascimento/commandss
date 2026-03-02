

# Auditoria: Compatibilidade do Master com a nova semantica de creditos do CRM

## Problemas encontrados

### 1. Periodo de billing usa dia 1 do mes (INCORRETO)

Todos os pontos do codigo usam `new Date(now.getFullYear(), now.getMonth(), 1)` como inicio do periodo. O CRM agora usa `billing_subscriptions.current_period_end` como referencia do ciclo contratual.

**Arquivos afetados:**
- `supabase/functions/log-api-usage/index.ts` (linhas 213-214, 261-262)
- `supabase/functions/master-usage/index.ts` (linhas 87-88, 472-474, 783-785, 797-799)
- `src/hooks/useTenantCredits.ts` (linhas 28-29)

**Correcao:** Buscar `billing_subscriptions.current_period_start` e `current_period_end` do tenant antes de calcular periodos. Fallback para dia 1 do mes se nao existir subscription.

### 2. `ai_credits_used` do tenant nao e derivado (INCORRETO)

O `log-api-usage` incrementa `tenant_usage.ai_credits_used` diretamente a cada chamada (linha 278). O CRM agora define que `ai_credits_used = SUM(user_usage.ai_tokens_month)` de todos os users do tenant -- e um valor derivado, nao incrementado.

**Correcao no `log-api-usage`:** Apos atualizar `user_usage`, recalcular `tenant_usage.ai_credits_used` como `SUM(user_usage.credits_consumed_month)` dos users do tenant, em vez de incrementar.

### 3. Formula de `ai_credits_remaining` incompleta

A formula correta do CRM: `(credits_per_user x user_count + SUM(extra_credits)) - ai_credits_used`

O Master nao tem o campo `extra_credits` em nenhum lugar. A formula atual e `credits_per_user x users` (linhas 187, 591 do master-usage), o que esta parcialmente correto mas falta os extras.

**Correcao:**
- Adicionar campo `extra_credits` na tabela `tenant_features` (ou ler do CRM remoto)
- Incluir na formula: `totalCreditsLimit = creditsPerUser * usersCount + extraCredits`

### 4. Validacao de `current_period_end` corrupto ausente

O CRM pede que ao exibir `current_period_end`, se estiver > 2 anos no futuro, mostrar "Data nao configurada". O `TenantDetail.tsx` (linha 843) exibe a data sem nenhuma validacao.

**Correcao em `TenantDetail.tsx`:** Adicionar validacao antes de renderizar.

### 5. Fonte de verdade de creditos por usuario

O CRM define `user_usage.ai_tokens_month` como fonte de verdade individual. O `master-usage/users` endpoint (linha 640) ja busca `ai_tokens_month` do `user_usage`, o que esta correto. Porem o hook `useUserCredits.ts` mapeia `credits_consumed` como metrica primaria (linha 43), quando deveria ser `ai_tokens_month`.

**Correcao em `useUserCredits.ts`:** Usar `ai_tokens_month` como `credits_consumed` primario.

---

## Plano de implementacao

### Etapa 1: Edge Function `log-api-usage` -- Derivar tenant_usage

Substituir o bloco de incremento de `tenant_usage.ai_credits_used` (linhas 260-302) por:
1. Buscar `billing_subscriptions` do tenant para obter `current_period_start/end`
2. Apos atualizar `user_usage`, fazer `SELECT SUM(credits_consumed_month) FROM user_usage WHERE tenant_id = X` para derivar o total
3. Upsert `tenant_usage` com o valor somado em vez de incrementado

### Etapa 2: Edge Function `master-usage` -- Periodos e extra_credits

No endpoint `/zones` e `/:tenantId`:
1. Buscar `billing_subscriptions.current_period_start/end` para cada tenant
2. Usar essas datas em vez de dia 1 do mes
3. Buscar `extra_credits` de `tenant_features` (adicionar ao schema se nao existir) e incluir na formula do limite

No endpoint `/:tenantId/recalculate`:
1. Usar periodo do billing_subscriptions em vez de dia 1

### Etapa 3: Frontend -- Validacoes e mapeamento

**`TenantDetail.tsx`**: Adicionar validacao de `current_period_end`:
```text
Se current_period_end > hoje + 2 anos -> mostrar "Data nao configurada"
```

**`useUserCredits.ts`**: Mapear `ai_tokens_month` como fonte primaria de `credits_consumed`.

**`useTenantCredits.ts`**: Usar periodo do billing ao inves de mes corrente.

### Etapa 4: Schema -- Campo extra_credits

Criar migration para adicionar `extra_credits INTEGER DEFAULT 0` em `tenant_features` (se nao existir). Este campo permite creditos bonus/extras por tenant.

---

## Resumo das mudancas

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/log-api-usage/index.ts` | Derivar tenant_usage via SUM em vez de incremento; usar periodo do billing |
| `supabase/functions/master-usage/index.ts` | Usar billing_subscriptions para periodos; incluir extra_credits na formula |
| `src/pages/TenantDetail.tsx` | Validar current_period_end > 2 anos |
| `src/hooks/useUserCredits.ts` | Usar ai_tokens_month como fonte primaria |
| `src/hooks/useTenantCredits.ts` | Usar periodo do billing subscription |
| Nova migration SQL | Adicionar extra_credits em tenant_features |


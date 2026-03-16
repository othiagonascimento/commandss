

## Plano: Tornar Gestão de Domínios Robusta e Funcional

### Problema Identificado
O componente `DomainsManagement` já existe na aba "Domínios" do TenantDetail, mas tem limitações:
1. As instruções de DNS só aparecem quando já existe um domínio com status `pending`/`verifying` — antes de adicionar nenhum domínio, o usuário não vê nada útil
2. O botão "Verificar DNS" apenas atualiza o status localmente para `verifying` e mostra um toast — **não chama a Edge Function** `verify-domains` que realmente faz a verificação via DNS-over-HTTPS
3. Não mostra instruções DNS expandíveis por domínio individual
4. Falta feedback visual claro sobre o que configurar e o estado atual

### Mudanças Planejadas

#### 1. Melhorar o componente `DomainsManagement.tsx`
- Sempre exibir um painel informativo com instruções gerais de como funciona o domínio próprio (mesmo sem domínios cadastrados)
- Adicionar seção expandível de instruções DNS **por domínio** (ao clicar no domínio, mostra os registros A, TXT específicos)
- Conectar o botão "Verificar DNS" à Edge Function `verify-domains` real via `supabase.functions.invoke('verify-domains', { ... })` passando `?domain_id=X`
- Adicionar estado de loading durante verificação real
- Mostrar último erro de verificação de forma mais visível
- Adicionar confirmação antes de deletar domínio

#### 2. Integrar verificação real com Edge Function
- Substituir a mutation `verifyDomainMutation` para chamar `verify-domains?domain_id={id}` via Edge Function
- Processar o resultado e atualizar a UI com o status real retornado (verified, pending, error)
- Mostrar resultado detalhado da verificação (A record OK/NOK, TXT OK/NOK)

#### 3. Melhorar o diálogo de adicionar domínio
- Validar formato de domínio no front-end antes de enviar
- Após adicionar, abrir automaticamente as instruções DNS do novo domínio
- Mostrar preview de como ficará a URL

#### Arquivos alterados
- `src/components/tenant/DomainsManagement.tsx` — refatoração principal

#### Detalhes técnicos
- A Edge Function `verify-domains` já implementa verificação real via Google DNS-over-HTTPS (TXT + A record)
- A chamada será: `supabase.functions.invoke('verify-domains', { body: null })` com query param `?domain_id=X`
- RLS já está configurado corretamente (`master_users` têm acesso ALL)


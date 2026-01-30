
# Plano: Reformulação da Página de Cadastros

## Contexto do Problema

### 1. Erro ao Carregar Dados
O erro "Erro ao carregar dados" ocorre porque a política RLS da tabela `onboarding_submissions` requer que `is_master_tenant()` retorne `true` para permitir SELECT. O console mostra um erro relacionado ao parâmetro de role que está quebrando a verificacao de permissao.

**A tabela tem dados** - confirmei 5 cadastros reais:
- Magnata Consultoria & Mentoria
- Erika Joias
- Portal Medianeira
- Protagonismo RH
- E outros...

### 2. Interface em JSON Ilegivel
Atualmente os dados sao exibidos em formato JSON bruto na aba secundaria, e a aba de dados formatados nao esta bem estruturada para copiar facilmente.

---

## Solucao Proposta

### Parte 1: Corrigir a Leitura de Dados

Vou criar uma **Edge Function dedicada** (`master-onboarding`) para buscar os cadastros usando `SUPABASE_SERVICE_ROLE_KEY`, contornando as limitacoes de RLS do cliente frontend.

**Rota GET**: Retorna todos os cadastros ordenados por data
**Rota POST com action=update_status**: Atualiza o status do cadastro

### Parte 2: Redesign da Interface

#### 2.1 Tela Principal (Lista)
- Tabela com colunas: Empresa, Responsavel, Email, WhatsApps, Data, Status
- Badge de status colorido (Pendente/Aprovado/Rejeitado)
- Botao "Visualizar" para abrir o painel lateral
- Botao "Criar Tenant" que abre CreateTenant pre-preenchido

#### 2.2 Painel de Detalhes (Sheet)
Organizacao em secoes com **botao de copiar** em cada campo:

```text
+------------------------------------------+
|  [Logo]  NOME DA EMPRESA                 |
|  Status: [Pendente] [Aprovar] [Rejeitar] |
+------------------------------------------+
|                                          |
|  IDENTIDADE                    [Copiar]  |
|  Nome: Magnata Consultoria               |
|  Nome Curto: Magnata                     |
|  Slogan: -                               |
|                                          |
|  RESPONSAVEL                   [Copiar]  |
|  Nome: Herika Lima Souza                 |
|  Email: carla@gmail.com                  |
|  Telefone: (99) 98403-2219               |
|  Atua em vendas: Sim                     |
|                                          |
|  OPERACAO                      [Copiar]  |
|  Atendimentos/mes: 50                    |
|  Produtos: 3                             |
|  WhatsApps: 2                            |
|  Nicho: Consultoria Empresarial          |
|                                          |
|  IA                            [Copiar]  |
|  Personalidade: Consultivo...            |
|  Responde fora do horario: Sim           |
|  Horarios: Seg-Sex 09:00-18:00           |
|                                          |
+------------------------------------------+
|  [Copiar Tudo JSON]  [Criar Tenant ->]   |
+------------------------------------------+
```

#### 2.3 Funcionalidade "Criar Tenant"
Botao que redireciona para `/tenants/new` com query params pre-preenchidos:
- `?name=NomeDaEmpresa`
- `&slug=slug-sugerido`
- `&email=email@responsavel.com`
- `&contact_name=NomeDoResponsavel`

O `CreateTenant.tsx` sera atualizado para ler esses params e preencher os campos automaticamente.

---

## Arquivos a Criar/Modificar

### Novos Arquivos
1. `supabase/functions/master-onboarding/index.ts` - Edge Function para CRUD de cadastros

### Arquivos a Modificar
1. `src/pages/AdminCadastros.tsx` - Redesign completo da interface
2. `src/pages/CreateTenant.tsx` - Ler query params para pre-preenchimento
3. `supabase/config.toml` - Registrar a nova Edge Function

---

## Detalhes Tecnicos

### Edge Function: master-onboarding

```text
GET /master-onboarding
  - Retorna lista de onboarding_submissions
  - Ordenado por created_at DESC

POST /master-onboarding
  Body: { action: "update_status", id: "uuid", status: "approved"|"rejected" }
  - Atualiza status do cadastro
```

### Componente de Copia
Cada secao tera um botao que copia os dados formatados:

```text
IDENTIDADE
Nome: Magnata Consultoria
Nome Curto: Magnata
Slogan: -
```

### Pre-preenchimento do Tenant
URL gerada: `/tenants/new?prefill=true&name=...&slug=...&email=...`

O CreateTenant verificara `searchParams.get('prefill')` e populara o form.

---

## Mapeamento Cadastro -> Tenant

| Campo do Cadastro       | Campo do Tenant          |
|-------------------------|--------------------------|
| company_name            | name                     |
| short_name (slugified)  | slug/subdomain           |
| owner_email             | contact_email            |
| owner_name              | admin_name               |
| owner_email             | admin_email              |
| niche                   | Sugestao de template     |
| logo_url                | branding.logo_url        |
| primary_color (se tiver)| branding.primary_color   |

---

## Beneficios

1. **Sem erros de RLS** - Edge Function usa service role
2. **Interface intuitiva** - Dados organizados em secoes claras
3. **Copiar com 1 clique** - Cada secao ou campo individual
4. **Fluxo integrado** - Botao direto para criar tenant pre-preenchido
5. **Alinhado com tenant config** - Mapeamento claro de campos

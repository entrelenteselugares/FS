# Phase 50 Context: Multi-Tier Network Affiliate System

## 🎯 Decisions

### 1. Modelo de Comissões e Simulação Matemática (Splits & Tiers)

- **Modelo de Níveis:** Adotaremos um modelo híbrido de **2 Níveis** de comissão para incentivar a rede de contatos.
- **Simulação de Divisão Financeira (Split):**
  - **Compra do Cliente:** Considere um pedido de **R$ 100,00**.
  - **Comissão de Nível 1 (Indicador Direto):** **5%** (R$ 5,00) pagos ao usuário que indicou diretamente o cliente.
  - **Comissão de Nível 2 (Indicador Indireto - Apenas VIPs):** **2%** (R$ 2,00) pagos ao padrinho do indicador direto, caso ele possua a licença de afiliado "VIP".
  - **Total Consumido pela Rede:** **7%** máximo. O restante (R$ 93,00) segue o fluxo padrão de splits operacionais (Fotógrafo, Editor, Unidade/Cartório, Matriz), garantindo a viabilidade financeira e a saúde das margens.

### 2. Controle de Saturação (Regra dos 50 VIPs)

- **Níveis de Habilitação:**
  - **Membro VIP (Rede Completa):** Apenas os **primeiros 50 usuários** que ativarem a aba, ou aqueles **manualmente eleitos/promovidos pelo Administrador Master**, ganham comissão multinível (5% no Nível 1 + 2% no Nível 2).
  - **Membro STANDARD (Padrão):** Todos os demais usuários cadastrados após o limite de 50 continuam ganhando a comissão direta padrão de **Nível 1 (5%)**, mantendo a atratividade do sistema sem expor de forma explícita o esquema multinível.
- **Gestão Administrativa:** O painel administrativo (/admin/users) ganhará um toggle rápido para promover/rebaixar qualquer usuário para a modalidade "VIP" a qualquer momento.

### 3. Modelagem do Banco de Dados (PostgreSQL/Prisma Schema)

- **Extensão do Modelo `User`:**
  - `referredById String?`: Aponta para o `id` do usuário que o indicou (tabela `users`).
  - `affiliateTier String @default("STANDARD")`: Define a categoria de ganhos ("STANDARD" ou "VIP").
  - Relação recursiva autorreferencial em Prisma:

    ```prisma
    referredBy User?    @relation("UserReferrals", fields: [referredById], references: [id])
    referrals  User[]    @relation("UserReferrals")
    ```

### 4. Integração de Interface (UI)

- **Menu do Cliente (`/minha-conta`):**
  - O menu lateral exibirá dinamicamente a opção **"Programa de Afiliados"** ou **"Minha Rede VIP"** para todos os usuários.
  - Para os **VIPs (primeiros 50 ou eleitos)**, a tela mostrará a aba completa de estatísticas: Link de indicação, árvore de contatos (Nível 1 e Nível 2) e extrato de comissões passivas.
  - Para os **STANDARDs**, a tela exibirá apenas o painel de indicação direta padrão (ganhos sobre amigos diretos).

---

## 🏗️ Technical Approach

- **Backend Middleware:** Criação de um helper de split recursivo (`AffiliateService.ts`) que busca o `referredById` ao fechar um pedido e gera os lançamentos de comissão adequados na tabela `gamification_ledger` ou em uma nova tabela `affiliate_commissions`.
- **Painel Administrativo:** Inclusão de coluna "Afiliado VIP" e filtro correspondente na página de gerenciamento de membros (/admin/users).

---

_Created: 2026-05-17 | Phase 50_

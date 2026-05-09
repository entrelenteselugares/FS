# Fase 17: Marketplace Scale — Decisões de Implementação

Decisões de arquitetura e UX capturadas para orientar o desenvolvimento do programa de embaixadores e logística inteligente.

## 🎯 Domínio da Fase
Escalabilidade do ecossistema Foto Segundo através de growth descentralizado e otimização da materialização física regional.

## 🔒 Requisitos Travados (via SPEC.md)
*   **Embaixadores:** Qualquer perfil pode gerar links; múltiplos links por campanha; recompensas por cadastro ou venda.
*   **Logística:** Roteamento por CEP; unidades com flags de capacidade; fallback para Matriz.

## ⚖️ Decisões de Implementação (CONTEXT)

### 1. Experiência do Embaixador
*   **Visualização:** Foco total em **Extrato Detalhado**. O embaixador verá uma lista cronológica de conversões, incluindo o nome do convidado (quando disponível) e o valor gerado.
*   **Métricas:** O dashboard deve exibir a taxa de conversão (cliques vs. vendas) para cada link ativo, permitindo que o embaixador saiba quais campanhas performam melhor.

### 2. Mecânica de Growth e URLs
*   **Slugs Amigáveis:** As URLs de indicação seguirão o padrão `foto-segundo.com/embaixador/{campanha-slug}`. 
*   **Atribuição:** Utilizaremos cookies de longa duração (30 dias) para garantir que, se o cliente clicar no link hoje mas comprar apenas na próxima semana, o embaixador ainda receba o crédito.

### 3. Motor Logístico e Roteamento
*   **Roteamento por CEP:** Utilizaremos os primeiros 5 dígitos do CEP (prefixo) para mapear a região. Unidades Fixas terão uma lista de prefixos atendidos em seu perfil.
*   **Balanceamento de Carga:** Entre duas unidades que atendam o mesmo CEP e tenham a capacidade necessária, o sistema escolherá automaticamente a que tiver a **menor fila de pedidos pendentes** (`PENDING_PRINT`).
*   **Fallback:** Caso nenhum prefixo de CEP coincida ou a unidade regional não suporte o produto (ex: álbum), o pedido cai na fila da **Matriz**.

---

## 🛠️ Contexto de Código (Scout)
*   **Backend:** Estender `FranchiseProfile` para incluir `capacityFlags` (JSON ou colunas booleanas) e `servedZipPrefixes` (lista de strings).
*   **Frontend:** Criar novo layout `AmbassadorDashboard.tsx` dentro do módulo de usuários comuns, mas acessível por todos os perfis.
*   **Referral Engine:** Criar middleware `referralTracker` que intercepta as rotas `/embaixador/*` e grava o `campaignId` no estado global/cookie.

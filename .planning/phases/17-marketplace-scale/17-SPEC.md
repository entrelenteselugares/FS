# Fase 17: Marketplace Scale — Especificação Técnica

Este documento detalha os requisitos para a expansão do programa de embaixadores e a implementação do roteamento logístico inteligente para distribuição phygital global.

## 📊 Relatório de Ambiguidade

| Dimensão | Score Final | Status |
| :--- | :--- | :--- |
| **Clareza do Objetivo** | 0.90 | ✅ Cristalino |
| **Clareza de Fronteiras** | 0.85 | ✅ Definido |
| **Clareza de Restrições** | 0.85 | ✅ Mapeado |
| **Critérios de Aceite** | 0.85 | ✅ Falsificável |

**Ambiguidade Final: 0.14** (Gate: ≤ 0.20) — **APROVADO PARA DISCUSSÃO**

---

## 🎯 Requisitos de Negócio (Locked)

### 1. Motor de Embaixadores (Growth)
*   **Req 1.1: Entidade de Campanhas de Indicação**
    *   **Estado Atual:** Existe apenas um `referralCode` fixo por usuário na tabela `User`.
    *   **Estado Alvo:** Criar modelo `ReferralCampaign` permitindo que qualquer usuário (Admin, Profissional, Cliente) crie múltiplos links com objetivos e recompensas diferentes.
    *   **Critério de Aceite:** Admin consegue criar uma campanha via painel, definir o gatilho (Cadastro vs Compra) e o valor da recompensa.
*   **Req 1.2: Atribuição e Persistência**
    *   **Estado Atual:** Rastreamento básico via URL query.
    *   **Estado Alvo:** Implementar persistência de "Last Click" em cookie/localStorage. Se um usuário clicar no link do embaixador e fechar o browser, o vínculo deve persistir por 30 dias.
    *   **Critério de Aceite:** Um usuário que clica no link e se cadastra 2 dias depois deve ser vinculado corretamente ao embaixador no banco de dados.
*   **Req 1.3: Painel do Embaixador**
    *   **Estado Atual:** Não existe interface para embaixadores.
    *   **Estado Alvo:** Nova rota `/dashboard/ambassador` com visão de: Total de Cliques, Conversões (Cadastros), Vendas Geradas e Saldo de Recompensas.
    *   **Critério de Aceite:** O usuário consegue copiar links de campanhas ativas e visualizar seu extrato de ganhos em tempo real.

### 2. Roteamento Logístico (Scale)
*   **Req 2.1: Capacidades das Unidades Fixas**
    *   **Estado Atual:** Unidades são genéricas. Todo pedido de um evento vai para a unidade vinculada a esse evento.
    *   **Estado Alvo:** Adicionar flags de capacidade (ex: `canPrintPhotos`, `canPrintPremiumProducts`) no `FranchiseProfile`.
    *   **Critério de Aceite:** O sistema impede que um pedido de álbum seja direcionado a uma unidade que só possui impressora de fotos térmicas.
*   **Req 2.2: Roteamento Inteligente por Proximidade**
    *   **Estado Atual:** Roteamento estático (Unidade do Evento).
    *   **Estado Alvo:** Durante o checkout, o sistema deve verificar o CEP de entrega e buscar a `Unidade Fixa` ativa mais próxima que possua a **capacidade** técnica necessária.
    *   **Critério de Aceite:** Um pedido feito em SP para um evento no RS deve ser impresso em uma unidade de SP (se disponível e capaz), reduzindo frete e prazo.
*   **Req 2.3: Fallback para Matriz**
    *   **Estado Alvo:** Se nenhuma unidade capaz for encontrada num raio definido, o pedido é automaticamente roteado para a **Unidade Central (Matriz)**.
    *   **Critério de Aceite:** Pedidos de alta complexidade (Álbuns de Luxo) sem unidade regional capaz devem aparecer na fila de impressão do Admin Master.

---

## 🚧 Fronteiras (Scope)

### Em Escopo (In-Scope)
- CRUD de `ReferralCampaign` no Admin.
- Dashboard de Embaixador para todos os perfis.
- Middleware de captura de referral e armazenamento em cookie.
- Lógica de roteamento geográfico (baseada em prefixo de CEP ou coordenadas).
- Flags de capacidade no perfil da Franquia.

### Fora de Escopo (Out-of-Scope)
- Integração direta com APIs de transportadoras (Melhor Envio/Correios) — o cálculo de frete continuará baseado em tabelas fixas ou estimativas manuais por enquanto.
- Sistema de saque automatizado (Payout automático) — o pagamento aos embaixadores continuará sendo marcado como "Pago" manualmente pelo Admin após transferência PIX.

---

## ✅ Critérios de Aceite de Alto Nível (Definition of Done)
- [ ] Usuário A clica no link de Usuário B, faz uma compra de R$ 100, e o Usuário B recebe automaticamente R$ 5 (ou X%) no seu ledger de créditos.
- [ ] Um pedido físico com endereço de entrega em local remoto sem Unidade Fixa próxima é atribuído automaticamente à Unidade Matriz.
- [ ] O Admin consegue desativar uma campanha e os links antigos param de gerar novas recompensas.
- [ ] O Dashboard do Embaixador exibe um gráfico simples de performance de cliques vs conversões.

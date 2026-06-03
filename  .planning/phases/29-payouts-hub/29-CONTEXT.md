# Phase 29: Payouts Hub - CONTEXT

Implementação do sistema de liquidação financeira e extrato para profissionais.

## 🎯 Objectives

- **Gestão de Repasses:** Interface para Admin marcar pedidos como liquidados (pagos ao fotógrafo).
- **Extrato do Profissional:** Visibilidade para o fotógrafo sobre seus ganhos (Pendente vs Disponível vs Pago).
- **Auditoria Financeira:** Registro histórico de pagamentos para evitar bitributação ou erros de repasse.

## 🛠️ Decisions

### 1. Modelo de Payout

- Criar tabela `Payout` para registrar a "liquidação" de um conjunto de pedidos.
- Um `Payout` agrupa múltiplos `Orders`.
- Status: `REQUESTED`, `PROCESSING`, `COMPLETED`, `FAILED`.

### 2. Fluxo de Disponibilidade

- **Escrow:** O valor fica em `PENDING_ESCROW` por 7 dias (ou conforme config do usuário).
- **Available:** Após o prazo, o valor fica `AVAILABLE_FOR_PAYOUT`.
- **Paid:** Quando o Admin processa a liquidação.

### 3. Interface

- **Admin:** Lista de profissionais com saldo acumulado e botão "Liquidar".
- **Profissional:** Nova aba "Financeiro" com gráfico de ganhos e lista de repasses.

## 🚧 Constraints

- Apenas Administradores podem processar liquidações.
- Garantir que um pedido não seja pago duas vezes.

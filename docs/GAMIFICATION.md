# Gamification Engine (V2)

## Visão Geral

O Motor de Gamificação da Foto Segundo é um sistema de incentivos projetado para maximizar a lealdade do cliente e a performance operacional dos profissionais e franqueados.

## 1. Gamification Ledger (Livro-Razão)

Todas as transações de pontos e créditos são registradas no `GamificationLedger`.

- **Tipo EARN**: Cashback de compras.
- **Tipo BONUS**: Pontos por SLA ou metas batidas.
- **Tipo REDEEM**: Uso de créditos em compras.
- **Tipo ADJUSTMENT**: Ajustes administrativos.

## 2. Cashback do Cliente

- **Regra**: 5% de retorno sobre o valor total de pedidos pagos no Marketplace.
- **Uso**: Os créditos (`rewardCredits`) são cumulativos e podem ser usados para abater o valor de qualquer compra futura (Produtos Digitais ou Impressos).
- **Trigger**: O crédito é concedido automaticamente após a liquidação do pagamento via `GamificationService.processOrderRewards`.

## 3. Pontos de Agilidade (SLA Profissional)

- **Métrica**: Entrega de links de galeria (Lightroom/Drive).
- **Meta**: 24 horas após o término do evento (`eventEndTime`).
- **Recompensa**: +100 Agility Points por entrega dentro do prazo.
- **Impacto**: Pontuação visível no dashboard do profissional, elevando seu ranking na rede.

## 4. Tiers de Franquia (Micro-Franquias)

A progressão de nível é baseada no volume de vendas aprovadas:

- **BRONZE**: Nível inicial.
- **SILVER**: > 50 vendas aprovadas.
- **GOLD**: > 150 vendas aprovadas.
- **DIAMOND**: > 500 vendas aprovadas.

A atualização do tier ocorre em tempo real a cada venda liquidada.

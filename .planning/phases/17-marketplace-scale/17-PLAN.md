# Fase 17: Marketplace Scale — PLAN.md

## Wave 1: Database Schema & Backend Core (Referral Engine)
- [x] **[BLOCKING]** Update `backend/prisma/schema.prisma`:
    - Adicionar modelos `ReferralCampaign`, `ReferralVisit`, `ReferralConversion`.
    - Adicionar campos `capacityFlags` (Json) e `servedZipPrefixes` (String[]) ao `FranchiseProfile`.
- [x] **[BLOCKING]** Executar `npx prisma db push` para aplicar alterações no banco.
- [x] Implementar `ReferralService`:
    - Lógica para criar campanhas, registrar visitas e processar conversões.
- [x] Criar Middleware de Rastreamento:
    - Rota `/embaixador/:slug` para capturar cliques e setar cookie `fs_referral` (30 dias).
- [x] Atualizar `PricingService.calculateSplits`:
    - Adicionar campo `ambassadorId` e lógica para split de comissão (deduzido da matriz).
- [x] Criar API Endpoints (`GET /api/ambassador/stats`, `GET /api/ambassador/conversions`).

## Wave 2: Smart Routing Logic & Logistics Engine
- [ ] Implementar `LogisticsService`:
    - Função `findNearestCapableUnit(cep: string, requiredCapacity: string)`:
        - Extrair prefixo (5 dígitos).
        - Filtrar por `servedZipPrefixes` e `capacityFlags`.
        - Balanceamento: Selecionar unidade com menor fila (`PENDING_PRINT` em `PhygitalPrint`).
        - Fallback: Retornar nulo (Matriz) se não houver unidade regional.
- [ ] Integrar Roteamento no Checkout:
    - Chamar `LogisticsService` ao criar o pedido e gravar `franchiseProfileId` no registro de impressão.
- [ ] Adicionar indicador visual de unidade responsável no resumo do pedido (frontend).

## Wave 3: Ambassador Dashboard & Admin UI
- [ ] Desenvolver `AmbassadorDashboard.tsx`:
    - Layout *Midnight Luxury* com cards de métricas (Ganhos, Cliques, Conversões).
    - Lista detalhada de conversões com status.
    - Gerenciador de links com botão "Copiar".
- [ ] Desenvolver `AdminCampaigns.tsx`:
    - Painel para o administrador gerenciar as campanhas globais e recompensas.
- [ ] Atualizar Navegação:
    - Adicionar link "Embaixador" no menu do usuário e "Campanhas" no menu Admin.

## Wave 4: Integration & E2E Verification
- [ ] Teste E2E de Indicação:
    - Fluxo: Clique no link -> Cookie -> Compra -> Crédito gerado no `GamificationLedger`.
- [ ] Teste de Roteamento Logístico:
    - Simular pedidos com CEPs diferentes e verificar atribuição de unidade baseada em carga/capacidade.
- [ ] Auditoria Visual:
    - Garantir que os novos dashboards seguem os tokens de design do `index.css`.

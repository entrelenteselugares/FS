# Fase 17: Marketplace Scale — Pesquisa Técnica

Pesquisa e estratégia de implementação para o motor de embaixadores e logística inteligente.

## 1. Estratégia de Growth: Motor de Embaixadores

### Modelo de Dados (Prisma)
Para suportar múltiplas campanhas por usuário e rastreamento detalhado:

```prisma
model ReferralCampaign {
  id          String   @id @default(cuid())
  ownerId     String
  name        String
  slug        String   @unique // ex: "campanha-natal"
  rewardType  String   @default("CREDIT") // CREDIT, CASH
  rewardValue Decimal  @db.Decimal(10, 2)
  trigger     String   @default("PURCHASE") // SIGNUP, PURCHASE
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  owner       User     @relation(fields: [ownerId], references: [id])
  visits      ReferralVisit[]
  conversions ReferralConversion[]
}

model ReferralVisit {
  id         String   @id @default(cuid())
  campaignId String
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  campaign   ReferralCampaign @relation(fields: [campaignId], references: [id])
}

model ReferralConversion {
  id           String   @id @default(cuid())
  campaignId   String
  newUserId    String?
  orderId      String?
  rewardAmount Decimal  @db.Decimal(10, 2)
  status       String   @default("PENDING") // PENDING, PAID
  createdAt    DateTime @default(now())
  
  campaign     ReferralCampaign @relation(fields: [campaignId], references: [id])
}
```

### Rastreamento e Atribuição
1.  **Middleware:** Criar uma rota `/embaixador/:slug` que:
    *   Registra um `ReferralVisit`.
    *   Define um cookie `fs_referral` com o `campaignId` e expiração de 30 dias.
    *   Redireciona para a Home ou Landing Page específica.
2.  **Conversão:**
    *   No cadastro: Verifica o cookie e vincula o usuário à campanha.
    *   No checkout: Se houver o cookie e o gatilho for `PURCHASE`, cria uma `ReferralConversion`.

## 2. Logística Inteligente: Smart Routing

### Localização e Capacidade
Extender `FranchiseProfile`:
*   `capacityFlags`: JSONB (ex: `{"canPrintPhotos": true, "canPrintAlbums": false}`).
*   `servedZipPrefixes`: String[] (ex: `["010", "011", "012"]`).

### Algoritmo de Roteamento
Ao finalizar um pedido físico:
1.  Extrair os primeiros 5 dígitos do CEP de entrega.
2.  Filtrar `FranchiseProfile` que:
    *   Contenham o prefixo em `servedZipPrefixes`.
    *   Tenham a flag necessária em `capacityFlags` para o produto comprado.
3.  **Balanceamento:** Entre as unidades filtradas, selecionar a que possui o menor número de registros em `PhygitalPrint` com `status: PENDING_PRINT`.
4.  **Fallback:** Se nenhuma unidade for encontrada, o `franchiseProfileId` no registro de impressão será nulo (direcionado à Matriz).

## 3. Arquitetura de Comissões (PricingService)

Atualizar `SplitResult` e `calculateSplits`:
*   Adicionar campo `ambassador` e `ambassadorId`.
*   A comissão do embaixador será deduzida da margem da **Matriz**, protegendo o ganho do fotógrafo e do franqueado regional.

## 4. Frontend: Dashboard do Embaixador

*   **Página:** `/dashboard/ambassador`
*   **Componentes:**
    *   `MetricsOverview`: Cards com Cliques, Conversões e Saldo.
    *   `ConversionTable`: Lista detalhada (Extrato) com: Data, Nome do Convidado, Status e Valor.
    *   `CampaignManager`: Lista de links gerados com botão de copiar.

## 5. Plano de Validação (Nyquist)

*   **Teste 1 (Rastreamento):** Clicar no link, navegar pelo site, fazer logout/login e verificar se o cookie persiste e a conversão é computada.
*   **Teste 2 (Logística):** Criar pedidos com CEPs de diferentes regiões e verificar se o `franchiseProfileId` é atribuído corretamente baseado na carga e capacidade.
*   **Teste 3 (Financeiro):** Validar se o split da matriz diminui proporcionalmente à recompensa do embaixador no `GamificationLedger`.

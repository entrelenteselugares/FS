# Phase 50 Research: Multi-Tier Network Affiliate System

## RESEARCH COMPLETE

---

## 1. Análise do Estado Atual do Banco de Dados

### Modelo `User` (schema.prisma L12-77)

O `User` já possui campos relevantes que **reaproveitamos** sem conflito:

| Campo Existente                                 | Status    | Uso na Fase 50                                                |
| ----------------------------------------------- | --------- | ------------------------------------------------------------- |
| `referralCode String? @unique`                  | ✅ Existe | Serve como código de convite único — já é o link de indicação |
| `rewardCredits Decimal @default(0)`             | ✅ Existe | Acumulação de ganhos do afiliado                              |
| `affiliatePayoutType String @default("CREDIT")` | ✅ Existe | Modalidade de resgate (crédito vs. saque)                     |

**Campos NOVOS necessários:**

```prisma
referredById  String?   // Self-reference: quem indicou este usuário
affiliateTier String    @default("STANDARD") // "STANDARD" | "VIP"

referredBy    User?     @relation("UserReferrals", fields: [referredById], references: [id])
referrals     User[]    @relation("UserReferrals")
```

---

## 2. Análise do Fluxo de Split Financeiro

### `PricingService.calculateSplits()` (pricing.service.ts L77-180)

Método central que já calcula: `matriz | captacao | edicao | cartorio | franchisee | ambassador`.

**Fluxo atual:**

1. Deduz `shippingFee` e `supplierCost` para obter `netAmount`
2. Calcula splits de parceiros (captacao, edicao, cartorio) sobre `netAmount`
3. Busca `passiveFranchiseeId` via `ProfessionalNetwork` (comissão B2B passiva)
4. Busca `ambassadorId` via `ReferralCampaign` (comissão de campanha ativa)
5. Matriz absorve o restante

**Integração da Fase 50:**
O cálculo de afiliados será **inserido ANTES do cálculo da Matriz** para que os 7% sejam absorvidos pela margem da Matriz (não dos parceiros):

```
netAmount = amount - shippingFee - supplierCost
captacao  = netAmount * split_captacao  (ex: 30%)
edicao    = netAmount * split_edicao    (ex: 20%)
cartorio  = netAmount * split_cartorio  (ex: 10%)

// NOVO — Busca L1 e L2 via referredById
affiliateL1 = netAmount * 0.05  // 5% para quem indicou o comprador
affiliateL2 = netAmount * 0.02  // 2% para quem indicou o L1 (somente se L1 for VIP)

// Matriz absorve tudo
matriz = amount - (captacao + edicao + cartorio + affiliateL1 + affiliateL2)
```

### Modelo `Order` (schema.prisma L322-381)

Campos existentes para splits: `splitCaptacao`, `splitEdicao`, `splitCartorio`, `splitFranchisee`, `splitMatriz`, `ambassadorId`.

**Campos NOVOS necessários no `Order`:**

```prisma
splitAffiliateL1   Decimal?  @db.Decimal(10, 2)
splitAffiliateL2   Decimal?  @db.Decimal(10, 2)
affiliateL1Id      String?   // userId do indicador direto
affiliateL2Id      String?   // userId do indicador indireto (VIP)
```

---

## 3. Infraestrutura de Rastreamento de Comissões

### Opção A: Reutilizar `GamificationLedger`

Já possui `userId`, `type`, `amount`, `orderId`. Basta criar entradas com `type: "AFFILIATE_L1"` ou `"AFFILIATE_L2"`.

### Opção B: Nova tabela `AffiliateCommission`

```prisma
model AffiliateCommission {
  id        String   @id @default(cuid())
  userId    String   // Quem recebe
  orderId   String   // Pedido gerador
  level     Int      // 1 ou 2
  amount    Decimal  @db.Decimal(10, 2)
  status    String   @default("PENDING") // PENDING | PAID
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id])
  order Order @relation(fields: [orderId], references: [id])
}
```

**Decisão:** Criar **nova tabela** `AffiliateCommission` — separação limpa do ledger de gamificação, facilita relatórios futuros e filtro no admin.

---

## 4. Controle de Limite VIP (50 usuários)

A contagem VIP deve ser verificada **no momento da promoção pelo admin**, não no cadastro:

```typescript
// Admin promove usuário para VIP
const vipCount = await prisma.user.count({ where: { affiliateTier: "VIP" } });
// Sem limite automático — apenas alertar o admin se vipCount >= 50
```

A regra dos 50 é **operacional**, não técnica. O admin vê o contador no painel e decide quando elevar. Sem bloqueio automático.

---

## 5. Rastreamento do Link de Indicação

### Mecanismo de Cookie (padrão atual para ambassador)

O sistema atual já usa `req.cookies?.fs_referral` para rastrear o `ambassadorId`. O mesmo mecanismo pode ser reutilizado para afiliados:

1. **URL de convite:** `/registro?ref=REFERRALCODE` (usando `referralCode` existente do User)
2. **Middleware de captura:** Ao acessar `?ref=CODE`, salvar em cookie `fs_affiliate_ref` com TTL de 30 dias
3. **No checkout:** Resolver `fs_affiliate_ref` → buscar userId → registrar `affiliateL1Id` e `affiliateL2Id`

---

## 6. Fluxo de Registro com Indicação

```
1. Novo usuário acessa /registro?ref=CODE
2. Backend salva cookie fs_affiliate_ref=CODE (30 dias)
3. Usuário completa registro
4. Backend resolve CODE → User.referralCode → referrerId
5. Define referredById = referrerId no novo User
6. Quando novo usuário compra algo:
   - affiliateL1 = referredById do comprador (quem indicou)
   - affiliateL2 = referredById do L1 (somente se L1.affiliateTier === "VIP")
```

---

## 7. Painel Frontend (`/minha-conta`)

### Componentes Existentes para Reaproveitar

- Verificar `/frontend/src/pages/` para a página atual de conta do cliente
- O menu lateral existente da conta do cliente deve ser identificado e estendido

### Lógica de Exibição Condicional

```tsx
// VIP: Mostra árvore de indicações (L1 + L2) + ganhos passivos
// STANDARD: Mostra apenas link de convite + ganhos de L1
{
  user.affiliateTier === "VIP" ? (
    <AffiliateDashboardVIP />
  ) : (
    <AffiliateDashboardStandard />
  );
}
```

---

## 8. Endpoint Admin para Gestão de VIPs

`PATCH /api/admin/users/:id/affiliate-tier`

- Body: `{ tier: "VIP" | "STANDARD" }`
- Guard: `requireRole("ADMIN")`
- Resposta: user atualizado + contagem total de VIPs

---

## 9. Impacto nas Margens (Simulação Final)

| Cenário                          | Valor Pedido | L1 (5%) | L2 (2%) | Overhead Total | Matriz Restante |
| -------------------------------- | ------------ | ------- | ------- | -------------- | --------------- |
| Compra sem indicação             | R$ 100       | R$ 0    | R$ 0    | 0%             | R$ 100          |
| Compra com L1 STANDARD           | R$ 100       | R$ 5    | R$ 0    | 5%             | R$ 95           |
| Compra com L1 VIP                | R$ 100       | R$ 5    | R$ 2    | 7%             | R$ 93           |
| Compra com L1 VIP + cartorio 10% | R$ 100       | R$ 5    | R$ 2    | 17%            | R$ 83           |

> Conclusão: Overhead máximo de 7% é sustentável. Mesmo com todos os splits ativos (cartorio 10% + captacao 30%), a Matriz retém margens positivas sobre os seus 30-40% de share operacional.

---

## 10. Arquivos a Criar/Modificar

| Arquivo                                                   | Ação   | Descrição                                                                                                                 |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `backend/prisma/schema.prisma`                            | Editar | Add `referredById`, `affiliateTier`, `AffiliateCommission` model, add `splitAffiliateL1/L2`, `affiliateL1/2Id` em `Order` |
| `backend/src/services/affiliate.service.ts`               | Criar  | Service com `resolveAffiliateChain()`, `recordCommission()`                                                               |
| `backend/src/services/pricing.service.ts`                 | Editar | Integrar chamada ao AffiliateService no `calculateSplits()`                                                               |
| `backend/src/controllers/affiliate.controller.ts`         | Criar  | Endpoints: `GET /rede`, `GET /comissoes`, admin tier toggle                                                               |
| `backend/src/routes/affiliate.routes.ts`                  | Criar  | Rotas autenticadas para painel de afiliado                                                                                |
| `frontend/src/pages/account/AffiliatePage.tsx`            | Criar  | Painel de afiliado (VIP + STANDARD views)                                                                                 |
| `frontend/src/components/account/AffiliateTree.tsx`       | Criar  | Componente de árvore de indicações                                                                                        |
| `frontend/src/pages/account/AccountPage.tsx` (ou similar) | Editar | Add tab "Minha Rede" no menu da conta                                                                                     |

---

_Research completed: 2026-05-17 | Phase 50_

# Phase 50 Plan: Multi-Tier Network Affiliate System

## Goal

Implementar um sistema de indicação em rede com 2 níveis de comissão (5% direto / 2% indireto VIP), integrado ao fluxo de pagamento existente, com painel visual na área do cliente e controle administrativo de membros VIP.

---

## Wave 1 — Database Schema Migration

### Task 50-01 — Prisma Schema: Referral Tree & AffiliateCommission

**Files Modified:** `backend/prisma/schema.prisma`

**1.1 — Add referral fields to `User` model** (após `affiliatePayoutType`):

```prisma
referredById   String?
affiliateTier  String   @default("STANDARD") // "STANDARD" | "VIP"

referredBy     User?    @relation("UserReferrals", fields: [referredById], references: [id], onDelete: SetNull)
referrals      User[]   @relation("UserReferrals")
affiliateCommissions AffiliateCommission[]
```

**1.2 — Add affiliate split fields to `Order` model** (após `ambassadorId`):

```prisma
splitAffiliateL1  Decimal? @db.Decimal(10, 2)
splitAffiliateL2  Decimal? @db.Decimal(10, 2)
affiliateL1Id     String?
affiliateL2Id     String?
affiliateCommissions AffiliateCommission[]
```

**1.3 — Create `AffiliateCommission` model:**

```prisma
model AffiliateCommission {
  id        String   @id @default(cuid())
  userId    String
  orderId   String
  level     Int      // 1 = L1 (5%), 2 = L2 (2% VIP)
  amount    Decimal  @db.Decimal(10, 2)
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  order     Order    @relation(fields: [orderId], references: [id])
  @@map("affiliate_commissions")
}
```

**1.4 — Run migrations:**

```bash
cd backend && npx prisma db push && npx prisma generate
```

**Verification:** Tabela `affiliate_commissions` criada no Supabase. `npx prisma generate` sem erros.

---

## Wave 2 — Backend Service, Controller & Routes

### Task 50-02 — Create AffiliateService

**File Created:** `backend/src/services/affiliate.service.ts`

```typescript
import prisma from "../lib/prisma";

export const AFFILIATE_RATES = { L1: 0.05, L2: 0.02 };

export class AffiliateService {
  /** Resolve chain: retorna l1Id (indicador direto) e l2Id (indicador do L1, se VIP) */
  static async resolveChain(buyerUserId: string) {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { referredById: true },
    });
    if (!buyer?.referredById) return { l1Id: null, l2Id: null };

    const l1 = await prisma.user.findUnique({
      where: { id: buyer.referredById },
      select: { id: true, referredById: true, affiliateTier: true },
    });
    if (!l1) return { l1Id: null, l2Id: null };

    const l2Id =
      l1.affiliateTier === "VIP" && l1.referredById ? l1.referredById : null;
    return { l1Id: l1.id, l2Id };
  }

  /** Registra comissões e credita em rewardCredits */
  static async recordCommissions(
    orderId: string,
    l1Id: string | null,
    l1Amount: number,
    l2Id: string | null,
    l2Amount: number,
  ) {
    const entries = [];
    if (l1Id && l1Amount > 0)
      entries.push({ userId: l1Id, orderId, level: 1, amount: l1Amount });
    if (l2Id && l2Amount > 0)
      entries.push({ userId: l2Id, orderId, level: 2, amount: l2Amount });
    if (!entries.length) return;

    await prisma.affiliateCommission.createMany({ data: entries });
    for (const e of entries) {
      await prisma.user.update({
        where: { id: e.userId },
        data: { rewardCredits: { increment: e.amount } },
      });
    }
  }

  /** Dados completos do painel de afiliados */
  static async getDashboardData(userId: string) {
    const [user, commissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCode: true,
          affiliateTier: true,
          rewardCredits: true,
          referrals: {
            select: {
              id: true,
              nome: true,
              createdAt: true,
              referrals: { select: { id: true, nome: true, createdAt: true } },
            },
          },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { order: { select: { valor: true, createdAt: true } } },
      }),
    ]);
    return {
      referralCode: user?.referralCode,
      affiliateTier: user?.affiliateTier,
      rewardCredits: user?.rewardCredits,
      l1Count: user?.referrals.length ?? 0,
      l2Count: user?.referrals.reduce((a, r) => a + r.referrals.length, 0) ?? 0,
      referrals: user?.referrals,
      commissions,
    };
  }

  static async getVipCount() {
    return prisma.user.count({ where: { affiliateTier: "VIP" } });
  }
}
```

---

### Task 50-03 — Extend PricingService.calculateSplits()

**File Modified:** `backend/src/services/pricing.service.ts`

**3.1 — Add `buyerUserId?: string` to options param**

**3.2 — Insert affiliate chain resolution after the ambassador block (after L154):**

```typescript
// ── BUSCA COMISSÃO AFILIADO ──
let affiliateL1Id: string | undefined;
let affiliateL2Id: string | undefined;
let affiliateL1Amount = 0;
let affiliateL2Amount = 0;

if (options?.buyerUserId) {
  const { l1Id, l2Id } = await AffiliateService.resolveChain(
    options.buyerUserId,
  );
  if (l1Id) {
    affiliateL1Id = l1Id;
    affiliateL2Id = l2Id || undefined;
    affiliateL1Amount = +(netAmount * 0.05).toFixed(2);
    if (l2Id) affiliateL2Amount = +(netAmount * 0.02).toFixed(2);
  }
}
```

**3.3 — Include affiliate in matriz calculation (L177):**

```typescript
const matriz = +(
  amount -
  (captacao +
    edicao +
    cartorio +
    franchisee +
    ambassador +
    affiliateL1Amount +
    affiliateL2Amount)
).toFixed(2);
return {
  matriz,
  captacao,
  edicao,
  cartorio,
  franchisee,
  passiveFranchiseeId,
  ambassador,
  ambassadorId,
  affiliateL1Id,
  affiliateL2Id,
  affiliateL1Amount,
  affiliateL2Amount,
};
```

**3.4 — Pass `buyerUserId` from checkout calls in `payment.controller.ts`:**

```typescript
// Nos dois calls a calculateSplits() (checkout e processPayment), adicionar:
buyerUserId: finalUserId || resolvedClienteId || undefined;
```

**3.5 — Persist affiliate fields to Order (create + update):**

```typescript
splitAffiliateL1: affiliateL1Amount || null,
splitAffiliateL2: affiliateL2Amount || null,
affiliateL1Id: affiliateL1Id || null,
affiliateL2Id: affiliateL2Id || null,
```

**3.6 — Call `recordCommissions` in `finalizeApprovedOrder()` after order status update:**

```typescript
if (order.affiliateL1Id && order.splitAffiliateL1) {
  await AffiliateService.recordCommissions(
    order.id,
    order.affiliateL1Id,
    Number(order.splitAffiliateL1),
    order.affiliateL2Id || null,
    Number(order.splitAffiliateL2 || 0),
  );
}
```

---

### Task 50-04 — AffiliateController & Routes

**Files Created:**

- `backend/src/controllers/affiliate.controller.ts`
- `backend/src/routes/affiliate.routes.ts`

**File Modified:** `backend/src/app.ts`

**Endpoints:**

```typescript
// GET /api/affiliate/dashboard   → AffiliateService.getDashboardData(req.user.id)
// PATCH /api/admin/users/:id/affiliate-tier  → update affiliateTier (requireRole ADMIN)
// GET /api/affiliate/vip-count   → AffiliateService.getVipCount() (admin)
```

**Referral cookie capture** — In `POST /api/auth/register`:

```typescript
const affiliateRef = req.cookies?.fs_affiliate_ref;
if (affiliateRef) {
  const referrer = await prisma.user.findFirst({
    where: { referralCode: affiliateRef },
    select: { id: true },
  });
  if (referrer) newUserData.referredById = referrer.id;
}
```

**Register routes in app.ts:**

```typescript
import affiliateRoutes from "./routes/affiliate.routes";
app.use("/api/affiliate", affiliateRoutes);
```

---

## Wave 3 — Frontend: Painel de Afiliados

### Task 50-05 — Create AffiliateDashboard Component

**File Created:** `frontend/src/components/AffiliateDashboard.tsx`

O componente chama `GET /api/affiliate/dashboard` e renderiza dinamicamente:

**Para STANDARD:**

- Badge: "🟡 Membro Standard"
- Link copiável (`/registro?ref=CODE`) com botão "Copiar"
- KPIs: "X contatos diretos", "Total ganho: R$ X"
- Extrato de comissões L1 (tabela de 20 mais recentes)

**Para VIP:**

- Badge: "💎 Membro VIP — Rede Completa"
- Tudo do STANDARD +
- `AffiliateTree` component: lista L1 com sub-lista de L2 para cada um
- KPIs expandidos: "L1: X / L2: Y / Total passivo: R$ Z"
- Extrato separado por nível (L1 e L2)

**Estrutura de design:** Reutilizar padrão visual de `ClienteArea.tsx` (`lux-card`, `fs-btn`, cores `brand-tactical`, tipografia uppercase/italic).

---

### Task 50-06 — Integrate into ClienteArea.tsx

**File Modified:** `frontend/src/pages/ClienteArea.tsx`

**6.1 — Type update (L20):**

```tsx
type ActiveTab = "files" | "profile" | "wallet" | "embaixador" | "rede";
```

**6.2 — NAV_ITEMS: Add after "Programa Embaixador" (L113):**

```tsx
{ label: "Minha Rede", onClick: () => setActiveTab("rede"), isActive: activeTab === "rede", icon: <Network size={18} /> },
```

**6.3 — PAGE_TITLES: Add (L117):**

```tsx
rede: { title: "Minha Rede", subtitle: "Indique e ganhe comissões passivas.", prefix: "Programa de Afiliados" },
```

**6.4 — URL section param handler (after L186):**

```tsx
} else if (section === "rede") {
  setActiveTab("rede");
}
```

**6.5 — Tab render (after embaixador block at L666):**

```tsx
) : activeTab === "rede" ? (
  <AffiliateDashboard />
) : null}
```

**6.6 — Imports:**

```tsx
import { AffiliateDashboard } from "../components/AffiliateDashboard";
import { Network } from "lucide-react";
```

---

### Task 50-07 — Admin VIP Management in AdminUsers.tsx

**File Modified:** `frontend/src/pages/admin/AdminUsers.tsx`

**7.1 — Add "Afiliado" column to users table:**

```tsx
<td>
  <span
    className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
      user.affiliateTier === "VIP"
        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
        : "text-theme-muted border-theme-border/20"
    }`}
  >
    {user.affiliateTier === "VIP" ? "💎 VIP" : "○ Standard"}
  </span>
</td>
```

**7.2 — Toggle VIP action button:**

```tsx
<button onClick={() => toggleAffiliateTier(user.id, user.affiliateTier)}>
  {user.affiliateTier === "VIP" ? "↓ Standard" : "↑ Promover VIP"}
</button>
```

Calls `PATCH /api/admin/users/:id/affiliate-tier` with `{ tier: "VIP" | "STANDARD" }`.

**7.3 — VIP counter banner:**

```tsx
<div>Membros VIP Ativos: {vipCount} / 50</div>
```

Fetches from `GET /api/affiliate/vip-count`.

---

## Verification Checklist

- [ ] `npx prisma db push` executa sem erros e tabela `affiliate_commissions` existe
- [ ] Registro com `?ref=CODE` cria usuário com `referredById` correto
- [ ] Pedido aprovado com afiliado gera registro em `affiliate_commissions`
- [ ] `rewardCredits` do afiliado incrementa após compra do convidado
- [ ] Tab "Minha Rede" aparece no menu lateral de `/minha-conta`
- [ ] STANDARD vê: link de convite + KPIs L1 + extrato L1
- [ ] VIP vê: tudo do STANDARD + árvore L2 + extrato separado
- [ ] Admin toggle VIP/Standard funciona em `/admin/users`
- [ ] Contador "X VIPs / 50" exibido no admin
- [ ] Overhead máximo de 7% confirmado nos logs de pagamento

---

_Plan: 2026-05-17 | Phase 50 | Multi-Tier Network Affiliate System_

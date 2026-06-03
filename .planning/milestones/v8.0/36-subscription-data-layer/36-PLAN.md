---
phase: 36
name: Subscription Data Layer
milestone: v8.0
requirements: [SUB-01, SUB-02, SUB-03, SUB-04]
depends_on: []
---

# Phase 36: Subscription Data Layer

## Context

The `Subscription` model, `SubscriptionService`, and `VaultController.subscribe` already exist in the codebase, but are incomplete:

- `Subscription` model is missing `trialEndsAt`, `planPrice`, and `preapprovalId` fields.
- `SharedAlbum` is missing a `trialEndsAt` field and a `status` field for BLOCKED state.
- The `SubscriptionService.createVaultSubscription` does NOT actually call the MP Preapproval API — it only creates a local `Order` without a real gateway preapproval.
- No webhook handler exists for MP subscription lifecycle events (authorized, paused, cancelled).

## Tasks

### Task 1: Extend Prisma Schema

**File:** `backend/prisma/schema.prisma`

1. Add to `SharedAlbum` model:
   - `trialEndsAt DateTime?` — set to 30 days after creation
   - `subscriptionStatus String @default("TRIAL")` — values: TRIAL, ACTIVE, BLOCKED, EXPIRED

2. Add to `Subscription` model:
   - `preapprovalId String?` — MP Preapproval ID
   - `planPrice Decimal @default(19.90)` — monthly price
   - `BLOCKED` status to the `SubscriptionStatus` enum

3. Run migration:

```bash
cd backend && npx prisma migrate dev --name "add-subscription-trial-fields"
```

### Task 2: Set `trialEndsAt` on Vault Creation

**File:** `backend/src/controllers/vault.controller.ts` — `createAlbum()`

After creating the `SharedAlbum`, compute and set `trialEndsAt`:

```typescript
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + 30);
// Add trialEndsAt to the prisma.sharedAlbum.create() data block
```

Also, when the album is returned in `listAlbums` and `getAlbumDetails`, include `trialEndsAt` and `subscriptionStatus` so the frontend can show warnings.

### Task 3: Implement Real MP Preapproval Integration

**File:** `backend/src/services/subscription.service.ts` — `createVaultSubscription()`

Replace the stub implementation with a real MP Preapproval call:

```typescript
// 1. Call MP Preapproval API to create a recurring subscription plan
const mpResponse = await MercadoPagoService.createPreapproval({
  reason: `Cofre Mensal: ${album.nome}`,
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: 19.9,
    currency_id: "BRL",
  },
  payer_email: album.owner.email,
  back_url: `${process.env.FRONTEND_URL}/vaults/${albumId}?subscribed=true`,
  notification_url: `${process.env.BACKEND_URL}/api/webhooks/mp-subscription`,
});

// 2. Update the subscription record with the preapprovalId and init_point
await prisma.subscription.update({
  where: { albumId },
  data: {
    preapprovalId: mpResponse.id,
    planPrice: 19.9,
    status: "PENDING",
  },
});

// 3. Return the init_point URL for redirect
return {
  subscriptionId: subscription.id,
  initPoint: mpResponse.init_point,
  preapprovalId: mpResponse.id,
  amount: 19.9,
};
```

**File:** `backend/src/services/mercadopago.service.ts`

Add a `createPreapproval()` static method:

```typescript
static async createPreapproval(data: {
  reason: string;
  auto_recurring: { frequency: number; frequency_type: string; transaction_amount: number; currency_id: string };
  payer_email: string;
  back_url: string;
  notification_url: string;
}) {
  const response = await axios.post(
    "https://api.mercadopago.com/preapproval",
    data,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    }
  );
  return response.data; // { id, init_point, status, ... }
}
```

### Task 4: Implement MP Subscription Webhook Handler

**File:** `backend/src/routes/index.ts`

Register a dedicated route for MP subscription webhooks:

```typescript
router.post("/webhooks/mp-subscription", async (req, res) => {
  const { type, data } = req.body;
  if (type === "subscription_preapproval") {
    await SubscriptionService.handlePreapprovalWebhook(data.id);
  }
  return res.sendStatus(200);
});
```

**File:** `backend/src/services/subscription.service.ts`

Add `handlePreapprovalWebhook(preapprovalId: string)`:

```typescript
static async handlePreapprovalWebhook(preapprovalId: string) {
  // 1. Fetch current status from MP
  const mpData = await MercadoPagoService.getPreapproval(preapprovalId);

  const statusMap: Record<string, SubscriptionStatus> = {
    authorized: "ACTIVE",
    paused: "PAST_DUE",
    cancelled: "CANCELED",
    pending: "PENDING",
  };
  const newStatus = statusMap[mpData.status] ?? "PENDING";

  // 2. Update local subscription + vault subscriptionStatus
  const sub = await prisma.subscription.findFirst({ where: { preapprovalId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: newStatus,
      nextBillingDate: newStatus === "ACTIVE"
        ? new Date(mpData.next_payment_date)
        : undefined,
    },
  });

  // 3. If ACTIVE, unblock the vault
  if (newStatus === "ACTIVE") {
    await prisma.sharedAlbum.update({
      where: { id: sub.albumId },
      data: { subscriptionStatus: "ACTIVE" },
    });
  }

  // 4. If CANCELED, mark vault EXPIRED
  if (newStatus === "CANCELED") {
    await prisma.sharedAlbum.update({
      where: { id: sub.albumId },
      data: { subscriptionStatus: "EXPIRED" },
    });
  }
}
```

**File:** `backend/src/services/mercadopago.service.ts`

Add `getPreapproval(preapprovalId: string)`:

```typescript
static async getPreapproval(preapprovalId: string) {
  const response = await axios.get(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  );
  return response.data;
}
```

## Verification

- [ ] `npx prisma migrate status` shows migration applied cleanly.
- [ ] `POST /api/vaults` creates album with `trialEndsAt = now() + 30 days`.
- [ ] `POST /api/vaults/:albumId/subscribe` returns `{ initPoint: "https://www.mercadopago.com.br/..." }`.
- [ ] Simulated MP webhook `POST /api/webhooks/mp-subscription` with `{ type: "subscription_preapproval", data: { id: "<preapprovalId>" } }` correctly transitions subscription to ACTIVE.
- [ ] `GET /api/vaults/:albumId` returns `trialEndsAt` and `subscriptionStatus` fields.

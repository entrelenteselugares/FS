---
phase: 37
name: Vault Blocking Engine
milestone: v8.0
requirements: [BLOCK-01, BLOCK-02, BLOCK-03, BLOCK-04]
depends_on: [36]
---

# Phase 37: Vault Blocking Engine

## Context

With the data layer for subscriptions completed in Phase 36, we need to enforce the trial rules. If a user does not subscribe by the end of the 30-day trial, the vault should transition to `BLOCKED`.

## Tasks

### Task 1: Vault Blocking Service

**File:** `backend/src/services/vaultBlocking.service.ts`

Create a service to identify expiring/expired vaults and trigger actions:

- `processExpiringVaults()`:
  - Find all albums with `subscriptionStatus = "TRIAL"`
  - If `trialEndsAt < now()`, set `subscriptionStatus = "BLOCKED"`
  - If `trialEndsAt` is exactly 5 days from now, send D-5 warning email.
  - If `trialEndsAt` is exactly 1 day from now, send D-1 warning email.

### Task 2: Expiry Cron Route

**File:** `backend/src/routes/index.ts`
Add the endpoint that Vercel will hit daily:

```typescript
router.get("/cron/vault-expiry", async (req, res) => {
  const token = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    token !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await VaultBlockingService.processExpiringVaults();
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
```

### Task 3: Enforce Blocking on Backend API

**File:** `backend/src/controllers/vault.controller.ts`

1. In `listMedia(req, res)`:

```typescript
const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
if (
  album?.subscriptionStatus === "BLOCKED" ||
  album?.subscriptionStatus === "EXPIRED"
) {
  return res.status(402).json({
    error: "SUBSCRIPTION_REQUIRED",
    message:
      "O período gratuito deste cofre expirou. Assine para continuar acessando.",
  });
}
```

1. In `proxyMedia(req, res)`:
   Find the album associated with the media and enforce the same rule. If blocked, return a 402 or redirect to a placeholder image. Because `proxyMedia` only receives `fileId`, we need to look it up in `SharedAlbumMedia` first.

### Task 4: Email Templates

**File:** `backend/src/services/email.service.ts`
Add methods:

- `sendVaultExpiryWarning(email, vaultName, daysLeft)`
- `sendVaultBlocked(email, vaultName)`

## Verification

- [ ] Run `POST /cron/vault-expiry` manually via Postman and verify a vault changes status.
- [ ] Try to access `GET /api/vaults/:id/media` on a blocked vault and receive `402 SUBSCRIPTION_REQUIRED`.

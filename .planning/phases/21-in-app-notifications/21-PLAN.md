# Phase 21: In-App Notification System — PLAN.md

**Phase:** 21
**Goal:** Implement a persistent in-app notification center so clients and admins receive real-time status updates (quote received, quote priced, payment confirmed, event milestone) without relying solely on email.
**Status:** Ready for execution
**Mode:** mvp (feature-slice: DB → API → Hooks → UI)

---

## Context

The platform currently uses email-only notifications (via `NotificationService`). When a client submits a quote, they have no way to know the status has changed unless they check email. Admins similarly have no badge/feed for incoming leads.

**Scope boundary:**
- Polling-based (no WebSockets) — simple and serverless-compatible with Vercel
- Covers: Client dashboard + Admin dashboard
- Does NOT cover: Push notifications, email unsubscribe, notification preferences (deferred)

---

## Threat Model

| Threat | Mitigation |
|---|---|
| IDOR: user reads another user's notifications | All queries filter by `userId` from JWT |
| Admin marks client notifications as read | Separate ownership; admin notifs go to ADMIN role users only |
| Notification flood (spam) | Dedup on `(userId, type, refId)` within 5 min; max 200 per user |

---

## Wave 1 — Database Schema [BLOCKING]

### Task 1.1 — Add `Notification` model to Prisma schema

**File:** `backend/prisma/schema.prisma`

Add model:
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // QUOTE_RECEIVED | QUOTE_PRICED | PAYMENT_CONFIRMED | GENERAL
  title     String
  body      String
  refId     String?  // eventId or orderId for deep-link
  refType   String?  // "event" | "order"
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read])
  @@index([userId, createdAt])
}
```

Add to `User` model: `notifications Notification[]`

### Task 1.2 — Run schema push [BLOCKING]

```bash
cd backend && npx prisma db push
```

---

## Wave 2 — Backend Service & Endpoints

### Task 2.1 — Add `createInApp()` to NotificationService

**File:** `backend/src/services/notification.service.ts`

Add static method with deduplication (skip if same userId+type+refId within 5 min) and pruning (keep max 200 per user, delete oldest).

### Task 2.2 — New notification controller

**File:** `backend/src/controllers/notification.controller.ts` (new)

Endpoints (all require `requireAuth`, filter by `req.user.userId`):
- `GET /api/notifications` — list (unread + last 20 read), ordered by createdAt desc
- `GET /api/notifications/unread-count` — `{ count: number }` for badge polling
- `PATCH /api/notifications/:id/read` — mark one as read
- `PATCH /api/notifications/read-all` — mark all as read for current user

**File:** `backend/src/routes/index.ts` — mount `notificationRouter` at `/api/notifications`

### Task 2.3 — Hook into existing controllers

**`admin.controller.ts` > `adminApproveQuote`** (after email send, ~line 1134):
```typescript
const targetUser = await prisma.user.findUnique({ where: { email: quote.clientEmail! } });
if (targetUser) {
  await NotificationService.createInApp({
    userId: targetUser.id,
    type: 'QUOTE_PRICED',
    title: '💰 Seu orçamento chegou!',
    body: `Preparamos uma proposta para ${quote.nomeNoivos}. Clique para ver e confirmar.`,
    refId: quote.id, refType: 'event'
  });
}
```

**`event.controller.ts` > `createQuote`** (after event create, `locationType === "OTHER"`):
```typescript
const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
for (const admin of admins) {
  await NotificationService.createInApp({
    userId: admin.id,
    type: 'QUOTE_RECEIVED',
    title: '📋 Novo orçamento recebido',
    body: `${name} solicitou orçamento para ${eventDate}. Acesse o Kanban para precificar.`,
    refId: event.id, refType: 'event'
  });
}
```

**`payment.controller.ts` > `finalizeApprovedOrder`** (after status set to PAGO):
```typescript
if (order.clienteId) {
  await NotificationService.createInApp({
    userId: order.clienteId,
    type: 'PAYMENT_CONFIRMED',
    title: '✅ Pagamento confirmado!',
    body: `Seu evento está confirmado. Em breve você receberá os detalhes da sua sessão.`,
    refId: order.eventId, refType: 'event'
  });
}
```

---

## Wave 3 — Frontend Components

### Task 3.1 — `useNotifications` hook

**File:** `frontend/src/hooks/useNotifications.ts` (new)

- Polls `GET /api/notifications/unread-count` every 30 seconds (only when authenticated)
- Fetches full list on demand (`fetchAll()`)
- Exposes: `{ unreadCount, notifications, markRead, markAllRead, fetchAll }`
- Clears interval on unmount

### Task 3.2 — `NotificationBell` component

**File:** `frontend/src/components/NotificationBell.tsx` (new)

UI spec:
- Bell icon (`lucide-react Bell`) with red badge showing `unreadCount` (hidden when 0)
- Click: toggles a slide-in panel (fixed right-0, top-0, h-full, w-80, z-50, backdrop blur)
- Panel header: "Notificações" + "Marcar todas como lidas" button
- Each item: icon by type (📋/💰/✅), title, body snippet (2 lines max), relative time
- Click item: `markRead(id)` + navigate to `/admin?tab=quotes` or `/admin?tab=events` based on refType
- Empty state: subtle icon + "Nenhuma notificação ainda"
- Design tokens: `var(--bg-card)`, `var(--brand)`, `var(--text)`, `var(--border)` — matches DashboardLayout

### Task 3.3 — Integrate into DashboardLayout

**File:** `frontend/src/components/DashboardLayout.tsx`

- Import and render `<NotificationBell />` in:
  1. Mobile topbar right section (between brand and hamburger)
  2. Desktop sidebar header (right of logo)

### Task 3.4 — Verify client dashboard coverage

If `ClientDashboard.tsx` uses `DashboardLayout`, Task 3.3 already covers it.
If it has its own layout, add `<NotificationBell />` to its header separately.

---

## Wave 4 — Verification

### Task 4.1 — UAT scenarios

**A. Quote flow:**
1. Client submits `/orcamento` → admin bell shows badge "1" with "Novo orçamento"
2. Admin dispatches quote → client bell shows "Seu orçamento chegou!"
3. Client pays → client sees "Pagamento confirmado!"

**B. Read state:**
1. Click notification → navigate to event, badge decrements
2. "Marcar todas como lidas" → badge disappears

**C. Deduplication:**
1. Submit 2 quotes same email within 5 min → admin receives only 1 notification

### Task 4.2 — Build check

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Zero TypeScript errors required.

### Task 4.3 — Deploy

```bash
git add -A
git commit -m "feat(phase-21): in-app notification system"
git push origin main
```

---

## Files Modified

| File | Action |
|---|---|
| `backend/prisma/schema.prisma` | Add `Notification` model |
| `backend/src/services/notification.service.ts` | Add `createInApp()` |
| `backend/src/controllers/notification.controller.ts` | New — CRUD endpoints |
| `backend/src/routes/index.ts` | Mount notification router |
| `backend/src/controllers/admin.controller.ts` | Hook in `adminApproveQuote` |
| `backend/src/controllers/event.controller.ts` | Hook in `createQuote` |
| `backend/src/controllers/payment.controller.ts` | Hook in `finalizeApprovedOrder` |
| `frontend/src/hooks/useNotifications.ts` | New — polling hook |
| `frontend/src/components/NotificationBell.tsx` | New — bell + slide panel UI |
| `frontend/src/components/DashboardLayout.tsx` | Integrate bell |

---

## Deferred

- WebSocket / SSE real-time (polling sufficient for MVP)
- Email preference toggles
- Mobile push (PWA)
- Notification templates in admin UI

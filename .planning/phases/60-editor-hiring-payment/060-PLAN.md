# Phase 060: Editor Hiring & Payment Flow — Plan

## 1. Database Schema Update

- **Goal:** Support the `EditorContract` lifecycle.
- **Action:** Add `EditorContract` to `backend/prisma/schema.prisma`.

  ```prisma
  enum EditorContractStatus {
    PENDING_ACCEPTANCE
    ACCEPTED
    PAID
    IN_PROGRESS
    DELIVERED
    REVISION
    COMPLETED
    CANCELLED
  }

  model EditorContract {
    id           String               @id @default(cuid())
    eventId      String
    editorId     String
    ownerId      String
    serviceId    String
    grossAmount  Decimal              @db.Decimal(10, 2)
    platformFee  Decimal              @db.Decimal(10, 2)
    netAmount    Decimal              @db.Decimal(10, 2)
    status       EditorContractStatus @default(PENDING_ACCEPTANCE)
    acceptedAt   DateTime?
    deliveredAt  DateTime?
    releasedAt   DateTime?
    revisionNote String?
    revisionAt   DateTime?
    paymentMethod String              // "MP" | "CREDITS"
    mpOrderId    String?
    createdAt    DateTime             @default(now())
    updatedAt    DateTime             @updatedAt

    event        Event                @relation(fields: [eventId], references: [id])
    editor       User                 @relation("EditorContracts", fields: [editorId], references: [id])
    owner        User                 @relation("OwnerContracts", fields: [ownerId], references: [id])
    service      ProfessionalService  @relation(fields: [serviceId], references: [id])

    @@map("editor_contracts")
  }
  ```

- **Action:** Update `User` and `Event` and `ProfessionalService` models with the reverse relations.
- **Action:** Run `[BLOCKING]` schema push: `npx prisma db push`.

## 2. Backend Logic (Controllers & Routes)

- **Goal:** Expose endpoints for creating and managing contracts.
- **Action:** Create `editor-contract.controller.ts` (and corresponding routes).
  - `POST /api/editor-contracts`: Create contract. Deduct credits or generate MP preference.
  - `GET /api/editor-contracts/:id`: Get details.
  - `PATCH /api/editor-contracts/:id/accept`: Editor accepts. Status `PENDING_ACCEPTANCE` -> `IN_PROGRESS`.
  - `PATCH /api/editor-contracts/:id/reject`: Editor rejects -> `CANCELLED`. Refund.
  - `PATCH /api/editor-contracts/:id/deliver`: Editor delivers -> `DELIVERED`.
  - `PATCH /api/editor-contracts/:id/revision`: Owner requests revision -> `REVISION`.
  - `POST /api/editor-contracts/cron/auto-release`: For escrow release and auto-cancellations (called by external cron/trigger).

## 3. Backend Notification Integrations

- **Goal:** Notify users on contract state changes.
- **Action:** Update `NotificationService` to add methods for:
  - `notifyContractProposed` (to editor)
  - `notifyContractAccepted` (to owner)
  - `notifyContractDelivered` (to owner)
  - `notifyFundsReleased` (to editor)

## 4. Frontend Integration

- **Goal:** Build the hiring flow in `EventEditPanel.tsx` (Equipe tab).
- **Action:** Fetch the selected editor's services (`GET /api/professional/:id/services`).
- **Action:** Add a "Contratar" button to each service.
- **Action:** Show payment selection modal (MercadoPago vs Carteira/Credits).
- **Action:** Call API to create contract.

## 5. Verification

- **Goal:** Verify end-to-end functionality.
- **Action:** Ensure contract is created correctly.
- **Action:** Ensure credits are deducted.
- **Action:** Ensure MP preference returns URL.
- **Action:** Ensure Escrow logic holds funds.

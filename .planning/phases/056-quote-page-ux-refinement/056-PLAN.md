# Phase 56 Implementation Plan: QuotePage UX Refinement

## Goal

Implement UX refinements in the quote/booking flow:

1. Dynamic event type filtering based on Unidade Fixa selection.
2. Single-select UI for equipment (workflowPref) and usage type (usageType).

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.prisma](file:///c:/foto-segundo/backend/prisma/schema.prisma)

- Add `eventTypes String[] @default([])` to the `Cartorio` model.

### Backend API

#### [MODIFY] [event.controller.ts](file:///c:/foto-segundo/backend/src/controllers/event.controller.ts)

- Update `listPartners` to include the new `eventTypes` field in the response.

#### [MODIFY] [admin.controller.ts](file:///c:/foto-segundo/backend/src/controllers/admin.controller.ts)

- Update `updateUnitConfig` (or similar function for updating `Cartorio` config) to accept and save `eventTypes`.

### Frontend Pages

#### [MODIFY] [QuotePage.tsx](file:///c:/foto-segundo/frontend/src/pages/QuotePage.tsx)

- **Event Types:** Filter the `<select>` options for event categories based on `currentPartner.eventTypes` when a partner is selected. Fallback to all options if empty or no partner selected.
- **Single-Select:**
  - Change `workflowPref` state from `string[]` to `string` (defaulting to `"TRADICIONAL"`).
  - Update the "Equipamento" (Mobile/Tradicional) UI to behave as radio buttons. Clicking a selected option does nothing; clicking another switches it.
  - Apply the same radio-style behavior to "Finalidade" (Pessoal/Business).
- Ensure both fields remain visible when a Unidade Fixa is selected.

#### [MODIFY] [AdminSettings.tsx](file:///c:/foto-segundo/frontend/src/pages/admin/AdminSettings.tsx)

- Add a multi-checkbox UI section to allow Unidades Fixas (Cartórios) to define their supported `eventTypes`.
- Update the API payload when saving settings to include the selected `eventTypes`.

## User Review Required
> [!IMPORTANT]
> The database schema change will require running `npx prisma db push` or generating a migration.

## Verification Plan

### Automated Tests

- Run TS check and verify the backend build.

### Manual Verification

- **Admin Settings:** Log in as an admin/cartorio, edit a unit's settings, check event types, save, and reload to confirm persistence.
- **Quote Flow:** Go to `/cotacao`. Check that the global list shows initially. Select the edited unit. Verify the event types dropdown is filtered correctly. Change equipment and usage types, ensuring only one is selectable at a time and they look visually consistent.

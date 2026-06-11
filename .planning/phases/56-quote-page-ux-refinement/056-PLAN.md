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

#### [MODIFY] [QuoteDesktopView.tsx](file:///c:/foto-segundo/frontend/src/components/quote/QuoteDesktopView.tsx) & [QuoteMobileView.tsx](file:///c:/foto-segundo/frontend/src/components/quote/QuoteMobileView.tsx)

- **Nova Arquitetura de Passos (5 Passos):**
  - **Passo 1: Onde e Quando** (Local e Data)
  - **Passo 2: Dimensionamento** (Tipo de Evento, Duração, Dias, Convidados, Equipamento, Finalidade, Budget)
  - **Passo 3: A Jornada (Serviços)**
    - Categorizar os serviços em blocos visuais de linha do tempo:
      - _Pré evento:_ Ensaios, Save the Date
      - _Dia do evento:_ Fotografia, Vídeo Bruto, Reels, Phygital
      - _Pós evento:_ Álbum Impresso, Edição Premium
  - **Passo 4: Seus Dados** (Contato, Profissional preferencial, Obs)
  - **Passo 5: Confirmação** (Protocolo e CTAs)
- **Single-Select:** Garantir que "Equipamento" e "Finalidade" funcionem como radio buttons exclusivos.

#### [MODIFY] [AdminSettings.tsx](file:///c:/foto-segundo/frontend/src/pages/admin/AdminSettings.tsx)

- Add a multi-checkbox UI section to allow Unidades Fixas (Cartórios) to define their supported `eventTypes`.
- Update the API payload when saving settings to include the selected `eventTypes`.

## Open Questions

> [!WARNING]
> Para dividir os serviços em "Pré", "Durante" e "Pós", precisaremos de uma forma de mapear os serviços existentes para essas categorias.
> Podemos fazer isso no frontend através de um mapeamento estático (hardcoded com base nos nomes ou IDs dos serviços), ou podemos adicionar um campo `fase` no banco de dados para cada serviço.
> **Como você prefere? Mapeamento rápido no frontend ou controle total via banco de dados/admin?**

## User Review Required

> [!IMPORTANT]
> The database schema change will require running `npx prisma db push` or generating a migration.

## Verification Plan

### Automated Tests

- Run TS check and verify the backend build.

### Manual Verification

- **Admin Settings:** Log in as an admin/cartorio, edit a unit's settings, check event types, save, and reload to confirm persistence.
- **Quote Flow:** Go to `/cotacao`. Check that the global list shows initially. Select the edited unit. Verify the event types dropdown is filtered correctly. Change equipment and usage types, ensuring only one is selectable at a time and they look visually consistent.

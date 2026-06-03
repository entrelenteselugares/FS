<!-- generated-by: gsd-doc-writer -->

# Backend Controllers Overview

This document provides a high-level overview of the backend controllers in the Foto Segundo platform. The platform utilizes an MVC-style routing architecture on the backend, combining Express and Hono via Vercel Serverless.

## Core Domain Controllers

- **`event.controller.ts`**: Manages the lifecycle of standard events, including scheduling, status updates, and public details.
- **`flash.controller.ts`**: Handles Flash Events (anonymous events accessed via PIN).
- **`marketplace.controller.ts`**: Manages the sale of event media, Google Drive synchronization, and pricing rules.
- **`vault.controller.ts`**: Handles memory vaults (cofres digitais), enabling users to aggregate their purchased media and subscribe to premium plans.
- **`profissional.controller.ts`**: Specific logic for photographer and franchisee dashboard operations (creating custom services, managing portfolios).
- **`auth.controller.ts` & `access.controller.ts`**: User authentication, session management, and RBAC (Role-Based Access Control) verifications.

## Financial & Operational Controllers

- **`payment.controller.ts`**: Orchestrates checkout, cart logic, and interacts with Mercado Pago (`mercadopago.controller.ts`).
- **`finance_hub.controller.ts` & `payout.controller.ts`**: Manages splits, vendor payouts, and overall financial ledgers.
- **`print_catalog.controller.ts`**: Manages print catalogs, paper sizes, and pricing configurations for the physical printing operation.

## Phygital & IoT

- **`phygital.controller.ts`**: Manages real-time physical-digital bridge interactions, QR code sessions, and live stream handling.
- **`iot.controller.ts`**: Receives heartbeats and telemetry from remote printer agents running on local machines at events.

## Administration & Analytics

- **`admin.controller.ts`**: Super-user actions, global overrides, user management, and approval of custom services.
- **`analytics.controller.ts` & `report.controller.ts`**: Generates BI metrics, charts, and financial reports.

## Growth & CRM

- **`crm.controller.ts` & `cron.controller.ts`**: Manages leads, abandoned cart recovery, and scheduled tasks.
- **`growth.controller.ts`**: Manages coupons, affiliations, and promotional rules.

## Design Patterns

Controllers in this directory follow these conventions:

1. **Fat Services, Thin Controllers:** Most heavy business logic is offloaded to the `/services` layer. Controllers focus on HTTP validation (Zod schemas), parsing headers/tokens, and formatting the response.
2. **Error Handling:** All controller methods are wrapped in asynchronous `try/catch` blocks or use a wrapper utility to catch exceptions and return unified JSON errors (e.g., `400 BAD REQUEST`, `500 INTERNAL ERROR`).
3. **Typing:** Strict typing is enforced for `req.body`, `req.query`, and `req.params`.

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->

_Documentação criada automaticamente via GSD-SDK em 2026-06._

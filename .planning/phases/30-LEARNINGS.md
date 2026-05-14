---
phase: 30
phase_name: "Financial Intelligence & Fiscal Hardening"
project: "Foto Segundo"
generated: "2026-05-14T01:54:00Z"
counts:
  decisions: 3
  lessons: 2
  patterns: 2
  surprises: 1
missing_artifacts:
  - "30-VERIFICATION.md"
  - "30-UAT.md"
---

# Phase 30 Learnings: Financial Intelligence & Fiscal Hardening

## Decisions

### PDF Library Choice: pdfkit
Implemented `pdfkit` for backend PDF generation instead of heavier headless browser solutions.

**Rationale:** High performance for in-memory PDF generation, low overhead, and precise control over layout for fiscal documents.
**Source:** 30-PLAN.md

### Automatic Email Triggers
Decided to trigger payout receipt emails automatically upon administrative settlement in the Finance Hub.

**Rationale:** Ensures professional users receive immediate proof of payment without administrative manual work, improving trust.
**Source:** 30-financial-intelligence-CONTEXT.md

### On-The-Fly PDF Generation
Documents (Tax Reports/Receipts) are generated on-the-fly from database records rather than being stored.

**Rationale:** Keeps the database as the single source of truth and avoids storage/synchronization issues for sensitive financial data.
**Source:** 30-financial-intelligence-CONTEXT.md

---

## Lessons

### Email Attachment Integration
Integrating binary PDF buffers into `nodemailer` required updating the `EmailService` to handle dynamic attachment arrays.

**Context:** The existing service was designed for text/HTML only.
**Source:** email.service.ts implementation

### Weekly Bar Charts for Projections
Weekly grouping for cashflow projections provides the best balance between granularity and readability for professional users.

**Context:** Daily charts were too noisy, and monthly charts lacked the immediacy needed for short-term financial planning.
**Source:** 30-financial-intelligence-CONTEXT.md

---

## Patterns

### Financial Intelligence Helper Pattern
Created `ReportService.ts` as a stateless helper for all fiscal document generation (PDF and CSV).

**When to use:** When multiple controllers need to generate the same complex documents or when logic needs to be shared between email triggers and manual downloads.
**Source:** report.service.ts

### Cashflow Projection Mapping
Pattern of mapping `PayoutSettlement` release dates to week labels for Recharts.

**When to use:** Visualizing future receivables with clear, human-readable temporal labels.
**Source:** report.controller.ts

---

## Surprises

### Recharts Data Compatibility
Recharts handled the dynamic week labels without additional sorting logic being strictly required on the frontend, provided the backend sent them in chronological order.

**Impact:** Simplified the frontend `CashflowChart` component logic.
**Source:** CashflowChart.tsx

# PROJECT: Foto Segundo

## Overview

Foto Segundo is a premium platform designed for professional photographers, franchisees (Cartórios), and end clients. It bridges the gap between digital photography and physical products through an automated "Web-to-Print" engine, high-density administrative dashboards, and a luxury-focused user experience.

## Vision

To be the national standard for phygital (physical + digital) photography experiences, providing professionals with a robust toolset for growth and clients with a premium unboxing of their memories.

## Core Pillars

1. **Midnight Luxury UI/UX**: High-end aesthetic with dark mode priority and Barlow Condensed typography.
2. **Web-to-Print Automation**: Real-time IoT printing agent for immediate physical delivery.
3. **Flash Event Fulfillment**: Frictionless QR/PIN based anonymous photo delivery and conversion.
4. **Memory Vaults**: Production-grade cold storage integration (Google Drive) for long-term media persistence.
5. **Professional Management**: Integrated CRM, scheduling (Google Calendar), and financial payout engine.
6. **Resilient Infrastructure**: Supabase-backed backend with Prisma ORM and Vercel serverless deployment.

## Success Criteria

- [x] 100% automated print queue from order to local printer. (DONE)
- [x] Visual consistency across all 4 dashboard types (Master, Partner, Consumer, Ambassador). (DONE)
- [x] Zero-friction professional onboarding with experience validation. (DONE)
- [x] Robust financial auditability for franchises and payouts. (DONE - splits fully mathematically validated on Net Amount)
- [x] Real-time In-App Notification System for integrated communication. (DONE)
- [x] **Production Monitoring & SLOs**: Analytics and error tracking active for production go-live. (DONE)
- [x] **Full PWA Experience**: Native mobile interaction patterns and installability for field photographers. (DONE)
- [x] **Multi-Vertical Agility**: Support for School, Sports, and Event photography variations. (DONE)
- [x] **Growth & Retention Engine**: Dynamic coupons and advanced ambassador/referral programs. (DONE)
- [x] **Production Storage API**: Stable long-term cold storage via Google Drive OAuth in Production. (DONE)

## Current State

Shipped **v13.0 Scale & Optimization**. The platform has undergone optimization and scale preparation, including bidirectional WhatsApp AI attendant integration, advanced professional service customization, vault configuration features, and system-wide UI polish. The platform is stable and fully validated in production.

## Current Milestone: None (All planned milestones completed)

<details>
<summary>Archived Milestones</summary>

**v13.0 Scale & Optimization**
_Goal:_ Integrate automated conversational AI for customer engagement (WhatsApp) and implement custom service creations and media management.
_Outcome:_ Delivered Bidirectional WhatsApp AI Attendant (Baileys + Google Gemini Integration), Vault configuration/sorting/ACL controls, and Custom Service Submission with Admin Approval flows.

**v12.0 Unified Marketplace & Production Go-Live**
_Goal:_ Scale the marketplace with portfolio galleries, booking fee escrow payments, proximity search, and multi-tier affiliate programs.
_Outcome:_ Delivered Portfolio Galleries, Automated Booking Escrow, Proximity Search directory, Multi-Tier Affiliate system, and production telemetry monitoring.

**v11.0 Professional Governance & Marketplace Alpha**
_Goal:_ Enable administrative control over partner applications and provide public visibility for subscribed professionals.
_Outcome:_ Delivered Admin Approval Hub and the initial public Professional Directory with budget request integration.

**v10.0 Professional Network & Engagement**
_Goal:_ Transform the user profile into a growth engine by allowing role transitions and gamifying data completion.
_Outcome:_ Delivered Multi-Profile transitions, Role Switcher, and Gamified Profile Stepper.

**v9.0 B2B & White-Label Expansion**
_Goal:_ Empower franchisees and major partners with custom branding and advanced financial reporting.
_Outcome:_ Delivered Tenant White-Labeling, Custom Branding Renderer, and Advanced Financial Exports for v9.0. Added Express Registration (Phase 42) for frictionless QR onboarding.

**v8.0 MRR Engine**
_Goal:_ Enable recurring monthly revenue through Vault subscriptions.
_Outcome:_ Delivered hybrid free-to-pay vaults, Mercado Pago recurring billing webhook integration, auto-blocking cron jobs, and admin MRR reporting.

**v7.0 Expansão Total e Go-Live**

- **Go-Live Ops**: Sentry, Google Analytics, and CI/CD hardening.
- **PWA Implementation**: Service Workers, Push Notifications, and installability.
- **Vertical Diversification**: Schema and flow adaptations for School and Sports photography.
- **Growth Engine**: Advanced Coupon system and Affiliate Hub (Ambassadors).

</details>

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-24_

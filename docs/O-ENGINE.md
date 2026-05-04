# Unified Order Engine (O-Engine)

## Overview

The **O-Engine** is the centralized financial heart of the Foto Segundo platform. It handles all transaction types through a single, robust pipeline that ensures data integrity, automated splits, and real-time fulfillment signals.

## Supported Verticals

1. **Marketplace (Flow D)**: Unit photo sales for guests and logged users.
2. **B2B Upgrades**: Service catalog acquisitions (e.g., Live Print, Advanced Editing).
3. **Crowdfund (Cotas)**: Contribution-based event funding.
4. **Physical Upsells**: Print catalog orders (Albums, Canvas, Prints).

## Core Components

### 1. PricingService

Located at `backend/src/services/pricing.service.ts`.

- **Dynamic Pricing**: Calculates prices based on event date (Early Bird vs. Standard) and volume.
- **Split Logic**: Implements the 4-tier commission distribution.
- **Direct Sales Mode**: Optimized 10% platform fee for professional direct transactions.

### 2. PaymentController

Located at `backend/src/controllers/payment.controller.ts`.

- **Checkout Pro**: Secure hosted payment flow.
- **Transparent Checkout**: In-app PIX and Credit Card processing.
- **Idempotency**: Strict checks to prevent duplicate order processing.

## Order Lifecycle

1. **PENDING**: Order created with calculated splits and dynamic pricing.
2. **AUTHORIZED**: Payment confirmed by gateway (Mercado Pago).
3. **APPROVED**: Final status. Triggers automated fulfillment:
   - Digital Unlock (unlockedMediaIds).
   - IoT Print Signal (if Phygital).
   - Gamification point credit.

## Data Persistence

- **Order Table**: Stores the financial snapshot (Splits, Gateway IDs, Customer Metadata).
- **OrderItem Table**: Granular tracking of purchased media or physical products.

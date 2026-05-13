# Order Engine: Unified Transaction Logic

## Overview

The Order Engine is the core financial and fulfillment orchestration layer of Foto Segundo. It centralizes pricing calculations, payment gateway integration (Mercado Pago), and automated revenue splitting.

## 1. Transaction Models

The system supports four distinct sales channels, all routed through the same engine:

| Model | Description | Logic Source |
| :--- | :--- | :--- |
| **Marketplace** | Individual photo sales (B2C). | Price per photo (from Event config). |
| **Crowdfund** | Collective funding (Cotas de Presente). | User-defined contribution amount. |
| **Express Sale** | Direct point-of-sale (Totem/Balcão). | Fixed unit price with simplified 10% platform fee. |
| **Budget (CPQ)** | B2B/High-ticket event quotes. | Admin-approved custom values. |

## 2. Pricing Logic

Pricing is dynamic and depends on the event's lifecycle:

- **Early Bird**: Applied if the current date is before the event date.
- **Base Price**: Standard price applied from the event day onwards.
- **Unit Sale**: Fixed price for specific physical products or single-click access.

## 3. The Split Engine (`PricingService`)

Every successful payment is automatically divided among participants to eliminate manual reconciliation:

- **Matriz (Platform)**: Dynamic (Default: 40% for Marketplace, 10% for Express).
- **Captação (Photographer)**: Revenue for the professional who captured the content (Default: 30%).
- **Edição (Editor)**: Revenue for the professional responsible for post-processing (Default: 20%).
- **Cartório (Host)**: Revenue for the physical location partner (Default: 10%).
- **Franchisee (Passive)**: Referral commission (Default: 5%).

### Transaction Atomicity

All financial updates are wrapped in `prisma.$transaction` blocks to ensure that if the split logic fails, the payment status is not updated, preventing data corruption.

## 4. Payout Flow

1. **IPN Notification**: Webhook from Mercado Pago confirms payment.
2. **Order Activation**: Status changes to `APROVADO`.
3. **Escrow Hold**: Funds are held in a `PENDING` state.
4. **Safety Release**:
   - **PRO Verified**: Immediate release (`AVAILABLE`).
   - **Standard**: 7-day hold period to prevent chargebacks/fraud.
5. **Liquidation**: Admin initiates the transfer to the professional's bank account.

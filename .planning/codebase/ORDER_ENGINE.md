# Order Engine: Unified Transaction Motor (O-Engine)

The **Order Engine** is the heart of Foto Segundo's revenue generation. it manages the complexity of multi-vertical sales with a single, unified pipeline.

## 1. Transaction Types
The engine handles four distinct transaction flows:
- **B2B Upgrade**: Guests paying for full event access (Flash/Album Full).
- **Marketplace Sale**: Individual photo/video purchases (Flash Event).
- **Crowdfunding**: Collaborative funding for event coverage.
- **Phygital Print**: Physical product orders with logistics/shipping.

## 2. Split Logic (The "Penny Protocol")
Every cent that enters the platform is automatically divided using `PricingService.calculateSplits`.

| Entity | Role | Typical Split | Calculation Basis |
| :--- | :--- | :--- | :--- |
| **Matriz** | Plataforma | 20% - 50% | Base service fee |
| **Franqueado** | Host/Equipamento | 10% - 20% | Passive commission from team |
| **Profissional** | Captação/Edição | 30% - 50% | Active labor contribution |
| **Cartório** | Unidade Fixa | 10% | Fixed physical location fee |

## 3. Order Bifurcation (Fulfillment)
The engine determines the destination of each item in the order:
- **Digital Only**: Instant unlocking in the gallery via `unlockedMediaIds`.
- **Instant Print**: Routed to the local **IoT Printer Agent** queue (`/api/admin/phygital/queue`).
- **Lab Print**: Routed to external suppliers with automated shipping quote integration via `viacep` and local delivery services.

## 4. Financial Lifecycle
1. **Pending**: Order created, PIX/Card payload generated via Mercado Pago.
2. **Paid**: Webhook confirms receipt -> `prisma.$transaction` triggers:
   - Access unlock for the user.
   - Split distribution to internal wallets.
   - Gamification points attribution.
   - Fulfillment queue insertion.
3. **Completed**: Items delivered/printed.

## 5. Security & Integrity
- **Transactional Atomicities**: No split is recorded without the order being marked as `hasPaid`.
- **Idempotency**: All payment webhooks check `paymentId` uniqueness to prevent duplicate credits.

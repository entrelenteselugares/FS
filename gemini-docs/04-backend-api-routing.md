# 04. Backend API Routing - Foto Segundo

Comprehensive guide to the Express backend router configuration, middleware patterns, and core endpoints.

## 🧭 Router Modules Hierarchy

The API router in `src/routes/index.ts` exposes several sub-routers mapping specific business logic domains:

| Mount Path | File | Purpose | Authentication |
|---|---|---|---|
| `/admin` | `admin.routes.ts` | Matriz controls, verification, DB checks | `requireAuth` + `requireRole("ADMIN")` |
| `/auth` | `auth.routes.ts` | Login, Register, Google OAuth, password reset | Mixed (Public & Token verification) |
| `/checkout` | `checkout.routes.ts`| Mercado Pago checkout sessions & initial intents | Public / User Auth |
| `/webhooks` | `webhook.routes.ts` | Mercado Pago checkout webhooks | Public (HMAC/Token signed) |
| `/vaults` | `vault.routes.ts` | Media Vault creation, pricing, configurations | `requireAuth` |
| `/public` | `public.routes.ts` | Public events, proximity search, professional list | Public / Optional Auth |
| `/franchise` | `franchise.routes.ts`| Franchise-specific stats, payouts, operations | `requireAuth` + `requireRole("CARTORIO", "FRANCHISEE")` |
| `/profissional`| `professional.routes.ts`| Photographer schedules, galleries, media upload | `requireAuth` + `requireProOrFranchise` |
| `/portfolio` | `portfolioRoutes.ts` | Pro portfolio image array uploads & retrievals | Mixed (Public GET, Protected PATCH) |
| `/worldcup` | `worldcup.routes.ts` | Torcida Album, digital sticker validations | `requireAuth` |

---

## 🔒 Middleware Pipeline Patterns

Endpoints are wrapped in helper middlewares to enforce security, caching, and role restrictions:

1. **`requireAuth`**:
   - Decodes the `Authorization: Bearer <JWT>` header.
   - Attaches `req.user` (containing ID, email, role) to the Request context.
2. **`requireRole(...roles)`**:
   Enforces that `req.user.role` matches at least one of the specified roles (e.g. `ADMIN`, `CARTORIO`, `FRANCHISEE`).
3. **`requireProOrFranchise`**:
   Bypasses strictly for Photographers (`PROFISSIONAL`) and Franchise owners, who share file upload & event editing capabilities.
4. **`cacheMiddleware`**:
   Intercepts GET requests for read-heavy public endpoints. Checks Redis or in-memory cache, short-circuiting DB hits.

---

## ⚙️ Cron & Daemon Endpoints

The system exposes specific cron routes triggered periodically (e.g., via Vercel Cron jobs) protected by a `CRON_SECRET` header:

- **`GET /cron/expiration`**: Cancels expired event reservations and auto-updates statuses.
- **`GET /cron/loyalty-bot`**: Recalculates user engagement milestones and rewards points.
- **`GET /cron/escrow-release`**: Processes escrow payments, releasing splits to photographers and franchises after verification windows close.
- **`GET /cron/calendar-sync`**: Bidirectionally syncs local booking slots with Google Calendar.
- **`GET /cron/vault-cycle`**: Charges recurring subscriptions for inactive/archived media vault accounts.
- **`GET /cron/abandoned-carts`**: Sends automated recovery prompts to customers with uncompleted checkout sessions.

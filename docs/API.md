<!-- GSD:API -->
# API Reference: Foto Segundo

This document describes the REST API for the Foto Segundo platform.

## Authentication

Most endpoints require a JSON Web Token (JWT).

- **Header:** `Authorization: Bearer <token>`
- **Acquisition:** Call `/api/auth/login` with valid credentials.
- **Expiration:** Default token life is 7 days.

## Endpoints Overview

### 🔐 Authentication
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/login` | Authenticates a user and returns a JWT. | No |
| `POST` | `/api/auth/register` | Registers a new client account. | No |
| `POST` | `/api/auth/refresh` | Refreshes the JWT session. | No |
| `GET` | `/api/auth/me` | Returns current user profile. | Yes |

### 📸 Events & Phygital
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/public/events` | Lists all public events. | No |
| `GET` | `/api/public/events/:slug` | Gets detailed info for a specific event. | No |
| `POST` | `/api/public/quotes` | Submits a new event booking request. | No |
| `POST` | `/api/public/phygital/upload` | Uploads a photo for instant printing. | No |
| `POST` | `/api/profissional/flash-event` | Creates a new Flash Event. | Pro |
| `POST` | `/api/profissional/foto-point` | Creates a new Foto Point event. | Pro |
| `GET` | `/api/flash/:shortId` | Resolves a Flash Event PIN for anonymous access. | No |
| `GET` | `/api/flash/:eventId/stats` | Aggregated live metrics for a Flash Event (funnel, print queue). | Pro/Admin |

### 🛒 Marketplace & Checkout
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/marketplace/events/:id/media` | Uploads media for unit sale. | Pro |
| `POST` | `/api/marketplace/events/:id/sync-drive` | Triggers bulk media sync from Google Drive with automated metadata extraction. | Pro |
| `PATCH` | `/api/marketplace/media/:mediaId/metadata` | Manually updates media metadata (studentId/bibNumber). | Admin |
| `GET` | `/api/marketplace/events/:id/media` | Lists media for purchase. | Opt |
| `POST` | `/api/checkout/payment` | Processes a payment via Mercado Pago. | Opt |
| `GET` | `/api/checkout/shipping-quote` | Calculates shipping for physical orders. | Opt |

### 🏛️ Memory Vaults (Cofres)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/vaults` | Lists user's memory albums. | Yes |
| `POST` | `/api/vaults` | Creates a new memory album. | Yes |
| `GET` | `/api/vaults/:albumId` | Gets album details and media. | Yes |
| `POST` | `/api/vaults/:albumId/subscribe` | Subscribes to a recurring vault plan. | Yes |

### 📡 IoT & Administration
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/iot/heartbeat` | Telemetry endpoint for Printer Agents. | No |
| `GET` | `/api/admin/stats` | High-level dashboard statistics. | Admin |
| `GET` | `/api/admin/events` | Lists all events for administration. | Admin |
| `GET` | `/api/admin/users` | Lists all users for management. | Admin |
| `GET` | `/api/admin/payouts` | Lists financial repasses. | Admin |
| `GET` | `/api/health` | System health check (Ultra-early). | No |

### 📈 CRM & Leads
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/public/crm/leads` | Captures a new interest lead from gallery. | No |
| `GET` | `/api/admin/crm/leads` | Lists all captured leads with metadata. | Admin |
| `GET` | `/api/admin/crm/abandoned-carts` | Lists pending orders older than 1h. | Admin |
| `GET` | `/api/admin/crm/stats` | Real-time recovery metrics (revenue, conversion). | Admin |
| `GET` | `/api/cron/crm-recovery` | Triggers automated recovery emails (Cron). | No* |
| `POST` | `/api/cron/abandoned-carts` | Triggers abandoned cart recovery job (24h threshold). | Cron* |

*Note: `/cron/*` routes require `CRON_SECRET` Bearer token.

### 📈 Growth Engine
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/marketplace/coupons/:code/validate` | Validates a coupon code, returning discount details. | No |
| `GET` | `/api/admin/coupons` | Lists all coupons with usage stats. | Admin |
| `POST` | `/api/admin/coupons` | Creates a new coupon. | Admin |
| `GET` | `/api/admin/ambassadors` | Lists all users with Ambassador/Affiliate role. | Admin |
| `GET` | `/api/admin/whatsapp/status` | Returns WhatsApp session status (connected/disconnected + QR code). | Admin |
| `GET` | `/api/admin/whatsapp/qr` | Returns the current QR code for WhatsApp session pairing. | Admin |

## Request/Response Formats

The API uses JSON for all request and response bodies.

### Standard Success Response

```json
{
  "ok": true,
  "data": { ... }
}
```

### Standard Error Response

```json
{
  "error": "Message describing the failure",
  "code": "ERROR_CODE"
}
```

## Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| `401` | `UNAUTHORIZED` | Token missing, invalid, or expired. |
| `403` | `FORBIDDEN` | User does not have the required role (e.g., ADMIN). |
| `404` | `NOT_FOUND` | The requested resource does not exist. |
| `422` | `VALIDATION_FAILED` | Request body failed schema validation. |
| `500` | `INTERNAL_SERVER_ERROR` | An unexpected server error occurred. |

## Rate Limits

The API implements rate limiting to prevent abuse:

- **Auth Routes:** 5 requests per 15 minutes per IP.
- **Public API:** 100 requests per 15 minutes per IP.
- **IoT Heartbeat:** No specific limit (throttled by agent frequency).

<!-- VERIFY: Base URL for production API -->
<!-- VERIFY: Rate limit exact values from Express middleware -->

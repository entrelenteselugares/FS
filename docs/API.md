<!-- generated-by: gsd-doc-writer -->
# API Reference: Foto Segundo

This document describes the REST API for the Foto Segundo platform.

## Authentication

Most endpoints require a JSON Web Token (JWT).

- **Header:** `Authorization: Bearer <token>`
- **Acquisition:** Call `/api/auth/login` with valid credentials.
- **Expiration:** Default token life is 7 days.

## Endpoints Overview

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/login` | Authenticates a user and returns a JWT. | No |
| `POST` | `/api/auth/register` | Registers a new client account. | No |
| `GET` | `/api/auth/me` | Returns current user profile. | Yes |
| `GET` | `/api/public/events` | Lists all public events. | No |
| `GET` | `/api/public/events/:slug` | Gets detailed info for a specific event. | No |
| `POST` | `/api/public/quotes` | Submits a new event booking request/quote. | No |
| `POST` | `/api/profissional/flash-event` | Creates a new Flash Event. | Pro |
| `POST` | `/api/public/phygital/upload` | Uploads a photo for instant printing. | No |
| `POST` | `/api/checkout/payment` | Processes a payment via Mercado Pago. | Opt |
| `POST` | `/api/iot/heartbeat` | Telemetry endpoint for Printer Agents. | No |
| `GET` | `/api/flash/:shortId` | Resolves a Flash Event PIN for anonymous access. | No |
| `GET` | `/api/payouts/me` | Returns professional/unit financial summary. | Yes |
| `GET` | `/api/unidade-fixa/stats` | Returns Unidade Fixa operational KPIs. | Unidade |
| `GET` | `/api/unidade-fixa/events` | Lists assigned events for the unit. | Unidade |
| `GET` | `/api/admin/stats` | High-level dashboard statistics. | Admin |
| `GET` | `/api/admin/events` | Lists all events for administration. | Admin |
| `GET` | `/api/admin/events/:id` | Gets full operational details of an event. | Admin |
| `PATCH` | `/api/admin/events/:id` | Updates event briefing, staff, and logistics. | Admin |
| `GET` | `/api/admin/quotes` | Lists all submitted booking requests. | Admin |

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

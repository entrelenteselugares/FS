# Technical Concerns: Foto Segundo

## Technical Debt

- **MarketplaceController**: Growing complexity; consider refactoring into vertical-specific handlers.
- **Frontend Prop Drilling**: Some dashboard components are becoming deeply nested; explore more Context or Jotai usage.

## Performance & Scalability

- **Supabase Connection Limits**: High-concurrency events may hit the 60-connection pool limit; monitoring required.
- **Image Processing**: High-resolution gallery uploads may cause Vercel timeout; consider background workers if volume increases.

## Security

- **OAuth Tokens**: Ensure encryption at rest for Mercado Pago credentials.
- **Access Links**: Magic links are convenient but vulnerable to social engineering; monitor for abnormal access patterns.

## Business Continuity

- **Printer Agent Stability**: Dependencies on local OS drivers (CUPS/Windows Spooler) introduce local-environment risk.
- **Exchange Rate Dependency**: pricing multiplier relies on AwesomeAPI; ensure fallback rates are robust.

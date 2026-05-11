# Coding & UI Conventions - Foto Segundo

Standard patterns ensuring maintainability and visual excellence.

## 🛠️ Code Conventions (Backend)

- **Service Layer First**: Avoid logic in controllers. All business rules must reside in `src/services`.
- **Response Consistency**: Always return JSON with structured error messages for frontend toast mapping.
- **Prisma Transactions**: Use `$transaction` for operations involving financial records (pedidos, repasses).
- **Environment Parity**: Always use `dotenv` for configuration, never hardcode endpoints.

## 🎨 UI/UX Conventions (Frontend)

- **Rich Aesthetics Policy**:
  - No plain browser defaults.
  - Use gradients, micro-animations (Framer Motion), and glassmorphism.
- **Location Sanitization**: Never show "CEP:" strings to the user. Prioritize `city` name or descriptive location strings.
- **Responsive Stacking**: Layouts must be built mobile-first, ensuring touch targets are at least 44px.
- **Typography**: Strictly use Design System tokens from `T` (Theme) library.

## 🔒 Security Conventions

- **RBAC**: Middleware-based role verification for all sensitive routes (`ADMIN`, `FRANCHISE`, `PROFISSIONAL`).
- **Data Privacy**: Mask sensitive customer data (phones, emails) in public-facing views.
- **JWT Lifespan**: Use short-lived access tokens with secure refresh cycles.

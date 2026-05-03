# Conventions - Foto Segundo

## Coding Standards
- **Strong Typing**: Absolute avoidance of `: any`. Use explicit interfaces or `unknown`.
- **Semantic UI**: Use theme-based design tokens (e.g., `bg-theme-bg`, `text-theme-text`) instead of hardcoded hex colors or Tailwind zinc/slate.
- **Naming**: 
  - Components: PascalCase.
  - Utilities/Variables: camelCase.
  - Database Tables: snake_case (mapped in Prisma).
- **Error Handling**: Use `try/catch` with `instanceof Error` checks and meaningful log messages.

## React Patterns
- **Functional Components**: Use arrow functions and hooks.
- **Prop Typing**: Explicit TypeScript interfaces for all component props.
- **Separation of Concerns**: Business logic in hooks/services, UI in components.

## Backend Patterns
- **Controller/Service**: Routes call controllers, controllers call services for logic.
- **Prisma Transactions**: Use `$transaction` for operations requiring atomicity (CRITICAL for financial logic).
- **Financial Logic**: Calculations MUST be performed in the Backend (`PricingService`).
- **Security**: Mandatory `x-master-key` or JWT validation for sensitive endpoints.

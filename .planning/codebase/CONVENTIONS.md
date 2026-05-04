# Coding Conventions: Foto Segundo

## General Rules

- **Type Safety**: TypeScript is mandatory. Use interfaces for all data structures. Avoid `any`.
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces, snake_case for database maps.

## Design Patterns

- **Controllers**: Should be thin, delegating complex logic to Services.
- **Services**: Pure business logic, independent of request/response objects.
- **Auditing**: Every critical business mutation (Sale, Payout, Profile Update) MUST call the `audit()` utility.

## Styling (Midnight Luxury)

- Use CSS Variables defined in `index.css`.
- Colors: `theme-bg`, `theme-text`, `brand-tactical` (Gold).
- Font: Heading (Playfair Display/Outfit), Body (Inter).

## Data Integrity

- **Transactions**: Use `prisma.$transaction` for multi-table writes.
- **Ledger**: Never modify reward credits without an accompanying `GamificationLedger` entry.

## Git & Workflow

- GSD-based planning before implementation.
- Commit messages should be descriptive and linked to phase/objective.

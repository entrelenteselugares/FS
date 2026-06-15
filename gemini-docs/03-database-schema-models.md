# 03. Database Schema & Models - Foto Segundo

Comprehensive outline of the PostgreSQL database structure managed via Prisma ORM (`schema.prisma`).

## 🔑 Core Entities

### 1. User (`users` table)

Represents all accounts in the system (Consumers, Photographers, Franchisees/Cartórios, and Admin).

- **Key Fields**:
  - `id` (CUID, Primary Key)
  - `email` (Unique, String)
  - `senha` (Hashed Password)
  - `role` (Enum: `CLIENTE`, `PROFISSIONAL`, `CARTORIO`, `ADMIN`, `FRANCHISEE`, `AMBASSADOR`)
  - `whatsapp` (String, Optional)
  - `mpAccessToken`, `mpPublicKey` (Mercado Pago OAuth integration for splits)
  - `referralCode` (Unique, used in referral campaigns)
  - `referredById` (Self-relation for multi-tier affiliate tracking)
  - `tenantBrandColor`, `tenantLogoUrl` (B2B white-labeling configurations)

### 2. Event (`events` table)

Represents a photography event (Wedding, Graduation, Sports matches, etc.).

- **Key Fields**:
  - `id` (CUID, Primary Key)
  - `title`, `slug` (Unique)
  - `category` (Enum: `CASAMENTO`, `FORMATURA`, `ESPORTE`, etc.)
  - `dataEvento` (DateTime)
  - `priceBase` (Default package price)
  - `priceUnit` (Individual photo price)
  - `deliveryType` (`DIGITAL_ONLY`, `PHYSICAL_ONLY`, `HYBRID`)
  - `paymentModel` (`PRE_PAID`, `POST_PAID`)
  - **Relations**:
    - `captacaoId` / `edicaoId`: References the Photographer/Editor (`User`) responsible for capture/edit.
    - `franchiseeId`: References the Franchise (`FranchiseProfile`) managing the local event.

### 3. Order (`orders` table)

Manages financial transactions, split calculations, and fulfillment status.

- **Key Fields**:
  - `id` (CUID, Primary Key)
  - `valor` (Decimal, Total order amount)
  - `status` (String, e.g., `PENDENTE`, `PAGO`, `CANCELADO`)
  - `paymentId` (Unique ID from Mercado Pago)
  - **Split Payout Details**:
    - `splitCaptacao` (Photographer split)
    - `splitCartorio` (Franchisee split)
    - `splitEdicao` (Editor split)
    - `splitMatriz` (Platform split)
    - `splitAffiliateL1`, `splitAffiliateL2` (Multi-tier referral commissions)
  - **Status Fields**:
    - `payoutStatus` (Enum: `PENDING`, `READY`, `PAID`)
    - `fulfillmentStatus` (Enum: `PENDING`, `PRINTING`, `SHIPPED`, `DELIVERED`)

---

## 📸 Media & Physical Entities

### 4. EventReference (`event_references` table)

Used for portfolio previews or external media references associated with an event.

- **Key Fields**:
  - `eventId` (Foreign key to `Event`)
  - `type` (String, `IMAGE` | `YOUTUBE`)
  - `url` (String, source URL)

### 5. PhygitalPrint (`phygital_prints` table)

Print job queue items processed by local print agents.

- **Key Fields**:
  - `referenceCode` (Unique alphanumeric validation PIN)
  - `imageUrl` (S3/Cloud storage URL of the photo to print)
  - `status` (Enum: `PENDING_PRINT`, `PRINTED`, `FAILED`)
  - `eventId` (Event context)

### 6. Profissional (`profissionais` table)

Extends the `User` table with photographer-specific credentials.

- **Key Fields**:
  - `userId` (Unique, references `User.id`)
  - `services` (String array of categories)
  - `cameras`, `lenses`, `lighting` (JSON arrays of equipment)
  - `hourlyRate` (Decimal)
  - `experienceYears` (Int)
  - `isExperienceValidated` (Boolean verification status)

### 7. Cartorio (`cartorios` table)

Extends the `User` table with Franchise/Physical Cartório info.

- **Key Fields**:
  - `userId` (Unique, references `User.id`)
  - `razaoSocial`, `cnpj` (Unique)
  - `splitPct` (Revenue split percentage)
  - `workingHours` (JSON configuration for operational slots)

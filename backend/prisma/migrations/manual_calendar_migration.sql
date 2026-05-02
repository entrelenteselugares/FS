-- ============================================================
-- Migration: add_calendar_oauth_tables
-- Gerado em: 2026-05-02
-- Aplicar via: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enums (PostgreSQL)
DO $$ BEGIN
  CREATE TYPE "SlotStatus" AS ENUM ('BLOCKED', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SlotSource" AS ENUM ('MANUAL', 'BOOKING', 'GOOGLE_SYNC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela: user_calendar_credentials
-- Armazena tokens OAuth2 por usuário (DEVEM ser criptografados em repouso pela aplicação)
CREATE TABLE IF NOT EXISTS "user_calendar_credentials" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "provider"     TEXT NOT NULL DEFAULT 'google',
    "accessToken"  TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "calendarId"   TEXT NOT NULL DEFAULT 'primary',
    "scope"        TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_credentials_pkey" PRIMARY KEY ("id")
);

-- Índice único: um usuário, uma credencial por provider
CREATE UNIQUE INDEX IF NOT EXISTS "user_calendar_credentials_userId_key"
  ON "user_calendar_credentials"("userId");

-- FK para users
ALTER TABLE "user_calendar_credentials"
  DROP CONSTRAINT IF EXISTS "user_calendar_credentials_userId_fkey";
ALTER TABLE "user_calendar_credentials"
  ADD CONSTRAINT "user_calendar_credentials_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabela: calendar_slots
-- FONTE DA VERDADE de disponibilidade. O sistema nunca consulta o Google em tempo real.
CREATE TABLE IF NOT EXISTS "calendar_slots" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "startAt"       TIMESTAMP(3) NOT NULL,
    "endAt"         TIMESTAMP(3) NOT NULL,
    "status"        "SlotStatus" NOT NULL DEFAULT 'BLOCKED',
    "source"        "SlotSource" NOT NULL DEFAULT 'MANUAL',
    "eventId"       TEXT,
    "googleEventId" TEXT,
    "title"         TEXT,
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_slots_pkey" PRIMARY KEY ("id")
);

-- Índice composto para queries de disponibilidade (crítico para performance)
CREATE INDEX IF NOT EXISTS "calendar_slots_userId_startAt_endAt_idx"
  ON "calendar_slots"("userId", "startAt", "endAt");

-- FK para users
ALTER TABLE "calendar_slots"
  DROP CONSTRAINT IF EXISTS "calendar_slots_userId_fkey";
ALTER TABLE "calendar_slots"
  ADD CONSTRAINT "calendar_slots_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK para events (nullable)
ALTER TABLE "calendar_slots"
  DROP CONSTRAINT IF EXISTS "calendar_slots_eventId_fkey";
ALTER TABLE "calendar_slots"
  ADD CONSTRAINT "calendar_slots_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Verificação final
-- ============================================================
SELECT 'user_calendar_credentials' AS tabela, COUNT(*) AS linhas FROM "user_calendar_credentials"
UNION ALL
SELECT 'calendar_slots', COUNT(*) FROM "calendar_slots";

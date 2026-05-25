ALTER TABLE "events" RENAME COLUMN "nomeNoivos" TO "title";
ALTER TABLE "events" ADD COLUMN "category" "EventCategory" NOT NULL DEFAULT 'CASAMENTO';

-- Add date and sessionTypeId columns (nullable for the backfill step)
ALTER TABLE "observation" ADD COLUMN "date" date;
ALTER TABLE "observation" ADD COLUMN "session_type_id" uuid REFERENCES "session_type"("id") ON DELETE cascade;

-- Backfill: resolve sessionId → (date, sessionTypeId) via termSession + sessionType
UPDATE "observation" o
SET
  "date" = ts.date,
  "session_type_id" = st.id
FROM "term_session" ts
JOIN "session_type" st ON st.name = ts.label AND st.active = true AND st.deleted_at IS NULL
WHERE o.session_id = ts.id;

-- Make columns NOT NULL after backfill
ALTER TABLE "observation" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "observation" ALTER COLUMN "session_type_id" SET NOT NULL;

-- Add unique constraint on (kidId, date)
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_date_unique" UNIQUE ("kid_id", "date");

-- Update meta table
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ('observation_rekey_20260721', NOW());

-- Add date and sessionTypeId columns (nullable for the backfill step)
ALTER TABLE "daily_class_report" ADD COLUMN "date" date;
ALTER TABLE "daily_class_report" ADD COLUMN "session_type_id" uuid REFERENCES "session_type"("id") ON DELETE cascade;

-- Backfill: resolve sessionId -> (date, sessionTypeId) via termSession + sessionType
UPDATE "daily_class_report" dcr
SET
  "date" = ts.date,
  "session_type_id" = st.id
FROM "term_session" ts
JOIN "session_type" st ON st.name = ts.label AND st.active = true AND st.deleted_at IS NULL
WHERE dcr.session_id = ts.id;

-- Make columns NOT NULL after backfill
ALTER TABLE "daily_class_report" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "daily_class_report" ALTER COLUMN "session_type_id" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_date_session_type_id_unique" UNIQUE ("date", "session_type_id");

-- Update meta table
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ('dcr_rekey_20260721', NOW());

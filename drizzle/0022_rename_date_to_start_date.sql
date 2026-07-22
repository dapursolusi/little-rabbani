-- Rename `date` → `start_date` and add `end_date` in schedule_item
-- The `date` column was originally mapped to `startDate` in the schema but
-- the column name was wrong due to a copy-paste bug.

ALTER TABLE "schedule_item" RENAME COLUMN "date" TO "start_date";--> statement-breakpoint
ALTER TABLE "schedule_item" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "end_date" date;--> statement-breakpoint
UPDATE "schedule_item" SET "end_date" = "start_date";--> statement-breakpoint
ALTER TABLE "schedule_item" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
-- Rebuild the index to use the renamed column
DROP INDEX IF EXISTS "schedule_item_date_session_type_idx";--> statement-breakpoint
CREATE INDEX "schedule_item_date_session_type_idx" ON "schedule_item" USING btree ("start_date","session_type_id");

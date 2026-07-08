-- Drop FK constraints before altering column types
ALTER TABLE "monthly_report_snapshot" DROP CONSTRAINT IF EXISTS "monthly_report_snapshot_edited_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" DROP CONSTRAINT IF EXISTS "quarterly_report_snapshot_edited_by_fkey";
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" DROP CONSTRAINT IF EXISTS "quarterly_report_snapshot_edited_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ALTER COLUMN "edited_by" SET DATA TYPE uuid USING edited_by::uuid;
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ALTER COLUMN "edited_by" SET DATA TYPE uuid USING edited_by::uuid;
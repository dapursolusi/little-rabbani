-- Lifecycle: generated|edited|sent → draft|reviewed|sent.
-- Manual-edit tracking moves out of the lifecycle into the is_edited flag, so
-- legacy 'edited' rows are mapped to draft and flagged as manually edited.

ALTER TABLE "monthly_kid_report" ADD COLUMN "is_edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "monthly_kid_report" SET "is_edited" = true WHERE "report_status" = 'edited';--> statement-breakpoint

ALTER TABLE "monthly_kid_report" ALTER COLUMN "report_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ALTER COLUMN "report_status" SET DEFAULT 'draft'::text;--> statement-breakpoint
UPDATE "monthly_kid_report" SET "report_status" = 'draft' WHERE "report_status" IN ('generated', 'edited') OR "report_status" IS NULL;--> statement-breakpoint
DROP TYPE "public"."monthly_report_status";--> statement-breakpoint
CREATE TYPE "public"."monthly_report_status" AS ENUM('draft', 'reviewed', 'sent');--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ALTER COLUMN "report_status" SET DEFAULT 'draft'::"public"."monthly_report_status";--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ALTER COLUMN "report_status" SET DATA TYPE "public"."monthly_report_status" USING "report_status"::"public"."monthly_report_status";--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ALTER COLUMN "report_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD COLUMN "sent_by" text;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mkr_kid_id_idx" ON "monthly_kid_report" USING btree ("kid_id");--> statement-breakpoint
CREATE INDEX "mkr_term_id_idx" ON "monthly_kid_report" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "mkr_sent_by_idx" ON "monthly_kid_report" USING btree ("sent_by");

-- Combined migration: add re-key columns + drop termSession (Issues #35-#40)
-- Covers all expand phases and contract phase in one shot.

ALTER TABLE "daily_class_report" ADD COLUMN "date" date NOT NULL;
ALTER TABLE "daily_class_report" ADD COLUMN "session_type_id" uuid NOT NULL;
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "daily_report_snapshot" ADD COLUMN "date" date NOT NULL;
ALTER TABLE "daily_report_snapshot" ADD COLUMN "session_type_id" uuid NOT NULL;
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "observation" ADD COLUMN "date" date NOT NULL;
ALTER TABLE "observation" ADD COLUMN "session_type_id" uuid NOT NULL;
ALTER TABLE "observation" ADD CONSTRAINT "observation_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "reminder_log" ADD COLUMN "date" date;
ALTER TABLE "reminder_log" ADD COLUMN "session_type_id" uuid;
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_date_session_type_id_unique" UNIQUE("date","session_type_id");--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_date_unique" UNIQUE("kid_id","date");--> statement-breakpoint

ALTER TABLE "daily_report_snapshot" DROP CONSTRAINT IF EXISTS "daily_report_snapshot_kid_id_session_id_unique";
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_kid_id_date_unique" UNIQUE("kid_id","date");--> statement-breakpoint

-- Contract phase: drop termSession + orphan sessionId columns

ALTER TABLE "daily_class_report" DROP CONSTRAINT IF EXISTS "daily_class_report_session_id_term_session_id_fk";
ALTER TABLE "daily_class_report" DROP COLUMN IF EXISTS "session_id";--> statement-breakpoint

ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_session_id_term_session_id_fk";
ALTER TABLE "observation" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_kid_id_session_id_unique";--> statement-breakpoint

ALTER TABLE "daily_report_snapshot" DROP CONSTRAINT IF EXISTS "daily_report_snapshot_session_id_term_session_id_fk";
ALTER TABLE "daily_report_snapshot" DROP COLUMN IF EXISTS "session_id";--> statement-breakpoint

ALTER TABLE "reminder_log" DROP CONSTRAINT IF EXISTS "reminder_log_session_id_term_session_id_fk";
ALTER TABLE "reminder_log" DROP COLUMN IF EXISTS "session_id";--> statement-breakpoint

ALTER TABLE "schedule_item" DROP CONSTRAINT IF EXISTS "schedule_item_session_id_term_session_id_fk";
ALTER TABLE "schedule_item" DROP COLUMN IF EXISTS "session_id";--> statement-breakpoint

DROP TABLE IF EXISTS "term_session";

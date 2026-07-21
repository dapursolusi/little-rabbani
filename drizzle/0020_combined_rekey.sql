ALTER TABLE "daily_report_snapshot" DROP CONSTRAINT "daily_report_snapshot_kid_id_session_id_unique";--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD COLUMN "session_type_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD COLUMN "session_type_id" uuid;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_kid_id_date_unique" UNIQUE("kid_id","date");

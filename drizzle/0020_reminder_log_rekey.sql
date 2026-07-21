ALTER TABLE "reminder_log" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD COLUMN "session_type_id" uuid;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE set null ON UPDATE no action;

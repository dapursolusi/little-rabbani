ALTER TABLE "schedule_item" RENAME TO "calendar_event";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "schedule_item_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "schedule_item_sub_theme_id_sub_theme_id_fk";
--> statement-breakpoint
DROP INDEX "schedule_item_date_session_type_idx";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_sub_theme_id_sub_theme_id_fk" FOREIGN KEY ("sub_theme_id") REFERENCES "public"."sub_theme"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_date_session_type_idx" ON "calendar_event" USING btree ("start_date","session_type_id");
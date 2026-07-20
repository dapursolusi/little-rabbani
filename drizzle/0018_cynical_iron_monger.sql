ALTER TABLE "schedule_item" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "session_type_id" uuid;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_session_type_id_session_type_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_item_date_session_type" ON "schedule_item" USING btree ("date","session_type_id");
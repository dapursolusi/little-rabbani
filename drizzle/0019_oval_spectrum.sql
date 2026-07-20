DROP INDEX "schedule_item_date_session_type";--> statement-breakpoint
CREATE INDEX "schedule_item_date_session_type_idx" ON "schedule_item" USING btree ("date","session_type_id");
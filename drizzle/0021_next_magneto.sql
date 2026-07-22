DROP INDEX "daily_class_report_date_session_type_id_unique";--> statement-breakpoint
DROP INDEX "daily_report_snapshot_kid_id_date_unique";--> statement-breakpoint
DROP INDEX "observation_kid_id_date_unique";--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_date_session_type_id_unique" UNIQUE("date","session_type_id");--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_kid_id_date_unique" UNIQUE("kid_id","date");--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_date_unique" UNIQUE("kid_id","date");
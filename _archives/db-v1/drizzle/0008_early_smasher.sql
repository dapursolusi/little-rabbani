ALTER TABLE "daily_class_report" ALTER COLUMN "captured_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "observation" ALTER COLUMN "teacher_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_session_id_unique" UNIQUE("kid_id","session_id");--> statement-breakpoint
ALTER TABLE "observation_activity" ADD CONSTRAINT "observation_activity_observation_id_dcr_activity_id_unique" UNIQUE("observation_id","dcr_activity_id");
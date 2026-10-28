CREATE TYPE "public"."report_status" AS ENUM('draft', 'template', 'edited', 'sent');--> statement-breakpoint
ALTER TYPE "public"."enrollment_status" ADD VALUE 'completed';--> statement-breakpoint
ALTER TYPE "public"."enrollment_status" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE TABLE "daily_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dcr_observation_id" uuid NOT NULL,
	"narrative" text,
	"report_status" "report_status" DEFAULT 'template',
	"sent_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "daily_report_dcr_observation_uniq" UNIQUE("dcr_observation_id")
);
--> statement-breakpoint
ALTER TABLE "kid" ALTER COLUMN "active_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kid" ALTER COLUMN "active_status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."active_status";--> statement-breakpoint
CREATE TYPE "public"."active_status" AS ENUM('registered', 'active', 'inactive');--> statement-breakpoint
ALTER TABLE "kid" ALTER COLUMN "active_status" SET DEFAULT 'active'::"public"."active_status";--> statement-breakpoint
ALTER TABLE "kid" ALTER COLUMN "active_status" SET DATA TYPE "public"."active_status" USING "active_status"::"public"."active_status";--> statement-breakpoint
ALTER TABLE "report_template" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_dcr_observation_id_dcr_observation_id_fk" FOREIGN KEY ("dcr_observation_id") REFERENCES "public"."dcr_observation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_report_dcr_observation_idx" ON "daily_report" USING btree ("dcr_observation_id");--> statement-breakpoint
ALTER TABLE "dcr_observation" DROP COLUMN "narrative_generated";--> statement-breakpoint
ALTER TABLE "dcr_observation" DROP COLUMN "narrative_edited";
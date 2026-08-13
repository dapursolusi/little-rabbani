CREATE TYPE "public"."monthly_report_status" AS ENUM('draft', 'final', 'stale');--> statement-breakpoint
CREATE TABLE "monthly_report_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"month" text NOT NULL,
	"stats_json" jsonb NOT NULL,
	"narrative_ai_draft" text,
	"narrative_final" text,
	"locked_observation_ids" jsonb,
	"status" "monthly_report_status" DEFAULT 'draft' NOT NULL,
	"edited_by" uuid,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_report_snapshot_kid_id_month_unique" UNIQUE("kid_id","month")
);
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ALTER COLUMN "structured_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ALTER COLUMN "edited_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ADD CONSTRAINT "monthly_report_snapshot_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ADD CONSTRAINT "monthly_report_snapshot_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ADD CONSTRAINT "monthly_report_snapshot_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
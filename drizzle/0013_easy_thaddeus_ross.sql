CREATE TYPE "public"."quarterly_report_status" AS ENUM('draft', 'final', 'stale');--> statement-breakpoint
CREATE TABLE "quarterly_report_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"stats_json" jsonb,
	"sections_json" jsonb,
	"narrative_ai_draft" text,
	"narrative_final" text,
	"pdf_data" text,
	"previous_snapshot_id" uuid,
	"status" "quarterly_report_status" DEFAULT 'draft' NOT NULL,
	"edited_by" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quarterly_report_snapshot_kid_id_term_id_unique" UNIQUE("kid_id","term_id")
);
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ADD CONSTRAINT "quarterly_report_snapshot_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ADD CONSTRAINT "quarterly_report_snapshot_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ADD CONSTRAINT "quarterly_report_snapshot_previous_snapshot_id_quarterly_report_snapshot_id_fk" FOREIGN KEY ("previous_snapshot_id") REFERENCES "public"."quarterly_report_snapshot"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ADD CONSTRAINT "quarterly_report_snapshot_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
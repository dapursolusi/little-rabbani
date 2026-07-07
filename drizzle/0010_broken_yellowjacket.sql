CREATE TYPE "public"."daily_report_status" AS ENUM('draft', 'sent', 'stale');--> statement-breakpoint
CREATE TABLE "daily_report_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"structured_json" text NOT NULL,
	"narrative_ai_draft" text,
	"narrative_final" text,
	"status" "daily_report_status" DEFAULT 'draft' NOT NULL,
	"edited_by" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_report_snapshot_kid_id_session_id_unique" UNIQUE("kid_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_session_id_term_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."term_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ADD CONSTRAINT "daily_report_snapshot_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
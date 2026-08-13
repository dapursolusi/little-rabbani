CREATE TYPE "public"."deviation" AS ENUM('done', 'skipped', 'modified');--> statement-breakpoint
CREATE TABLE "daily_class_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"learning_notes" text,
	"captured_by" text NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_class_report_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "dcr_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dcr_id" uuid NOT NULL,
	"activity_id" uuid,
	"activity_name_other" text,
	"deviation" "deviation" DEFAULT 'done' NOT NULL,
	"was_planned" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_session_id_term_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."term_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_captured_by_user_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dcr_activity" ADD CONSTRAINT "dcr_activity_dcr_id_daily_class_report_id_fk" FOREIGN KEY ("dcr_id") REFERENCES "public"."daily_class_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dcr_activity" ADD CONSTRAINT "dcr_activity_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE set null ON UPDATE no action;
CREATE TYPE "public"."kid_appetite" AS ENUM('good', 'fair', 'small', 'none');--> statement-breakpoint
CREATE TYPE "public"."kid_attendance" AS ENUM('present', 'absent', 'excused', 'sick');--> statement-breakpoint
CREATE TYPE "public"."kid_mood" AS ENUM('happy', 'angry', 'sad', 'fear', 'bored', 'shy');--> statement-breakpoint
CREATE TABLE "daily_class_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_session_id" uuid NOT NULL,
	"sub_theme_id" uuid,
	"date" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "dcr_class_session_id_date_idx" UNIQUE("class_session_id","date")
);
--> statement-breakpoint
CREATE TABLE "dcr_observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_class_report_id" uuid NOT NULL,
	"kid_id" uuid NOT NULL,
	"attendance" "kid_attendance" NOT NULL,
	"mood" "kid_mood",
	"appetite" "kid_appetite",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "dcr_id_kid_id_idx" UNIQUE("daily_class_report_id","kid_id"),
	CONSTRAINT "attendance_requirement_check" CHECK (CASE
            WHEN "dcr_observation"."attendance" = 'present'
            THEN "dcr_observation"."mood" IS NOT NULL AND "dcr_observation"."appetite" IS NOT NULL
            ELSE TRUE
          END)
);
--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_class_session_id_class_session_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_sub_theme_id_sub_theme_id_fk" FOREIGN KEY ("sub_theme_id") REFERENCES "public"."sub_theme"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dcr_observation" ADD CONSTRAINT "dcr_observation_daily_class_report_id_daily_class_report_id_fk" FOREIGN KEY ("daily_class_report_id") REFERENCES "public"."daily_class_report"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dcr_observation" ADD CONSTRAINT "dcr_observation_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dcr_class_session_idx" ON "daily_class_report" USING btree ("class_session_id");--> statement-breakpoint
CREATE INDEX "dcr_sub_theme_idx" ON "daily_class_report" USING btree ("sub_theme_id");--> statement-breakpoint
CREATE INDEX "dcr_idx" ON "dcr_observation" USING btree ("daily_class_report_id");--> statement-breakpoint
CREATE INDEX "kid_idx" ON "dcr_observation" USING btree ("kid_id");
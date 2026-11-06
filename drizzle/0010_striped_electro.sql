CREATE TYPE "public"."monthly_report_status" AS ENUM('generated', 'edited', 'sent');--> statement-breakpoint
CREATE TABLE "monthly_kid_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"month" text NOT NULL,
	"narrative" text,
	"report_status" "monthly_report_status" DEFAULT 'generated',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_kid_report_kid_term_month_uniq" ON "monthly_kid_report" USING btree ("kid_id","term_id","month");
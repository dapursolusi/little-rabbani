CREATE TYPE "public"."monthly_report_status" AS ENUM('draft', 'reviewed', 'sent');--> statement-breakpoint
CREATE TABLE "monthly_kid_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"month" text NOT NULL,
	"narrative" text,
	"report_status" "monthly_report_status" DEFAULT 'draft' NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"reviewed_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"sent_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_kid_report" ADD CONSTRAINT "monthly_kid_report_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mkr_kid_id_idx" ON "monthly_kid_report" USING btree ("kid_id");--> statement-breakpoint
CREATE INDEX "mkr_term_id_idx" ON "monthly_kid_report" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "mkr_sent_by_idx" ON "monthly_kid_report" USING btree ("sent_by");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_kid_report_kid_term_month_uniq" ON "monthly_kid_report" USING btree ("kid_id","term_id","month");
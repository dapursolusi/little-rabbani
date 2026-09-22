CREATE TYPE "public"."enrollment_status" AS ENUM('waiting', 'enrolled');--> statement-breakpoint
CREATE TYPE "public"."active_status" AS ENUM('active', 'inactive', 'alumni');--> statement-breakpoint
CREATE TABLE "kid_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"class_session_id" uuid NOT NULL,
	"kid_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'enrolled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "kid" ADD COLUMN "active_status" "active_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "kid_enrollment" ADD CONSTRAINT "kid_enrollment_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_enrollment" ADD CONSTRAINT "kid_enrollment_class_session_id_class_session_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_enrollment" ADD CONSTRAINT "kid_enrollment_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kid_enrollment_kid_id_idx" ON "kid_enrollment" USING btree ("kid_id");--> statement-breakpoint
CREATE INDEX "kid_enrollment_term_id_idx" ON "kid_enrollment" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "kid_enrollment_class_session_id_idx" ON "kid_enrollment" USING btree ("class_session_id");--> statement-breakpoint
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_phone_unique" UNIQUE("phone");
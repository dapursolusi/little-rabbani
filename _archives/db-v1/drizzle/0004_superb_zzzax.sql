CREATE TYPE "public"."schedule_item_type" AS ENUM('activity', 'outing');--> statement-breakpoint
CREATE TABLE "schedule_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"activity_id" uuid,
	"type" "schedule_item_type" NOT NULL,
	"outing_location" text,
	"outing_bring_items" text,
	"outing_permission_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_session_id_term_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."term_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE set null ON UPDATE no action;
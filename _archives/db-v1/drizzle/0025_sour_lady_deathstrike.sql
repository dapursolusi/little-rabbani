CREATE TABLE "sub_theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"theme_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "activity" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activity" CASCADE;--> statement-breakpoint
ALTER TABLE "dcr_activity" DROP CONSTRAINT "dcr_activity_activity_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "schedule_item" DROP CONSTRAINT "schedule_item_activity_id_activity_id_fk";
--> statement-breakpoint
DROP INDEX "schedule_item_date_session_type_idx";--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "end_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "sub_theme_id" uuid;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "indoor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "items_to_bring" text;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD COLUMN "permission_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_theme" ADD CONSTRAINT "sub_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_sub_theme_id_sub_theme_id_fk" FOREIGN KEY ("sub_theme_id") REFERENCES "public"."sub_theme"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_item_date_session_type_idx" ON "schedule_item" USING btree ("start_date","session_type_id");--> statement-breakpoint
ALTER TABLE "dcr_activity" DROP COLUMN "activity_id";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "date";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "activity_id";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "outing_location";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "outing_bring_items";--> statement-breakpoint
ALTER TABLE "schedule_item" DROP COLUMN "outing_permission_required";--> statement-breakpoint
DROP TYPE "public"."activity_category";--> statement-breakpoint
DROP TYPE "public"."schedule_item_type";
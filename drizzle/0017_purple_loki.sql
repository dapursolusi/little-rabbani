CREATE TYPE "public"."holiday_scope" AS ENUM('national', 'custom', 'term');--> statement-breakpoint
CREATE TYPE "public"."holiday_source" AS ENUM('manual', 'synced');--> statement-breakpoint
CREATE TABLE "holiday" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text NOT NULL,
	"source" "holiday_source" DEFAULT 'manual' NOT NULL,
	"scope" "holiday_scope" DEFAULT 'custom' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "holiday_unique" UNIQUE("term_id","start_date","end_date","reason","source")
);
--> statement-breakpoint
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;
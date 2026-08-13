CREATE TYPE "public"."activity_category" AS ENUM('seni', 'olahraga', 'musik', 'bahasa', 'matematika', 'sains', 'agama', 'bermain', 'outing', 'lainnya');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "activity_category" DEFAULT 'lainnya' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "report_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dcr_observation" ADD COLUMN "narrative_generated" text;--> statement-breakpoint
ALTER TABLE "dcr_observation" ADD COLUMN "narrative_edited" text;
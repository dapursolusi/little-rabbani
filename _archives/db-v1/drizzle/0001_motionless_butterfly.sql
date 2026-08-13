CREATE TYPE "public"."kid_status" AS ENUM('waiting', 'enrolled', 'alumni');--> statement-breakpoint
CREATE TABLE "guardian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"second_contact_name" text,
	"second_contact_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kid" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dob" date NOT NULL,
	"status" "kid_status" DEFAULT 'waiting' NOT NULL,
	"guardian_id" uuid NOT NULL,
	"enrolled_term_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kid" ADD CONSTRAINT "kid_guardian_id_guardian_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardian"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid" ADD CONSTRAINT "kid_enrolled_term_id_term_id_fk" FOREIGN KEY ("enrolled_term_id") REFERENCES "public"."term"("id") ON DELETE set null ON UPDATE no action;
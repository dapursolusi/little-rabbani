CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."guardian_relationship" AS ENUM('mother', 'father', 'older_sibling', 'grandparent', 'aunt_uncle', 'other');--> statement-breakpoint
CREATE TABLE "guardian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"second_contact_name" text,
	"second_contact_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kid" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"gender" "gender" NOT NULL,
	"dob" date NOT NULL,
	"guardian_id" uuid NOT NULL,
	"relationship" "guardian_relationship" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "kid_name_dob_unique" UNIQUE("name","dob")
);
--> statement-breakpoint
ALTER TABLE "kid" ADD CONSTRAINT "kid_guardian_id_guardian_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardian"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_phone_unique_live" ON "guardian" USING btree ("phone") WHERE "guardian"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_email_unique_live" ON "guardian" USING btree ("email") WHERE "guardian"."deleted_at" is null and "guardian"."email" is not null;--> statement-breakpoint
CREATE INDEX "kid_guardian_idx" ON "kid" USING btree ("guardian_id");
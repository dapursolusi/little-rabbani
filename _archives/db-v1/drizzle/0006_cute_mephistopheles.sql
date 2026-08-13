CREATE TYPE "public"."absence_reason" AS ENUM('sick', 'family', 'permission', 'other');--> statement-breakpoint
CREATE TYPE "public"."appetite" AS ENUM('good', 'moderate', 'poor');--> statement-breakpoint
CREATE TYPE "public"."participation" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."presence" AS ENUM('present_full', 'late', 'early_pickup', 'absent');--> statement-breakpoint
CREATE TABLE "observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kid_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"teacher_id" text NOT NULL,
	"mood" integer NOT NULL,
	"appetite" "appetite" NOT NULL,
	"presence" "presence" NOT NULL,
	"absence_reason" "absence_reason",
	"version" integer DEFAULT 0 NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_id" uuid NOT NULL,
	"dcr_activity_id" uuid NOT NULL,
	"participated" "participation" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_kid_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_session_id_term_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."term_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_activity" ADD CONSTRAINT "observation_activity_observation_id_observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_activity" ADD CONSTRAINT "observation_activity_dcr_activity_id_dcr_activity_id_fk" FOREIGN KEY ("dcr_activity_id") REFERENCES "public"."dcr_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_note" ADD CONSTRAINT "observation_note_observation_id_observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observation"("id") ON DELETE cascade ON UPDATE no action;
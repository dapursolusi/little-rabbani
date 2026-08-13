CREATE TABLE "curriculum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"sub_theme_id" uuid NOT NULL,
	"name" text NOT NULL,
	"objective" text,
	"indoor" boolean DEFAULT false NOT NULL,
	"items_to_bring" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_sub_theme_id_sub_theme_id_fk" FOREIGN KEY ("sub_theme_id") REFERENCES "public"."sub_theme"("id") ON DELETE restrict ON UPDATE no action;
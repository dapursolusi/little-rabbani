CREATE TABLE "session_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start" text NOT NULL,
	"end" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "session_type_name_start_end" UNIQUE("name","start","end")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "session_type_active_name" ON "session_type" USING btree ("name") WHERE active = true;
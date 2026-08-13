-- 0030: refactor session_type → class_session; snapshot tables → kid-report snapshots; curriculum → daily_class_schedule.
-- Data-preserving live→new delta. Reconciles the live DB against the current schema.
-- No DROP TABLE. curriculum, session_type, snapshot tables, reminder_log, calendar_event carry live data.

-- ═══ Enums: daily/monthly/quarterly_report_status → single report_status ═══
CREATE TYPE "report_status" AS ENUM ('draft','final','stale');
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ALTER COLUMN "status" TYPE "report_status" USING ("status"::text::"report_status");
--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ALTER COLUMN "status" TYPE "report_status" USING ("status"::text::"report_status");
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ALTER COLUMN "status" TYPE "report_status" USING ("status"::text::"report_status");
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" ALTER COLUMN "status" SET DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" ALTER COLUMN "status" SET DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" ALTER COLUMN "status" SET DEFAULT 'draft';
--> statement-breakpoint
DROP TYPE IF EXISTS "daily_report_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "monthly_report_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "quarterly_report_status";
--> statement-breakpoint

-- ═══ Table renames (pure, data-preserving) ═══
ALTER TABLE "session_type" RENAME TO "class_session";
--> statement-breakpoint
ALTER TABLE "curriculum" RENAME TO "daily_class_schedule";
--> statement-breakpoint
ALTER TABLE "daily_report_snapshot" RENAME TO "daily_kid_report_snapshot";
--> statement-breakpoint
ALTER TABLE "monthly_report_snapshot" RENAME TO "monthly_kid_report_snapshot";
--> statement-breakpoint
-- stale constraint/index names carried over from the renamed tables; new ones are created below
ALTER TABLE "class_session" DROP CONSTRAINT IF EXISTS "session_type_name_start_end";
--> statement-breakpoint
DROP INDEX IF EXISTS "session_type_active_name";
--> statement-breakpoint

-- ═══ daily_class_schedule (was curriculum) ═══
-- indoor default false→true
ALTER TABLE "daily_class_schedule" ALTER COLUMN "indoor" SET DEFAULT true;
--> statement-breakpoint
-- old PK index name follows the table rename automatically (curriculum_pkey stays on the table)

-- ═══ daily_class_report ═══
-- drop old FK to curriculum, drop curriculum_id, drop captured_at
ALTER TABLE "daily_class_report" DROP CONSTRAINT IF EXISTS "daily_class_report_curriculum_id_curriculum_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_class_report" DROP COLUMN IF EXISTS "curriculum_id";
--> statement-breakpoint
ALTER TABLE "daily_class_report" DROP COLUMN IF EXISTS "captured_at";
--> statement-breakpoint
-- rename session_type_id → class_session_id (drop old FK first, re-add later)
ALTER TABLE "daily_class_report" DROP CONSTRAINT IF EXISTS "daily_class_report_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_class_report" RENAME COLUMN "session_type_id" TO "class_session_id";
--> statement-breakpoint
-- new columns term_id + schedule_id
ALTER TABLE "daily_class_report" ADD COLUMN IF NOT EXISTS "term_id" uuid;
--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD COLUMN IF NOT EXISTS "schedule_id" uuid;
--> statement-breakpoint
ALTER TABLE "daily_class_report" ALTER COLUMN "term_id" SET NOT NULL;
--> statement-breakpoint
-- old date_class_session_type unique constraint is invalid after column rename; drop and re-create
ALTER TABLE "daily_class_report" DROP CONSTRAINT IF EXISTS "daily_class_report_date_session_type_id_unique";
--> statement-breakpoint

-- ═══ calendar_event ═══
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_event" RENAME COLUMN "session_type_id" TO "class_session_id";
--> statement-breakpoint
DROP INDEX IF EXISTS "calendar_event_date_session_type_idx";
--> statement-breakpoint

-- ═══ reminder_log ═══
ALTER TABLE "reminder_log" DROP CONSTRAINT IF EXISTS "reminder_log_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "reminder_log" RENAME COLUMN "session_type_id" TO "class_session_id";
--> statement-breakpoint
ALTER TABLE "reminder_log" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint

-- ═══ observation ═══
-- drop old composite unique + FKs before touching columns
ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_kid_id_date_unique";
--> statement-breakpoint
-- drop captured_at, date, session_type_id
ALTER TABLE "observation" DROP COLUMN IF EXISTS "captured_at";
--> statement-breakpoint
ALTER TABLE "observation" DROP COLUMN IF EXISTS "date";
--> statement-breakpoint
ALTER TABLE "observation" DROP COLUMN IF EXISTS "session_type_id";
--> statement-breakpoint
-- add dkrs_id
ALTER TABLE "observation" ADD COLUMN IF NOT EXISTS "dkrs_id" uuid;
--> statement-breakpoint
ALTER TABLE "observation" ALTER COLUMN "dkrs_id" SET NOT NULL;
--> statement-breakpoint

-- ═══ daily_kid_report_snapshot (was daily_report_snapshot) ═══
ALTER TABLE "daily_kid_report_snapshot" DROP CONSTRAINT IF EXISTS "daily_report_snapshot_session_type_id_session_type_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_kid_report_snapshot" DROP CONSTRAINT IF EXISTS "daily_report_snapshot_kid_id_date_unique";
--> statement-breakpoint
ALTER TABLE "daily_kid_report_snapshot" DROP COLUMN IF EXISTS "date";
--> statement-breakpoint
ALTER TABLE "daily_kid_report_snapshot" DROP COLUMN IF EXISTS "session_type_id";
--> statement-breakpoint
ALTER TABLE "daily_kid_report_snapshot" ADD COLUMN IF NOT EXISTS "dcr_id" uuid;
--> statement-breakpoint
ALTER TABLE "daily_kid_report_snapshot" ALTER COLUMN "dcr_id" SET NOT NULL;
--> statement-breakpoint

-- ═══ monthly_kid_report_snapshot (was monthly_report_snapshot) ═══
ALTER TABLE "monthly_kid_report_snapshot" DROP CONSTRAINT IF EXISTS "monthly_report_snapshot_edited_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_kid_report_snapshot" DROP CONSTRAINT IF EXISTS "monthly_report_snapshot_kid_id_month_unique";
--> statement-breakpoint
ALTER TABLE "monthly_kid_report_snapshot" ALTER COLUMN "edited_by" TYPE text USING ("edited_by"::text);
--> statement-breakpoint

-- ═══ quarterly_report_snapshot ═══
ALTER TABLE "quarterly_report_snapshot" ALTER COLUMN "edited_by" TYPE text USING ("edited_by"::text);
--> statement-breakpoint
ALTER TABLE "quarterly_report_snapshot" DROP CONSTRAINT IF EXISTS "quarterly_report_snapshot_kid_id_term_id_unique";
--> statement-breakpoint

-- ═══ observation_activity: participated participation→boolean; + deleted_at, updated_at ═══
ALTER TABLE "observation_activity" DROP CONSTRAINT IF EXISTS "observation_activity_observation_id_dcr_activity_id_unique";
-- participate enum → boolean (was participation enum; boolean via USING boolean)
ALTER TABLE "observation_activity" ALTER COLUMN "participated" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "observation_activity" ALTER COLUMN "participated" TYPE boolean USING ("participated"::text::boolean);
--> statement-breakpoint
ALTER TABLE "observation_activity" ALTER COLUMN "participated" SET DEFAULT true;
--> statement-breakpoint
ALTER TABLE "observation_activity" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "observation_activity" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- ═══ observation_note: + updated_at ═══
ALTER TABLE "observation_note" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- ═══ dcr_activity: + updated_at ═══
ALTER TABLE "dcr_activity" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- ═══ kid: drop enrolled_term_id (no FK in live DB) ═══
ALTER TABLE "kid" DROP COLUMN IF EXISTS "enrolled_term_id";
--> statement-breakpoint

-- ═══ New table: kid_session_enrollment ═══
CREATE TABLE "kid_session_enrollment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kid_id" uuid NOT NULL,
  "term_id" uuid NOT NULL,
  "class_session_id" uuid NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  CONSTRAINT "kid_term_class_session" UNIQUE("kid_id","term_id","class_session_id")
);
--> statement-breakpoint

-- ═══ Re-create constraints & indexes (new names) ═══

-- calendar_event FKs + indexes
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_class_session_id_class_session_id_fk"
  FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "calendar_event_class_session_id_idx" ON "calendar_event" USING btree ("class_session_id");
--> statement-breakpoint
CREATE INDEX "calendar_event_date_class_session_id_idx" ON "calendar_event" USING btree ("start_date","class_session_id");
--> statement-breakpoint
CREATE INDEX "calendar_event_sub_theme_idx" ON "calendar_event" USING btree ("sub_theme_id");
--> statement-breakpoint

-- daily_class_report FKs + indexes
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_term_id_term_id_fk"
  FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_class_session_id_class_session_id_fk"
  FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "daily_class_report" ADD CONSTRAINT "daily_class_report_schedule_id_daily_class_schedule_id_fk"
  FOREIGN KEY ("schedule_id") REFERENCES "public"."daily_class_schedule"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "dcr_term_idx" ON "daily_class_report" USING btree ("term_id");
--> statement-breakpoint
CREATE INDEX "dcr_class_session_id_idx" ON "daily_class_report" USING btree ("class_session_id");
--> statement-breakpoint
CREATE INDEX "dcr_schedule_idx" ON "daily_class_report" USING btree ("schedule_id");
--> statement-breakpoint
CREATE INDEX "dcr_captured_by_idx" ON "daily_class_report" USING btree ("captured_by");
--> statement-breakpoint
CREATE UNIQUE INDEX "dcr_date_class_session_id_unique" ON "daily_class_report" USING btree ("date","class_session_id") WHERE "daily_class_report"."deleted_at" IS NULL;
--> statement-breakpoint

-- reminder_log FK + indexes
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_class_session_id_class_session_id_fk"
  FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "reminder_log_user_idx" ON "reminder_log" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "reminder_log_class_session_id_idx" ON "reminder_log" USING btree ("class_session_id");
--> statement-breakpoint
CREATE INDEX "reminder_log_type_date_idx" ON "reminder_log" USING btree ("type","date");
--> statement-breakpoint
CREATE INDEX "reminder_log_user_date_idx" ON "reminder_log" USING btree ("user_id","date");
--> statement-breakpoint
CREATE INDEX "reminder_log_sent_at_idx" ON "reminder_log" USING btree ("sent_at");
--> statement-breakpoint

-- composite unique constraint (FK target) for observation's composite FK — must exist before the FK
ALTER TABLE "daily_kid_report_snapshot" ADD CONSTRAINT "dkrs_kid_id_unique" UNIQUE ("kid_id","id");
--> statement-breakpoint

-- observation FKs + indexes
ALTER TABLE "observation" ADD CONSTRAINT "observation_dkrs_id_daily_kid_report_snapshot_id_fk"
  FOREIGN KEY ("dkrs_id") REFERENCES "public"."daily_kid_report_snapshot"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_kid_id_dkrs_id_daily_kid_report_snapshot_kid_id_id_fk"
  FOREIGN KEY ("kid_id","dkrs_id") REFERENCES "public"."daily_kid_report_snapshot"("kid_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "observation_kid_id_idx" ON "observation" USING btree ("kid_id");
--> statement-breakpoint
CREATE INDEX "observation_dkrs_id_idx" ON "observation" USING btree ("dkrs_id");
--> statement-breakpoint
CREATE INDEX "observation_teacher_id_idx" ON "observation" USING btree ("teacher_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "observation_kid_dkrs_unique" ON "observation" USING btree ("kid_id","dkrs_id") WHERE "observation"."deleted_at" IS NULL;
--> statement-breakpoint

-- daily_kid_report_snapshot FKs + indexes
ALTER TABLE "daily_kid_report_snapshot" ADD CONSTRAINT "daily_kid_report_snapshot_dcr_id_daily_class_report_id_fk"
  FOREIGN KEY ("dcr_id") REFERENCES "public"."daily_class_report"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "dkrs_kid_idx" ON "daily_kid_report_snapshot" USING btree ("kid_id");
--> statement-breakpoint
CREATE INDEX "dkrs_dcr_idx" ON "daily_kid_report_snapshot" USING btree ("dcr_id");
--> statement-breakpoint
CREATE INDEX "dkrs_edited_by_idx" ON "daily_kid_report_snapshot" USING btree ("edited_by");
--> statement-breakpoint
CREATE INDEX "dkrs_dcr_status_idx" ON "daily_kid_report_snapshot" USING btree ("dcr_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "dkrs_kid_dcr_unique" ON "daily_kid_report_snapshot" USING btree ("kid_id","dcr_id") WHERE "daily_kid_report_snapshot"."deleted_at" IS NULL;
--> statement-breakpoint

-- monthly_kid_report_snapshot FKs + indexes
CREATE INDEX "mkrs_kid_idx" ON "monthly_kid_report_snapshot" USING btree ("kid_id");
--> statement-breakpoint
CREATE INDEX "mkrs_term_idx" ON "monthly_kid_report_snapshot" USING btree ("term_id");
--> statement-breakpoint
CREATE INDEX "mkrs_edited_by_idx" ON "monthly_kid_report_snapshot" USING btree ("edited_by");
--> statement-breakpoint
CREATE INDEX "mkrs_term_kid_idx" ON "monthly_kid_report_snapshot" USING btree ("term_id","kid_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "mkrs_kid_month_unique" ON "monthly_kid_report_snapshot" USING btree ("kid_id","month") WHERE "monthly_kid_report_snapshot"."deleted_at" IS NULL;
--> statement-breakpoint

-- quarterly_report_snapshot FKs + indexes
CREATE INDEX "qkrs_kid_idx" ON "quarterly_report_snapshot" USING btree ("kid_id");
--> statement-breakpoint
CREATE INDEX "qkrs_term_idx" ON "quarterly_report_snapshot" USING btree ("term_id");
--> statement-breakpoint
CREATE INDEX "qkrs_edited_by_idx" ON "quarterly_report_snapshot" USING btree ("edited_by");
--> statement-breakpoint
CREATE INDEX "qkrs_previous_snapshot_idx" ON "quarterly_report_snapshot" USING btree ("previous_snapshot_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "qkrs_kid_term_unique" ON "quarterly_report_snapshot" USING btree ("kid_id","term_id") WHERE "quarterly_report_snapshot"."deleted_at" IS NULL;
--> statement-breakpoint

-- daily_class_schedule FKs + indexes (was curriculum)
ALTER TABLE "daily_class_schedule" ADD CONSTRAINT "daily_class_schedule_term_id_term_id_fk"
  FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "daily_class_schedule" ADD CONSTRAINT "daily_class_schedule_sub_theme_id_sub_theme_id_fk"
  FOREIGN KEY ("sub_theme_id") REFERENCES "public"."sub_theme"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "dcs_term_idx" ON "daily_class_schedule" USING btree ("term_id");
--> statement-breakpoint
CREATE INDEX "dcs_sub_theme_idx" ON "daily_class_schedule" USING btree ("sub_theme_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "dcs_unique" ON "daily_class_schedule" USING btree ("term_id","sort_order") WHERE "daily_class_schedule"."deleted_at" IS NULL;
--> statement-breakpoint

-- class_session indexes + constraints
CREATE UNIQUE INDEX "class_session_active_name" ON "class_session" USING btree ("name") WHERE active = true;
--> statement-breakpoint
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_name_start_end" UNIQUE ("name","start","end");
--> statement-breakpoint

-- kid_session_enrollment FKs + indexes
ALTER TABLE "kid_session_enrollment" ADD CONSTRAINT "kid_session_enrollment_kid_id_kid_id_fk"
  FOREIGN KEY ("kid_id") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kid_session_enrollment" ADD CONSTRAINT "kid_session_enrollment_term_id_term_id_fk"
  FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kid_session_enrollment" ADD CONSTRAINT "kid_session_enrollment_class_session_id_class_session_id_fk"
  FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "kse_kid_id_idx" ON "kid_session_enrollment" USING btree ("kid_id");
--> statement-breakpoint
CREATE INDEX "kse_term_id_idx" ON "kid_session_enrollment" USING btree ("term_id");
--> statement-breakpoint
CREATE INDEX "kse_class_session_id_idx" ON "kid_session_enrollment" USING btree ("class_session_id");
--> statement-breakpoint

-- observation_activity unique index
CREATE UNIQUE INDEX "observation_activity_unique" ON "observation_activity" USING btree ("observation_id","dcr_activity_id") WHERE "observation_activity"."deleted_at" IS NULL;
--> statement-breakpoint

-- observation_activity + observation_note + dcr_activity indexes (new)
CREATE INDEX "observation_activity_observation_id_idx" ON "observation_activity" USING btree ("observation_id");
--> statement-breakpoint
CREATE INDEX "observation_activity_dcr_activity_id_idx" ON "observation_activity" USING btree ("dcr_activity_id");
--> statement-breakpoint
CREATE INDEX "observation_note_observation_id_idx" ON "observation_note" USING btree ("observation_id");
--> statement-breakpoint
CREATE INDEX "dcr_activity_dcr_id_idx" ON "dcr_activity" USING btree ("dcr_id");
--> statement-breakpoint

-- term_active partial unique (already exists in live DB? create if not)
CREATE UNIQUE INDEX IF NOT EXISTS "term_active" ON "term" USING btree ("is_active") WHERE is_active = true;
--> statement-breakpoint

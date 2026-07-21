-- Drop term_session table and all remaining FK references (Issue #40)
-- Contract phase: sessionId columns already nulled/re-keyed in prior migrations.

ALTER TABLE "schedule_item" DROP CONSTRAINT IF EXISTS "schedule_item_session_id_term_session_id_fk";
ALTER TABLE "daily_class_report" DROP CONSTRAINT IF EXISTS "daily_class_report_session_id_term_session_id_fk";
ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_session_id_term_session_id_fk";
ALTER TABLE "daily_report_snapshot" DROP CONSTRAINT IF EXISTS "daily_report_snapshot_session_id_term_session_id_fk";
ALTER TABLE "reminder_log" DROP CONSTRAINT IF EXISTS "reminder_log_session_id_term_session_id_fk";

ALTER TABLE "schedule_item" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "daily_class_report" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "observation" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "daily_report_snapshot" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "reminder_log" DROP COLUMN IF EXISTS "session_id";

ALTER TABLE "observation" DROP CONSTRAINT IF EXISTS "observation_kid_id_session_id_unique";

DROP TABLE IF EXISTS "term_session";

-- Add partial unique index on (term_id, kid_id) WHERE deleted_at IS NULL
-- Prevents duplicate active enrollments (Postgres treats NULL as distinct
-- in unique constraints, so UNIQUE(term_id, kid_id, deleted_at) wouldn't work).
CREATE UNIQUE INDEX IF NOT EXISTS "kid_enrollment_active_unique"
  ON "kid_enrollment" USING btree ("term_id","kid_id")
  WHERE "kid_enrollment"."deleted_at" is null;

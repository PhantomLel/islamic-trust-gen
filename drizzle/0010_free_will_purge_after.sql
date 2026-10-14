-- Free wills: delete answers and the generated PDF 30 days after the last save.
--
-- Written by hand and idempotent. Apply directly:
--   psql "$DATABASE_URL" -f drizzle/0010_free_will_purge_after.sql
-- or let `npm run db:push` sync the same shape from src/lib/server/db/schema.ts.
-- Existing rows are stamped from updated_at so a will already older than 30 days
-- is deleted on the first cron run.

ALTER TABLE "free_will" ADD COLUMN IF NOT EXISTS "purge_after" timestamp;

UPDATE "free_will"
SET "purge_after" = "updated_at" + interval '30 days'
WHERE "purge_after" IS NULL;

ALTER TABLE "free_will" ALTER COLUMN "purge_after" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "free_will_purge_after_idx" ON "free_will" ("purge_after");

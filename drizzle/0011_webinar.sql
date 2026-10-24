-- Webinar registration (V3 §11, D14).
-- The plan named this 0010; 0010_free_will_purge_after.sql already exists, so this is 0011.
--
-- Written by hand and idempotent. Apply directly:
--   psql "$DATABASE_URL" -f drizzle/0011_webinar.sql
-- or let `npm run db:push` sync the same shape from src/lib/server/db/webinar.schema.ts.

CREATE TABLE IF NOT EXISTS "webinar" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"starts_at" timestamptz NOT NULL,
	"duration_minutes" integer NOT NULL,
	"join_url" text NOT NULL,
	"replay_video_id" integer REFERENCES "video_page"("id") ON DELETE SET NULL,
	"status" text NOT NULL DEFAULT 'draft',
	"created_at" timestamptz NOT NULL DEFAULT now(),
	"updated_at" timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "webinar_status_check" CHECK ("status" IN ('draft', 'open', 'closed')),
	CONSTRAINT "webinar_duration_check" CHECK ("duration_minutes" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "webinar_one_open_idx" ON "webinar" ("status") WHERE "status" = 'open';

CREATE TABLE IF NOT EXISTS "webinar_registration" (
	"id" serial PRIMARY KEY,
	"webinar_id" integer NOT NULL REFERENCES "webinar"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"state" text NOT NULL,
	"attribution_code" text,
	"marketing_consent" boolean NOT NULL DEFAULT false,
	"marketing_consent_at" timestamptz,
	"confirmation_sent_at" timestamptz,
	"reminder_24h_sent_at" timestamptz,
	"reminder_1h_sent_at" timestamptz,
	"followup_sent_at" timestamptz,
	"created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "webinar_registration_email_idx" ON "webinar_registration" ("webinar_id", lower("email"));
CREATE INDEX IF NOT EXISTS "webinar_registration_webinar_idx" ON "webinar_registration" ("webinar_id");

-- Spec v3: attribution, marketing consent, matter jurisdiction, two-factor, and the content platform.
--
-- Written by hand and idempotent (IF NOT EXISTS everywhere). The snapshots under drizzle/meta are
-- stale for this project, so `drizzle-kit generate` wants to re-create tables that already exist in
-- production. Apply this file directly instead:
--   psql "$DATABASE_URL" -f drizzle/0008_spec_v3_content_and_attribution.sql
-- or let `npm run db:push` sync the same shape from src/lib/server/db/schema.ts.

ALTER TABLE "marketing_lead" ADD COLUMN IF NOT EXISTS "attribution_code" text;
ALTER TABLE "marketing_lead" ADD COLUMN IF NOT EXISTS "marketing_consent" boolean DEFAULT false NOT NULL;
ALTER TABLE "marketing_lead" ADD COLUMN IF NOT EXISTS "marketing_consent_at" timestamp;
ALTER TABLE "free_will" ADD COLUMN IF NOT EXISTS "attribution_code" text;
ALTER TABLE "free_will" ADD COLUMN IF NOT EXISTS "marketing_consent" boolean DEFAULT false NOT NULL;
ALTER TABLE "free_will" ADD COLUMN IF NOT EXISTS "marketing_consent_at" timestamp;
ALTER TABLE "trust" ADD COLUMN IF NOT EXISTS "attribution_code" text;
ALTER TABLE "trust" ADD COLUMN IF NOT EXISTS "jurisdiction" text DEFAULT 'TX' NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "content_category_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "content_faq" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_page" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"answer_summary" text DEFAULT '' NOT NULL,
	"body" jsonb DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"jurisdiction" text,
	"category_id" integer,
	"last_reviewed_on" date,
	"cta_key" text,
	"caveat_override" text,
	"social_image_id" integer,
	"published_at" timestamp,
	"scheduled_publish_at" timestamp,
	"author_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_page_revision" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"answer_summary" text DEFAULT '' NOT NULL,
	"body" jsonb NOT NULL,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_redirect" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_redirect_from_path_unique" UNIQUE("from_path")
);

CREATE TABLE IF NOT EXISTS "content_related" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"related_page_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media_asset" (
	"id" serial PRIMARY KEY NOT NULL,
	"uploadthing_key" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text NOT NULL,
	"width" integer,
	"height" integer,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "video_page" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"youtube_id" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"transcript" text DEFAULT '' NOT NULL,
	"duration_seconds" integer,
	"jurisdiction" text,
	"series" text,
	"series_order" integer,
	"related_content_page_id" integer,
	"is_testimonial" boolean DEFAULT false NOT NULL,
	"release_on_file" boolean DEFAULT false NOT NULL,
	"is_endorsement" boolean DEFAULT false NOT NULL,
	"speaker_title" text,
	"speaker_relationship" text,
	"meta_description" text DEFAULT '' NOT NULL,
	"thumbnail_asset_id" integer,
	"uploaded_on" date,
	"published_at" timestamp,
	"scheduled_publish_at" timestamp,
	"author_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_faq" ADD CONSTRAINT "content_faq_page_id_content_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."content_page"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_page" ADD CONSTRAINT "content_page_category_id_content_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_page" ADD CONSTRAINT "content_page_social_image_id_media_asset_id_fk" FOREIGN KEY ("social_image_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_page_revision" ADD CONSTRAINT "content_page_revision_page_id_content_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."content_page"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_related" ADD CONSTRAINT "content_related_page_id_content_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."content_page"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "content_related" ADD CONSTRAINT "content_related_related_page_id_content_page_id_fk" FOREIGN KEY ("related_page_id") REFERENCES "public"."content_page"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "video_page" ADD CONSTRAINT "video_page_related_content_page_id_content_page_id_fk" FOREIGN KEY ("related_content_page_id") REFERENCES "public"."content_page"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "video_page" ADD CONSTRAINT "video_page_thumbnail_asset_id_media_asset_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");
CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "content_audit_target_idx" ON "content_audit" USING btree ("target_type","target_id");
CREATE INDEX IF NOT EXISTS "content_audit_action_idx" ON "content_audit" USING btree ("action");
CREATE INDEX IF NOT EXISTS "content_faq_page_idx" ON "content_faq" USING btree ("page_id");
CREATE UNIQUE INDEX IF NOT EXISTS "content_page_slug_idx" ON "content_page" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "content_page_status_idx" ON "content_page" USING btree ("status");
CREATE INDEX IF NOT EXISTS "content_page_category_idx" ON "content_page" USING btree ("category_id");
CREATE INDEX IF NOT EXISTS "content_page_revision_page_idx" ON "content_page_revision" USING btree ("page_id");
CREATE INDEX IF NOT EXISTS "content_related_page_idx" ON "content_related" USING btree ("page_id");
CREATE UNIQUE INDEX IF NOT EXISTS "content_related_pair_idx" ON "content_related" USING btree ("page_id","related_page_id");
CREATE UNIQUE INDEX IF NOT EXISTS "video_page_slug_idx" ON "video_page" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "video_page_status_idx" ON "video_page" USING btree ("status");
CREATE INDEX IF NOT EXISTS "video_page_series_idx" ON "video_page" USING btree ("series");

-- content_audit is append-only: reject any UPDATE or DELETE.
CREATE OR REPLACE FUNCTION content_audit_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'content_audit is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_audit_no_update ON "content_audit";
CREATE TRIGGER content_audit_no_update
  BEFORE UPDATE OR DELETE ON "content_audit"
  FOR EACH ROW EXECUTE FUNCTION content_audit_append_only();

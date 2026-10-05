-- KB → CMS link and help transcript version id (spec v3 §12 / §7).

ALTER TABLE "kb_entry" ADD COLUMN IF NOT EXISTS "content_page_slug" text;
ALTER TABLE "help_query" ADD COLUMN IF NOT EXISTS "kb_entry_version_id" integer;

DO $$ BEGIN
 ALTER TABLE "help_query" ADD CONSTRAINT "help_query_kb_entry_version_id_kb_entry_version_id_fk"
 FOREIGN KEY ("kb_entry_version_id") REFERENCES "public"."kb_entry_version"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

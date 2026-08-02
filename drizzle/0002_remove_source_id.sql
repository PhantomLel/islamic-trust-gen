-- Migrate publication gate content_id from DOCX source_id to kb_entry.id
UPDATE "kb_publication_gate" AS g
SET "content_id" = e.id::text
FROM "kb_entry" AS e
WHERE g."content_type" = 'kb_entry'
  AND e."source_id" = g."content_id";

--> statement-breakpoint
ALTER TABLE "help_query" ADD COLUMN "selected_entry_id" integer;

--> statement-breakpoint
UPDATE "help_query" AS q
SET "selected_entry_id" = e.id
FROM "kb_entry" AS e
WHERE q."selected_entry_source_id" = e."source_id";

--> statement-breakpoint
UPDATE "help_query" AS q
SET "matched_entry_ids" = sub.ids
FROM (
	SELECT
		hq.id AS query_id,
		jsonb_agg(e.id ORDER BY e.id) AS ids
	FROM "help_query" AS hq
	CROSS JOIN LATERAL jsonb_array_elements_text(hq."matched_entry_ids") AS sid(value)
	INNER JOIN "kb_entry" AS e ON e."source_id" = sid.value
	WHERE hq."matched_entry_ids" IS NOT NULL
	  AND jsonb_typeof(hq."matched_entry_ids") = 'array'
	  AND jsonb_array_length(hq."matched_entry_ids") > 0
	GROUP BY hq.id
) AS sub
WHERE q.id = sub.query_id;

--> statement-breakpoint
UPDATE "help_query" AS q
SET "rendered_response" = (q."rendered_response" - 'entrySourceId')
	|| jsonb_build_object('entryId', e.id)
FROM "kb_entry" AS e
WHERE q."rendered_response" ? 'entrySourceId'
  AND e."source_id" = q."rendered_response"->>'entrySourceId';

--> statement-breakpoint
ALTER TABLE "help_query" DROP COLUMN "selected_entry_source_id";

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_query" ADD CONSTRAINT "help_query_selected_entry_id_kb_entry_id_fk" FOREIGN KEY ("selected_entry_id") REFERENCES "public"."kb_entry"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
ALTER TABLE "kb_entry" DROP CONSTRAINT "kb_entry_source_id_unique";

--> statement-breakpoint
ALTER TABLE "kb_entry" DROP COLUMN "source_id";

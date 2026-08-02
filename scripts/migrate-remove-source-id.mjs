#!/usr/bin/env node
/**
 * Apply 0002_remove_source_id migration directly (data-preserving).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function loadDotEnv() {
	const envPath = path.join(projectRoot, '.env');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (process.env[key] === undefined) process.env[key] = val;
	}
}

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL required');
	process.exit(1);
}

const sql = neon(url);

const cols = await sql`
	SELECT column_name FROM information_schema.columns
	WHERE table_name = 'kb_entry' AND column_name = 'source_id'`;

if (cols.length === 0) {
	console.log('Migration already applied: kb_entry.source_id does not exist.');
	process.exit(0);
}

console.log('Applying remove_source_id migration...');

await sql`
	UPDATE kb_publication_gate AS g
	SET content_id = e.id::text
	FROM kb_entry AS e
	WHERE g.content_type = 'kb_entry'
	  AND e.source_id = g.content_id`;

await sql`ALTER TABLE help_query ADD COLUMN IF NOT EXISTS selected_entry_id integer`;

await sql`
	UPDATE help_query AS q
	SET selected_entry_id = e.id
	FROM kb_entry AS e
	WHERE q.selected_entry_source_id = e.source_id
	  AND q.selected_entry_id IS NULL`;

await sql`
	UPDATE help_query AS q
	SET matched_entry_ids = sub.ids
	FROM (
		SELECT
			hq.id AS query_id,
			jsonb_agg(e.id ORDER BY e.id) AS ids
		FROM help_query AS hq
		CROSS JOIN LATERAL jsonb_array_elements_text(hq.matched_entry_ids) AS sid(value)
		INNER JOIN kb_entry AS e ON e.source_id = sid.value
		WHERE hq.matched_entry_ids IS NOT NULL
		  AND jsonb_typeof(hq.matched_entry_ids) = 'array'
		  AND jsonb_array_length(hq.matched_entry_ids) > 0
		GROUP BY hq.id
	) AS sub
	WHERE q.id = sub.query_id`;

await sql`
	UPDATE help_query AS q
	SET rendered_response = (q.rendered_response - 'entrySourceId')
		|| jsonb_build_object('entryId', e.id)
	FROM kb_entry AS e
	WHERE q.rendered_response ? 'entrySourceId'
	  AND e.source_id = q.rendered_response->>'entrySourceId'`;

await sql`ALTER TABLE help_query DROP COLUMN IF EXISTS selected_entry_source_id`;

await sql`
	DO $$ BEGIN
	 ALTER TABLE help_query ADD CONSTRAINT help_query_selected_entry_id_kb_entry_id_fk
	   FOREIGN KEY (selected_entry_id) REFERENCES kb_entry(id) ON DELETE SET NULL;
	EXCEPTION WHEN duplicate_object THEN NULL;
	END $$`;

await sql`ALTER TABLE kb_entry DROP CONSTRAINT IF EXISTS kb_entry_source_id_unique`;
await sql`ALTER TABLE kb_entry DROP COLUMN source_id`;

console.log('Migration complete.');

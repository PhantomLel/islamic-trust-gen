#!/usr/bin/env node
/**
 * Mark already-applied migrations when the DB was created via db:push.
 * Usage: node scripts/baseline-drizzle-migrations.mjs [throughTag]
 * Example: node scripts/baseline-drizzle-migrations.mjs 0002_remove_source_id
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

const throughTag = process.argv[2] ?? '0002_remove_source_id';
const migrationsDir = path.join(projectRoot, 'drizzle');
const journal = JSON.parse(fs.readFileSync(path.join(migrationsDir, 'meta/_journal.json'), 'utf8'));

const entries = journal.entries.slice(
	0,
	journal.entries.findIndex((e) => e.tag === throughTag) + 1,
);
if (entries.length === 0 || entries.at(-1)?.tag !== throughTag) {
	console.error(`Unknown migration tag: ${throughTag}`);
	process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const sql = neon(url);

const existing = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
const existingHashes = new Set(existing.map((r) => r.hash));

let inserted = 0;
for (const entry of entries) {
	const filePath = path.join(migrationsDir, `${entry.tag}.sql`);
	const query = fs.readFileSync(filePath, 'utf8');
	const hash = crypto.createHash('sha256').update(query).digest('hex');
	if (existingHashes.has(hash)) {
		console.log(`skip ${entry.tag} (already recorded)`);
		continue;
	}
	await sql`
		INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
		VALUES (${hash}, ${entry.when})
	`;
	console.log(`recorded ${entry.tag}`);
	inserted++;
}

console.log(inserted ? `Baselined ${inserted} migration(s). Run npm run db:migrate next.` : 'Nothing to baseline.');

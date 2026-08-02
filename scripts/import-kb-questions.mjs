#!/usr/bin/env node
/**
 * Bulk-import Help Assistant KB entries (FAQ question/answer pairs) from a JSON file.
 *
 * Expects the exact schema produced by the "Help KB question generation" prompt:
 *   { "entries": [ { category, question, alsoAnswers, userFacingAnswer, appMeaning, userNextStep, classification }, ... ] }
 * (a bare top-level array is also accepted).
 *
 * New entries always land as governance status 'needs_revision' — nothing is servable
 * to end users until an admin approves it at /admin/help.
 *
 * Usage:
 *   node scripts/import-kb-questions.mjs path/to/entries.json [--dry-run]
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

const KNOWN_CATEGORIES = new Set([
	'Getting Started',
	'Revocable Living Trusts',
	'What Happens When I Die',
	'Signing and Notarization',
	'Funding and Assets',
	'Bank and Brokerage',
	'Home / Deed',
	'Retirement Accounts',
	'Life Insurance',
	'Vehicles',
	'Cryptocurrency',
	'Islamic Inheritance',
	'Marital Property',
	'Children, Guardians, Trustees',
	'Storage and Family Readiness',
	'Waqf and Charity',
	'Troubleshooting',
]);

const VALID_CLASSIFICATIONS = new Set(['safe', 'consult_trigger', 'do_not_answer']);

const MAX_QUESTION_LENGTH = 2_000;
const MAX_BODY_BYTES = 8_192;

function buildRerankDocument({ question, alsoAnswers, userFacingAnswer }) {
	return [question, alsoAnswers?.length ? alsoAnswers.join(', ') : null, userFacingAnswer]
		.filter(Boolean)
		.join('\n');
}

function hashEntry(entry) {
	return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

function validateEntry(raw, index) {
	const errors = [];
	const question = String(raw.question ?? '').trim();
	const userFacingAnswer = String(raw.userFacingAnswer ?? '').trim();
	const category = raw.category ? String(raw.category).trim() : null;
	const appMeaning = raw.appMeaning ? String(raw.appMeaning).trim() : null;
	const userNextStep = raw.userNextStep ? String(raw.userNextStep).trim() : null;
	const classification = raw.classification ? String(raw.classification).trim() : 'safe';
	const alsoAnswers = Array.isArray(raw.alsoAnswers)
		? [...new Set(raw.alsoAnswers.map((s) => String(s).trim()).filter(Boolean))]
		: [];

	if (!question) errors.push('missing question');
	if (!userFacingAnswer) errors.push('missing userFacingAnswer');
	if (question.length > MAX_QUESTION_LENGTH) errors.push(`question exceeds ${MAX_QUESTION_LENGTH} chars`);
	if (!VALID_CLASSIFICATIONS.has(classification)) {
		errors.push(`invalid classification "${classification}" (must be safe | consult_trigger | do_not_answer)`);
	}
	if (category && !KNOWN_CATEGORIES.has(category)) {
		errors.push(`warning: unrecognized category "${category}" (importing anyway)`);
	}

	const rerankDocument = buildRerankDocument({ question, alsoAnswers, userFacingAnswer });
	if (Buffer.byteLength(rerankDocument, 'utf8') > MAX_BODY_BYTES) {
		errors.push(`combined question+answer exceeds ${MAX_BODY_BYTES} bytes`);
	}

	const blocking = errors.filter((e) => !e.startsWith('warning:'));

	return {
		index,
		ok: blocking.length === 0,
		errors,
		entry: {
			category,
			question,
			userFacingAnswer,
			goodTreeAppMeaning: appMeaning,
			userNextStep,
			alsoAnswers,
			classificationBase: classification,
			rerankDocument,
		},
	};
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const fileArg = args.find((a) => !a.startsWith('--'));

	if (!fileArg) {
		console.error('Usage: node scripts/import-kb-questions.mjs path/to/entries.json [--dry-run]');
		process.exit(1);
	}

	const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
	if (!fs.existsSync(filePath)) {
		console.error('File not found:', filePath);
		process.exit(1);
	}

	const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	const list = Array.isArray(raw) ? raw : raw.entries;
	if (!Array.isArray(list)) {
		console.error('Expected a top-level array or an object with an "entries" array.');
		process.exit(1);
	}

	const validated = list.map((r, i) => validateEntry(r, i));
	const invalid = validated.filter((v) => !v.ok);
	const warnings = validated.filter((v) => v.ok && v.errors.length);
	const valid = validated.filter((v) => v.ok);

	console.log(`Parsed ${list.length} entries: ${valid.length} valid, ${invalid.length} invalid, ${warnings.length} with warnings.`);
	for (const v of invalid) {
		console.error(`  [${v.index}] "${(v.entry.question || '(no question)').slice(0, 60)}" -> ${v.errors.join('; ')}`);
	}
	for (const v of warnings) {
		console.warn(`  [${v.index}] "${v.entry.question.slice(0, 60)}" -> ${v.errors.join('; ')}`);
	}

	// Duplicate detection within the file itself (case-insensitive exact question match).
	const seen = new Map();
	const dedupedValid = [];
	let dupesInFile = 0;
	for (const v of valid) {
		const key = v.entry.question.toLowerCase();
		if (seen.has(key)) {
			dupesInFile++;
			console.warn(`  [${v.index}] duplicate of [${seen.get(key)}]: "${v.entry.question.slice(0, 60)}" (skipped)`);
			continue;
		}
		seen.set(key, v.index);
		dedupedValid.push(v);
	}

	if (dryRun) {
		console.log(`Dry run OK. Would import ${dedupedValid.length} entries (${dupesInFile} in-file duplicates skipped).`);
		process.exit(invalid.length ? 1 : 0);
	}

	const url = process.env.DATABASE_URL;
	if (!url) {
		console.error('DATABASE_URL required. Add it to .env in the project root.');
		process.exit(1);
	}
	const sql = neon(url);

	let inserted = 0;
	let skippedExisting = 0;

	for (const v of dedupedValid) {
		const e = v.entry;
		const existing = await sql`
			SELECT id FROM kb_entry WHERE entry_type = 'faq' AND lower(question) = lower(${e.question}) LIMIT 1
		`;
		if (existing[0]) {
			skippedExisting++;
			continue;
		}

		const [row] = await sql`
			INSERT INTO kb_entry (entry_type, category, title, question, user_facing_answer, good_tree_app_meaning, user_next_step, rerank_document, updated_at)
			VALUES ('faq', ${e.category}, ${e.question}, ${e.question}, ${e.userFacingAnswer}, ${e.goodTreeAppMeaning}, ${e.userNextStep}, ${e.rerankDocument}, NOW())
			RETURNING id
		`;
		const entryId = row.id;

		await sql`
			INSERT INTO kb_entry_internal (entry_id, also_answers, classification_base, source_hash)
			VALUES (${entryId}, ${e.alsoAnswers.length ? e.alsoAnswers : null}, ${e.classificationBase}, ${hashEntry(e)})
		`;
		await sql`
			INSERT INTO kb_entry_governance (entry_id, status)
			VALUES (${entryId}, 'needs_revision')
		`;
		inserted++;
	}

	console.log(
		`Import complete. Inserted ${inserted}; skipped ${skippedExisting} already in DB (matched by question text); ` +
			`${dupesInFile} in-file duplicates skipped.`,
	);
	console.log('All imported entries are "needs_revision" — review and approve them at /admin/help.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

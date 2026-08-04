#!/usr/bin/env node
/**
 * Backfill alsoAnswers for KB entries that have none.
 * Generates 1-5 alternate phrasings of the same question via OpenAI, then updates DB.
 *
 * Usage:
 *   node scripts/backfill-also-answers.mjs [--dry-run] [--limit N]
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

function buildRerankDocument({ question, alsoAnswers, userFacingAnswer }) {
	return [question, alsoAnswers?.length ? alsoAnswers.join(', ') : null, userFacingAnswer]
		.filter(Boolean)
		.join('\n');
}

const BATCH_SIZE = 12;

async function generateAlsoAnswers(entries, apiKey) {
	const payload = entries.map((e) => ({ id: e.id, question: e.question, category: e.category }));

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			temperature: 0.4,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You generate alternate phrasings for a help-center FAQ knowledge base about Islamic estate planning and revocable living trusts.

For each entry, produce 1-5 alternate ways a real user might ask the SAME question in chat — synonyms and rephrasings only, NOT new questions or sub-questions.

Rules:
- Plain text only. No markdown, bullets, quotes, or numbering.
- Each phrasing must seek the same answer as the original question.
- Use natural conversational language (how someone would type in a help chat).
- Vary length and formality (short casual vs slightly formal).
- Do NOT repeat the original question verbatim.
- Do NOT add questions about related but different topics.
- Prefer 3-5 phrasings when the question allows; use fewer only if hard to vary.`,
				},
				{
					role: 'user',
					content: `Return JSON: { "entries": [ { "id": number, "alsoAnswers": string[] } ] }

Entries:
${JSON.stringify(payload, null, 2)}`,
				},
			],
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`OpenAI ${res.status}: ${text}`);
	}

	const data = await res.json();
	const content = data.choices?.[0]?.message?.content;
	if (!content) throw new Error('Empty OpenAI response');

	const parsed = JSON.parse(content);
	if (!Array.isArray(parsed.entries)) throw new Error('Expected entries array in response');
	return parsed.entries;
}

function sanitizeAlsoAnswers(originalQuestion, raw) {
	const orig = originalQuestion.toLowerCase().trim();
	const seen = new Set([orig]);
	const out = [];
	for (const s of raw ?? []) {
		const cleaned = String(s).trim().replace(/^["'`]+|["'`]+$/g, '');
		if (!cleaned) continue;
		const key = cleaned.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(cleaned);
		if (out.length >= 5) break;
	}
	return out;
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const limitArg = args.find((a) => a.startsWith('--limit='));
	const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

	const url = process.env.DATABASE_URL;
	const apiKey = process.env.OPENAI_API_KEY;
	if (!url) {
		console.error('DATABASE_URL required');
		process.exit(1);
	}
	if (!apiKey && !dryRun) {
		console.error('OPENAI_API_KEY required');
		process.exit(1);
	}

	const sql = neon(url);
	const rows = await sql`
		SELECT e.id, e.question, e.category, e.user_facing_answer, i.entry_id AS has_internal
		FROM kb_entry e
		LEFT JOIN kb_entry_internal i ON i.entry_id = e.id
		WHERE i.also_answers IS NULL OR array_length(i.also_answers, 1) IS NULL
		ORDER BY e.id
	`;

	const toProcess = rows.slice(0, limit);
	console.log(`Found ${rows.length} entries missing alsoAnswers; processing ${toProcess.length}.`);

	let updated = 0;
	let failed = 0;

	for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
		const batch = toProcess.slice(i, i + BATCH_SIZE);
		console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)} (IDs ${batch[0].id}-${batch[batch.length - 1].id})`);

		let generated;
		if (dryRun) {
			generated = batch.map((e) => ({
				id: e.id,
				alsoAnswers: [`alt phrasing for: ${e.question.slice(0, 40)}`],
			}));
		} else {
			generated = await generateAlsoAnswers(batch, apiKey);
		}

		const byId = new Map(generated.map((g) => [g.id, g.alsoAnswers]));

		for (const entry of batch) {
			const raw = byId.get(entry.id);
			if (!raw) {
				console.warn(`  [${entry.id}] no response — skipped`);
				failed++;
				continue;
			}

			const alsoAnswers = sanitizeAlsoAnswers(entry.question, raw);
			if (!alsoAnswers.length) {
				console.warn(`  [${entry.id}] empty after sanitize — skipped`);
				failed++;
				continue;
			}

			const rerankDocument = buildRerankDocument({
				question: entry.question,
				alsoAnswers,
				userFacingAnswer: entry.user_facing_answer,
			});

			console.log(`  [${entry.id}] ${alsoAnswers.length} phrasings: ${alsoAnswers[0].slice(0, 50)}…`);

			if (!dryRun) {
				await sql`
					UPDATE kb_entry
					SET rerank_document = ${rerankDocument}, updated_at = NOW()
					WHERE id = ${entry.id}
				`;

				if (entry.has_internal != null) {
					await sql`
						UPDATE kb_entry_internal
						SET also_answers = ${alsoAnswers}
						WHERE entry_id = ${entry.id}
					`;
				} else {
					await sql`
						INSERT INTO kb_entry_internal (entry_id, also_answers, classification_base)
						VALUES (${entry.id}, ${alsoAnswers}, 'safe')
					`;
				}
			}
			updated++;
		}

		if (!dryRun && i + BATCH_SIZE < toProcess.length) {
			await new Promise((r) => setTimeout(r, 500));
		}
	}

	console.log(`\nDone. Updated ${updated}; failed/skipped ${failed}.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

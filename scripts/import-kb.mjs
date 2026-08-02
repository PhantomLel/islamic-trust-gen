#!/usr/bin/env node
/**
 * Import Good Tree Help KB from DOCX into Postgres.
 * Usage: node scripts/import-kb.mjs [--dry-run] [path/to/kb.docx]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/** Node does not load .env automatically; drizzle-kit/vite do. */
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

const FIXTURE = {
	paragraphs: 669,
	cCards: 169,
	alsoAnswers: 12,
	classificationStrings: 17,
	stabilityStrings: 27,
	dExplainers: 15,
	eTemplates: 16,
	fMacros: 40,
	escalateNonNa: 153,
};

const SCHOLAR_IDS = new Set(['C9.6', 'C12.3', 'C12.4', 'C12.6', 'C12.8', 'C12.9', 'C12.10', 'C16.5']);
const POLICY_BLOCKED = new Set(['C17.11', 'C15.4']);

const CARD_LABELS = [
	'Question',
	'Also answers',
	'User-facing answer',
	'Good Tree app meaning',
	'User next step',
	'Escalate if',
	'Internal source/review note',
	'Source links',
	'Stability',
	'Classification',
];

function decodeXml(text) {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
}

function paragraphText(xml) {
	const withBreaks = xml.replace(/<w:br[^>]*\/>/g, '\n');
	const stripped = withBreaks.replace(/<[^>]+>/g, '');
	return decodeXml(stripped).trim();
}

function parseDocx(filePath) {
	const buf = fs.readFileSync(filePath);
	const zip = new PizZip(buf);
	const xml = zip.file('word/document.xml').asText();
	const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => paragraphText(m[0]));
	return paras;
}

function splitFields(body) {
	const fields = {};
	let current = null;
	for (const line of body.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const match = trimmed.match(/^([A-Za-z /\-]+):\s*(.*)$/);
		if (match && CARD_LABELS.includes(match[1])) {
			current = match[1];
			fields[current] = match[2] ?? '';
		} else if (current) {
			fields[current] += (fields[current] ? ' ' : '') + trimmed;
		}
	}
	return fields;
}

function parseClassification(raw) {
	const base = raw.startsWith('Safe FAQ')
		? 'safe'
		: raw.startsWith('Consult-trigger FAQ')
			? 'consult_trigger'
			: raw.startsWith('Do-not-answer')
				? 'do_not_answer'
				: 'safe';
	const needsManual = /\(/.test(raw);
	return { base, raw, needsManual };
}

function isEscalateNa(value) {
	return value.trim() === 'N/A.' || value.trim() === 'N/A';
}

function buildRerankDocument(fields) {
	return [
		fields['Question'],
		fields['Also answers'],
		fields['User-facing answer'],
	]
		.filter(Boolean)
		.join('\n');
}

function categoryFromId(sourceId) {
	const m = sourceId.match(/^C(\d+)/);
	if (!m) return null;
	const n = Number(m[1]);
	const names = {
		1: 'Getting Started',
		2: 'Revocable Living Trusts',
		3: 'What Happens When I Die',
		4: 'Signing and Notarization',
		5: 'Funding and Assets',
		6: 'Bank and Brokerage',
		7: 'Home / Deed',
		8: 'Retirement Accounts',
		9: 'Life Insurance',
		10: 'Vehicles',
		11: 'Cryptocurrency',
		12: 'Islamic Inheritance',
		13: 'Marital Property',
		14: 'Children, Guardians, Trustees',
		15: 'Storage and Family Readiness',
		16: 'Waqf and Charity',
		17: 'Troubleshooting',
	};
	return names[n] ?? `Category ${n}`;
}

function hashContent(obj) {
	return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function extract(paras) {
	const cCards = [];
	const dExplainers = [];
	const eTemplates = [];
	const fMacros = [];
	const classificationSet = new Set();
	const stabilitySet = new Set();
	let alsoAnswersCount = 0;
	let escalateNonNa = 0;

	for (let i = 0; i < paras.length; i++) {
		const p = paras[i].trim();
		if (/^C\d+\.\d+$/.test(p)) {
			const sourceId = p;
			const body = paras[i + 1] ?? '';
			const fields = splitFields(body);
			if (fields['Also answers']) alsoAnswersCount++;
			const esc = fields['Escalate if'] ?? '';
			if (!isEscalateNa(esc)) escalateNonNa++;
			const cls = fields['Classification'] ?? '';
			if (cls) classificationSet.add(cls);
			const stab = fields['Stability'] ?? '';
			if (stab) stabilitySet.add(stab);
			const { base, raw, needsManual } = parseClassification(cls);
			const blocked = POLICY_BLOCKED.has(sourceId) || /\bBlocked until\b/i.test(body);
			cCards.push({
				sourceId,
				entryType: 'faq',
				category: categoryFromId(sourceId),
				question: fields['Question'] ?? '',
				userFacingAnswer: fields['User-facing answer'] ?? '',
				goodTreeAppMeaning: fields['Good Tree app meaning'] ?? '',
				userNextStep: fields['User next step'] ?? '',
				alsoAnswers: fields['Also answers']
					? fields['Also answers'].split(/[,;]/).map((s) => s.trim()).filter(Boolean)
					: [],
				classificationBase: base,
				classificationRaw: raw,
				stabilityRaw: stab,
				sourceReviewNote: fields['Internal source/review note'] ?? '',
				sourceLinks: fields['Source links'] ?? '',
				escalateIfRaw: esc,
				needsManualPolicy: needsManual,
				rerankDocument: buildRerankDocument(fields),
				status: blocked ? 'needs_revision' : 'approved',
				gates: [
					...(SCHOLAR_IDS.has(sourceId)
						? [{ gateType: 'scholar_review', required: true, satisfied: false }]
						: []),
					...(POLICY_BLOCKED.has(sourceId)
						? [{ gateType: 'policy_confirmation', required: true, satisfied: false }]
						: []),
					...(fields['Source links']?.includes('verify')
						? [{ gateType: 'citation_verification', required: true, satisfied: false }]
						: []),
				],
			});
		} else if (/^D\.\d+/.test(p)) {
			const [head, ...rest] = p.split(' — ');
			const sourceId = head.match(/^D\.\d+/)?.[0] ?? head;
			const title = rest.join(' — ') || head;
			const body = paras[i + 1] ?? p;
			dExplainers.push({
				sourceId,
				entryType: 'explainer',
				category: 'Understand Your Plan',
				title,
				question: title,
				userFacingAnswer: body.length > title.length ? body : paras[i + 1] ?? body,
				status: 'approved',
				rerankDocument: `${title}\n${body}`,
			});
		} else if (/^E-\d+/.test(p)) {
			const [head, ...rest] = p.split(' — ');
			const templateId = head.match(/^E-\d+/)?.[0] ?? head;
			const title = rest.join(' — ') || templateId;
			const body = paras[i + 1] ?? p.replace(/^E-\d+\s*—\s*/, '');
			eTemplates.push({
				templateId,
				title,
				body: typeof body === 'string' ? body : title,
				status: 'approved',
			});
		} else if (/^F-\d+/.test(p)) {
			const normalized = p.replace(/[""]/g, '"');
			const m = normalized.match(/^(F-\d+)\s*\(([^)]+)\):\s*(.+)$/s);
			if (m) {
				fMacros.push({
					macroId: m[1],
					title: m[2],
					body: m[3].replace(/^["']|["']$/g, ''),
				});
			} else {
				const id = p.match(/^F-\d+/)?.[0];
				if (id) fMacros.push({ macroId: id, title: id, body: p });
			}
		}
	}

	// A.5 no-approved-answer script
	eTemplates.push({
		templateId: 'A-5-no-answer',
		title: 'No approved answer',
		body: 'I want to make sure you get an accurate answer rather than a guess. I don\'t have approved information on that. Please contact the Good Tree team or book a consultation, and we\'ll get you a real answer.',
		status: 'approved',
	});

	return {
		cCards,
		dExplainers,
		eTemplates,
		fMacros,
		stats: {
			paragraphs: paras.length,
			cCards: cCards.length,
			alsoAnswers: alsoAnswersCount,
			classificationStrings: classificationSet.size,
			stabilityStrings: stabilitySet.size,
			dExplainers: dExplainers.length,
			eTemplates: eTemplates.length,
			fMacros: fMacros.length,
			escalateNonNa,
		},
	};
}

function assertFixtures(stats) {
	const errors = [];
	for (const [k, expected] of Object.entries(FIXTURE)) {
		if (stats[k] !== expected) errors.push(`${k}: expected ${expected}, got ${stats[k]}`);
	}
	return errors;
}

async function writeToDb(data) {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			'DATABASE_URL required for import. Add it to .env in the project root (see .env.example).',
		);
	}
	const sql = neon(url);

	for (const card of data.cCards) {
		const hash = hashContent(card);
		const entryRows = await sql`
			INSERT INTO kb_entry (source_id, entry_type, category, title, question, user_facing_answer, good_tree_app_meaning, user_next_step, rerank_document, updated_at)
			VALUES (${card.sourceId}, ${card.entryType}, ${card.category}, ${card.question}, ${card.question}, ${card.userFacingAnswer}, ${card.goodTreeAppMeaning}, ${card.userNextStep}, ${card.rerankDocument}, NOW())
			ON CONFLICT (source_id) DO UPDATE SET
				category = EXCLUDED.category,
				question = EXCLUDED.question,
				user_facing_answer = EXCLUDED.user_facing_answer,
				good_tree_app_meaning = EXCLUDED.good_tree_app_meaning,
				user_next_step = EXCLUDED.user_next_step,
				rerank_document = EXCLUDED.rerank_document,
				updated_at = NOW()
			RETURNING id`;
		const entryId = entryRows[0].id;
		await sql`
			INSERT INTO kb_entry_internal (entry_id, also_answers, classification_base, classification_raw, stability_raw, source_review_note, source_links, source_hash, needs_manual_policy, escalate_if_raw)
			VALUES (${entryId}, ${card.alsoAnswers}, ${card.classificationBase}, ${card.classificationRaw}, ${card.stabilityRaw}, ${card.sourceReviewNote}, ${card.sourceLinks}, ${hash}, ${card.needsManualPolicy}, ${card.escalateIfRaw})
			ON CONFLICT (entry_id) DO UPDATE SET
				also_answers = EXCLUDED.also_answers,
				classification_base = EXCLUDED.classification_base,
				classification_raw = EXCLUDED.classification_raw,
				stability_raw = EXCLUDED.stability_raw,
				source_review_note = EXCLUDED.source_review_note,
				source_links = EXCLUDED.source_links,
				source_hash = EXCLUDED.source_hash,
				needs_manual_policy = EXCLUDED.needs_manual_policy,
				escalate_if_raw = EXCLUDED.escalate_if_raw`;
		await sql`
			INSERT INTO kb_entry_governance (entry_id, status)
			VALUES (${entryId}, ${card.status})
			ON CONFLICT (entry_id) DO UPDATE SET status = EXCLUDED.status`;
		for (const gate of card.gates) {
			await sql`
				INSERT INTO kb_publication_gate (content_type, content_id, gate_type, required, satisfied, updated_at)
				VALUES ('kb_entry', ${card.sourceId}, ${gate.gateType}, ${gate.required}, ${gate.satisfied}, NOW())
				ON CONFLICT DO NOTHING`;
		}
	}

	for (const exp of data.dExplainers) {
		const rows = await sql`
			INSERT INTO kb_entry (source_id, entry_type, category, title, question, user_facing_answer, rerank_document, updated_at)
			VALUES (${exp.sourceId}, 'explainer', ${exp.category}, ${exp.title}, ${exp.question}, ${exp.userFacingAnswer}, ${exp.rerankDocument}, NOW())
			ON CONFLICT (source_id) DO UPDATE SET title = EXCLUDED.title, user_facing_answer = EXCLUDED.user_facing_answer, rerank_document = EXCLUDED.rerank_document, updated_at = NOW()
			RETURNING id`;
		await sql`INSERT INTO kb_entry_governance (entry_id, status) VALUES (${rows[0].id}, 'approved') ON CONFLICT (entry_id) DO NOTHING`;
	}

	for (const tpl of data.eTemplates) {
		await sql`
			INSERT INTO help_template (template_id, title, body, status, source_hash, updated_at)
			VALUES (${tpl.templateId}, ${tpl.title}, ${tpl.body}, ${tpl.status}, ${hashContent(tpl)}, NOW())
			ON CONFLICT (template_id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = NOW()`;
	}

	for (const macro of data.fMacros) {
		await sql`
			INSERT INTO help_staff_macro (macro_id, title, body, updated_at)
			VALUES (${macro.macroId}, ${macro.title}, ${macro.body}, NOW())
			ON CONFLICT (macro_id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = NOW()`;
	}
}

const dryRun = process.argv.includes('--dry-run');
const fileArg = process.argv.find((a) => a.endsWith('.docx'));
const defaultPath = path.join(process.env.HOME ?? '', 'Documents/good_tree_help_kb.docx');
const filePath = fileArg ?? defaultPath;

if (!fs.existsSync(filePath)) {
	console.error('KB file not found:', filePath);
	process.exit(1);
}

const paras = parseDocx(filePath);
const data = extract(paras);
const errors = assertFixtures(data.stats);

console.log('Import report:', JSON.stringify(data.stats, null, 2));
if (errors.length) {
	console.error('Fixture errors:', errors);
	process.exit(1);
}

if (dryRun) {
	console.log('Dry run OK. Sample card:', data.cCards[0]?.sourceId);
	process.exit(0);
}

await writeToDb(data);
console.log('Import complete.');

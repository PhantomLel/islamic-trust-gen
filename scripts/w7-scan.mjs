/**
 * AA W7.1. Fetch the rendered HTML of every sitemap URL on both hosts.
 *
 * Usage: node scripts/w7-scan.mjs http://127.0.0.1:5173
 *
 * Writes docs/w7-scan.md. A hit is explained when it matches an allowlist
 * context from src/lib/copy/banned.ts (internal keys, D19, legal "partnership").
 */
import { readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2];
if (!base) {
	console.error('Usage: node scripts/w7-scan.mjs <base-url>');
	process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bannedSrc = readFileSync(join(root, 'src/lib/copy/banned.ts'), 'utf8');
const block = bannedSrc.slice(
	bannedSrc.indexOf('export const BANNED_PHRASES'),
	bannedSrc.indexOf('] as const'),
);
const phrases = [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);

const hosts = [
	{ host: 'www.muslimlegacyplanning.com', label: 'MLP' },
	{ host: 'www.mcdanielestateplanning.com', label: 'MEP' },
];

function explanation(phrase, snippet) {
	const lower = snippet.toLowerCase();
	const key = phrase.toLowerCase();
	if (key === 'partnership' && (lower.includes('llc, partnership') || lower.includes('domestic partnership'))) {
		return 'Legal form of business, or marital status. Not a vendor partnership.';
	}
	if (key === 'same day' && lower.includes('nikah and civil marriage were on the same day')) {
		return 'Marriage-date question. Not the Jabal donation claim.';
	}
	if ((key === 'goodtree' || key === 'good tree') && /goodtree-trust|goodtree_fit|utm_source=goodtree|['"]goodtree['"]/.test(lower)) {
		return 'Internal key. Not user-facing product copy.';
	}
	if (key === 'enforce' && lower.includes('make it enforceable')) {
		return 'D19 freezes the inheritance calculator. The button still says “Make it enforceable”.';
	}
	return null;
}

function get(path, host) {
	const url = new URL(path, base);
	const lib = url.protocol === 'https:' ? https : http;
	return new Promise((resolve, reject) => {
		const req = lib.request(
			{
				hostname: url.hostname,
				port: url.port,
				path: `${url.pathname}${url.search}`,
				method: 'GET',
				headers: { Host: host, Accept: 'text/html' },
				timeout: 20000,
			},
			(res) => {
				const chunks = [];
				res.on('data', (chunk) => chunks.push(chunk));
				res.on('end', () => {
					resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString('utf8') });
				});
			},
		);
		req.on('error', reject);
		req.on('timeout', () => req.destroy(new Error(`timeout ${host} ${path}`)));
		req.end();
	});
}

function pathsFromSitemap(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
		try {
			return new URL(match[1]).pathname || '/';
		} catch {
			return match[1];
		}
	});
}

const rows = [];
const fetched = [];

for (const { host, label } of hosts) {
	const sitemap = await get('/sitemap.xml', host);
	const paths = pathsFromSitemap(sitemap.text);
	if (paths.length === 0) {
		fetched.push({ label, path: '/sitemap.xml', status: sitemap.status, note: 'no locs' });
	}
	for (const path of paths) {
		const page = await get(path, host);
		fetched.push({ label, path, status: page.status });
		const lower = page.text.toLowerCase();
		for (const phrase of phrases) {
			const needle = phrase.toLowerCase();
			let from = 0;
			while (from < lower.length) {
				const at = lower.indexOf(needle, from);
				if (at < 0) break;
				const snippet = page.text.slice(Math.max(0, at - 70), at + needle.length + 70).replace(/\s+/g, ' ').trim();
				rows.push({ label, path, phrase, why: explanation(phrase, snippet), snippet });
				from = at + needle.length;
			}
		}
	}
}

const unexplained = rows.filter((row) => !row.why);
const lines = [
	'# W7 scan',
	'',
	`Base: ${base}`,
	`Generated: ${new Date().toISOString()}`,
	'',
	`${fetched.length} pages. ${rows.length} hits. ${unexplained.length} unexplained.`,
	'',
	'## Pages',
	'',
	...fetched.map((page) => `- ${page.label} ${page.path} — ${page.status}${page.note ? ` (${page.note})` : ''}`),
	'',
	'## Hits',
	'',
];

if (rows.length === 0) {
	lines.push('None.');
} else {
	for (const row of rows) {
		lines.push(`- **${row.label} ${row.path}** \`${row.phrase}\` — ${row.why ?? 'UNEXPLAINED'}`);
		lines.push(`  - \`${row.snippet.replace(/`/g, "'")}\``);
	}
}

lines.push(
	'',
	'## Source allowlist not always visible in the first HTML response',
	'',
	'- `src/routes/inheritance-calculator/+page.svelte` still contains “Make it enforceable”. D19 says not to change the calculator. The button renders only after a calculation, so this fetch may not see it.',
	'- `src/lib/config.ts` keeps `goodtree-trust`, `goodtree_fit`, `utm_source=goodtree`, and the nikah “same day” question.',
	'- `src/routes/plans/+page.svelte` still says “shariah compliance gaps”. That is not the W7.1 string “shariah-compliant”. TODO(Leonard): replacement not in the spec.',
	'',
);

writeFileSync(join(root, 'docs/w7-scan.md'), lines.join('\n'));
console.log(`Wrote docs/w7-scan.md — ${rows.length} hits, ${unexplained.length} unexplained`);
if (unexplained.length > 0) process.exitCode = 1;

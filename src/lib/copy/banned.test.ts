import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BANNED_ALLOWLIST, BANNED_PHRASES } from './banned';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

const EXCLUDED_ROUTE_PREFIXES = [
	'admin/',
	'create-trust/',
	'dashboard/',
	'make-your-trust-work/',
];

const INTERNAL_KEY = /goodtree-trust|goodtree_fit|utm_source=goodtree|['"]goodtree['"]|\bgoodtree\s*:/gi;

function collectSvelte(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...collectSvelte(path));
		else if (entry.name.endsWith('.svelte')) out.push(path);
	}
	return out;
}

function isScannedRoute(abs: string): boolean {
	const rel = relative(join(repoRoot, 'src/routes'), abs).split('\\').join('/');
	if (rel.startsWith('..')) return false;
	return !EXCLUDED_ROUTE_PREFIXES.some((prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix));
}

function goodTreeHitsAreInternal(line: string): boolean {
	const lower = line.toLowerCase();
	const ranges: { start: number; end: number }[] = [];
	for (const match of lower.matchAll(INTERNAL_KEY)) {
		if (match.index === undefined) continue;
		ranges.push({ start: match.index, end: match.index + match[0].length });
	}
	for (const match of lower.matchAll(/goodtree/g)) {
		if (match.index === undefined) continue;
		const covered = ranges.some((range) => match.index! >= range.start && match.index! < range.end);
		if (!covered) return false;
	}
	return true;
}

function isAllowed(file: string, phrase: string, line: string): boolean {
	return BANNED_ALLOWLIST.some((entry) => {
		if (entry.file !== file) return false;
		if (entry.string.toLowerCase() !== phrase.toLowerCase()) return false;
		if (entry.lineIncludes && !line.toLowerCase().includes(entry.lineIncludes.toLowerCase())) return false;
		if (entry.internalKey && !goodTreeHitsAreInternal(line)) return false;
		return true;
	});
}

function scan(abs: string): string[] {
	const file = relative(repoRoot, abs).split('\\').join('/');
	const hits: string[] = [];
	const lines = readFileSync(abs, 'utf8').split('\n');
	lines.forEach((line, index) => {
		const lower = line.toLowerCase();
		for (const phrase of BANNED_PHRASES) {
			if (!lower.includes(phrase.toLowerCase())) continue;
			if (isAllowed(file, phrase, line)) continue;
			hits.push(`${file}:${index + 1} [${phrase}] ${line.trim()}`);
		}
	});
	return hits;
}

describe('banned phrases (AA W7.1 and W6.2)', () => {
	it('does not appear in public svelte routes or config.ts, apart from the allowlist', () => {
		const files = [
			...collectSvelte(join(repoRoot, 'src/routes')).filter(isScannedRoute),
			join(repoRoot, 'src/lib/config.ts'),
		];
		expect(files.flatMap(scan)).toEqual([]);
	});
});

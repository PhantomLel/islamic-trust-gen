import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

function collectFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...collectFiles(path));
		else if (statSync(path).isFile()) out.push(path);
	}
	return out;
}

describe('accessibility shell (AA W8.1, D16)', () => {
	it('does not lock pinch-zoom in src/app.html', () => {
		const html = readFileSync(join(repoRoot, 'src/app.html'), 'utf8');
		expect(html).not.toMatch(/maximum-scale|user-scalable/);
	});

	it('does not request Google Fonts or the Video.js CDN from app.html or routes', () => {
		const files = [join(repoRoot, 'src/app.html'), ...collectFiles(join(repoRoot, 'src/routes'))];
		const hits: string[] = [];
		for (const abs of files) {
			const text = readFileSync(abs, 'utf8');
			if (!text.includes('fonts.googleapis.com') && !text.includes('vjs.zencdn.net')) continue;
			const rel = relative(repoRoot, abs).split('\\').join('/');
			hits.push(rel);
		}
		expect(hits).toEqual([]);
	});
});

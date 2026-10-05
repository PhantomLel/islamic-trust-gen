import { mcdanielOrigin, mlpOrigin } from '$lib/config';
import { sitemapRoutes, type SiteId } from '$lib/seo';

/** Private areas: account, admin, checkout and API. Public marketing and content routes stay crawlable. */
export const DISALLOWED_PATHS = [
	'/admin',
	'/api/',
	'/dashboard',
	'/create-trust',
	'/consultation',
	'/make-your-trust-work',
	'/login',
	'/signup',
	'/unsubscribe',
];

export function robotsTxt(site: SiteId): string {
	const origin = site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin;
	const lines = ['User-agent: *'];
	if (site === 'mlp') {
		for (const p of DISALLOWED_PATHS) lines.push(`Disallow: ${p}`);
	} else {
		lines.push('Disallow:');
	}
	lines.push('', `Sitemap: ${origin}/sitemap.xml`, '');
	return lines.join('\n');
}

export type SitemapEntry = { path: string; lastmod?: Date | string | null };

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function staticSitemapEntries(site: SiteId): SitemapEntry[] {
	return sitemapRoutes.filter((r) => r.site === site).map((r) => ({ path: r.path }));
}

export function sitemapXml(site: SiteId, entries: SitemapEntry[]): string {
	const origin = site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin;
	const seen = new Set<string>();
	const urls: string[] = [];
	for (const e of entries) {
		if (seen.has(e.path)) continue;
		seen.add(e.path);
		const loc = esc(e.path === '/' ? `${origin}/` : `${origin}${e.path}`);
		const lm = e.lastmod ? new Date(e.lastmod).toISOString().slice(0, 10) : null;
		urls.push(`  <url><loc>${loc}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</url>`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

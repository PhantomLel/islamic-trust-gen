import type { RequestHandler } from './$types';
import { crawlSite, sitemapXml, staticSitemapEntries, type SitemapEntry } from '$lib/robots';
import { publishedPageSitemap } from '$lib/server/content/pages';
import { publishedVideoSitemap } from '$lib/server/content/videos';
import { seriesSlugOf } from '$lib/server/content/videoView';

export const GET: RequestHandler = async ({ url }) => {
	const site = crawlSite(url);
	const entries: SitemapEntry[] = [...staticSitemapEntries(site)];

	if (site === 'mlp') {
		try {
			const [pages, videos] = await Promise.all([publishedPageSitemap(), publishedVideoSitemap()]);
			for (const p of pages) {
				entries.push({ path: `/answers/${p.slug}`, lastmod: p.lastReviewedOn ?? p.updatedAt });
			}
			const seriesSeen = new Set<string>();
			for (const v of videos) {
				entries.push({ path: `/videos/${v.slug}`, lastmod: v.updatedAt });
				const s = seriesSlugOf(v.series);
				if (s && !seriesSeen.has(s)) {
					seriesSeen.add(s);
					entries.push({ path: `/videos/series/${s}`, lastmod: v.updatedAt });
				}
			}
		} catch (e) {
			console.error('[sitemap] CMS entries skipped', e);
		}
	}

	return new Response(sitemapXml(site, entries), {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
	});
};

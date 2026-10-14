import { describe, expect, it } from 'vitest';
import { mcdanielOrigin, mlpOrigin } from '$lib/config';
import { robotsTxt, sitemapXml, staticSitemapEntries } from '$lib/robots';
import {
	canonicalUrl,
	isNoindexRoute,
	jsonLdScript,
	organizationJsonLd,
	resolveSeo,
	sitemapRoutes,
	siteForHost,
	staticRouteSeo,
} from '$lib/seo';

const MEP_PAGES = [
	'/attorney',
	'/legacy-plan',
	'/family-waqf-plan',
	'/probate-estate-administration',
	'/business-succession-planning',
] as const;

describe('canonicalUrl', () => {
	it('uses the MLP origin for MLP paths and drops query strings', () => {
		expect(canonicalUrl(new URL('https://www.muslimlegacyplanning.com/plans?utm_campaign=x'))).toBe(`${mlpOrigin}/plans`);
		expect(canonicalUrl(new URL('https://muslimlegacyplanning.com/plans?x=1'))).toBe(`${mlpOrigin}/plans`);
		expect(canonicalUrl(new URL('http://localhost:5173/'))).toBe(`${mlpOrigin}/`);
	});

	it('uses the firm origin on the firm host, and for the internal /mcdaniel tree on the MLP host', () => {
		expect(canonicalUrl(new URL('https://www.mcdanielestateplanning.com/'))).toBe(`${mcdanielOrigin}/`);
		expect(canonicalUrl(new URL('https://mcdanielestateplanning.com/attorney'))).toBe(`${mcdanielOrigin}/attorney`);
		expect(canonicalUrl(new URL('https://www.muslimlegacyplanning.com/mcdaniel'))).toBe(`${mcdanielOrigin}/`);
		expect(canonicalUrl(new URL('https://www.muslimlegacyplanning.com/mcdaniel/about/'))).toBe(`${mcdanielOrigin}/about`);
	});
});

describe('resolveSeo', () => {
	it('gives every static public route a title, description, canonical and image', () => {
		const seo = resolveSeo({ routeId: '/plans', url: new URL('https://www.muslimlegacyplanning.com/plans') });
		expect(seo?.title).toBeTruthy();
		expect(seo?.description).toBeTruthy();
		expect(seo?.canonical).toBe(`${mlpOrigin}/plans`);
		expect(seo?.image).toBe('/og-image.png');
		expect(seo?.robots).toBeNull();
	});

	it('marks account and admin routes noindex', () => {
		expect(isNoindexRoute('/dashboard')).toBe(true);
		expect(isNoindexRoute('/create-trust/[trust_id]')).toBe(true);
		expect(isNoindexRoute('/plans')).toBe(false);
		const seo = resolveSeo({ routeId: '/admin/users', url: new URL('https://x.test/admin/users') });
		expect(seo?.robots).toBe('noindex, nofollow');
	});

	it('emits organisation JSON-LD only on the home page of each host', () => {
		const home = resolveSeo({ routeId: '/', url: new URL('https://www.muslimlegacyplanning.com/') });
		const plans = resolveSeo({ routeId: '/plans', url: new URL('https://www.muslimlegacyplanning.com/plans') });
		expect(home?.jsonLd.length).toBe(2);
		expect(plans?.jsonLd.length).toBe(0);
	});
});

describe('organizationJsonLd', () => {
	it('carries no street address and no sameAs list', () => {
		for (const site of ['mlp', 'mcdaniel'] as const) {
			const text = JSON.stringify(organizationJsonLd(site));
			expect(text).not.toMatch(/address|sameAs|Lamar|Austin|78756/i);
			expect(text).toContain('LegalService');
			expect(text).toContain('Organization');
		}
	});

	it('escapes markup so JSON-LD cannot break out of its script tag', () => {
		const out = jsonLdScript({ name: '</script><script>alert(1)</script>' });
		expect(out.match(/<\/script>/g)?.length).toBe(1);
	});
});

describe('robots and sitemap', () => {
	it('keeps public routes crawlable and points at the host-specific sitemap', () => {
		const mlp = robotsTxt('mlp');
		expect(mlp).toContain(`Sitemap: ${mlpOrigin}/sitemap.xml`);
		expect(mlp).toContain('Disallow: /admin');
		expect(mlp).not.toMatch(/Disallow: \/(plans|trust|answers|videos|free-islamic-will)/);
		expect(robotsTxt('mcdaniel')).toContain(`Sitemap: ${mcdanielOrigin}/sitemap.xml`);
	});

	it('lists only the owning host\'s URLs', () => {
		const xml = sitemapXml('mcdaniel', staticSitemapEntries('mcdaniel'));
		expect(xml).toContain(`${mcdanielOrigin}/attorney`);
		expect(xml).not.toContain(`${mcdanielOrigin}/about`);
		expect(xml).not.toContain(mlpOrigin);
	});

	it('gives each new MEP page a title, a description, and a sitemap entry', () => {
		for (const path of MEP_PAGES) {
			const seo = staticRouteSeo[`/mcdaniel${path}`];
			expect(seo?.title, path).toBeTruthy();
			expect(seo?.description, path).toBeTruthy();
			expect(sitemapRoutes).toContainEqual({ site: 'mcdaniel', path });
		}
	});

	it('publishes the privacy policy on both sites', () => {
		for (const [routeId, url] of [
			['/privacy', 'https://www.muslimlegacyplanning.com/privacy'],
			['/mcdaniel/privacy', 'https://www.mcdanielestateplanning.com/privacy'],
		] as const) {
			const seo = resolveSeo({ routeId, url: new URL(url) });
			expect(seo?.title).toContain('Privacy Policy');
			expect(seo?.description).toContain('McDaniel Estate Planning');
			expect(seo?.canonical).toBe(url);
		}
		expect(sitemapRoutes).toContainEqual({ site: 'mlp', path: '/privacy' });
		expect(sitemapRoutes).toContainEqual({ site: 'mcdaniel', path: '/privacy' });
	});

	it('detects the firm host', () => {
		expect(siteForHost('www.mcdanielestateplanning.com')).toBe('mcdaniel');
		expect(siteForHost('www.muslimlegacyplanning.com')).toBe('mlp');
	});
});

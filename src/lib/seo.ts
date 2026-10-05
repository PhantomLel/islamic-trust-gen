/**
 * Per-page SEO (spec v3 §5): title, description, canonical, Open Graph / Twitter
 * tags and JSON-LD for the two public sites served from this app.
 *
 * Two hosts share one deployment (see `src/hooks.ts`):
 *   - Muslim Legacy Planning  → `mlpOrigin`
 *   - McDaniel Estate Planning → `mcdanielOrigin` (internally rerouted to /mcdaniel/*)
 *
 * Canonicals always point at the host that owns the content, so reaching the
 * internal `/mcdaniel/*` tree from the MLP host canonicalises to the firm site.
 *
 * Titles and descriptions for static routes live here, in one table, so a page
 * never carries its own copy. Dynamic pages (answers, videos) return `seo` in
 * their load data instead.
 */
import {
	attorneyName,
	attorneyProfileUrl,
	firmPhoneTel,
	mcdanielOrigin,
	mlpOrigin,
	productAttorneyReviewSentence,
	productName,
	siteName,
} from '$lib/config';

export type SiteId = 'mlp' | 'mcdaniel';

export type PageSeo = {
	title: string;
	description: string;
	/** Path on the owning site (`/og-image.png`) or an absolute https URL (uploaded social image). */
	image?: string;
	type?: 'website' | 'article' | 'video.other';
	/** ISO date strings, used only for `article`. */
	publishedTime?: string;
	modifiedTime?: string;
	/** Extra JSON-LD objects for this page (VideoObject, Article, Person, …). */
	jsonLd?: Record<string, unknown>[];
};

export type ResolvedSeo = {
	title: string;
	description: string;
	canonical: string;
	origin: string;
	image: string;
	type: string;
	robots: string | null;
	site: SiteId;
	siteLabel: string;
	publishedTime?: string;
	modifiedTime?: string;
	jsonLd: Record<string, unknown>[];
};

export const DEFAULT_OG_IMAGE = '/og-image.png';

const MCDANIEL_HOSTS = new Set(['mcdanielestateplanning.com', 'www.mcdanielestateplanning.com']);
const MCDANIEL_TITLE = 'McDaniel Estate Planning, PLLC';

export function siteForHost(hostname: string): SiteId {
	return MCDANIEL_HOSTS.has(hostname.toLowerCase()) ? 'mcdaniel' : 'mlp';
}

/** Path as the visitor sees it on the owning site (no internal `/mcdaniel` prefix). */
export function publicPathFor(url: URL): { site: SiteId; path: string } {
	const hostSite = siteForHost(url.hostname);
	let path = url.pathname || '/';
	let site = hostSite;
	if (hostSite === 'mlp' && (path === '/mcdaniel' || path.startsWith('/mcdaniel/'))) {
		// Direct hit on the internal tree from the MLP host: the firm site owns this content.
		site = 'mcdaniel';
		path = path.slice('/mcdaniel'.length) || '/';
	}
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	return { site, path };
}

export function canonicalUrl(url: URL): string {
	const { site, path } = publicPathFor(url);
	const origin = site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin;
	return path === '/' ? `${origin}/` : `${origin}${path}`;
}

/** Route ids whose pages need no search presence (account, admin, checkout, API). */
const NOINDEX_PREFIXES = [
	'/admin',
	'/api',
	'/dashboard',
	'/create-trust',
	'/consultation',
	'/make-your-trust-work',
	'/login',
	'/signup',
	'/unsubscribe',
	'/demo',
	'/inheritance-testing',
	'/help',
];

export function isNoindexRoute(routeId: string | null): boolean {
	if (!routeId) return false;
	return NOINDEX_PREFIXES.some((p) => routeId === p || routeId.startsWith(`${p}/`));
}

/** Titles and descriptions for static public routes. Existing copy was moved here unchanged. */
export const staticRouteSeo: Record<string, PageSeo> = {
	'/': {
		title: `${siteName} — Islamic Estate Planning`,
		description:
			"Attorney-led Islamic estate planning for Muslim families. Wills, trusts, prenuptials, and business succession grounded in Qur'anic principles and U.S. law.",
	},
	'/plans': {
		title: `Plans — ${siteName}`,
		description:
			'All five Islamic estate planning packages — from the free Islamic will to the Family Waqf Plan and advanced charitable structures.',
	},
	'/trust': {
		title: `${productName} — ${siteName}`,
		description: productAttorneyReviewSentence,
	},
	'/which-plan': {
		title: `Which Plan Is Right for You — ${siteName}`,
		description: "Answer six questions to find the Islamic estate plan that fits your family's situation.",
	},
	'/free-islamic-will': {
		title: `Free Islamic Will — ${siteName}`,
		description:
			'Create your free Islamic will in about 10 minutes. Attorney-informed, shariah-grounded, and the right first step for every Muslim family.',
	},
	'/inheritance-calculator': {
		title: `Islamic Inheritance Calculator (Farāʾiḍ) | ${siteName}`,
		description:
			"Estimate how your estate would be divided among your Islamic heirs under the Qur'anic shares (farāʾiḍ). Free, instant, and easy to use.",
	},
	'/beneficiary-checklist': {
		title: `Review Your Beneficiary Designations | ${siteName}`,
		description:
			'A checklist to review retirement, insurance, and payable-on-death beneficiary forms so they support your Islamic estate plan.',
	},
	'/islamic-heirs-explained': {
		title: `Who Counts as an Islamic Heir? | ${siteName}`,
		description:
			'A short guide to Islamic inheritance eligibility — whom to include in the faraid calculator and why.',
	},
	'/community-property': {
		title: `Why Islamic Wills Fail — ${siteName}`,
		description:
			'Two reasons Islamic wills fail, and the trust-based solution — three short videos from McDaniel Estate Planning.',
	},
	'/answers': {
		title: `Answers — ${siteName}`,
		description: 'Answers about Islamic estate planning from Muslim Legacy Planning.',
	},
	'/videos': {
		title: `Videos — ${siteName}`,
		description: 'Videos about Islamic estate planning from Muslim Legacy Planning.',
	},
	'/mcdaniel': {
		title: `${MCDANIEL_TITLE} — Islamic Estate Planning Attorney | Texas & California`,
		description:
			'McDaniel Estate Planning helps Muslim families create legally sound wills, trusts, deeds, and probate plans designed to honor Islamic inheritance principles while complying with U.S. law. Attorney Leonard McDaniel is licensed in Texas and California.',
	},
	'/mcdaniel/about': {
		title: `About ${attorneyName} — ${MCDANIEL_TITLE}`,
		description: `${attorneyName} is an estate planning attorney licensed in Texas and California. He has focused on estate planning for Muslim families since 2022.`,
	},
};

/** Routes (by route id) that appear in the sitemap. Dynamic content is appended by the sitemap handler. */
export const sitemapRoutes: { site: SiteId; path: string }[] = [
	{ site: 'mlp', path: '/' },
	{ site: 'mlp', path: '/plans' },
	{ site: 'mlp', path: '/trust' },
	{ site: 'mlp', path: '/which-plan' },
	{ site: 'mlp', path: '/free-islamic-will' },
	{ site: 'mlp', path: '/inheritance-calculator' },
	{ site: 'mlp', path: '/beneficiary-checklist' },
	{ site: 'mlp', path: '/islamic-heirs-explained' },
	{ site: 'mlp', path: '/community-property' },
	{ site: 'mlp', path: '/answers' },
	{ site: 'mlp', path: '/videos' },
	{ site: 'mcdaniel', path: '/' },
	{ site: 'mcdaniel', path: '/about' },
];

/**
 * JSON-LD for the organisation. Name and phone come from `config.ts`.
 * Deliberately carries no street address and no `sameAs` profile list
 * (the firm's street address is not published on the web properties).
 */
export function organizationJsonLd(site: SiteId): Record<string, unknown>[] {
	const name = site === 'mcdaniel' ? MCDANIEL_TITLE : siteName;
	const origin = site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin;
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name,
			url: origin,
			logo: `${origin}/mcdaniel.png`,
			telephone: firmPhoneTel,
		},
		{
			'@context': 'https://schema.org',
			'@type': 'LegalService',
			name,
			url: origin,
			telephone: firmPhoneTel,
			areaServed: [
				{ '@type': 'State', name: 'Texas' },
				{ '@type': 'State', name: 'California' },
			],
		},
	];
}

/** Person structured data for the attorney profile page. Admissions are the active ones only. */
export function attorneyJsonLd(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: `${attorneyName}, JD`,
		jobTitle: 'Estate planning attorney',
		url: attorneyProfileUrl,
		image: `${mcdanielOrigin}/pfp.jpg`,
		alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Houston Law Center' },
		worksFor: { '@type': 'LegalService', name: MCDANIEL_TITLE, url: mcdanielOrigin, telephone: firmPhoneTel },
		hasCredential: [
			{
				'@type': 'EducationalOccupationalCredential',
				name: 'Licensed to practice law in Texas (admitted 2021)',
			},
			{
				'@type': 'EducationalOccupationalCredential',
				name: 'Licensed to practice law in California (admitted 2023)',
			},
		],
	};
}

export function resolveSeo(input: {
	routeId: string | null;
	url: URL;
	pageSeo?: PageSeo | null;
	localPrefix?: boolean;
}): ResolvedSeo | null {
	const { routeId, url } = input;
	const { site, path } = publicPathFor(url);
	const base: PageSeo | undefined =
		input.pageSeo ?? (routeId ? staticRouteSeo[routeId] : undefined);
	const noindex = isNoindexRoute(routeId);

	if (!base) {
		if (!noindex) return null;
		return {
			title: siteName,
			description: '',
			canonical: canonicalUrl(url),
			origin: site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin,
			image: DEFAULT_OG_IMAGE,
			type: 'website',
			robots: 'noindex, nofollow',
			site,
			siteLabel: siteName,
			jsonLd: [],
		};
	}

	const isHome = path === '/';
	return {
		title: (input.localPrefix ? 'LOCAL - ' : '') + base.title,
		description: base.description,
		canonical: canonicalUrl(url),
		origin: site === 'mcdaniel' ? mcdanielOrigin : mlpOrigin,
		image: base.image ?? DEFAULT_OG_IMAGE,
		type: base.type ?? 'website',
		robots: noindex ? 'noindex, nofollow' : null,
		site,
		siteLabel: site === 'mcdaniel' ? MCDANIEL_TITLE : siteName,
		publishedTime: base.publishedTime,
		modifiedTime: base.modifiedTime,
		jsonLd: [...(isHome ? organizationJsonLd(site) : []), ...(base.jsonLd ?? [])],
	};
}

/** Serialise JSON-LD safely for inline `<script>`: no `</script>` or HTML comment breakouts. */
export function jsonLdScript(obj: Record<string, unknown>): string {
	const json = JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
	return `<script type="application/ld+json">${json}</script>`;
}

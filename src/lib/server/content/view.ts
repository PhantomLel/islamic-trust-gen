/** Builds what the public answer template and its SEO tags need from a stored page. */
import {
	attorneyBylineRest,
	attorneyName,
	attorneyProfileUrl,
	consultationBookingUrl,
	mlpOrigin,
	siteName,
} from '$lib/config';
import { renderBodyHtml } from '$lib/content/body';
import { jurisdictionCaveat } from '$lib/content/caveat';
import { renderProductTokens } from '$lib/config';
import { DEFAULT_OG_IMAGE, type PageSeo } from '$lib/seo';
import type { PageBundle } from './pages';

export type CtaView = { label: string; href: string; external?: boolean; note?: string } | null;

export type AnswerView = {
	id: number;
	title: string;
	slug: string;
	answerSummary: string;
	bodyHtml: string;
	lastReviewedOn: string | null;
	jurisdiction: string | null;
	caveat: string | null;
	faqs: { question: string; answer: string }[];
	related: { title: string; slug: string }[];
	cta: CtaView;
	byline: { name: string; href: string; rest: string };
	categoryName: string | null;
};

export function buildCta(bundle: PageBundle, publishedRelated: { title: string; slug: string }[]): CtaView {
	const { page, videos } = bundle;
	switch (page.ctaKey) {
		case 'consultation':
			return { label: 'Book a consultation', href: consultationBookingUrl, external: true };
		case 'free_will':
			// Only meaningful on Texas or California pages; the publish rules enforce that too.
			return page.jurisdiction === 'TX' || page.jurisdiction === 'CA'
				? { label: 'Use the free Islamic will', href: '/free-islamic-will' }
				: null;
		case 'related_video': {
			const v = videos.find((x) => x.status === 'published');
			return v ? { label: 'Watch the related video', href: `/videos/${v.slug}`, note: v.title } : null;
		}
		case 'next_question': {
			const next = publishedRelated[0];
			return next ? { label: 'Read the next question', href: `/answers/${next.slug}`, note: next.title } : null;
		}
		case 'webinar':
			return { label: 'Register for the webinar', href: '/webinar' };
		default:
			return null;
	}
}

export function buildAnswerView(bundle: PageBundle): AnswerView {
	const { page } = bundle;
	const publishedRelated = bundle.related.filter((r) => r.status === 'published').map((r) => ({ title: r.title, slug: r.slug }));
	return {
		id: page.id,
		title: page.title,
		slug: page.slug,
		answerSummary: renderProductTokens(page.answerSummary),
		bodyHtml: renderBodyHtml(page.body),
		lastReviewedOn: page.lastReviewedOn,
		jurisdiction: page.jurisdiction,
		caveat: jurisdictionCaveat(page.jurisdiction, page.caveatOverride),
		faqs: bundle.faqs.map((f) => ({ question: renderProductTokens(f.question), answer: renderProductTokens(f.answer) })),
		related: publishedRelated.slice(0, 4),
		cta: buildCta(bundle, publishedRelated),
		byline: { name: attorneyName, href: attorneyProfileUrl, rest: attorneyBylineRest },
		categoryName: bundle.category?.name ?? null,
	};
}

export function buildAnswerSeo(bundle: PageBundle): PageSeo {
	const { page } = bundle;
	const canonical = `${mlpOrigin}/answers/${page.slug}`;
	const author = { '@type': 'Person', '@id': attorneyProfileUrl, name: attorneyName, url: attorneyProfileUrl };
	const image = bundle.socialImage?.url ?? `${mlpOrigin}${DEFAULT_OG_IMAGE}`;
	const modified = page.lastReviewedOn ? new Date(page.lastReviewedOn).toISOString() : page.updatedAt.toISOString();
	const jsonLd: Record<string, unknown>[] = [
		{
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: page.title,
			description: page.metaDescription,
			author,
			publisher: { '@type': 'Organization', name: siteName, url: mlpOrigin },
			mainEntityOfPage: canonical,
			image,
			datePublished: (page.publishedAt ?? page.createdAt).toISOString(),
			dateModified: modified,
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: siteName, item: `${mlpOrigin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Answers', item: `${mlpOrigin}/answers` },
				{ '@type': 'ListItem', position: 3, name: page.title, item: canonical },
			],
		},
	];
	if (bundle.faqs.length) {
		jsonLd.push({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: bundle.faqs.map((f) => ({
				'@type': 'Question',
				name: renderProductTokens(f.question),
				acceptedAnswer: { '@type': 'Answer', text: renderProductTokens(f.answer) },
			})),
		});
	}
	return {
		title: `${page.title} — ${siteName}`,
		description: page.metaDescription,
		type: 'article',
		image: bundle.socialImage?.url ?? DEFAULT_OG_IMAGE,
		publishedTime: (page.publishedAt ?? page.createdAt).toISOString(),
		modifiedTime: modified,
		jsonLd,
	};
}


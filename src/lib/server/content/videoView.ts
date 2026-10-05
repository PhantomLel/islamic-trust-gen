import { mlpOrigin, renderProductTokens, siteName } from '$lib/config';
import { isoDuration, formatDuration } from '$lib/content/rules';
import { DEFAULT_OG_IMAGE, type PageSeo } from '$lib/seo';
import type { VideoBundle } from './videos';

export type VideoView = {
	id: number;
	title: string;
	slug: string;
	youtubeId: string;
	description: string;
	transcript: string;
	duration: string | null;
	series: string | null;
	seriesSlug: string | null;
	isTestimonial: boolean;
	speaker: { title: string; relationship: string } | null;
	relatedPage: { title: string; slug: string } | null;
};

export function seriesSlugOf(series: string | null | undefined): string | null {
	if (!series) return null;
	const s = series
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return s || null;
}

export function buildVideoView(b: VideoBundle): VideoView {
	const v = b.video;
	return {
		id: v.id,
		title: v.title,
		slug: v.slug,
		youtubeId: v.youtubeId,
		description: renderProductTokens(v.description),
		transcript: renderProductTokens(v.transcript),
		duration: v.durationSeconds ? formatDuration(v.durationSeconds) : null,
		series: v.series,
		seriesSlug: seriesSlugOf(v.series),
		isTestimonial: v.isTestimonial,
		speaker:
			v.isTestimonial && v.isEndorsement && v.speakerTitle && v.speakerRelationship
				? { title: v.speakerTitle, relationship: v.speakerRelationship }
				: null,
		relatedPage: b.relatedPage && b.relatedPage.status === 'published' ? { title: b.relatedPage.title, slug: b.relatedPage.slug } : null,
	};
}

export function buildVideoSeo(b: VideoBundle): PageSeo {
	const v = b.video;
	const canonical = `${mlpOrigin}/videos/${v.slug}`;
	return {
		title: `${v.title} — ${siteName}`,
		description: v.metaDescription,
		type: 'video.other',
		image: b.thumbnail ? `/videos/${v.slug}/thumbnail` : DEFAULT_OG_IMAGE,
		jsonLd: [
			{
				'@context': 'https://schema.org',
				'@type': 'VideoObject',
				name: v.title,
				description: renderProductTokens(v.description),
				// The thumbnail is served from this site (see /videos/[slug]/thumbnail).
				thumbnailUrl: [`${mlpOrigin}/videos/${v.slug}/thumbnail`],
				uploadDate: v.uploadedOn ? new Date(v.uploadedOn).toISOString() : (v.publishedAt ?? v.createdAt).toISOString(),
				...(v.durationSeconds ? { duration: isoDuration(v.durationSeconds) } : {}),
				embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
				url: canonical,
			},
			{
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: siteName, item: `${mlpOrigin}/` },
					{ '@type': 'ListItem', position: 2, name: 'Videos', item: `${mlpOrigin}/videos` },
					{ '@type': 'ListItem', position: 3, name: v.title, item: canonical },
				],
			},
		],
	};
}

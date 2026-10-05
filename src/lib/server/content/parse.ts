/** Form → typed fields for the publisher UI. Everything is re-validated; the form is not trusted. */
import { parseDoc } from '$lib/content/body';
import { CTA_KEYS, JURISDICTIONS, type ContentJurisdiction, type CtaKey } from '$lib/content/types';
import { parseDuration, parseYoutubeId } from '$lib/content/rules';
import type { PageFields } from './pages';
import type { VideoFields } from './videos';

function str(form: FormData, key: string): string {
	const v = form.get(key);
	return typeof v === 'string' ? v : '';
}
function intOrNull(v: string): number | null {
	const n = Number(v);
	return v.trim() !== '' && Number.isInteger(n) && n > 0 ? n : null;
}

export function parsePageForm(form: FormData): PageFields {
	const j = str(form, 'jurisdiction');
	const c = str(form, 'ctaKey');
	const faqQ = form.getAll('faqQuestion').map(String);
	const faqA = form.getAll('faqAnswer').map(String);
	const related = form.getAll('relatedId').map((v) => intOrNull(String(v))).filter((n): n is number => n !== null);
	return {
		title: str(form, 'title'),
		slug: str(form, 'slug'),
		answerSummary: str(form, 'answerSummary'),
		body: parseDoc(str(form, 'body')),
		metaDescription: str(form, 'metaDescription'),
		jurisdiction: (JURISDICTIONS as readonly string[]).includes(j) ? (j as ContentJurisdiction) : null,
		categoryId: intOrNull(str(form, 'categoryId')),
		lastReviewedOn: /^\d{4}-\d{2}-\d{2}$/.test(str(form, 'lastReviewedOn')) ? str(form, 'lastReviewedOn') : null,
		ctaKey: (CTA_KEYS as readonly string[]).includes(c) ? (c as CtaKey) : null,
		caveatOverride: str(form, 'caveatOverride') || null,
		socialImageId: intOrNull(str(form, 'socialImageId')),
		faq: faqQ.map((q, i) => ({ question: q, answer: faqA[i] ?? '' })),
		relatedIds: related,
	};
}

export function parseVideoForm(form: FormData): VideoFields {
	const j = str(form, 'jurisdiction');
	return {
		title: str(form, 'title'),
		slug: str(form, 'slug'),
		youtubeId: parseYoutubeId(str(form, 'youtube')) ?? str(form, 'youtube').trim(),
		description: str(form, 'description'),
		transcript: str(form, 'transcript'),
		durationSeconds: parseDuration(str(form, 'duration')),
		jurisdiction: (JURISDICTIONS as readonly string[]).includes(j) ? (j as ContentJurisdiction) : null,
		series: str(form, 'series') || null,
		seriesOrder: intOrNull(str(form, 'seriesOrder')),
		relatedContentPageId: intOrNull(str(form, 'relatedContentPageId')),
		isTestimonial: form.get('isTestimonial') === 'on',
		releaseOnFile: form.get('releaseOnFile') === 'on',
		isEndorsement: form.get('isEndorsement') === 'on',
		speakerTitle: str(form, 'speakerTitle') || null,
		speakerRelationship: str(form, 'speakerRelationship') || null,
		metaDescription: str(form, 'metaDescription'),
		thumbnailAssetId: intOrNull(str(form, 'thumbnailAssetId')),
		uploadedOn: /^\d{4}-\d{2}-\d{2}$/.test(str(form, 'uploadedOn')) ? str(form, 'uploadedOn') : null,
	};
}

/** `datetime-local` has no zone; the browser sends the instant as ISO in `scheduleAtIso`. */
export function parseScheduleAt(form: FormData): Date {
	return new Date(str(form, 'scheduleAtIso'));
}

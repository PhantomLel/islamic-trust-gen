/**
 * Publication rules for answers and videos. Pure functions: the publisher UI shows
 * the messages, and the server actions call the same functions so a crafted request
 * cannot publish what the form would have blocked.
 *
 * `errors` block publication. `warnings` do not.
 */
import { bodyHasContent, bodyLiteralText, literalProductNameWarnings } from './body';
import {
	ANSWER_SUMMARY_MAX_WORDS,
	ANSWER_SUMMARY_MIN_WORDS,
	CTA_KEYS,
	JURISDICTIONS,
	MAX_RELATED,
	META_DESCRIPTION_MAX,
	META_DESCRIPTION_MIN,
	REVIEW_INTERVAL_MONTHS,
	type CtaKey,
	type ContentJurisdiction,
} from './types';

export type RuleResult = { errors: string[]; warnings: string[] };

export function countWords(text: string | null | undefined): number {
	const t = (text ?? '').trim();
	if (!t) return 0;
	return t.split(/\s+/).length;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isValidSlug(slug: string | null | undefined): boolean {
	return !!slug && slug.length <= 120 && SLUG_RE.test(slug);
}

/** Lower-case, hyphenated slug from a title. */
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[’']/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100)
		.replace(/-+$/g, '');
}

/** "Use the free Islamic will" is only available on Texas or California pages. */
export function allowedCtaKeys(jurisdiction: ContentJurisdiction | null | undefined): CtaKey[] {
	const stateScoped = jurisdiction === 'TX' || jurisdiction === 'CA';
	return CTA_KEYS.filter((k) => k !== 'free_will' || stateScoped);
}

export type PageDraft = {
	title: string;
	slug: string;
	answerSummary: string;
	body: unknown;
	metaDescription: string;
	jurisdiction: string | null;
	categoryId: number | null;
	lastReviewedOn: string | null;
	ctaKey: string | null;
	/** Alt text of the social image, when one is attached. `undefined` means no image. */
	socialImageAlt?: string | null;
	hasSocialImage?: boolean;
	faq?: { question: string; answer: string }[];
	relatedCount?: number;
	/** Whether the related-video CTA has a video to point to. */
	hasRelatedVideo?: boolean;
	/** Number of categories that exist. Zero blocks publication with a plain message. */
	categoryCount?: number;
	caveatOverride?: string | null;
};

/** Publication checks for an answer page (spec §7). */
export function validatePageForPublish(p: PageDraft): RuleResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!p.title.trim()) errors.push('Add a question as the title.');
	else if (!p.title.trim().endsWith('?')) warnings.push('Title should end with a question mark.');

	if (!isValidSlug(p.slug)) errors.push('The page address (slug) can use lower-case letters, numbers and hyphens only.');

	const words = countWords(p.answerSummary);
	if (words < ANSWER_SUMMARY_MIN_WORDS || words > ANSWER_SUMMARY_MAX_WORDS) {
		errors.push(`Answer summary must be ${ANSWER_SUMMARY_MIN_WORDS} to ${ANSWER_SUMMARY_MAX_WORDS} words (it is ${words} now).`);
	}

	const metaLen = (p.metaDescription ?? '').length;
	if (metaLen < META_DESCRIPTION_MIN || metaLen > META_DESCRIPTION_MAX) {
		errors.push(`Meta description must be ${META_DESCRIPTION_MIN} to ${META_DESCRIPTION_MAX} characters (it is ${metaLen} now).`);
	}

	if (!bodyHasContent(p.body)) errors.push('Add the page body.');

	if (!p.jurisdiction || !(JURISDICTIONS as readonly string[]).includes(p.jurisdiction)) {
		errors.push('Choose a jurisdiction.');
	}
	if ((p.categoryCount ?? 1) === 0) {
		errors.push('Add at least one category before publishing. The publisher can add categories under Categories.');
	} else if (!p.categoryId) {
		errors.push('Choose a category.');
	}
	if (!p.lastReviewedOn || Number.isNaN(Date.parse(p.lastReviewedOn))) {
		errors.push('Enter the last reviewed date.');
	}
	if (!p.ctaKey || !(CTA_KEYS as readonly string[]).includes(p.ctaKey)) {
		errors.push('Choose a call to action (or “None”).');
	} else {
		const allowed = allowedCtaKeys(p.jurisdiction as ContentJurisdiction | null);
		if (!allowed.includes(p.ctaKey as CtaKey)) {
			errors.push('“Use the free Islamic will” can only be chosen on Texas or California pages.');
		}
		if (p.ctaKey === 'next_question' && (p.relatedCount ?? 0) === 0) {
			errors.push('Add at least one related question, or pick a different call to action.');
		}
		if (p.ctaKey === 'related_video' && p.hasRelatedVideo === false) {
			errors.push('Link a published video to this page, or pick a different call to action.');
		}
	}

	if (p.hasSocialImage && !(p.socialImageAlt ?? '').trim()) {
		errors.push('The social image needs alt text before this page can be published.');
	}

	for (const [i, f] of (p.faq ?? []).entries()) {
		if (!f.question.trim() || !f.answer.trim()) errors.push(`FAQ item ${i + 1} needs both a question and an answer.`);
	}
	if ((p.relatedCount ?? 0) > MAX_RELATED) errors.push(`Choose at most ${MAX_RELATED} related questions.`);

	warnings.push(
		...literalProductNameWarnings(
			bodyLiteralText(p.body),
			p.answerSummary,
			p.title,
			p.metaDescription,
			p.caveatOverride,
			...(p.faq ?? []).flatMap((f) => [f.question, f.answer]),
		),
	);
	return { errors, warnings };
}

export type VideoDraft = {
	title: string;
	slug: string;
	youtubeId: string;
	description: string;
	transcript: string;
	durationSeconds: number | null;
	jurisdiction: string | null;
	metaDescription: string;
	hasThumbnail: boolean;
	thumbnailAlt?: string | null;
	isTestimonial: boolean;
	releaseOnFile: boolean;
	isEndorsement: boolean;
	speakerTitle: string | null;
	speakerRelationship: string | null;
	uploadedOn: string | null;
};

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
export function isValidYoutubeId(id: string | null | undefined): boolean {
	return !!id && YT_ID.test(id);
}

/** Pull the 11-character id out of a pasted YouTube URL or bare id. */
export function parseYoutubeId(input: string | null | undefined): string | null {
	const raw = (input ?? '').trim();
	if (YT_ID.test(raw)) return raw;
	try {
		const u = new URL(raw);
		const host = u.hostname.replace(/^www\./, '');
		let id: string | null = null;
		if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
		else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
			id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
		}
		return id && YT_ID.test(id) ? id : null;
	} catch {
		return null;
	}
}

export function validateVideoForPublish(v: VideoDraft): RuleResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!v.title.trim()) errors.push('Add a title.');
	if (!isValidSlug(v.slug)) errors.push('The page address (slug) can use lower-case letters, numbers and hyphens only.');
	if (!isValidYoutubeId(v.youtubeId)) errors.push('Enter a valid YouTube link or 11-character video id.');
	if (!v.description.trim()) errors.push('Add a description.');
	if (!v.transcript.trim()) errors.push('The transcript is required. Clean up the YouTube transcript and paste it in.');
	if (!v.durationSeconds || v.durationSeconds <= 0) errors.push('Enter the video length.');
	if (!v.jurisdiction || !(JURISDICTIONS as readonly string[]).includes(v.jurisdiction)) errors.push('Choose a jurisdiction.');
	if (!v.uploadedOn || Number.isNaN(Date.parse(v.uploadedOn))) errors.push('Enter the date the video was published.');

	const metaLen = (v.metaDescription ?? '').length;
	if (metaLen < META_DESCRIPTION_MIN || metaLen > META_DESCRIPTION_MAX) {
		errors.push(`Meta description must be ${META_DESCRIPTION_MIN} to ${META_DESCRIPTION_MAX} characters (it is ${metaLen} now).`);
	}

	if (!v.hasThumbnail) errors.push('Add a thumbnail image. Videos use a local thumbnail, never one fetched from YouTube.');
	else if (!(v.thumbnailAlt ?? '').trim()) errors.push('The thumbnail needs alt text before this video can be published.');

	if (v.isTestimonial && !v.releaseOnFile) {
		errors.push('A testimonial video cannot be published until the client release is on file. Tick “Release on file” once you have it.');
	}
	if (v.isTestimonial && v.isEndorsement) {
		if (!(v.speakerTitle ?? '').trim()) errors.push('An endorsement needs the speaker’s title.');
		if (!(v.speakerRelationship ?? '').trim()) errors.push('An endorsement needs the speaker’s relationship to the firm.');
	}

	warnings.push(...literalProductNameWarnings(v.title, v.description, v.transcript, v.metaDescription));
	return { errors, warnings };
}

/** ISO 8601 duration, e.g. 754 → "PT12M34S". */
export function isoDuration(totalSeconds: number): string {
	const s = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${sec || (!h && !m) ? `${sec}S` : ''}`;
}

/** "754" or "12:34" or "1:02:03" → seconds. */
export function parseDuration(input: string | null | undefined): number | null {
	const raw = (input ?? '').trim();
	if (!raw) return null;
	if (/^\d+$/.test(raw)) return Number(raw);
	const parts = raw.split(':').map((p) => Number(p));
	if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isInteger(p) || p < 0)) return null;
	return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function formatDuration(totalSeconds: number): string {
	const s = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = String(s % 60).padStart(2, '0');
	return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Pages whose last-reviewed date is older than the review interval (default six months). */
export function isReviewDue(lastReviewedOn: string | Date | null | undefined, now: Date = new Date()): boolean {
	if (!lastReviewedOn) return true;
	const d = new Date(lastReviewedOn);
	if (Number.isNaN(d.getTime())) return true;
	const cutoff = new Date(now);
	cutoff.setUTCMonth(cutoff.getUTCMonth() - REVIEW_INTERVAL_MONTHS);
	return d.getTime() < cutoff.getTime();
}

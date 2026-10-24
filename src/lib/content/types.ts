/** Shared, client-safe types and constants for the content platform (spec v3 §7–9). */

export const CONTENT_STATUSES = ['draft', 'in_review', 'published', 'unpublished'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const JURISDICTIONS = ['TX', 'CA', 'BOTH', 'GENERAL'] as const;
export type ContentJurisdiction = (typeof JURISDICTIONS)[number];

export const JURISDICTION_LABELS: Record<ContentJurisdiction, string> = {
	TX: 'Texas',
	CA: 'California',
	BOTH: 'Texas and California',
	GENERAL: 'General (no state)',
};

/** One call to action per page. "Register for the webinar" is selectable only while a webinar is open. */
export const CTA_KEYS = ['consultation', 'free_will', 'related_video', 'next_question', 'webinar', 'none'] as const;
export type CtaKey = (typeof CTA_KEYS)[number];

export const CTA_LABELS: Record<CtaKey, string> = {
	consultation: 'Book a consultation',
	free_will: 'Use the free Islamic will (Texas or California pages only)',
	related_video: 'Watch the related video',
	next_question: 'Read the next question',
	webinar: 'Register for the webinar',
	none: 'None',
};

export const CONTENT_ROLES = ['content_author', 'content_publisher'] as const;
export type ContentRole = (typeof CONTENT_ROLES)[number];

export const ANSWER_SUMMARY_MIN_WORDS = 40;
export const ANSWER_SUMMARY_MAX_WORDS = 60;
export const META_DESCRIPTION_MIN = 150;
export const META_DESCRIPTION_MAX = 160;
export const MAX_RELATED = 4;
/** A page is due for review when its last-reviewed date is older than this many months. */
export const REVIEW_INTERVAL_MONTHS = 6;

/** TipTap/ProseMirror JSON document as stored. */
export type DocJson = {
	type: 'doc';
	content?: DocNode[];
};

export type DocMark = { type: 'bold' | 'italic' | 'link'; attrs?: { href?: string } };

export type DocNode = {
	type: string;
	attrs?: Record<string, unknown>;
	content?: DocNode[];
	text?: string;
	marks?: DocMark[];
};

export const EMPTY_DOC: DocJson = { type: 'doc', content: [{ type: 'paragraph' }] };

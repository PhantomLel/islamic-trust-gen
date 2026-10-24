import { describe, expect, it } from 'vitest';
import { DEFAULT_JURISDICTION_CAVEAT, jurisdictionCaveat } from './caveat';
import {
	allowedCtaKeys,
	countWords,
	formatDuration,
	isReviewDue,
	isoDuration,
	parseDuration,
	parseYoutubeId,
	slugify,
	validatePageForPublish,
	validateVideoForPublish,
	type PageDraft,
	type VideoDraft,
} from './rules';

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text.' }] }] };

const goodPage = (over: Partial<PageDraft> = {}): PageDraft => ({
	title: 'What is probate?',
	slug: 'what-is-probate',
	answerSummary: words(50),
	body,
	metaDescription: 'x'.repeat(155),
	jurisdiction: 'TX',
	categoryId: 1,
	lastReviewedOn: '2026-09-30',
	ctaKey: 'consultation',
	...over,
});

describe('validatePageForPublish', () => {
	it('accepts a complete page', () => {
		expect(validatePageForPublish(goodPage()).errors).toEqual([]);
	});

	it('rejects an answer summary outside 40–60 words', () => {
		for (const n of [0, 39, 61]) {
			const r = validatePageForPublish(goodPage({ answerSummary: words(n) }));
			expect(r.errors.some((e) => e.startsWith('Answer summary must be 40 to 60 words'))).toBe(true);
		}
		for (const n of [40, 60]) {
			expect(validatePageForPublish(goodPage({ answerSummary: words(n) })).errors).toEqual([]);
		}
	});

	it('rejects a meta description outside 150–160 characters', () => {
		for (const n of [0, 149, 161]) {
			const r = validatePageForPublish(goodPage({ metaDescription: 'x'.repeat(n) }));
			expect(r.errors.some((e) => e.startsWith('Meta description must be 150 to 160 characters'))).toBe(true);
		}
		expect(validatePageForPublish(goodPage({ metaDescription: 'x'.repeat(150) })).errors).toEqual([]);
		expect(validatePageForPublish(goodPage({ metaDescription: 'x'.repeat(160) })).errors).toEqual([]);
	});

	it('treats a title without a question mark as a warning, not a block', () => {
		const r = validatePageForPublish(goodPage({ title: 'Probate explained' }));
		expect(r.errors).toEqual([]);
		expect(r.warnings).toContain('Title should end with a question mark.');
	});

	it('hard-blocks missing last-reviewed date, jurisdiction, category and CTA', () => {
		expect(validatePageForPublish(goodPage({ lastReviewedOn: null })).errors.join()).toMatch(/last reviewed/i);
		expect(validatePageForPublish(goodPage({ jurisdiction: null })).errors.join()).toMatch(/jurisdiction/i);
		expect(validatePageForPublish(goodPage({ categoryId: null })).errors.join()).toMatch(/category/i);
		expect(validatePageForPublish(goodPage({ ctaKey: null })).errors.join()).toMatch(/call to action/i);
	});

	it('blocks publication with a plain message while no category exists', () => {
		const r = validatePageForPublish(goodPage({ categoryId: null, categoryCount: 0 }));
		expect(r.errors.join()).toMatch(/Add at least one category/);
	});

	it('rejects an image without alt text', () => {
		const r = validatePageForPublish(goodPage({ hasSocialImage: true, socialImageAlt: ' ' }));
		expect(r.errors.join()).toMatch(/alt text/);
		expect(validatePageForPublish(goodPage({ hasSocialImage: true, socialImageAlt: 'A family' })).errors).toEqual([]);
	});

	it('allows the free-will CTA only on TX or CA pages', () => {
		expect(allowedCtaKeys('TX')).toContain('free_will');
		expect(allowedCtaKeys('CA')).toContain('free_will');
		expect(allowedCtaKeys('BOTH')).not.toContain('free_will');
		expect(allowedCtaKeys('GENERAL')).not.toContain('free_will');
		expect(allowedCtaKeys('TX')).not.toContain('webinar');
		expect(allowedCtaKeys('GENERAL', { webinarOpen: true })).toContain('webinar');
		expect(validatePageForPublish(goodPage({ ctaKey: 'webinar' })).errors.join()).toMatch(/while a webinar is open/);
		expect(validatePageForPublish(goodPage({ ctaKey: 'webinar', webinarOpen: true })).errors).toEqual([]);
		const r = validatePageForPublish(goodPage({ jurisdiction: 'GENERAL', ctaKey: 'free_will' }));
		expect(r.errors.join()).toMatch(/Texas or California/);
	});

	it('does not silently rewrite literal product names; it warns', () => {
		const r = validatePageForPublish(goodPage({ answerSummary: `${words(49)} GoodTree` }));
		expect(r.warnings.join()).toMatch(/GoodTree/);
	});
});

describe('jurisdictionCaveat', () => {
	it('uses the exact default for TX, CA and BOTH, an override when present, nothing for GENERAL', () => {
		expect(DEFAULT_JURISDICTION_CAVEAT).toBe(
			'This example concerns Texas community-property law. California also has community property, but its rules are not identical, and other states may treat ownership and spousal rights differently.',
		);
		expect(jurisdictionCaveat('TX', '')).toBe(DEFAULT_JURISDICTION_CAVEAT);
		expect(jurisdictionCaveat('CA', null)).toBe(DEFAULT_JURISDICTION_CAVEAT);
		expect(jurisdictionCaveat('BOTH', undefined)).toBe(DEFAULT_JURISDICTION_CAVEAT);
		expect(jurisdictionCaveat('CA', 'Custom text.')).toBe('Custom text.');
		expect(jurisdictionCaveat('GENERAL', 'Custom text.')).toBeNull();
	});
});

const goodVideo = (over: Partial<VideoDraft> = {}): VideoDraft => ({
	title: 'What is probate?',
	slug: 'what-is-probate',
	youtubeId: 'dQw4w9WgXcQ',
	description: 'A short explainer.',
	transcript: 'Transcript text.',
	durationSeconds: 300,
	jurisdiction: 'TX',
	metaDescription: 'x'.repeat(155),
	hasThumbnail: true,
	thumbnailAlt: 'Leonard speaking',
	isTestimonial: false,
	releaseOnFile: false,
	isEndorsement: false,
	speakerTitle: null,
	speakerRelationship: null,
	uploadedOn: '2026-09-01',
	...over,
});

describe('validateVideoForPublish', () => {
	it('accepts a complete video', () => {
		expect(validateVideoForPublish(goodVideo()).errors).toEqual([]);
	});
	it('requires the transcript', () => {
		expect(validateVideoForPublish(goodVideo({ transcript: ' ' })).errors.join()).toMatch(/transcript is required/i);
	});
	it('blocks a testimonial without a release on file', () => {
		const r = validateVideoForPublish(goodVideo({ isTestimonial: true, releaseOnFile: false }));
		expect(r.errors.join()).toMatch(/release/i);
		expect(validateVideoForPublish(goodVideo({ isTestimonial: true, releaseOnFile: true })).errors).toEqual([]);
	});
	it('requires speaker title and relationship for an endorsement', () => {
		const r = validateVideoForPublish(goodVideo({ isTestimonial: true, releaseOnFile: true, isEndorsement: true }));
		expect(r.errors.length).toBe(2);
		expect(
			validateVideoForPublish(
				goodVideo({ isTestimonial: true, releaseOnFile: true, isEndorsement: true, speakerTitle: 'Imam', speakerRelationship: 'Community leader' }),
			).errors,
		).toEqual([]);
	});
	it('requires a local thumbnail with alt text', () => {
		expect(validateVideoForPublish(goodVideo({ hasThumbnail: false })).errors.join()).toMatch(/thumbnail/i);
		expect(validateVideoForPublish(goodVideo({ thumbnailAlt: '' })).errors.join()).toMatch(/alt text/i);
	});
});

describe('helpers', () => {
	it('counts words', () => {
		expect(countWords('')).toBe(0);
		expect(countWords('  a  b\nc ')).toBe(3);
	});
	it('slugifies', () => {
		expect(slugify("What's a revocable trust?")).toBe('whats-a-revocable-trust');
	});
	it('parses YouTube links and ids', () => {
		expect(parseYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toBe('dQw4w9WgXcQ');
		expect(parseYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		expect(parseYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		expect(parseYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
	});
	it('converts durations', () => {
		expect(parseDuration('12:34')).toBe(754);
		expect(parseDuration('1:02:03')).toBe(3723);
		expect(parseDuration('90')).toBe(90);
		expect(parseDuration('x')).toBeNull();
		expect(isoDuration(754)).toBe('PT12M34S');
		expect(isoDuration(3600)).toBe('PT1H');
		expect(formatDuration(754)).toBe('12:34');
	});
	it('flags pages last reviewed more than six months ago', () => {
		const now = new Date('2026-10-02T00:00:00Z');
		expect(isReviewDue('2026-04-03', now)).toBe(false);
		expect(isReviewDue('2026-09-30', now)).toBe(false);
		expect(isReviewDue('2026-04-01', now)).toBe(true);
		expect(isReviewDue('2026-03-01', now)).toBe(true);
		expect(isReviewDue(null, now)).toBe(true);
	});
});

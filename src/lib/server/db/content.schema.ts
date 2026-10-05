import {
	pgTable,
	serial,
	bigserial,
	integer,
	text,
	timestamp,
	date,
	boolean,
	jsonb,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { ContentJurisdiction, ContentStatus, CtaKey, DocJson } from '../../content/types';

// ── Content platform (spec v3 §7–9) ──────────────────────────────────────────
// Answer pages, the video library, and the audit trail that goes with them.
// Actor ids are plain text (no foreign key) so history survives a user deletion.

export const contentCategory = pgTable('content_category', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	sortOrder: integer('sort_order').notNull().default(0),
});

/** An uploaded image. Alt text is required: publishing a page that uses an image without it fails. */
export const mediaAsset = pgTable('media_asset', {
	id: serial('id').primaryKey(),
	uploadthingKey: text('uploadthing_key').notNull(),
	url: text('url').notNull(),
	altText: text('alt_text').notNull(),
	width: integer('width'),
	height: integer('height'),
	createdBy: text('created_by'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contentPage = pgTable(
	'content_page',
	{
		id: serial('id').primaryKey(),
		status: text('status').$type<ContentStatus>().notNull().default('draft'),
		/** The question. */
		title: text('title').notNull().default(''),
		slug: text('slug').notNull(),
		answerSummary: text('answer_summary').notNull().default(''),
		/** ProseMirror JSON. Product name is a token node with no stored string. */
		body: jsonb('body').$type<DocJson>().notNull().default({ type: 'doc', content: [{ type: 'paragraph' }] }),
		metaDescription: text('meta_description').notNull().default(''),
		jurisdiction: text('jurisdiction').$type<ContentJurisdiction>(),
		categoryId: integer('category_id').references(() => contentCategory.id, { onDelete: 'set null' }),
		lastReviewedOn: date('last_reviewed_on', { mode: 'string' }),
		ctaKey: text('cta_key').$type<CtaKey>(),
		/** Optional replacement for the default jurisdiction caveat. */
		caveatOverride: text('caveat_override'),
		socialImageId: integer('social_image_id').references(() => mediaAsset.id, { onDelete: 'set null' }),
		publishedAt: timestamp('published_at'),
		scheduledPublishAt: timestamp('scheduled_publish_at'),
		authorId: text('author_id'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex('content_page_slug_idx').on(t.slug),
		index('content_page_status_idx').on(t.status),
		index('content_page_category_idx').on(t.categoryId),
	],
);

export const contentPageRevision = pgTable(
	'content_page_revision',
	{
		id: serial('id').primaryKey(),
		pageId: integer('page_id')
			.notNull()
			.references(() => contentPage.id, { onDelete: 'cascade' }),
		title: text('title').notNull().default(''),
		answerSummary: text('answer_summary').notNull().default(''),
		body: jsonb('body').$type<DocJson>().notNull(),
		actorId: text('actor_id'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(t) => [index('content_page_revision_page_idx').on(t.pageId)],
);

export const contentFaq = pgTable(
	'content_faq',
	{
		id: serial('id').primaryKey(),
		pageId: integer('page_id')
			.notNull()
			.references(() => contentPage.id, { onDelete: 'cascade' }),
		question: text('question').notNull(),
		answer: text('answer').notNull(),
		sort: integer('sort').notNull().default(0),
	},
	(t) => [index('content_faq_page_idx').on(t.pageId)],
);

export const contentRelated = pgTable(
	'content_related',
	{
		id: serial('id').primaryKey(),
		pageId: integer('page_id')
			.notNull()
			.references(() => contentPage.id, { onDelete: 'cascade' }),
		relatedPageId: integer('related_page_id')
			.notNull()
			.references(() => contentPage.id, { onDelete: 'cascade' }),
		sort: integer('sort').notNull().default(0),
	},
	(t) => [index('content_related_page_idx').on(t.pageId), uniqueIndex('content_related_pair_idx').on(t.pageId, t.relatedPageId)],
);

export const contentRedirect = pgTable('content_redirect', {
	id: serial('id').primaryKey(),
	fromPath: text('from_path').notNull().unique(),
	toPath: text('to_path').notNull(),
	statusCode: integer('status_code').notNull().default(301),
	createdBy: text('created_by'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const videoPage = pgTable(
	'video_page',
	{
		id: serial('id').primaryKey(),
		status: text('status').$type<ContentStatus>().notNull().default('draft'),
		title: text('title').notNull().default(''),
		slug: text('slug').notNull(),
		youtubeId: text('youtube_id').notNull().default(''),
		description: text('description').notNull().default(''),
		/** Plain text. May contain the {{productName}} token. */
		transcript: text('transcript').notNull().default(''),
		durationSeconds: integer('duration_seconds'),
		jurisdiction: text('jurisdiction').$type<ContentJurisdiction>(),
		series: text('series'),
		seriesOrder: integer('series_order'),
		relatedContentPageId: integer('related_content_page_id').references(() => contentPage.id, { onDelete: 'set null' }),
		isTestimonial: boolean('is_testimonial').notNull().default(false),
		releaseOnFile: boolean('release_on_file').notNull().default(false),
		isEndorsement: boolean('is_endorsement').notNull().default(false),
		speakerTitle: text('speaker_title'),
		speakerRelationship: text('speaker_relationship'),
		metaDescription: text('meta_description').notNull().default(''),
		thumbnailAssetId: integer('thumbnail_asset_id').references(() => mediaAsset.id, { onDelete: 'set null' }),
		uploadedOn: date('uploaded_on', { mode: 'string' }),
		publishedAt: timestamp('published_at'),
		scheduledPublishAt: timestamp('scheduled_publish_at'),
		authorId: text('author_id'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex('video_page_slug_idx').on(t.slug),
		index('video_page_status_idx').on(t.status),
		index('video_page_series_idx').on(t.series),
	],
);

/**
 * Append-only. The application exposes no update or delete for this table, and a
 * database trigger (see the content migration) rejects both.
 */
export const contentAudit = pgTable(
	'content_audit',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		actorId: text('actor_id').notNull(),
		action: text('action').notNull(),
		targetType: text('target_type').notNull(),
		targetId: text('target_id').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(t) => [index('content_audit_target_idx').on(t.targetType, t.targetId), index('content_audit_action_idx').on(t.action)],
);

/** Small key/value store, e.g. the featured homepage video id. */
export const contentSetting = pgTable('content_setting', {
	key: text('key').primaryKey(),
	value: text('value'),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const contentPageRelations = relations(contentPage, ({ one, many }) => ({
	category: one(contentCategory, { fields: [contentPage.categoryId], references: [contentCategory.id] }),
	socialImage: one(mediaAsset, { fields: [contentPage.socialImageId], references: [mediaAsset.id] }),
	faqs: many(contentFaq),
}));

export const contentFaqRelations = relations(contentFaq, ({ one }) => ({
	page: one(contentPage, { fields: [contentFaq.pageId], references: [contentPage.id] }),
}));

export const videoPageRelations = relations(videoPage, ({ one }) => ({
	thumbnail: one(mediaAsset, { fields: [videoPage.thumbnailAssetId], references: [mediaAsset.id] }),
	relatedPage: one(contentPage, { fields: [videoPage.relatedContentPageId], references: [contentPage.id] }),
}));

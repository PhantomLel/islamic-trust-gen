import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	boolean,
	jsonb,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

// ── Help Assistant KB & governance ───────────────────────────────────────────

export type KbEntryType = 'faq' | 'explainer';
export type KbClassificationBase = 'safe' | 'consult_trigger' | 'do_not_answer';
export type KbGovernanceStatus = 'approved' | 'needs_revision' | 'disabled';
export type HelpSurface =
	| 'help_center'
	| 'create_trust'
	| 'funding'
	| 'dashboard';
export type HelpEscalationTier = '1' | '2' | '3';
export type HelpEscalationStatus = 'open' | 'resolved' | 'dismissed';
export type HelpAdminReviewStatus = 'open' | 'resolved' | 'disabled';
export type HelpPublicationGateType =
	| 'scholar_review'
	| 'citation_verification'
	| 'policy_confirmation'
	| 'leonard_review'
	| 'institution_process';

export type HelpRenderedResponse = {
	kind:
		| 'safe_answer'
		| 'consult_trigger'
		| 'do_not_answer'
		| 'tier1'
		| 'tier2'
		| 'tier3'
		| 'fallback'
		| 'sensitive_data';
	entryId?: number;
	templateId?: string;
	shortAnswer?: string;
	learnMore?: { appMeaning?: string; nextStep?: string };
	footer: string;
	cta?: { key: string; label: string; target: string };
	blockedStep?: boolean;
};

export const kbEntry = pgTable(
	'kb_entry',
	{
		id: serial('id').primaryKey(),
		entryType: text('entry_type').$type<KbEntryType>().notNull(),
		category: text('category'),
		title: text('title'),
		question: text('question'),
		userFacingAnswer: text('user_facing_answer'),
		goodTreeAppMeaning: text('good_tree_app_meaning'),
		userNextStep: text('user_next_step'),
		/** Precomputed document text for reranker (question + aliases + answer). */
		rerankDocument: text('rerank_document'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => [index('kb_entry_category_idx').on(t.category), index('kb_entry_type_idx').on(t.entryType)],
);

export const kbEntryInternal = pgTable('kb_entry_internal', {
	entryId: integer('entry_id')
		.primaryKey()
		.references(() => kbEntry.id, { onDelete: 'cascade' }),
	alsoAnswers: text('also_answers').array(),
	classificationBase: text('classification_base').$type<KbClassificationBase>(),
	sourceHash: text('source_hash'),
});

export const kbEntryGovernance = pgTable('kb_entry_governance', {
	entryId: integer('entry_id')
		.primaryKey()
		.references(() => kbEntry.id, { onDelete: 'cascade' }),
	status: text('status').$type<KbGovernanceStatus>().notNull().default('needs_revision'),
	lastReviewedAt: timestamp('last_reviewed_at'),
	lastReviewedBy: text('last_reviewed_by'),
	approvedAt: timestamp('approved_at'),
	approvedBy: text('approved_by'),
	serveCount: integer('serve_count').notNull().default(0),
});

export const kbPublicationGate = pgTable(
	'kb_publication_gate',
	{
		id: serial('id').primaryKey(),
		contentType: text('content_type').notNull(),
		contentId: text('content_id').notNull(),
		gateType: text('gate_type').$type<HelpPublicationGateType>().notNull(),
		required: boolean('required').notNull().default(true),
		satisfied: boolean('satisfied').notNull().default(false),
		reviewerId: text('reviewer_id'),
		reviewedAt: timestamp('reviewed_at'),
		evidenceNote: text('evidence_note'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => [
		uniqueIndex('kb_publication_gate_unique_idx').on(t.contentType, t.contentId, t.gateType),
		index('kb_publication_gate_unsatisfied_idx').on(t.satisfied, t.required),
	],
);

export const kbEntryVersion = pgTable(
	'kb_entry_version',
	{
		id: serial('id').primaryKey(),
		entryId: integer('entry_id')
			.references(() => kbEntry.id, { onDelete: 'cascade' })
			.notNull(),
		snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
		sourceHash: text('source_hash'),
		authorId: text('author_id'),
		changeReason: text('change_reason'),
		reviewerId: text('reviewer_id'),
		approvalState: text('approval_state').$type<KbGovernanceStatus>(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [index('kb_entry_version_entry_idx').on(t.entryId)],
);

export const helpTemplate = pgTable('help_template', {
	id: serial('id').primaryKey(),
	templateId: text('template_id').notNull().unique(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	status: text('status').$type<KbGovernanceStatus>().notNull().default('needs_revision'),
	sourceHash: text('source_hash'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const helpStaffMacro = pgTable('help_staff_macro', {
	id: serial('id').primaryKey(),
	macroId: text('macro_id').notNull().unique(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	category: text('category'),
	sourceHash: text('source_hash'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const helpSetting = pgTable('help_setting', {
	key: text('key').primaryKey(),
	value: jsonb('value').$type<unknown>().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by'),
});

export const helpConversation = pgTable(
	'help_conversation',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		trustId: integer('trust_id'),
		surface: text('surface').$type<HelpSurface>().notNull(),
		stepKey: text('step_key'),
		turnCount: integer('turn_count').notNull().default(0),
		lastMessageAt: timestamp('last_message_at'),
		maxTier: text('max_tier').$type<HelpEscalationTier | null>(),
		hasRedaction: boolean('has_redaction').notNull().default(false),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => [
		index('help_conversation_user_idx').on(t.userId),
		index('help_conversation_trust_idx').on(t.trustId),
	],
);

export const helpQuery = pgTable(
	'help_query',
	{
		id: serial('id').primaryKey(),
		conversationId: integer('conversation_id')
			.references(() => helpConversation.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		turnIndex: integer('turn_index').notNull(),
		questionText: text('question_text').notNull(),
		matchedEntryIds: jsonb('matched_entry_ids').$type<number[]>(),
		selectedEntryId: integer('selected_entry_id').references(() => kbEntry.id, {
			onDelete: 'set null',
		}),
		resolvedTier: text('resolved_tier').$type<HelpEscalationTier | null>(),
		triggerCodes: jsonb('trigger_codes').$type<string[]>(),
		rerankScore: text('rerank_score'),
		runnerUpScore: text('runner_up_score'),
		thresholdConfigVersion: text('threshold_config_version'),
		providerModelVersions: jsonb('provider_model_versions').$type<Record<string, string>>(),
		renderedResponse: jsonb('rendered_response').$type<HelpRenderedResponse>().notNull(),
		ctaShown: text('cta_shown'),
		unanswered: boolean('unanswered').notNull().default(false),
		hasRedaction: boolean('has_redaction').notNull().default(false),
		adminReviewStatus: text('admin_review_status')
			.$type<HelpAdminReviewStatus>()
			.notNull()
			.default('open'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [
		index('help_query_conversation_idx').on(t.conversationId, t.turnIndex),
		index('help_query_user_idx').on(t.userId),
		index('help_query_unanswered_idx').on(t.unanswered, t.adminReviewStatus),
	],
);

export const helpRateLimit = pgTable(
	'help_rate_limit',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		bucket: text('bucket').notNull(),
		windowStartedAt: timestamp('window_started_at').notNull(),
		count: integer('count').notNull().default(0),
	},
	(t) => [
		uniqueIndex('help_rate_limit_unique_idx').on(t.userId, t.bucket, t.windowStartedAt),
	],
);

export const helpCtaEvent = pgTable(
	'help_cta_event',
	{
		id: serial('id').primaryKey(),
		queryId: integer('query_id')
			.references(() => helpQuery.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		ctaKey: text('cta_key').notNull(),
		target: text('target').notNull(),
		clickedAt: timestamp('clicked_at').defaultNow().notNull(),
	},
	(t) => [uniqueIndex('help_cta_event_idempotent_idx').on(t.queryId, t.ctaKey)],
);

export const helpEscalation = pgTable(
	'help_escalation',
	{
		id: serial('id').primaryKey(),
		queryId: integer('query_id')
			.references(() => helpQuery.id, { onDelete: 'cascade' })
			.notNull(),
		conversationId: integer('conversation_id')
			.references(() => helpConversation.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		trustId: integer('trust_id'),
		surface: text('surface').$type<HelpSurface>(),
		stepKey: text('step_key'),
		tier: text('tier').$type<HelpEscalationTier>().notNull(),
		triggerCode: text('trigger_code').notNull(),
		responsePolicy: text('response_policy').notNull(),
		status: text('status').$type<HelpEscalationStatus>().notNull().default('open'),
		notifiedAt: timestamp('notified_at'),
		resolvedAt: timestamp('resolved_at'),
		resolvedBy: text('resolved_by'),
		resolutionNote: text('resolution_note'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => [
		index('help_escalation_status_idx').on(t.status, t.tier),
		index('help_escalation_user_idx').on(t.userId),
	],
);

export const helpStepBlock = pgTable(
	'help_step_block',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		trustId: integer('trust_id'),
		surface: text('surface').$type<HelpSurface>().notNull(),
		stepKey: text('step_key').notNull(),
		escalationId: integer('escalation_id').references(() => helpEscalation.id, {
			onDelete: 'set null',
		}),
		active: boolean('active').notNull().default(true),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		resolvedAt: timestamp('resolved_at'),
	},
	(t) => [
		index('help_step_block_active_idx').on(t.userId, t.surface, t.stepKey, t.active),
	],
);

export const helpTranscriptAccessLog = pgTable('help_transcript_access_log', {
	id: serial('id').primaryKey(),
	adminUserId: text('admin_user_id')
		.references(() => user.id, { onDelete: 'set null' }),
	conversationId: integer('conversation_id').references(() => helpConversation.id, {
		onDelete: 'set null',
	}),
	accessedAt: timestamp('accessed_at').defaultNow().notNull(),
});

// Relations
export const kbEntryRelations = relations(kbEntry, ({ one, many }) => ({
	internal: one(kbEntryInternal, {
		fields: [kbEntry.id],
		references: [kbEntryInternal.entryId],
	}),
	governance: one(kbEntryGovernance, {
		fields: [kbEntry.id],
		references: [kbEntryGovernance.entryId],
	}),
	versions: many(kbEntryVersion),
}));

export const helpConversationRelations = relations(helpConversation, ({ one, many }) => ({
	user: one(user, { fields: [helpConversation.userId], references: [user.id] }),
	queries: many(helpQuery),
}));

export const helpQueryRelations = relations(helpQuery, ({ one }) => ({
	conversation: one(helpConversation, {
		fields: [helpQuery.conversationId],
		references: [helpConversation.id],
	}),
}));

export const helpSettingRelations = relations(helpSetting, ({ one }) => ({
	updatedByUser: one(user, { fields: [helpSetting.updatedBy], references: [user.id] }),
}));

export const helpEscalationRelations = relations(helpEscalation, ({ one }) => ({
	query: one(helpQuery, { fields: [helpEscalation.queryId], references: [helpQuery.id] }),
	conversation: one(helpConversation, {
		fields: [helpEscalation.conversationId],
		references: [helpConversation.id],
	}),
	user: one(user, { fields: [helpEscalation.userId], references: [user.id] }),
}));

export const kbEntryVersionRelations = relations(kbEntryVersion, ({ one }) => ({
	entry: one(kbEntry, { fields: [kbEntryVersion.entryId], references: [kbEntry.id] }),
}));

import { pgTable, serial, integer, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { user, session, account } from './auth.schema';
import { relations } from 'drizzle-orm';
import { defaultPrepFee } from '../../config';

// ── Marketing / drip ──────────────────────────────────────────────────────────

export type LeadType = 'free_will' | 'quiz' | 'app_started' | 'waitlist' | 'referral_request';
export type SequenceStatus =
	| 'active'
	| 'paused'
	| 'stopped_paid'
	| 'stopped_consult'
	| 'unsubscribed'
	| 'completed'
	| 'stopped_manual';
export type QuizResult =
	| 'free_will_only'
	| 'goodtree_fit'
	| 'legacy_consult'
	| 'advanced_consult';
export type AppStatus =
	| 'account_created'
	| 'intake_started'
	| 'intake_completed'
	| 'checkout_started'
	| 'payment_failed'
	| 'paid';

/**
 * One row per unique email address. Tracks drip sequence enrollment,
 * send schedule, stop/switch rules, compliance, and ops flags.
 * Priority: unsubscribed > paid > consult > app_started > quiz > free_will.
 */
export const marketingLead = pgTable('marketing_lead', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),

	// Identity
	email: text('email').notNull().unique(),
	firstName: text('first_name'),
	/** Links to a user account once created; null for pre-account quiz/free-will leads. */
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	/** Deep-link target for app_started continue CTAs. */
	trustId: integer('trust_id'),

	// Attribution
	firstTouchSource: text('first_touch_source'),
	lastTouchSource: text('last_touch_source'),
	/** USPS state code — set for out-of-state waitlist leads (ticket A1). */
	state: text('state'),
	utmSource: text('utm_source'),
	utmMedium: text('utm_medium'),
	utmCampaign: text('utm_campaign'),
	/** Free-will step id the visitor was on when they left an email (e.g. 'state', 'home_state'). */
	lastStep: text('last_step'),
	/** Short first-party source code (spec v3 §5.1). The raw campaign string is never stored on new rows. */
	attributionCode: text('attribution_code'),
	/** Marketing opt-in (spec v3 §4.3): unchecked by default, never bundled. Service mail ignores this. */
	marketingConsent: boolean('marketing_consent').notNull().default(false),
	marketingConsentAt: timestamp('marketing_consent_at'),

	// Classification
	leadType: text('lead_type').$type<LeadType>(),
	quizResult: text('quiz_result').$type<QuizResult>(),
	quizWaqf: boolean('quiz_waqf').default(false),
	complexityFlags: text('complexity_flags').array(),
	appStatus: text('app_status').$type<AppStatus>(),

	// Sequence state
	currentSequence: text('current_sequence'),
	sequenceStatus: text('sequence_status').$type<SequenceStatus>().default('active'),
	/** 1-based index of the NEXT email to send within the current sequence. */
	nextEmailIndex: integer('next_email_index').default(1),
	nextEmailAt: timestamp('next_email_at'),
	lastEmailAt: timestamp('last_email_at'),
	lastEmailKey: text('last_email_key'),
	enrolledAt: timestamp('enrolled_at'),
	stoppedAt: timestamp('stopped_at'),
	stoppedReason: text('stopped_reason'),

	// Compliance
	unsubscribed: boolean('unsubscribed').notNull().default(false),
	unsubscribeToken: text('unsubscribe_token').unique(),
}, (t) => [
	index('marketing_lead_next_email_idx').on(t.nextEmailAt),
	index('marketing_lead_user_idx').on(t.userId),
]);

/** Lightweight log of every marketing email sent (for admin send history). */
export const marketingEmailLog = pgTable('marketing_email_log', {
	id: serial('id').primaryKey(),
	sentAt: timestamp('sent_at').defaultNow().notNull(),
	leadId: integer('lead_id').references(() => marketingLead.id, { onDelete: 'cascade' }).notNull(),
	email: text('email').notNull(),
	sequence: text('sequence').notNull(),
	emailKey: text('email_key').notNull(),
	subject: text('subject').notNull(),
	/** Resend message ID, if returned. */
	resendId: text('resend_id'),
}, (t) => [
	index('marketing_email_log_lead_idx').on(t.leadId),
]);

type Response = {
	id: string;
	response: string | string[] | boolean | number | null;
}

export type GeneratedFile = {
	/** Logical document kind, e.g. 'joint-trust', 'pour-over-will-husband'. */
	kind: string;
	url: string;
	filename: string;
	/** Storage provider key (uploadthing key) so we can delete later if needed. */
	storageKey?: string;
	/** ISO timestamp of when this file was generated. */
	generatedAt: string;
}

export type UserFileKind = 'trust-document' | 'pour-over-will-husband' | 'pour-over-will-wife' | 'other';

export type UserFile = {
	id: string;
	kind: UserFileKind;
	url: string;
	filename: string;
	/** Storage provider key (uploadthing key) for deletion. */
	storageKey?: string;
	/** ISO timestamp of when this file was uploaded. */
	uploadedAt: string;
}

/** Keys match `screeningQuestions` ids in config; values are Yes (true) / No (false). */
export type TrustScreeningAnswers = Record<string, boolean>;

/** Physical mailing address collected after intake so we can mail a printed legacy binder. */
export type ShippingAddress = {
	street: string;
	unit?: string | null;
	city: string;
	state: string;
	zip: string;
};

export type { LoeAgreementData, LoeCheckboxes, WarningAgreementData, WarningCheckboxes } from '../../loe';
export { LOE_AGREEMENT_VERSION, WARNING_AGREEMENT_VERSION } from '../../loe';
import type { LoeAgreementData, WarningAgreementData } from '../../loe';
export type { AcknowledgmentData, AcknowledgmentCheckboxes } from '../../free-will/acknowledgment';
import type { AcknowledgmentData } from '../../free-will/acknowledgment';

enum Charities {
	IslamicSocietyOfNorthAmerica = 'islamic-society-of-north-america',
	AmericanRedCross = 'american-red-cross',
	AmericanHeartAssociation = 'american-heart-association',
	AmericanDiabetesAssociation = 'american-diabetes-association',
	AmericanCancerSociety = 'american-cancer-society',
}

export enum TrustStatus {
	/** Trust exists; user is still on pre-payment screening + questionnaire (has not reached the payment step). */
	Started = 'started',
	/** Pre-payment questionnaire is complete; user must complete Stripe checkout before post-payment questions unlock. */
	AwaitingPayment = 'awaiting-payment',
	/** Checkout succeeded (webhook); post-payment questionnaire in progress until the user submits the full intake. */
	AwaitingAnswers = 'awaiting-answers',
	/** Full intake submitted; awaiting admin review. Current final stage in the product workflow. */
	RequiresReview = 'review',
	/** Documents approved; awaiting the user to book a notarization slot via Calendly. */
	NotarizationPending = 'notarization-pending',
	/** Notarization appointment booked via Calendly; awaiting the meeting itself. */
	NotarizationScheduled = 'notarization-scheduled',
	/** Notarization complete. */
	Completed = 'completed',
}

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const trust = pgTable('trust', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // going to be same as completed_as if complete is true
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	isEligible: boolean('is_eligible'),
	joint: boolean('joint'),
	/** Pre-intake eligibility questions; persisted when the user completes screening. */
	screeningAnswers: jsonb('screening_answers').$type<TrustScreeningAnswers | null>(),
	responses: jsonb('responses').$type<Response[]>(),
	complete: boolean('complete').notNull().default(false),
	status: text('status').notNull().default(TrustStatus.Started),
	approved: boolean('approved').notNull().default(false),
	file_urls: text('file_urls').array(),
	house_deed_url: text('house_deed_url'),
	generated_files: jsonb('generated_files').$type<GeneratedFile[]>(),
	user_files: jsonb('user_files').$type<UserFile[]>(),
	charities: jsonb('charities').$type<string[]>(),
	selectedPlan: text('selected_plan'), // payment-completion marker ('full' for new checkouts; 'discounted' may exist on legacy rows)
	deedRetrievalRequested: boolean('deed_retrieval_requested').notNull().default(false),
	customPrice: integer('custom_price'), // admin-set override for defaultPrepFee (in whole dollars)
	// ── Notarization (Calendly) ───────────────────────────────────────
	/** Per-trust single-use Calendly booking URL (already includes our tracking token as utm_content). */
	notarizationLinkUrl: text('notarization_link_url'),
	/** Opaque tracking token sent as utm_content on the booking URL; matched server-side from the Calendly webhook. */
	notarizationLinkToken: text('notarization_link_token'),
	/** Calendly scheduled_event URI, set when the user books. */
	notarizationEventUri: text('notarization_event_uri'),
	/** Calendly invitee URI, set when the user books. */
	notarizationInviteeUri: text('notarization_invitee_uri'),
	/** When the booking was created (i.e. when Calendly fired invitee.created). */
	notarizationBookedAt: timestamp('notarization_booked_at'),
	/** Scheduled start time of the notarization meeting. */
	notarizationStartTime: timestamp('notarization_start_time'),
	/** Scheduled end time of the notarization meeting. */
	notarizationEndTime: timestamp('notarization_end_time'),
	// ── LOE Clickwrap ────────────────────────────────────────────────
	/** Server-side timestamp recorded when the user accepted the LOE clickwrap. */
	loeAcceptedAt: timestamp('loe_accepted_at'),
	/** Full LOE agreement record (version, checkbox states, client timestamp, user-entered date). */
	loeAgreementData: jsonb('loe_agreement_data').$type<LoeAgreementData | null>(),
	/** Server-side timestamp recorded when the user accepted the Planning Warning clickwrap (pre-payment). */
	warningAcceptedAt: timestamp('warning_accepted_at'),
	/** Full Planning Warning agreement record (version, checkbox states, client timestamp, user-entered date). */
	warningAgreementData: jsonb('warning_agreement_data').$type<WarningAgreementData | null>(),
	// ── Legacy binder shipping ──────────────────────────────────────────
	/** Mailing address collected after intake completion for shipping the printed legacy binder. */
	shippingAddress: jsonb('shipping_address').$type<ShippingAddress | null>(),
	/** Short first-party source code carried from first arrival to matter creation (spec v3 §5.1). */
	attributionCode: text('attribution_code'),
	/** Matter jurisdiction (USPS code). Drives which engagement-agreement text the client signs: 'TX' Schedule A, 'CA' advance-fee clause. */
	jurisdiction: text('jurisdiction').notNull().default('TX'),
});

/**
 * Free-form admin notes attached to a specific user. Visible only to admins on the
 * user detail screen. `authorId` records which admin wrote it; left nullable + set null
 * on delete so a note survives if the authoring admin account is removed.
 */
export const adminNote = pgTable('admin_note', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
	/** Cached author display name so notes still show an author after account changes. */
	authorName: text('author_name'),
	body: text('body').notNull(),
	pinned: boolean('pinned').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Free Islamic Will submissions. A row may be created before the user has an
 * account (userId null, claimEmail set) and is later claimed when the user
 * signs in with that email. Responses are stored as a flat `{ id, response }[]`
 * array so the data can be reused to seed the GoodTree Trust intake later.
 */
export const freeWill = pgTable('free_will', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	/** Set once the user authenticates; null while the submission is pending a claim. */
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	/** Lowercased email captured at completion; used to claim a pending row after sign-in. */
	claimEmail: text('claim_email'),
	/** Name captured at completion (used to create the account). */
	name: text('name'),
	/** USPS state code the testator lives in. */
	state: text('state'),
	/** 'attorney' (TX/CA) or 'self-help' (all other states). */
	legalMode: text('legal_mode'),
	/** Flat response array mirroring the trust `responses` shape (values may be objects, e.g. child counts). */
	responses: jsonb('responses').$type<{ id: string; response: unknown }[]>(),
	/** Computed CRM lead tags (dev brief §6). */
	tags: text('tags').array(),
	/** Recommended upsell plan key, e.g. 'goodtree-trust'. */
	recommendedPlan: text('recommended_plan'),
	// ── First-touch attribution (A7 groundwork) ────────────────────────
	utmSource: text('utm_source'),
	utmMedium: text('utm_medium'),
	utmCampaign: text('utm_campaign'),
	/** "Send me reminders every 6 months" (pre-checked). */
	reviewReminders: boolean('review_reminders').notNull().default(true),
	/** True once the questionnaire is finished and submitted. */
	complete: boolean('complete').notNull().default(false),
	/** Generated will documents (uploadthing), keyed by `kind` e.g. 'free-will'. */
	generated_files: jsonb('generated_files').$type<GeneratedFile[]>(),
	// ── Acknowledgment gate (A6/B6) ────────────────────────────────────
	/** Server-side timestamp recorded when the user accepted the acknowledgment gate. */
	acknowledgmentAcceptedAt: timestamp('acknowledgment_accepted_at'),
	/** Full acknowledgment record (version, per-checkbox state, client timestamp). */
	acknowledgmentData: jsonb('acknowledgment_data').$type<AcknowledgmentData | null>(),
	/** Short first-party source code (spec v3 §5.1). */
	attributionCode: text('attribution_code'),
	// ── Marketing consent at account email (spec v3 §4.3) ───────────────
	marketingConsent: boolean('marketing_consent').notNull().default(false),
	marketingConsentAt: timestamp('marketing_consent_at'),
	/**
	 * Answers and the generated PDF are deleted after this time.
	 * Each save sets it to 30 days out, so an edit restarts the clock.
	 */
	purgeAfter: timestamp('purge_after').notNull(),
}, (t) => [
	index('free_will_purge_after_idx').on(t.purgeAfter),
]);

export const invoice = pgTable('invoice', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	name: text('name').notNull(), // the reason for the invoice
	description: text('description').notNull(),
	amount: integer('amount').notNull().default(defaultPrepFee),
	paid: boolean('paid').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	paidAt: timestamp('paid_at'),
	stripeCheckoutSessionId: text('stripe_checkout_session_id'),
});

// ── Make Your Trust Work (funding journey) ───────────────────────────────────

export type FundingTriState = 'yes' | 'no' | 'not_sure';
export type FundingPhase = 'prepare' | 'complete';
/** Who is named as primary beneficiary on retirement accounts. */
export type FundingRetirementBeneficiary = 'spouse_sole' | 'other' | 'not_sure';
export type FundingMilestoneStatus =
	| 'locked'
	| 'not_started'
	| 'in_progress'
	| 'action_needed'
	| 'complete'
	| 'not_applicable';

/** Checklist item id → checked. */
export type FundingChecklistState = Record<string, boolean>;

/**
 * One row per paid trust. Tracks overall funding-journey state, Find Your Stuff
 * answers, and unlock timestamps. Milestone progress lives in funding_milestone.
 */
export const fundingDashboard = pgTable('funding_dashboard', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	trustId: integer('trust_id').references(() => trust.id, { onDelete: 'cascade' }).notNull().unique(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),

	/** Set when admin approves documents (Prepare unlocks). */
	documentsReadyAt: timestamp('documents_ready_at'),
	/** Set when admin finalizes after notarization (Complete unlocks). */
	fundingUnlockedAt: timestamp('funding_unlocked_at'),
	/** Set when all applicable core milestones are complete or N/A. */
	implementationCompletedAt: timestamp('implementation_completed_at'),

	pourOverWillIncluded: boolean('pour_over_will_included').notNull().default(true),
	/** True once an admin has set pourOverWillIncluded by hand; stops re-derivation from files. */
	pourOverWillManual: boolean('pour_over_will_manual').notNull().default(false),
	/** Effective homeowner flag: derived from intake, then from the ownsHome answer. */
	isHomeowner: boolean('is_homeowner'),
	isMarried: boolean('is_married'),

	ownsHome: text('owns_home').$type<FundingTriState | null>(),
	hasBankAccounts: text('has_bank_accounts').$type<FundingTriState | null>(),
	hasBrokerage: text('has_brokerage').$type<FundingTriState | null>(),
	hasEmployerPlan: text('has_employer_plan').$type<FundingTriState | null>(),
	hasIra: text('has_ira').$type<FundingTriState | null>(),
	hasLifeInsurance: text('has_life_insurance').$type<FundingTriState | null>(),
	hasVehicle: text('has_vehicle').$type<FundingTriState | null>(),
	hasCrypto: text('has_crypto').$type<FundingTriState | null>(),
	hasBusiness: text('has_business').$type<FundingTriState | null>(),
	retirementOverThreshold: text('retirement_over_threshold').$type<FundingTriState | null>(),
	/** Asked only of married users with a retirement account; drives the nonspouse risk flag. */
	retirementBeneficiary: text('retirement_beneficiary').$type<FundingRetirementBeneficiary | null>(),
	/** True once Find Your Stuff has been submitted at least once. */
	findYourStuffCompletedAt: timestamp('find_your_stuff_completed_at'),

	/** User-visible note when admin sets action needed. */
	actionNeededNote: text('action_needed_note'),
	actionNeededAt: timestamp('action_needed_at'),

	/** Optional free-text inventory notes (no account numbers). */
	inventoryNotes: text('inventory_notes'),
}, (t) => [
	index('funding_dashboard_user_idx').on(t.userId),
	index('funding_dashboard_docs_ready_idx').on(t.documentsReadyAt),
	index('funding_dashboard_funding_unlocked_idx').on(t.fundingUnlockedAt),
]);

export const fundingMilestone = pgTable('funding_milestone', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	dashboardId: integer('dashboard_id').references(() => fundingDashboard.id, { onDelete: 'cascade' }).notNull(),
	key: text('key').notNull(),
	phase: text('phase').$type<FundingPhase>().notNull(),
	status: text('status').$type<FundingMilestoneStatus>().notNull().default('not_started'),
	checklist: jsonb('checklist').$type<FundingChecklistState>().notNull().default({}),
	naReason: text('na_reason'),
	completedAt: timestamp('completed_at'),
}, (t) => [
	index('funding_milestone_dashboard_idx').on(t.dashboardId),
	index('funding_milestone_key_idx').on(t.dashboardId, t.key),
]);

export const fundingEvent = pgTable('funding_event', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	dashboardId: integer('dashboard_id').references(() => fundingDashboard.id, { onDelete: 'cascade' }).notNull(),
	eventKey: text('event_key').notNull(),
	payload: jsonb('payload').$type<Record<string, unknown>>(),
	actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
}, (t) => [
	index('funding_event_dashboard_idx').on(t.dashboardId),
]);

export const fundingReminderLog = pgTable('funding_reminder_log', {
	id: serial('id').primaryKey(),
	sentAt: timestamp('sent_at').defaultNow().notNull(),
	dashboardId: integer('dashboard_id').references(() => fundingDashboard.id, { onDelete: 'cascade' }).notNull(),
	reminderKey: text('reminder_key').notNull(),
	resendId: text('resend_id'),
}, (t) => [
	index('funding_reminder_log_dashboard_idx').on(t.dashboardId),
	uniqueIndex('funding_reminder_unique_idx').on(t.dashboardId, t.reminderKey),
]);

export type FundingFlagSeverity = 'info' | 'attention' | 'risk';

export const fundingAdminFlag = pgTable('funding_admin_flag', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	dashboardId: integer('dashboard_id').references(() => fundingDashboard.id, { onDelete: 'cascade' }).notNull(),
	flagKey: text('flag_key').notNull(),
	severity: text('severity').$type<FundingFlagSeverity>().notNull().default('attention'),
	reason: text('reason'),
	payload: jsonb('payload').$type<Record<string, unknown>>(),
	resolvedAt: timestamp('resolved_at'),
}, (t) => [
	index('funding_admin_flag_dashboard_idx').on(t.dashboardId),
	index('funding_admin_flag_open_idx').on(t.dashboardId, t.resolvedAt),
]);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	trusts: many(trust),
	invoices: many(invoice),
	freeWills: many(freeWill),
	fundingDashboards: many(fundingDashboard),
}));

export const freeWillRelations = relations(freeWill, ({ one }) => ({
	user: one(user, {
		fields: [freeWill.userId],
		references: [user.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const trustRelations = relations(trust, ({ one }) => ({
	user: one(user, {
		fields: [trust.userId],
		references: [user.id],
	}),
	fundingDashboard: one(fundingDashboard, {
		fields: [trust.id],
		references: [fundingDashboard.trustId],
	}),
}));

export const invoiceRelations = relations(invoice, ({ one }) => ({
	user: one(user, {
		fields: [invoice.userId],
		references: [user.id],
	}),
}));

export const fundingDashboardRelations = relations(fundingDashboard, ({ one, many }) => ({
	trust: one(trust, {
		fields: [fundingDashboard.trustId],
		references: [trust.id],
	}),
	user: one(user, {
		fields: [fundingDashboard.userId],
		references: [user.id],
	}),
	milestones: many(fundingMilestone),
	events: many(fundingEvent),
	reminderLogs: many(fundingReminderLog),
	adminFlags: many(fundingAdminFlag),
}));

export const fundingMilestoneRelations = relations(fundingMilestone, ({ one }) => ({
	dashboard: one(fundingDashboard, {
		fields: [fundingMilestone.dashboardId],
		references: [fundingDashboard.id],
	}),
}));

export const fundingEventRelations = relations(fundingEvent, ({ one }) => ({
	dashboard: one(fundingDashboard, {
		fields: [fundingEvent.dashboardId],
		references: [fundingDashboard.id],
	}),
}));

export const fundingReminderLogRelations = relations(fundingReminderLog, ({ one }) => ({
	dashboard: one(fundingDashboard, {
		fields: [fundingReminderLog.dashboardId],
		references: [fundingDashboard.id],
	}),
}));

export const fundingAdminFlagRelations = relations(fundingAdminFlag, ({ one }) => ({
	dashboard: one(fundingDashboard, {
		fields: [fundingAdminFlag.dashboardId],
		references: [fundingDashboard.id],
	}),
}));

export const marketingLeadRelations = relations(marketingLead, ({ one, many }) => ({
	user: one(user, {
		fields: [marketingLead.userId],
		references: [user.id],
	}),
	emailLogs: many(marketingEmailLog),
}));

export const marketingEmailLogRelations = relations(marketingEmailLog, ({ one }) => ({
	lead: one(marketingLead, {
		fields: [marketingEmailLog.leadId],
		references: [marketingLead.id],
	}),
}));

// ── UTM Tracking Events ───────────────────────────────────────────────────────

/**
 * UTM tracking events table — stores both "landing" and "will_completion" events
 * with the same UTM parameters so we can calculate conversion ratios.
 */
export type UtmEventType = 'landing' | 'will_completion';

export const utmTrackingEvent = pgTable('utm_tracking_event', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	
	// Event type
	eventType: text('event_type').$type<UtmEventType>().notNull(),
	
	// UTM parameters (all three stored together)
	utmSource: text('utm_source'),
	utmMedium: text('utm_medium'),
	utmCampaign: text('utm_campaign'),
	
	// Optional linking to will or lead
	willId: integer('will_id').references(() => freeWill.id, { onDelete: 'set null' }),
	email: text('email'),
	
	// Session/visitor tracking
	sessionId: text('session_id'),
	
	// Additional context
	payload: jsonb('payload').$type<Record<string, unknown>>(),
}, (t) => [
	index('utm_tracking_event_type_idx').on(t.eventType),
	index('utm_tracking_event_source_idx').on(t.utmSource),
	index('utm_tracking_event_session_idx').on(t.sessionId),
	index('utm_tracking_event_will_idx').on(t.willId),
]);

export * from './auth.schema';
export * from './help.schema';
export * from './content.schema';

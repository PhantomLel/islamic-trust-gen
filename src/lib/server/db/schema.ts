import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { user, session, account } from './auth.schema';
import { relations } from 'drizzle-orm';
import { defaultPrepFee } from '../../config';

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
	selectedPlan: text('selected_plan'), // 'full' or 'discounted'
	deedRetrievalRequested: boolean('deed_retrieval_requested').notNull().default(false),
	customPrice: integer('custom_price'), // admin-set override for the base $849 fee (in whole dollars)
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
});

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


export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	trusts: many(trust),
	invoices: many(invoice),
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
}));

export const invoiceRelations = relations(invoice, ({ one }) => ({
	user: one(user, {
		fields: [invoice.userId],
		references: [user.id],
	}),
}));

export * from './auth.schema';

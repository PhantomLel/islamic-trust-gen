import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { user, session, account } from './auth.schema';
import { relations } from 'drizzle-orm';
import { defaultPrepFee } from '$lib/config';

type Response = {
	id: string;
	response: string | string[] | boolean | number | null;
}

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
	/** (Future) Admin approved; trust awaits notarization. */
	NotarizationPending = 'notarization-pending',
	/** (Future) Notarization complete. */
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
	responses: jsonb('responses').$type<Response[]>(),
	complete: boolean('complete').notNull().default(false),
	status: text('status').notNull().default(TrustStatus.Started),
	approved: boolean('approved').notNull().default(false),
	file_urls: text('file_urls').array(),
	house_deed_url: text('house_deed_url'),
	charities: jsonb('charities').$type<string[]>(),
	selectedPlan: text('selected_plan'), // 'full' or 'discounted'
	deedRetrievalRequested: boolean('deed_retrieval_requested').notNull().default(false),
	customPrice: integer('custom_price'), // admin-set override for the base $849 fee (in whole dollars)
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

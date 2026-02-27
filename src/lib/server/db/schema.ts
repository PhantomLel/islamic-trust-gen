import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { user, session, account } from './auth.schema';
import { relations } from 'drizzle-orm';

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

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const trust = pgTable('trust', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // going to be same as completed_as if complete is true
	userId: text('user_id').references(() => user.id).notNull(),
	isEligible: boolean('is_eligible'),
	joint: boolean('joint'),
	responses: jsonb('responses').$type<Response[]>(),
	complete: boolean('complete').notNull().default(false),
	approved: boolean('approved').notNull().default(false),
	file_urls: text('file_urls').array(),
	price: integer('price').notNull().default(799),
	paid: boolean('paid').notNull().default(false),
	donate_percentage: integer('donate_percentage').notNull().default(0), // the amount from the wasiyyah that the user decides to give away
	charities: jsonb('charities').$type<string[]>(),
});


export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	trusts: many(trust),
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

export * from './auth.schema';

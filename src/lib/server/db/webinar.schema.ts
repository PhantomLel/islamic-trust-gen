import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { videoPage } from './content.schema';

export const WEBINAR_STATUSES = ['draft', 'open', 'closed'] as const;
export type WebinarStatus = (typeof WEBINAR_STATUSES)[number];

/** One scheduled session. `join_url` stays off every public response. */
export const webinar = pgTable(
	'webinar',
	{
		id: serial('id').primaryKey(),
		title: text('title').notNull(),
		startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
		durationMinutes: integer('duration_minutes').notNull(),
		joinUrl: text('join_url').notNull(),
		replayVideoId: integer('replay_video_id').references(() => videoPage.id, { onDelete: 'set null' }),
		status: text('status').$type<WebinarStatus>().notNull().default('draft'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [uniqueIndex('webinar_one_open_idx').on(t.status).where(sql`${t.status} = 'open'`)],
);

export const webinarRegistration = pgTable(
	'webinar_registration',
	{
		id: serial('id').primaryKey(),
		webinarId: integer('webinar_id')
			.notNull()
			.references(() => webinar.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		email: text('email').notNull(),
		state: text('state').notNull(),
		attributionCode: text('attribution_code'),
		marketingConsent: boolean('marketing_consent').notNull().default(false),
		marketingConsentAt: timestamp('marketing_consent_at', { withTimezone: true }),
		confirmationSentAt: timestamp('confirmation_sent_at', { withTimezone: true }),
		reminder24hSentAt: timestamp('reminder_24h_sent_at', { withTimezone: true }),
		reminder1hSentAt: timestamp('reminder_1h_sent_at', { withTimezone: true }),
		followupSentAt: timestamp('followup_sent_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex('webinar_registration_email_idx').on(t.webinarId, sql`lower(${t.email})`),
		index('webinar_registration_webinar_idx').on(t.webinarId),
	],
);

export const webinarRelations = relations(webinar, ({ one, many }) => ({
	replayVideo: one(videoPage, { fields: [webinar.replayVideoId], references: [videoPage.id] }),
	registrations: many(webinarRegistration),
}));

export const webinarRegistrationRelations = relations(webinarRegistration, ({ one }) => ({
	webinar: one(webinar, { fields: [webinarRegistration.webinarId], references: [webinar.id] }),
}));

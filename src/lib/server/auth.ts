import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink } from 'better-auth/plugins/magic-link';
import { admin } from 'better-auth/plugins/admin';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { siteName } from '$lib/config';
import { magicLinkEmail } from '$lib/server/emails/magicLink';
import { notifyAdmins } from '$lib/server/notifyAdmins';

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	databaseHooks: {
		user: {
			create: {
				after: async (created) => {
					if (!created?.id) return;
					const lines = [
						'Event: New user signup',
						`User ID: ${created.id}`,
						`Name: ${created.name ?? ''}`,
						`Email: ${created.email ?? ''}`,
						`Role: ${created.role ?? ''}`,
						`Email verified: ${created.emailVerified === true ? 'yes' : 'no'}`,
						`Created at: ${created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt ?? '')}`,
					];
					await notifyAdmins('New user signup', lines.join('\n'));
				},
			},
		},
		session: {
			create: {
				after: async (created) => {
					const ua = created.userAgent;
					if (!created.userId || typeof ua !== 'string' || !ua.trim()) return;
					await db
						.update(user)
						.set({ lastLoginUserAgent: ua })
						.where(eq(user.id, created.userId));
				},
			},
		},
	},
	emailAndPassword: { enabled: true },
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!,
		},
	},
	plugins: [
		admin({
			// New users default to the "client" role
			defaultRole: 'client',
			// "admin" is the only elevated role
			adminRoles: ['admin'],
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await resend.emails.send({
					from: env.FROM_EMAIL,
					to: email,
					subject: `Your sign-in link for ${siteName}`,
					html: magicLinkEmail(url),
				}).then(() => {
					console.log(`[Magic Link] Successfully sent to ${email}: ${url}`);
				}).catch((error) => {
					console.error(`[Magic Link] Error sending to ${email}: ${error}`);
				});
			},
		}),
		sveltekitCookies(getRequestEvent),
	],
});

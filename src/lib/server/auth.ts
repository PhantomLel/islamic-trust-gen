import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink } from 'better-auth/plugins/magic-link';
import { admin } from 'better-auth/plugins/admin';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { APIError } from 'better-auth/api';
import { contentSessionPathAllowed, isContentStaffRole, CONTENT_SESSION_IDLE_MS } from '$lib/content/permissions';
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
				// Content staff (spec v3 §7): password sign-in plus the second factor only, and a
				// 12-hour session. Magic links and Google sign-in skip the second factor, so they
				// are refused for these roles.
				before: async (created, ctx) => {
					if (!created.userId) return;
					const [row] = await db
						.select({ role: user.role })
						.from(user)
						.where(eq(user.id, created.userId))
						.limit(1);
					if (!isContentStaffRole(row?.role)) return;
					if (!contentSessionPathAllowed(ctx?.path)) {
						throw new APIError('FORBIDDEN', {
							message: 'Content accounts sign in with email and password, then a verification code.',
						});
					}
					return { data: { ...created, expiresAt: new Date(Date.now() + CONTENT_SESSION_IDLE_MS) } };
				},
				after: async (created) => {
					const ua = created.userAgent;
					if (!created.userId || typeof ua !== 'string' || !ua.trim()) return;
					await db
						.update(user)
						.set({ lastLoginUserAgent: ua, updatedAt: new Date() })
						.where(eq(user.id, created.userId));
				},
			},
		},
	},
	emailAndPassword: { enabled: true },
	session: {
		// Sessions refresh at most this often. Content staff are signed out after 12 idle hours
		// (checked in hooks.server.ts against the session's last refresh), so keep this short.
		updateAge: 5 * 60,
	},
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
		// Required for content_author and content_publisher. Enrolment happens at /admin/content/security.
		twoFactor({ issuer: siteName }),
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

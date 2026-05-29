import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink } from 'better-auth/plugins/magic-link';
import { admin } from 'better-auth/plugins/admin';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { Resend } from 'resend';
import { magicLinkEmail } from '$lib/server/emails/magicLink';
import { siteName } from '$lib/config';

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
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

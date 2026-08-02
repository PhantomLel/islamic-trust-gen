/**
 * Provider and admin readiness checks (plan §1, §11, §14).
 */
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export function helpProvidersConfigured(): boolean {
	return Boolean(env.VOYAGE_API_KEY?.trim() && env.OPENAI_API_KEY?.trim());
}

export function helpProvidersVerified(): boolean {
	return env.HELP_PROVIDERS_VERIFIED === 'true' && helpProvidersConfigured();
}

/** Production query paths fail closed when providers are not verified. */
export function assertHelpProvidersReadyForProduction(): void {
	if (process.env.NODE_ENV !== 'production') return;
	if (!helpProvidersVerified()) {
		throw new Error('Help Assistant providers are not verified for production use');
	}
}

export async function listActiveAdminEmails(): Promise<string[]> {
	const admins = await db.query.user.findMany({
		where: eq(user.role, 'admin'),
		columns: { email: true, banned: true },
	});
	return admins.filter((a) => !a.banned && a.email?.trim()).map((a) => a.email.trim());
}

export async function assertAdminEscalationDestinations(): Promise<{ ok: boolean; missing: string[] }> {
	const emails = await listActiveAdminEmails();
	return {
		ok: emails.length > 0,
		missing: emails.length === 0 ? ['no active admin email addresses'] : [],
	};
}

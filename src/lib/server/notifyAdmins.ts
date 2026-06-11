import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { siteName } from '$lib/config';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function formatUsd(cents: number | null | undefined): string {
	if (cents == null || Number.isNaN(cents)) return 'unknown';
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** True when `ORIGIN` is a typical local dev URL (Vite, etc.). */
function isLocalDevOrigin(origin: string | undefined): boolean {
	const o = origin?.trim();
	if (!o) return false;
	try {
		const { hostname } = new URL(o);
		return (
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '[::1]' ||
			hostname === '0.0.0.0'
		);
	} catch {
		return false;
	}
}

/**
 * Plain-text email to every user with role `admin`. No HTML.
 * Fails open: logs and returns if Resend or admins are missing.
 */
export async function notifyAdmins(subject: string, body: string): Promise<void> {
	if (process.env.NODE_ENV !== 'production') {
		console.warn('[notifyAdmins] Skipping send: not in production (NODE_ENV=%s)', process.env.NODE_ENV);
		return;
	}

	if (isLocalDevOrigin(env.ORIGIN)) {
		console.warn('[notifyAdmins] Skipping send: ORIGIN is local (dev)');
		return;
	}

	if (!env.RESEND_API_KEY?.trim() || !env.FROM_EMAIL?.trim()) {
		console.warn('[notifyAdmins] Skipping: RESEND_API_KEY or FROM_EMAIL not set');
		return;
	}

	const admins = await db.query.user.findMany({
		where: eq(user.role, 'admin'),
		columns: { email: true },
	});
	const to = admins.map((a) => a.email.trim()).filter(Boolean);
	if (to.length === 0) {
		console.warn('[notifyAdmins] No admin users with role "admin"');
		return;
	}

	const resend = new Resend(env.RESEND_API_KEY);
	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to,
			subject: `[${siteName}] ${subject}`,
			text: body.trimEnd() + '\n',
		});
	} catch (err) {
		console.error('[notifyAdmins] Send failed:', err);
	}
}

export function formatStripeAmount(cents: number | null | undefined): string {
	return formatUsd(cents);
}

export function adminUserUrl(userId: string): string {
	const origin = (env.ORIGIN ?? '').replace(/\/$/, '');
	return origin ? `${origin}/admin/user/${userId}` : `/admin/user/${userId}`;
}

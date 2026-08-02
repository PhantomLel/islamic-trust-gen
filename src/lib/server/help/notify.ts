import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { siteName } from '$lib/config';
import { listActiveAdminEmails } from '$lib/server/help/contracts';
import { getHelpSettings } from '$lib/server/help/settings';
import { db } from '$lib/server/db';
import { helpEscalation } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function notifyHelpEscalation(input: {
	escalationId: number;
	tier: string;
	triggerCode: string;
	userId: string;
	surface: string;
	stepKey: string | null;
}): Promise<void> {
	if (process.env.NODE_ENV !== 'production') return;
	if (!env.RESEND_API_KEY?.trim() || !env.FROM_EMAIL?.trim()) return;

	const settings = await getHelpSettings();
	const admins = await listActiveAdminEmails();
	const extra = settings.urgentEscalationEmailList ?? [];
	const to = [...new Set([...admins, ...extra].filter(Boolean))];
	if (to.length === 0) return;

	const origin = (env.ORIGIN ?? '').replace(/\/$/, '');
	const adminUrl = origin ? `${origin}/admin/help/escalations` : '/admin/help/escalations';

	const resend = new Resend(env.RESEND_API_KEY);
	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to,
			subject: `[${siteName}] Urgent Help Assistant escalation (${input.triggerCode})`,
			text: [
				'An urgent Help Assistant escalation was recorded.',
				`Tier: ${input.tier}`,
				`Trigger: ${input.triggerCode}`,
				`User id: ${input.userId}`,
				`Surface: ${input.surface}`,
				input.stepKey ? `Step: ${input.stepKey}` : '',
				`Review: ${adminUrl}`,
				'No user question text is included in this alert.',
			]
				.filter(Boolean)
				.join('\n'),
		});
		await db
			.update(helpEscalation)
			.set({ notifiedAt: new Date(), updatedAt: new Date() })
			.where(eq(helpEscalation.id, input.escalationId));
	} catch (err) {
		console.error('[notifyHelpEscalation]', err);
	}
}

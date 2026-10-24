import { dueEmails } from '$lib/webinar/due';
import { listUnsentRegistrations } from './db';
import { deliverWebinarEmail } from './send';

/** Send every webinar email that is due. Claiming `*_sent_at` keeps a second run from sending it again. */
export async function processDueWebinarEmails(now = new Date()): Promise<number> {
	const rows = await listUnsentRegistrations();
	let sent = 0;
	for (const row of rows) {
		if (!row.webinar) continue;
		const due = dueEmails(
			{
				confirmationSentAt: row.confirmationSentAt,
				reminder24hSentAt: row.reminder24hSentAt,
				reminder1hSentAt: row.reminder1hSentAt,
				followupSentAt: row.followupSentAt,
			},
			{ startsAt: row.webinar.startsAt, durationMinutes: row.webinar.durationMinutes },
			now,
		);
		for (const kind of due) {
			const ok = await deliverWebinarEmail({ id: row.id, email: row.email }, row.webinar, kind);
			if (ok) sent += 1;
		}
	}
	return sent;
}

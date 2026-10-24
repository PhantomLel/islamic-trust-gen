/**
 * TODO(Leonard): replace this factual stub with approved email copy.
 * Service mail: title, time, and the join link or the consultation link. No unsubscribe.
 */
import { formatFirmNapLine } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from '$lib/server/emails/layout';
import type { WebinarEmailKind } from '$lib/webinar/due';
import { buildWebinarIcs } from '$lib/webinar/ics';

export function webinarEmail(opts: {
	kind: WebinarEmailKind;
	title: string;
	whenLabel: string;
	joinUrl: string;
	consultUrl: string;
	uid: string;
	startsAt: Date;
	durationMinutes: number;
}): { subject: string; html: string; ics?: string } {
	const title = escapeHtmlText(opts.title);
	const when = escapeHtmlText(opts.whenLabel);
	const nap = escapeHtmlText(formatFirmNapLine());
	const link =
		opts.kind === 'followup'
			? `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.7;"><a href="${escapeHtmlAttr(opts.consultUrl)}" style="color:#1e3a3a;">${escapeHtmlText(opts.consultUrl)}</a></p>`
			: `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.7;"><a href="${escapeHtmlAttr(opts.joinUrl)}" style="color:#1e3a3a;">${escapeHtmlText(opts.joinUrl)}</a></p>`;
	const subject =
		opts.kind === 'confirmation'
			? `You're registered: ${opts.title}`
			: opts.kind === 'reminder_24h'
				? `Reminder: ${opts.title}`
				: opts.kind === 'reminder_1h'
					? `Starting soon: ${opts.title}`
					: `After the webinar: ${opts.title}`;
	const html = amanaEmailDocument(
		subject,
		`<tr>
            <td style="padding:40px 24px 32px 24px;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:22px;font-weight:500;color:#1e3a3a;line-height:1.3;">${title}</p>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#2c3e3a;">${when}</p>
              ${link}
              <p style="margin:28px 0 0 0;font-size:12px;line-height:1.6;color:#5a7a70;">${nap}</p>
            </td>
          </tr>`,
	);
	if (opts.kind !== 'confirmation') return { subject, html };
	return {
		subject,
		html,
		ics: buildWebinarIcs({
			uid: opts.uid,
			title: opts.title,
			startsAt: opts.startsAt,
			durationMinutes: opts.durationMinutes,
			joinUrl: opts.joinUrl,
		}),
	};
}

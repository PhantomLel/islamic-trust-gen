import { siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from '../layout';

export type FundingReminderEmailInput = {
	trustId: number;
	recipientName?: string | null;
	subject: string;
	headline: string;
	body: string;
	fundingUrl?: string | null;
};

export function fundingReminderEmail(input: FundingReminderEmailInput): string {
	const firstName = input.recipientName?.trim().split(/\s+/)[0] ?? '';
	const greeting = firstName
		? `Assalamu alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu alaikum';
	const link =
		input.fundingUrl && /^https?:\/\//i.test(input.fundingUrl)
			? `<p style="margin:20px 0 0 0;text-align:center;"><a href="${escapeHtmlAttr(input.fundingUrl)}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Continue Make Your Trust Work</a></p>`
			: '';

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 10px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:24px;font-weight:500;color:#1e3a3a;line-height:1.3;">${greeting}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:18px;font-weight:500;color:#1e3a3a;">${escapeHtmlText(input.headline)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;text-align:center;">
              <p style="margin:0 auto;max-width:520px;color:#4a5e58;font-size:15px;line-height:1.7;">
                ${escapeHtmlText(input.body)}
              </p>
              ${link}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8a9a94;">Trust #${escapeHtmlText(String(input.trustId))} · ${escapeHtmlText(siteName)}</p>
            </td>
          </tr>
`;

	return amanaEmailDocument(`${input.subject} — ${siteName}`, mainRows);
}

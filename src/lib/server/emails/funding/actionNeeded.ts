import { siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from '../layout';

export type FundingActionNeededEmailInput = {
	trustId: number;
	recipientName?: string | null;
	note: string;
	fundingUrl?: string | null;
};

export function fundingActionNeededEmail(input: FundingActionNeededEmailInput): string {
	const firstName = input.recipientName?.trim().split(/\s+/)[0] ?? '';
	const greeting = firstName
		? `Assalamu alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu alaikum';
	const note = escapeHtmlText(input.note);
	const link =
		input.fundingUrl && /^https?:\/\//i.test(input.fundingUrl)
			? `<p style="margin:18px 0 0 0;text-align:center;"><a href="${escapeHtmlAttr(input.fundingUrl)}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Open Make Your Trust Work</a></p>`
			: '';

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:24px;font-weight:500;color:#1e3a3a;line-height:1.3;">${greeting}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;text-align:center;">
              <p style="margin:0 auto;max-width:520px;color:#4a5e58;font-size:15px;line-height:1.7;">
                We need something from you before you continue with Trust #${escapeHtmlText(String(input.trustId))}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2dbd3;border-radius:10px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Note from our office</p>
                    <p style="margin:0;font-size:14px;color:#2c3e3a;line-height:1.7;">${note}</p>
                    ${link}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;

	return amanaEmailDocument(`Action needed — ${siteName}`, mainRows);
}

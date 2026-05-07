import { notarizationBookingUrl, siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';

export type DocumentsApprovedEmailInput = {
	trustId: number;
	/** Absolute dashboard URL; omit when ORIGIN is not configured. */
	dashboardUrl?: string | null;
};

export function documentsApprovedEmail(input: DocumentsApprovedEmailInput): string {
	const scheduleHref = escapeHtmlAttr(notarizationBookingUrl);
	const scheduleText = escapeHtmlText(notarizationBookingUrl);
	const trustRef = escapeHtmlText(`Trust #${input.trustId}`);

	const dashboardSection =
		input.dashboardUrl && /^https?:\/\//i.test(input.dashboardUrl)
			? (() => {
					const dashHref = escapeHtmlAttr(input.dashboardUrl!);
					const dashText = escapeHtmlText(input.dashboardUrl!);
					return `
          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your documents</p>
              <p style="margin:0 0 12px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Available in your dashboard</p>
              <p style="margin:0 0 6px 0;font-size:14px;color:#3a4e48;line-height:1.7;">
                You can view or download your approved documents anytime from your account.
              </p>
              <p style="margin:0;font-size:13px;color:#5a7a70;word-break:break-all;">
                <a href="${dashHref}" style="color:#1e3a3a;text-decoration:underline;font-weight:500;">${dashText}</a>
              </p>
            </td>
          </tr>`;
				})()
			: `
          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your documents</p>
              <p style="margin:0 0 12px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Available in your dashboard</p>
              <p style="margin:0;font-size:14px;color:#3a4e48;line-height:1.7;">
                You can view or download your approved documents anytime by signing in to your account.
              </p>
            </td>
          </tr>`;

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">Your documents are approved</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">
                Assalamu Alaikum. We have reviewed and approved your estate planning documents. ${trustRef} is ready for the final step before your trust takes effect.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Next step</p>
              <p style="margin:0 0 16px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Schedule your notarization</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#3a4e48;line-height:1.7;">
                Book a short appointment so we can coordinate the signing and answer any last questions before you execute the documents.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <a href="${scheduleHref}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">Schedule on Calendly</a>
                    <p style="margin:18px 0 6px 0;font-size:12px;color:#8a9a94;">If the button does not work, copy and paste this link:</p>
                    <p style="margin:0;word-break:break-all;font-size:12px;color:#5a7a70;">${scheduleText}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">Important</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;">
                      <strong style="color:#f5f0eb;">Your trust must be notarized to be valid.</strong> Until the document is signed and notarized, it is not legally effective and does not protect your family or assets. Notarization is the single most important step that remains.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${dashboardSection}

          <tr>
            <td style="padding:32px 24px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#7a8e88;line-height:1.65;font-style:italic;">May Allah make this an enduring amanah for you and your family.</p>
            </td>
          </tr>
`;

	return amanaEmailDocument(`Documents approved — ${siteName}`, mainRows);
}

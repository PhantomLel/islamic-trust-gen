import { siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';

export function magicLinkEmail(url: string): string {
	const href = escapeHtmlAttr(url);
	const textUrl = escapeHtmlText(url);

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">Assalamu Alaikum</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">
                We received a request to sign in to your account. Use the button below to open your dashboard securely. This link expires in <strong style="color:#1e3a3a;">10 minutes</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Sign in</p>
              <p style="margin:0 0 20px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Your magic link</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <a href="${href}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">Sign in to my account</a>
                    <p style="margin:18px 0 6px 0;font-size:12px;color:#8a9a94;">If the button does not work, copy and paste this link:</p>
                    <p style="margin:0;word-break:break-all;font-size:12px;color:#5a7a70;">${textUrl}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">Security</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;">
                      <strong style="color:#f5f0eb;">Did not request this?</strong> You can safely ignore this email. Your account stays secure, and no one can sign in without access to your inbox.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;

	return amanaEmailDocument(`Sign in to ${siteName}`, mainRows);
}

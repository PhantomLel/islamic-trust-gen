import { siteName } from '$lib/config';

export function magicLinkEmail(url: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to ${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a4a3a 0%,#2d7a5e 100%);padding:40px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:24px;color:#c8a96e;letter-spacing:4px;font-weight:400;">&#9670;</p>
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">${siteName}</h1>
              <p style="margin:8px 0 0 0;font-size:13px;color:#a8d5c2;letter-spacing:1px;text-transform:uppercase;">Secure Access</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#1a2e24;">Your Sign-In Link</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#4a5568;">
                As-salamu alaykum,<br /><br />
                We received a request to sign in to your account. Click the button below to securely access your dashboard. This link is valid for <strong>10 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px 0;">
                    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1a4a3a 0%,#2d7a5e 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;">Sign In to My Account</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e8e0d5;padding-top:24px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="margin:0;word-break:break-all;font-size:12px;color:#2d7a5e;">${url}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f0;border-left:3px solid #c8a96e;border-radius:4px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      <strong style="color:#4a5568;">Didn't request this?</strong> If you didn't request a sign-in link, you can safely ignore this email. Your account remains secure.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f5f0;padding:24px 48px;text-align:center;border-top:1px solid #e8e0d5;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">${siteName} &mdash; Trusted Estate Planning</p>
              <p style="margin:0;font-size:11px;color:#c3bfb8;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

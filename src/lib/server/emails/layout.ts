import { siteName, siteTagline, firmMailingAddress } from '$lib/config';

export function escapeHtmlAttr(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeHtmlText(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Marketing email wrapper — same visual system as transactional emails, but adds
 * hidden preview text, an unsubscribe link, a physical mailing address (CAN-SPAM),
 * and marketing-appropriate footer copy.
 * Pass only inner `<tr>...</tr>` rows.
 */
export function amanaMarketingEmailDocument(
	title: string,
	mainRowsHtml: string,
	opts: { unsubscribeUrl: string; previewText: string },
): string {
	const safeTitle = escapeHtmlText(title);
	const safePreview = escapeHtmlText(opts.previewText);
	const unsubHref = escapeHtmlAttr(opts.unsubscribeUrl);
	const safeAddress = escapeHtmlText(firmMailingAddress);
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;color:#2c3e3a;font-family:'Inter',system-ui,sans-serif;line-height:1.7;font-size:15px;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">
          <tr>
            <td style="padding:0 24px 40px 24px;text-align:center;border-bottom:1px solid #d4cdc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <span style="display:inline-block;width:10px;height:10px;background:#5a9e8f;border-radius:50%;vertical-align:middle;"></span>
                  </td>
                  <td style="vertical-align:middle;font-family:'Lora',Georgia,serif;font-size:22px;font-weight:500;color:#1e3a3a;letter-spacing:0.5px;">${escapeHtmlText(siteName)}</td>
                </tr>
              </table>
              <p style="margin:6px 0 0 0;font-size:12px;letter-spacing:3px;color:#7a8e88;text-transform:uppercase;">${escapeHtmlText(siteTagline)}</p>
            </td>
          </tr>
          ${mainRowsHtml}
          <tr>
            <td style="padding:32px 24px 24px 24px;border-top:1px solid #d4cdc4;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:13px;color:#5a7a70;font-weight:500;">McDaniel Estate Planning, PLLC</p>
              <p style="margin:0;font-size:12px;color:#8a9a94;line-height:1.6;">${escapeHtmlText(siteName)} is a service of McDaniel Estate Planning, PLLC. Licensed in Texas and California.</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#a0aea8;line-height:1.5;">This is a marketing email. It does not replace individualized legal advice.</p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#a0aea8;line-height:1.5;">${safeAddress}</p>
              <p style="margin:10px 0 0 0;font-size:11px;line-height:1.5;">
                <a href="${unsubHref}" style="color:#8a9a94;text-decoration:underline;">Unsubscribe from marketing emails</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Shared GoodTree wrapper: pass only inner `<tr>...</tr>` rows (between header and footer). */
export function amanaEmailDocument(title: string, mainRowsHtml: string): string {
	const safeTitle = escapeHtmlText(title);
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;color:#2c3e3a;font-family:'Inter',system-ui,sans-serif;line-height:1.7;font-size:15px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">
          <tr>
            <td style="padding:0 24px 40px 24px;text-align:center;border-bottom:1px solid #d4cdc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <span style="display:inline-block;width:10px;height:10px;background:#5a9e8f;border-radius:50%;vertical-align:middle;"></span>
                  </td>
                  <td style="vertical-align:middle;font-family:'Lora',Georgia,serif;font-size:22px;font-weight:500;color:#1e3a3a;letter-spacing:0.5px;">${escapeHtmlText(siteName)}</td>
                </tr>
              </table>
              <p style="margin:6px 0 0 0;font-size:12px;letter-spacing:3px;color:#7a8e88;text-transform:uppercase;">${escapeHtmlText(siteTagline)}</p>
            </td>
          </tr>
          ${mainRowsHtml}
          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:13px;color:#5a7a70;font-weight:500;">McDaniel Estate Planning, PLLC</p>
              <p style="margin:0;font-size:12px;color:#8a9a94;line-height:1.6;">${escapeHtmlText(siteName)} is a service of McDaniel Estate Planning, PLLC. Licensed in Texas and California.</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#a0aea8;line-height:1.5;">This message is transactional. It does not replace individualized legal advice.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

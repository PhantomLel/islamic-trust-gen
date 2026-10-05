/**
 * Free Islamic Will — delivery email v2 (ticket A2). Implements
 * `will_delivery_email_template_v2.html` directly rather than the shared
 * `amanaEmailDocument` wrapper: this email has its own header/footer, and the
 * footer already carries the correct "Licensed in Texas and California" line
 * (the shared wrapper's footer still says Texas-only — B7, fixed in round 2).
 */

import { siteName } from '$lib/config';
import { DRAFT_MARKER } from '$lib/free-will/draft';
import { willSigningInstructionsFor } from '$lib/free-will/signing';
import { escapeHtmlText } from './layout';

/**
 * This is a service email: it delivers the document and the signing wrapper.
 * It carries no plan-recommendation cards, flag lists, or other promotional
 * blocks (spec v3 §4.4, §4.5).
 */

export type FreeWillReadyV2Input = {
	/** Testator's first name for the greeting; falls back to a generic line. */
	firstName?: string | null;
	/** Full state name, e.g. "Texas". Kept for callers; the copy itself is state-neutral. */
	stateName?: string | null;
	/** USPS state code — Texas gets the Appendix A §4.1 steps; every state gets the wrapper. */
	stateCode?: string | null;
	/** Filename of the will attached to this email. */
	filename: string;
};

export function freeWillReadyEmailV2(input: FreeWillReadyV2Input): string {
	const firstName = (input.firstName ?? '').trim();
	const greeting = firstName
		? `Assalamu Alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu Alaikum';
	const fileName = escapeHtmlText(input.filename);

	const instructions = willSigningInstructionsFor(input.stateCode);
	const stepsHtml = instructions.steps
		.map(
			(step, i) => `
      <tr><td width="36" valign="top" style="font-family:Georgia, serif; font-size:13px; color:#4E7A66; padding:6px 0;">${i + 1}.</td>
          <td style="font-family:Georgia, serif; font-size:15px; line-height:22px; color:#3E4A44; padding:6px 0;">${escapeHtmlText(step)}</td></tr>`,
		)
		.join('');
	const texasSteps = instructions.heading
		? `
    <div style="font-family:Georgia, serif; font-size:18px; color:#232B27; padding:18px 0 6px 0;">${escapeHtmlText(instructions.heading)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${stepsHtml}
    </table>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your free Islamic will is ready</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F1EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EA;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

  <tr><td align="center" style="padding:8px 0 4px 0;">
    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:#1F3D33;">&#9679;&nbsp;${escapeHtmlText(siteName)}</div>
    <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; color:#7C8B83; padding-top:6px;">ISLAMIC ESTATE PLANNING</div>
  </td></tr>
  <tr><td style="border-bottom:1px solid #DDD6C8; padding-top:20px;"></td></tr>

  <tr><td align="center" style="padding:32px 24px 8px 24px;">
    <div style="font-family:Georgia, serif; font-size:26px; color:#232B27;">${greeting}</div>
  </td></tr>
  <tr><td align="center" style="padding:0 40px 24px 40px;">
    <div style="font-family:Georgia, serif; font-size:16px; line-height:24px; color:#3E4A44;">
      Masha&#8217;Allah &#8212; you have taken a real first step for your family. Your free Islamic will is ready, and a copy is attached to this email.
    </div>
  </td></tr>
  <tr><td style="border-bottom:1px solid #DDD6C8;"></td></tr>

  <tr><td style="padding:28px 24px 8px 24px;">
    <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#4E7A66; padding-bottom:10px;">YOUR DOCUMENT</div>
    <div style="font-family:Georgia, serif; font-size:18px; color:#232B27; padding-bottom:12px;">Attached to this email</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border:1px solid #E3DDCF; border-radius:8px;">
      <tr>
        <td width="64" align="center" style="padding:16px;">
          <div style="background:#E8F0EB; border-radius:8px; width:48px; height:48px; line-height:48px; text-align:center; font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:#1F3D33;">DOC</div>
        </td>
        <td style="padding:16px 16px 16px 0;">
          <div style="font-family:Arial, sans-serif; font-size:14px; font-weight:bold; color:#232B27;">${fileName}</div>
          <div style="font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:#C00000; padding-top:4px;">${escapeHtmlText(DRAFT_MARKER)}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 24px 8px 24px;">
    <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#4E7A66; padding-bottom:10px;">SIGNING</div>
    <div style="font-family:Georgia, serif; font-size:15px; line-height:23px; color:#3E4A44; padding-bottom:6px;">${escapeHtmlText(instructions.wrapper)}</div>${texasSteps}
  </td></tr>

  <tr><td style="padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1F3D33; border-radius:10px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#9DBFAE; padding-bottom:8px;">IMPORTANT</div>
        <div style="font-family:Georgia, serif; font-size:14px; line-height:21px; color:#EDF2EE;">
          <strong>A will is not valid until it is properly signed and witnessed.</strong>
          This free will is a starting point; some situations benefit from attorney review. This is a self-help document \u2014 preparing it does not create an attorney-client relationship and is not legal advice for your specific situation. Your information is private and never shared.
        </div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:32px 40px 8px 40px;">
    <div style="font-family:Georgia, serif; font-size:15px; font-style:italic; color:#6B7A72;">May Allah make this an enduring amanah for you and your family.</div>
  </td></tr>
  <tr><td style="border-bottom:1px solid #DDD6C8; padding-top:20px;"></td></tr>

  <tr><td align="center" style="padding:24px 40px 8px 40px;">
    <div style="font-family:Georgia, serif; font-size:14px; color:#6B5F4A;">McDaniel Estate Planning, PLLC</div>
    <div style="font-family:Georgia, serif; font-size:12px; color:#8A8271; padding-top:6px;">
      Muslim Legacy Planning is a service of McDaniel Estate Planning, PLLC. Licensed in Texas and California.
    </div>
    <div style="font-family:Georgia, serif; font-size:11px; color:#A39B89; padding-top:10px;">
      This message is transactional. It does not replace individualized legal advice.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

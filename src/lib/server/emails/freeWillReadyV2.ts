/**
 * Free Islamic Will — delivery email v2 (ticket A2). Implements
 * `will_delivery_email_template_v2.html` directly rather than the shared
 * `amanaEmailDocument` wrapper: this email has its own header/footer, and the
 * footer already carries the correct "Licensed in Texas and California" line
 * (the shared wrapper's footer still says Texas-only — B7, fixed in round 2).
 */

import { siteName } from '$lib/config';
import { escapeHtmlAttr, escapeHtmlText } from './layout';

export type FreeWillReadyV2Offer = {
	title: string;
	tagline: string;
	priceLine: string;
	href: string;
	/** GoodTree renders as the dark "app" card; Legacy Plan as the light "premium" card. */
	variant: 'app' | 'premium';
};

export type FreeWillReadyV2Input = {
	/** Testator's first name for the greeting; falls back to a generic line. */
	firstName?: string | null;
	/** Full state name, e.g. "Texas". Used in the witnessing note. */
	stateName?: string | null;
	/** USPS state code — drives the state-conditional signing steps. */
	stateCode?: string | null;
	/** Filename of the will attached to this email. */
	filename: string;
	/** MARRIED_TX — married in a state requiring the A6 acknowledgment. */
	marriedCommunityPropertyState: boolean;
	/** FLAGS — pre-labeled bullet lines; empty = the whole block is omitted. */
	flagLines: string[];
	/** Ordered upsell ladder (ticket A2); GoodTree first only when app-recommended. */
	offers: FreeWillReadyV2Offer[];
	/** Direct attorney-consultation booking link, tracked with the same UTM params as the offer cards. */
	consultUrl: string;
};

function signingSteps(stateCode: string | null | undefined): string[] {
	const steps = [
		'Print your will (attached to this email).',
		'Sign and date it in front of two adult witnesses \u2014 adults who receive nothing under your will.',
		"Have your witnesses sign in your presence and each other's.",
	];
	if (stateCode === 'TX') {
		steps.push(
			'Then sign the self-proving affidavit (the last pages) with your witnesses in front of a notary. This step is optional in Texas but strongly recommended \u2014 it saves your family from having to track down your witnesses years from now. Most banks and shipping stores have a notary.',
		);
	} else {
		steps.push(
			'Have the document notarized if your state recommends or requires it \u2014 ask the notary whether a self-proving affidavit applies where you live.',
		);
	}
	steps.push('Store the signed original somewhere safe and tell your personal representative where it is.');
	return steps;
}

function offerCardHtml(offer: FreeWillReadyV2Offer): string {
	const isApp = offer.variant === 'app';
	const cardBg = isApp ? '#1F3D33' : '#FFFFFF';
	const cardBorder = isApp ? '' : 'border:1px solid #E3DDCF;';
	const kicker = isApp ? 'RECOMMENDED FOR YOUR SITUATION' : 'PREMIUM OPTION';
	const kickerColor = isApp ? '#9DBFAE' : '#4E7A66';
	const titleColor = isApp ? '#FFFFFF' : '#232B27';
	const bodyColor = isApp ? '#D7E2DA' : '#3E4A44';
	const ctaBg = isApp ? '#6FA58C' : '#1F3D33';
	const title = escapeHtmlText(offer.title);
	const tagline = escapeHtmlText(offer.tagline);
	const priceLine = escapeHtmlText(offer.priceLine);
	const href = escapeHtmlAttr(offer.href);
	return `
  <tr><td style="padding:16px 24px 0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cardBg}; ${cardBorder} border-radius:10px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:${kickerColor}; padding-bottom:8px;">${kicker}</div>
        <div style="font-family:Georgia, serif; font-size:20px; color:${titleColor}; padding-bottom:6px;">${title}</div>
        <div style="font-family:Georgia, serif; font-size:14px; line-height:21px; color:${bodyColor}; padding-bottom:14px;">
          ${tagline} ${priceLine}
        </div>
        <a href="${href}" style="display:inline-block; background:${ctaBg}; color:#FFFFFF; font-family:Arial, sans-serif; font-size:14px; font-weight:bold; text-decoration:none; padding:12px 22px; border-radius:8px;">${isApp ? 'Start your trust' : 'Learn more'}</a>
      </td></tr>
    </table>
  </td></tr>`;
}

export function freeWillReadyEmailV2(input: FreeWillReadyV2Input): string {
	const firstName = (input.firstName ?? '').trim();
	const greeting = firstName
		? `Assalamu Alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu Alaikum';
	const stateLabel = (input.stateName ?? '').trim() || 'your state';
	const fileName = escapeHtmlText(input.filename);

	const stepsHtml = signingSteps(input.stateCode)
		.map(
			(step, i) => `
      <tr><td width="36" valign="top" style="font-family:Georgia, serif; font-size:13px; color:#4E7A66; padding:6px 0;">0${i + 1}</td>
          <td style="font-family:Georgia, serif; font-size:15px; line-height:22px; color:#3E4A44; padding:6px 0;">${escapeHtmlText(step)}</td></tr>`,
		)
		.join('');

	const communityPropertySection = input.marriedCommunityPropertyState
		? `
  <tr><td style="padding:0 24px 24px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF9F0; border:1px solid #E9DFC8; border-radius:10px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#9A7B3F; padding-bottom:8px;">A NOTE FOR MARRIED COUPLES IN TEXAS</div>
        <div style="font-family:Georgia, serif; font-size:14px; line-height:21px; color:#4A4436;">
          As you acknowledged when creating your will: Texas community property law already gives each spouse half of the marital property, so no will in Texas \u2014 this one or any other \u2014 is strictly shariah-compliant on its own. If full compliance across all your property matters to you, a living trust or a consultation is the way to close the gap.
        </div>
      </td></tr>
    </table>
  </td></tr>`
		: '';

	const flagsSection = input.flagLines.length
		? `
  <tr><td style="padding:0 24px 8px 24px;">
    <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#4E7A66; padding-bottom:10px;">RECOMMENDED NEXT STEPS</div>
    <div style="font-family:Georgia, serif; font-size:14px; line-height:22px; color:#3E4A44; padding-bottom:8px;">
      Based on your answers, a will alone may not fully carry out your wishes:
    </div>
    <div style="font-family:Georgia, serif; font-size:14px; line-height:24px; color:#3E4A44;">
      ${input.flagLines.map((line) => `&#8226; ${escapeHtmlText(line)}`).join('<br>')}
    </div>
  </td></tr>`
		: '';

	const offersHtml =
		input.offers.length > 0
			? input.offers.map(offerCardHtml).join('')
			: `
  <tr><td style="padding:16px 24px 0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border:1px solid #E3DDCF; border-radius:10px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:Georgia, serif; font-size:15px; line-height:22px; color:#3E4A44;">
          Based on what you shared, your situation is fairly straightforward. Most people in your position don&#8217;t need anything beyond this will right now. If that changes down the road &#8212; you buy a home, open a retirement account, start a business, get married &#8212; come back and we&#8217;ll help you figure out the next step then.
        </div>
      </td></tr>
    </table>
  </td></tr>`;
	const consultUrl = escapeHtmlAttr(input.consultUrl);

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
          <div style="font-family:Arial, sans-serif; font-size:12px; color:#7C8B83; padding-top:4px;">Ready to print, sign, witness, and notarize</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 24px 8px 24px;">
    <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; color:#4E7A66; padding-bottom:10px;">NEXT STEP</div>
    <div style="font-family:Georgia, serif; font-size:20px; color:#232B27; padding-bottom:14px;">Sign your will</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${stepsHtml}
    </table>
    <div style="font-family:Georgia, serif; font-size:13px; color:#7C8B83; padding-top:12px;">The attached document includes the specific signing, witnessing, and notarization steps for ${escapeHtmlText(stateLabel)}.</div>
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
  ${communityPropertySection}
  ${flagsSection}
  ${offersHtml}

  <tr><td style="padding:16px 24px 0 24px;">
    <div style="font-family:Georgia, serif; font-size:13px; text-align:center; padding-top:6px;">
      <a href="${consultUrl}" style="font-family:Arial, sans-serif; font-size:14px; color:#1F3D33; text-decoration:underline;">Book an attorney review</a>
    </div>
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

import { siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';

export type FreeWillRecommendedPlan = {
	title: string;
	tagline: string;
	/** Absolute URL to learn more. */
	href: string;
};

export type FreeWillReadyEmailInput = {
	/** Testator's name for a personal greeting; falls back to a generic line. */
	name?: string | null;
	/** Full state name, e.g. "Texas". Used in the witnessing note. */
	stateName?: string | null;
	/** Filename of the will attached to this email. */
	filename: string;
	/** Optional recommended next plan, shown as a closing upsell. */
	recommendedPlan?: FreeWillRecommendedPlan | null;
};

/** Signing steps — mirrors the completion screen of /free-islamic-will. */
const SIGNING_STEPS = [
	'Print your will (attached to this email).',
	'Sign and date it in front of two adult witnesses who are not heirs.',
	"Have your witnesses sign in your presence and each other's.",
	'Store the signed original somewhere safe and tell your representative where it is.',
];

export function freeWillReadyEmail(input: FreeWillReadyEmailInput): string {
	const firstName = (input.name ?? '').trim().split(/\s+/)[0];
	const greeting = firstName
		? `Assalamu Alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu Alaikum';
	const stateLabel = (input.stateName ?? '').trim();
	const stateNote = stateLabel
		? `The attached document includes the specific signing and witnessing steps for ${escapeHtmlText(stateLabel)}.`
		: 'The attached document includes the specific signing and witnessing steps for your state.';
	const fileName = escapeHtmlText(input.filename);

	const stepsHtml = SIGNING_STEPS.map(
		(step, i) => `
                <tr>
                  <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
                    <span style="font-size:12px;font-weight:600;color:#5a9e8f;letter-spacing:1px;">0${i + 1}</span>
                  </td>
                  <td style="vertical-align:top;padding:0 0 14px 0;font-size:14px;color:#3a4e48;line-height:1.6;">${escapeHtmlText(step)}</td>
                </tr>`,
	).join('');

	const recommendedSection = input.recommendedPlan
		? (() => {
				const planHref = escapeHtmlAttr(input.recommendedPlan!.href);
				const planTitle = escapeHtmlText(input.recommendedPlan!.title);
				const planTagline = escapeHtmlText(input.recommendedPlan!.tagline);
				return `
          <tr>
            <td style="padding:32px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">Recommended for you</p>
                    <p style="margin:0 0 8px 0;font-family:'Lora',Georgia,serif;font-size:20px;font-weight:500;color:#f5f0eb;">${planTitle}</p>
                    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#d4e0db;">${planTagline}</p>
                    <a href="${planHref}" style="display:inline-block;background:#5a9e8f;color:#f5f0eb;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;letter-spacing:0.3px;">Learn more</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
			})()
		: '';

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">${greeting}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">
                Masha'Allah — you have taken a real first step for your family. Your free Islamic will is ready, and a copy is attached to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your document</p>
              <p style="margin:0 0 16px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Attached to this email</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <span style="display:inline-block;width:36px;height:36px;background:#eef5f2;border-radius:8px;text-align:center;line-height:36px;font-size:13px;font-weight:700;color:#5a9e8f;">DOC</span>
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#1e3a3a;">${fileName}</p>
                          <p style="margin:2px 0 0 0;font-size:12px;color:#8a9a94;">Ready to print, sign, and witness</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Next step</p>
              <p style="margin:0 0 18px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Sign your will</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${stepsHtml}
              </table>
              <p style="margin:14px 0 0 0;font-size:13px;color:#7a8e88;line-height:1.65;">${stateNote}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">Important</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;">
                      <strong style="color:#f5f0eb;">A will is not valid until it is properly signed and witnessed.</strong> This free will is a starting point; some situations benefit from attorney review. Your information is private and never shared.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${recommendedSection}

          <tr>
            <td style="padding:32px 24px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#7a8e88;line-height:1.65;font-style:italic;">May Allah make this an enduring amanah for you and your family.</p>
            </td>
          </tr>
`;

	return amanaEmailDocument(`Your free Islamic will is ready — ${siteName}`, mainRows);
}

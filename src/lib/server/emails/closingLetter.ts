import { consultationBookingUrl, siteName } from '$lib/config';
import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';

export type ClosingLetterEmailInput = {
	trustId: number;
	/** Recipient's name, used for a personal greeting when available. */
	recipientName?: string | null;
	/** Absolute dashboard/portal URL; omit when ORIGIN is not configured. */
	dashboardUrl?: string | null;
	/** Make Your Trust Work deep link. */
	fundingUrl?: string | null;
};

type StatusKind = 'complete' | 'action';

/** Small status pill matching the app's badge language (emerald = done, red = action needed). */
function statusPill(kind: StatusKind, label: string): string {
	if (kind === 'complete') {
		return `<span style="display:inline-block;background:#e7f1ec;color:#2a7a5a;border:1px solid #bfe0d1;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.4px;padding:3px 10px;white-space:nowrap;">&#10003; ${escapeHtmlText(label)}</span>`;
	}
	return `<span style="display:inline-block;background:#fbecea;color:#b23b2e;border:1px solid #f0ccc6;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.4px;padding:3px 10px;white-space:nowrap;">${escapeHtmlText(label)}</span>`;
}

/** White card used for each document/status line item. */
function documentCard(title: string, pill: string, bodyHtml: string): string {
	return `
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2dbd3;border-radius:10px;margin-bottom:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px 0;">
                      <span style="font-family:'Lora',Georgia,serif;font-size:15px;font-weight:600;color:#1e3a3a;vertical-align:middle;">${title}</span>
                      &nbsp;${pill}
                    </p>
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/** Section heading (small emerald eyebrow + serif title). */
function sectionHeading(eyebrow: string, title: string): string {
	return `
          <tr>
            <td style="padding:32px 24px 12px 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">${escapeHtmlText(eyebrow)}</p>
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:20px;font-weight:500;color:#1e3a3a;line-height:1.3;">${escapeHtmlText(title)}</p>
            </td>
          </tr>`;
}

function paragraph(html: string): string {
	return `
          <tr>
            <td style="padding:0 24px 8px 24px;">
              <p style="margin:0;font-size:14px;color:#4a5e58;line-height:1.7;">${html}</p>
            </td>
          </tr>`;
}

/** A funding sub-item: emerald bullet + bold label + description. */
function fundingItem(label: string, bodyHtml: string): string {
	return `
          <tr>
            <td style="padding:0 24px 10px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="16" style="vertical-align:top;padding-top:6px;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#5a9e8f;"></span>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 2px 0;font-size:14px;font-weight:600;color:#2c3e3a;">${escapeHtmlText(label)}</p>
                    <p style="margin:0;font-size:13px;color:#4a5e58;line-height:1.65;">${bodyHtml}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

export function closingLetterEmail(input: ClosingLetterEmailInput): string {
	const trustRef = escapeHtmlText(`Trust #${input.trustId}`);
	const firstName = input.recipientName?.trim().split(/\s+/)[0] ?? '';
	const greeting = firstName
		? `Assalamu alaikum, ${escapeHtmlText(firstName)}`
		: 'Assalamu alaikum';

	const consultHref = escapeHtmlAttr(consultationBookingUrl);
	const fundingHref =
		input.fundingUrl && /^https?:\/\//i.test(input.fundingUrl)
			? escapeHtmlAttr(input.fundingUrl)
			: input.dashboardUrl && /^https?:\/\//i.test(input.dashboardUrl)
				? escapeHtmlAttr(input.dashboardUrl)
				: null;

	const portalLine =
		input.dashboardUrl && /^https?:\/\//i.test(input.dashboardUrl)
			? `Log in to <a href="${escapeHtmlAttr(input.dashboardUrl)}" style="color:#1e3a3a;text-decoration:underline;font-weight:500;">your portal</a> to access the homestead tax exemption guide. If it is not uploaded yet, check back in a few days.`
			: `Log in to your portal to access the homestead tax exemption guide. If it is not uploaded yet, check back in a few days.`;

	const fundingCta = fundingHref
		? `
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 14px 0;font-size:14px;color:#3a4e48;line-height:1.7;">Use your <strong style="color:#2c3e3a;">Make Your Trust Work</strong> dashboard to finish signing steps, update institutions, and protect your plan — with checklists and progress tracking.</p>
                    <a href="${fundingHref}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;">Open Make Your Trust Work</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
		: '';

	const mainRows = `
          <!-- ── Congratulations header ── -->
          <tr>
            <td style="padding:40px 24px 10px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">${greeting} — congratulations!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;text-align:center;">
              <p style="margin:0 auto 14px auto;max-width:540px;color:#4a5e58;font-size:15px;line-height:1.7;">
                Your app document preparation and included deed service are complete. Your trust has been notarized, your home has been deeded into your trust, and the deed has been recorded with the county. That is a major accomplishment, and your family is now protected in a way that most families are not.
              </p>
              <p style="margin:0 auto;max-width:540px;color:#4a5e58;font-size:15px;line-height:1.7;">
                Your trust is not just a legal document — it is an <em>amanah</em>, a sacred trust, for your family (${trustRef}). The guided steps below still need your attention.
              </p>
            </td>
          </tr>

          ${fundingCta}

          <!-- ── Read-closely banner ── -->
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;">
                      <strong style="color:#f5f0eb;">Please finish Completing Your Funding in the app.</strong> Your trust will not fully work unless you coordinate accounts, beneficiary designations, storage, and trustee notification. Life is busy — keep the dashboard open until every applicable step is done.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Your documents ── -->
          ${sectionHeading('Your documents', 'What you have — and what to do for each')}
          <tr><td style="padding:8px 0 0 0;"></td></tr>

          ${documentCard(
						'Your trust &amp; recorded deed',
						statusPill('complete', 'Complete'),
						`<p style="margin:0;font-size:13px;color:#4a5e58;line-height:1.65;">Signed, notarized, and recorded. Store the recorded deed safely and make sure your successor trustee knows where to find your trust documents.</p>`
					)}

          ${documentCard(
						'Pour-over wills',
						statusPill('action', 'Action needed'),
						`<p style="margin:0 0 8px 0;font-size:13px;color:#4a5e58;line-height:1.65;">Each spouse must sign their will <strong style="color:#2c3e3a;">in person</strong> in front of <strong style="color:#2c3e3a;">two witnesses</strong> who are not beneficiaries. Use the will-signing card in Make Your Trust Work.</p>
             <p style="margin:0;font-size:13px;color:#4a5e58;line-height:1.65;"><strong style="color:#2c3e3a;">This must be done in person — do not use an online notary</strong> for your will or self-proving affidavit.</p>`
					)}

          ${documentCard(
						'Funding &amp; follow-through',
						statusPill('action', 'Action needed'),
						`<p style="margin:0;font-size:13px;color:#4a5e58;line-height:1.65;">The deed for your primary residence is complete. Use <strong style="color:#2c3e3a;">Complete Your Funding</strong> in the app for banks, retirement, insurance, storage, and trustee notification. If you need individualized help, <a href="${consultHref}" style="color:#1e3a3a;text-decoration:underline;font-weight:500;">book a separate consultation</a>.</p>`
					)}

          <!-- ── Funding your trust ── -->
          ${sectionHeading('Funding your trust', 'A trust only controls what is titled to it')}
          ${paragraph(
						`A trust only controls assets that are properly titled to the trust or coordinated by beneficiary designation. <strong style="color:#2c3e3a;">If assets are not properly funded, retitled, assigned, or coordinated, they may not follow your trust and may require probate.</strong> McDaniel Estate Planning is not responsible for assets you do not fund, retitle, assign, or coordinate with your trust after this limited app engagement is complete.`
					)}
          <tr><td style="padding:10px 0 0 0;"></td></tr>

          ${fundingItem(
						'Follow the in-app checklist',
						`Bank and brokerage accounts, employer plans, IRAs, life insurance, vehicles, and crypto each have their own institution process. The Make Your Trust Work dashboard walks through them with safe reminders — without asking for account numbers or passwords.`
					)}
          ${fundingItem(
						'Real estate',
						`Your primary residence has been deeded into your trust. If you purchase additional real estate later, instruct the realtor and title company to title it in the name of your trust, or seek separate legal advice before closing.`
					)}
          ${fundingItem(
						'Cars',
						`We generally do not recommend retitling cars into your trust. For Texas vehicles, consider a Beneficiary Designation for a Motor Vehicle if you want one — details are in the Vehicles card.`
					)}

          <!-- ── Tell your trustee ── -->
          ${sectionHeading('Critical', 'Tell your trustee — clearly and directly')}
          ${paragraph(
						`Your trustee cannot act if they do not know they have been appointed or cannot access the documents. Please speak to your trustee personally. <strong style="color:#2c3e3a;">A trustee who cannot find the documents may not be able to carry out your plan.</strong>`
					)}
          <tr>
            <td style="padding:6px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #5a9e8f;border-radius:10px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0;font-size:14px;color:#4a5e58;line-height:1.7;font-style:italic;">&ldquo;I have created a trust. If something happens to me, you are the trustee. The document is located [location in your home]. If you need help, contact an estate planning attorney.&rdquo;</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Storage ── -->
          ${sectionHeading('Storage', 'Store your trust safely — but accessibly')}
          ${paragraph(
						`Keep original signed documents in a fireproof, waterproof folder or box, in a location your trustee can access. Do not rely on the app or our firm as your document vault.`
					)}

          <!-- ── Homestead exemption ── -->
          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbecea;border:1px solid #f0ccc6;border-radius:10px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 8px 0;">
                      <span style="font-size:11px;letter-spacing:3px;color:#b23b2e;text-transform:uppercase;font-weight:600;">Do not skip</span>
                    </p>
                    <p style="margin:0 0 12px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Protect your homestead tax exemption</p>
                    <p style="margin:0 0 10px 0;font-size:14px;color:#3a4e48;line-height:1.7;"><strong style="color:#2c3e3a;">Pay particular attention to your homestead tax exemption.</strong> This is one of the most important follow-up steps after your deed is recorded.</p>
                    <p style="margin:0 0 10px 0;font-size:14px;color:#3a4e48;line-height:1.7;">${portalLine} Follow the guide and confirm with the county appraisal district that your homestead exemption remains properly in place.</p>
                    <p style="margin:0;font-size:14px;color:#3a4e48;line-height:1.7;"><strong style="color:#2c3e3a;">Do not assume this happens automatically.</strong> If the appraisal district requests additional documentation, respond promptly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── After death ── -->
          ${sectionHeading('After death', 'No automatic trust administration')}
          ${paragraph(
						`Your trust is designed so your chosen successor trustee can begin administering it using the documents and instructions. McDaniel Estate Planning will not administer your trust after death unless separately hired, and will not automatically represent your trustee, executor, spouse, heirs, or beneficiaries. If your family wants legal help after death, they must separately hire McDaniel Estate Planning or another attorney.`
					)}

          <!-- ── Closing ── -->
          ${sectionHeading('Closing', 'Limited app engagement complete')}
          ${paragraph(
						`<strong style="color:#2c3e3a;">Your limited Good Tree Trust App engagement is now complete.</strong> McDaniel Estate Planning is no longer representing you in this matter unless we sign a separate written engagement.`
					)}
          ${paragraph(
						`We have no ongoing duty to monitor changes in your family, assets, tax situation, state of residence, beneficiary designations, homestead status, or applicable law. If you want future legal help, trust updates, funding help, or review of new assets, you must separately hire McDaniel Estate Planning or another attorney.`
					)}

          <tr>
            <td style="padding:24px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#d4e0db;"><strong style="color:#f5f0eb;">Keep Make Your Trust Work open until every applicable step is done.</strong> Your trust is a powerful step, but it only works properly if you finish the follow-through.</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;"><strong style="color:#f5f0eb;">Review your estate plan</strong> after major life events — marriage, divorce, birth of a child, significant changes in assets, relocation to another state, a death in the family, or major changes to beneficiary designations.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#7a8e88;line-height:1.65;font-style:italic;">May Allah make this an enduring amanah for you and your family.</p>
            </td>
          </tr>
`;

	return amanaEmailDocument(`Your trust is complete — ${siteName}`, mainRows);
}

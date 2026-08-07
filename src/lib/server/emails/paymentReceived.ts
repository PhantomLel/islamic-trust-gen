import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';
import { formatJabalDonation, jabalFoundationUrl } from '$lib/config';

export type PaymentPlanId = 'full' | 'discounted';

export type PaymentReceivedEmailInput = {
	trustId: number;
	selectedPlan: PaymentPlanId;
	deedRetrievalRequested: boolean;
	/** Stripe `amount_total` in cents; omit if unknown */
	amountTotalCents?: number | null;
	continueUrl: string;
	/** Trust preparation fee actually charged, in whole USD (excludes the deed add-on). Drives the Jabal Foundation giving-program figure below — always derived live, never hardcoded. */
	trustFeeAmountUsd: number;
};

function planTitle(_plan: PaymentPlanId): string {
	return 'Trust preparation fee';
}

function planDescription(_plan: PaymentPlanId): string {
	return 'You paid the full trust preparation fee. Continue the questionnaire to complete your Islamic estate plan.';
}

export function paymentReceivedEmail(input: PaymentReceivedEmailInput): string {
	const href = escapeHtmlAttr(input.continueUrl);
	const continueText = escapeHtmlText(input.continueUrl);
	const planName = escapeHtmlText(planTitle(input.selectedPlan));
	const planDetail = escapeHtmlText(planDescription(input.selectedPlan));
	const trustRef = escapeHtmlText(`Trust #${input.trustId}`);

	const amountRow =
		input.amountTotalCents != null && input.amountTotalCents >= 0
			? `<tr>
            <td style="padding:14px 0 0 0;border-top:1px solid #ece5db;">
              <p style="margin:0;font-size:13px;color:#3a4e48;line-height:1.6;"><span style="color:#7a8e88;">Amount charged</span> &nbsp;&middot;&nbsp; <strong style="color:#1e3a3a;">${escapeHtmlText(`$${(input.amountTotalCents / 100).toFixed(2)}`)}</strong></p>
            </td>
          </tr>`
			: '';

	const deedRow = input.deedRetrievalRequested
		? `<tr>
            <td style="padding:10px 0 0 0;">
              <p style="margin:0;font-size:13px;color:#3a4e48;line-height:1.6;"><span style="color:#7a8e88;">Add-on</span> &nbsp;&middot;&nbsp; <strong style="color:#1e3a3a;">House deed retrieval (county records)</strong></p>
            </td>
          </tr>`
		: '';

	const receiptRows = [amountRow, deedRow].filter(Boolean).join('');
	const receiptSection = receiptRows
		? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
              ${receiptRows}
            </table>`
		: '';

	const donationAmountText = escapeHtmlText(formatJabalDonation(input.trustFeeAmountUsd));
	const jabalHref = escapeHtmlAttr(jabalFoundationUrl);

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">Payment received — thank you</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">
                Assalamu Alaikum. We have received your payment and unlocked the next part of your Islamic estate plan. ${trustRef} is ready for you to continue.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your order</p>
              <p style="margin:0 0 20px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Plan &amp; receipt</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Plan you chose</p>
                    <p style="margin:0 0 10px 0;font-size:16px;font-weight:600;color:#1e3a3a;">${planName}</p>
                    <p style="margin:0;font-size:14px;color:#3a4e48;line-height:1.7;">${planDetail}</p>
                    ${receiptSection}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your purchase gives back</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;border-radius:10px;border:1px solid #e2dbd3;margin-top:14px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-size:14px;color:#1e3a3a;line-height:1.7;">
                      As part of your purchase today, <strong>${donationAmountText}</strong> — 5% of your plan — was donated to Jabal Foundation's Legacy Waqf, which funds orphan development and ongoing meal distribution. Leonard serves as Secretary of Jabal's board and personally oversees how these funds are used.
                    </p>
                    <p style="margin:14px 0 0 0;font-size:13px;">
                      <a href="${jabalHref}" style="color:#5a9e8f;text-decoration:underline;">Learn more about Jabal Foundation →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 0 24px;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Next step</p>
              <p style="margin:0 0 16px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Continue your questionnaire</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#3a4e48;line-height:1.7;">
                Pick up where you left off. The remaining questions gather the details we need to draft your documents.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <a href="${href}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">Continue your trust</a>
                    <p style="margin:18px 0 6px 0;font-size:12px;color:#8a9a94;">If the button does not work, copy and paste this link:</p>
                    <p style="margin:0;word-break:break-all;font-size:12px;color:#5a7a70;">${continueText}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#7a8e88;line-height:1.65;font-style:italic;">May Allah make this an enduring amanah for you and your family.</p>
            </td>
          </tr>
`;

	return amanaEmailDocument('Payment received', mainRows);
}

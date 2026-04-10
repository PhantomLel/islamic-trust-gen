import { amanaEmailDocument, escapeHtmlAttr, escapeHtmlText } from './layout';

export type PaymentPlanId = 'full' | 'discounted';

export type PaymentReceivedEmailInput = {
	trustId: number;
	selectedPlan: PaymentPlanId;
	deedRetrievalRequested: boolean;
	/** Stripe `amount_total` in cents; omit if unknown */
	amountTotalCents?: number | null;
	continueUrl: string;
};

function planTitle(plan: PaymentPlanId): string {
	return plan === 'full' ? 'Option A — Pay in full' : 'Option B — Pay with wasiyyah pledge';
}

function planDescription(plan: PaymentPlanId): string {
	return plan === 'full'
		? 'You paid the full trust preparation fee. If you elect a qualifying charitable bequest later, the applicable refund will be handled per your intake.'
		: 'You selected the wasiyyah pledge rate. Your discounted price is confirmed when you complete your charitable bequest election in the questionnaire.';
}

export function paymentReceivedEmail(input: PaymentReceivedEmailInput): string {
	const href = escapeHtmlAttr(input.continueUrl);
	const planName = escapeHtmlText(planTitle(input.selectedPlan));
	const planDetail = escapeHtmlText(planDescription(input.selectedPlan));
	const trustRef = escapeHtmlText(`Trust #${input.trustId}`);

	const amountRow =
		input.amountTotalCents != null && input.amountTotalCents >= 0
			? `<tr>
            <td style="padding:0 0 12px 0;">
              <p style="margin:0;font-size:14px;color:#3a4e48;"><strong style="color:#1e3a3a;">Amount charged</strong> — ${escapeHtmlText(`$${(input.amountTotalCents / 100).toFixed(2)}`)}</p>
            </td>
          </tr>`
			: '';

	const deedRow = input.deedRetrievalRequested
		? `<tr>
            <td style="padding:0;">
              <p style="margin:0;font-size:14px;color:#3a4e48;"><strong style="color:#1e3a3a;">Add-on</strong> — House deed retrieval (county records)</p>
            </td>
          </tr>`
		: '';

	const receiptRows = [amountRow, deedRow].filter(Boolean).join('');
	const receiptSection = receiptRows
		? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2dbd3;">
                      <tr>
                        <td style="padding:16px 0 0 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            ${receiptRows}
                          </table>
                        </td>
                      </tr>
                    </table>`
		: '';

	const mainRows = `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">Payment received — thank you</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">
                Assalamu Alaikum. We have received your payment and unlocked the next part of your Islamic estate plan. ${trustRef} is ready for you to continue.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 0 24px;border-top:1px solid #d4cdc4;">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Your order</p>
              <p style="margin:0 0 16px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">Plan &amp; receipt</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">Plan you chose</p>
                    <p style="margin:0 0 10px 0;font-size:16px;font-weight:600;color:#1e3a3a;">${planName}</p>
                    <p style="margin:0 0 18px 0;font-size:14px;color:#3a4e48;line-height:1.65;">${planDetail}</p>
                    ${receiptSection}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#d4e0db;">
                      <strong style="color:#f5f0eb;">Next step</strong> — Continue your questionnaire where you left off. The remaining questions gather the details we need to draft your documents.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                      <tr>
                        <td style="border-radius:8px;background:#5a9e8f;">
                          <a href="${href}" style="display:inline-block;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;">Continue your trust</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 32px 24px;">
              <p style="margin:0;font-size:12px;color:#8a9a94;text-align:center;">If the button does not work, open this link: <span style="color:#5a7a70;word-break:break-all;">${escapeHtmlText(input.continueUrl)}</span></p>
            </td>
          </tr>
`;

	return amanaEmailDocument('Payment received', mainRows);
}

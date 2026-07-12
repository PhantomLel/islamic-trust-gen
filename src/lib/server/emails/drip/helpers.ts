import { escapeHtmlAttr, escapeHtmlText } from '../layout';

/** Drip hero row: greeting + subtitle. */
export function dripHero(greeting: string, subtitle: string): string {
	return `
          <tr>
            <td style="padding:40px 24px 12px 24px;text-align:center;">
              <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:26px;font-weight:500;color:#1e3a3a;line-height:1.3;">${escapeHtmlText(greeting)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 32px 24px;text-align:center;">
              <p style="margin:0;max-width:540px;margin-left:auto;margin-right:auto;color:#4a5e58;font-size:15px;line-height:1.7;">${escapeHtmlText(subtitle)}</p>
            </td>
          </tr>`;
}

/** Body section with optional eyebrow and title. */
export function dripSection(opts: {
	eyebrow?: string;
	title?: string;
	bodyHtml: string;
	borderTop?: boolean;
}): string {
	const border = opts.borderTop !== false ? 'border-top:1px solid #d4cdc4;' : '';
	const eyebrow = opts.eyebrow
		? `<p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#5a9e8f;text-transform:uppercase;font-weight:600;">${escapeHtmlText(opts.eyebrow)}</p>`
		: '';
	const title = opts.title
		? `<p style="margin:0 0 16px 0;font-family:'Lora',Georgia,serif;font-size:19px;font-weight:500;color:#1e3a3a;">${escapeHtmlText(opts.title)}</p>`
		: '';
	return `
          <tr>
            <td style="padding:32px 24px 0 24px;${border}">
              ${eyebrow}
              ${title}
              ${opts.bodyHtml}
            </td>
          </tr>`;
}

/** CTA card: primary button + optional secondary links. */
export function dripCtaCard(opts: {
	primaryLabel: string;
	primaryUrl: string;
	secondaryLinks?: { label: string; url: string }[];
}): string {
	const primaryHref = escapeHtmlAttr(opts.primaryUrl);
	const primaryLabel = escapeHtmlText(opts.primaryLabel);
	const secondaryHtml = (opts.secondaryLinks ?? [])
		.map(
			(l) =>
				`<p style="margin:10px 0 0 0;font-size:13px;"><a href="${escapeHtmlAttr(l.url)}" style="color:#1e3a3a;text-decoration:underline;">${escapeHtmlText(l.label)}</a></p>`,
		)
		.join('');
	return `
          <tr>
            <td style="padding:32px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2dbd3;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <a href="${primaryHref}" style="display:inline-block;background:#1e3a3a;color:#f5f0eb;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">${primaryLabel}</a>
                    ${secondaryHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/** Dark closing dua row. */
export function dripClosing(text: string): string {
	return `
          <tr>
            <td style="padding:32px 24px 32px 24px;">
              <p style="margin:0;font-size:14px;font-style:italic;color:#5a7a70;text-align:center;line-height:1.7;">${escapeHtmlText(text)}</p>
            </td>
          </tr>`;
}

/** Plain body paragraph row. */
export function dripBody(paragraphs: string[]): string {
	const html = paragraphs
		.map(
			(p) =>
				`<p style="margin:0 0 16px 0;font-size:15px;color:#3a4e48;line-height:1.8;">${escapeHtmlText(p)}</p>`,
		)
		.join('');
	return `
          <tr>
            <td style="padding:0 24px 0 24px;">
              ${html}
            </td>
          </tr>`;
}

/** Dark callout card (important/urgent info). */
export function dripDarkCallout(eyebrow: string, bodyHtml: string): string {
	return `
          <tr>
            <td style="padding:32px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">${escapeHtmlText(eyebrow)}</p>
                    <div style="font-size:14px;line-height:1.7;color:#d4e0db;">${bodyHtml}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/** Bullet list with emerald dot markers. */
export function dripBullets(items: string[]): string {
	const rows = items
		.map(
			(item) => `
    <tr>
      <td style="vertical-align:top;padding:0 12px 10px 0;width:16px;"><span style="display:inline-block;width:6px;height:6px;background:#5a9e8f;border-radius:50%;margin-top:8px;"></span></td>
      <td style="vertical-align:top;padding:0 0 10px 0;font-size:14px;color:#3a4e48;line-height:1.7;">${escapeHtmlText(item)}</td>
    </tr>`,
		)
		.join('');
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows}</table>`;
}

import { renderProductTokens } from '$lib/config';

/** Approved KB text at serve time: product tokens and legacy GoodTree naming only. */
export function renderKbText(text: string | null | undefined): string {
	if (!text) return '';
	const withTokens = text.replace(/\bGood\s*Tree\b/gi, '{{productNameShort}}');
	return renderProductTokens(withTokens);
}

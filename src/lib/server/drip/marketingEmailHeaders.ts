/** RFC 2369 / RFC 8058 headers for one-click unsubscribe in Gmail, Yahoo, etc. */
export function listUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
	const url = unsubscribeUrl.trim();
	return {
		'List-Unsubscribe': `<${url}>`,
		'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
	};
}

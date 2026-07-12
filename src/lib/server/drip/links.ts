import { consultationBookingUrl } from '$lib/config';
import type { SequenceName } from './sequences';

/** Build a tracked URL with UTM params for drip emails. */
export function trackUrl(
	base: string,
	opts: { campaign: SequenceName; content: string; source?: string; medium?: string },
): string {
	const url = new URL(base);
	url.searchParams.set('utm_source', opts.source ?? 'drip');
	url.searchParams.set('utm_medium', opts.medium ?? 'email');
	url.searchParams.set('utm_campaign', opts.campaign);
	url.searchParams.set('utm_content', opts.content);
	return url.toString();
}

export type DripLinks = {
	quizUrl: string;
	trustUrl: string;
	willUrl: string;
	consultUrl: string;
	continueUrl: string;
	unsubscribeUrl: string;
};

export function buildLinks(opts: {
	origin: string;
	sequence: SequenceName;
	emailKey: string;
	unsubscribeToken: string;
	/** Trust ID for deep-linking into app (app_started sequence). */
	trustId?: number | null;
}): DripLinks {
	const { origin, sequence, emailKey, unsubscribeToken, trustId } = opts;
	const tag = { campaign: sequence, content: emailKey };

	const continueBase =
		trustId
			? `${origin}/create-trust/${trustId}`
			: `${origin}/trust`;

	return {
		quizUrl: trackUrl(`${origin}/which-plan`, tag),
		trustUrl: trackUrl(`${origin}/trust`, tag),
		willUrl: trackUrl(`${origin}/free-islamic-will`, tag),
		consultUrl: trackUrl(consultationBookingUrl, tag),
		continueUrl: trackUrl(continueBase, tag),
		unsubscribeUrl: `${origin}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
	};
}

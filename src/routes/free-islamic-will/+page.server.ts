import { error } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';
import {
	AcknowledgmentRequiredError,
	assertAcknowledgmentComplete,
	assertWillComplete,
	claimPendingFreeWills,
	getLatestFreeWill,
	IncompleteWillError,
	savePendingFreeWill,
	saveFreeWillForUser,
	type SaveFreeWillInput,
} from '$lib/server/freeWill';
import {
	getEmailFlags,
	emailFlagLabels,
	freeWillOfferLadder,
	isWillComplete,
	requiresCommunityPropertyAcknowledgment,
	toWillResponses,
} from '$lib/free-will/logic';
import { isAcknowledgmentComplete, type AcknowledgmentData } from '$lib/free-will/acknowledgment';
import { renderFreeWill } from '$lib/server/documents/renderWill';
import { saveGeneratedWillDocx } from '$lib/server/documents/storage';
import { freeWillReadyEmailV2, type FreeWillReadyV2Offer } from '$lib/server/emails/freeWillReadyV2';
import { trackUrl } from '$lib/server/drip/links';
import { consultationBookingUrl, defaultPrepFee, formatUsd } from '$lib/config';
import { stateName, type WillResponse } from '$lib/free-will/config';
import { enrollLead } from '$lib/server/drip/enroll';

const WILL_DOC_KIND = 'free-will';

type WillDownload = { url: string; filename: string };

const OFFER_CARD_META: Record<'goodtree-trust' | 'legacy-plan', Omit<FreeWillReadyV2Offer, 'href'>> = {
	'goodtree-trust': {
		title: 'GoodTree Trust',
		tagline: 'Build an attorney-backed Islamic living trust online \u2014 designed to implement the Islamic shares more completely, keep your family out of probate court, and guide you through signing and funding.',
		priceLine: `${formatUsd(defaultPrepFee)} flat fee.`,
		variant: 'app',
	},
	'legacy-plan': {
		title: 'Legacy Plan',
		tagline: 'Full-service estate planning designed personally by your attorney.',
		priceLine: 'From $3,500.',
		variant: 'premium',
	},
};

/**
 * Resolve the A2 upsell ladder into absolute, UTM-tracked offer cards.
 * `utmSource` is the visitor's first-touch source once the A7 groundwork
 * ticket lands (marketing_lead/free_will UTM columns); until then it falls
 * back to a generic transactional source so links remain trackable.
 */
function resolveOffersForEmail(
	offerKeys: ('goodtree-trust' | 'legacy-plan')[],
	utmSource: string,
): FreeWillReadyV2Offer[] {
	const origin = (env.ORIGIN ?? '').replace(/\/$/, '');
	const tag = { campaign: 'will_delivery' as const, source: utmSource };
	return offerKeys.map((key) => {
		const meta = OFFER_CARD_META[key];
		const base = key === 'goodtree-trust' ? (origin ? `${origin}/trust` : '/trust') : (origin ? `${origin}/plans` : '/plans');
		return { ...meta, href: trackUrl(base, tag) };
	});
}

/** Email the finished will to the user with the document attached. Never throws. */
async function emailWill(opts: {
	to: string;
	name: string;
	input: SaveFreeWillInput;
	buffer: Buffer;
	filename: string;
}): Promise<void> {
	if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !opts.to) return;
	try {
		const responses = toWillResponses(opts.input.responses);
		const firstName = opts.name.split(' ')[0] ?? opts.name;
		const flagLines = getEmailFlags(responses).map((f) => emailFlagLabels[f]);
		// Original masjid/campaign attribution (A7 groundwork), falling back to a
		// generic transactional source when no first touch was ever captured.
		const utmSource = opts.input.utmSource ?? 'transactional';
		const offers = resolveOffersForEmail(freeWillOfferLadder(responses), utmSource);

		const resend = new Resend(env.RESEND_API_KEY);
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to: opts.to,
			subject: `Your free Islamic will is ready, ${firstName}`,
			html: freeWillReadyEmailV2({
				firstName,
				stateName: stateName(opts.input.state),
				stateCode: opts.input.state,
				filename: opts.filename,
				marriedCommunityPropertyState: requiresCommunityPropertyAcknowledgment(responses),
				flagLines,
				offers,
				consultUrl: trackUrl(consultationBookingUrl, { campaign: 'will_delivery', source: utmSource }),
			}),
			attachments: [{ filename: opts.filename, content: opts.buffer }],
		});
	} catch (err) {
		console.error('Failed to email free will document', err);
	}
}

/**
 * Generate the will document, upload it to UploadThing, record it on the
 * submission, and email it to the user with the file attached. Returns the
 * download info, or null when generation isn't possible yet (e.g. a state whose
 * template hasn't shipped). Never throws so that a render failure can't block
 * saving the user's answers.
 */
async function generateWillDownload(
	willId: number,
	name: string,
	email: string,
	input: SaveFreeWillInput,
): Promise<WillDownload | null> {
	if (!isWillComplete(toWillResponses(input.responses))) {
		console.error('Skipped free will generation: responses incomplete', { willId });
		return null;
	}

	// A6: server-side gate — generation refuses to run for a situation that
	// requires an acknowledgment checkbox (e.g. married-TX) without one stored,
	// so the gate cannot be bypassed by posting the save action directly.
	if (!isAcknowledgmentComplete(toWillResponses(input.responses), input.acknowledgmentData)) {
		console.error('Skipped free will generation: acknowledgment missing', { willId });
		return null;
	}

	try {
		const { buffer, filename } = await renderFreeWill({
			id: willId,
			responses: input.responses,
			user: { name },
		});
		const file = await saveGeneratedWillDocx({
			freeWillId: willId,
			kind: WILL_DOC_KIND,
			buffer,
			filename,
		});
		await emailWill({ to: email, name, input, buffer, filename });

		// Enroll in Free Will drip (start at Email 2 — Email 1 is the transactional will).
		enrollLead({
			email,
			firstName: name.split(' ')[0] ?? name,
			sequence: 'free_will_lead',
			leadType: 'free_will',
			source: input.utmSource ?? 'free_will',
		}).catch((err) => console.error('[drip] Free will enroll failed:', err));

		return { url: file.url, filename: file.filename };
	} catch (err) {
		console.error('Failed to generate free will document', err);
		return null;
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null, savedWill: null };
	}

	// Pull any pre-signup submission into this account.
	await claimPendingFreeWills(locals.user.id, locals.user.email);
	const latest = await getLatestFreeWill(locals.user.id);

	const generated = latest?.generated_files?.find((f) => f.kind === WILL_DOC_KIND) ?? null;
	let willDownload: WillDownload | null = generated
		? { url: generated.url, filename: generated.filename }
		: null;

	// Pending submissions are saved before sign-in without generating a document.
	// Generate from the stored DB row so returning users don't depend on localStorage.
	if (!willDownload && latest?.complete && latest.responses) {
		willDownload = await generateWillDownload(
			latest.id,
			locals.user.name ?? latest.name ?? '',
			locals.user.email,
			{
				responses: latest.responses as WillResponse[],
				state: latest.state,
				legalMode: latest.legalMode ?? 'self-help',
				tags: latest.tags ?? [],
				recommendedPlan: latest.recommendedPlan,
				reviewReminders: latest.reviewReminders,
				acknowledgmentData: latest.acknowledgmentData,
				utmSource: latest.utmSource,
				utmMedium: latest.utmMedium,
				utmCampaign: latest.utmCampaign,
			},
		);
	}

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
		},
		// A4 — includes the full answer set so "Edit my answers" can restore
		// state on a device where localStorage doesn't already have it (e.g. a
		// different browser, or after a magic-link/OAuth return).
		savedWill: latest
			? {
					id: latest.id,
					complete: latest.complete,
					recommendedPlan: latest.recommendedPlan,
					responses: (latest.responses as WillResponse[]) ?? [],
					state: latest.state,
					legalMode: latest.legalMode ?? 'self-help',
					tags: latest.tags ?? [],
					reviewReminders: latest.reviewReminders,
					acknowledgmentData: latest.acknowledgmentData,
				}
			: null,
		willDownload,
	};
};

function parseSaveInput(form: FormData): {
	name: string;
	email: string;
	input: SaveFreeWillInput;
	/** A4 — id of the will being edited, or null to save as a new one. */
	willId: number | null;
} {
	const responsesRaw = form.get('responses');
	const tagsRaw = form.get('tags');
	if (typeof responsesRaw !== 'string') throw error(400, 'Missing responses');

	let responses: WillResponse[];
	let tags: string[];
	try {
		responses = JSON.parse(responsesRaw) as WillResponse[];
		tags = typeof tagsRaw === 'string' ? (JSON.parse(tagsRaw) as string[]) : [];
	} catch {
		throw error(400, 'Invalid payload');
	}
	if (!Array.isArray(responses)) throw error(400, 'Invalid responses');

	try {
		assertWillComplete(responses);
	} catch (e) {
		if (e instanceof IncompleteWillError) {
			throw error(400, 'Please complete all required questions before saving');
		}
		throw e;
	}

	const acknowledgmentDataRaw = form.get('acknowledgmentData');
	let acknowledgmentData: AcknowledgmentData | null = null;
	if (typeof acknowledgmentDataRaw === 'string' && acknowledgmentDataRaw) {
		try {
			acknowledgmentData = JSON.parse(acknowledgmentDataRaw) as AcknowledgmentData;
		} catch {
			throw error(400, 'Invalid acknowledgment payload');
		}
	}

	try {
		assertAcknowledgmentComplete(responses, acknowledgmentData);
	} catch (e) {
		if (e instanceof AcknowledgmentRequiredError) {
			throw error(400, 'Please accept the required acknowledgments before continuing');
		}
		throw e;
	}

	const state = typeof form.get('state') === 'string' ? (form.get('state') as string) : null;
	const legalMode = typeof form.get('legalMode') === 'string' ? (form.get('legalMode') as string) : 'self-help';
	const recommendedPlan =
		typeof form.get('recommendedPlan') === 'string' && form.get('recommendedPlan')
			? (form.get('recommendedPlan') as string)
			: null;

	const willIdRaw = form.get('willId');
	const willId =
		typeof willIdRaw === 'string' && willIdRaw && Number.isFinite(Number(willIdRaw))
			? Number(willIdRaw)
			: null;

	return {
		name: typeof form.get('name') === 'string' ? (form.get('name') as string).trim() : '',
		email: typeof form.get('email') === 'string' ? (form.get('email') as string).trim() : '',
		willId,
		input: {
			responses,
			state,
			legalMode,
			tags: Array.isArray(tags) ? tags : [],
			recommendedPlan,
			reviewReminders: form.get('reviewReminders') === 'true',
			acknowledgmentData,
			utmSource: typeof form.get('utmSource') === 'string' ? (form.get('utmSource') as string) || null : null,
			utmMedium: typeof form.get('utmMedium') === 'string' ? (form.get('utmMedium') as string) || null : null,
			utmCampaign: typeof form.get('utmCampaign') === 'string' ? (form.get('utmCampaign') as string) || null : null,
		},
	};
}

export const actions: Actions = {
	/** Persist directly to the signed-in user's account, then generate the will. */
	saveAuthed: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Not authenticated');
		const { input, willId } = parseSaveInput(await request.formData());
		const { id } = await saveFreeWillForUser(
			locals.user.id,
			locals.user.name,
			locals.user.email,
			input,
			willId,
		);
		const download = await generateWillDownload(id, locals.user.name, locals.user.email, input);
		return { saved: true, willId: id, willDownload: download };
	},

	/** Persist a pending submission keyed by email; claimed after the user signs in. */
	savePending: async ({ request }) => {
		const { name, email, input } = parseSaveInput(await request.formData());
		if (!email || !email.includes('@')) throw error(400, 'A valid email is required');
		if (!name) throw error(400, 'A name is required');
		const { id } = await savePendingFreeWill(name, email, input);
		return { saved: true, willId: id };
	},
};

import { error, type Cookies } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';
import {
	AcknowledgmentRequiredError,
	assertAcknowledgmentComplete,
	assertWillComplete,
	assertWillSaveAllowed,
	claimPendingFreeWills,
	getLatestFreeWill,
	IncompleteWillError,
	NotHandledWillError,
	savePendingFreeWill,
	saveFreeWillForUser,
	type SaveFreeWillInput,
} from '$lib/server/freeWill';
import { FREE_WILL_ENABLED_KEY, getBooleanSetting } from '$lib/server/settings';
import { FREE_WILL_LEGAL_MODE } from '$lib/free-will/logic';
import { isWillComplete, toWillResponses } from '$lib/free-will/logic';
import { isAcknowledgmentComplete, type AcknowledgmentData } from '$lib/free-will/acknowledgment';
import { render } from '$lib/server/documents/willPdf/render';
import { saveGeneratedWillFile } from '$lib/server/documents/storage';
import { freeWillReadyEmailV2 } from '$lib/server/emails/freeWillReadyV2';
import { attributionCodeFromCookies } from '$lib/attribution';
import { stateName, type WillResponse } from '$lib/free-will/config';
import { enrollLead } from '$lib/server/drip/enroll';

const WILL_DOC_KIND = 'free-will';

type WillDownload = { url: string; filename: string };

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
		const firstName = opts.name.split(' ')[0] ?? opts.name;
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
		const { buffer, filename } = await render({
			id: willId,
			responses: input.responses,
			user: { name },
		});
		const file = await saveGeneratedWillFile({
			freeWillId: willId,
			kind: WILL_DOC_KIND,
			buffer,
			filename,
		});
		await emailWill({ to: email, name, input, buffer, filename });

		// Marketing list: only when the visitor ticked the (unchecked-by-default)
		// box. Service mail above does not depend on it (spec v3 §4.3).
		if (input.marketingConsent) {
			enrollLead({
				email,
				firstName: name.split(' ')[0] ?? name,
				sequence: 'free_will_lead',
				leadType: 'free_will',
				source: 'free_will',
				attributionCode: input.attributionCode ?? null,
				marketingConsent: true,
			}).catch((err) => console.error('[drip] Free will enroll failed:', err));
		}

		return { url: file.url, filename: file.filename };
	} catch (err) {
		console.error('Failed to generate free will document', err);
		return null;
	}
}

async function assertFreeWillEnabled(): Promise<void> {
	const enabled = await getBooleanSetting(FREE_WILL_ENABLED_KEY, true);
	if (!enabled) throw error(503, 'The free Islamic will is temporarily unavailable.');
}

export const load: PageServerLoad = async ({ locals }) => {
	const freeWillEnabled = await getBooleanSetting(FREE_WILL_ENABLED_KEY, true);
	if (!locals.user) {
		return { user: null, savedWill: null, freeWillEnabled };
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
				attributionCode: latest.attributionCode,
				marketingConsent: latest.marketingConsent,
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
		freeWillEnabled,
	};
};

function parseSaveInput(form: FormData, cookies: Cookies): {
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
			throw error(400, 'Please accept the required notice before continuing');
		}
		throw e;
	}

	try {
		assertWillSaveAllowed(responses);
	} catch (e) {
		if (e instanceof NotHandledWillError) {
			throw error(400, 'This situation is not handled by the free will tool');
		}
		throw e;
	}

	try {
		assertWillComplete(responses);
	} catch (e) {
		if (e instanceof IncompleteWillError) {
			throw error(400, 'Please complete all required questions before saving');
		}
		throw e;
	}

	const state = typeof form.get('state') === 'string' ? (form.get('state') as string) : null;
	const legalMode = FREE_WILL_LEGAL_MODE;
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
			attributionCode: attributionCodeFromCookies(cookies),
			marketingConsent: form.get('marketingConsent') === 'true',
		},
	};
}

export const actions: Actions = {
	/** Persist directly to the signed-in user's account, then generate the will. */
	saveAuthed: async ({ request, locals, cookies }) => {
		await assertFreeWillEnabled();
		if (!locals.user) throw error(401, 'Not authenticated');
		const { input, willId } = parseSaveInput(await request.formData(), cookies);
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
	savePending: async ({ request, cookies }) => {
		await assertFreeWillEnabled();
		const { name, email, input } = parseSaveInput(await request.formData(), cookies);
		if (!email || !email.includes('@')) throw error(400, 'A valid email is required');
		if (!name) throw error(400, 'A name is required');
		const { id } = await savePendingFreeWill(name, email, input);
		const download = await generateWillDownload(id, name, email, input);
		return { saved: true, willId: id, willDownload: download };
	},

	setFreeWillEnabled: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');
		const form = await request.formData();
		const enabled = form.get('enabled') === 'true';
		const { setSetting } = await import('$lib/server/settings');
		await setSetting(FREE_WILL_ENABLED_KEY, enabled ? 'true' : 'false', locals.user.id);
		return { freeWillEnabled: enabled };
	},
};

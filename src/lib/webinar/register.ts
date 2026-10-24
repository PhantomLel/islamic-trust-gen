import { usStates } from '$lib/free-will/config';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_CODES = new Set(usStates.map((s) => s.code));

export type RegistrationInput = {
	name: string;
	email: string;
	state: string;
	marketingConsent: boolean;
	honeypot: string;
	attributionCode: string | null;
};

export type RegistrationRow = {
	name: string;
	email: string;
	state: string;
	marketingConsent: boolean;
	marketingConsentAt: Date | null;
	attributionCode: string | null;
};

export class DuplicateRegistration extends Error {
	constructor() {
		super('duplicate');
		this.name = 'DuplicateRegistration';
	}
}

export type RegistrationStore = {
	findByEmail(webinarId: number, email: string): Promise<{ id: number } | null>;
	insert(webinarId: number, row: RegistrationRow): Promise<number>;
};

export type RegistrationResult =
	| { ok: true; id: number; row: RegistrationRow }
	| { ok: false; reason: 'honeypot' }
	| { ok: false; reason: 'duplicate' }
	| { ok: false; reason: 'invalid'; message: string };

export type ParsedRegistration =
	| { ok: true; row: RegistrationRow }
	| { ok: false; reason: 'honeypot' }
	| { ok: false; reason: 'invalid'; message: string };

export function parseRegistration(input: RegistrationInput): ParsedRegistration {
	if (input.honeypot.trim()) return { ok: false, reason: 'honeypot' };
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();
	const state = input.state.trim().toUpperCase();
	if (!name || name.length > 200) return { ok: false, reason: 'invalid', message: 'Enter your name.' };
	if (!EMAIL.test(email) || email.length > 320) return { ok: false, reason: 'invalid', message: 'Enter a valid email address.' };
	if (!STATE_CODES.has(state)) return { ok: false, reason: 'invalid', message: 'Choose a state.' };
	const code = (input.attributionCode ?? '').trim();
	return {
		ok: true,
		row: {
			name,
			email,
			state,
			marketingConsent: input.marketingConsent,
			marketingConsentAt: input.marketingConsent ? new Date() : null,
			attributionCode: code || null,
		},
	};
}

export async function registerForWebinar(
	store: RegistrationStore,
	webinarId: number,
	input: RegistrationInput,
): Promise<RegistrationResult> {
	const parsed = parseRegistration(input);
	if (!parsed.ok) return parsed;
	const existing = await store.findByEmail(webinarId, parsed.row.email);
	if (existing) return { ok: false, reason: 'duplicate' };
	try {
		const id = await store.insert(webinarId, parsed.row);
		return { ok: true, id, row: parsed.row };
	} catch (err) {
		if (err instanceof DuplicateRegistration) return { ok: false, reason: 'duplicate' };
		throw err;
	}
}

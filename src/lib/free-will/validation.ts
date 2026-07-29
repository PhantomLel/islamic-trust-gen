/** Ticket B4 — executors and guardians must have at least first + last name. */
export function isFullLegalName(name: string): boolean {
	return name.trim().split(/\s+/).filter(Boolean).length >= 2;
}

export const fullLegalNameHint =
	'Please enter a full legal name (first and last, as it should appear on your will).';

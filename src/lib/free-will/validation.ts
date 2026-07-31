/** Ticket B4 — executors and guardians must have at least first + last name. */
export function isFullLegalName(name: string): boolean {
	return name.trim().split(/\s+/).filter(Boolean).length >= 2;
}

export const fullLegalNameHint =
	'Please enter a full legal name (first and last, as it should appear on your will).';

/** C6 — collapse whitespace and dedupe accidental repeated name segments. */
export function normalizePersonName(name: string): string {
	let normalized = name.trim().replace(/\s+/g, ' ');
	if (!normalized) return '';

	// "First LastFirst Last" or "A B A B" style duplicates.
	const words = normalized.split(' ');
	if (words.length >= 2 && words.length % 2 === 0) {
		const half = words.length / 2;
		const first = words.slice(0, half).join(' ');
		const second = words.slice(half).join(' ');
		if (first === second) return first;
	}

	// Concatenated duplicate without a space boundary.
	if (normalized.length >= 6) {
		for (let len = Math.floor(normalized.length / 2); len >= 3; len--) {
			const head = normalized.slice(0, len);
			const tail = normalized.slice(len);
			if (head === tail) return head;
		}
	}

	return normalized;
}

export type RepEntryLike = {
	fullName?: string;
	relationship?: string;
};

export function isEmptyRepEntry(entry: RepEntryLike | null | undefined): boolean {
	if (!entry) return true;
	return !entry.fullName?.trim() && !entry.relationship?.trim();
}

/** C1 — a filled representative/guardian slot with a valid full legal name. */
export function isCompleteRepEntry(entry: RepEntryLike | null | undefined): boolean {
	if (!entry) return false;
	const name = entry.fullName?.trim() ?? '';
	const rel = entry.relationship?.trim() ?? '';
	return isFullLegalName(name) && rel.length > 0;
}

/** Started but incomplete (blocks Next). */
export function isPartialRepEntry(entry: RepEntryLike | null | undefined): boolean {
	if (!entry || isEmptyRepEntry(entry)) return false;
	return !isCompleteRepEntry(entry);
}

import { isCompleteRepEntry, isEmptyRepEntry, isPartialRepEntry, type RepEntryLike } from './validation';

/** C1 — first slot required; optional backup slots must be empty or fully complete. */
export function validateRepSlots(entries: RepEntryLike[], requiredCount: number): boolean {
	if (entries.length < requiredCount) return false;
	for (let i = 0; i < requiredCount; i++) {
		if (!isCompleteRepEntry(entries[i])) return false;
	}
	for (let i = requiredCount; i < entries.length; i++) {
		const entry = entries[i];
		if (isEmptyRepEntry(entry)) continue;
		if (!isCompleteRepEntry(entry)) return false;
	}
	return true;
}

export function getRepSlotValidationMessage(
	entries: RepEntryLike[],
	labels: { role: string; ordinals: string[]; requiredCount: number },
): string | null {
	if (entries.length < labels.requiredCount) {
		return `Please name your ${labels.role.toLowerCase()}.`;
	}
	for (let i = 0; i < labels.requiredCount; i++) {
		const entry = entries[i];
		if (isPartialRepEntry(entry) || isEmptyRepEntry(entry)) {
			return `Please enter the full legal name and relationship for your ${labels.ordinals[i] ?? `${i + 1}st`} ${labels.role.toLowerCase()}.`;
		}
		if (!isCompleteRepEntry(entry)) {
			return `${labels.ordinals[i] ?? 'Primary'} ${labels.role.toLowerCase()} needs a full legal name (first and last).`;
		}
	}
	for (let i = labels.requiredCount; i < entries.length; i++) {
		if (isPartialRepEntry(entries[i])) {
			return `Finish the backup ${labels.role.toLowerCase()} details or clear the fields to continue.`;
		}
	}
	return null;
}

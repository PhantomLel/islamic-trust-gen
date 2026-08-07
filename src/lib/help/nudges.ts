const FIRST_VISIT_STORAGE_KEY = 'gt-help-first-visit-seen';

export const HELP_STEP_IDLE_MS = 2 * 60 * 1000;

function readSeenSteps(): Set<string> {
	if (typeof localStorage === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(FIRST_VISIT_STORAGE_KEY);
		if (!raw) return new Set();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((k): k is string => typeof k === 'string'));
	} catch {
		return new Set();
	}
}

export function hasSeenHelpStep(stepKey: string): boolean {
	return readSeenSteps().has(stepKey);
}

export function markHelpStepSeen(stepKey: string): void {
	if (typeof localStorage === 'undefined') return;
	const seen = readSeenSteps();
	seen.add(stepKey);
	localStorage.setItem(FIRST_VISIT_STORAGE_KEY, JSON.stringify([...seen]));
}

import type { NamedHeir } from '$lib/config';

/** One row per named heir for docxtemplater `{#heirsTable}` / `{#husbandHeirs}` loops. */
export type HeirTableRow = {
	heirName: string;
	heirRelationship: string;
	heirShare: string;
};

export function formatToday(): string {
	return new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

export function fractionLabel(f: { numerator: number; denominator: number } | unknown): string {
	if (f && typeof f === 'object' && 'numerator' in f && 'denominator' in f) {
		const { numerator, denominator } = f as { numerator: number; denominator: number };
		if (denominator === 1) return `${numerator}`;
		const pct = Math.round((numerator / denominator) * 100 * 100) / 100;
		return `${numerator}/${denominator} (~${pct}%)`;
	}
	return String(f ?? '');
}

export function flattenNamedHeirs(named: NamedHeir[] | undefined): HeirTableRow[] {
	if (!named) return [];
	const rows: HeirTableRow[] = [];
	for (const h of named) {
		const names = h.names && h.names.length > 0 ? h.names : Array.from({ length: h.count }, () => '');
		const perPersonLabel = fractionLabel(h.perPersonShare);
		for (const name of names) {
			rows.push({ heirName: name, heirRelationship: h.label, heirShare: perPersonLabel });
		}
	}
	return rows;
}

/** Son and daughter names from the heirs calculator, in display order. */
export function listChildNames(named: NamedHeir[] | undefined): string[] {
	return (named ?? [])
		.filter((h) => h.heirType === 'son' || h.heirType === 'daughter')
		.flatMap((h) => h.names.map((n) => n.trim()).filter((n) => n.length > 0));
}

/** Comma-separated list of son and daughter names, e.g. "John Smith, Jane Smith, and Bob Smith". */
export function formatChildrenList(named: NamedHeir[] | undefined): string {
	const names = listChildNames(named);

	if (names.length === 0) return '';
	if (names.length === 1) return names[0];
	if (names.length === 2) return `${names[0]} and ${names[1]}`;
	return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function parentStatusLabel(alive: boolean | undefined): string {
	if (alive === true) return 'living';
	if (alive === false) return 'deceased';
	return 'unknown';
}

/** Parents with living status, e.g. "John Smith (living) and Jane Smith (deceased)". */
export function formatParentsList(opts: {
	fatherName?: string;
	fatherAlive?: boolean;
	motherName?: string;
	motherAlive?: boolean;
}): string {
	const entries: string[] = [];

	const fatherName = opts.fatherName?.trim();
	if (fatherName) {
		entries.push(`${fatherName} (${parentStatusLabel(opts.fatherAlive)})`);
	}

	const motherName = opts.motherName?.trim();
	if (motherName) {
		entries.push(`${motherName} (${parentStatusLabel(opts.motherAlive)})`);
	}

	if (entries.length === 0) return '';
	if (entries.length === 1) return entries[0];
	if (entries.length === 2) return `${entries[0]} and ${entries[1]}`;
	return `${entries.slice(0, -1).join(', ')}, and ${entries[entries.length - 1]}`;
}

/**
 * A single parent's name with a status suffix, for the v2 will template's
 * "My parents are: {{FATHER_NAME_AND_STATUS}} and {{MOTHER_NAME_AND_STATUS}}."
 * sentence. Unlike `formatParentsList`, silence means alive — the suffix only
 * ever appears for a confirmed-deceased parent, matching the master's
 * `{{(deceased) if applicable}}` instruction. Returns '' when there is no name.
 */
export function formatParentNameAndStatus(
	name: string | undefined,
	alive: boolean | undefined,
): string {
	const trimmed = name?.trim();
	if (!trimmed) return '';
	return alive === false ? `${trimmed} (deceased)` : trimmed;
}

function fractionOnly(f: { numerator: number; denominator: number } | unknown): string {
	if (f && typeof f === 'object' && 'numerator' in f && 'denominator' in f) {
		const { numerator, denominator } = f as { numerator: number; denominator: number };
		return denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
	}
	return '';
}

function percentOnly(f: { numerator: number; denominator: number } | unknown): string {
	if (f && typeof f === 'object' && 'numerator' in f && 'denominator' in f) {
		const { numerator, denominator } = f as { numerator: number; denominator: number };
		const pct = Math.round((numerator / denominator) * 100 * 100) / 100;
		return `${pct}%`;
	}
	return '';
}

/** One row per named heir, with fraction and percentage as separate columns. */
export type HeirTableRowV2 = {
	name: string;
	relationship: string;
	fraction: string;
	percent: string;
};

/**
 * Same source as `flattenNamedHeirs`, but for the v2 Islamic Inheritance
 * Schedule table: `FRACTION` and `PERCENT` are separate columns (rather than
 * one combined "1/8 (~12.5%)" string) and rows with no name are dropped
 * instead of printing a blank row (ticket C6's document half).
 */
export function flattenNamedHeirsV2(named: NamedHeir[] | undefined): HeirTableRowV2[] {
	if (!named) return [];
	const rows: HeirTableRowV2[] = [];
	for (const h of named) {
		for (const name of h.names ?? []) {
			const trimmed = name.trim();
			if (!trimmed) continue;
			rows.push({
				name: trimmed,
				relationship: h.label,
				fraction: fractionOnly(h.perPersonShare),
				percent: percentOnly(h.perPersonShare),
			});
		}
	}
	return rows;
}

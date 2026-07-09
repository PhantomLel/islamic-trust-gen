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

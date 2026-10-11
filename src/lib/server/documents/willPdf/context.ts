import { buildCharityNameMap } from '$lib/charityLookup';
import {
	resolveWillWasiyyahRecipientName,
	type ExecutorEntry,
	type GuardianEntry,
	type WillResponseValue,
	type WillWasiyyahResponse,
} from '$lib/free-will/config';
import { getAddress, getNamedHeirs, normalizeWillPersonName } from '$lib/free-will/logic';
import { formatChildrenList } from '../documentFormatters';

export type ShareFraction = { numerator: number; denominator: number };

export type WillPdfHeir = {
	name: string;
	relationship: string;
	fraction: string;
	/** Approximate percent to 2 decimal places, without a percent sign. */
	percent: string;
};

export type WillPdfGift = {
	recipient: string;
	percent: string;
	ein: string;
	notes: string;
};

export type WillPdfContext = {
	id: number;
	stateCode: 'TX' | 'CA';
	testatorFullName: string;
	streetAddress: string;
	city: string;
	zip: string;
	maritalStatusDisplay: string;
	married: boolean;
	spouseName: string;
	childrenNamesJoined: string | null;
	fatherName: string;
	fatherStatus: 'living' | 'deceased';
	motherName: string;
	motherStatus: 'living' | 'deceased';
	executor1: string;
	executor2: string;
	executor3: string | null;
	hasMinorChildren: boolean;
	guardian1: string | null;
	guardian2: string | null;
	gifts: WillPdfGift[];
	heirs: WillPdfHeir[];
};

type FreeWillLike = {
	id: number;
	responses: { id: string; response: unknown }[] | null;
};

function gcd(a: number, b: number): number {
	let x = Math.abs(a);
	let y = Math.abs(b);
	while (y !== 0) {
		const next = x % y;
		x = y;
		y = next;
	}
	return x || 1;
}

/**
 * Runtime guard. The printed heir shares must sum to exactly 1.
 * If they do not, throw and generate nothing.
 */
export function assertSharesSumToOne(heirs: ShareFraction[]): void {
	let numerator = 0;
	let denominator = 1;
	for (const heir of heirs) {
		if (!Number.isInteger(heir.numerator) || !Number.isInteger(heir.denominator) || heir.denominator <= 0) {
			throw new Error('Heir share is not a valid fraction');
		}
		numerator = numerator * heir.denominator + heir.numerator * denominator;
		denominator *= heir.denominator;
		const divisor = gcd(numerator, denominator);
		numerator /= divisor;
		denominator /= divisor;
	}
	if (numerator !== denominator) {
		throw new Error(`Heir shares sum to ${numerator}/${denominator}, not 1`);
	}
}

function toRecord(rows: FreeWillLike['responses']): Record<string, WillResponseValue> {
	return Object.fromEntries((rows ?? []).map((row) => [row.id, row.response as WillResponseValue]));
}

function parentStatus(alive: unknown, label: string): 'living' | 'deceased' {
	if (alive === true) return 'living';
	if (alive === false) return 'deceased';
	throw new Error(`${label} living status is missing`);
}

function roleLine(fullName: string, relationship: string): string {
	return `${normalizeWillPersonName(fullName)}, my ${relationship.trim()}`;
}

function namedRole(entry: { fullName?: string; relationship?: string } | undefined): string | null {
	const name = entry?.fullName?.trim() ?? '';
	if (!name) return null;
	return roleLine(name, entry?.relationship ?? '');
}

function fractionLabel(share: ShareFraction): string {
	return share.denominator === 1 ? `${share.numerator}` : `${share.numerator}/${share.denominator}`;
}

function percentLabel(share: ShareFraction): string {
	return ((share.numerator / share.denominator) * 100).toFixed(2);
}

function giftsFrom(responses: Record<string, WillResponseValue>): WillPdfGift[] {
	const raw = responses['wasiyyah'];
	if (!raw || typeof raw !== 'object' || !('interested' in raw) || !Array.isArray((raw as WillWasiyyahResponse).bequests)) {
		return [];
	}
	const wasiyyah = raw as WillWasiyyahResponse;
	if (!wasiyyah.interested) return [];
	const charityMap = buildCharityNameMap();
	return wasiyyah.bequests
		.filter((bequest) => bequest.percentage > 0)
		.map((bequest) => ({
			recipient: resolveWillWasiyyahRecipientName(bequest, charityMap),
			percent: String(bequest.percentage),
			ein: bequest.customEin?.trim() ?? '',
			notes: '',
		}))
		.filter((gift) => gift.recipient.length > 0);
}

function heirsFrom(responses: Record<string, WillResponseValue>): WillPdfHeir[] {
	const rows: WillPdfHeir[] = [];
	const shares: ShareFraction[] = [];
	for (const heir of getNamedHeirs(responses)) {
		const share = heir.perPersonShare;
		if (!share || share.numerator === 0) continue;
		for (const name of heir.names ?? []) {
			const trimmed = normalizeWillPersonName(name);
			if (!trimmed) continue;
			rows.push({
				name: trimmed,
				relationship: heir.label,
				fraction: fractionLabel(share),
				percent: percentLabel(share),
			});
			shares.push({ numerator: share.numerator, denominator: share.denominator });
		}
	}
	assertSharesSumToOne(shares);
	return rows;
}

/** Map stored free-will answers onto the TPL merge fields. */
export function buildWillPdfContext(will: FreeWillLike): WillPdfContext {
	const responses = toRecord(will.responses);
	const stateCode = responses['state'];
	if (stateCode !== 'TX' && stateCode !== 'CA') {
		throw new Error(`No will PDF for state "${typeof stateCode === 'string' ? stateCode : 'unknown'}"`);
	}

	const address = getAddress(responses);
	const children = formatChildrenList(getNamedHeirs(responses));
	const executors = Array.isArray(responses['executors']) ? (responses['executors'] as ExecutorEntry[]) : [];
	const executor1 = namedRole(executors[0]);
	const executor2 = namedRole(executors[1]);
	if (!executor1 || !executor2) throw new Error('Two executors are required');

	const hasMinorChildren = responses['minor_children'] === true;
	const guardians = Array.isArray(responses['guardians']) ? (responses['guardians'] as GuardianEntry[]) : [];
	const guardian1 = hasMinorChildren ? namedRole(guardians[0]) : null;
	const guardian2 = hasMinorChildren ? namedRole(guardians[1]) : null;
	if (hasMinorChildren && (!guardian1 || !guardian2)) throw new Error('Two guardians are required');

	const maritalStatus = typeof responses['marital_status'] === 'string' ? responses['marital_status'] : '';

	return {
		id: will.id,
		stateCode,
		testatorFullName: normalizeWillPersonName(
			typeof responses['full_legal_name'] === 'string' ? responses['full_legal_name'] : '',
		),
		streetAddress: [address?.street, address?.unit].filter((part) => part && part.trim()).join(', '),
		city: address?.city?.trim() ?? '',
		zip: address?.zip?.trim() ?? '',
		maritalStatusDisplay: maritalStatus,
		married: maritalStatus === 'Married',
		spouseName: normalizeWillPersonName(typeof responses['spouse_name'] === 'string' ? responses['spouse_name'] : ''),
		childrenNamesJoined: children.length > 0 ? children : null,
		fatherName: normalizeWillPersonName(typeof responses['father_name'] === 'string' ? responses['father_name'] : ''),
		fatherStatus: parentStatus(responses['father_alive'], 'Father'),
		motherName: normalizeWillPersonName(typeof responses['mother_name'] === 'string' ? responses['mother_name'] : ''),
		motherStatus: parentStatus(responses['mother_alive'], 'Mother'),
		executor1,
		executor2,
		executor3: namedRole(executors[2]),
		hasMinorChildren,
		guardian1,
		guardian2,
		gifts: giftsFrom(responses),
		heirs: heirsFrom(responses),
	};
}

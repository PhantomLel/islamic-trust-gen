import {
	type HeirsCalculatorResponse,
	type PersonalDataResponse,
	type PourOverRepresentativeEntry,
} from '$lib/config';
import { formatToday, listChildNames } from './documentFormatters';

export type PourOverWillRole = 'husband' | 'wife';

/**
 * Shape that `pour_over_will_texas.docx` consumes. One context per spouse; the
 * renderer sets `isFemale` and picks the matching personal-representative and
 * guardian responses.
 */
export type PourOverWillContext = {
	fullName: string;
	county: string;
	spouse: string;
	isFemale: boolean;
	hasChildren: boolean;
	childrenCount: number;
	children: string[];
	trustName: string;
	date: string;
	firstRepresentative: string;
	representatives: string[];
	guardians: string[];
};

type ResponseEntry = { id: string; response: unknown };

type TrustLike = {
	responses: ResponseEntry[] | null;
};

function getResponse<T = unknown>(trust: TrustLike, id: string): T | undefined {
	const entry = (trust.responses ?? []).find((r) => r.id === id);
	return entry ? (entry.response as T) : undefined;
}

function representativeNames(entries: PourOverRepresentativeEntry[] | undefined): string[] {
	return (entries ?? [])
		.map((e) => e.fullName.trim())
		.filter((name) => name.length > 0);
}

function splitFirstRepresentative(names: string[]): {
	firstRepresentative: string;
	representatives: string[];
} {
	if (names.length === 0) {
		return { firstRepresentative: '', representatives: [] };
	}
	return {
		firstRepresentative: names[0],
		representatives: names.slice(1),
	};
}

/**
 * Build the pour-over will context for one spouse from stored trust responses.
 */
export function buildPourOverWillContext(
	trust: TrustLike,
	role: PourOverWillRole,
): PourOverWillContext {
	const husband = getResponse<PersonalDataResponse>(trust, 'husband-data');
	const wife = getResponse<PersonalDataResponse>(trust, 'wife-data');
	const trustName = getResponse<string>(trust, 'trust-name') ?? '';

	const isHusband = role === 'husband';
	const testator = isHusband ? husband : wife;
	const spouse = isHusband ? wife : husband;

	const heirs = getResponse<HeirsCalculatorResponse>(
		trust,
		isHusband ? 'husband-heirs' : 'wife-heirs',
	);
	const children = listChildNames(heirs?.namedHeirs);

	const personalReps = representativeNames(
		getResponse<PourOverRepresentativeEntry[]>(
			trust,
			isHusband ? 'husband-personal-representatives' : 'wife-personal-representatives',
		),
	);
	const { firstRepresentative, representatives } = splitFirstRepresentative(personalReps);

	const guardians = representativeNames(
		getResponse<PourOverRepresentativeEntry[]>(
			trust,
			isHusband ? 'husband-guardians' : 'wife-guardians',
		),
	);

	return {
		fullName: testator?.name ?? '',
		county: testator?.county ?? '',
		spouse: spouse?.name ?? '',
		isFemale: !isHusband,
		hasChildren: children.length > 0,
		childrenCount: children.length,
		children,
		trustName,
		date: formatToday(),
		firstRepresentative,
		representatives,
		guardians,
	};
}

import {
	assetRangeLabel,
	assetRanges,
	stateName,
	type ExecutorEntry,
	type GuardianEntry,
	type WillResponseValue,
	resolveWillWasiyyahRecipientName,
	type WillWasiyyahResponse,
} from '$lib/free-will/config';
import { buildCharityNameMap } from '$lib/charityLookup';
import {
	appliesCommunityPropertyClauses,
	communityPropertyClauses,
	communityPropertyWarning,
	computeLeadTags,
	formatAddress,
	getAddress,
	getHeirsResponse,
	getNamedHeirs,
	isCommunityPropertySituation,
	legalMode,
	legalModeDisclaimers,
	normalizeWillPersonName,
	recommendPlan,
	type LeadTag,
	type PlanKey,
} from '$lib/free-will/logic';
import {
	flattenNamedHeirs,
	flattenNamedHeirsV2,
	formatChildrenList,
	formatParentNameAndStatus,
	formatParentsList,
	formatToday,
	type HeirTableRow,
	type HeirTableRowV2,
} from './documentFormatters';

/**
 * Shape that the free Islamic will document template will consume once the PDF
 * template is finalized (pending attorney sign-off — dev brief §12). This mirrors
 * the role of `JointTrustContext` in `buildContext.ts`: a single, fully-resolved
 * object that the renderer can drop straight into a template, with no business
 * logic left in the template layer.
 *
 * No document is generated yet — this is the data contract for that step.
 */
export type WillDocumentContext = {
	testatorName: string;
	testatorAddress: string;
	/** Discrete address parts for the v2 template's `{{STREET_ADDRESS}}, {{CITY}}, Texas, {{ZIP}}` sentence. */
	streetAddress: string;
	city: string;
	zip: string;
	stateName: string;
	stateCode: string;
	county: string;
	willDate: string;

	maritalStatus: string;
	spouseName: string;
	gender: 'male' | 'female';
	/** Comma-separated son and daughter names, e.g. "John Smith, Jane Smith, and Bob Smith". */
	children: string;
	/** Parents with living status, e.g. "John Smith (living) and Jane Smith (deceased)". */
	parents: string;
	/** Single parent name + status, e.g. "John Smith (deceased)" or just "John Smith" if alive. */
	fatherNameAndStatus: string;
	motherNameAndStatus: string;

	/** Personal representatives (executors) - 3 required */
	executors: ExecutorEntry[];
	/** Guardians for minor children - 2 required, only present if minor_children is true */
	guardians: GuardianEntry[];
	/** True when the user answered "yes" to having minor children (gates the v2 template's Section 8). */
	hasMinorChildren: boolean;
	/** True when a second guardian was named (guardians[1] has a name). */
	guardian2Present: boolean;

	/** One row per named heir — same shape as `husbandHeirs` / `wifeHeirs` in the joint trust template. */
	heirsTable: HeirTableRow[];
	/** Same heirs, split into separate fraction/percent columns with empty-name rows dropped (v2 template, ticket C6). */
	heirsTableV2: HeirTableRowV2[];
	distributionNotes: string[];

	/** Legal mode + the exact disclaimer paragraph to print (dev brief §9). */
	legalMode: 'attorney' | 'self-help';
	legalDisclaimer: string;

	/** Community property handling (dev brief §5). */
	isCommunityProperty: boolean;
	communityPropertyWarning: string;
	includeCommunityPropertyClauses: boolean;
	communityPropertyClauses: { title: string; body: string }[];

	/** Estate snapshot (for the cover / summary section). */
	assetRange: string;
	ownsHome: boolean;
	homeStateName: string;

	/** Wasiyyah bequests, if any. */
	hasWasiyyah: boolean;
	wasiyyah: { name: string; ein: string; percentage: number }[];
	/** Same bequests shaped for the v2 template's wasiyyah table row loop. */
	wasiyyahV2: { orgName: string; ein: string; percent: string; notes: string }[];

	/** CRM + routing metadata (not printed, but produced alongside the document). */
	leadTags: LeadTag[];
	recommendedPlan: PlanKey;
	attorneyReviewNote: boolean;
};

function buildWasiyyahList(
	w: WillWasiyyahResponse | null | undefined,
): { name: string; ein: string; percentage: number }[] {
	if (!w || !w.interested || !Array.isArray(w.bequests)) return [];
	const charityMap = buildCharityNameMap();
	return w.bequests
		.filter((b) => b.percentage > 0)
		.map((b) => ({
			name: resolveWillWasiyyahRecipientName(b, charityMap),
			ein: b.customEin?.trim() ?? '',
			percentage: b.percentage,
		}))
		.filter((b) => b.name.length > 0);
}

type ResponseEntry = { id: string; response: unknown };

type FreeWillLike = {
	id: number;
	responses: ResponseEntry[] | null;
};

function toRecord(rows: ResponseEntry[] | null | undefined): Record<string, WillResponseValue> {
	return Object.fromEntries((rows ?? []).map((r) => [r.id, r.response as WillResponseValue]));
}

function normalizeRepEntries<T extends { fullName?: string }>(entries: T[]): T[] {
	return entries.map((entry) => ({
		...entry,
		fullName: normalizeWillPersonName(entry.fullName ?? ''),
	}));
}

/**
 * Build the will document context from a stored free-will submission. Analogous
 * to `buildJointTrustContext` — read responses, run the inheritance calculator,
 * and resolve every field the template needs.
 */
export function buildWillDocumentContext(will: FreeWillLike): WillDocumentContext {
	const responses = toRecord(will.responses);

	const heirsResponse = getHeirsResponse(responses);
	const namedHeirs = getNamedHeirs(responses);
	const heirsTable = flattenNamedHeirs(namedHeirs);

	const stateCode = typeof responses['state'] === 'string' ? responses['state'] : '';
	const county = typeof responses['county'] === 'string' ? responses['county'] : '';
	const homeInDifferentState = responses['home_state'] === true;
	const mode = legalMode(responses);
	const rec = recommendPlan(responses);
	const rangeId = assetRanges.find((r) => r.label === responses['asset_range'])?.id;

	// Extract executors (always 3)
	const executorsRaw = responses['executors'];
	const executors: ExecutorEntry[] = normalizeRepEntries(
		Array.isArray(executorsRaw) && executorsRaw.length === 3
			? (executorsRaw as ExecutorEntry[])
			: [
				{ fullName: '', relationship: '', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
			],
	);

	// Extract guardians (always 2, but only if minor_children is true)
	const guardiansRaw = responses['guardians'];
	const guardians: GuardianEntry[] = normalizeRepEntries(
		Array.isArray(guardiansRaw) && guardiansRaw.length === 2
			? (guardiansRaw as GuardianEntry[])
			: [
				{ fullName: '', relationship: '', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
			],
	);

	// Extract wasiyyah
	const wasiyyahRaw = responses['wasiyyah'];
	const wasiyyah: WillWasiyyahResponse | null =
		wasiyyahRaw &&
		typeof wasiyyahRaw === 'object' &&
		'interested' in wasiyyahRaw &&
		Array.isArray((wasiyyahRaw as any).bequests)
			? (wasiyyahRaw as WillWasiyyahResponse)
			: null;

	const address = getAddress(responses);
	const fatherName = normalizeWillPersonName(
		typeof responses['father_name'] === 'string' ? responses['father_name'] : '',
	);
	const fatherAlive =
		typeof responses['father_alive'] === 'boolean' ? responses['father_alive'] : undefined;
	const motherName = normalizeWillPersonName(
		typeof responses['mother_name'] === 'string' ? responses['mother_name'] : '',
	);
	const motherAlive =
		typeof responses['mother_alive'] === 'boolean' ? responses['mother_alive'] : undefined;

	return {
		testatorName: normalizeWillPersonName(
			typeof responses['full_legal_name'] === 'string' ? responses['full_legal_name'] : '',
		),
		testatorAddress: formatAddress(responses),
		streetAddress: [address?.street, address?.unit].filter((p) => p && p.trim()).join(', '),
		city: address?.city?.trim() ?? '',
		zip: address?.zip?.trim() ?? '',
		stateName: stateName(stateCode),
		stateCode,
		county,
		willDate: formatToday(),

		maritalStatus: typeof responses['marital_status'] === 'string' ? responses['marital_status'] : '',
		spouseName: normalizeWillPersonName(
			typeof responses['spouse_name'] === 'string' ? responses['spouse_name'] : '',
		),
		gender: responses['gender'] === 'Female' ? 'female' : 'male',
		children: formatChildrenList(namedHeirs),
		parents: formatParentsList({ fatherName, fatherAlive, motherName, motherAlive }),
		fatherNameAndStatus: formatParentNameAndStatus(fatherName, fatherAlive),
		motherNameAndStatus: formatParentNameAndStatus(motherName, motherAlive),

		executors,
		guardians,
		hasMinorChildren: responses['minor_children'] === true,
		guardian2Present: guardians[1].fullName.trim().length > 0,

		heirsTable,
		heirsTableV2: flattenNamedHeirsV2(namedHeirs),
		distributionNotes: heirsResponse?.notes ?? [],

		legalMode: mode,
		legalDisclaimer: legalModeDisclaimers[mode],

		isCommunityProperty: isCommunityPropertySituation(responses),
		communityPropertyWarning,
		includeCommunityPropertyClauses: appliesCommunityPropertyClauses(responses),
		communityPropertyClauses: appliesCommunityPropertyClauses(responses)
			? communityPropertyClauses
			: [],

		assetRange: assetRangeLabel(rangeId),
		ownsHome: responses['own_home'] === true,
		homeStateName: homeInDifferentState ? 'another state' : '',

		hasWasiyyah: !!(wasiyyah?.interested && wasiyyah.bequests.some((b) => b.percentage > 0)),
		wasiyyah: buildWasiyyahList(wasiyyah),
		wasiyyahV2: buildWasiyyahList(wasiyyah).map((w) => ({
			orgName: w.name,
			ein: w.ein,
			percent: `${w.percentage}%`,
			notes: '',
		})),

		leadTags: computeLeadTags(responses),
		recommendedPlan: rec.plan,
		attorneyReviewNote: rec.attorneyReviewNote,
	};
}

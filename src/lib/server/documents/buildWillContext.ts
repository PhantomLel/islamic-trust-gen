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
import { charities as presetCharities } from '$lib/config';
import {
	appliesCommunityPropertyClauses,
	communityPropertyClauses,
	communityPropertyWarning,
	computeLeadTags,
	formatAddress,
	getHeirsResponse,
	getNamedHeirs,
	isCommunityPropertySituation,
	legalMode,
	legalModeDisclaimers,
	recommendPlan,
	type LeadTag,
	type PlanKey,
} from '$lib/free-will/logic';
import {
	flattenNamedHeirs,
	formatChildrenList,
	formatParentsList,
	formatToday,
	type HeirTableRow,
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

	/** Personal representatives (executors) - 3 required */
	executors: ExecutorEntry[];
	/** Guardians for minor children - 2 required, only present if minor_children is true */
	guardians: GuardianEntry[];

	/** One row per named heir — same shape as `husbandHeirs` / `wifeHeirs` in the joint trust template. */
	heirsTable: HeirTableRow[];
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

	/** CRM + routing metadata (not printed, but produced alongside the document). */
	leadTags: LeadTag[];
	recommendedPlan: PlanKey;
	attorneyReviewNote: boolean;
};

function buildWasiyyahList(
	w: WillWasiyyahResponse | null | undefined,
): { name: string; ein: string; percentage: number }[] {
	if (!w || !w.interested || !Array.isArray(w.bequests)) return [];
	const charityMap = new Map(presetCharities.map((c) => [c.id, c.name]));
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
	const homeStateCode = typeof responses['home_state'] === 'string' ? responses['home_state'] : '';
	const mode = legalMode(responses);
	const rec = recommendPlan(responses);
	const rangeId = assetRanges.find((r) => r.label === responses['asset_range'])?.id;

	// Extract executors (always 3)
	const executorsRaw = responses['executors'];
	const executors: ExecutorEntry[] = Array.isArray(executorsRaw) && executorsRaw.length === 3
		? (executorsRaw as ExecutorEntry[])
		: [
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
		];

	// Extract guardians (always 2, but only if minor_children is true)
	const guardiansRaw = responses['guardians'];
	const guardians: GuardianEntry[] = Array.isArray(guardiansRaw) && guardiansRaw.length === 2
		? (guardiansRaw as GuardianEntry[])
		: [
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
		];

	// Extract wasiyyah
	const wasiyyahRaw = responses['wasiyyah'];
	const wasiyyah: WillWasiyyahResponse | null =
		wasiyyahRaw &&
		typeof wasiyyahRaw === 'object' &&
		'interested' in wasiyyahRaw &&
		Array.isArray((wasiyyahRaw as any).bequests)
			? (wasiyyahRaw as WillWasiyyahResponse)
			: null;

	return {
		testatorName:
			typeof responses['full_legal_name'] === 'string' ? responses['full_legal_name'].trim() : '',
		testatorAddress: formatAddress(responses),
		stateName: stateName(stateCode),
		stateCode,
		county,
		willDate: formatToday(),

		maritalStatus: typeof responses['marital_status'] === 'string' ? responses['marital_status'] : '',
		spouseName:
			typeof responses['spouse_name'] === 'string' ? responses['spouse_name'].trim() : '',
		gender: responses['gender'] === 'Female' ? 'female' : 'male',
		children: formatChildrenList(namedHeirs),
		parents: formatParentsList({
			fatherName: typeof responses['father_name'] === 'string' ? responses['father_name'] : '',
			fatherAlive:
				typeof responses['father_alive'] === 'boolean' ? responses['father_alive'] : undefined,
			motherName: typeof responses['mother_name'] === 'string' ? responses['mother_name'] : '',
			motherAlive:
				typeof responses['mother_alive'] === 'boolean' ? responses['mother_alive'] : undefined,
		}),

		executors,
		guardians,

		heirsTable,
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
		homeStateName: stateName(homeStateCode),

		hasWasiyyah: !!(wasiyyah?.interested && wasiyyah.bequests.some((b) => b.percentage > 0)),
		wasiyyah: buildWasiyyahList(wasiyyah),

		leadTags: computeLeadTags(responses),
		recommendedPlan: rec.plan,
		attorneyReviewNote: rec.attorneyReviewNote,
	};
}

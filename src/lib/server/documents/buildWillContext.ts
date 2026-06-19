import {
	assetRangeLabel,
	assetRanges,
	stateName,
	type WillResponseValue,
} from '$lib/free-will/config';
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
	willDate: string;

	maritalStatus: string;
	spouseName: string;
	gender: 'male' | 'female';
	/** Comma-separated son and daughter names, e.g. "John Smith, Jane Smith, and Bob Smith". */
	children: string;
	/** Parents with living status, e.g. "John Smith (living) and Jane Smith (deceased)". */
	parents: string;

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

	/** CRM + routing metadata (not printed, but produced alongside the document). */
	leadTags: LeadTag[];
	recommendedPlan: PlanKey;
	attorneyReviewNote: boolean;
};

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
export function buildWillDocumentContext(
	will: FreeWillLike,
	testatorName: string,
): WillDocumentContext {
	const responses = toRecord(will.responses);

	const heirsResponse = getHeirsResponse(responses);
	const namedHeirs = getNamedHeirs(responses);
	const heirsTable = flattenNamedHeirs(namedHeirs);

	const stateCode = typeof responses['state'] === 'string' ? responses['state'] : '';
	const homeStateCode = typeof responses['home_state'] === 'string' ? responses['home_state'] : '';
	const mode = legalMode(responses);
	const rec = recommendPlan(responses);
	const rangeId = assetRanges.find((r) => r.label === responses['asset_range'])?.id;

	return {
		testatorName,
		testatorAddress: formatAddress(responses),
		stateName: stateName(stateCode),
		stateCode,
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

		leadTags: computeLeadTags(responses),
		recommendedPlan: rec.plan,
		attorneyReviewNote: rec.attorneyReviewNote,
	};
}

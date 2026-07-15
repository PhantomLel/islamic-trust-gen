import {
	charities as charityCatalog,
	type AssetAllocationEntry,
	type CharitiesResponse,
	type CharityResponse,
	type HebaAssetEntry,
	type HeirsCalculatorResponse,
	type MinorDistributionResponse,
	type NamedHeir,
	type NonCharitableBequestEntry,
	type NonCharitableBequestsResponse,
	type PersonalDataResponse,
	type SeparatePropertyEntry,
	type SeparatePropertyResponse,
	type SuccessorTrusteeEntry,
} from '$lib/config';
import {
	flattenNamedHeirs,
	formatToday,
	fractionLabel,
	type HeirTableRow,
} from './documentFormatters';

/**
 * Shape that the joint trust .docx template consumes. Every key referenced in
 * `joint_template.docx` must be present here (including text fallbacks for any
 * remaining `{:table xxx}` tags, which the renderer rewrites to `{xxxText}`).
 */
export type JointTrustContext = {
	trustName: string;
	trustDate: string;
	husbandFullName: string;
	county: string;
	wifeFullName: string;
	dateOfMarriage: string;
	childrenCount: number;

	isHeba: boolean;
	isAssetAllocation: boolean;

	husbandHeirs: HeirTableRow[];
	wifeHeirs: HeirTableRow[];
	trustees: string[];

	/** True when that spouse has at least one charitable bequest row. */
	hasHusbandCharitable: boolean;
	hasWifeCharitable: boolean;
	/** True when that spouse has at least one non-charitable bequest row. */
	hasHusbandNonCharitable: boolean;
	hasWifeNonCharitable: boolean;

	/** Loop rows for Article Ten bequest tables. */
	husbandCharitable: { charityName: string; percentage: string }[];
	wifeCharitable: { charityName: string; percentage: string }[];
	husbandNonCharitable: { recipientName: string; relationship: string; percentage: string }[];
	wifeNonCharitable: { recipientName: string; relationship: string; percentage: string }[];

	distribution: {
		mode: 'staggered' | 'single-age' | 'age-of-majority' | '';
		firstPercent: number | '';
		firstAge: number | '';
		secondPercent: number | '';
		secondAge: number | '';
		remainderAge: number | '';
		singleDistributionAge: number | '';
	};

	/**
	 * Asset allocation table — only populated when `isAssetAllocation` is true.
	 * Wrap in `{#isAssetAllocation}...{/isAssetAllocation}` in the template.
	 */
	assetAllocation: { assetName: string; accountId: string; owner: string }[];

	/**
	 * Heba asset list — only populated when `isHeba` is true. All assets are
	 * jointly owned, so there is no per-spouse owner column.
	 * Wrap in `{#isHeba}...{/isHeba}` in the template.
	 */
	hebaAssets: { assetName: string; accountId: string }[];

	/** Loop-ready arrays for Schedule A separate-property tables. */
	husbandSeparateProperty: { assetName: string; accountId: string; approximateValue: string }[];
	wifeSeparateProperty: { assetName: string; accountId: string; approximateValue: string }[];

	/** Text fallbacks — used by the {xxxText} scalars that the :table preprocessor emits. */
	heirsTableText: string;
	hebaAssetsText: string;
	husbandSeparatePropertyText: string;
	wifeSeparatePropertyText: string;
};

type ResponseEntry = { id: string; response: unknown };

type TrustLike = {
	id: number;
	responses: ResponseEntry[] | null;
};

function getResponse<T = unknown>(trust: TrustLike, id: string): T | undefined {
	const entry = (trust.responses ?? []).find((r) => r.id === id);
	return entry ? (entry.response as T) : undefined;
}

function formatDate(iso: string | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function countChildren(named: NamedHeir[] | undefined): number {
	if (!named) return 0;
	return named
		.filter((h) => h.heirType === 'son' || h.heirType === 'daughter')
		.reduce((sum, h) => sum + (h.count || 0), 0);
}

function charityName(c: CharityResponse): string {
	if (c.customName) return c.customName;
	return charityCatalog.find((x) => x.id === c.charityId)?.name ?? c.charityId;
}

function bulletList(lines: string[]): string {
	const filtered = lines.filter((l) => l && l.trim().length > 0);
	if (filtered.length === 0) return '';
	return filtered.map((l) => `\u2022 ${l}`).join('\n');
}

function mapCharitableRows(
	list: CharityResponse[] | undefined,
): { charityName: string; percentage: string }[] {
	return (list ?? []).map((c) => ({
		charityName: charityName(c),
		percentage: String(c.percentage ?? ''),
	}));
}

function mapNonCharitableRows(
	list: NonCharitableBequestEntry[] | undefined,
): { recipientName: string; relationship: string; percentage: string }[] {
	return (list ?? []).map((b) => ({
		recipientName: b.recipientName ?? '',
		relationship: b.relationship ?? '',
		percentage: String(b.percentage ?? ''),
	}));
}

function formatHebaAssets(list: HebaAssetEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No assets listed';
	return bulletList(
		list
			.filter((a) => a.assetName && a.assetName.trim().length > 0)
			.map((a) => (a.accountId ? `${a.assetName} \u2014 acct ${a.accountId}` : a.assetName)),
	);
}

function formatSeparateProperty(list: SeparatePropertyEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No separate property';
	return bulletList(
		list.map((p) => {
			const pieces = [p.assetName];
			if (p.accountId) pieces.push(`acct ${p.accountId}`);
			if (p.approximateValue) pieces.push(`~${p.approximateValue}`);
			return pieces.join(' \u2014 ');
		}),
	);
}

function formatOwnerLabel(spouse: string | undefined): string {
	if (spouse === 'husband') return 'Husband';
	if (spouse === 'wife') return 'Wife';
	if (spouse === '50-50') return '50/50';
	return spouse?.trim() ? spouse : '';
}

function formatHeirsTable(named: NamedHeir[] | undefined): string {
	if (!named || named.length === 0) return 'No heirs';
	const lines: string[] = [];
	for (const h of named) {
		const perLabel = fractionLabel(h.perPersonShare);
		const totalLabel = fractionLabel(h.totalShare);
		const names = h.names && h.names.length > 0 ? h.names : Array.from({ length: h.count }, () => '');
		for (const name of names) {
			const display = name?.trim() ? name : `[${h.label}]`;
			lines.push(`${display} \u2014 ${h.label} \u2014 share: ${perLabel} (group total: ${totalLabel})`);
		}
	}
	return bulletList(lines);
}

export function buildJointTrustContext(trust: TrustLike): JointTrustContext {
	const husband = getResponse<PersonalDataResponse>(trust, 'husband-data');
	const wife = getResponse<PersonalDataResponse>(trust, 'wife-data');
	const marriageDate = getResponse<string>(trust, 'marriage-date');
	const husbandHeirs = getResponse<HeirsCalculatorResponse>(trust, 'husband-heirs');
	const wifeHeirs = getResponse<HeirsCalculatorResponse>(trust, 'wife-heirs');
	const ownership = getResponse<string>(trust, 'ownership-allocation');
	const assetAllocationEntries = getResponse<AssetAllocationEntry[]>(trust, 'assets') ?? [];
	const hebaAssetEntries = getResponse<HebaAssetEntry[]>(trust, 'heba-assets') ?? [];
	const successors = getResponse<SuccessorTrusteeEntry[]>(trust, 'successor-trustees') ?? [];
	const charitiesResp = getResponse<CharitiesResponse>(trust, 'charities');
	const bequestsResp = getResponse<NonCharitableBequestsResponse>(trust, 'non-charitable-bequests');
	const sepProp = getResponse<SeparatePropertyResponse>(trust, 'separate-property');
	const minor = getResponse<MinorDistributionResponse>(trust, 'minor-distribution');
	const trustName = getResponse<string>(trust, 'trust-name') ?? '';

	const husbandCharitable = mapCharitableRows(
		charitiesResp?.husbandInterested ? charitiesResp.husbandCharities : undefined,
	);
	const wifeCharitable = mapCharitableRows(
		charitiesResp?.wifeInterested ? charitiesResp.wifeCharities : undefined,
	);
	const husbandNonCharitable = mapNonCharitableRows(
		bequestsResp?.husbandInterested ? bequestsResp.husbandBequests : undefined,
	);
	const wifeNonCharitable = mapNonCharitableRows(
		bequestsResp?.wifeInterested ? bequestsResp.wifeBequests : undefined,
	);

	const distribution: JointTrustContext['distribution'] = {
		mode: minor?.mode ?? '',
		firstPercent: minor?.mode === 'staggered' ? minor.firstPercent : '',
		firstAge: minor?.mode === 'staggered' ? minor.firstAge : '',
		secondPercent: minor?.mode === 'staggered' ? minor.secondPercent : '',
		secondAge: minor?.mode === 'staggered' ? minor.secondAge : '',
		remainderAge: minor?.mode === 'staggered' ? minor.remainderAge : '',
		singleDistributionAge: minor?.mode === 'single-age' ? minor.age : '',
	};

	return {
		trustName,
		trustDate: formatToday(),
		husbandFullName: husband?.name ?? '',
		county: husband?.county ?? '',
		wifeFullName: wife?.name ?? '',
		dateOfMarriage: formatDate(marriageDate),
		childrenCount: countChildren(husbandHeirs?.namedHeirs),

		isHeba: ownership === 'heba',
		isAssetAllocation: ownership === 'assets',

		husbandHeirs: flattenNamedHeirs(husbandHeirs?.namedHeirs),
		wifeHeirs: flattenNamedHeirs(wifeHeirs?.namedHeirs),
		trustees: successors.map((s) => s.fullName).filter(Boolean),

		hasHusbandCharitable: husbandCharitable.length > 0,
		hasWifeCharitable: wifeCharitable.length > 0,
		hasHusbandNonCharitable: husbandNonCharitable.length > 0,
		hasWifeNonCharitable: wifeNonCharitable.length > 0,

		husbandCharitable,
		wifeCharitable,
		husbandNonCharitable,
		wifeNonCharitable,

		distribution,

		assetAllocation: assetAllocationEntries
			.filter((a) => (a.assetName ?? '').trim().length > 0)
			.map((a) => ({
				assetName: a.assetName ?? '',
				accountId: a.accountId ?? '',
				owner: formatOwnerLabel(a.spouse),
			})),

		hebaAssets: hebaAssetEntries
			.filter((a) => (a.assetName ?? '').trim().length > 0)
			.map((a) => ({
				assetName: a.assetName ?? '',
				accountId: a.accountId ?? '',
			})),

		husbandSeparateProperty: (sepProp?.husband ?? [])
			.filter((p) => (p.assetName ?? '').trim().length > 0)
			.map((p) => ({
				assetName: p.assetName ?? '',
				accountId: p.accountId ?? '',
				approximateValue: p.approximateValue ?? '',
			})),
		wifeSeparateProperty: (sepProp?.wife ?? [])
			.filter((p) => (p.assetName ?? '').trim().length > 0)
			.map((p) => ({
				assetName: p.assetName ?? '',
				accountId: p.accountId ?? '',
				approximateValue: p.approximateValue ?? '',
			})),

		heirsTableText: formatHeirsTable(husbandHeirs?.namedHeirs ?? wifeHeirs?.namedHeirs),
		hebaAssetsText: formatHebaAssets(hebaAssetEntries),
		husbandSeparatePropertyText: formatSeparateProperty(sepProp?.husband),
		wifeSeparatePropertyText: formatSeparateProperty(sepProp?.wife),
	};
}

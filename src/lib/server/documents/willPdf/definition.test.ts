import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildWillPdfContext } from './context';
import { buildSheetsDefinition, buildWillDefinition, fixedSentences } from './definition';

function fraction(numerator: number, denominator: number) {
	return {
		numerator,
		denominator,
		display: denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`,
		decimal: numerator / denominator,
	};
}

/** v11 fact pattern from the former renderWill.test.ts. */
const v11FactPattern = [
	{ id: 'state', response: 'TX' },
	{ id: 'county', response: 'Harris' },
	{ id: 'full_legal_name', response: 'Ahmad Khan' },
	{ id: 'address', response: { street: '123 Main St', unit: '', city: 'Houston', zip: '77001' } },
	{ id: 'gender', response: 'Male' },
	{ id: 'marital_status', response: 'Married' },
	{ id: 'spouse_name', response: 'Layla Khan' },
	{ id: 'father_alive', response: false },
	{ id: 'father_name', response: 'Yusuf Khan' },
	{ id: 'mother_alive', response: false },
	{ id: 'mother_name', response: 'Amina Khan' },
	{
		id: 'heirs',
		response: {
			verified: true,
			estateInput: {
				decedentGender: 'male',
				spouse: true,
				fatherAlive: false,
				motherAlive: false,
				sons: 1,
				daughters: 1,
				sonsOfSons: 0,
				daughtersOfSons: 0,
				paternalGrandfatherAlive: false,
				paternalGrandmotherAlive: false,
				maternalGrandmotherAlive: false,
				fullBrothers: 0,
				fullSisters: 0,
				paternalHalfBrothers: 0,
				paternalHalfSisters: 0,
				maternalHalfBrothers: 0,
				maternalHalfSisters: 0,
				fullPaternalUncles: 0,
			},
			namedHeirs: [
				{
					heirType: 'wife',
					label: 'Wife',
					count: 1,
					names: ['Layla Khan'],
					totalShare: fraction(1, 8),
					perPersonShare: fraction(1, 8),
					shareType: 'fixed',
					reasons: [],
				},
				{
					heirType: 'son',
					label: 'Son',
					count: 1,
					names: ['Omar Khan'],
					totalShare: fraction(7, 12),
					perPersonShare: fraction(7, 12),
					shareType: 'residuary',
					reasons: [],
				},
				{
					heirType: 'daughter',
					label: 'Daughter',
					count: 1,
					names: ['Sara Khan'],
					totalShare: fraction(7, 24),
					perPersonShare: fraction(7, 24),
					shareType: 'residuary',
					reasons: [],
				},
			],
			blockedHeirs: [],
			awlApplied: false,
			raddApplied: false,
			dhawulArhamNeeded: false,
			notes: [],
		},
	},
	{ id: 'minor_children', response: true },
	{
		id: 'guardians',
		response: [
			{ fullName: 'Azzahra Malik', relationship: 'sister', contact: '' },
			{ fullName: 'Shafiq Rahman', relationship: 'close friend', contact: '' },
		],
	},
	{ id: 'special_needs', response: false },
	{ id: 'blended_family', response: false },
	{ id: 'non_muslim_heirs', response: false },
	{ id: 'own_home', response: true },
	{ id: 'other_real_estate', response: false },
	{ id: 'retirement_accounts', response: true },
	{ id: 'life_insurance', response: true },
	{ id: 'business_ownership', response: false },
	{ id: 'asset_range', response: '$500,000 – $1 million' },
	{
		id: 'executors',
		response: [
			{ fullName: 'Sumayya Ahmed', relationship: 'sister', contact: '' },
			{ fullName: 'Azzahra Malik', relationship: 'sister', contact: '' },
			{ fullName: 'Shafiq Rahman', relationship: 'close friend', contact: '' },
		],
	},
	{ id: 'charity_interest', response: 'yes' },
	{
		id: 'wasiyyah',
		response: {
			interested: true,
			bequests: [{ charityId: 'islamic-center-of-greater-austin-austin', percentage: 5 }],
		},
	},
	{ id: 'avoid_probate', response: 'yes' },
	{ id: 'attorney_review', response: true },
	{ id: 'strict_faraid', response: true },
];

/** No children and no wasiyyah. Father 2/3 + mother 1/3 = 1. */
const noGiftsFactPattern = [
	{ id: 'state', response: 'TX' },
	{ id: 'county', response: 'Harris' },
	{ id: 'full_legal_name', response: 'Ahmad Khan' },
	{ id: 'address', response: { street: '123 Main St', unit: '', city: 'Houston', zip: '77001' } },
	{ id: 'gender', response: 'Male' },
	{ id: 'marital_status', response: 'Single' },
	{ id: 'father_alive', response: true },
	{ id: 'father_name', response: 'Yusuf Khan' },
	{ id: 'mother_alive', response: true },
	{ id: 'mother_name', response: 'Amina Khan' },
	{
		id: 'heirs',
		response: {
			verified: true,
			namedHeirs: [
				{
					heirType: 'father',
					label: 'Father',
					count: 1,
					names: ['Yusuf Khan'],
					totalShare: fraction(2, 3),
					perPersonShare: fraction(2, 3),
					shareType: 'residuary',
					reasons: [],
				},
				{
					heirType: 'mother',
					label: 'Mother',
					count: 1,
					names: ['Amina Khan'],
					totalShare: fraction(1, 3),
					perPersonShare: fraction(1, 3),
					shareType: 'fixed',
					reasons: [],
				},
			],
			blockedHeirs: [],
			notes: [],
		},
	},
	{ id: 'minor_children', response: false },
	{
		id: 'executors',
		response: [
			{ fullName: 'Sumayya Ahmed', relationship: 'sister', contact: '' },
			{ fullName: 'Azzahra Malik', relationship: 'sister', contact: '' },
		],
	},
	{ id: 'charity_interest', response: 'no' },
];

const SECTION_TITLES = [
	'Family Information',
	'Executor',
	'Debts, Expenses, and Islamic Obligations',
	'Funeral and Burial Wishes',
	'Wasiyyah',
	'Residuary Estate — Islamic Distribution',
	'Survival',
	'Minor Children and Property for Minors',
	'Digital Assets and Personal Records',
	'Nonprobate Assets and Beneficiary Designations',
	'Community Property',
	'Family Reconciliation',
	'Independent Administration',
	'No Bond',
	'Executor Powers',
	'Islamic Inheritance Schedule',
	'Execution',
	'Witness Attestation',
];

const FILLED_DATE =
	/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:19|20)\d{2}\b/;

function flatten(node: unknown): string {
	if (node == null || typeof node === 'boolean') return '';
	if (typeof node === 'string' || typeof node === 'number') return String(node);
	if (Array.isArray(node)) return node.map((item) => flatten(item)).filter(Boolean).join('\n');
	if (typeof node === 'object') {
		const record = node as Record<string, unknown>;
		if (typeof record.text === 'string') return record.text;
		if (Array.isArray(record.text)) return record.text.map((item) => flatten(item)).join('');
		if (record.stack) return flatten(record.stack);
		if (record.ul) return flatten(record.ul);
		if (record.ol) return flatten(record.ol);
		if (record.columns) return flatten(record.columns);
		if (record.table && typeof record.table === 'object') {
			const body = (record.table as { body?: unknown }).body;
			return flatten(body);
		}
	}
	return '';
}

function flattened(responses: { id: string; response: unknown }[]): string {
	const ctx = buildWillPdfContext({ id: 42, responses });
	return [flatten(buildWillDefinition(ctx).content), flatten(buildSheetsDefinition(ctx).content)].join('\n');
}

function sectionNumbers(text: string, titles: string[]): number[] {
	return titles.map((title) => {
		const match = text.match(new RegExp(`(?:^|\\n)(\\d+)\\. ${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`));
		return match ? Number(match[1]) : -1;
	});
}

function withState(
	rows: { id: string; response: unknown }[],
	state: 'TX' | 'CA',
	name?: string,
) {
	return rows.map((row) => {
		if (row.id === 'state') return { ...row, response: state };
		if (name && row.id === 'full_legal_name') return { ...row, response: name };
		if (state === 'CA' && row.id === 'county') return { ...row, response: 'Alameda' };
		return row;
	});
}

describe('will PDF definition', () => {
	it('flattens a TX and a CA will without merge markers, a doubled county, a draft banner, or a filled date', () => {
		for (const state of ['TX', 'CA'] as const) {
			const name = state === 'CA' ? 'Amīné ʿAlī' : undefined;
			const text = flattened(withState(v11FactPattern, state, name));
			expect(text).not.toContain('{{');
			expect(text).not.toContain('[IF');
			expect(text).not.toContain('County County');
			expect(text).not.toContain('DRAFT');
			expect(text).not.toMatch(FILLED_DATE);
			const titles = state === 'TX' ? [...SECTION_TITLES, 'Self-Proving Affidavit'] : SECTION_TITLES;
			expect(sectionNumbers(text, titles)).toEqual(titles.map((_, index) => index + 1));
			if (state === 'CA') expect(text).toContain('Amīné ʿAlī');
		}
	});

	it('prints the no-wasiyyah sentence and no gift table when there are no gifts', () => {
		const text = flattened(noGiftsFactPattern);
		expect(text).toContain('I make no wasiyyah gifts.');
		expect(text).not.toContain('EIN (charities)');
		expect(text).not.toContain('Share of estate');
	});

	it('omits the notary affidavit in California and includes it in Texas', () => {
		const ca = flattened(withState(v11FactPattern, 'CA', 'Amīné ʿAlī'));
		const tx = flattened(withState(v11FactPattern, 'TX'));
		expect(ca).not.toContain('Notary Public');
		expect(tx).toContain('Before me, the undersigned authority');
		expect(tx).toContain('Notary Public, State of Texas');
		expect(tx).not.toContain('Harris');
	});

	it('copies each fixed sentence from the template spec', () => {
		const spec = readFileSync(join(process.cwd(), 'docs/specs/will-templates-v2.md'), 'utf8').replace(
			/\*\*/g,
			'',
		);
		for (const sentence of fixedSentences) {
			expect(spec, sentence).toContain(sentence);
		}
	});
});

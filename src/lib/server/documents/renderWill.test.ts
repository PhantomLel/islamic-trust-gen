import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderFreeWill } from './renderWill';
import PizZip from 'pizzip';

const texasV2Template = readFileSync(
	join(process.cwd(), 'static', 'templates', 'texas_freewill_v2.docx'),
);

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			if (url.includes('texas_freewill_v2.docx')) {
				return new Response(texasV2Template, { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		}),
	);
});

function fraction(numerator: number, denominator: number) {
	return {
		numerator,
		denominator,
		display: denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`,
		decimal: numerator / denominator,
	};
}

/**
 * The packet's canonical regression fact pattern (dev packet §"Faraid regression
 * test"): married + 1 son + 1 daughter = wife 1/8, son 7/12, daughter 7/24. Both
 * parents are deceased here so those three heirs are the whole estate (1/8 +
 * 7/12 + 7/24 = 1). Also exercises minor children/guardians and a wasiyyah gift
 * so the generated document covers every conditional section in the v2 template.
 */
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

/**
 * Strip XML tags entirely (not to a space) — sentences are built from several
 * adjacent `<w:r>` runs whose own `<w:t>` text already carries any needed
 * spacing (e.g. "My parents are: "), so replacing tags with a space would
 * inject spurious spaces the document itself doesn't have.
 */
function extractPlainText(xml: string): string {
	const body = xml.slice(xml.indexOf('<w:body>'));
	return body
		.replace(/<[^>]+>/g, '')
		.replace(/&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

describe('renderFreeWill (Texas v2)', () => {
	it('renders the v11 fact pattern with every conditional section populated', async () => {
		const { buffer, filename } = await renderFreeWill({ id: 42, responses: v11FactPattern });

		expect(buffer.byteLength).toBeGreaterThan(1000);
		expect(filename).toBe('islamic-will-Ahmad-Khan-42.docx');

		const zip = new PizZip(buffer);
		const xml = zip.file('word/document.xml')!.asText();
		const text = extractPlainText(xml);

		// No unrendered template tags or leaked generator-logic notes.
		expect(xml).not.toContain('{{');
		expect(text).not.toMatch(/Render one row/);
		expect(text).not.toMatch(/omit block if none/);
		expect(text).not.toMatch(/if applicable/);

		// Testator identity and address.
		expect(text).toContain('Ahmad Khan');
		expect(text).toContain('123 Main St');
		expect(text).toContain('Houston');
		expect(text).toContain('77001');
		expect(text).toContain('COUNTY OF Harris');

		// Parents both print with a "(deceased)" suffix, joined by "and".
		expect(text).toContain('My parents are: Yusuf Khan (deceased) and Amina Khan (deceased).');

		// Executors print with full legal name + relationship (ticket B4's document half).
		expect(text).toContain('Sumayya Ahmed, my sister');
		expect(text).toContain('Azzahra Malik, my sister');
		expect(text).toContain('Shafiq Rahman, my close friend');

		// Guardian section (both guardians named).
		expect(text).toContain('I nominate Azzahra Malik, my sister, as guardian');
		expect(text).toContain('If that person cannot serve, I nominate Shafiq Rahman, my close friend');

		// Wasiyyah table renders the bequest.
		expect(text).toContain('Islamic Center of Greater Austin');
		expect(text).toContain('5%');
		expect(text).not.toContain('I make no wasiyyah gifts under this Will.');

		// Islamic Inheritance Schedule reproduces the packet's regression fractions.
		expect(text).toContain('Layla Khan');
		expect(text).toContain('1/8');
		expect(text).toContain('12.5%');
		expect(text).toContain('Omar Khan');
		expect(text).toContain('7/12');
		expect(text).toContain('58.33%');
		expect(text).toContain('Sara Khan');
		expect(text).toContain('7/24');
		expect(text).toContain('29.17%');

		// Cover notice and signing instructions carried over from the master verbatim.
		expect(text).toContain('Use two disinterested adult witnesses');
		expect(text).toContain('self-proving affidavit');

		// No empty rows: exactly one header + one data row in the wasiyyah table,
		// and one header + three data rows in the heirs table (ticket C6's document half).
		const wasiyyahTableStart = xml.lastIndexOf('<w:tbl>', xml.indexOf('Organization'));
		const wasiyyahTableXml = xml.slice(wasiyyahTableStart, xml.indexOf('</w:tbl>', wasiyyahTableStart));
		expect((wasiyyahTableXml.match(/<w:tr>/g) ?? []).length).toBe(2);
		const heirsTableStart = xml.lastIndexOf('<w:tbl>', xml.indexOf('Heir Name'));
		const heirsTableXml = xml.slice(heirsTableStart, xml.indexOf('</w:tbl>', heirsTableStart));
		expect((heirsTableXml.match(/<w:tr>/g) ?? []).length).toBe(4);
	});

	it('omits Section 8 and prints the no-wasiyyah sentence when neither applies', async () => {
		const noExtras = v11FactPattern
			.filter((r) => r.id !== 'minor_children' && r.id !== 'guardians' && r.id !== 'wasiyyah')
			.concat([
				{ id: 'minor_children', response: false },
				{ id: 'charity_interest', response: 'no' },
			]);

		const { buffer } = await renderFreeWill({ id: 43, responses: noExtras });
		const zip = new PizZip(buffer);
		const xml = zip.file('word/document.xml')!.asText();
		const text = extractPlainText(xml);

		expect(xml).not.toContain('{{');
		expect(text).not.toContain('Minor Children and Guardian Nomination');
		expect(text).toContain('I make no wasiyyah gifts under this Will.');
	});
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PizZip from 'pizzip';
import { renderJointTrust } from './renderJointTrust';

const jointTemplate = readFileSync(
	join(process.cwd(), 'static', 'templates', 'joint_template.docx'),
);

beforeEach(() => {
	vi.stubEnv('ORIGIN', 'http://localhost:5173');
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			if (url.includes('joint_template.docx')) {
				return new Response(jointTemplate, { status: 200 });
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

const sampleResponses = [
	{ id: 'husband-data', response: { name: 'Ahmed Khan', dob: '1980-01-01', county: 'Harris' } },
	{ id: 'wife-data', response: { name: 'Fatima Khan', dob: '1982-03-15', county: 'Harris' } },
	{ id: 'marriage-date', response: '2010-06-01' },
	{ id: 'trust-name', response: 'Khan Family Trust' },
	{ id: 'ownership-allocation', response: 'heba' },
	{
		id: 'heba-assets',
		response: [{ assetName: 'Primary residence', accountId: '123 Main St' }],
	},
	{ id: 'trustee-on-first-death', response: 'survivor-serves' },
	{
		id: 'husband-successor-trustees',
		response: [
			{ fullName: 'Omar Ali', relationship: 'brother' },
			{ fullName: 'Sara Malik', relationship: 'sister' },
		],
	},
	{
		id: 'wife-successor-trustees',
		response: [
			{ fullName: 'Layla Ahmed', relationship: 'sister' },
			{ fullName: 'Yusuf Rahman', relationship: 'cousin' },
		],
	},
	{
		id: 'husband-heirs',
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
					names: ['Fatima Khan'],
					totalShare: fraction(1, 8),
					perPersonShare: fraction(1, 8),
					shareType: 'fixed',
					reasons: [],
				},
				{
					heirType: 'son',
					label: 'Son',
					count: 1,
					names: ['Ibrahim Khan'],
					totalShare: fraction(7, 12),
					perPersonShare: fraction(7, 12),
					shareType: 'residuary',
					reasons: [],
				},
				{
					heirType: 'daughter',
					label: 'Daughter',
					count: 1,
					names: ['Maryam Khan'],
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
	{
		id: 'wife-heirs',
		response: {
			verified: true,
			estateInput: {
				decedentGender: 'female',
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
					heirType: 'husband',
					label: 'Husband',
					count: 1,
					names: ['Ahmed Khan'],
					totalShare: fraction(1, 4),
					perPersonShare: fraction(1, 4),
					shareType: 'fixed',
					reasons: [],
				},
				{
					heirType: 'son',
					label: 'Son',
					count: 1,
					names: ['Ibrahim Khan'],
					totalShare: fraction(1, 2),
					perPersonShare: fraction(1, 2),
					shareType: 'residuary',
					reasons: [],
				},
				{
					heirType: 'daughter',
					label: 'Daughter',
					count: 1,
					names: ['Maryam Khan'],
					totalShare: fraction(1, 4),
					perPersonShare: fraction(1, 4),
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
	{
		id: 'minor-distribution',
		response: {
			mode: 'staggered',
			firstPercent: 25,
			firstAge: 25,
			secondPercent: 25,
			secondAge: 30,
			remainderAge: 35,
		},
	},
	{ id: 'madhab', response: 'hanafi' },
];

describe('renderJointTrust', () => {
	it('renders the normalized joint template without unmerged tags', async () => {
		const { buffer, filename } = await renderJointTrust({
			id: 7,
			responses: sampleResponses,
			user: { name: 'Ahmed Khan' },
		});

		expect(buffer.byteLength).toBeGreaterThan(1000);
		expect(filename).toBe('joint-trust-Ahmed-Khan-7.docx');

		const zip = new PizZip(buffer);
		const xml = zip.file('word/document.xml')!.asText();
		const text = extractPlainText(xml);

		expect(xml).not.toMatch(/\{[#/:^]?[a-zA-Z]/);
		expect(text).toContain('Ahmed Khan');
		expect(text).toContain('Fatima Khan');
		expect(text).toContain('Khan Family Trust');
		expect(text).toContain('muslimlegacyplanning.com/inheritance-calculator');
		expect(text).toContain('Hanafi');
		expect(text).toContain('Primary residence');
		expect(text).toContain('25% of the trust property at age 25');
	});
});

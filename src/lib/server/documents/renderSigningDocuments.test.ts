import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PizZip from 'pizzip';
import { formatTrustTitleForm } from './trustDocumentConstants';
import {
	assertOwnershipElectionSections,
	renderAcknowledgmentOfOwnershipElection,
} from './renderAcknowledgmentOfOwnershipElection';
import { renderCertificationOfTrust } from './renderCertificationOfTrust';
import { renderJointTrust } from './renderJointTrust';

const templatesDir = join(process.cwd(), 'static', 'templates');

const acknowledgmentTemplate = readFileSync(
	join(templatesDir, 'acknowledgment_of_islamic_ownership_election.docx'),
);
const certificationTemplate = readFileSync(join(templatesDir, 'certification_of_trust.docx'));
const jointTemplate = readFileSync(join(templatesDir, 'joint_template.docx'));

beforeEach(() => {
	vi.stubEnv('ORIGIN', 'http://localhost:5173');
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			if (url.includes('acknowledgment_of_islamic_ownership_election.docx')) {
				return new Response(acknowledgmentTemplate, { status: 200 });
			}
			if (url.includes('certification_of_trust.docx')) {
				return new Response(certificationTemplate, { status: 200 });
			}
			if (url.includes('joint_template.docx')) {
				return new Response(jointTemplate, { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		}),
	);
});

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

const baseResponses = [
	{ id: 'husband-data', response: { name: 'Ahmed Khan', dob: '1980-01-01', county: 'Harris' } },
	{ id: 'wife-data', response: { name: 'Fatima Khan', dob: '1982-03-15', county: 'Harris' } },
	{ id: 'trust-name', response: 'Khan Family Trust' },
];

describe('renderAcknowledgmentOfOwnershipElection', () => {
	it('renders C-1 (heba) variants in Sections 1 and 2 without unmerged tags', async () => {
		const { buffer, filename } = await renderAcknowledgmentOfOwnershipElection({
			id: 9,
			responses: [
				...baseResponses,
				{ id: 'ownership-allocation', response: 'heba' },
				{ id: 'heba-assets', response: [{ assetName: 'Primary residence', accountId: '123' }] },
			],
			user: { name: 'Ahmed Khan' },
		});

		expect(buffer.byteLength).toBeGreaterThan(1000);
		expect(filename).toBe('acknowledgment-islamic-ownership-election-Ahmed-Khan-9.docx');

		const xml = new PizZip(buffer).file('word/document.xml')!.asText();
		const text = extractPlainText(xml);

		expect(xml).not.toMatch(/\{[#/:^]?[a-zA-Z]/);
		expect(text).toContain('Mutual Heba method under Article Three, Section C-1');
		expect(text).not.toContain('Asset Allocation Declaration method under Article Three, Section C-2');
		expect(text).toContain('each of us makes a heba');
		expect(text).not.toContain('Each of us has declared what we believe we Islamically own');
		expect(text).toContain('one hundred eighty (180) days');
		expect(text).toContain('Ahmed Khan, Grantor');
		expect(text).toContain('Fatima Khan, Grantor');
	});

	it('renders C-2 (asset allocation) variants in Sections 1 and 2', async () => {
		const { buffer } = await renderAcknowledgmentOfOwnershipElection({
			id: 10,
			responses: [
				...baseResponses,
				{ id: 'ownership-allocation', response: 'assets' },
				{
					id: 'assets',
					response: [{ assetName: 'Brokerage account', accountId: 'XYZ', spouse: 'husband' }],
				},
			],
		});

		const text = extractPlainText(
			new PizZip(buffer).file('word/document.xml')!.asText(),
		);

		expect(text).toContain('Asset Allocation Declaration method under Article Three, Section C-2');
		expect(text).not.toContain('Mutual Heba method under Article Three, Section C-1');
		expect(text).toContain('Each of us has declared what we believe we Islamically own');
		expect(text).not.toContain('each of us makes a heba');
	});

	it('throws when both election variants would appear in Section 1', () => {
		expect(() =>
			assertOwnershipElectionSections(
				[
					'We have elected the Mutual Heba method under Article Three, Section C-1 of our Trust.',
					'We have elected the Asset Allocation Declaration method under Article Three, Section C-2 of our Trust, as set out in Schedule A.',
					'Under Islamic law, each of us makes a heba — a lifetime gift — of one-half of our interest in all community property to the other.',
				].join(' '),
				true,
			),
		).toThrow(/Section 1 emitted both/);
	});

	it('throws when Sections 1 and 2 have mismatched variants', () => {
		expect(() =>
			assertOwnershipElectionSections(
				[
					'We have elected the Mutual Heba method under Article Three, Section C-1 of our Trust.',
					'Each of us has declared what we believe we Islamically own, as recorded in Schedule A.',
				].join(' '),
				true,
			),
		).toThrow(/mismatched election variants/);
	});
});

describe('renderCertificationOfTrust', () => {
	it('renders without SSN, execution date placeholder, or unmerged tags', async () => {
		const { buffer, filename } = await renderCertificationOfTrust({
			id: 11,
			responses: [...baseResponses, { id: 'ownership-allocation', response: 'heba' }],
			user: { name: 'Ahmed Khan' },
		});

		expect(buffer.byteLength).toBeGreaterThan(1000);
		expect(filename).toBe('certification-of-trust-Ahmed-Khan-11.docx');

		const xml = new PizZip(buffer).file('word/document.xml')!.asText();
		const text = extractPlainText(xml);

		expect(xml).not.toMatch(/\{[#/:^]?[a-zA-Z]/);
		expect(text).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
		expect(text).not.toContain('execution_date');
		expect(text).toContain('executed on _________________________');
		expect(text).toContain('Social Security Number: ________');
		expect(text).toContain(
			formatTrustTitleForm('Ahmed Khan', 'Fatima Khan', 'Khan Family Trust'),
		);
		expect(text).toContain('Ahmed Khan, Trustee');
		expect(text).toContain('Fatima Khan, Trustee');
	});
});

describe('shared legal text across joint trust and certification', () => {
	it('uses the same title form and 180-day phrase in joint trust and certification', async () => {
		const sampleResponses = [
			...baseResponses,
			{ id: 'marriage-date', response: '2010-06-01' },
			{ id: 'ownership-allocation', response: 'heba' },
			{ id: 'heba-assets', response: [{ assetName: 'Home', accountId: '' }] },
			{ id: 'trustee-on-first-death', response: 'survivor-serves' },
			{ id: 'madhab', response: 'hanafi' },
		];

		const trust = { id: 12, responses: sampleResponses, user: { name: 'Ahmed Khan' } };
		const [joint, certification] = await Promise.all([
			renderJointTrust(trust),
			renderCertificationOfTrust(trust),
		]);

		const titleForm = formatTrustTitleForm('Ahmed Khan', 'Fatima Khan', 'Khan Family Trust');
		const jointText = extractPlainText(
			new PizZip(joint.buffer).file('word/document.xml')!.asText(),
		);
		const certText = extractPlainText(
			new PizZip(certification.buffer).file('word/document.xml')!.asText(),
		);

		expect(jointText).toContain(titleForm);
		expect(certText).toContain(titleForm);
		expect(jointText).toContain('one hundred eighty (180) days after the death of the first Grantor');
	});
});

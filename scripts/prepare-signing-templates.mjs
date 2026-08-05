#!/usr/bin/env node
/**
 * Copies T8/T9 source templates into static/templates/ and rewrites placeholders
 * for docxtemplater compatibility with the trust document context.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_DIR = join(process.env.HOME ?? '', 'Documents/files 2');

const SOURCES = {
	acknowledgment: {
		src: join(SOURCE_DIR, 'TPL_GoodTree_Acknowledgment_of_Islamic_Ownership_Election.docx'),
		dest: join(ROOT, 'static/templates/acknowledgment_of_islamic_ownership_election.docx'),
	},
	certification: {
		src: join(SOURCE_DIR, 'TPL_GoodTree_Certification_of_Trust.docx'),
		dest: join(ROOT, 'static/templates/certification_of_trust.docx'),
	},
};

const FIRST_DEATH_DAYS_PHRASE =
	'one hundred eighty (180) days';

function patchAcknowledgmentXml(xml) {
	let out = xml;
	out = out.replaceAll('{trust_name}', '{trustName}');
	out = out.replaceAll('{husband_name}', '{husbandFullName}');
	out = out.replaceAll('{wife_name}', '{wifeFullName}');
	out = out.replaceAll('{#heba}', '{#isHeba}');
	out = out.replaceAll('{^heba}', '{^isHeba}');
	out = out.replaceAll('{/heba}', '{/isHeba}');
	out = out.replaceAll(
		`within ${FIRST_DEATH_DAYS_PHRASE} after the first death`,
		'within {firstDeathElectionDaysPhrase} after the first death',
	);
	out = out.replaceAll(
		'This instrument was acknowledged before me on {execution_date} by {husbandFullName} and {wifeFullName}, each appearing individually.',
		'This instrument was acknowledged before me on _________________________ by {husbandFullName} and {wifeFullName}, each appearing individually.',
	);
	return out;
}

function patchCertificationXml(xml) {
	let out = xml;
	out = out.replaceAll('{trust_name}', '{trustName}');
	out = out.replaceAll('{husband_name}', '{husbandFullName}');
	out = out.replaceAll('{wife_name}', '{wifeFullName}');
	out = out.replaceAll(
		'{street_address} {city}, Texas {zip}',
		'_________________________________________\n_________________________________________, Texas ___________',
	);
	out = out.replaceAll(
		'The trust instrument was executed on {execution_date}.',
		'The trust instrument was executed on _________________________.',
	);
	out = out.replaceAll(
		'“{husbandFullName} AND {wifeFullName}, TRUSTEES OF {trustName}, AND ANY AMENDMENTS THERETO.”',
		'“{trustTitleForm}”',
	);
	out = out.replaceAll(
		'This instrument was acknowledged before me on {execution_date} by {husbandFullName} and {wifeFullName}, as Trustees.',
		'This instrument was acknowledged before me on _________________________ by {husbandFullName} and {wifeFullName}, as Trustees.',
	);
	return out;
}

function patchJointTemplateXml(xml) {
	let out = xml;
	out = out.replaceAll(
		'within one hundred eighty (180) days after the death of the first Grantor',
		'within {firstDeathElectionDaysPhrase} after the death of the first Grantor',
	);
	out = out.replaceAll(
		'“{husbandFullName} AND {wifeFullName}, TRUSTEES OF THE {trustName} JOINT REVOCABLE LIVING TRUST, AND ANY AMENDMENTS THERETO.”',
		'“{trustTitleForm}”',
	);
	return out;
}

function patchDocx(src, dest, patchFn) {
	if (!existsSync(src)) {
		throw new Error(`Missing source template: ${src}`);
	}
	copyFileSync(src, dest);
	const raw = readFileSync(dest);
	const zip = new PizZip(raw);
	const path = 'word/document.xml';
	const original = zip.file(path)?.asText();
	if (!original) throw new Error(`Missing word/document.xml in ${src}`);
	zip.file(path, patchFn(original));
	writeFileSync(dest, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
	console.log(`[prepare-signing-templates] Wrote ${dest}`);
}

function main() {
	patchDocx(SOURCES.acknowledgment.src, SOURCES.acknowledgment.dest, patchAcknowledgmentXml);
	patchDocx(SOURCES.certification.src, SOURCES.certification.dest, patchCertificationXml);

	const jointPath = join(ROOT, 'static/templates/joint_template.docx');
	const jointRaw = readFileSync(jointPath);
	const jointZip = new PizZip(jointRaw);
	const jointXml = jointZip.file('word/document.xml')?.asText();
	if (!jointXml) throw new Error('joint_template.docx is missing word/document.xml');
	jointZip.file('word/document.xml', patchJointTemplateXml(jointXml));
	writeFileSync(jointPath, jointZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
	console.log(`[prepare-signing-templates] Patched ${jointPath}`);
}

main();

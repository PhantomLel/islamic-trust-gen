/**
 * Regenerate src/lib/data/regionalMasajid.ts from the masjid QR/UTM CSV export.
 *
 * Usage:
 *   node scripts/import-texas-masajid.mjs /path/to/masjid_qr_utm_mapping_1.csv
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = process.argv[2];
if (!csvPath) {
	console.error('Usage: node scripts/import-texas-masajid.mjs <csv-path>');
	process.exit(1);
}

function parseCsvLine(line) {
	const result = [];
	let cur = '';
	let inQuotes = false;
	for (const ch of line) {
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(cur);
			cur = '';
		} else {
			cur += ch;
		}
	}
	result.push(cur);
	return result;
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const masajid = [];

for (let i = 1; i < lines.length; i++) {
	const cols = parseCsvLine(lines[i]);
	if (cols.length < 5) continue;
	const [region, city, name, address, slug] = cols;
	masajid.push({
		id: slug.trim(),
		name: name.trim(),
		city: city.trim(),
		region: region.trim(),
		address: address.trim(),
		state: 'TX',
	});
}

masajid.sort((a, b) => {
	const regionCmp = a.region.localeCompare(b.region);
	if (regionCmp !== 0) return regionCmp;
	const cityCmp = a.city.localeCompare(b.city);
	if (cityCmp !== 0) return cityCmp;
	return a.name.localeCompare(b.name);
});

const outPath = path.join(__dirname, '../src/lib/data/regionalMasajid.ts');
const content = `/** Regional masajid catalog for charitable wasiyyah bequests. Expand by adding new state keys. */
export type RegionalMasjid = {
\tid: string;
\tname: string;
\tcity: string;
\tregion: string;
\taddress: string;
\tstate: string;
};

export type RegionalMasajidCatalog = Record<string, RegionalMasjid[]>;

/** Masajid organized by U.S. state code (currently Texas only). */
export const regionalMasajid: RegionalMasajidCatalog = {
\tTX: ${JSON.stringify(masajid, null, '\t').replace(/^/gm, '\t').replace(/^\t\t/, '\t')},
};
`;

fs.writeFileSync(outPath, content);
console.log(`Wrote ${masajid.length} masajid to ${outPath}`);

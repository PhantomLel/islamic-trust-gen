import { env } from '$env/dynamic/private';
import { PDFDocument } from 'pdf-lib';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import { buildWillPdfContext } from './context';
import { buildSheetsDefinition, buildWillDefinition } from './definition';

const FONT_FILES = {
	regular: 'NotoSerif-Regular.ttf',
	bold: 'NotoSerif-Bold.ttf',
} as const;

const fontCache = new Map<string, Buffer>();

type FreeWillLike = {
	id: number;
	responses: { id: string; response: unknown }[] | null;
	user?: { name?: string | null } | null;
};

/** Load a static font the same way will templates used to be fetched, then keep it in memory. */
async function loadStaticFont(filename: string): Promise<Buffer> {
	const cached = fontCache.get(filename);
	if (cached) return cached;
	const origin = (env.ORIGIN ?? '').replace(/\/$/, '');
	const response = await fetch(`${origin}/fonts/${filename}`);
	if (!response.ok) {
		throw new Error(`Failed to load font ${filename}: ${response.status} ${response.statusText}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	fontCache.set(filename, buffer);
	return buffer;
}

async function fontDictionary(): Promise<TFontDictionary> {
	const [regular, bold] = await Promise.all([
		loadStaticFont(FONT_FILES.regular),
		loadStaticFont(FONT_FILES.bold),
	]);
	return {
		NotoSerif: {
			normal: regular,
			bold,
			italics: regular,
			bolditalics: bold,
		},
	};
}

function pdfBuffer(printer: PdfPrinter, definition: TDocumentDefinitions): Promise<Buffer> {
	const doc = printer.createPdfKitDocument(definition);
	const chunks: Buffer[] = [];
	return new Promise((resolve, reject) => {
		doc.on('data', (chunk: Buffer) => chunks.push(chunk));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
		doc.end();
	});
}

let printerPromise: Promise<PdfPrinter> | null = null;

function printer(): Promise<PdfPrinter> {
	if (!printerPromise) {
		printerPromise = fontDictionary().then((fonts) => new PdfPrinter(fonts));
	}
	return printerPromise;
}

export async function renderDefinition(definition: TDocumentDefinitions): Promise<Buffer> {
	return pdfBuffer(await printer(), definition);
}

function safeFilenameFragment(value: string): string {
	const cleaned = value
		.trim()
		.replace(/[^A-Za-z0-9_-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	return cleaned || 'will';
}

/** Render the will and the two sheets, then merge them into one unlocked PDF. */
export async function render(will: FreeWillLike): Promise<{ buffer: Buffer; filename: string }> {
	const ctx = buildWillPdfContext(will);
	const pdfPrinter = await printer();
	const [willBuffer, sheetBuffer] = await Promise.all([
		pdfBuffer(pdfPrinter, buildWillDefinition(ctx)),
		pdfBuffer(pdfPrinter, buildSheetsDefinition(ctx)),
	]);

	const merged = await PDFDocument.create();
	const willDoc = await PDFDocument.load(willBuffer);
	const sheetDoc = await PDFDocument.load(sheetBuffer);
	for (const page of await merged.copyPages(willDoc, willDoc.getPageIndices())) merged.addPage(page);
	for (const page of await merged.copyPages(sheetDoc, sheetDoc.getPageIndices())) merged.addPage(page);
	merged.setCreationDate(new Date());
	merged.setTitle(`Last Will and Testament of ${ctx.testatorFullName}`);

	const filename = `islamic-will-${safeFilenameFragment(ctx.testatorFullName || will.user?.name || '')}-${will.id}.pdf`;
	return { buffer: Buffer.from(await merged.save()), filename };
}

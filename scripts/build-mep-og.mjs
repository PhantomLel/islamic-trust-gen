/**
 * MEP share image and favicons (AA W8.5).
 * MLP keeps static/og-image.png. MEP is built from static/mcdaniel.png.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = join(root, 'static/mcdaniel.png');
const mlpOgPath = join(root, 'static/og-image.png');

const { data } = await sharp(logoPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const background = { r: data[0], g: data[1], b: data[2], alpha: 1 };

const logo = await sharp(logoPath)
	.resize({ width: 760, height: 520, fit: 'inside' })
	.toBuffer();

await sharp({
	create: { width: 1200, height: 630, channels: 4, background },
})
	.composite([{ input: logo, gravity: 'centre' }])
	.png()
	.toFile(join(root, 'static/og-mep.png'));

await sharp(mlpOgPath)
	.resize(512, 512, { fit: 'cover', position: 'centre' })
	.png()
	.toFile(join(root, 'static/favicon-mlp.png'));

await sharp(logoPath)
	.resize(512, 512, { fit: 'contain', background })
	.png()
	.toFile(join(root, 'static/favicon-mep.png'));

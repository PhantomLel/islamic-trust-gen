import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { createMediaAsset, listMedia, updateMediaAlt } from '$lib/server/content/taxonomy';
import { uploadBufferToUploadThing } from '$lib/server/uploadthingUpload';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export const load: PageServerLoad = async ({ locals }) => {
	requireContentStaff(locals);
	return { media: await listMedia() };
};

export const actions: Actions = {
	upload: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'draft' });
		const f = await request.formData();
		const file = f.get('file');
		const alt = String(f.get('altText') ?? '').trim();
		if (!alt) return fail(400, { message: 'Alt text is required for every image.' });
		if (!(file instanceof File) || file.size === 0) return fail(400, { message: 'Choose an image.' });
		if (!ALLOWED.includes(file.type)) return fail(400, { message: 'Use a JPG, PNG or WebP image.' });
		if (file.size > MAX_BYTES) return fail(400, { message: 'The image must be under 5 MB.' });
		const num = (k: string) => {
			const n = Number(f.get(k));
			return Number.isInteger(n) && n > 0 && n < 20000 ? n : null;
		};
		let uploaded;
		try {
			uploaded = await uploadBufferToUploadThing(Buffer.from(await file.arrayBuffer()), file.name, file.type);
		} catch (e) {
			console.error('[content media] upload failed', e);
			return fail(502, { message: 'The upload failed. Try again.' });
		}
		const r = await createMediaAsset({ uploadthingKey: uploaded.key, url: uploaded.ufsUrl, altText: alt, width: num('width'), height: num('height') }, actor.id);
		return r.error ? fail(400, { message: r.error }) : { ok: true };
	},
	alt: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'draft' });
		const f = await request.formData();
		const r = await updateMediaAlt(Number(f.get('id')), String(f.get('altText') ?? ''), actor.id);
		return r.error ? fail(400, { message: r.error }) : { ok: true };
	},
};

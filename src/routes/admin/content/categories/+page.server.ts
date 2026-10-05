import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { can } from '$lib/content/permissions';
import { createCategory, deleteCategory, listCategories, renameCategory } from '$lib/server/content/taxonomy';
import { db } from '$lib/server/db';
import { contentPage } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const actor = requireContentStaff(locals);
	return { categories: await listCategories(), canManage: can(actor.role, 'manage_taxonomy') };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
		const f = await request.formData();
		const r = await createCategory(String(f.get('name') ?? ''), actor.id);
		return r.error ? fail(400, { message: r.error }) : { ok: true };
	},
	rename: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
		const f = await request.formData();
		const r = await renameCategory(Number(f.get('id')), String(f.get('name') ?? ''), actor.id);
		return r.error ? fail(400, { message: r.error }) : { ok: true };
	},
	delete: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
		const f = await request.formData();
		const id = Number(f.get('id'));
		const used = await db.select({ id: contentPage.id }).from(contentPage).where(eq(contentPage.categoryId, id)).limit(1);
		if (used.length) return fail(400, { message: 'This category still has pages. Move them first.' });
		await deleteCategory(id, actor.id);
		return { ok: true };
	},
};

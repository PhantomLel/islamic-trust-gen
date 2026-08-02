import type { PageServerLoad } from './$types';
import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { helpStaffMacro } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const macros = await db.select().from(helpStaffMacro).orderBy(asc(helpStaffMacro.macroId));
	return { macros };
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		if (event.locals.user.role === "admin") {
			return redirect(302, '/admin');
		}
		return redirect(302, '/create-trust');
	}
	return {};
};

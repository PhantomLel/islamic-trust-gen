import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		if (event.locals.user.role === "admin") {
			return redirect(302, '/admin');
		}
		return redirect(302, '/create-trust');
	}

	let prefilledEmail = '';
	const raw = event.url.searchParams.get('email');
	if (raw) {
		try {
			prefilledEmail = decodeURIComponent(raw).trim().slice(0, 320);
		} catch {
			prefilledEmail = '';
		}
	}

	return { prefilledEmail };
};

import { redirect } from '@sveltejs/kit';

/** AA W4.3 — the attorney profile moved from /about to /attorney. */
export const GET = () => {
	redirect(301, '/attorney');
};

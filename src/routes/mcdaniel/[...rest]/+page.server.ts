import { error } from '@sveltejs/kit';

/** Unmatched firm paths stay inside the MEP layout. Task 09 brands this page. */
export function load() {
	error(404, 'Not found');
}

import type { Reroute } from '@sveltejs/kit';
import { rerouteFor } from '$lib/hostPolicy';

/** AA-W1.3 — the firm hostname is served from the /mcdaniel route tree. */
export const reroute: Reroute = ({ url }) => rerouteFor(url);

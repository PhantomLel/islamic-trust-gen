/** Rough mobile vs desktop from User-Agent (no extra dependencies). */
export function deviceKindFromUserAgent(userAgent: string | null | undefined): 'mobile' | 'desktop' | null {
	if (!userAgent?.trim()) return null;
	// Phones / small mobile UAs; many tablets lack "Mobi" and may read as desktop — acceptable for a simple badge.
	const mobile = /Mobi|Android.*Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
	return mobile ? 'mobile' : 'desktop';
}

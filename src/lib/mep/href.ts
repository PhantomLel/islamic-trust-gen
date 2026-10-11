/** Public MEP path, or the internal `/mcdaniel` tree when previewing that host locally. */
export function mepHref(pathname: string, path: string): string {
	const internal = pathname === '/mcdaniel' || pathname.startsWith('/mcdaniel/');
	const base = internal ? '/mcdaniel' : '';
	if (path.startsWith('#')) return `${base}/${path}`;
	if (path === '/') return base || '/';
	return `${base}${path}`;
}

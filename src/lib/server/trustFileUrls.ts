import type { GeneratedFile, UserFile } from '$lib/server/db/schema';

export const TRUST_FILE_PROXY_MAX_BYTES = 40 * 1024 * 1024;

export function isHttpUrl(url: string): boolean {
	try {
		const u = new URL(url);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
}

export function collectTrustFileUrls(row: {
	house_deed_url: string | null;
	file_urls: string[] | null;
	generated_files: GeneratedFile[] | null;
	user_files: UserFile[] | null;
}): string[] {
	const urls: string[] = [];
	if (row.house_deed_url) urls.push(row.house_deed_url);
	for (const u of row.file_urls ?? []) {
		if (u) urls.push(u);
	}
	for (const g of row.generated_files ?? []) {
		if (g.url) urls.push(g.url);
	}
	for (const f of row.user_files ?? []) {
		if (f.url) urls.push(f.url);
	}
	return urls;
}

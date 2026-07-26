import { UTApi, UTFile } from 'uploadthing/server';
import { env } from '$env/dynamic/private';

let _utapi: UTApi | null = null;
function utapi(): UTApi {
	if (!_utapi) _utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
	return _utapi;
}

/** Server-side UploadThing upload via the official UTApi SDK. */
export async function uploadBufferToUploadThing(
	buffer: Buffer,
	filename: string,
	mime: string,
): Promise<{ key: string; ufsUrl: string }> {
	const file = new UTFile([new Uint8Array(buffer)], filename, { type: mime });
	const result = await utapi().uploadFiles(file);

	if (result.error) {
		throw new Error(result.error.message ?? 'Upload failed');
	}

	return { key: result.data.key, ufsUrl: result.data.ufsUrl };
}

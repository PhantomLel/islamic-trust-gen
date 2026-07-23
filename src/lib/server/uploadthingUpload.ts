import * as Micro from 'effect/Micro';
import * as Redacted from 'effect/Redacted';
import { generateKey, generateSignedURL } from '@uploadthing/shared';
import { UTFile } from 'uploadthing/server';
import { env } from '$env/dynamic/private';

type ParsedUploadThingToken = {
	apiKey: string;
	appId: string;
	regions: [string, ...string[]];
	ingestHost: string;
};

function parseUploadThingToken(token: string): ParsedUploadThingToken {
	const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as {
		apiKey: string;
		appId: string;
		regions: string[];
		ingestHost?: string;
	};

	if (!parsed.apiKey || !parsed.appId || !parsed.regions?.length) {
		throw new Error('Invalid UPLOADTHING_TOKEN');
	}

	return {
		apiKey: parsed.apiKey,
		appId: parsed.appId,
		regions: parsed.regions as [string, ...string[]],
		ingestHost: parsed.ingestHost ?? 'ingest.uploadthing.com',
	};
}

/** Server-side UploadThing upload that reads only `ufsUrl` from the ingest response. */
export async function uploadBufferToUploadThing(
	buffer: Buffer,
	filename: string,
	mime: string,
): Promise<{ key: string; ufsUrl: string }> {
	const token = parseUploadThingToken(env.UPLOADTHING_TOKEN ?? '');
	const file = new UTFile([new Uint8Array(buffer)], filename, { type: mime });
	const region = token.regions[0];
	const baseUrl = `https://${region}.${token.ingestHost}`;

	const key = await Micro.runPromise(generateKey(file, token.appId));
	const presignedUrl = await Micro.runPromise(
		generateSignedURL(`${baseUrl}/${key}`, Redacted.make(token.apiKey), {
			data: {
				'x-ut-identifier': token.appId,
				'x-ut-file-name': file.name,
				'x-ut-file-size': file.size,
				'x-ut-file-type': file.type,
				'x-ut-custom-id': file.customId,
				'x-ut-content-disposition': 'inline',
			},
		}),
	);

	const formData = new FormData();
	formData.append('file', file);
	const response = await fetch(presignedUrl, {
		method: 'PUT',
		headers: {
			Range: 'bytes=0-',
			'x-uploadthing-version': '7.7.4',
		},
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
	}

	const json = (await response.json()) as { key?: string; ufsUrl?: string };
	if (!json.ufsUrl || !json.key) {
		throw new Error('Upload succeeded but response was missing key or ufsUrl');
	}

	return { key: json.key, ufsUrl: json.ufsUrl };
}

import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
	houseDeedUploader: f({
		pdf: { maxFileCount: 1, maxFileSize: '16MB' },
		image: { maxFileCount: 1, maxFileSize: '16MB' },
	}).onUploadComplete(async ({ file }) => { // TODO add auth
		return { url: file.ufsUrl, };
	}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

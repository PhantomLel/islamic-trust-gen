import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
	houseDeedUploader: f({
		pdf: { maxFileCount: 1, maxFileSize: '16MB' },
		image: { maxFileCount: 1, maxFileSize: '16MB' },
	}).onUploadComplete(async ({ file }) => { // TODO add auth
		return { ufsUrl: file.ufsUrl };
	}),
	userDocumentUploader: f({
		pdf: { maxFileCount: 1, maxFileSize: '32MB' },
		image: { maxFileCount: 1, maxFileSize: '16MB' },
		blob: { maxFileCount: 1, maxFileSize: '32MB' },
	}).onUploadComplete(async ({ file }) => {
		return { ufsUrl: file.ufsUrl, key: file.key };
	}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

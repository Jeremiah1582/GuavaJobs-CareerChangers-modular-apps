import { z } from 'zod';

export const cvParseStatusSchema = z.enum(['PENDING', 'READY', 'FAILED']);

export const cvMetaSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int(),
  parseStatus: cvParseStatusSchema,
  uploadedAt: z.string().datetime(),
});

export const cvUploadResponseSchema = z.object({
  cv: cvMetaSchema,
  profileId: z.string(),
  currentCvId: z.string(),
});

export const cvDownloadResponseSchema = z.object({
  signedUrl: z.string().url(),
  expiresInSeconds: z.number().int(),
  fileName: z.string(),
});

export type CvMeta = z.infer<typeof cvMetaSchema>;
export type CvUploadResponse = z.infer<typeof cvUploadResponseSchema>;
export type CvDownloadResponse = z.infer<typeof cvDownloadResponseSchema>;

import { z } from 'zod';
export declare const cvParseStatusSchema: z.ZodEnum<["PENDING", "READY", "FAILED"]>;
export declare const cvMetaSchema: z.ZodObject<{
    id: z.ZodString;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    fileSizeBytes: z.ZodNumber;
    parseStatus: z.ZodEnum<["PENDING", "READY", "FAILED"]>;
    uploadedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    parseStatus: "PENDING" | "READY" | "FAILED";
    uploadedAt: string;
}, {
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    parseStatus: "PENDING" | "READY" | "FAILED";
    uploadedAt: string;
}>;
export declare const cvUploadResponseSchema: z.ZodObject<{
    cv: z.ZodObject<{
        id: z.ZodString;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        fileSizeBytes: z.ZodNumber;
        parseStatus: z.ZodEnum<["PENDING", "READY", "FAILED"]>;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        parseStatus: "PENDING" | "READY" | "FAILED";
        uploadedAt: string;
    }, {
        id: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        parseStatus: "PENDING" | "READY" | "FAILED";
        uploadedAt: string;
    }>;
    profileId: z.ZodString;
    currentCvId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    profileId: string;
    currentCvId: string;
    cv: {
        id: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        parseStatus: "PENDING" | "READY" | "FAILED";
        uploadedAt: string;
    };
}, {
    profileId: string;
    currentCvId: string;
    cv: {
        id: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        parseStatus: "PENDING" | "READY" | "FAILED";
        uploadedAt: string;
    };
}>;
export declare const cvDownloadResponseSchema: z.ZodObject<{
    signedUrl: z.ZodString;
    expiresInSeconds: z.ZodNumber;
    fileName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    signedUrl: string;
    expiresInSeconds: number;
}, {
    fileName: string;
    signedUrl: string;
    expiresInSeconds: number;
}>;
export type CvMeta = z.infer<typeof cvMetaSchema>;
export type CvUploadResponse = z.infer<typeof cvUploadResponseSchema>;
export type CvDownloadResponse = z.infer<typeof cvDownloadResponseSchema>;

import { z } from 'zod';
export declare const profileSummarySchema: z.ZodObject<{
    id: z.ZodString;
    profileTitle: z.ZodString;
    jobTitle: z.ZodString;
    isDefault: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    profileTitle: string;
    jobTitle: string;
    isDefault: boolean;
}, {
    id: string;
    profileTitle: string;
    jobTitle: string;
    isDefault: boolean;
}>;
export declare const usageSummarySchema: z.ZodObject<{
    tier: z.ZodEnum<["FREE", "PAID"]>;
    aiGenerationsUsedPeriod: z.ZodNumber;
    aiGenerationsLimit: z.ZodNullable<z.ZodNumber>;
    usagePeriodStart: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tier: "FREE" | "PAID";
    aiGenerationsUsedPeriod: number;
    usagePeriodStart: string | null;
    aiGenerationsLimit: number | null;
}, {
    tier: "FREE" | "PAID";
    aiGenerationsUsedPeriod: number;
    usagePeriodStart: string | null;
    aiGenerationsLimit: number | null;
}>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    imgUrl: z.ZodNullable<z.ZodString>;
    linkedinUrl: z.ZodNullable<z.ZodString>;
    githubUrl: z.ZodNullable<z.ZodString>;
    tier: z.ZodEnum<["FREE", "PAID"]>;
    defaultProfileId: z.ZodNullable<z.ZodString>;
    defaultProfile: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        profileTitle: z.ZodString;
        jobTitle: z.ZodString;
        isDefault: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        profileTitle: string;
        jobTitle: string;
        isDefault: boolean;
    }, {
        id: string;
        profileTitle: string;
        jobTitle: string;
        isDefault: boolean;
    }>>;
    usage: z.ZodObject<{
        tier: z.ZodEnum<["FREE", "PAID"]>;
        aiGenerationsUsedPeriod: z.ZodNumber;
        aiGenerationsLimit: z.ZodNullable<z.ZodNumber>;
        usagePeriodStart: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tier: "FREE" | "PAID";
        aiGenerationsUsedPeriod: number;
        usagePeriodStart: string | null;
        aiGenerationsLimit: number | null;
    }, {
        tier: "FREE" | "PAID";
        aiGenerationsUsedPeriod: number;
        usagePeriodStart: string | null;
        aiGenerationsLimit: number | null;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    email: string;
    imgUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    tier: "FREE" | "PAID";
    defaultProfileId: string | null;
    defaultProfile: {
        id: string;
        profileTitle: string;
        jobTitle: string;
        isDefault: boolean;
    } | null;
    usage: {
        tier: "FREE" | "PAID";
        aiGenerationsUsedPeriod: number;
        usagePeriodStart: string | null;
        aiGenerationsLimit: number | null;
    };
}, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    email: string;
    imgUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    tier: "FREE" | "PAID";
    defaultProfileId: string | null;
    defaultProfile: {
        id: string;
        profileTitle: string;
        jobTitle: string;
        isDefault: boolean;
    } | null;
    usage: {
        tier: "FREE" | "PAID";
        aiGenerationsUsedPeriod: number;
        usagePeriodStart: string | null;
        aiGenerationsLimit: number | null;
    };
}>;
export declare const patchMeSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    imgUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    linkedinUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    githubUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    imgUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
}, {
    name?: string | undefined;
    imgUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
}>, {
    name?: string | undefined;
    imgUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
}, {
    name?: string | undefined;
    imgUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
}>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type PatchMeInput = z.infer<typeof patchMeSchema>;

import { z } from 'zod';
export declare const profileAtsAssessmentSchema: z.ZodObject<{
    profileId: z.ZodString;
    industry: z.ZodEnum<["SOFTWARE", "SALES", "DATA_ANALYSIS", "FINANCE", "HR", "MARKETING", "OPERATIONS", "PRODUCT", "DESIGN", "OTHER"]>;
    score: z.ZodNumber;
    missingKeywords: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    breakdown: z.ZodRecord<z.ZodString, z.ZodNumber>;
    inputFingerprint: z.ZodNullable<z.ZodString>;
    assessedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    breakdown: Record<string, number>;
    industry: "SOFTWARE" | "SALES" | "DATA_ANALYSIS" | "FINANCE" | "HR" | "MARKETING" | "OPERATIONS" | "PRODUCT" | "DESIGN" | "OTHER";
    profileId: string;
    inputFingerprint: string | null;
    assessedAt: string;
}, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    breakdown: Record<string, number>;
    industry: "SOFTWARE" | "SALES" | "DATA_ANALYSIS" | "FINANCE" | "HR" | "MARKETING" | "OPERATIONS" | "PRODUCT" | "DESIGN" | "OTHER";
    profileId: string;
    inputFingerprint: string | null;
    assessedAt: string;
}>;
export declare const profileAtsLlmOutputSchema: z.ZodObject<{
    score: z.ZodNumber;
    missingKeywords: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    breakdown: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    breakdown: Record<string, number>;
}, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    breakdown?: Record<string, number> | undefined;
}>;
export type ProfileAtsAssessmentResponse = z.infer<typeof profileAtsAssessmentSchema>;
export type ProfileAtsLlmOutput = z.infer<typeof profileAtsLlmOutputSchema>;

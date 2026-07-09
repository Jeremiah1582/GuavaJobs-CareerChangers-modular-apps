import { z } from 'zod';
import { LlmClient } from './llm.client';
export declare const applicationAtsLlmOutputSchema: z.ZodObject<{
    score: z.ZodNumber;
    letterScore: z.ZodOptional<z.ZodNumber>;
    cvScore: z.ZodOptional<z.ZodNumber>;
    missingKeywords: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    strengths: z.ZodArray<z.ZodString, "many">;
    gaps: z.ZodArray<z.ZodString, "many">;
    actionableSteps: z.ZodArray<z.ZodString, "many">;
    keywordCoverage: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>>;
    icpMatch: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    breakdown: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    strengths: string[];
    gaps: string[];
    actionableSteps: string[];
    keywordCoverage: Record<string, number>;
    icpMatch: Record<string, unknown>;
    breakdown: Record<string, number>;
    letterScore?: number | undefined;
    cvScore?: number | undefined;
}, {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    strengths: string[];
    gaps: string[];
    actionableSteps: string[];
    letterScore?: number | undefined;
    cvScore?: number | undefined;
    keywordCoverage?: Record<string, number> | undefined;
    icpMatch?: Record<string, unknown> | undefined;
    breakdown?: Record<string, number> | undefined;
}>;
export type ApplicationAtsLlmOutput = z.infer<typeof applicationAtsLlmOutputSchema>;
export declare class AtsReportGenerator {
    private readonly llm;
    constructor(llm: LlmClient);
    generate(params: {
        jobTitle: string;
        companyName: string;
        jobDescription: string;
        coverLetter: string;
        cvText: string;
    }): Promise<ApplicationAtsLlmOutput>;
}

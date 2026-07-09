import { z } from 'zod';
import { LlmClient } from './llm.client';
export declare const coverLetterLlmOutputSchema: z.ZodObject<{
    coverLetter: z.ZodString;
}, "strip", z.ZodTypeAny, {
    coverLetter: string;
}, {
    coverLetter: string;
}>;
export type CoverLetterLlmOutput = z.infer<typeof coverLetterLlmOutputSchema>;
export declare class CoverLetterGenerator {
    private readonly llm;
    constructor(llm: LlmClient);
    generate(params: {
        jobTitle: string;
        companyName: string;
        jobDescription: string;
        profileSummary: Record<string, unknown>;
        cvText: string;
    }): Promise<CoverLetterLlmOutput>;
}

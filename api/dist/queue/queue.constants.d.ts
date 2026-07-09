export declare const CV_PARSE_QUEUE = "cv-parse";
export declare const AI_GENERATION_QUEUE = "ai-generation";
export type CvParseJobData = {
    cvDocumentId: string;
    profileId: string;
    userId: string;
};
export type AiGenerationJobType = 'generate' | 'regenerate' | 'hybrid-cover-letter' | 'hybrid-ats-report';
export type AiGenerationJobData = {
    type: AiGenerationJobType;
    applicationId: string;
    userId: string;
};

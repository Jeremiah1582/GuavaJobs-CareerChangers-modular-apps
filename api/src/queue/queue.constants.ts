export const CV_PARSE_QUEUE = 'cv-parse';
export const AI_GENERATION_QUEUE = 'ai-generation';
export const CURATED_ATS_SYNC_QUEUE = 'curated-ats-sync';

/** Repeat every 6 hours. */
export const CURATED_ATS_SYNC_EVERY_MS = 6 * 60 * 60 * 1000;

export type CvParseJobData = {
  cvDocumentId: string;
  profileId: string;
  userId: string;
};

export type AiGenerationJobType =
  | 'generate'
  | 'regenerate'
  | 'hybrid-cover-letter'
  | 'hybrid-ats-report'
  | 'hybrid-generate-cv';

export type AiGenerationJobData = {
  type: AiGenerationJobType;
  applicationId: string;
  userId: string;
};

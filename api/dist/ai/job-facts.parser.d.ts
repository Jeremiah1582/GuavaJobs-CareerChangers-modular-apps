import { UnifiedJob } from '../shared/schemas/job.schema';
export type ParsedJobFacts = {
    companyName: string | null;
    jobRoleTitle: string | null;
    jobLocation: string | null;
    jobWebsite: string | null;
    industry: string | null;
    sourceOfListing: string;
    languageRequired: string[];
    jobSalaryMin: number | null;
    jobSalaryMax: number | null;
    jobSalaryCurrency: string | null;
    jobSalaryPeriod: 'ANNUAL' | 'MONTHLY' | 'HOURLY' | null;
    jobSalaryRaw: string | null;
};
export declare class JobFactsParser {
    parseFromJob(job: UnifiedJob): ParsedJobFacts;
    parseFromFreeText(description: string, overrides?: Partial<ParsedJobFacts>): ParsedJobFacts;
}

export type AtsType = 'greenhouse' | 'lever' | 'ashby' | 'adzuna' | 'unknown';
export type ResolvedAts = {
    atsType: AtsType;
    board: string;
    jobId: string;
};
export type AdzunaListing = {
    id: string;
    title: string;
    company: string;
    location: string | null;
    description: string;
    redirectUrl: string;
    created?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
};

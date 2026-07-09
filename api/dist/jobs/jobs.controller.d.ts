import { JobSearchQuery } from '../shared/schemas/job.schema';
import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    search(query: JobSearchQuery): Promise<{
        results: {
            canonicalKey: string;
            title: string;
            company: string;
            location: string | null;
            snippet: string;
            applyUrl: string;
            atsType: "unknown" | "greenhouse" | "lever" | "ashby" | "adzuna";
            hasFullDescription: boolean;
            applyType: "unknown" | "url";
            salaryMin?: number | null | undefined;
            salaryMax?: number | null | undefined;
            salaryCurrency?: string | null | undefined;
            postedAt?: string | null | undefined;
        }[];
        page: number;
        totalResults: number;
        attribution: "Jobs by Adzuna";
    }>;
    getByKey(canonicalKey: string, expand?: string): Promise<{
        canonicalKey: string;
        title: string;
        company: string;
        location: string | null;
        snippet: string;
        applyUrl: string;
        atsType: "unknown" | "greenhouse" | "lever" | "ashby" | "adzuna";
        hasFullDescription: boolean;
        applyType: "unknown" | "url";
        description: string;
        source: "adzuna";
        fetchedAt: string;
        salaryMin?: number | null | undefined;
        salaryMax?: number | null | undefined;
        salaryCurrency?: string | null | undefined;
        postedAt?: string | null | undefined;
        adzunaId?: string | undefined;
        adzunaCountry?: string | undefined;
    }>;
}

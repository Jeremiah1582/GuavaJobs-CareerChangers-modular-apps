import { AshbyAdapter } from '../ats/adapters/ashby.adapter';
import { GreenhouseAdapter } from '../ats/adapters/greenhouse.adapter';
import { LeverAdapter } from '../ats/adapters/lever.adapter';
export declare class AtsEnrichmentService {
    private readonly greenhouse;
    private readonly lever;
    private readonly ashby;
    constructor(greenhouse: GreenhouseAdapter, lever: LeverAdapter, ashby: AshbyAdapter);
    fetchByCanonicalKey(canonicalKey: string): Promise<{
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
    } | null>;
}

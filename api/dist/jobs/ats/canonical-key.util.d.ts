import { AtsType } from './types/unified-job.types';
export declare function buildCanonicalKey(atsType: AtsType, board: string, jobId: string): string;
export declare function buildAdzunaKey(country: string, adzunaId: string): string;
export declare function parseCanonicalKey(key: string): {
    atsType: string;
    board: string;
    jobId: string;
} | null;

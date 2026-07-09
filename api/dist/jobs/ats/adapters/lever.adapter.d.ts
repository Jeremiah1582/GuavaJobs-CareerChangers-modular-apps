import { UnifiedJob } from '../../../shared/schemas/job.schema';
export declare class LeverAdapter {
    fetchJob(site: string, postingId: string): Promise<UnifiedJob | null>;
}
